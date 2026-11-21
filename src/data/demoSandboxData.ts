import type { Hotel, Room, StaffDemoAccount } from '../types/api';

// Isolated Sandbox / Demo catalog matching TECHYJAUNT_GROUP_7 PostgreSQL table schema
// Used ONLY when live BACKEND_API_URL is unconfigured/unreachable and clearly marked SANDBOX DEMO.

export const ROOM_TYPE_IMAGES: Record<string, string> = {
  Standard: '/src/assets/images/room_standard_karamo_1795235801949.jpg',
  Deluxe: '/src/assets/images/room_deluxe_karamo_1795235801641.jpg',
  Executive: '/src/assets/images/room_executive_karamo_1795235801788.jpg',
  Suite: '/src/assets/images/room_suite_presidential_1795235802273.jpg',
  Presidential: '/src/assets/images/room_suite_presidential_1795235802273.jpg',
};

export const HERO_LOBBY_IMAGE = '/src/assets/images/hero_karamo_lobby_1795235800926.jpg';
export const COURTYARD_DINING_IMAGE = '/src/assets/images/hotel_courtyard_dining_1795235801771.jpg';

export function resolveRoomImage(roomType: string): string {
  const key = Object.keys(ROOM_TYPE_IMAGES).find((k) =>
    roomType.toLowerCase().includes(k.toLowerCase())
  );
  return key ? ROOM_TYPE_IMAGES[key] : ROOM_TYPE_IMAGES.Deluxe;
}

export const SANDBOX_HOTELS: Hotel[] = [
  {
    id: 1,
    name: 'KARAMO Hotels — Flagship Sanctuary',
    location: '[Location Placeholder — Pending Operational Confirmation]',
    description:
      'Contemporary boutique hospitality combining calm travertine and timber architecture with personalized digital guest service.',
  },
];

export const SANDBOX_ROOMS: Room[] = [
  {
    id: 101,
    hotel_id: 1,
    hotel_name: 'KARAMO Hotels — Flagship Sanctuary',
    hotel_location: '[Location Placeholder]',
    room_type: 'Standard',
    price_per_night: 35000,
    capacity: 2,
    description:
      'Refined contemporary guestroom designed for restorative solo or dual stays with warm oak finishes and tailored linen bedding.',
    image_url: ROOM_TYPE_IMAGES.Standard,
    illustrative_amenities: ['Workspace Desk', 'Climate Control', 'En-suite Rain Shower', 'In-Room Safe'],
    bed_configuration_placeholder: 'Queen Bed [Confirm with Property]',
    room_size_placeholder: 'Approx. 28 sqm [Illustrative]',
  },
  {
    id: 102,
    hotel_id: 1,
    hotel_name: 'KARAMO Hotels — Flagship Sanctuary',
    hotel_location: '[Location Placeholder]',
    room_type: 'Deluxe',
    price_per_night: 55000,
    capacity: 2,
    description:
      'Spacious sunlit sanctuary with a dedicated reading armchair, floor-to-ceiling drapery, and serene botanical tones.',
    image_url: ROOM_TYPE_IMAGES.Deluxe,
    illustrative_amenities: ['Lounge Armchair', 'Tea & Coffee Station', 'En-suite Rain Shower', 'Smart TV'],
    bed_configuration_placeholder: 'King Bed [Confirm with Property]',
    room_size_placeholder: 'Approx. 36 sqm [Illustrative]',
  },
  {
    id: 103,
    hotel_id: 1,
    hotel_name: 'KARAMO Hotels — Flagship Sanctuary',
    hotel_location: '[Location Placeholder]',
    room_type: 'Executive',
    price_per_night: 80000,
    capacity: 3,
    description:
      'Tailored for productive extended stays featuring a walnut writing desk, seating alcove, and quiet acoustic insulation.',
    image_url: ROOM_TYPE_IMAGES.Executive,
    illustrative_amenities: ['Executive Walnut Desk', 'Seating Alcove', 'Dedicated Express Check-in Support', 'Robes & Slippers'],
    bed_configuration_placeholder: 'King Bed + Optional Daybed [Confirm with Property]',
    room_size_placeholder: 'Approx. 45 sqm [Illustrative]',
  },
  {
    id: 104,
    hotel_id: 1,
    hotel_name: 'KARAMO Hotels — Flagship Sanctuary',
    hotel_location: '[Location Placeholder]',
    room_type: 'Suite',
    price_per_night: 125000,
    capacity: 4,
    description:
      'Generous open-plan suite pairing a velvet salon lounge with a private master bedroom sanctuary for multi-night comfort.',
    image_url: ROOM_TYPE_IMAGES.Suite,
    illustrative_amenities: ['Separate Living Salon', 'Dining Table', 'Soaking Tub & Shower', 'Priority Concierge Access'],
    bed_configuration_placeholder: 'King Canopy + Lounge Sofa [Confirm with Property]',
    room_size_placeholder: 'Approx. 68 sqm [Illustrative]',
  },
  {
    id: 105,
    hotel_id: 1,
    hotel_name: 'KARAMO Hotels — Flagship Sanctuary',
    hotel_location: '[Location Placeholder]',
    room_type: 'Presidential',
    price_per_night: 200000,
    capacity: 4,
    description:
      'Flagship architectural residence offering panoramic courtyard light, bespoke dining lounge, and dedicated hospitality coordination.',
    image_url: ROOM_TYPE_IMAGES.Presidential,
    illustrative_amenities: ['Private Lounge & Dining', 'Terrace Access', 'Dual Vanity Bath', 'Dedicated Guest Coordinator'],
    bed_configuration_placeholder: 'Master King Residence [Confirm with Property]',
    room_size_placeholder: 'Approx. 105 sqm [Illustrative]',
  },
];

