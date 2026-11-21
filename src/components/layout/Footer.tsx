import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-evergreen text-ivory border-t border-gold/20 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Brand */}
          <div className="space-y-3">
            <p className="font-display text-2xl font-semibold text-ivory tracking-tight">
              KARAMO Hotels
            </p>
            <p className="text-sm text-ivory/80 leading-relaxed">
              Thoughtful contemporary hospitality designed around calm spaces, transparent reservations, and attentive concierge support.
            </p>
            <p className="text-xs text-gold/90 pt-1">
              [Property Address &amp; Direct Phone Placeholder — Pending Official Operations Confirmation]
            </p>
          </div>

          {/* Column 2: Explore */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gold mb-4">
              Explore
            </h2>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-ivory/85 hover:text-ivory underline-offset-4 hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/rooms" className="text-ivory/85 hover:text-ivory underline-offset-4 hover:underline">
                  Rooms &amp; Availability
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-ivory/85 hover:text-ivory underline-offset-4 hover:underline">
                  About KARAMO Hotels
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-ivory/85 hover:text-ivory underline-offset-4 hover:underline">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Guest Support */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gold mb-4">
              Guest Support
            </h2>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/faq" className="text-ivory/85 hover:text-ivory underline-offset-4 hover:underline">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-ivory/85 hover:text-ivory underline-offset-4 hover:underline">
                  Contact Concierge
                </Link>
              </li>
              <li>
                <Link to="/account" className="text-ivory/85 hover:text-ivory underline-offset-4 hover:underline">
                  My Bookings &amp; Reviews
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-ivory/85 hover:text-ivory underline-offset-4 hover:underline">
                  Guest Sign In / Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Policies & Operations */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gold mb-4">
              Policies &amp; Operations
            </h2>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/privacy" className="text-ivory/85 hover:text-ivory underline-offset-4 hover:underline">
                  Privacy Policy (Draft)
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-ivory/85 hover:text-ivory underline-offset-4 hover:underline">
                  Terms &amp; Conditions
                </Link>
              </li>
              <li className="pt-2 border-t border-ivory/15">
                <Link
                  to="/staff/login"
                  className="inline-flex items-center gap-1.5 text-gold hover:text-ivory font-medium underline-offset-4 hover:underline"
                >
                  Staff &amp; Operations Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-ivory/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-ivory/70">
          <p>&copy; {new Date().getFullYear()} KARAMO Hotels. Digital Guest Experience Platform.</p>
          <p>Paystack PCI-DSS Checkout Boundary &bull; NDPA 2023 Draft Alignment</p>
        </div>
      </div>
    </footer>
  );
};
