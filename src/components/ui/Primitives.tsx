import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  Info,
  XCircle,
} from 'lucide-react';

export function formatTransactionalMoney(
  amount: number | string,
  options: { isSandbox?: boolean; currencyCode?: string } = {}
): string {
  const num = Number(amount);
  if (Number.isNaN(num)) return '—';
  const formatted = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
  const prefix = options.currencyCode || 'NGN';
  return `${prefix} ${formatted}`;
}

export type SemanticTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export const StatusBadge: React.FC<{
  label: string;
  tone: SemanticTone;
}> = ({ label, tone }) => {
  const styles: Record<SemanticTone, string> = {
    success: 'bg-[#E9F4EE] text-[#1D5E3F] border-[#BBDAC9]',
    warning: 'bg-[#FAF2E1] text-[#8A5A12] border-[#E8CF9D]',
    error: 'bg-[#FAEDED] text-[#943535] border-[#E7BDBD]',
    info: 'bg-[#EAF2F8] text-[#245370] border-[#BDD6E6]',
    neutral: 'bg-[#EFECE4] text-[#292D2B] border-[#D8D0C0]',
  };

  const Icon =
    tone === 'success'
      ? CheckCircle2
      : tone === 'warning'
      ? Clock
      : tone === 'error'
      ? XCircle
      : tone === 'info'
      ? Info
      : AlertCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium tracking-tight whitespace-nowrap ${styles[tone]}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};

export function mapBookingStatusTone(status: string): SemanticTone {
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'confirmed') return 'success';
  if (s.includes('pending')) return 'warning';
  if (s === 'cancelled') return 'error';
  return 'neutral';
}

export function mapPaymentStatusTone(status: string | null | undefined): SemanticTone {
  if (!status) return 'neutral';
  const s = status.toLowerCase();
  if (s === 'success' || s === 'paid') return 'success';
  if (s === 'pending') return 'warning';
  if (s.includes('manual') || s === 'failed') return 'error';
  if (s === 'refunded') return 'info';
  return 'neutral';
}

export const ConnectionBoundaryBanner: React.FC<{
  dataMode: 'live' | 'sandbox';
  onSwitchMode?: (mode: 'live' | 'sandbox') => void;
  transactionalReachable?: boolean;
}> = ({ dataMode, onSwitchMode, transactionalReachable }) => {
  if (dataMode === 'live') return null;

  return (
    <div
      role="region"
      aria-label="Sandbox mode notice"
      className="bg-sand/65 border-b border-gold/40 text-charcoal"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
        <div className="flex items-start sm:items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold">Sandbox Preview Mode:</strong>{' '}
            Transactional backend (<code className="font-mono text-[11px]">BACKEND_API_URL</code>) is not connected.
            Room rates, OTP verification, and Paystack Test-Mode steps below simulate the verified API contract without live database persistence.
          </span>
        </div>
        {transactionalReachable && onSwitchMode && (
          <button
            type="button"
            onClick={() => onSwitchMode('live')}
            className="self-start sm:self-auto px-3 py-1.5 rounded-md bg-forest text-ivory font-medium hover:bg-evergreen transition-colors shrink-0"
          >
            Connect Live Backend
          </button>
        )}
      </div>
    </div>
  );
};

export const Breadcrumbs: React.FC<{
  items: Array<{ label: string; to?: string }>;
}> = ({ items }) => (
  <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-charcoal/70 mb-4">
    {items.map((item, idx) => (
      <React.Fragment key={`${item.label}-${idx}`}>
        {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-charcoal/40" aria-hidden="true" />}
        {item.to ? (
          <Link to={item.to} className="hover:text-forest underline-offset-4 hover:underline">
            {item.label}
          </Link>
        ) : (
          <span className="text-charcoal font-medium" aria-current="page">
            {item.label}
          </span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

export const BackLink: React.FC<{ to: string; label: string }> = ({ to, label }) => (
  <Link
    to={to}
    className="inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:text-evergreen underline-offset-4 hover:underline mb-4 min-h-[44px]"
  >
    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
    <span>{label}</span>
  </Link>
);

export const PlaceholderNotice: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="rounded-xl border border-gold/50 bg-sand/40 p-4 text-sm text-charcoal">
    <div className="flex items-start gap-2.5">
      <Info className="w-4 h-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p className="font-semibold text-charcoal">{title}</p>
        <div className="mt-1 text-charcoal/85 leading-relaxed">{children}</div>
      </div>
    </div>
  </div>
);
