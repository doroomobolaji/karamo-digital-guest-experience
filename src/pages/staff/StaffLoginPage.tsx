import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ShieldAlert, UserCog } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SANDBOX_STAFF_ACCOUNTS } from '../../data/demoSandboxData';
import type { StaffRole } from '../../types/api';

export const StaffLoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<StaffRole>('hotel_manager');
  const { signInStaffDemo } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    signInStaffDemo(selectedRole);
    navigate('/staff/portal', { replace: true });
  };

  return (
    <div className="min-h-screen bg-evergreen text-ivory flex flex-col justify-center px-4 py-12">
      <div className="max-w-lg w-full mx-auto space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-gold hover:text-ivory underline-offset-4 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Return to Public Guest Website</span>
        </Link>

        <div className="rounded-2xl border border-gold/30 bg-white text-charcoal p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-forest text-gold flex items-center justify-center shrink-0">
              <UserCog className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">
                KARAMO Operations
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-charcoal">
                Staff &amp; Admin Portal Sign In
              </h1>
            </div>
          </div>

          <div className="rounded-xl border border-warning bg-[#FAF2E1] p-4 text-xs text-[#8A5A12] space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Explicit DEMO MODE — Staff RBAC Not Yet Built in Backend</span>
            </p>
            <p className="leading-relaxed">
              The <code className="font-mono">TECHYJAUNT_GROUP_7</code> transactional backend does not currently provide staff authentication, RBAC roles, or admin mutation endpoints. Entering this portal launches an isolated Demo Mode workspace with masked sample records and historical Data Science insights.
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label
                htmlFor="staff-role-select"
                className="block text-xs font-semibold uppercase tracking-wide text-charcoal/75 mb-2"
              >
                Select Operational Demo Role
              </label>
              <div className="space-y-2">
                {SANDBOX_STAFF_ACCOUNTS.map((acct) => (
                  <label
                    key={acct.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                      selectedRole === acct.role
                        ? 'border-forest bg-ivory'
                        : 'border-sand bg-white hover:bg-ivory/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="staff-role"
                      value={acct.role}
                      checked={selectedRole === acct.role}
                      onChange={() => setSelectedRole(acct.role)}
                      className="mt-1 accent-forest"
                    />
                    <div className="text-sm">
                      <p className="font-semibold text-charcoal">{acct.role_label}</p>
                      <p className="text-xs text-charcoal/70">
                        {acct.display_name} &bull; {acct.department}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] px-5 py-3 rounded-lg bg-forest text-ivory text-sm font-semibold hover:bg-evergreen inline-flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" aria-hidden="true" />
              <span>Enter Staff Portal (Demo Mode)</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
