import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  CreditCard,
  Headphones,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { COURTYARD_DINING_IMAGE, HERO_LOBBY_IMAGE } from '../data/demoSandboxData';
import { APPROVED_FAQS } from '../data/faqData';
import { RoomCard } from '../components/rooms/RoomCard';
import { trackEvent } from '../services/eventTracker';

const DEMO_TESTIMONIALS = [
  {
    id: 'demo-t1',
    quote:
      'Checking availability, verifying my email, and receiving my confirmed booking reference felt effortless and clear from start to finish.',
    author: 'Adaeze N.',
    stayType: 'Suite Stay • Illustrative Demo Review',
  },
  {
    id: 'demo-t2',
    quote:
      'Knowing my room was held for 15 minutes while I completed bank transfer verification gave me real peace of mind during checkout.',
    author: 'Seyi O.',
    stayType: 'Executive Room • Illustrative Demo Review',
  },
  {
    id: 'demo-t3',
    quote:
      'The concierge assistant answered my questions immediately and connected me to front desk support when I asked about arrival timing.',
    author: 'Miriam K.',
    stayType: 'Deluxe King • Illustrative Demo Review',
  },
];

export const HomePage: React.FC = () => {
  const { searchParams, setSearchParams, roomsCatalog, dataMode } = useBooking();
  const [checkIn, setCheckIn] = useState(searchParams.check_in);
  const [checkOut, setCheckOut] = useState(searchParams.check_out);
  const [guestCount, setGuestCount] = useState(searchParams.guest_count);
  const [validationError, setValidationError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!checkIn || !checkOut) {
      setValidationError('Please select both check-in and check-out dates.');
      return;
    }
    if (checkOut <= checkIn) {
      setValidationError('Check-out date must be after check-in date.');
      return;
    }
    if (guestCount < 1) {
      setValidationError('Guest count must be at least 1.');
      return;
    }

    setSearchParams((prev) => ({
      ...prev,
      check_in: checkIn,
      check_out: checkOut,
      guest_count: guestCount,
    }));

    trackEvent('search_submitted', dataMode, {
      check_in: checkIn,
      check_out: checkOut,
      guest_count: guestCount,
      origin: 'homepage_hero',
    });

    const qs = new URLSearchParams({
      check_in: checkIn,
      check_out: checkOut,
      guest_count: String(guestCount),
    });
    navigate(`/rooms?${qs.toString()}`);
  };

  const featuredRooms = roomsCatalog.slice(0, 3);
  const previewFaqs = APPROVED_FAQS.slice(0, 4);

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-evergreen text-ivory overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_LOBBY_IMAGE}
            alt="KARAMO Hotels sunlit lobby sanctuary"
            className="w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-evergreen/75 via-evergreen/60 to-evergreen/90" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
          <div className="max-w-2xl space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              KARAMO Hotels &bull; Contemporary Hospitality
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] text-ivory">
              Calm Architectural Stays, Reserved With Certainty.
            </h1>
            <p className="text-base sm:text-lg text-ivory/90 leading-relaxed max-w-xl">
              Discover curated rooms and suites with real-time availability checks, transparent 15-minute checkout holds, and verified Paystack confirmation.
            </p>
          </div>

          {/* Prominent Availability Search Bar */}
          <form
            onSubmit={handleSearch}
            aria-label="Room availability search"
            className="mt-10 bg-white text-charcoal rounded-2xl border border-sand p-4 sm:p-6 shadow-xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label
                  htmlFor="hero-check-in"
                  className="block text-xs font-semibold uppercase tracking-wide text-charcoal/75 mb-1.5"
                >
                  Check-in Date
                </label>
                <div className="relative">
                  <Calendar
                    className="w-4 h-4 text-forest absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="hero-check-in"
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-lg border border-sand bg-ivory/50 text-sm text-charcoal focus:border-forest focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="hero-check-out"
                  className="block text-xs font-semibold uppercase tracking-wide text-charcoal/75 mb-1.5"
                >
                  Check-out Date
                </label>
                <div className="relative">
                  <Calendar
                    className="w-4 h-4 text-forest absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="hero-check-out"
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-lg border border-sand bg-ivory/50 text-sm text-charcoal focus:border-forest focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="hero-guests"
                  className="block text-xs font-semibold uppercase tracking-wide text-charcoal/75 mb-1.5"
                >
                  Guests
                </label>
                <div className="relative">
                  <Users
                    className="w-4 h-4 text-forest absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <select
                    id="hero-guests"
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-lg border border-sand bg-ivory/50 text-sm text-charcoal focus:border-forest focus:outline-none"
                  >
                    {[1, 2, 3, 4].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] px-5 py-2.5 rounded-lg bg-forest text-ivory text-sm font-semibold hover:bg-evergreen transition-colors inline-flex items-center justify-center gap-2"
              >
                <span>Check Availability</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {validationError && (
              <p role="alert" className="mt-3 text-xs font-medium text-error">
                {validationError}
              </p>
            )}
          </form>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">
              Accommodations
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-charcoal mt-1">
              Featured Rooms &amp; Suites
            </h2>
          </div>
          <Link
            to="/rooms"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-evergreen underline-offset-4 hover:underline"
          >
            <span>Explore all rooms</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              dataMode={dataMode}
              queryString={`?check_in=${encodeURIComponent(checkIn)}&check_out=${encodeURIComponent(
                checkOut
              )}&guest_count=${guestCount}`}
            />
          ))}
        </div>
      </section>

      {/* Brand Introduction & Facilities */}
      <section className="bg-sand/45 border-y border-sand py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <div className="rounded-2xl overflow-hidden border border-sand bg-white">
              <img
                src={COURTYARD_DINING_IMAGE}
                alt="KARAMO Hotels courtyard terrace lounge (illustrative preview)"
                className="w-full aspect-[4/3] object-cover"
                loading="lazy"
              />
              <p className="px-4 py-2.5 text-xs text-charcoal/70 bg-ivory border-t border-sand">
                Illustrative architectural courtyard preview — official property facilities &amp; dining hours are confirmed during operational onboarding.
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">
              The KARAMO Standard
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-charcoal leading-tight">
              Built on Transparent Pricing, Verified Reservations, and Calm Design.
            </h2>
            <p className="text-base text-charcoal/85 leading-relaxed">
              Every detail of the KARAMO Hotels digital experience mirrors the clarity of our spaces. You see exact room capacity, server-verified nightly calculations, and real-time hold protection before completing payment.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl bg-white border border-sand p-4">
                <ShieldCheck className="w-5 h-5 text-forest mb-2" aria-hidden="true" />
                <h3 className="font-sans text-sm font-semibold text-charcoal">
                  15-Minute Room Hold
                </h3>
                <p className="text-xs text-charcoal/75 mt-1 leading-relaxed">
                  Creating a reservation places a temporary soft hold so your room is protected while Paystack verifies your transaction.
                </p>
              </div>
              <div className="rounded-xl bg-white border border-sand p-4">
                <CreditCard className="w-5 h-5 text-forest mb-2" aria-hidden="true" />
                <h3 className="font-sans text-sm font-semibold text-charcoal">
                  Paystack Verified Checkout
                </h3>
                <p className="text-xs text-charcoal/75 mt-1 leading-relaxed">
                  Card details never touch KARAMO servers; bookings confirm strictly after backend Paystack verification.
                </p>
              </div>
              <div className="rounded-xl bg-white border border-sand p-4">
                <CheckCircle2 className="w-5 h-5 text-forest mb-2" aria-hidden="true" />
                <h3 className="font-sans text-sm font-semibold text-charcoal">
                  OTP-Verified Accounts
                </h3>
                <p className="text-xs text-charcoal/75 mt-1 leading-relaxed">
                  6-digit email verification protects every guest profile, booking history view, and verified post-stay review.
                </p>
              </div>
              <div className="rounded-xl bg-white border border-sand p-4">
                <Headphones className="w-5 h-5 text-forest mb-2" aria-hidden="true" />
                <h3 className="font-sans text-sm font-semibold text-charcoal">
                  Concierge &amp; Human Escalation
                </h3>
                <p className="text-xs text-charcoal/75 mt-1 leading-relaxed">
                  Our AI assistant answers approved FAQs around the clock with one-click handoff to human staff anytime.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:text-evergreen underline-offset-4 hover:underline"
              >
                <span>Read more about KARAMO Hotels</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Demonstration Testimonials (Explicitly Labelled) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">
              Guest Experience Previews
            </p>
            <h2 className="font-display text-3xl font-semibold text-charcoal mt-1">
              Demonstration Guest Voices
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-charcoal/75 px-3 py-1.5 rounded-md border border-sand bg-white">
            <Sparkles className="w-3.5 h-3.5 text-gold" aria-hidden="true" />
            <span>Illustrative demo copy — verified guest reviews populate after completed stays</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEMO_TESTIMONIALS.map((item) => (
            <blockquote
              key={item.id}
              className="rounded-xl border border-sand bg-white p-6 flex flex-col justify-between gap-4"
            >
              <p className="text-sm text-charcoal/90 leading-relaxed italic">
                &ldquo;{item.quote}&rdquo;
              </p>
              <footer className="pt-3 border-t border-sand/70">
                <p className="text-sm font-semibold text-charcoal">{item.author}</p>
                <p className="text-xs text-charcoal/65">{item.stayType}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* FAQ Preview & CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-2xl border border-sand bg-white p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">
                Common Questions
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-charcoal mt-1">
                Before You Reserve
              </h2>
            </div>
            <Link
              to="/faq"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline"
            >
              <span>Browse all 27 FAQs</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {previewFaqs.map((faq) => (
              <div key={faq.id} className="rounded-xl border border-sand/80 bg-ivory/50 p-4">
                <h3 className="font-sans text-sm font-semibold text-charcoal">{faq.question}</h3>
                <p className="text-xs text-charcoal/80 mt-2 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-sand flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-charcoal/85">
              Ready to plan your stay or need tailored support for a group booking?
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="min-h-[44px] px-5 py-2.5 rounded-lg border border-forest text-forest text-sm font-medium hover:bg-sand/50 inline-flex items-center justify-center"
              >
                Contact Concierge
              </Link>
              <Link
                to="/rooms"
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-forest text-ivory text-sm font-medium hover:bg-evergreen inline-flex items-center justify-center"
              >
                Search Rooms
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
