import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BedDouble,
  ClipboardList,
  CreditCard,
  Database,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  DEMO_OPERATIONAL_BOOKINGS,
  SANDBOX_STAFF_ACCOUNTS,
  type DemoOperationalBooking,
} from '../../data/demoSandboxData';
import {
  HISTORICAL_DATASET_SUMMARY,
  formatDsAmount,
  formatDsCompact,
} from '../../data/historicalDsDataset';
import {
  BACKEND_SECURITY_AUDIT_ITEMS,
  OPEN_PRODUCT_DECISIONS,
} from '../../data/policiesData';
import {
  fetchBookingInsights,
  fetchCheckoutHealth,
  fetchGuestProfile,
} from '../../services/analyticsApi';
import { getTrackedEvents, subscribeTrackedEvents } from '../../services/eventTracker';
import type {
  BookingInsightsResponse,
  CheckoutHealthResponse,
  GuestProfileResponse,
  StaffRole,
  TrackedEvent,
} from '../../types/api';
import {
  StatusBadge,
  formatTransactionalMoney,
  mapBookingStatusTone,
  mapPaymentStatusTone,
} from '../../components/ui/Primitives';

type StaffSectionId =
  | 'overview'
  | 'bookings'
  | 'rooms'
  | 'ds_insights'
  | 'checkout_health'
  | 'telemetry'
  | 'roles'
  | 'config';

const ROLE_ALLOWED_SECTIONS: Record<StaffRole, StaffSectionId[]> = {
  front_desk: ['overview', 'bookings', 'rooms'],
  service_staff: ['overview', 'rooms'],
  hotel_manager: ['overview', 'bookings', 'rooms', 'ds_insights', 'checkout_health', 'telemetry', 'config'],
  finance: ['overview', 'bookings', 'ds_insights', 'checkout_health'],
  platform_admin: ['overview', 'bookings', 'rooms', 'ds_insights', 'checkout_health', 'telemetry', 'roles', 'config'],
};

const SECTION_META: Array<{ id: StaffSectionId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Operational Overview', icon: Activity },
  { id: 'bookings', label: 'Demo Bookings & 409 Queue', icon: ClipboardList },
  { id: 'rooms', label: 'Room Readiness & Occupancy', icon: BedDouble },
  { id: 'ds_insights', label: 'Historical DS Insights', icon: BarChart3 },
  { id: 'checkout_health', label: 'Checkout Health & Friction', icon: CreditCard },
  { id: 'telemetry', label: 'Session Event Telemetry', icon: Database },
  { id: 'roles', label: 'User & Role Management', icon: Users },
  { id: 'config', label: 'Config & Security Audit', icon: Settings },
];

