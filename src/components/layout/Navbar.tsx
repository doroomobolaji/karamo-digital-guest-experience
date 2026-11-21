import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isGuestAuthenticated, guestUser } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Rooms', to: '/rooms' },
    { label: 'About', to: '/about' },
    { label: 'FAQ', to: '/faq' },
    { label: 'Contact', to: '/contact' },
  ];

  const closeMenu = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-ivory/95 backdrop-blur border-b border-sand">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Zone 1: Brand wordmark only */}
        <Link
          to="/"
          className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-forest whitespace-nowrap shrink-0"
        >
          KARAMO Hotels
        </Link>

        {/* Zone 2: Single-line primary nav links */}
        <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-7">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `text-sm font-medium whitespace-nowrap shrink-0 py-2 border-b-2 transition-colors ${
                  isActive
                    ? 'border-forest text-forest'
                    : 'border-transparent text-charcoal/80 hover:text-forest hover:border-gold'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: Sign In / My Account + 1 primary CTA */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          {isGuestAuthenticated && guestUser ? (
            <Link
              to="/account"
              className="inline-flex items-center gap-2 text-sm font-medium text-forest hover:text-evergreen px-3 py-2 rounded-lg hover:bg-sand/50 transition-colors whitespace-nowrap"
            >
              <User className="w-4 h-4" aria-hidden="true" />
              <span>My Account</span>
            </Link>
          ) : (
            <Link
              to="/login"
              state={{ from: location.pathname + location.search }}
              className="text-sm font-medium text-charcoal hover:text-forest px-3 py-2 rounded-lg hover:bg-sand/50 transition-colors whitespace-nowrap"
            >
              Sign In
            </Link>
          )}
          <Link
            to="/rooms"
            className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg bg-forest text-ivory text-sm font-medium hover:bg-evergreen transition-colors whitespace-nowrap"
          >
            Book Now
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation-drawer"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-sand text-forest hover:bg-sand/50"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          id="mobile-navigation-drawer"
          className="lg:hidden border-t border-sand bg-ivory px-4 py-4 space-y-2"
        >
          <nav aria-label="Mobile navigation" className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `px-3 py-3 rounded-lg text-base font-medium min-h-[44px] flex items-center ${
                    isActive ? 'bg-sand text-forest' : 'text-charcoal hover:bg-sand/50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="pt-3 border-t border-sand flex flex-col gap-2">
            {isGuestAuthenticated ? (
              <Link
                to="/account"
                onClick={closeMenu}
                className="min-h-[44px] px-3 py-2.5 rounded-lg border border-forest text-forest font-medium text-center flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" aria-hidden="true" />
                <span>My Account ({guestUser?.full_name.split(' ')[0]})</span>
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={closeMenu}
                className="min-h-[44px] px-3 py-2.5 rounded-lg border border-sand text-charcoal font-medium text-center flex items-center justify-center"
              >
                Sign In / Register
              </Link>
            )}
            <Link
              to="/rooms"
              onClick={closeMenu}
              className="min-h-[44px] px-3 py-2.5 rounded-lg bg-forest text-ivory font-medium text-center flex items-center justify-center"
            >
              Book Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
