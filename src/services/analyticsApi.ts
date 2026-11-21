import type {
  BookingInsightsResponse,
  CheckoutHealthResponse,
  GuestProfileResponse,
} from '../types/api';
import {
  HISTORICAL_CHECKOUT_HEALTH,
  SAMPLE_BOOKING_INSIGHTS,
  SAMPLE_GUEST_PROFILES,
} from '../data/historicalDsDataset';

export interface DsResult<T> {
  data: T;
  source: 'live_ds_api' | 'historical_100row_snapshot';
}

export async function fetchCheckoutHealth(): Promise<DsResult<CheckoutHealthResponse>> {
  try {
    const res = await fetch('/api/ds/checkout-health');
    if (res.ok) {
      const json = (await res.json()) as CheckoutHealthResponse;
      return { data: json, source: 'live_ds_api' };
    }
  } catch {
    // Fall back transparently to verified 100-row cleaned snapshot
  }
  return {
    data: HISTORICAL_CHECKOUT_HEALTH,
    source: 'historical_100row_snapshot',
  };
}

export async function fetchBookingInsights(
  bookingId: string
): Promise<DsResult<BookingInsightsResponse | null>> {
  try {
    const res = await fetch(`/api/ds/bookings/${encodeURIComponent(bookingId)}/insights`);
    if (res.ok) {
      const json = (await res.json()) as BookingInsightsResponse;
      return { data: json, source: 'live_ds_api' };
    }
  } catch {
    // Fallback to verified sample payloads from guest_experience_api_f7d01db6.py
  }
  const sample = SAMPLE_BOOKING_INSIGHTS[bookingId] ?? null;
  return {
    data: sample,
    source: 'historical_100row_snapshot',
  };
}

export async function fetchGuestProfile(
  userId: string
): Promise<DsResult<GuestProfileResponse | null>> {
  try {
    const res = await fetch(`/api/ds/users/${encodeURIComponent(userId)}/profile`);
    if (res.ok) {
      const json = (await res.json()) as GuestProfileResponse;
      return { data: json, source: 'live_ds_api' };
    }
  } catch {
    // Fallback to verified sample payloads
  }
  const sample = SAMPLE_GUEST_PROFILES[userId] ?? null;
  return {
    data: sample,
    source: 'historical_100row_snapshot',
  };
}