export const StaffPortalPage: React.FC = () => {
  const { staffUser, isStaffAuthenticated, switchStaffRoleDemo, signOutStaffDemo } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<StaffSectionId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Demo operational state (local only — clearly separated from live DB)
  const [demoBookings, setDemoBookings] = useState<DemoOperationalBooking[]>(DEMO_OPERATIONAL_BOOKINGS);
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('All');
  const [configEditable, setConfigEditable] = useState({
    standardCheckIn: '[Pending Management Approval]',
    standardCheckOut: '[Pending Management Approval]',
    cancellationWindow: '[Pending Legal/Management Approval]',
    settlementCurrencyNote: 'Paystack enforces NGN; DS historical dataset currency is null/unconfirmed',
  });
  const [configSavedNotice, setConfigSavedNotice] = useState(false);

  // Historical Data Science state
  const [checkoutHealth, setCheckoutHealth] = useState<CheckoutHealthResponse | null>(null);
  const [checkoutSource, setCheckoutSource] = useState<string>('historical_100row_snapshot');
  const [selectedSampleBooking, setSelectedSampleBooking] = useState<string>('HTL-2026-00018');
  const [bookingInsights, setBookingInsights] = useState<BookingInsightsResponse | null>(null);
  const [selectedSampleUser, setSelectedSampleUser] = useState<string>('USR-1042');
  const [guestProfile, setGuestProfile] = useState<GuestProfileResponse | null>(null);

  // Client Telemetry
  const [trackedEvents, setTrackedEvents] = useState<TrackedEvent[]>(getTrackedEvents());

  useEffect(() => {
    if (!isStaffAuthenticated) {
      navigate('/staff/login', { replace: true });
    }
  }, [isStaffAuthenticated, navigate]);

  useEffect(() => {
    if (staffUser && !ROLE_ALLOWED_SECTIONS[staffUser.role].includes(activeSection)) {
      setActiveSection('overview');
    }
  }, [staffUser, activeSection]);

  useEffect(() => {
    fetchCheckoutHealth().then((res) => {
      setCheckoutHealth(res.data);
      setCheckoutSource(res.source);
    });
  }, []);

  useEffect(() => {
    fetchBookingInsights(selectedSampleBooking).then((res) => setBookingInsights(res.data));
  }, [selectedSampleBooking]);

  useEffect(() => {
    fetchGuestProfile(selectedSampleUser).then((res) => setGuestProfile(res.data));
  }, [selectedSampleUser]);

  useEffect(() => {
    return subscribeTrackedEvents(() => {
      setTrackedEvents(getTrackedEvents());
    });
  }, []);

  const filteredDemoBookings = useMemo(() => {
    if (bookingStatusFilter === 'All') return demoBookings;
    return demoBookings.filter((b) => b.booking_status === bookingStatusFilter);
  }, [demoBookings, bookingStatusFilter]);

  if (!staffUser) return null;

  const allowedSections = ROLE_ALLOWED_SECTIONS[staffUser.role];
  const visibleNavItems = SECTION_META.filter((s) => allowedSections.includes(s.id));

  const maxRoomRev = Math.max(
    ...HISTORICAL_DATASET_SUMMARY.room_type_stats.map((r) => r.gross_revenue)
  );

  const toggleDemoReadiness = (bookingId: string) => {
    setDemoBookings((prev) =>
      prev.map((b) => {
        if (b.booking_id !== bookingId) return b;
        const nextOrder: DemoOperationalBooking['room_readiness'][] = [
          'Clean & Inspected',
          'Occupied',
          'Turnover Scheduled',
        ];
        const nextIdx = (nextOrder.indexOf(b.room_readiness) + 1) % nextOrder.length;
        return { ...b, room_readiness: nextOrder[nextIdx] };
      })
    );
  };

  return (
    <div className="min-h-screen bg-ivory text-charcoal flex flex-col lg:flex-row">
      {/* Mobile Staff Topbar */}
      <div className="lg:hidden bg-evergreen text-ivory px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-display text-lg font-semibold">KARAMO Staff Portal</p>
          <p className="text-[11px] text-gold">DEMO MODE &bull; {staffUser.role_label}</p>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen((p) => !p)}
          aria-label="Toggle staff navigation"
          className="w-10 h-10 rounded-lg border border-ivory/25 flex items-center justify-center"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Operational Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } lg:block w-full lg:w-72 bg-evergreen text-ivory shrink-0 flex flex-col justify-between border-r border-gold/20`}
      >
        <div className="p-5 space-y-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
              Operations Workspace
            </p>
            <h1 className="font-display text-2xl font-semibold text-ivory mt-1">
              KARAMO Hotels
            </h1>
            <p className="text-xs text-ivory/75 mt-1">{staffUser.display_name}</p>
          </div>

          {/* Role Switcher for Demo Validation */}
          <div className="rounded-xl bg-forest/70 border border-gold/30 p-3 space-y-1.5">
            <label htmlFor="staff-role-switcher" className="block text-[11px] uppercase tracking-wide text-gold font-semibold">
              Demo Role View
            </label>
            <select
              id="staff-role-switcher"
              value={staffUser.role}
              onChange={(e) => switchStaffRoleDemo(e.target.value as StaffRole)}
              className="w-full min-h-[40px] px-2.5 py-1.5 rounded-lg bg-evergreen text-ivory border border-ivory/25 text-xs"
            >
              {SANDBOX_STAFF_ACCOUNTS.map((acct) => (
                <option key={acct.id} value={acct.role}>
                  {acct.role_label}
                </option>
              ))}
            </select>
          </div>

          <nav aria-label="Staff portal navigation" className="space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-lg text-left text-sm font-medium flex items-center gap-2.5 transition-colors ${
                    isActive
                      ? 'bg-ivory text-forest font-semibold'
                      : 'text-ivory/85 hover:bg-forest/70 hover:text-ivory'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-5 border-t border-ivory/15 space-y-2.5">
          <Link
            to="/"
            className="block w-full text-center py-2.5 px-3 rounded-lg border border-ivory/25 text-xs font-medium text-ivory/90 hover:bg-forest"
          >
            Open Guest Website
          </Link>
          <button
            type="button"
            onClick={() => {
              signOutStaffDemo();
              navigate('/staff/login');
            }}
            className="w-full py-2.5 px-3 rounded-lg bg-forest text-ivory text-xs font-medium hover:bg-forest/80 inline-flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign Out of Staff Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-5 sm:p-8 space-y-6 overflow-x-hidden">
        {/* Explicit DEMO MODE Banner */}
        <div
          role="region"
          aria-label="Staff portal demo notice"
          className="rounded-xl border border-warning bg-[#FAF2E1] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#8A5A12]"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong className="font-semibold">STAFF PORTAL — DEMO MODE (Role: {staffUser.role_label})</strong>
              <p className="mt-0.5 leading-relaxed">
                Operational booking rows below use masked sample records (zero private guest PII) because backend staff RBAC &amp; admin APIs are not implemented in <code className="font-mono">TECHYJAUNT_GROUP_7</code>. Historical Data Science panels reflect the verified 100-row cleaned dataset separately.
              </p>
            </div>
          </div>
        </div>

        {/* 1. OPERATIONAL OVERVIEW */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-3xl font-semibold text-charcoal">
                Operational Overview (Demo Operational View)
              </h2>
              <p className="text-sm text-charcoal/75 mt-1">
                Simulated front-desk &amp; payment exception indicators kept strictly separate from the 100-row historical Data Science snapshot.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-xl border border-sand bg-white p-5">
                <p className="text-xs font-semibold uppercase text-charcoal/65">Demo Confirmed Stays</p>
                <p className="text-3xl font-semibold text-forest tabular-nums mt-2">
                  {demoBookings.filter((b) => b.booking_status === 'Confirmed').length}
                </p>
                <p className="text-xs text-charcoal/65 mt-1">Sample active queue</p>
              </div>
              <div className="rounded-xl border border-sand bg-white p-5">
                <p className="text-xs font-semibold uppercase text-charcoal/65">Demo Completed Stays</p>
                <p className="text-3xl font-semibold text-charcoal tabular-nums mt-2">
                  {demoBookings.filter((b) => b.booking_status === 'Completed').length}
                </p>
                <p className="text-xs text-charcoal/65 mt-1">Checked-out sample</p>
              </div>
              <div className="rounded-xl border border-sand bg-white p-5">
                <p className="text-xs font-semibold uppercase text-charcoal/65">Demo Cancelled / Refunded</p>
                <p className="text-3xl font-semibold text-error tabular-nums mt-2">
                  {demoBookings.filter((b) => b.booking_status === 'Cancelled').length}
                </p>
                <p className="text-xs text-charcoal/65 mt-1">Distinct from active holds</p>
              </div>
              <div className="rounded-xl border border-error/40 bg-[#FAEDED]/50 p-5">
                <p className="text-xs font-semibold uppercase text-[#943535]">409 Hold Exceptions</p>
                <p className="text-3xl font-semibold text-[#943535] tabular-nums mt-2">
                  {demoBookings.filter((b) => b.payment_status === 'Manual Resolution (409)').length}
                </p>
                <p className="text-xs text-[#943535]/80 mt-1">Paid after 15-min hold expiry</p>
              </div>
            </div>

            {/* Quick Historical vs Operational Distinction Card */}
            <div className="rounded-2xl border border-sand bg-white p-6 space-y-3">
              <h3 className="font-display text-xl font-semibold text-charcoal">
                Historical 100-Row Reference Snapshot (Read-Only Benchmark)
              </h3>
              <p className="text-xs text-charcoal/75">
                From the cleaned Data Science workbook (<code className="font-mono">HTL-2026-00001</code> to <code className="font-mono">HTL-2026-00100</code>, 96 unique users, 4 repeat bookings). Kept distinct:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                <div className="rounded-lg bg-ivory p-3 border border-sand">
                  <p className="text-[11px] text-charcoal/70">Total Historical Rows</p>
                  <p className="text-xl font-semibold tabular-nums">100</p>
                </div>
                <div className="rounded-lg bg-[#E9F4EE] p-3 border border-[#BBDAC9]">
                  <p className="text-[11px] text-[#1D5E3F]">Completed</p>
                  <p className="text-xl font-semibold text-[#1D5E3F] tabular-nums">85</p>
                </div>
                <div className="rounded-lg bg-[#EAF2F8] p-3 border border-[#BDD6E6]">
                  <p className="text-[11px] text-[#245370]">Confirmed</p>
                  <p className="text-xl font-semibold text-[#245370] tabular-nums">7</p>
                </div>
                <div className="rounded-lg bg-[#FAEDED] p-3 border border-[#E7BDBD]">
                  <p className="text-[11px] text-[#943535]">Cancelled / Refunded</p>
                  <p className="text-xl font-semibold text-[#943535] tabular-nums">8</p>
                </div>
                <div className="rounded-lg bg-ivory p-3 border border-sand">
                  <p className="text-[11px] text-charcoal/70">Net Paid Revenue</p>
                  <p className="text-base font-semibold tabular-nums">
                    {formatDsCompact(HISTORICAL_DATASET_SUMMARY.net_revenue_paid, null)}
                  </p>
                  <p className="text-[10px] text-charcoal/60">currency: null</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. DEMO BOOKINGS & 409 EXCEPTIONS */}
        {activeSection === 'bookings' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl font-semibold text-charcoal">
                  Demo Reservations &amp; Payment Exceptions
                </h2>
                <p className="text-xs text-charcoal/75 mt-1">
                  Guest identities are masked; Confirmed, Completed, and Cancelled statuses remain strictly separate.
                </p>
              </div>
              <select
                aria-label="Filter demo bookings by status"
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="min-h-[40px] px-3 py-1.5 rounded-lg border border-sand bg-white text-sm"
              >
                <option value="All">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Pending Hold">Pending Hold (409)</option>
              </select>
            </div>

            <div className="rounded-2xl border border-sand bg-white overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-ivory border-b border-sand text-xs uppercase text-charcoal/70">
                  <tr>
                    <th className="py-3 px-4">Ref</th>
                    <th className="py-3 px-4">Masked Guest</th>
                    <th className="py-3 px-4">Room</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Amount (Demo)</th>
                    <th className="py-3 px-4">Booking Status</th>
                    <th className="py-3 px-4">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/70">
                  {filteredDemoBookings.map((b) => (
                    <tr key={b.booking_id} className="hover:bg-ivory/40">
                      <td className="py-3.5 px-4 font-mono text-xs">{b.booking_id}</td>
                      <td className="py-3.5 px-4">{b.guest_display_masked}</td>
                      <td className="py-3.5 px-4 font-medium">{b.room_type}</td>
                      <td className="py-3.5 px-4 text-xs tabular-nums">
                        {b.check_in} &rarr; {b.check_out}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums font-medium">
                        {formatTransactionalMoney(b.total_amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge
                          label={b.booking_status}
                          tone={mapBookingStatusTone(b.booking_status)}
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge
                          label={b.payment_status}
                          tone={mapPaymentStatusTone(b.payment_status)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. ROOM READINESS */}
        {activeSection === 'rooms' && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-3xl font-semibold text-charcoal">
                Room Readiness &amp; Housekeeping (Demo State)
              </h2>
              <p className="text-xs text-charcoal/75 mt-1">
                Interactive demo status toggle for front-desk &amp; housekeeping coordination (no live DB mutation).
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demoBookings.map((b) => (
                <div
                  key={b.booking_id}
                  className="rounded-xl border border-sand bg-white p-5 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-xs font-mono text-charcoal/65">{b.booking_id}</p>
                    <h3 className="font-display text-xl font-semibold text-charcoal">
                      {b.room_type}
                    </h3>
                    <p className="text-xs text-charcoal/75 mt-1">
                      Occupancy: {b.guest_count} guests &bull; Status: {b.booking_status}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleDemoReadiness(b.booking_id)}
                    className="min-h-[40px] px-3 py-2 rounded-lg border border-forest text-xs font-semibold text-forest hover:bg-ivory"
                  >
                    {b.room_readiness} (Cycle)
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. HISTORICAL DATA SCIENCE INSIGHTS */}
        {activeSection === 'ds_insights' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">
                  Analytical Layer &bull; Non-Punitive Concierge Intelligence
                </p>
                <h2 className="font-display text-3xl font-semibold text-charcoal mt-1">
                  Historical Data Science Insights
                </h2>
              </div>
              <StatusBadge label="100 Historical Rows • Directional Only" tone="info" />
            </div>

            {/* Room Type Gross Revenue & Bookings Chart */}
            <div className="rounded-2xl border border-sand bg-white p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-xl font-semibold text-charcoal">
                  Room Type Revenue &amp; Stay Volume (Gross: {formatDsCompact(HISTORICAL_DATASET_SUMMARY.gross_revenue, null)})
                </h3>
                <span className="text-xs text-charcoal/65">Currency unconfirmed (null in cleaned dataset)</span>
              </div>

              <div className="space-y-3">
                {HISTORICAL_DATASET_SUMMARY.room_type_stats.map((rt) => {
                  const pct = Math.round((rt.gross_revenue / maxRoomRev) * 100);
                  return (
                    <div key={rt.room_type} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-charcoal">
                          {rt.room_type} ({rt.bookings} bookings &bull; avg {rt.avg_stay_nights} nights)
                        </span>
                        <span className="font-semibold text-forest tabular-nums">
                          {formatDsCompact(rt.gross_revenue, null)}
                        </span>
                      </div>
                      <div className="h-3 rounded-full bg-sand/60 overflow-hidden">
                        <div
                          className="h-full bg-forest rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Approved 3 Guest Segments */}
            <div className="rounded-2xl border border-sand bg-white p-6 space-y-4">
              <h3 className="font-display text-xl font-semibold text-charcoal">
                Approved Guest Segments (96 Unique Users, 4 Repeat Occurrences)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {HISTORICAL_DATASET_SUMMARY.segment_summary.map((seg) => (
                  <div key={seg.segment_label} className="rounded-xl border border-sand bg-ivory/60 p-4 space-y-1.5">
                    <p className="font-mono text-xs font-bold text-forest">{seg.segment_label}</p>
                    <p className="text-xs text-charcoal/85 leading-relaxed">{seg.description}</p>
                    <p className="text-[11px] text-charcoal/65 pt-1">{seg.typical_profile}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive FastAPI Payload Inspectors */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Booking Risk & Recommended Action Inspector */}
              <div className="rounded-2xl border border-sand bg-white p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold text-charcoal">
                    Booking Risk Inspector
                  </h3>
                  <select
                    aria-label="Select historical booking ID"
                    value={selectedSampleBooking}
                    onChange={(e) => setSelectedSampleBooking(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-sand bg-ivory text-xs font-mono"
                  >
                    <option value="HTL-2026-00001">HTL-2026-00001</option>
                    <option value="HTL-2026-00018">HTL-2026-00018</option>
                    <option value="HTL-2026-00064">HTL-2026-00064</option>
                  </select>
                </div>

                {bookingInsights && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-charcoal/75">
                        {bookingInsights.stay_summary.room_type} &bull; {bookingInsights.stay_summary.nights} nights &bull;{' '}
                        {bookingInsights.stay_summary.payment_method}
                      </span>
                      <StatusBadge
                        label={`Risk Tier: ${bookingInsights.risk.risk_tier} (${Math.round(
                          bookingInsights.risk.cancellation_probability * 100
                        )}%)`}
                        tone={
                          bookingInsights.risk.risk_tier === 'HIGH'
                            ? 'warning'
                            : bookingInsights.risk.risk_tier === 'MODERATE'
                            ? 'info'
                            : 'success'
                        }
                      />
                    </div>
                    <p className="text-charcoal/80">
                      Amount: <strong>{formatDsAmount(bookingInsights.financials.total_amount, bookingInsights.financials.currency)}</strong>
                    </p>
                    <div className="rounded-lg bg-ivory p-3 border border-sand space-y-1">
                      <p className="font-semibold text-forest">
                        Non-Punitive Action: {bookingInsights.recommended_action.label}
                      </p>
                      <p className="text-charcoal/80">{bookingInsights.recommended_action.detail}</p>
                    </div>
                    <p className="text-[11px] text-charcoal/65">{bookingInsights.risk.sample_size_note}</p>
                  </div>
                )}
              </div>

              {/* Guest Profile Personalization Inspector */}
              <div className="rounded-2xl border border-sand bg-white p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold text-charcoal">
                    Guest Profile Personalization
                  </h3>
                  <select
                    aria-label="Select historical user ID"
                    value={selectedSampleUser}
                    onChange={(e) => setSelectedSampleUser(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-sand bg-ivory text-xs font-mono"
                  >
                    <option value="USR-1042">USR-1042 (Repeat)</option>
                    <option value="USR-2088">USR-2088 (High Spend)</option>
                    <option value="USR-3015">USR-3015 (Budget Long)</option>
                  </select>
                </div>

                {guestProfile && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-forest">
                        {guestProfile.segment.segment_label}
                      </span>
                      <StatusBadge
                        label={guestProfile.is_repeat_guest ? 'Repeat Guest' : 'Single-Stay Record'}
                        tone="info"
                      />
                    </div>
                    <p className="text-charcoal/80">
                      Historical Spend:{' '}
                      <strong>{formatDsAmount(guestProfile.historical_spend, guestProfile.currency)}</strong>
                    </p>
                    <div className="rounded-lg bg-ivory p-3 border border-sand space-y-1">
                      <p className="font-semibold text-charcoal">
                        UI Highlight Rooms: {guestProfile.ui_personalization.highlight_room_types.join(', ')}
                      </p>
                      <p className="text-charcoal/75">
                        Suggested Payment: {guestProfile.ui_personalization.suggested_payment_method}
                      </p>
                    </div>
                    <p className="text-[11px] text-charcoal/65">{guestProfile.segment.confidence_note}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. CHECKOUT HEALTH & PAYMENT FRICTION */}
        {activeSection === 'checkout_health' && checkoutHealth && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl font-semibold text-charcoal">
                  Checkout Health &amp; Payment Friction
                </h2>
                <p className="text-xs text-charcoal/75 mt-1">
                  Source: <code className="font-mono">{checkoutSource}</code> &bull; Flags channels averaging &ge; 7.00 min or &ge; 10% cancellation rate.
                </p>
              </div>
              <StatusBadge label="Directional Estimates" tone="info" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {checkoutHealth.methods.map((m) => (
                <div
                  key={m.payment_method}
                  className={`rounded-2xl border p-5 space-y-3 ${
                    m.high_friction_flag ? 'border-warning bg-[#FAF2E1]/50' : 'border-sand bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-xl font-semibold text-charcoal">
                      {m.payment_method}
                    </h3>
                    <StatusBadge
                      label={m.high_friction_flag ? 'High Friction Warning' : 'Normal Latency'}
                      tone={m.high_friction_flag ? 'warning' : 'success'}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-charcoal/65">Avg Duration</p>
                      <p className="font-semibold text-base tabular-nums">
                        {m.avg_payment_duration_min.toFixed(2)} min
                      </p>
                    </div>
                    <div>
                      <p className="text-charcoal/65">Bookings</p>
                      <p className="font-semibold text-base tabular-nums">{m.booking_count}</p>
                    </div>
                    <div>
                      <p className="text-charcoal/65">Observed Cancel</p>
                      <p className="font-semibold text-base tabular-nums">
                        {(m.observed_cancellation_rate * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-charcoal/80 leading-relaxed pt-1 border-t border-sand/60">
                    {m.ui_recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. SESSION CLIENT TELEMETRY */}
        {activeSection === 'telemetry' && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-3xl font-semibold text-charcoal">
                Session Event Telemetry (Zero PII)
              </h2>
              <p className="text-xs text-charcoal/75 mt-1">
                Live browser interaction events recorded using opaque session/room IDs only, visibly separated from the 100-row historical workbook.
              </p>
            </div>

            {trackedEvents.length === 0 ? (
              <div className="rounded-2xl border border-sand bg-white p-8 text-center text-sm text-charcoal/75">
                No guest events recorded in this browser session yet. Browse rooms, open the Virtual Concierge, or start a booking to observe live events here.
              </div>
            ) : (
              <div className="rounded-2xl border border-sand bg-white overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ivory border-b border-sand uppercase text-charcoal/70">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Event Name</th>
                      <th className="py-3 px-4">Origin</th>
                      <th className="py-3 px-4">Non-PII Metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand/60">
                    {trackedEvents.map((ev) => (
                      <tr key={ev.event_id}>
                        <td className="py-2.5 px-4 font-mono">{ev.timestamp.slice(11, 19)}</td>
                        <td className="py-2.5 px-4 font-semibold text-forest">{ev.event_name}</td>
                        <td className="py-2.5 px-4 uppercase">{ev.data_origin}</td>
                        <td className="py-2.5 px-4 font-mono text-[11px]">
                          {JSON.stringify(ev.metadata)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 7. USER & ROLE MANAGEMENT (DEMO) */}
        {activeSection === 'roles' && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-3xl font-semibold text-charcoal">
                Staff Role Directory (Demo RBAC Matrix)
              </h2>
              <p className="text-xs text-charcoal/75 mt-1">
                Demonstration role structure showing intended least-privilege separation once backend staff RBAC is implemented.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SANDBOX_STAFF_ACCOUNTS.map((acct) => (
                <div key={acct.id} className="rounded-xl border border-sand bg-white p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-sans text-base font-semibold text-charcoal">
                      {acct.role_label}
                    </h3>
                    <StatusBadge label="Demo Account" tone="neutral" />
                  </div>
                  <p className="text-xs text-charcoal/75">
                    {acct.display_name} &bull; {acct.department}
                  </p>
                  <p className="text-[11px] text-charcoal/65">
                    Allowed Views: {ROLE_ALLOWED_SECTIONS[acct.role].join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. SYSTEM CONFIG & SECURITY AUDIT */}
        {activeSection === 'config' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-3xl font-semibold text-charcoal">
                System Configuration, Open Decisions &amp; Security Audit
              </h2>
              <p className="text-xs text-charcoal/75 mt-1">
                Accurately reflects pending backend cybersecurity findings (F-01 through RBAC-01) and the 15 cross-team open decisions.
              </p>
            </div>

            {/* Editable Policy Placeholder Preview */}
            <div className="rounded-2xl border border-sand bg-white p-6 space-y-4">
              <h3 className="font-display text-xl font-semibold text-charcoal">
                Operational Policy Placeholders (Local Preview Only)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-charcoal/70 mb-1">
                    Standard Check-in Hour
                  </label>
                  <input
                    type="text"
                    value={configEditable.standardCheckIn}
                    onChange={(e) => setConfigEditable({ ...configEditable, standardCheckIn: e.target.value })}
                    className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-sand bg-ivory/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal/70 mb-1">
                    Standard Check-out Hour
                  </label>
                  <input
                    type="text"
                    value={configEditable.standardCheckOut}
                    onChange={(e) => setConfigEditable({ ...configEditable, standardCheckOut: e.target.value })}
                    className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-sand bg-ivory/40"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setConfigSavedNotice(true)}
                  className="min-h-[40px] px-4 py-2 rounded-lg bg-forest text-ivory text-xs font-semibold"
                >
                  Save Demo Preview Note
                </button>
                {configSavedNotice && (
                  <span className="text-xs text-success font-medium">
                    Saved in browser demo state (requires backend persistence &amp; management sign-off).
                  </span>
                )}
              </div>
            </div>

            {/* Security Findings */}
            <div className="rounded-2xl border border-sand bg-white p-6 space-y-3">
              <h3 className="font-display text-xl font-semibold text-charcoal flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-warning" aria-hidden="true" />
                <span>Pending Backend Security &amp; Integration Findings</span>
              </h3>
              <ul className="space-y-2.5 text-xs">
                {BACKEND_SECURITY_AUDIT_ITEMS.map((item) => (
                  <li
                    key={item.id}
                    className="p-3 rounded-lg border border-sand bg-ivory/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <span>
                      <strong className="font-mono text-forest">{item.id}:</strong> {item.summary}
                    </span>
                    <StatusBadge
                      label={item.severity}
                      tone={item.severity === 'Critical' ? 'error' : item.severity === 'High' ? 'warning' : 'info'}
                    />
                  </li>
                ))}
              </ul>
            </div>

            {/* 15 Open Product Decisions */}
            <div className="rounded-2xl border border-sand bg-white p-6 space-y-3">
              <h3 className="font-display text-xl font-semibold text-charcoal">
                Cross-Team Open Decisions Register (15 Items)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {OPEN_PRODUCT_DECISIONS.map((d) => (
                  <div key={d.id} className="p-3 rounded-lg border border-sand bg-ivory/40 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-charcoal">
                        #{d.id} {d.topic}
                      </span>
                      <span className="text-[11px] font-medium text-warning shrink-0">{d.status}</span>
                    </div>
                    <p className="text-charcoal/75">{d.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
