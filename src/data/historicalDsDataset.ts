import type {
  BookingInsightsResponse,
  CheckoutHealthResponse,
  GuestProfileResponse,
} from '../types/api';

// Verified statistics directly from Hotel_booking_project_cleaned_with_Dashboard__2__1__036c17ac.pdf
// Dataset: 100 rows (HTL-2026-00001 to HTL-2026-00100), 96 unique user IDs (4 repeat guests), 0 missing values.
// Note: currency column was cleaned to null/unconfirmed (Cleaning_Log p.43).

export interface HistoricalRoomTypeStat {
  room_type: string;
  bookings: number;
  gross_revenue: number;
  avg_nightly_rate: number;
  avg_stay_nights: number;
}

export interface HistoricalDatasetSummary {
  total_rows: number;
  distinct_users: number;
  repeat_occurrences: number;
  gross_revenue: number;
  net_revenue_paid: number;
  cancelled_refunded_revenue: number;
  currency_status: 'UNCONFIRMED_NULL';
  status_counts: {
    completed: number;
    confirmed: number;
    cancelled: number;
  };
  payment_status_counts: {
    paid: number;
    refunded: number;
  };
  guest_count_distribution: Array<{ guests: number; bookings: number }>;
  room_type_stats: HistoricalRoomTypeStat[];
  channel_distribution: Array<{ channel: string; bookings: number; share_pct: number }>;
  segment_summary: Array<{
    segment_label: 'SHORT_STAY_VALUE' | 'LONG_STAY_BUDGET' | 'HIGH_SPEND_EXTENDED';
    description: string;
    typical_profile: string;
  }>;
}

export const HISTORICAL_DATASET_SUMMARY: HistoricalDatasetSummary = {
  total_rows: 100,
  distinct_users: 96,
  repeat_occurrences: 4,
  gross_revenue: 31070000,
  net_revenue_paid: 28445000,
  cancelled_refunded_revenue: 2625000,
  currency_status: 'UNCONFIRMED_NULL',
  status_counts: {
    completed: 85,
    confirmed: 7,
    cancelled: 8,
  },
  payment_status_counts: {
    paid: 92,
    refunded: 8,
  },
  guest_count_distribution: [
    { guests: 1, bookings: 31 },
    { guests: 2, bookings: 48 },
    { guests: 3, bookings: 15 },
    { guests: 4, bookings: 6 },
  ],
  room_type_stats: [
    { room_type: 'Standard', bookings: 33, gross_revenue: 5075000, avg_nightly_rate: 35000, avg_stay_nights: 4.1 },
    { room_type: 'Deluxe', bookings: 27, gross_revenue: 5170000, avg_nightly_rate: 55000, avg_stay_nights: 3.5 },
    { room_type: 'Suite', bookings: 18, gross_revenue: 10625000, avg_nightly_rate: 125000, avg_stay_nights: 4.6 },
    { room_type: 'Executive', bookings: 15, gross_revenue: 4400000, avg_nightly_rate: 80000, avg_stay_nights: 3.6 },
    { room_type: 'Presidential', bookings: 7, gross_revenue: 5800000, avg_nightly_rate: 200000, avg_stay_nights: 4.1 },
  ],
  channel_distribution: [
    { channel: 'Web', bookings: 44, share_pct: 44 },
    { channel: 'Mobile App', bookings: 32, share_pct: 32 },
    { channel: 'Walk-in / Direct Desk', bookings: 14, share_pct: 14 },
    { channel: 'OTA / Partner', bookings: 10, share_pct: 10 },
  ],
  segment_summary: [
    {
      segment_label: 'SHORT_STAY_VALUE',
      description: 'Cluster characterized by brief 1–3 night stays with moderate nightly spend.',
      typical_profile: 'Standard or Deluxe stays, quick weekend or business trips.',
    },
    {
      segment_label: 'LONG_STAY_BUDGET',
      description: 'Cluster characterized by 4+ night stays selecting accessible room tiers.',
      typical_profile: 'Extended Standard or Deluxe reservations prioritizing multi-night value.',
    },
    {
      segment_label: 'HIGH_SPEND_EXTENDED',
      description: 'Cluster characterized by premium room tiers and higher cumulative booking value.',
      typical_profile: 'Executive, Suite, and Presidential bookings with multi-night itineraries.',
    },
  ],
};

