export interface PolicySection {
  id: string;
  title: string;
  body: string[];
  isPlaceholder?: boolean;
  approvalRequiredBy?: string;
}

export const PRIVACY_POLICY_DRAFT: PolicySection[] = [
  {
    id: 'draft-notice',
    title: 'Draft Notice — Legal Review Required',
    body: [
      'This Privacy Policy is a structured operational draft prepared for KARAMO Hotels aligned with the Nigeria Data Protection Act (NDPA) 2023 and the platform cybersecurity review. It requires formal legal sign-off and confirmed Data Protection Officer (DPO) contact details prior to production launch.',
    ],
    isPlaceholder: true,
    approvalRequiredBy: 'Legal Counsel / Data Protection Officer',
  },
  {
    id: 'data-collected',
    title: '1. Personal Data We Collect',
    body: [
      'Account & Identity Data: Full name, email address, phone number, and bcrypt-hashed password collected during registration.',
      'Reservation & Stay Data: Selected hotel, room type, check-in/check-out dates, guest count, booking status, and verified guest reviews (1–5 rating and optional comment).',
      'Payment References: Paystack transaction references, payment amounts, and verification timestamps. KARAMO Hotels does NOT collect or store raw debit/credit card numbers or CVV codes.',
      'Operational & Consent-Aware Telemetry: Non-PII booking funnel events (such as room viewed or payment started using opaque session identifiers) without recording email addresses, phone numbers, or auth tokens.',
    ],
  },
  {
    id: 'lawful-basis',
    title: '2. Purpose & Lawful Basis (NDPA 2023)',
    body: [
      'Contract Performance: Creating temporary room holds, processing verified bookings, confirming payment with Paystack, and facilitating check-in.',
      'Security & Fraud Prevention: Email 6-digit OTP verification (hashed via SHA-256 with a 10-minute expiry and 5-attempt lockout), JWT authentication, and transaction verification.',
      'Service Improvement: Aggregated historical booking analytics and non-punitive concierge assistance.',
    ],
  },
  {
    id: 'data-retention',
    title: '3. Data Security & Retention',
    body: [
      'Authentication tokens are held strictly in runtime memory during active sessions and are never persisted to browser localStorage or sessionStorage.',
      'Retention schedules for completed reservations, expired OTP hashes, and payment audit logs are subject to final regulatory confirmation. [Editable Placeholder: Insert confirmed retention period in years/months once approved by Legal/Finance].',
    ],
    isPlaceholder: true,
    approvalRequiredBy: 'Legal & Finance Leadership',
  },
  {
    id: 'guest-rights',
    title: '4. Your Data Subject Rights',
    body: [
      'Under NDPA 2023, guests have the right to request access, correction, portability, restriction, or deletion of personal data where retention is not legally mandated. [Editable Placeholder: Insert verified DPO privacy email & postal address before production launch].',
    ],
    isPlaceholder: true,
    approvalRequiredBy: 'Data Protection Officer',
  },
];

export const TERMS_AND_CONDITIONS_DRAFT: PolicySection[] = [
  {
    id: 'terms-notice',
    title: 'Policy Status Notice',
    body: [
      'Operational rules marked with [Placeholder — Pending Management Approval] reflect open product decisions identified in the KARAMO Hotels Cross-Team Specification and must be confirmed by hotel management and legal counsel prior to live guest transactions.',
    ],
    isPlaceholder: true,
    approvalRequiredBy: 'Hotel Management & Legal',
  },
  {
    id: 'reservation-holds',
    title: '1. Reservations & 15-Minute Soft Hold',
    body: [
      'All online reservations require a registered, email-verified KARAMO Hotels account.',
      'Initiating a booking places a temporary 15-minute soft hold on the selected room. A reservation becomes "Confirmed" only after Paystack payment is verified by our backend server.',
      'If payment completes after the 15-minute hold expires, the transaction enters manual resolution (HTTP 409) so staff can prevent double-booking and coordinate confirmation or refund.',
    ],
  },
  {
    id: 'pricing-taxes',
    title: '2. Pricing, Currency & Taxes',
    body: [
      'Authoritative booking totals are calculated exclusively on the backend server (nightly rate × number of nights).',
      '[Placeholder — Pending Finance Approval: Confirmed settlement currency display rules, VAT/tourism levy percentages, and service charges will be itemized once approved by Finance].',
    ],
    isPlaceholder: true,
    approvalRequiredBy: 'Finance & Revenue Management',
  },
  {
    id: 'checkin-checkout',
    title: '3. Check-in, Check-out & Identification',
    body: [
      '[Placeholder — Pending Management Approval: Standard check-in time (e.g., TBD), standard check-out time (e.g., TBD), early/late departure fees, and accepted government-issued photo ID rules].',
    ],
    isPlaceholder: true,
    approvalRequiredBy: 'Property Operations Management',
  },
  {
    id: 'cancellations-refunds',
    title: '4. Modifications, Cancellations & Refunds',
    body: [
      'Self-service online cancellation and rescheduling are not currently supported in the automated booking system; guests must contact hotel support directly.',
      '[Placeholder — Pending Management/Legal Approval: Free cancellation cutoff window, no-show charges, partial-stay refunds, and Paystack refund turnaround SLA].',
    ],
    isPlaceholder: true,
    approvalRequiredBy: 'Hotel Management & Legal',
  },
  {
    id: 'house-rules',
    title: '5. Property Conduct, Pets & Smoking',
    body: [
      '[Placeholder — Pending Management Approval: Designated smoking rules, pet allowances, quiet hours, and incidental security deposit requirements].',
    ],
    isPlaceholder: true,
    approvalRequiredBy: 'Property Operations Management',
  },
];

