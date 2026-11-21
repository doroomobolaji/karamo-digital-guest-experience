import type {
  AuthUser,
  BookingCreateResponse,
  Hotel,
  MyBookingItem,
  PaymentInitResponse,
  PaymentVerifyResponse,
  ReviewRecord,
  ReviewSubmitPayload,
  Room,
  SystemStatus,
} from '../types/api';
import {
  resolveRoomImage,
  SANDBOX_HOTELS,
  SANDBOX_ROOMS,
} from '../data/demoSandboxData';

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  try {
    const res = await fetch('/api/system/status');
    if (res.ok) {
      return (await res.json()) as SystemStatus;
    }
  } catch {
    // Ignore transient fetch errors
  }
  return {
    transactionalConfigured: false,
    transactionalReachable: false,
    dsConfigured: false,
    dsReachable: false,
    geminiConfigured: false,
  };
}

function enrichRoomPresentation(room: Room, hotels: Hotel[]): Room {
  const hotel = hotels.find((h) => h.id === room.hotel_id);
  return {
    ...room,
    hotel_name: room.hotel_name || hotel?.name || 'KARAMO Hotels',
    hotel_location: room.hotel_location || hotel?.location || '[Location Placeholder]',
    image_url: room.image_url || resolveRoomImage(room.room_type),
  };
}

// Mitigates Backend Finding F-07 where LEFT JOIN payments can return multiple rows per booking_id
export function normalizeMyBookings(rows: MyBookingItem[]): MyBookingItem[] {
  const map = new Map<number, MyBookingItem>();
  for (const row of rows) {
    const existing = map.get(row.booking_id);
    if (!existing) {
      map.set(row.booking_id, { ...row, payment_attempt_count: row.payment_reference ? 1 : 0 });
    } else {
      const count = (existing.payment_attempt_count || 0) + (row.payment_reference ? 1 : 0);
      const shouldReplace =
        row.payment_status === 'success' ||
        (existing.payment_status !== 'success' && row.payment_confirmed_at);
      map.set(row.booking_id, {
        ...(shouldReplace ? row : existing),
        payment_attempt_count: count,
      });
    }
  }
  return Array.from(map.values());
}

// --- Controlled Sandbox State Machine (used ONLY when live backend is unconfigured/sandbox mode active) ---
interface SandboxState {
  users: Array<AuthUser & { password_plain: string; email_verified: boolean; otp: string; otp_expires: number; attempts: number }>;
  bookings: Array<{
    booking_id: number;
    user_id: number;
    room: Room;
    check_in: string;
    check_out: string;
    guest_count: number;
    total_amount: number;
    booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    hold_expires_at: string;
    payment_reference: string | null;
    payment_status: 'pending' | 'success' | 'failed' | 'refunded' | null;
    payment_confirmed_at: string | null;
    review?: ReviewRecord;
  }>;
  nextUserId: number;
  nextBookingId: number;
}

const sandboxState: SandboxState = {
  users: [
    {
      id: 9001,
      full_name: 'Chidi Obi (Sandbox Guest)',
      email: 'guest@karamo-demo.example',
      phone_number: '+2348000000001',
      password_plain: 'KaramoDemo2026!',
      email_verified: true,
      otp: '123456',
      otp_expires: Date.now() + 600_000,
      attempts: 0,
    },
  ],
  bookings: [
    {
      booking_id: 5001,
      user_id: 9001,
      room: SANDBOX_ROOMS[1], // Deluxe
      check_in: '2026-03-10',
      check_out: '2026-03-13',
      guest_count: 2,
      total_amount: 165000,
      booking_status: 'confirmed',
      hold_expires_at: '2026-03-10T12:15:00Z',
      payment_reference: 'booking-5001-sandbox-completed',
      payment_status: 'success',
      payment_confirmed_at: '2026-03-01T14:20:00Z',
    },
    {
      booking_id: 5002,
      user_id: 9001,
      room: SANDBOX_ROOMS[3], // Suite
      check_in: '2026-12-18',
      check_out: '2026-12-21',
      guest_count: 2,
      total_amount: 375000,
      booking_status: 'confirmed',
      hold_expires_at: '2026-12-18T12:15:00Z',
      payment_reference: 'booking-5002-sandbox-upcoming',
      payment_status: 'success',
      payment_confirmed_at: '2026-11-15T10:05:00Z',
    },
  ],
  nextUserId: 9002,
  nextBookingId: 5003,
};

