import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { AuthUser, StaffDemoAccount, StaffRole } from '../types/api';
import { SANDBOX_STAFF_ACCOUNTS } from '../data/demoSandboxData';

// Memory-only AuthContext: JWT Bearer tokens are NEVER stored in localStorage/sessionStorage and NEVER logged.

interface AuthContextValue {
  // Guest Auth
  guestToken: string | null;
  guestUser: AuthUser | null;
  isGuestAuthenticated: boolean;
  sessionExpiredNotice: string | null;
  setGuestSession: (token: string, user: AuthUser) => void;
  clearGuestSession: (expiredMessage?: string) => void;

  // Separate Staff Portal Demo Auth (isolated from Guest JWT)
  staffUser: StaffDemoAccount | null;
  isStaffAuthenticated: boolean;
  signInStaffDemo: (role: StaffRole) => void;
  switchStaffRoleDemo: (role: StaffRole) => void;
  signOutStaffDemo: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [guestUser, setGuestUser] = useState<AuthUser | null>(null);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string | null>(null);

  const [staffUser, setStaffUser] = useState<StaffDemoAccount | null>(null);

  const setGuestSession = useCallback((token: string, user: AuthUser) => {
    setGuestToken(token);
    setGuestUser(user);
    setSessionExpiredNotice(null);
  }, []);

  const clearGuestSession = useCallback((expiredMessage?: string) => {
    setGuestToken(null);
    setGuestUser(null);
    setSessionExpiredNotice(expiredMessage || null);
  }, []);

  const signInStaffDemo = useCallback((role: StaffRole) => {
    const account =
      SANDBOX_STAFF_ACCOUNTS.find((a) => a.role === role) || SANDBOX_STAFF_ACCOUNTS[0];
    setStaffUser(account);
  }, []);

  const switchStaffRoleDemo = useCallback((role: StaffRole) => {
    const account =
      SANDBOX_STAFF_ACCOUNTS.find((a) => a.role === role) || SANDBOX_STAFF_ACCOUNTS[0];
    setStaffUser(account);
  }, []);

  const signOutStaffDemo = useCallback(() => {
    setStaffUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      guestToken,
      guestUser,
      isGuestAuthenticated: Boolean(guestToken && guestUser),
      sessionExpiredNotice,
      setGuestSession,
      clearGuestSession,
      staffUser,
      isStaffAuthenticated: Boolean(staffUser),
      signInStaffDemo,
      switchStaffRoleDemo,
      signOutStaffDemo,
    }),
    [
      guestToken,
      guestUser,
      sessionExpiredNotice,
      setGuestSession,
      clearGuestSession,
      staffUser,
      signInStaffDemo,
      switchStaffRoleDemo,
      signOutStaffDemo,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
