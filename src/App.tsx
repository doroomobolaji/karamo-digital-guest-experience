import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { GuestLayout } from './components/layout/GuestLayout';
import { HomePage } from './pages/HomePage';
import { RoomsPage } from './pages/RoomsPage';
import { RoomDetailPage } from './pages/RoomDetailPage';
import { BookingFlowPage } from './pages/BookingFlowPage';
import { LoginPage, RegisterPage, VerifyEmailPage } from './pages/AuthPages';
import { MyAccountPage } from './pages/MyAccountPage';
import {
  AboutPage,
  CareersPage,
  ContactPage,
  FaqPage,
  PrivacyPage,
  TermsPage,
} from './pages/InfoPages';
import { StaffLoginPage } from './pages/staff/StaffLoginPage';
import { StaffPortalPage } from './pages/staff/StaffPortalPage';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BookingProvider>
          <ScrollToTop />
          <Routes>
            {/* Separate Staff / Admin Portal Routes */}
            <Route path="/staff/login" element={<StaffLoginPage />} />
            <Route path="/staff/portal" element={<StaffPortalPage />} />
            <Route path="/staff" element={<Navigate to="/staff/login" replace />} />

            {/* Public Guest Experience Routes */}
            <Route
              path="/"
              element={
                <GuestLayout>
                  <HomePage />
                </GuestLayout>
              }
            />
            <Route
              path="/rooms"
              element={
                <GuestLayout>
                  <RoomsPage />
                </GuestLayout>
              }
            />
            <Route
              path="/rooms/:id"
              element={
                <GuestLayout>
                  <RoomDetailPage />
                </GuestLayout>
              }
            />
            <Route
              path="/booking"
              element={
                <GuestLayout>
                  <BookingFlowPage />
                </GuestLayout>
              }
            />
            <Route
              path="/login"
              element={
                <GuestLayout>
                  <LoginPage />
                </GuestLayout>
              }
            />
            <Route
              path="/register"
              element={
                <GuestLayout>
                  <RegisterPage />
                </GuestLayout>
              }
            />
            <Route
              path="/verify-email"
              element={
                <GuestLayout>
                  <VerifyEmailPage />
                </GuestLayout>
              }
            />
            <Route
              path="/account"
              element={
                <GuestLayout>
                  <MyAccountPage />
                </GuestLayout>
              }
            />
            <Route
              path="/about"
              element={
                <GuestLayout>
                  <AboutPage />
                </GuestLayout>
              }
            />
            <Route
              path="/contact"
              element={
                <GuestLayout>
                  <ContactPage />
                </GuestLayout>
              }
            />
            <Route
              path="/faq"
              element={
                <GuestLayout>
                  <FaqPage />
                </GuestLayout>
              }
            />
            <Route
              path="/privacy"
              element={
                <GuestLayout>
                  <PrivacyPage />
                </GuestLayout>
              }
            />
            <Route
              path="/terms"
              element={
                <GuestLayout>
                  <TermsPage />
                </GuestLayout>
              }
            />
            <Route
              path="/careers"
              element={
                <GuestLayout>
                  <CareersPage />
                </GuestLayout>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BookingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