async function callLiveBackend<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`/api/backend${path}`, {
    ...options,
    headers,
  });
  const text = await res.text();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    parsed = { message: text || 'Unexpected backend response' };
  }
  if (!res.ok) {
    throw new ApiError(
      (parsed.message as string) || `Request failed (${res.status})`,
      res.status,
      parsed.code as string | undefined
    );
  }
  return parsed as T;
}

export async function getHotels(mode: 'live' | 'sandbox'): Promise<Hotel[]> {
  if (mode === 'live') {
    const data = await callLiveBackend<{ hotels: Hotel[] }>('/hotels');
    return data.hotels || [];
  }
  return SANDBOX_HOTELS;
}

export async function getRooms(mode: 'live' | 'sandbox'): Promise<Room[]> {
  if (mode === 'live') {
    const [hotels, roomData] = await Promise.all([
      getHotels('live').catch(() => [] as Hotel[]),
      callLiveBackend<{ rooms: Room[] }>('/rooms'),
    ]);
    return (roomData.rooms || []).map((r) => enrichRoomPresentation(r, hotels));
  }
  return SANDBOX_ROOMS;
}

export async function checkAvailability(
  mode: 'live' | 'sandbox',
  params: { check_in: string; check_out: string; guest_count: number }
): Promise<Room[]> {
  if (mode === 'live') {
    const qs = new URLSearchParams({
      check_in: params.check_in,
      check_out: params.check_out,
      guest_count: String(params.guest_count),
    });
    const [hotels, data] = await Promise.all([
      getHotels('live').catch(() => [] as Hotel[]),
      callLiveBackend<{ rooms: Room[] }>(`/availability?${qs.toString()}`),
    ]);
    return (data.rooms || []).map((r) => enrichRoomPresentation(r, hotels));
  }

  // Sandbox availability check respects guest capacity & simulated overlapping confirmed/active holds
  return SANDBOX_ROOMS.filter((room) => {
    if (room.capacity < params.guest_count) return false;
    const conflict = sandboxState.bookings.some(
      (b) =>
        b.room.id === room.id &&
        (b.booking_status === 'confirmed' ||
          (b.booking_status === 'pending' && new Date(b.hold_expires_at) > new Date())) &&
        b.check_in < params.check_out &&
        b.check_out > params.check_in
    );
    return !conflict;
  });
}

