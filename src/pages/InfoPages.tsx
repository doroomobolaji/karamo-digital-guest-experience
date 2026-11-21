import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, ChevronDown, Search } from 'lucide-react';
import { APPROVED_FAQS, FAQ_CATEGORIES } from '../data/faqData';
import { PRIVACY_POLICY_DRAFT, TERMS_AND_CONDITIONS_DRAFT } from '../data/policiesData';
import { COURTYARD_DINING_IMAGE, HERO_LOBBY_IMAGE } from '../data/demoSandboxData';
import { Breadcrumbs, PlaceholderNotice } from '../components/ui/Primitives';

export const AboutPage: React.FC = () => (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
    <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'About Us' }]} />

    <header className="space-y-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">
        About KARAMO Hotels
      </p>
      <h1 className="font-display text-4xl sm:text-5xl font-semibold text-charcoal">
        Hospitality Grounded in Clarity, Calm Design, and Trust.
      </h1>
      <p className="text-base text-charcoal/85 leading-relaxed max-w-3xl">
        KARAMO Hotels delivers a unified digital and on-property guest experience—pairing serene architectural interiors with transparent room availability, secure email-verified reservations, and attentive human support.
      </p>
    </header>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="rounded-2xl overflow-hidden border border-sand bg-white">
        <img
          src={HERO_LOBBY_IMAGE}
          alt="KARAMO Hotels lobby architectural preview"
          className="w-full aspect-[4/3] object-cover"
        />
        <p className="px-4 py-2.5 text-xs text-charcoal/70 border-t border-sand">
          Illustrative lobby visual — official property photography pending management upload.
        </p>
      </div>
      <div className="rounded-2xl overflow-hidden border border-sand bg-white">
        <img
          src={COURTYARD_DINING_IMAGE}
          alt="KARAMO Hotels courtyard preview"
          className="w-full aspect-[4/3] object-cover"
        />
        <p className="px-4 py-2.5 text-xs text-charcoal/70 border-t border-sand">
          Illustrative courtyard dining preview — operating hours &amp; dining menus awaiting confirmation.
        </p>
      </div>
    </div>

    <PlaceholderNotice title="Editable Corporate & Property Details (Pending Management Confirmation)">
      Verified founding history, official street addresses across branches, star-rating certifications, and published hospitality awards have not yet been supplied in the source specification. No unverified facts or fabricated awards are displayed here—update this section once approved property copy is delivered.
    </PlaceholderNotice>

    <div className="flex flex-wrap gap-3">
      <Link
        to="/rooms"
        className="min-h-[44px] px-5 py-2.5 rounded-lg bg-forest text-ivory text-sm font-semibold inline-flex items-center"
      >
        Explore Rooms
      </Link>
      <Link
        to="/contact"
        className="min-h-[44px] px-5 py-2.5 rounded-lg border border-sand bg-white text-charcoal text-sm font-medium inline-flex items-center"
      >
        Contact Our Team
      </Link>
    </div>
  </div>
);

