export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
}

export interface Hotel {
  id: number;
  name: string;
  location: string;
  description: string | null;
  created_at?: string;
}

export interface Room {
  id: number;
  hotel_id: number;
  room_type: string;
  price_per_night: number | string;
  capacity: number;
  description: string | null;
  created_at?: string;
  // Client presentation enrichments (marked illustrative/configurable when not supplied by DB)
  hotel_name?: string;
  hotel_location?: string;
  image_url?: string;
  illustrative_amenities?: string[];
  bed_configuration_placeholder?: string;
  room_size_placeholder?: string;
}

export interface SearchParamsState {
  check_in: string;
  check_out: string;
  guest_count: number;
  room_type?: string;
  sort_by?: 'recommended' | 'price_asc' | 'price_desc' | 'capacity_desc';
}

export type BackendBookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type BackendPaymentStatus = 'pending' | 'success' | 'failed' | 'refunded' | null;

export interface BookingCreateResponse {
  message: string;
  booking: {
    id: number;
    user_id: number;
    room_id: number;
    check_in: string;
    check_out: string;
    guest_count: number;
    total_amount: string | number;
    booking_status: BackendBookingStatus;
    hold_expires_at: string;
    created_at?: string;
  };
}

export interface MyBookingItem {
  booking_id: number;
  hotel_name: string;
  hotel_location: string;
  room_type: string;
  price_per_night: string | number;
  check_in: string;
  check_out: string;
  guest_count: number;
  total_amount: string | number;
  booking_status: BackendBookingStatus;
  payment_reference: string | null;
  payment_status: BackendPaymentStatus;
  payment_confirmed_at: string | null;
  // Local tracking if duplicate payment rows were normalized (Backend Finding F-07)
  payment_attempt_count?: number;
  has_submitted_review?: boolean;
}

export interface PaymentInitResponse {
  message: string;
  authorization_url: string;
  reference: string;
  sandbox_mode?: boolean;
}

export interface PaymentVerifyResponse {
  message: string;
  booking_id: number;
  payment_reference?: string;
  booking_status: BackendBookingStatus;
  payment_status: BackendPaymentStatus;
}

export interface ReviewSubmitPayload {
  booking_id: number;
  rating: number;
  comment?: string;
}

export interface ReviewRecord {
  id: number;
  booking_id: number;
  user_id: number;
  rating: number;
  comment: string | null;
  created_at?: string;
}

// --- Data Science FastAPI Contracts (guest_experience_api) ---

export type GuestSegmentLabel =
  | 'SHORT_STAY_VALUE'
  | 'LONG_STAY_BUDGET'
  | 'HIGH_SPEND_EXTENDED';

export type RiskTier = 'LOW' | 'MODERATE' | 'HIGH';

export interface BookingInsightsResponse {
  booking_id: string;
  stay_summary: {
    room_type: string;
    nights: number;
    guest_count: number;
    lead_time_days: number;
    channel: string;
    payment_method: string;
  };
  financials: {
    total_amount: number;
    currency: string | null;
    avg_nightly_rate: number;
  };
  risk: {
    cancellation_probability: number;
    risk_tier: RiskTier;
    top_drivers: string[];
    is_directional_estimate: boolean;
    sample_size_note: string;
  };
  recommended_action: {
    action_code: string;
    label: string;
    detail: string;
  };
}

export interface GuestProfileResponse {
  user_id: string;
  is_repeat_guest: boolean;
  total_bookings: number;
  total_completed_stays: number;
  total_cancellations: number;
  historical_spend: number;
  currency: string | null;
  preferred_room_type: string | null;
  preferred_channel: string | null;
  segment: {
    segment_id: number;
    segment_label: GuestSegmentLabel;
    confidence_note: string;
  };
  ui_personalization: {
    highlight_room_types: string[];
    suggested_payment_method: string;
    show_flexible_policy_badge: boolean;
  };
}

export interface CheckoutHealthMethod {
  payment_method: string;
  booking_count: number;
  avg_payment_duration_min: number;
  observed_cancellation_rate: number;
  high_friction_flag: boolean;
  ui_recommendation: string;
}

export interface CheckoutHealthResponse {
  as_of: string;
  is_directional_estimate: boolean;
  methods: CheckoutHealthMethod[];
}

// --- Client Analytics Event Tracking ---

export type TrackedEventName =
  | 'search_submitted'
  | 'results_viewed'
  | 'room_viewed'
  | 'booking_started'
  | 'guest_details_completed'
  | 'payment_started'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'booking_confirmed'
  | 'confirmation_viewed'
  | 'assistant_started'
  | 'assistant_escalated';

export interface TrackedEvent {
  event_id: string;
  event_name: TrackedEventName;
  timestamp: string;
  session_id: string;
  data_origin: 'live' | 'sandbox';
  metadata: Record<string, string | number | boolean | null>;
}

// --- Staff / Admin Portal (DEMO MODE ONLY) ---

export type StaffRole =
  | 'front_desk'
  | 'service_staff'
  | 'hotel_manager'
  | 'finance'
  | 'platform_admin';

export interface StaffDemoAccount {
  id: string;
  display_name: string;
  role: StaffRole;
  role_label: string;
  department: string;
}

export interface SystemStatus {
  transactionalConfigured: boolean;
  transactionalReachable: boolean;
  dsConfigured: boolean;
  dsReachable: boolean;
  geminiConfigured: boolean;
}