export interface OpenDecisionItem {
  id: number;
  topic: string;
  status: 'Pending Management' | 'Pending Legal' | 'Pending Engineering' | 'Pending Finance';
  summary: string;
}

export const OPEN_PRODUCT_DECISIONS: OpenDecisionItem[] = [
  { id: 1, topic: 'Settlement Currency Standard', status: 'Pending Finance', summary: 'Reconcile Paystack NGN enforcement vs. historical USD/null references in dataset.' },
  { id: 2, topic: 'Standard Check-in & Check-out Hours', status: 'Pending Management', summary: 'Confirm official property check-in, check-out, and early/late surcharge rules.' },
  { id: 3, topic: 'Cancellation & Refund Windows', status: 'Pending Legal', summary: 'Define free cancellation cutoff, no-show fees, and Paystack refund SLAs.' },
  { id: 4, topic: 'Taxes, VAT & Service Charges', status: 'Pending Finance', summary: 'Approve tax breakdown formula on backend booking total calculation.' },
  { id: 5, topic: 'DB Migration Completeness (F-01)', status: 'Pending Engineering', summary: 'Add bookings, payments, reviews, and email_verified* columns to createTables.js.' },
  { id: 6, topic: 'Paystack Webhook Endpoint (F-09)', status: 'Pending Engineering', summary: 'Implement HMAC SHA-512 signed webhook listener for delayed/dropped redirects.' },
  { id: 7, topic: 'Payment Deduplication & Failure Cleanup (F-06/F-07)', status: 'Pending Engineering', summary: 'Prevent duplicate payment rows per booking and clean failed init records.' },
  { id: 8, topic: 'Staff RBAC & Admin Endpoints', status: 'Pending Engineering', summary: 'Build dedicated staff authentication, role middleware, and admin mutation APIs.' },
  { id: 9, topic: 'Self-Service Booking Modification/Cancel', status: 'Pending Engineering', summary: 'Add guest cancellation/reschedule routes aligned with approved refund policy.' },
  { id: 10, topic: 'Password Reset Flow', status: 'Pending Engineering', summary: 'Implement secure time-limited email token password recovery.' },
  { id: 11, topic: 'Rate Limiting, Helmet & Dynamic CORS (F-02/03/04)', status: 'Pending Engineering', summary: 'Harden Express headers, brute-force throttles, and production CORS origin.' },
  { id: 12, topic: 'Verified Property Photography & Copy', status: 'Pending Management', summary: 'Replace illustrative demo imagery and placeholders with verified hotel media.' },
  { id: 13, topic: 'Official Support Channels & SLA', status: 'Pending Management', summary: 'Confirm 24/7 concierge email, phone number, street address, and escalation SLA.' },
  { id: 14, topic: 'NDPA 2023 Legal Sign-off & DPO', status: 'Pending Legal', summary: 'Finalize Privacy Policy retention schedules and publish DPO contact details.' },
  { id: 15, topic: 'DS Notebook Return Bug & Live Model Calibration', status: 'Pending Engineering', summary: 'Fix build_feature_store return in Guest_experience_platform.py and expand beyond 100 rows.' },
];

export const BACKEND_SECURITY_AUDIT_ITEMS = [
  { id: 'F-01', severity: 'Critical', summary: 'database/createTables.js missing bookings, payments, reviews tables & user verification columns.' },
  { id: 'F-02/03/04', severity: 'High', summary: 'Missing Helmet security headers, global/auth rate limiting, and restrictive dynamic CORS config.' },
  { id: 'F-06/07', severity: 'Medium', summary: 'Multiple payment rows per booking allowed; failed Paystack init leaves orphaned pending row.' },
  { id: 'F-08', severity: 'Medium', summary: 'Expired 15-min hold after Paystack capture triggers HTTP 409 requiring staff manual resolution.' },
  { id: 'F-09', severity: 'High', summary: 'No Paystack server-to-server webhook endpoint exists yet (depends on frontend verify redirect).' },
  { id: 'RBAC-01', severity: 'Critical', summary: 'No staff authentication or role-based admin APIs exist in TECHYJAUNT_GROUP_7 (Staff Portal runs in Demo Mode).' },
];
