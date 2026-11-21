import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ConnectionBoundaryBanner } from '../ui/Primitives';
import { useBooking } from '../../context/BookingContext';
import { ConciergeWidget } from '../assistant/ConciergeWidget';

export const GuestLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { dataMode, setDataMode, systemStatus } = useBooking();

  return (
    <div className="min-h-screen flex flex-col bg-ivory text-charcoal">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-forest focus:text-ivory focus:rounded-md"
      >
        Skip to main content
      </a>
      <Navbar />
      <ConnectionBoundaryBanner
        dataMode={dataMode}
        onSwitchMode={setDataMode}
        transactionalReachable={systemStatus.transactionalReachable}
      />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
      <ConciergeWidget />
    </div>
  );
};