// Verified Checkout Health Snapshot (from guest_experience_api_f7d01db6.py + Cleaned_Data Pivot)
export const HISTORICAL_CHECKOUT_HEALTH: CheckoutHealthResponse = {
  as_of: '2026-04-06T00:00:00Z',
  is_directional_estimate: true,
  methods: [
    {
      payment_method: 'Card',
      booking_count: 27,
      avg_payment_duration_min: 5.84,
      observed_cancellation_rate: 0.074,
      high_friction_flag: false,
      ui_recommendation: 'Standard checkout flow; typical settlement below 6 minutes.',
    },
    {
      payment_method: 'Mobile Money',
      booking_count: 25,
      avg_payment_duration_min: 7.0,
      observed_cancellation_rate: 0.12,
      high_friction_flag: true,
      ui_recommendation:
        'High-friction warning: avg confirmation reaches 7.00 min. Show clear carrier approval instructions and soft-hold countdown.',
    },
    {
      payment_method: 'USSD',
      booking_count: 25,
      avg_payment_duration_min: 6.0,
      observed_cancellation_rate: 0.04,
      high_friction_flag: false,
      ui_recommendation: 'Display bank USSD dial prompt clearly with hold timer visible.',
    },
    {
      payment_method: 'Bank Transfer',
      booking_count: 23,
      avg_payment_duration_min: 5.95,
      observed_cancellation_rate: 0.087,
      high_friction_flag: false,
      ui_recommendation: 'Highlight exact transfer reference and verification reminder.',
    },
  ],
};

// Sample Booking Insights matching BookingInsightsResponse contract from guest_experience_api_f7d01db6.py
export const SAMPLE_BOOKING_INSIGHTS: Record<string, BookingInsightsResponse> = {
  'HTL-2026-00001': {
    booking_id: 'HTL-2026-00001',
    stay_summary: {
      room_type: 'Standard',
      nights: 4,
      guest_count: 2,
      lead_time_days: 14,
      channel: 'Web',
      payment_method: 'Card',
    },
    financials: {
      total_amount: 140000,
      currency: null,
      avg_nightly_rate: 35000,
    },
    risk: {
      cancellation_probability: 0.09,
      risk_tier: 'LOW',
      top_drivers: ['Card payment duration <= 6 min', 'Moderate 14-day booking lead time'],
      is_directional_estimate: true,
      sample_size_note:
        'Directional estimate calibrated on 100 historical records (8 cancellations). Support cue only—never restricts guest booking.',
    },
    recommended_action: {
      action_code: 'STANDARD_CONFIRMATION',
      label: 'Standard Welcome & Pre-Arrival',
      detail: 'Proceed with normal pre-arrival concierge message.',
    },
  },
  'HTL-2026-00018': {
    booking_id: 'HTL-2026-00018',
    stay_summary: {
      room_type: 'Deluxe',
      nights: 3,
      guest_count: 2,
      lead_time_days: 42,
      channel: 'Mobile App',
      payment_method: 'Mobile Money',
    },
    financials: {
      total_amount: 165000,
      currency: null,
      avg_nightly_rate: 55000,
    },
    risk: {
      cancellation_probability: 0.34,
      risk_tier: 'HIGH',
      top_drivers: [
        'Mobile Money checkout friction (avg 7.00 min)',
        'Longer pre-arrival lead time (> 30 days)',
      ],
      is_directional_estimate: true,
      sample_size_note:
        'Directional estimate calibrated on 100 historical records (8 cancellations). Used solely for helpful concierge outreach.',
    },
    recommended_action: {
      action_code: 'PROACTIVE_CONCIERGE_CHECKIN',
      label: 'Proactive Concierge Check-in',
      detail:
        'Offer non-intrusive arrival support and clear policy reminders ahead of arrival.',
    },
  },
  'HTL-2026-00064': {
    booking_id: 'HTL-2026-00064',
    stay_summary: {
      room_type: 'Suite',
      nights: 5,
      guest_count: 2,
      lead_time_days: 19,
      channel: 'Web',
      payment_method: 'Bank Transfer',
    },
    financials: {
      total_amount: 625000,
      currency: null,
      avg_nightly_rate: 125000,
    },
    risk: {
      cancellation_probability: 0.14,
      risk_tier: 'MODERATE',
      top_drivers: ['Extended 5-night stay value', 'Bank Transfer verification step'],
      is_directional_estimate: true,
      sample_size_note:
        'Directional estimate calibrated on 100 historical records (8 cancellations).',
    },
    recommended_action: {
      action_code: 'VERIFY_TRANSFER_RECEIPT',
      label: 'Courteous Arrival & Preferences Prompt',
      detail: 'Confirm arrival preferences and ensure transfer reference is documented.',
    },
  },
};

