import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Info,
  Lock,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBooking, calculateNights } from '../context/BookingContext';
import {
  ApiError,
  createBooking,
  getRooms,
  initializePayment,
  verifyPayment,
  type SandboxVerifyOutcome,
} from '../services/transactionalApi';
import { fetchCheckoutHealth } from '../services/analyticsApi';
import { trackEvent } from '../services/eventTracker';
import type { CheckoutHealthResponse, Room } from '../types/api';
import {
  BackLink,
  Breadcrumbs,
  StatusBadge,
  formatTransactionalMoney,
} from '../components/ui/Primitives';

type FlowStep = 'details' | 'hold_review' | 'payment' | 'confirmation';
type PaymentUiState =
  | 'idle'
  | 'initializing'
  | 'awaiting_gateway'
  | 'verifying'
  | 'succeeded'
  | 'pending'
  | 'failed'
  | 'verification_error'
  | 'hold_expired'
  | 'manual_resolution_409';

export const BookingFlowPage: React.FC = () => {
  const [urlParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isGuestAuthenticated, guestToken, guestUser, clearGuestSession } = useAuth();
  const {
    searchParams,
    selectedRoom,
    setSelectedRoom,
    dataMode,
    activeBookingId,
    setActiveBookingId,
    activeHoldExpiresAt,
    setActiveHoldExpiresAt,
    activePaymentRef,
    setActivePaymentRef,
    resetActiveCheckout,
  } = useBooking();

  const roomIdParam = urlParams.get('room_id') || (selectedRoom ? String(selectedRoom.id) : '');
  const checkIn = urlParams.get('check_in') || searchParams.check_in;
  const checkOut = urlParams.get('check_out') || searchParams.check_out;
  const guestCount = Number(urlParams.get('guest_count') || searchParams.guest_count || 2);
  const nights = calculateNights(checkIn, checkOut);

  const [room, setRoom] = useState<Room | null>(selectedRoom);
  const [step, setStep] = useState<FlowStep>('details');
  const [serverTotal, setServerTotal] = useState<number | string | null>(null);
  const [specialNote, setSpecialNote] = useState('');
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);

  const [paymentState, setPaymentState] = useState<PaymentUiState>('idle');
  const [paymentAuthUrl, setPaymentAuthUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [holdSecondsLeft, setHoldSecondsLeft] = useState<number | null>(null);
  const [checkoutHealth, setCheckoutHealth] = useState<CheckoutHealthResponse | null>(null);
  const [sandboxOutcome, setSandboxOutcome] = useState<SandboxVerifyOutcome>('success');
  const [submittingHold, setSubmittingHold] = useState(false);

  // Load room if navigated directly with ?room_id=
  useEffect(() => {
    if (!room && roomIdParam) {
      getRooms(dataMode).then((list) => {
        const match = list.find((r) => String(r.id) === String(roomIdParam));
        if (match) {
          setRoom(match);
          setSelectedRoom(match);
        }
      });
    }
  }, [room, roomIdParam, dataMode, setSelectedRoom]);

  // Track booking_started once room is loaded
  useEffect(() => {
    if (room) {
      trackEvent('booking_started', dataMode, {
        room_id: room.id,
        room_type: room.room_type,
        nights,
        guest_count: guestCount,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.id]);

  // Fetch directional DS checkout health guidance (helpful payment channel friction note)
  useEffect(() => {
    fetchCheckoutHealth().then((res) => setCheckoutHealth(res.data));
  }, []);

  // Countdown timer for 15-minute soft hold
  useEffect(() => {
    if (!activeHoldExpiresAt) {
      setHoldSecondsLeft(null);
      return;
    }
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(activeHoldExpiresAt).getTime() - Date.now()) / 1000));
      setHoldSecondsLeft(diff);
      if (diff === 0 && paymentState !== 'succeeded' && paymentState !== 'manual_resolution_409') {
        setPaymentState('hold_expired');
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [activeHoldExpiresAt, paymentState]);

  const formatCountdown = (sec: number | null) => {
    if (sec === null) return '15:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const backToRoomsQuery = `?check_in=${encodeURIComponent(checkIn)}&check_out=${encodeURIComponent(
    checkOut
  )}&guest_count=${guestCount}`;

  const handleLockHold = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!room) return;
    if (!isGuestAuthenticated || !guestToken) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    if (!acceptedPolicies) {
      setErrorMsg('Please acknowledge the 15-minute hold and booking terms before continuing.');
      return;
    }

    setSubmittingHold(true);
    trackEvent('guest_details_completed', dataMode, {
      room_id: room.id,
      has_arrival_note: Boolean(specialNote.trim()),
    });

    try {
      const resp = await createBooking(
        dataMode,
        guestToken,
        {
          room_id: room.id,
          check_in: checkIn,
          check_out: checkOut,
          guest_count: guestCount,
        },
        guestUser?.id
      );

      setActiveBookingId(resp.booking.id);
      setActiveHoldExpiresAt(resp.booking.hold_expires_at);
      setServerTotal(resp.booking.total_amount);
      setStep('hold_review');
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        clearGuestSession('Your session expired. Please sign in again to reserve your room.');
        navigate('/login', { state: { from: location.pathname + location.search } });
        return;
      }
      setErrorMsg(err instanceof Error ? err.message : 'Unable to lock room hold.');
    } finally {
      setSubmittingHold(false);
    }
  };

  const handleStartPayment = async () => {
    if (!activeBookingId || !guestToken) return;
    setErrorMsg(null);
    setPaymentState('initializing');
    trackEvent('payment_started', dataMode, { booking_id: activeBookingId });

    try {
      const init = await initializePayment(dataMode, guestToken, activeBookingId);
      setActivePaymentRef(init.reference);
      setPaymentAuthUrl(init.authorization_url);
      setPaymentState('awaiting_gateway');
      setStep('payment');
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        clearGuestSession('Your session expired during payment initialization. Please sign in again.');
        navigate('/login', { state: { from: location.pathname + location.search } });
        return;
      }
      setPaymentState('failed');
      setErrorMsg(err instanceof Error ? err.message : 'Unable to initialize Paystack payment.');
    }
  };

  const handleVerifyPayment = async () => {
    if (!activePaymentRef || !guestToken) return;
    setErrorMsg(null);
    setPaymentState('verifying');

    try {
      const verified = await verifyPayment(
        dataMode,
        guestToken,
        activePaymentRef,
        sandboxOutcome
      );
      setPaymentState('succeeded');
      setStep('confirmation');
      trackEvent('payment_succeeded', dataMode, { booking_id: verified.booking_id });
      trackEvent('booking_confirmed', dataMode, { booking_id: verified.booking_id });
      trackEvent('confirmation_viewed', dataMode, { booking_id: verified.booking_id });
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        clearGuestSession('Your session expired. Please sign in to verify your payment reference.');
        navigate('/login', { state: { from: location.pathname + location.search } });
        return;
      }
      if (err instanceof ApiError && err.status === 409) {
        setPaymentState('manual_resolution_409');
        setErrorMsg(err.message);
        trackEvent('payment_failed', dataMode, { reason: 'hold_expired_409' });
        return;
      }
      if (err instanceof ApiError && err.status >= 500) {
        setPaymentState('verification_error');
        setErrorMsg(err.message);
        return;
      }
      const message = err instanceof Error ? err.message : 'Payment verification failed.';
      if (message.toLowerCase().includes('pending')) {
        setPaymentState('pending');
      } else {
        setPaymentState('failed');
        trackEvent('payment_failed', dataMode, { reason: 'verification_failed' });
      }
      setErrorMsg(message);
    }
  };

  if (!room) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="font-display text-3xl font-semibold text-charcoal">
          Select a Room to Start Booking
        </h1>
        <p className="mt-2 text-sm text-charcoal/80">
          Choose your dates and preferred room from our availability catalog to begin.
        </p>
        <Link
          to={`/rooms${backToRoomsQuery}`}
          className="mt-6 inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg bg-forest text-ivory text-sm font-medium"
        >
          Browse Rooms
        </Link>
      </div>
    );
  }

  const stepsOrder: Array<{ id: FlowStep; label: string }> = [
    { id: 'details', label: '1. Guest & Stay Details' },
    { id: 'hold_review', label: '2. Hold & Price Summary' },
    { id: 'payment', label: '3. Paystack Checkout' },
    { id: 'confirmation', label: '4. Confirmation' },
  ];

  const highFrictionMethod = checkoutHealth?.methods.find((m) => m.high_friction_flag);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Rooms', to: `/rooms${backToRoomsQuery}` },
          { label: room.room_type, to: `/rooms/${room.id}${backToRoomsQuery}` },
          { label: 'Reservation Checkout' },
        ]}
      />

      {step !== 'confirmation' && (
        <BackLink
          to={`/rooms/${room.id}${backToRoomsQuery}`}
          label="Back to room details (preserves dates & guests)"
        />
      )}

      {/* Progress Stepper */}
      <ol
        aria-label="Booking progress"
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8"
      >
        {stepsOrder.map((item) => {
          const activeIdx = stepsOrder.findIndex((s) => s.id === step);
          const itemIdx = stepsOrder.findIndex((s) => s.id === item.id);
          const isCurrent = item.id === step;
          const isCompleted = itemIdx < activeIdx;
          return (
            <li
              key={item.id}
              className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                isCurrent
                  ? 'border-forest bg-forest text-ivory'
                  : isCompleted
                  ? 'border-success/40 bg-[#E9F4EE] text-[#1D5E3F]'
                  : 'border-sand bg-white text-charcoal/65'
              }`}
            >
              {item.label}
            </li>
          );
        })}
      </ol>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Flow Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: GUEST DETAILS */}
          {step === 'details' && (
            <form
              onSubmit={handleLockHold}
              className="rounded-2xl border border-sand bg-white p-6 space-y-5"
            >
              <h1 className="font-display text-2xl font-semibold text-charcoal">
                Guest Details &amp; Hold Lock
              </h1>

              {!isGuestAuthenticated ? (
                <div className="rounded-xl border border-gold/50 bg-sand/40 p-4 space-y-3">
                  <p className="text-sm font-semibold text-charcoal">
                    Email-Verified Guest Account Required
                  </p>
                  <p className="text-xs text-charcoal/85 leading-relaxed">
                    To protect room holds and tie reservations securely to your account, please sign in or register with email OTP verification. Your room and date selection will be preserved.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to="/login"
                      state={{ from: location.pathname + location.search }}
                      className="min-h-[44px] px-4 py-2 rounded-lg bg-forest text-ivory text-sm font-medium inline-flex items-center"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      state={{ from: location.pathname + location.search }}
                      className="min-h-[44px] px-4 py-2 rounded-lg border border-forest text-forest text-sm font-medium inline-flex items-center"
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-charcoal/70 mb-1">
                        Verified Guest Name
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={guestUser?.full_name || ''}
                        className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-sand bg-ivory/70 text-sm text-charcoal"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-charcoal/70 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        readOnly
                        value={guestUser?.email || ''}
                        className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-sand bg-ivory/70 text-sm text-charcoal"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold uppercase text-charcoal/70 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={guestUser?.phone_number || ''}
                        className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-sand bg-ivory/70 text-sm text-charcoal"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="special-request-note"
                      className="block text-xs font-semibold uppercase text-charcoal/70 mb-1.5"
                    >
                      Optional Arrival Note (Local Preference Preview — not persisted to backend booking table yet)
                    </label>
                    <textarea
                      id="special-request-note"
                      rows={3}
                      value={specialNote}
                      onChange={(e) => setSpecialNote(e.target.value)}
                      placeholder="e.g., Estimated arrival window or accessibility request"
                      className="w-full px-3 py-2.5 rounded-lg border border-sand bg-ivory/40 text-sm focus:border-forest focus:outline-none"
                    />
                  </div>

                  <label className="flex items-start gap-2.5 text-xs text-charcoal/85 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedPolicies}
                      onChange={(e) => setAcceptedPolicies(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-forest"
                    />
                    <span>
                      I acknowledge that creating this booking places a <strong>15-minute soft hold</strong> and that final confirmation occurs only after backend Paystack payment verification under the{' '}
                      <Link to="/terms" className="text-forest underline font-medium">
                        Terms &amp; Conditions
                      </Link>
                      .
                    </span>
                  </label>

                  {errorMsg && (
                    <p role="alert" className="text-sm font-medium text-error">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submittingHold}
                    className="w-full min-h-[48px] px-5 py-3 rounded-lg bg-forest text-ivory text-sm font-semibold hover:bg-evergreen disabled:opacity-50"
                  >
                    {submittingHold
                      ? 'Creating Server Hold...'
                      : 'Lock 15-Minute Room Hold & Review Total'}
                  </button>
                </>
              )}
            </form>
          )}

          {/* STEP 2: SERVER HOLD & PRICE SUMMARY */}
          {step === 'hold_review' && (
            <div className="rounded-2xl border border-sand bg-white p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="font-display text-2xl font-semibold text-charcoal">
                  Authoritative Summary &amp; Hold
                </h1>
                <StatusBadge
                  label={`Hold Active: ${formatCountdown(holdSecondsLeft)}`}
                  tone={holdSecondsLeft !== null && holdSecondsLeft < 180 ? 'warning' : 'info'}
                />
              </div>

              <div className="rounded-xl border border-sand bg-ivory/60 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-charcoal/75">Booking ID (Pending)</span>
                  <span className="font-semibold tabular-nums">#{activeBookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/75">Server-Calculated Stay Total</span>
                  <span className="font-semibold text-forest tabular-nums">
                    {serverTotal !== null ? formatTransactionalMoney(serverTotal) : 'Calculating...'}
                  </span>
                </div>
                <p className="text-xs text-charcoal/65 pt-1">
                  Calculated directly by the transactional backend (nightly rate &times; {nights} {nights === 1 ? 'night' : 'nights'}). Taxes/VAT breakdown remains pending Finance approval.
                </p>
              </div>

              {highFrictionMethod && (
                <div className="rounded-xl border border-gold/50 bg-sand/40 p-4 text-xs text-charcoal/85 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-charcoal">
                      Payment Timing Guidance (Historical Checkout Health)
                    </p>
                    <p className="mt-1 leading-relaxed">
                      Card checkout settles fastest on average (~5.8 min).{' '}
                      <strong>{highFrictionMethod.payment_method}</strong> historically averages{' '}
                      <strong>{highFrictionMethod.avg_payment_duration_min.toFixed(2)} min</strong>—please keep your phone/bank app ready so verification completes within your 15-minute hold.
                    </p>
                  </div>
                </div>
              )}

              {errorMsg && (
                <p role="alert" className="text-sm font-medium text-error">
                  {errorMsg}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="min-h-[44px] px-4 py-2.5 rounded-lg border border-sand text-sm font-medium text-charcoal hover:bg-sand/40"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={paymentState === 'initializing' || holdSecondsLeft === 0}
                  onClick={handleStartPayment}
                  className="flex-1 min-h-[48px] px-5 py-3 rounded-lg bg-forest text-ivory text-sm font-semibold hover:bg-evergreen inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {paymentState === 'initializing'
                      ? 'Initializing Paystack...'
                      : 'Proceed to Paystack Checkout'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYSTACK CHECKOUT & BACKEND VERIFICATION */}
          {step === 'payment' && (
            <div className="rounded-2xl border border-sand bg-white p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="font-display text-2xl font-semibold text-charcoal">
                  Payment &amp; Backend Verification
                </h1>
                <StatusBadge
                  label={
                    paymentState === 'hold_expired'
                      ? 'Hold Expired'
                      : `Hold: ${formatCountdown(holdSecondsLeft)}`
                  }
                  tone={paymentState === 'hold_expired' ? 'error' : 'warning'}
                />
              </div>

              <div className="rounded-xl border border-sand bg-ivory/60 p-4 text-sm space-y-2">
                <div className="flex justify-between gap-3">
                  <span className="text-charcoal/75">Paystack Reference</span>
                  <code className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-sand">
                    {activePaymentRef}
                  </code>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-charcoal/75">Authoritative Amount</span>
                  <span className="font-semibold text-forest tabular-nums">
                    {serverTotal !== null ? formatTransactionalMoney(serverTotal) : '—'}
                  </span>
                </div>
              </div>

              {/* Live Paystack Link vs Sandbox Simulator */}
              {dataMode === 'live' && paymentAuthUrl ? (
                <div className="rounded-xl border border-forest/25 bg-[#E9F4EE]/50 p-4 space-y-3 text-sm">
                  <p className="font-semibold text-forest">
                    Step A: Complete Payment on Paystack Test Checkout
                  </p>
                  <p className="text-xs text-charcoal/80">
                    Because redirect callbacks alone never confirm a booking, return here after completing Paystack checkout and click &ldquo;Verify Payment With Server&rdquo;.
                  </p>
                  <a
                    href={paymentAuthUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-forest text-ivory text-sm font-medium hover:bg-evergreen"
                  >
                    <CreditCard className="w-4 h-4" aria-hidden="true" />
                    <span>Open Paystack Checkout</span>
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </a>
                </div>
              ) : (
                <div className="rounded-xl border border-gold/60 bg-sand/35 p-4 space-y-3">
                  <p className="text-sm font-semibold text-charcoal">
                    Paystack Test-Mode Verification Simulator (Sandbox Mode)
                  </p>
                  <p className="text-xs text-charcoal/80 leading-relaxed">
                    Choose a gateway scenario to exercise the full backend verification state machine (<code className="font-mono">POST /api/payments/verify</code>):
                  </p>
                  <label htmlFor="sandbox-paystack-outcome" className="sr-only">
                    Select Paystack verification scenario
                  </label>
                  <select
                    id="sandbox-paystack-outcome"
                    value={sandboxOutcome}
                    onChange={(e) => setSandboxOutcome(e.target.value as SandboxVerifyOutcome)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-sand bg-white text-sm"
                  >
                    <option value="success">Succeeded &amp; Verified -&gt; Booking Confirmed (200)</option>
                    <option value="pending">Pending Settlement (400 — Do Not Double-Pay)</option>
                    <option value="failed">Declined / Abandoned Payment (400)</option>
                    <option value="verification_error">Gateway Verification Error (500)</option>
                    <option value="hold_expired_409">Hold Expired After Capture (409 Manual Resolution)</option>
                  </select>
                </div>
              )}

              {/* Explicit Error / Pending / 409 Manual Resolution States */}
              {paymentState === 'manual_resolution_409' && (
                <div
                  role="alert"
                  className="rounded-xl border border-error bg-[#FAEDED] p-4 space-y-2 text-sm text-[#943535]"
                >
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="font-semibold">
                        Manual Resolution Required (HTTP 409)
                      </p>
                      <p className="text-xs mt-1 leading-relaxed">
                        {errorMsg} Do NOT re-submit payment. Share booking ID <strong>#{activeBookingId}</strong> and payment reference <strong>{activePaymentRef}</strong> with our support team immediately.
                      </p>
                      <Link
                        to="/contact"
                        state={{ prefillReference: activePaymentRef }}
                        className="mt-3 inline-flex items-center px-3 py-2 rounded-lg bg-[#943535] text-white text-xs font-medium"
                      >
                        Contact Support With Reference
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {(paymentState === 'failed' ||
                paymentState === 'pending' ||
                paymentState === 'verification_error' ||
                paymentState === 'hold_expired') && (
                <div
                  role="alert"
                  className="rounded-xl border border-warning bg-[#FAF2E1] p-4 text-xs text-[#8A5A12] space-y-1.5"
                >
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {paymentState === 'pending'
                        ? 'Payment Settlement Pending'
                        : paymentState === 'verification_error'
                        ? 'Temporary Verification Error'
                        : paymentState === 'hold_expired'
                        ? '15-Minute Room Hold Expired'
                        : 'Payment Not Verified'}
                    </span>
                  </p>
                  <p>{errorMsg || 'Please retry verification or start a fresh availability search if your hold expired.'}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleVerifyPayment}
                  disabled={paymentState === 'verifying' || paymentState === 'manual_resolution_409'}
                  className="flex-1 min-h-[48px] px-5 py-3 rounded-lg bg-forest text-ivory text-sm font-semibold hover:bg-evergreen inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${paymentState === 'verifying' ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>
                    {paymentState === 'verifying'
                      ? 'Verifying with Server...'
                      : 'Verify Payment With Server'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CONFIRMATION RECEIPT */}
          {step === 'confirmation' && (
            <div className="rounded-2xl border border-success/40 bg-white p-6 sm:p-8 space-y-6">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-[#E9F4EE] text-success flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <StatusBadge label="Booking Confirmed & Paid" tone="success" />
                  <h1 className="font-display text-3xl font-semibold text-charcoal mt-2">
                    Your Stay Is Confirmed
                  </h1>
                  <p className="text-sm text-charcoal/80 mt-1">
                    Payment has been verified on our server and your reservation is locked in.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-sand bg-ivory/60 p-5 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-charcoal/75">Booking Reference</span>
                  <span className="font-semibold text-charcoal tabular-nums">#{activeBookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/75">Payment Reference</span>
                  <code className="font-mono text-xs">{activePaymentRef}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/75">Room Type</span>
                  <span className="font-medium text-charcoal">{room.room_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/75">Dates</span>
                  <span className="font-medium text-charcoal tabular-nums">
                    {checkIn} to {checkOut} ({nights} nights)
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-sand">
                  <span className="font-semibold text-charcoal">Total Verified</span>
                  <span className="font-semibold text-forest tabular-nums">
                    {serverTotal !== null ? formatTransactionalMoney(serverTotal) : '—'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/account"
                  onClick={() => resetActiveCheckout()}
                  className="min-h-[44px] px-5 py-2.5 rounded-lg bg-forest text-ivory text-sm font-semibold hover:bg-evergreen inline-flex items-center"
                >
                  View in My Bookings
                </Link>
                <Link
                  to="/rooms"
                  onClick={() => resetActiveCheckout()}
                  className="min-h-[44px] px-5 py-2.5 rounded-lg border border-sand text-charcoal text-sm font-medium hover:bg-sand/40 inline-flex items-center"
                >
                  Browse More Rooms
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Summary Sidebar */}
        <aside className="lg:col-span-5 rounded-2xl border border-sand bg-white p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold text-charcoal">Stay Summary</h2>
          <div className="pb-4 border-b border-sand">
            <p className="text-base font-semibold text-forest">{room.room_type}</p>
            <p className="text-xs text-charcoal/70 mt-0.5">
              {room.hotel_name || 'KARAMO Hotels'}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-charcoal/75">Check-in</span>
              <span className="font-medium tabular-nums">{checkIn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal/75">Check-out</span>
              <span className="font-medium tabular-nums">{checkOut}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal/75">Duration</span>
              <span className="font-medium tabular-nums">
                {nights} {nights === 1 ? 'night' : 'nights'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-charcoal/75">Guests</span>
              <span className="font-medium tabular-nums">{guestCount}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-sand">
              <span className="text-charcoal/75">Nightly Rate</span>
              <span className="font-medium tabular-nums">
                {formatTransactionalMoney(room.price_per_night)}
              </span>
            </div>
            <div className="flex justify-between text-base font-semibold text-forest">
              <span>{serverTotal !== null ? 'Server Total' : 'Estimated Stay Rate'}</span>
              <span className="tabular-nums">
                {serverTotal !== null
                  ? formatTransactionalMoney(serverTotal)
                  : formatTransactionalMoney(Number(room.price_per_night) * Math.max(1, nights))}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-ivory border border-sand p-3.5 text-xs text-charcoal/75 flex items-start gap-2">
            <Clock className="w-4 h-4 text-forest shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Online modifications and self-service cancellations are not currently automated. Need a change later? Our human support desk can help.
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
};
