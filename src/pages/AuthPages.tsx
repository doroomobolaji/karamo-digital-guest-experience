import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import {
  loginGuest,
  registerGuest,
  resendGuestOtp,
  verifyGuestEmail,
} from '../services/transactionalApi';
import { Breadcrumbs } from '../components/ui/Primitives';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setGuestSession, sessionExpiredNotice } = useAuth();
  const { dataMode } = useBooking();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || '/account';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      const resp = await loginGuest(dataMode, { email: email.trim(), password });
      setGuestSession(resp.token, resp.user);
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Sign In' }]} />
      <div className="rounded-2xl border border-sand bg-white p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">Guest Sign In</h1>
          <p className="mt-1.5 text-sm text-charcoal/75">
            Access your verified KARAMO Hotels reservations, holds, and stay reviews.
          </p>
        </div>

        {sessionExpiredNotice && (
          <div role="alert" className="rounded-xl border border-warning bg-[#FAF2E1] p-3 text-xs text-[#8A5A12]">
            {sessionExpiredNotice}
          </div>
        )}

        {dataMode === 'sandbox' && (
          <div className="rounded-xl border border-gold/50 bg-sand/35 p-3.5 text-xs space-y-2">
            <p className="font-semibold text-charcoal">Sandbox Test Guest Available</p>
            <p className="text-charcoal/80">
              Use pre-verified sandbox credentials to test reservations, bookings, and reviews immediately:
            </p>
            <button
              type="button"
              onClick={() => {
                setEmail('guest@karamo-demo.example');
                setPassword('KaramoDemo2026!');
              }}
              className="px-3 py-1.5 rounded-md border border-forest text-forest font-medium hover:bg-white"
            >
              Fill Sandbox Guest Credentials
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold uppercase text-charcoal/75 mb-1.5">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-sand bg-ivory/50 text-sm focus:border-forest focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-semibold uppercase text-charcoal/75 mb-1.5">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-sand bg-ivory/50 text-sm focus:border-forest focus:outline-none"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] px-5 py-3 rounded-lg bg-forest text-ivory text-sm font-semibold hover:bg-evergreen disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="pt-4 border-t border-sand text-xs space-y-2 text-charcoal/80">
          <p>
            New to KARAMO Hotels?{' '}
            <Link to="/register" state={{ from: redirectTo }} className="font-semibold text-forest underline">
              Create an account (Email OTP verified)
            </Link>
          </p>
          <p>
            Have a pending OTP code?{' '}
            <Link to="/verify-email" state={{ from: redirectTo }} className="font-semibold text-forest underline">
              Verify Email OTP
            </Link>
          </p>
          <p className="text-charcoal/65 pt-1">
            Self-service password reset is not yet automated; contact{' '}
            <Link to="/contact" className="underline text-forest">
              Support
            </Link>{' '}
            for account recovery.
          </p>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { dataMode } = useBooking();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || '/login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim() || !email.trim() || !phone.trim() || password.length < 8) {
      setError('Complete all fields and use a password of at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const resp = await registerGuest(dataMode, {
        full_name: fullName.trim(),
        email: email.trim(),
        phone_number: phone.trim(),
        password,
      });
      navigate('/verify-email', {
        state: {
          email: email.trim(),
          from: redirectTo,
          sandboxOtpHint: resp.sandboxOtpHint,
        },
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Create Account' }]} />
      <div className="rounded-2xl border border-sand bg-white p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">Create Guest Account</h1>
          <p className="mt-1.5 text-sm text-charcoal/75">
            Register to lock room holds, complete Paystack checkout, and manage bookings.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-xs font-semibold uppercase text-charcoal/75 mb-1.5">
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-sand bg-ivory/50 text-sm focus:border-forest focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-xs font-semibold uppercase text-charcoal/75 mb-1.5">
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-sand bg-ivory/50 text-sm focus:border-forest focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-phone" className="block text-xs font-semibold uppercase text-charcoal/75 mb-1.5">
              Phone Number
            </label>
            <input
              id="reg-phone"
              type="tel"
              required
              placeholder="+234..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-sand bg-ivory/50 text-sm focus:border-forest focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-xs font-semibold uppercase text-charcoal/75 mb-1.5">
              Password (min 8 characters)
            </label>
            <input
              id="reg-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-sand bg-ivory/50 text-sm focus:border-forest focus:outline-none"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] px-5 py-3 rounded-lg bg-forest text-ivory text-sm font-semibold hover:bg-evergreen disabled:opacity-50"
          >
            {loading ? 'Sending Verification OTP...' : 'Register & Send 6-Digit Email OTP'}
          </button>
        </form>

        <div className="pt-4 border-t border-sand text-xs text-charcoal/75">
          Already verified?{' '}
          <Link to="/login" state={{ from: redirectTo }} className="font-semibold text-forest underline">
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
};

export const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const state = (location.state as { email?: string; from?: string; sandboxOtpHint?: string } | null) || {};
  const [email, setEmail] = useState(state.email || '');
  const [otp, setOtp] = useState('');
  const [sandboxHint, setSandboxHint] = useState(state.sandboxOtpHint || '');
  const [cooldown, setCooldown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const { dataMode } = useBooking();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !/^\d{6}$/.test(otp.trim())) {
      setError('Enter your registered email and exact 6-digit numeric OTP.');
      return;
    }

    setLoading(true);
    try {
      const resp = await verifyGuestEmail(dataMode, {
        email: email.trim(),
        otp: otp.trim(),
      });
      setStatusMsg(resp.message);
      setVerified(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email.trim()) return;
    setError(null);
    try {
      const resp = await resendGuestOtp(dataMode, { email: email.trim() });
      setStatusMsg(resp.message);
      if (resp.sandboxOtpHint) setSandboxHint(resp.sandboxOtpHint);
      setCooldown(60);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not resend OTP.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Verify Email OTP' }]} />
      <div className="rounded-2xl border border-sand bg-white p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-sand flex items-center justify-center text-forest shrink-0">
            <Mail className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-charcoal">
              Verify Your Email
            </h1>
            <p className="text-xs text-charcoal/75 mt-1">
              Enter the 6-digit OTP sent to your email. Codes expire in 10 minutes (5 attempts max).
            </p>
          </div>
        </div>

        {sandboxHint && (
          <div className="rounded-xl border border-gold bg-sand/40 p-3.5 text-xs text-charcoal">
            <p className="font-semibold">Sandbox Verification Code (Demo Email Output):</p>
            <p className="font-mono text-base font-bold text-forest tracking-widest mt-1">
              {sandboxHint}
            </p>
          </div>
        )}

        {verified ? (
          <div className="rounded-xl border border-success/40 bg-[#E9F4EE] p-5 space-y-4">
            <div className="flex items-center gap-2 text-[#1D5E3F] font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
              <span>{statusMsg || 'Email verified successfully!'}</span>
            </div>
            <Link
              to="/login"
              state={{ from: state.from || '/account' }}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-forest text-ivory text-sm font-semibold flex items-center justify-center"
            >
              Proceed to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="otp-email" className="block text-xs font-semibold uppercase text-charcoal/75 mb-1.5">
                Registered Email
              </label>
              <input
                id="otp-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-sand bg-ivory/50 text-sm"
              />
            </div>

            <div>
              <label htmlFor="otp-code" className="block text-xs font-semibold uppercase text-charcoal/75 mb-1.5">
                6-Digit OTP Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-forest absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-lg border border-sand bg-ivory/50 text-sm font-mono tracking-widest"
                />
              </div>
            </div>

            {statusMsg && !error && (
              <p className="text-xs font-medium text-success">{statusMsg}</p>
            )}
            {error && (
              <p role="alert" className="text-sm font-medium text-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] px-5 py-3 rounded-lg bg-forest text-ivory text-sm font-semibold hover:bg-evergreen disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>{loading ? 'Verifying OTP...' : 'Verify Email'}</span>
            </button>

            <div className="pt-2 flex items-center justify-between text-xs text-charcoal/75">
              <span>Didn&apos;t receive the code?</span>
              <button
                type="button"
                disabled={cooldown > 0 || !email.trim()}
                onClick={handleResend}
                className="font-semibold text-forest hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