export const SAMPLE_GUEST_PROFILES: Record<string, GuestProfileResponse> = {
  'USR-1042': {
    user_id: 'USR-1042',
    is_repeat_guest: true,
    total_bookings: 2,
    total_completed_stays: 2,
    total_cancellations: 0,
    historical_spend: 295000,
    currency: null,
    preferred_room_type: 'Deluxe',
    preferred_channel: 'Web',
    segment: {
      segment_id: 0,
      segment_label: 'SHORT_STAY_VALUE',
      confidence_note:
        'Historical clustering across 96 unique guest IDs (directional personalization only).',
    },
    ui_personalization: {
      highlight_room_types: ['Deluxe', 'Executive'],
      suggested_payment_method: 'Card',
      show_flexible_policy_badge: true,
    },
  },
  'USR-2088': {
    user_id: 'USR-2088',
    is_repeat_guest: true,
    total_bookings: 2,
    total_completed_stays: 2,
    total_cancellations: 0,
    historical_spend: 1025000,
    currency: null,
    preferred_room_type: 'Suite',
    preferred_channel: 'Web',
    segment: {
      segment_id: 2,
      segment_label: 'HIGH_SPEND_EXTENDED',
      confidence_note:
        'Historical clustering across 96 unique guest IDs (directional personalization only).',
    },
    ui_personalization: {
      highlight_room_types: ['Suite', 'Presidential'],
      suggested_payment_method: 'Card',
      show_flexible_policy_badge: true,
    },
  },
  'USR-3015': {
    user_id: 'USR-3015',
    is_repeat_guest: false,
    total_bookings: 1,
    total_completed_stays: 1,
    total_cancellations: 0,
    historical_spend: 175000,
    currency: null,
    preferred_room_type: 'Standard',
    preferred_channel: 'Mobile App',
    segment: {
      segment_label: 'LONG_STAY_BUDGET',
      segment_id: 1,
      confidence_note:
        'Historical clustering across 96 unique guest IDs (directional personalization only).',
    },
    ui_personalization: {
      highlight_room_types: ['Standard', 'Deluxe'],
      suggested_payment_method: 'USSD',
      show_flexible_policy_badge: false,
    },
  },
};

// Format helper that respects unconfirmed DS currency === null without inventing a symbol
export function formatDsAmount(amount: number, currency: string | null): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  if (!currency) {
    return `${formatted} (unconfirmed currency)`;
  }
  return `${currency} ${formatted}`;
}

export function formatDsCompact(amount: number, currency: string | null): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return currency ? `${currency} ${formatted}` : formatted;
}