export const ContactPage: React.FC = () => {
  const location = useLocation();
  const state = (location.state as { prefillReference?: string; escalatedFromAssistant?: boolean } | null) || {};

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState(
    state.escalatedFromAssistant ? 'Assistant Escalation / Human Support' : 'Reservation Question'
  );
  const [reference, setReference] = useState(state.prefillReference || '');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || message.trim().length < 10) {
      setError('Please enter your name, a valid email address, and at least 10 characters in your message.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Contact Us' }]} />

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">
          Guest Support &amp; Escalation
        </p>
        <h1 className="font-display text-4xl font-semibold text-charcoal mt-1">
          Contact KARAMO Hotels
        </h1>
        <p className="text-sm sm:text-base text-charcoal/80 mt-2 max-w-2xl">
          Reach out for reservation modifications, cancellations, payment reference checks (including 409 manual resolutions), or special stay accommodations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 rounded-2xl border border-sand bg-white p-6 sm:p-8">
          {submitted ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-success font-semibold">
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                <span>Support Request Preview Recorded (Frontend Demo Boundary)</span>
              </div>
              <p className="text-sm text-charcoal/85 leading-relaxed">
                Thank you, <strong>{name}</strong>. Because a dedicated CRM/ticketing email endpoint is not yet connected in the transactional backend, this submission demonstrates client-side validation only and has not been dispatched to an external inbox.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setMessage('');
                }}
                className="min-h-[44px] px-4 py-2 rounded-lg border border-forest text-forest text-sm font-medium"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-xl border border-gold/50 bg-sand/35 p-3 text-xs text-charcoal/85">
                <strong>Integration Notice:</strong> This form validates input and simulates submission cleanly in the browser until an official hotel helpdesk/ticketing endpoint is configured.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-semibold uppercase text-charcoal/75 mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-sand bg-ivory/50 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-xs font-semibold uppercase text-charcoal/75 mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-sand bg-ivory/50 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-topic" className="block text-xs font-semibold uppercase text-charcoal/75 mb-1.5">
                    Topic
                  </label>
                  <select
                    id="contact-topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-sand bg-ivory/50 text-sm"
                  >
                    <option value="Reservation Question">Reservation Question</option>
                    <option value="Modification or Cancellation Request">Modification or Cancellation Request</option>
                    <option value="Payment Reference / 409 Manual Resolution">Payment Reference / 409 Manual Resolution</option>
                    <option value="Assistant Escalation / Human Support">Assistant Escalation / Human Support</option>
                    <option value="Accessibility / Special Accommodation">Accessibility / Special Accommodation</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="contact-ref" className="block text-xs font-semibold uppercase text-charcoal/75 mb-1.5">
                    Booking / Payment Reference (Optional)
                  </label>
                  <input
                    id="contact-ref"
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g., booking-123-..."
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-sand bg-ivory/50 text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-semibold uppercase text-charcoal/75 mb-1.5">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-sand bg-ivory/50 text-sm"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm font-medium text-error">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="min-h-[48px] px-6 py-3 rounded-lg bg-forest text-ivory text-sm font-semibold hover:bg-evergreen"
              >
                Submit Support Request
              </button>
            </form>
          )}
        </div>

        <aside className="lg:col-span-5 space-y-4">
          <PlaceholderNotice title="Editable Property Contact Details">
            <ul className="space-y-2 text-xs mt-2">
              <li>
                <strong>Reservations Email:</strong> [Editable Placeholder — Pending Official Domain Email]
              </li>
              <li>
                <strong>Front Desk Phone:</strong> [Editable Placeholder — Pending Official Hotline]
              </li>
              <li>
                <strong>Property Address:</strong> [Editable Placeholder — Pending Verified Street Address]
              </li>
              <li>
                <strong>Response SLA:</strong> [Editable Placeholder — Pending Operations Sign-off]
              </li>
            </ul>
          </PlaceholderNotice>
        </aside>
      </div>
    </div>
  );
};