export const SANDBOX_STAFF_ACCOUNTS: StaffDemoAccount[] = [
  {
    id: 'staff-fd-01',
    display_name: 'Amara Okafor (Demo)',
    role: 'front_desk',
    role_label: 'Front Desk Reception',
    department: 'Guest Arrival & Reservations',
  },
  {
    id: 'staff-sv-02',
    display_name: 'Tunde Adeyemi (Demo)',
    role: 'service_staff',
    role_label: 'Guest Service & Housekeeping',
    department: 'Room Readiness & Concierge',
  },
  {
    id: 'staff-hm-03',
    display_name: 'Chidinma Nwosu (Demo)',
    role: 'hotel_manager',
    role_label: 'Hotel Operations Manager',
    department: 'Property Operations',
  },
  {
    id: 'staff-fn-04',
    display_name: 'Ibrahim Musa (Demo)',
    role: 'finance',
    role_label: 'Finance & Reconciliation',
    department: 'Paystack & Revenue Control',
  },
  {
    id: 'staff-ad-05',
    display_name: 'Kemi Balogun (Demo)',
    role: 'platform_admin',
    role_label: 'Platform Administrator',
    department: 'System Config & Security',
  },
];

export interface DemoOperationalBooking {
  booking_id: string;
  guest_ref: string;
  guest_display_masked: string;
  room_type: string;
  check_in: string;
  check_out: string;
  guest_count: number;
  total_amount: number;
  booking_status: 'Confirmed' | 'Completed' | 'Cancelled' | 'Pending Hold';
  payment_status: 'Paid' | 'Refunded' | 'Pending' | 'Manual Resolution (409)';
  payment_method: 'Card' | 'Mobile Money' | 'USSD' | 'Bank Transfer';
  room_readiness: 'Clean & Inspected' | 'Occupied' | 'Turnover Scheduled';
  note?: string;
}

export const DEMO_OPERATIONAL_BOOKINGS: DemoOperationalBooking[] = [
  {
    booking_id: 'DEMO-BK-901',
    guest_ref: 'USR-DEMO-101',
    guest_display_masked: 'Guest A*** O.',
    room_type: 'Suite',
    check_in: '2026-04-12',
    check_out: '2026-04-16',
    guest_count: 2,
    total_amount: 500000,
    booking_status: 'Confirmed',
    payment_status: 'Paid',
    payment_method: 'Card',
    room_readiness: 'Clean & Inspected',
  },
  {
    booking_id: 'DEMO-BK-902',
    guest_ref: 'USR-DEMO-102',
    guest_display_masked: 'Guest D*** M.',
    room_type: 'Deluxe',
    check_in: '2026-04-10',
    check_out: '2026-04-12',
    guest_count: 2,
    total_amount: 110000,
    booking_status: 'Pending Hold',
    payment_status: 'Manual Resolution (409)',
    payment_method: 'Mobile Money',
    room_readiness: 'Turnover Scheduled',
    note: 'Simulated F-08 case: Paystack capture arrived after 15-min hold expiry.',
  },
  {
    booking_id: 'DEMO-BK-903',
    guest_ref: 'USR-DEMO-103',
    guest_display_masked: 'Guest E*** K.',
    room_type: 'Standard',
    check_in: '2026-04-02',
    check_out: '2026-04-05',
    guest_count: 1,
    total_amount: 105000,
    booking_status: 'Completed',
    payment_status: 'Paid',
    payment_method: 'USSD',
    room_readiness: 'Clean & Inspected',
  },
  {
    booking_id: 'DEMO-BK-904',
    guest_ref: 'USR-DEMO-104',
    guest_display_masked: 'Guest F*** B.',
    room_type: 'Executive',
    check_in: '2026-04-07',
    check_out: '2026-04-09',
    guest_count: 2,
    total_amount: 160000,
    booking_status: 'Cancelled',
    payment_status: 'Refunded',
    payment_method: 'Bank Transfer',
    room_readiness: 'Clean & Inspected',
  },
  {
    booking_id: 'DEMO-BK-905',
    guest_ref: 'USR-DEMO-105',
    guest_display_masked: 'Guest S*** T.',
    room_type: 'Presidential',
    check_in: '2026-04-18',
    check_out: '2026-04-21',
    guest_count: 4,
    total_amount: 600000,
    booking_status: 'Confirmed',
    payment_status: 'Paid',
    payment_method: 'Card',
    room_readiness: 'Clean & Inspected',
  },
];