export async function registerGuest(
  mode: 'live' | 'sandbox',
  payload: { full_name: string; email: string; phone_number: string; password: string }
): Promise<{ message: string; user: AuthUser; sandboxOtpHint?: string }> {
  if (mode === 'live') {
    return callLiveBackend('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  const normalizedEmail = payload.email.trim().toLowerCase();
  if (sandboxState.users.some((u) => u.email.toLowerCase() === normalizedEmail || u.phone_number === payload.phone_number.trim())) {
    throw new ApiError('Email or phone number already registered', 409);
  }
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const user: AuthUser = {
    id: sandboxState.nextUserId++,
    full_name: payload.full_name.trim(),
    email: normalizedEmail,
    phone_number: payload.phone_number.trim(),
  };
  sandboxState.users.push({
    ...user,
    password_plain: payload.password,
    email_verified: false,
    otp,
    otp_expires: Date.now() + 10 * 60 * 1000,
    attempts: 0,
  });
  return {
    message: 'Registration successful (Sandbox Mode). Enter the 6-digit OTP shown for demo verification.',
    user,
    sandboxOtpHint: otp,
  };
}

export async function verifyGuestEmail(
  mode: 'live' | 'sandbox',
  payload: { email: string; otp: string }
): Promise<{ message: string }> {
  if (mode === 'live') {
    return callLiveBackend('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  const user = sandboxState.users.find((u) => u.email.toLowerCase() === payload.email.trim().toLowerCase());
  if (!user) throw new ApiError('User not found', 404);
  if (user.email_verified) throw new ApiError('Email is already verified', 400);
  if (user.attempts >= 5) throw new ApiError('Too many attempts. Request a new OTP.', 429);
  if (Date.now() > user.otp_expires) throw new ApiError('OTP has expired. Request a new one.', 400);
  if (user.otp !== payload.otp.trim()) {
    user.attempts += 1;
    throw new ApiError('Incorrect OTP', 400);
  }
  user.email_verified = true;
  user.attempts = 0;
  return { message: 'Email verified successfully (Sandbox Mode)' };
}

export async function resendGuestOtp(
  mode: 'live' | 'sandbox',
  payload: { email: string }
): Promise<{ message: string; sandboxOtpHint?: string }> {
  if (mode === 'live') {
    return callLiveBackend('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  const user = sandboxState.users.find((u) => u.email.toLowerCase() === payload.email.trim().toLowerCase());
  if (!user) throw new ApiError('User not found', 404);
  if (user.email_verified) throw new ApiError('Email is already verified', 400);
  const newOtp = String(Math.floor(100000 + Math.random() * 900000));
  user.otp = newOtp;
  user.otp_expires = Date.now() + 10 * 60 * 1000;
  user.attempts = 0;
  return {
    message: 'A new verification OTP has been generated (Sandbox Mode).',
    sandboxOtpHint: newOtp,
  };
}

export async function loginGuest(
  mode: 'live' | 'sandbox',
  payload: { email: string; password: string }
): Promise<{ message: string; token: string; user: AuthUser }> {
  if (mode === 'live') {
    return callLiveBackend('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  const user = sandboxState.users.find((u) => u.email.toLowerCase() === payload.email.trim().toLowerCase());
  if (!user || user.password_plain !== payload.password) {
    throw new ApiError('Invalid email or password', 401);
  }
  if (!user.email_verified) {
    throw new ApiError('Please verify your email OTP before signing in.', 403);
  }
  return {
    message: 'Login successful (Sandbox Mode)',
    token: `sandbox-jwt-${user.id}-${Date.now()}`,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
    },
  };
}

export async function createBooking(
  mode: 'live' | 'sandbox',
  token: string,
  payload: { room_id: number; check_in: string; check_out: string; guest_count: number },
  userId?: number
): Promise<BookingCreateResponse> {
  if (mode === 'live') {
    return callLiveBackend(
      '/bookings',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token
    );
  }

  const room = SANDBOX_ROOMS.find((r) => r.id === payload.room_id);
  if (!room) throw new ApiError('Room not found', 404);
  if (room.capacity < payload.guest_count) {
    throw new ApiError('Room capacity is insufficient for the number of guests', 400);
  }

  const start = new Date(payload.check_in);
  const end = new Date(payload.check_out);
  const nights = Math.round((end.getTime() - start.getTime()) / 86400000);
  if (!nights || nights < 1) throw new ApiError('Check-out must be after check-in', 400);

  const conflict = sandboxState.bookings.some(
    (b) =>
      b.room.id === room.id &&
      (b.booking_status === 'confirmed' ||
        (b.booking_status === 'pending' && new Date(b.hold_expires_at) > new Date())) &&
      b.check_in < payload.check_out &&
      b.check_out > payload.check_in
  );
  if (conflict) {
    throw new ApiError('Room is not available for the selected dates', 409);
  }

  const bookingId = sandboxState.nextBookingId++;
  const holdExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const totalAmount = Number(room.price_per_night) * nights;

  sandboxState.bookings.unshift({
    booking_id: bookingId,
    user_id: userId || 9001,
    room,
    check_in: payload.check_in,
    check_out: payload.check_out,
    guest_count: payload.guest_count,
    total_amount: totalAmount,
    booking_status: 'pending',
    hold_expires_at: holdExpires,
    payment_reference: null,
    payment_status: null,
    payment_confirmed_at: null,
  });

  return {
    message: 'Booking created successfully. Complete payment within 15 minutes. (Sandbox Mode)',
    booking: {
      id: bookingId,
      user_id: userId || 9001,
      room_id: room.id,
      check_in: payload.check_in,
      check_out: payload.check_out,
      guest_count: payload.guest_count,
      total_amount: totalAmount,
      booking_status: 'pending',
      hold_expires_at: holdExpires,
    },
  };
}

export async function initializePayment(
  mode: 'live' | 'sandbox',
  token: string,
  bookingId: number
): Promise<PaymentInitResponse> {
  if (mode === 'live') {
    return callLiveBackend(
      '/payments/initialize',
      {
        method: 'POST',
        body: JSON.stringify({ booking_id: bookingId }),
      },
      token
    );
  }

  const booking = sandboxState.bookings.find((b) => b.booking_id === bookingId);
  if (!booking) throw new ApiError('Booking not found', 404);
  if (booking.booking_status !== 'pending' || new Date(booking.hold_expires_at) <= new Date()) {
    throw new ApiError('Booking is no longer eligible for payment', 400);
  }
  const reference = `booking-${bookingId}-sandbox-${Math.random().toString(36).slice(2, 8)}`;
  booking.payment_reference = reference;
  booking.payment_status = 'pending';

  return {
    message: 'Payment initialized (Sandbox Test-Mode Simulator)',
    authorization_url: '#sandbox-paystack-modal',
    reference,
    sandbox_mode: true,
  };
}

export type SandboxVerifyOutcome =
  | 'success'
  | 'failed'
  | 'pending'
  | 'verification_error'
  | 'hold_expired_409';

export async function verifyPayment(
  mode: 'live' | 'sandbox',
  token: string,
  reference: string,
  sandboxOutcome: SandboxVerifyOutcome = 'success'
): Promise<PaymentVerifyResponse> {
  if (mode === 'live') {
    return callLiveBackend(
      '/payments/verify',
      {
        method: 'POST',
        body: JSON.stringify({ reference }),
      },
      token
    );
  }

  const booking = sandboxState.bookings.find((b) => b.payment_reference === reference);
  if (!booking) throw new ApiError('Payment reference not found', 404);

  if (sandboxOutcome === 'verification_error') {
    throw new ApiError('Unable to verify payment with Paystack gateway (Simulated 500)', 500);
  }
  if (sandboxOutcome === 'failed') {
    booking.payment_status = 'failed';
    throw new ApiError('Payment verification failed — transaction was declined or abandoned.', 400);
  }
  if (sandboxOutcome === 'pending') {
    booking.payment_status = 'pending';
    throw new ApiError('Payment is still pending settlement from bank/mobile channel.', 400);
  }
  if (sandboxOutcome === 'hold_expired_409' || new Date(booking.hold_expires_at) <= new Date()) {
    booking.payment_status = 'success';
    booking.payment_confirmed_at = new Date().toISOString();
    throw new ApiError(
      'Payment was received, but the booking hold has expired. Manual resolution is required.',
      409
    );
  }

  booking.payment_status = 'success';
  booking.payment_confirmed_at = new Date().toISOString();
  booking.booking_status = 'confirmed';
  return {
    message: 'Payment verified successfully. Booking confirmed. (Sandbox Mode)',
    booking_id: booking.booking_id,
    payment_reference: reference,
    booking_status: 'confirmed',
    payment_status: 'success',
  };
}

export async function getMyBookings(
  mode: 'live' | 'sandbox',
  token: string,
  userId?: number
): Promise<MyBookingItem[]> {
  if (mode === 'live') {
    const data = await callLiveBackend<{ bookings: MyBookingItem[] }>(
      '/bookings/my-bookings',
      { method: 'GET' },
      token
    );
    return normalizeMyBookings(data.bookings || []);
  }

  return sandboxState.bookings
    .filter((b) => b.user_id === (userId || 9001))
    .map((b) => ({
      booking_id: b.booking_id,
      hotel_name: b.room.hotel_name || 'KARAMO Hotels — Flagship Sanctuary',
      hotel_location: b.room.hotel_location || '[Location Placeholder]',
      room_type: b.room.room_type,
      price_per_night: b.room.price_per_night,
      check_in: b.check_in,
      check_out: b.check_out,
      guest_count: b.guest_count,
      total_amount: b.total_amount,
      booking_status: b.booking_status,
      payment_reference: b.payment_reference,
      payment_status: b.payment_status,
      payment_confirmed_at: b.payment_confirmed_at,
      payment_attempt_count: b.payment_reference ? 1 : 0,
      has_submitted_review: Boolean(b.review),
    }));
}

export async function submitReview(
  mode: 'live' | 'sandbox',
  token: string,
  payload: ReviewSubmitPayload,
  userId?: number
): Promise<{ message: string; review: ReviewRecord }> {
  if (mode === 'live') {
    return callLiveBackend(
      '/reviews',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token
    );
  }

  const booking = sandboxState.bookings.find(
    (b) => b.booking_id === payload.booking_id && b.user_id === (userId || 9001)
  );
  const today = new Date().toISOString().slice(0, 10);
  if (
    !booking ||
    booking.booking_status !== 'confirmed' ||
    booking.payment_status !== 'success' ||
    booking.check_out > today
  ) {
    throw new ApiError('Booking is not eligible for a review.', 400);
  }
  if (booking.review) {
    throw new ApiError('A review has already been submitted for this booking.', 409);
  }

  const review: ReviewRecord = {
    id: Math.floor(Math.random() * 10000),
    booking_id: payload.booking_id,
    user_id: userId || 9001,
    rating: payload.rating,
    comment: payload.comment?.trim() || null,
    created_at: new Date().toISOString(),
  };
  booking.review = review;
  return {
    message: 'Review submitted successfully. (Sandbox Mode)',
    review,
  };
}