export const FaqPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openId, setOpenId] = useState<string | null>(APPROVED_FAQS[0].id);

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return APPROVED_FAQS.filter((faq) => {
      const catMatch = selectedCategory === 'All' || faq.category === selectedCategory;
      const textMatch =
        !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q) ||
        faq.category.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [query, selectedCategory]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'FAQ' }]} />

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">
          Approved Knowledge Base (27 Questions)
        </p>
        <h1 className="font-display text-4xl font-semibold text-charcoal mt-1">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-charcoal/80 mt-2 max-w-2xl">
          Synchronized directly with our Virtual Assistant knowledge base. Questions involving unverified property specifics are marked clearly as pending management confirmation.
        </p>
      </div>

      {/* Search & Category Filter */}
      <div className="rounded-2xl border border-sand bg-white p-4 sm:p-5 space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-forest absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            aria-label="Search FAQs"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bookings, 15-minute hold, Paystack, OTP, reviews..."
            className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-lg border border-sand bg-ivory/50 text-sm focus:border-forest focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {['All', ...FAQ_CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                selectedCategory === cat
                  ? 'bg-forest text-ivory border-forest'
                  : 'bg-ivory/60 text-charcoal border-sand hover:border-forest'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div key={faq.id} className="rounded-xl border border-sand bg-white overflow-hidden">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-ivory/50"
              >
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-forest">
                    Q{faq.number} &bull; {faq.category}
                  </span>
                  <h2 className="font-sans text-base font-semibold text-charcoal mt-0.5">
                    {faq.question}
                  </h2>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-forest shrink-0 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-sm text-charcoal/85 leading-relaxed border-t border-sand/60 space-y-2">
                  <p>{faq.answer}</p>
                  {faq.containsPlaceholder && faq.placeholderNote && (
                    <p className="text-xs text-warning bg-[#FAF2E1] border border-[#E8CF9D] rounded-lg px-3 py-2">
                      <strong>Management Confirmation Needed:</strong> {faq.placeholderNote}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const PrivacyPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
    <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Privacy Policy (Draft)' }]} />
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-warning">
        Draft Document &bull; Legal Review Required Before Production
      </p>
      <h1 className="font-display text-4xl font-semibold text-charcoal mt-1">
        Privacy Policy
      </h1>
    </div>

    <div className="space-y-4">
      {PRIVACY_POLICY_DRAFT.map((section) => (
        <section
          key={section.id}
          className={`rounded-2xl border p-6 space-y-2.5 ${
            section.isPlaceholder
              ? 'border-gold/60 bg-sand/35'
              : 'border-sand bg-white'
          }`}
        >
          <h2 className="font-display text-xl font-semibold text-charcoal">{section.title}</h2>
          {section.body.map((p, i) => (
            <p key={i} className="text-sm text-charcoal/85 leading-relaxed">
              {p}
            </p>
          ))}
          {section.approvalRequiredBy && (
            <p className="text-xs font-semibold text-warning pt-1">
              Required Approval: {section.approvalRequiredBy}
            </p>
          )}
        </section>
      ))}
    </div>
  </div>
);

export const TermsPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
    <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Terms & Conditions' }]} />
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-warning">
        Editable Policy Framework &bull; Pending Management &amp; Legal Sign-off
      </p>
      <h1 className="font-display text-4xl font-semibold text-charcoal mt-1">
        Terms &amp; Conditions
      </h1>
    </div>

    <div className="space-y-4">
      {TERMS_AND_CONDITIONS_DRAFT.map((section) => (
        <section
          key={section.id}
          className={`rounded-2xl border p-6 space-y-2.5 ${
            section.isPlaceholder
              ? 'border-gold/60 bg-sand/35'
              : 'border-sand bg-white'
          }`}
        >
          <h2 className="font-display text-xl font-semibold text-charcoal">{section.title}</h2>
          {section.body.map((p, i) => (
            <p key={i} className="text-sm text-charcoal/85 leading-relaxed">
              {p}
            </p>
          ))}
          {section.approvalRequiredBy && (
            <p className="text-xs font-semibold text-warning pt-1">
              Required Approval: {section.approvalRequiredBy}
            </p>
          )}
        </section>
      ))}
    </div>
  </div>
);

export const CareersPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
    <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Careers' }]} />
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">
        Hospitality Talent
      </p>
      <h1 className="font-display text-4xl font-semibold text-charcoal mt-1">
        Careers at KARAMO Hotels
      </h1>
    </div>

    <div className="rounded-2xl border border-sand bg-white p-6 sm:p-8 space-y-4">
      <h2 className="font-display text-2xl font-semibold text-charcoal">
        No Currently Published Vacancies
      </h2>
      <p className="text-sm text-charcoal/85 leading-relaxed">
        KARAMO Hotels does not currently have published open positions, compensation bands, or departmental listings on this portal. We do not invent placeholder vacancies or unverified benefits.
      </p>
      <PlaceholderNotice title="Editable Recruitment Contact Route">
        Prospective hospitality professionals may reach out once official HR recruitment details are published: <strong>[Editable Placeholder: hr-recruitment@karamo-placeholder.example]</strong>, or submit a general inquiry via our{' '}
        <Link to="/contact" className="text-forest font-semibold underline">
          Contact Page
        </Link>
        .
      </PlaceholderNotice>
    </div>
  </div>
);
