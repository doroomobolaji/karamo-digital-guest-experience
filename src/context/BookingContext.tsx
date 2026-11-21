import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Room, SearchParamsState, SystemStatus } from '../types/api';
import { fetchSystemStatus, getRooms } from '../services/transactionalApi';

export function getDefaultDates(): { check_in: string; check_out: string } {
  const tomorrow = new Date(Date.now() + 86400000);
  const threeDays = new Date(Date.now() + 3 * 86400000);
  return {
    check_in: tomorrow.toISOString().slice(0, 10),
    check_out: threeDays.toISOString().slice(0, 10),
  };
}

export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

interface BookingContextValue {
  systemStatus: SystemStatus;
  dataMode: 'live' | 'sandbox';
  setDataMode: (mode: 'live' | 'sandbox') => void;
  searchParams: SearchParamsState;
  setSearchParams: React.Dispatch<React.SetStateAction<SearchParamsState>>;
  roomsCatalog: Room[];
  selectedRoom: Room | null;
  setSelectedRoom: (room: Room | null) => void;
  activeBookingId: number | null;
  setActiveBookingId: (id: number | null) => void;
  activeHoldExpiresAt: string | null;
  setActiveHoldExpiresAt: (ts: string | null) => void;
  activePaymentRef: string | null;
  setActivePaymentRef: (ref: string | null) => void;
  resetActiveCheckout: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const defaults = getDefaultDates();
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    transactionalConfigured: false,
    transactionalReachable: false,
    dsConfigured: false,
    dsReachable: false,
    geminiConfigured: false,
  });
  const [dataMode, setDataMode] = useState<'live' | 'sandbox'>('sandbox');
  const [searchParams, setSearchParams] = useState<SearchParamsState>({
    check_in: defaults.check_in,
    check_out: defaults.check_out,
    guest_count: 2,
    room_type: 'All',
    sort_by: 'recommended',
  });
  const [roomsCatalog, setRoomsCatalog] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [activeBookingId, setActiveBookingId] = useState<number | null>(null);
  const [activeHoldExpiresAt, setActiveHoldExpiresAt] = useState<string | null>(null);
  const [activePaymentRef, setActivePaymentRef] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchSystemStatus().then((status) => {
      if (!mounted) return;
      setSystemStatus(status);
      if (status.transactionalConfigured && status.transactionalReachable) {
        setDataMode('live');
      } else {
        setDataMode('sandbox');
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    getRooms(dataMode)
      .then((rooms) => {
        if (mounted) setRoomsCatalog(rooms);
      })
      .catch(() => {
        if (mounted) setRoomsCatalog([]);
      });
    return () => {
      mounted = false;
    };
  }, [dataMode]);

  const resetActiveCheckout = useCallback(() => {
    setActiveBookingId(null);
    setActiveHoldExpiresAt(null);
    setActivePaymentRef(null);
  }, []);

  const value = useMemo<BookingContextValue>(
    () => ({
      systemStatus,
      dataMode,
      setDataMode,
      searchParams,
      setSearchParams,
      roomsCatalog,
      selectedRoom,
      setSelectedRoom,
      activeBookingId,
      setActiveBookingId,
      activeHoldExpiresAt,
      setActiveHoldExpiresAt,
      activePaymentRef,
      setActivePaymentRef,
      resetActiveCheckout,
    }),
    [
      systemStatus,
      dataMode,
      searchParams,
      roomsCatalog,
      selectedRoom,
      activeBookingId,
      activeHoldExpiresAt,
      activePaymentRef,
      resetActiveCheckout,
    ]
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used inside BookingProvider');
  return ctx;
}
