export interface FaqEntry {
  id: string;
  number: number;
  category:
    | 'Bookings & Reservations'
    | 'Check-in, Check-out & Property Information'
    | 'Rooms & Amenities'
    | 'Pricing, Payments & Security'
    | 'Accounts, Privacy & Data Protection'
    | 'Reviews & Guest Feedback'
    | 'Customer Support & Escalation';
  question: string;
  answer: string;
  containsPlaceholder?: boolean;
  placeholderNote?: string;
}

export const FAQ_CATEGORIES: FaqEntry['category'][] = [
  'Bookings & Reservations',
  'Check-in, Check-out & Property Information',
  'Rooms & Amenities',
  'Pricing, Payments & Security',
  'Accounts, Privacy & Data Protection',
  'Reviews & Guest Feedback',
  'Customer Support & Escalation',
];

export const APPROVED_FAQS: FaqEntry[] = [
  // Category 1: Bookings & Reservations
  {
    id: 'faq-1',
    number: 1,
    category: 'Bookings & Reservations',
    question: 'How do I book a room at KARAMO Hotels?',
    answer:
      'You can search for available rooms using your check-in date, check-out date, and number of guests on our website. Once you select a room, you will review the booking summary, sign in or create an account, and complete payment to confirm your reservation.',
  },
  {
    id: 'faq-2',
    number: 2,
    category: 'Bookings & Reservations',
    question: 'Is my room reserved as soon as I start checking out?',
    answer:
      'When you create a booking and proceed to payment, your room is placed on a temporary 15-minute soft hold while you complete checkout. Your reservation is only confirmed once payment is successfully verified. If the 15-minute hold expires before payment is verified, the room is released back to availability.',
  },
  {
    id: 'faq-3',
    number: 3,
    category: 'Bookings & Reservations',
    question: 'Can I modify or cancel my reservation online?',
    answer:
      'Online booking modification and self-service cancellation are not currently available through the automated booking system. If you need to change dates, adjust room preferences, or request a cancellation, please contact our support team or front desk directly for assistance.',
    containsPlaceholder: true,
    placeholderNote: 'Exact property cancellation window and modification fee terms require management approval.',
  },
  {
    id: 'faq-4',
    number: 4,
    category: 'Bookings & Reservations',
    question: 'How do I know my booking is confirmed?',
    answer:
      'Your booking is confirmed once Paystack payment has been verified by our backend system and your reservation status updates to "Confirmed" with a booking reference. You can verify your status anytime in the "My Account / My Bookings" section after signing in.',
  },
  {
    id: 'faq-5',
    number: 5,
    category: 'Bookings & Reservations',
    question: 'Can I book a room for someone else?',
    answer:
      'Reservations require an authenticated guest account with a verified email address. Please ensure the guest name and arrival details match the person checking in, and contact our front desk if an alternate primary guest will be arriving.',
    containsPlaceholder: true,
    placeholderNote: 'Third-party check-in ID policy requires property confirmation.',
  },

  // Category 2: Check-in, Check-out & Property Information
  {
    id: 'faq-6',
    number: 6,
    category: 'Check-in, Check-out & Property Information',
    question: 'What are the standard check-in and check-out times?',
    answer:
      'Standard check-in and check-out times are set by property management and will be confirmed on your reservation summary once finalized. [Management Placeholder: Standard check-in / check-out hours awaiting official property confirmation].',
    containsPlaceholder: true,
    placeholderNote: 'Official check-in/out times and early/late policy are pending hotel management confirmation.',
  },
  {
    id: 'faq-7',
    number: 7,
    category: 'Check-in, Check-out & Property Information',
    question: 'Can I request an early check-in or late check-out?',
    answer:
      'Early check-in and late check-out requests are subject to room availability on your arrival or departure date. Please contact our support or front desk team ahead of your stay so our staff can advise on availability and any applicable charges.',
    containsPlaceholder: true,
    placeholderNote: 'Early/late check-out fee structure awaiting management approval.',
  },
  {
    id: 'faq-8',
    number: 8,
    category: 'Check-in, Check-out & Property Information',
    question: 'What identification do I need at check-in?',
    answer:
      'Guests are typically asked to present valid government-issued photo identification and their booking reference at check-in. Specific identification requirements are confirmed prior to arrival by property management.',
    containsPlaceholder: true,
    placeholderNote: 'Exact accepted ID list and incidental deposit rule awaiting management confirmation.',
  },
  {
    id: 'faq-9',
    number: 9,
    category: 'Check-in, Check-out & Property Information',
    question: 'Where is KARAMO Hotels located and is parking or airport transfer available?',
    answer:
      'Verified property address, parking availability, and airport transfer options are displayed once property operations publish confirmed location details. In the meantime, please contact our concierge desk for arrival directions and transfer coordination.',
    containsPlaceholder: true,
    placeholderNote: 'Property street address, parking fees, and shuttle rules require operational verification.',
  },

  // Category 3: Rooms & Amenities
  {
    id: 'faq-10',
    number: 10,
    category: 'Rooms & Amenities',
    question: 'What room types are available at KARAMO Hotels?',
    answer:
      'KARAMO Hotels offers room categories tailored to varied stays, including Standard, Deluxe, Executive, Suite, and Presidential room tiers when configured in the live room catalog. Each listing displays maximum guest capacity, room description, and current nightly rate.',
  },
  {
    id: 'faq-11',
    number: 11,
    category: 'Rooms & Amenities',
    question: 'How many guests can stay in each room?',
    answer:
      'Maximum occupancy varies by room type and is enforced during availability search and booking creation. Entering your exact guest count in the search bar ensures only rooms with sufficient capacity are shown.',
  },
  {
    id: 'faq-12',
    number: 12,
    category: 'Rooms & Amenities',
    question: 'Is breakfast or Wi-Fi included with my stay?',
    answer:
      'Room-level inclusions such as Wi-Fi, breakfast packages, and lounge access depend on the confirmed room rate and property facilities. [Management Placeholder: Complimentary Wi-Fi and breakfast inclusions are pending official confirmation by KARAMO Hotels].',
    containsPlaceholder: true,
    placeholderNote: 'Property amenities and meal inclusions require official property verification.',
  },
  {
    id: 'faq-13',
    number: 13,
    category: 'Rooms & Amenities',
    question: 'Are accessible rooms or special accommodations available?',
    answer:
      'We aim to accommodate accessible room needs, dietary requests, and special stay requirements. Because automated room attributes do not yet filter accessibility features, please contact our team directly prior to booking so we can confirm suitable room allocation.',
  },
  {
    id: 'faq-14',
    number: 14,
    category: 'Rooms & Amenities',
    question: 'What is the policy on pets and smoking?',
    answer:
      'Smoking and pet policies are governed by property house rules. [Management Placeholder: Official pet policy and designated smoking rules are awaiting confirmation by KARAMO Hotels management].',
    containsPlaceholder: true,
    placeholderNote: 'Smoking and pet policies awaiting management sign-off.',
  },

  // Category 4: Pricing, Payments & Security
  {
    id: 'faq-15',
    number: 15,
    category: 'Pricing, Payments & Security',
    question: 'What payment methods are accepted?',
    answer:
      'Online booking payments are processed through Paystack, which supports card payments, bank transfers, USSD, and mobile money channels depending on availability in your region and the merchant checkout configuration.',
  },
  {
    id: 'faq-16',
    number: 16,
    category: 'Pricing, Payments & Security',
    question: 'Is my payment information secure?',
    answer:
      'Yes. Card and payment details are handled directly by Paystack’s PCI-DSS compliant checkout rather than stored on KARAMO Hotels servers. Our backend verifies every transaction directly with Paystack before confirming a booking.',
  },
  {
    id: 'faq-17',
    number: 17,
    category: 'Pricing, Payments & Security',
    question: 'Are taxes and service fees included in the displayed room price?',
    answer:
      'Your authoritative booking total is calculated on our server when you initiate a reservation (nightly rate multiplied by number of nights in the current backend model). Any additional local taxes, VAT, or service fees will be clearly itemized once approved by finance and property management.',
    containsPlaceholder: true,
    placeholderNote: 'Confirmed tax/VAT breakdown and service fee structure awaiting finance approval.',
  },
  {
    id: 'faq-18',
    number: 18,
    category: 'Pricing, Payments & Security',
    question: 'What happens if my payment succeeds after the 15-minute hold expires?',
    answer:
      'If a payment succeeds after your 15-minute temporary room hold has expired, the system flags your reservation for manual resolution rather than double-booking the room. Our team will verify availability or process a manual resolution/refund with you promptly.',
  },
  {
    id: 'faq-19',
    number: 19,
    category: 'Pricing, Payments & Security',
    question: 'Why did my payment show as pending or fail?',
    answer:
      'Bank transfers, USSD, or mobile money authorizations can occasionally take longer than card transactions to settle. Never re-pay blindly if money left your account—note your payment reference and use "Verify Payment" or contact our support desk for a verified status check.',
  },

  // Category 5: Accounts, Privacy & Data Protection
  {
    id: 'faq-20',
    number: 20,
    category: 'Accounts, Privacy & Data Protection',
    question: 'Do I need an account to book a room?',
    answer:
      'You can browse rooms and check date availability without signing in. Creating and verifying an account via email OTP is required to lock in a reservation, complete payment, manage your bookings, and submit stay reviews.',
  },
  {
    id: 'faq-21',
    number: 21,
    category: 'Accounts, Privacy & Data Protection',
    question: 'How does email OTP verification work?',
    answer:
      'After registering with your name, email, phone number, and password, we send a 6-digit One-Time Password (OTP) to your email. The code is valid for 10 minutes (up to 5 verification attempts). You can request a new OTP after a 60-second cooldown.',
  },
  {
    id: 'faq-22',
    number: 22,
    category: 'Accounts, Privacy & Data Protection',
    question: 'How does KARAMO Hotels protect my personal data?',
    answer:
      'Passwords are salted and hashed with bcrypt, OTP codes are hashed with SHA-256, and session tokens are transmitted over HTTPS without being saved in insecure browser storage. Our draft Privacy Policy is aligned with the Nigeria Data Protection Act (NDPA) 2023 and awaits formal legal sign-off.',
  },
  {
    id: 'faq-23',
    number: 23,
    category: 'Accounts, Privacy & Data Protection',
    question: 'What should I do if I forget my password?',
    answer:
      'Self-service password reset is currently being added to the platform. If you are unable to sign in, please contact our support team for account recovery assistance.',
  },

  // Category 6: Reviews & Guest Feedback
  {
    id: 'faq-24',
    number: 24,
    category: 'Reviews & Guest Feedback',
    question: 'When can I leave a review for my stay?',
    answer:
      'To ensure authentic feedback, you can submit one review (1 to 5 stars and an optional comment up to 1,000 characters) from your My Bookings dashboard only for a confirmed, paid booking whose check-out date has arrived or passed.',
  },
  {
    id: 'faq-25',
    number: 25,
    category: 'Reviews & Guest Feedback',
    question: 'Can I edit or delete a review after submitting it?',
    answer:
      'Each completed stay supports one verified review submission, and self-service editing or deletion is not currently available online. Please reach out to guest relations if you need an amendment reviewed.',
  },

  // Category 7: Customer Support & Escalation
  {
    id: 'faq-26',
    number: 26,
    category: 'Customer Support & Escalation',
    question: 'How do I speak with a human member of the KARAMO Hotels team?',
    answer:
      'You can click "Talk to a Human" inside our Virtual Assistant at any time or visit our Contact Us page. Please include your booking reference or payment reference (if applicable) for faster assistance.',
  },
  {
    id: 'faq-27',
    number: 27,
    category: 'Customer Support & Escalation',
    question: 'What can the Virtual Assistant help with, and what does it NOT handle?',
    answer:
      'Our Virtual Assistant answers questions using approved hotel FAQs, helps discover rooms, and can check your own bookings when you are signed in. It cannot issue refunds, bypass payment verification, override hotel policies, or handle safety/medical emergencies—in those cases, it immediately connects you to human staff.',
  },
];
