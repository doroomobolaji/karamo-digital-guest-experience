import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, LogOut, MessageSquarePlus, Sparkles, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { ApiError, getMyBookings, submitReview } from '../services/transactionalApi';
import { fetchGuestProfile } from '../services/analyticsApi';
import type { GuestProfileResponse, MyBookingItem } from '../types/api';
import {
  Breadcrumbs,
  StatusBadge,
  formatTransactionalMoney,
  mapBookingStatusTone,
  mapPaymentStatusTone,
} from '../components/ui/Primitives';

export const MyAccountPage: React.FC = () => {
  const { isGuestAuthenticated, guestToken, guestUser, clearGuestSession } = useAuth();
  const { dataMode } = useBooking();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<MyBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guestProfile, setGuestProfile] = useState<GuestProfileResponse | null>(null);

  // Review state
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadAccountBookings = async () => {
    if (!guestToken) return;
    setLoading(true);
    setError(null);
    try {
      const list = await getMyBookings(dataMode, guestToken, guestUser?.id);
      setBookings(list);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        clearGuestSession('Your session has expired. Please sign in again.');
        navigate('/login', { replace: true });
        return;
      }
      setError(err instanceof Error ? err.message : 'Unable to load your bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isGuestAuthenticated) {
      navigate('/login', { state: { from: '/account' }, replace: true });
      return;
    }
    loadAccountBookings();
    // Load sample/live DS profile for personalization showcase (directional guidance only)
    const profileKey = dataMode === 'live' && guestUser ? String(guestUser.id) : 'USR-1042';
    fetchGuestProfile(profileKey).then((res) => setGuestProfile(res.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuestAuthenticated, dataMode]);

  const isEligibleForReview = (b: MyBookingItem): boolean => {
    const today = new Date().toISOString().slice(0, 10);
    return (
      !b.has_submitted_review &&
      b.booking_status === 'confirmed' &&
      b.payment_status === 'success' &&
      b.check_out.slice(0, 10) <= today
    );
  };

  const handleSubmitReview = async (e: React.FormEvent, bookingId: number) => {
    e.preventDefault();
    if (!guestToken) return;
    setReviewError(null);
    setReviewSuccess(null);

    if (comment.length > 1000) {
      setReviewError('Comment must be 1,000 characters or fewer.');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await submitReview(
        dataMode,
        guestToken,
        { booking_id: bookingId, rating, comment },
        guestUser?.id
      );
      setReviewSuccess(res.message);
      setReviewingId(null);
      setComment('');
      await loadAccountBookings();
    } catch (err: unknown) {
      setReviewError(err instanceof Error ? err.message : 'Unable to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!isGuestAuthenticated || !guestUser) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'My Account' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-sand">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">
            Guest Account
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-charcoal mt-1">
            Welcome, {guestUser.full_name}
          </h1>
          <p className="text-sm text-charcoal/75 mt-1">
            {guestUser.email} &bull; {guestUser.phone_number}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/rooms"
            className="min-h-[44px] px-4 py-2.5 rounded-lg bg-forest text-ivory text-sm font-medium hover:bg-evergreen inline-flex items-center"
          >
            New Reservation
          </Link>
          <button
            type="button"
            onClick={() => {
              clearGuestSession();
              navigate('/');
            }}
            className="min-h-[44px] px-4 py-2.5 rounded-lg border border-sand bg-white text-charcoal text-sm font-medium hover:bg-sand/40 inline-flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Optional Non-Punitive DS Personalization Card */}
      {guestProfile && (
        <div className="rounded-2xl border border-sand bg-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-gold shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-charcoal">
                Stay Preferences Summary ({guestProfile.segment.segment_label})
              </p>
              <p className="text-xs text-charcoal/75 mt-1 leading-relaxed">
                Recommended categories for your next stay:{' '}
                <strong>{guestProfile.ui_personalization.highlight_room_types.join(', ')}</strong>.{' '}
                {guestProfile.ui_personalization.show_flexible_policy_badge
                  ? 'Returning-guest concierge flexibility reminders are enabled for your profile.'
                  : ''}
              </p>
            </div>
          </div>
          <span className="text-[11px] text-charcoal/65 shrink-0">
            Directional historical personalization
          </span>
        </div>
      )}

      {reviewSuccess && (
        <div role="status" className="rounded-xl border border-success/40 bg-[#E9F4EE] p-4 text-sm text-[#1D5E3F]">
          {reviewSuccess}
        </div>
      )}

      {/* Bookings List */}
      <section aria-labelledby="my-bookings-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 id="my-bookings-heading" className="font-display text-2xl font-semibold text-charcoal">
            My Bookings
          </h2>
          <p className="text-xs text-charcoal/70">
            Need to modify or cancel a confirmed stay?{' '}
            <Link to="/contact" className="font-semibold text-forest underline">
              Contact Front Desk Support
            </Link>
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-36 rounded-2xl border border-sand bg-white animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-error/40 bg-[#FAEDED] p-5 text-sm text-[#943535]">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-sand bg-white p-10 text-center space-y-3">
            <h3 className="font-display text-xl font-semibold text-charcoal">No Bookings Yet</h3>
            <p className="text-sm text-charcoal/75">
              You have not created any reservations on this account yet.
            </p>
            <Link
              to="/rooms"
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg bg-forest text-ivory text-sm font-medium"
            >
              Explore Rooms
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const eligible = isEligibleForReview(b);
              return (
                <article
                  key={b.booking_id}
                  className="rounded-2xl border border-sand bg-white p-5 sm:p-6 space-y-4"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-charcoal/65 tabular-nums">
                          Booking #{b.booking_id}
                        </span>
                        <StatusBadge
                          label={`Booking: ${b.booking_status}`}
                          tone={mapBookingStatusTone(b.booking_status)}
                        />
                        <StatusBadge
                          label={`Payment: ${b.payment_status || 'Unpaid'}`}
                          tone={mapPaymentStatusTone(b.payment_status)}
                        />
                      </div>
                      <h3 className="font-display text-xl font-semibold text-charcoal pt-1">
                        {b.room_type} — {b.hotel_name}
                      </h3>
                      <p className="text-xs text-charcoal/75 flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Calendar className="w-3.5 h-3.5 text-forest" aria-hidden="true" />
                          {b.check_in.slice(0, 10)} to {b.check_out.slice(0, 10)}
                        </span>
                        <span>&bull;</span>
                        <span className="tabular-nums">{b.guest_count} guests</span>
                        {b.payment_reference && (
                          <>
                            <span>&bull;</span>
                            <code className="font-mono text-[11px] bg-ivory px-1.5 py-0.5 rounded border border-sand">
                              Ref: {b.payment_reference}
                            </code>
                          </>
                        )}
                      </p>
                      {(b.payment_attempt_count || 0) > 1 && (
                        <p className="text-[11px] text-warning pt-1">
                          Multiple payment attempt rows were consolidated for this reservation.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="lg:text-right">
                        <p className="text-xs text-charcoal/65">Total Amount</p>
                        <p className="text-lg font-semibold text-forest tabular-nums">
                          {formatTransactionalMoney(b.total_amount)}
                        </p>
                      </div>

                      {eligible ? (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewingId(reviewingId === b.booking_id ? null : b.booking_id);
                            setReviewError(null);
                          }}
                          className="min-h-[44px] px-4 py-2 rounded-lg border border-forest text-forest text-sm font-medium hover:bg-sand/40 inline-flex items-center gap-1.5"
                        >
                          <MessageSquarePlus className="w-4 h-4" aria-hidden="true" />
                          <span>Write Stay Review</span>
                        </button>
                      ) : b.has_submitted_review ? (
                        <StatusBadge label="Review Submitted" tone="success" />
                      ) : (
                        <Link
                          to="/contact"
                          state={{ prefillReference: b.payment_reference || `Booking #${b.booking_id}` }}
                          className="min-h-[44px] px-4 py-2 rounded-lg border border-sand text-charcoal text-xs font-medium hover:bg-sand/40 inline-flex items-center justify-center"
                        >
                          Request Assistance
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Eligible Review Form */}
                  {reviewingId === b.booking_id && (
                    <form
                      onSubmit={(e) => handleSubmitReview(e, b.booking_id)}
                      className="pt-4 border-t border-sand space-y-4"
                    >
                      <h4 className="font-sans text-sm font-semibold text-charcoal">
                        Submit Verified Guest Review (Booking #{b.booking_id})
                      </h4>

                      <div>
                        <span className="block text-xs font-medium text-charcoal/75 mb-1.5">
                          Rating (1 to 5 Stars)
                        </span>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              aria-label={`${star} star rating`}
                              className={`min-w-[44px] min-h-[44px] rounded-lg border flex items-center justify-center ${
                                rating >= star
                                  ? 'border-gold bg-sand/50 text-forest'
                                  : 'border-sand bg-white text-charcoal/40'
                              }`}
                            >
                              <Star className="w-4 h-4 fill-current" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor={`review-comment-${b.booking_id}`}
                          className="block text-xs font-medium text-charcoal/75 mb-1.5"
                        >
                          Your Feedback (optional, max 1,000 characters)
                        </label>
                        <textarea
                          id={`review-comment-${b.booking_id}`}
                          rows={3}
                          maxLength={1000}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Share highlights from your stay..."
                          className="w-full px-3 py-2 rounded-lg border border-sand bg-ivory/40 text-sm focus:border-forest focus:outline-none"
                        />
                        <p className="text-[11px] text-charcoal/60 mt-1 tabular-nums">
                          {comment.length} / 1000 characters
                        </p>
                      </div>

                      {reviewError && (
                        <p role="alert" className="text-xs font-medium text-error">
                          {reviewError}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="min-h-[44px] px-4 py-2 rounded-lg bg-forest text-ivory text-sm font-medium hover:bg-evergreen disabled:opacity-50"
                        >
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewingId(null)}
                          className="min-h-[44px] px-4 py-2 rounded-lg border border-sand text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
