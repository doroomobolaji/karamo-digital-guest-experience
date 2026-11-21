import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, Search, SlidersHorizontal, Users } from 'lucide-react';
import { useBooking, calculateNights } from '../context/BookingContext';
import { checkAvailability, getRooms } from '../services/transactionalApi';
import { trackEvent } from '../services/eventTracker';
import type { Room } from '../types/api';
import { RoomCard } from '../components/rooms/RoomCard';
import { Breadcrumbs } from '../components/ui/Primitives';

export const RoomsPage: React.FC = () => {
  const [urlParams, setUrlParams] = useSearchParams();
  const { searchParams, setSearchParams, dataMode } = useBooking();

  const initialCheckIn = urlParams.get('check_in') || searchParams.check_in;
  const initialCheckOut = urlParams.get('check_out') || searchParams.check_out;
  const initialGuests = Number(urlParams.get('guest_count') || searchParams.guest_count || 2);

  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [guestCount, setGuestCount] = useState(initialGuests);
  const [roomTypeFilter, setRoomTypeFilter] = useState(searchParams.room_type || 'All');
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'capacity_desc'>(
    searchParams.sort_by || 'recommended'
  );

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasSearchedAvailability, setHasSearchedAvailability] = useState(false);

  const loadRooms = async (opts: {
    ci: string;
    co: string;
    guests: number;
    useAvailabilityEndpoint: boolean;
  }) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const list = opts.useAvailabilityEndpoint
        ? await checkAvailability(dataMode, {
            check_in: opts.ci,
            check_out: opts.co,
            guest_count: opts.guests,
          })
        : await getRooms(dataMode);
      setRooms(list);
      trackEvent('results_viewed', dataMode, {
        result_count: list.length,
        guest_count: opts.guests,
        availability_filtered: opts.useAvailabilityEndpoint,
      });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to retrieve room availability.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasQueryDates = Boolean(urlParams.get('check_in') && urlParams.get('check_out'));
    setHasSearchedAvailability(hasQueryDates);
    loadRooms({
      ci: initialCheckIn,
      co: initialCheckOut,
      guests: initialGuests,
      useAvailabilityEndpoint: hasQueryDates,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataMode]);

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIn || !checkOut) {
      setErrorMsg('Please provide both check-in and check-out dates.');
      return;
    }
    if (checkOut <= checkIn) {
      setErrorMsg('Check-out date must be after your check-in date.');
      return;
    }
    if (guestCount < 1) {
      setErrorMsg('Guest count must be at least 1.');
      return;
    }

    setSearchParams((prev) => ({
      ...prev,
      check_in: checkIn,
      check_out: checkOut,
      guest_count: guestCount,
      room_type: roomTypeFilter,
      sort_by: sortBy,
    }));

    setUrlParams({
      check_in: checkIn,
      check_out: checkOut,
      guest_count: String(guestCount),
    });

    setHasSearchedAvailability(true);
    trackEvent('search_submitted', dataMode, {
      check_in: checkIn,
      check_out: checkOut,
      guest_count: guestCount,
      origin: 'rooms_page',
    });

    loadRooms({
      ci: checkIn,
      co: checkOut,
      guests: guestCount,
      useAvailabilityEndpoint: true,
    });
  };

  const uniqueTypes = useMemo(() => {
    const types = Array.from(new Set(rooms.map((r) => r.room_type)));
    return ['All', ...types];
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    let list = [...rooms];
    if (roomTypeFilter !== 'All') {
      list = list.filter((r) => r.room_type === roomTypeFilter);
    }
    if (sortBy === 'price_asc') {
      list.sort((a, b) => Number(a.price_per_night) - Number(b.price_per_night));
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => Number(b.price_per_night) - Number(a.price_per_night));
    } else if (sortBy === 'capacity_desc') {
      list.sort((a, b) => b.capacity - a.capacity);
    }
    return list;
  }, [rooms, roomTypeFilter, sortBy]);

  const nights = calculateNights(checkIn, checkOut);
  const queryString = `?check_in=${encodeURIComponent(checkIn)}&check_out=${encodeURIComponent(
    checkOut
  )}&guest_count=${guestCount}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Rooms & Availability' }]} />

      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-charcoal">
          Rooms &amp; Live Availability
        </h1>
        <p className="mt-2 text-sm sm:text-base text-charcoal/80 max-w-2xl">
          Search verified availability by dates and guest count. Nightly rates and room capacities reflect {dataMode === 'live' ? 'live transactional catalog data' : 'Sandbox Preview catalog data'}.
        </p>
      </div>

      {/* Availability Search Form */}
      <form
        onSubmit={handleSubmitSearch}
        className="rounded-2xl border border-sand bg-white p-4 sm:p-6 mb-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="rooms-checkin" className="block text-xs font-semibold uppercase text-charcoal/75 mb-1.5">
              Check-in
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-forest absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="rooms-checkin"
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-lg border border-sand bg-ivory/50 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="rooms-checkout" className="block text-xs font-semibold uppercase text-charcoal/75 mb-1.5">
              Check-out
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-forest absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="rooms-checkout"
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-lg border border-sand bg-ivory/50 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="rooms-guests" className="block text-xs font-semibold uppercase text-charcoal/75 mb-1.5">
              Guests
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-forest absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="rooms-guests"
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-lg border border-sand bg-ivory/50 text-sm"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full min-h-[44px] px-5 py-2.5 rounded-lg bg-forest text-ivory text-sm font-semibold hover:bg-evergreen inline-flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
            <span>Search Availability</span>
          </button>
        </div>

        {errorMsg && (
          <p role="alert" className="mt-3 text-sm font-medium text-error">
            {errorMsg}
          </p>
        )}
      </form>

      {/* Filter & Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-sand">
        <p className="text-sm text-charcoal/80">
          {loading ? (
            'Checking room availability...'
          ) : (
            <>
              Showing <strong className="font-semibold text-charcoal tabular-nums">{filteredRooms.length}</strong>{' '}
              {filteredRooms.length === 1 ? 'room' : 'rooms'}
              {hasSearchedAvailability && nights > 0
                ? ` for ${nights} ${nights === 1 ? 'night' : 'nights'} (${guestCount} ${
                    guestCount === 1 ? 'guest' : 'guests'
                  })`
                : ''}
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-forest" aria-hidden="true" />
            <label htmlFor="filter-room-type" className="text-xs font-medium text-charcoal/75">
              Category:
            </label>
            <select
              id="filter-room-type"
              value={roomTypeFilter}
              onChange={(e) => setRoomTypeFilter(e.target.value)}
              className="min-h-[40px] px-3 py-1.5 rounded-lg border border-sand bg-white text-sm"
            >
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="sort-rooms" className="text-xs font-medium text-charcoal/75">
              Sort:
            </label>
            <select
              id="sort-rooms"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'recommended' | 'price_asc' | 'price_desc' | 'capacity_desc')
              }
              className="min-h-[40px] px-3 py-1.5 rounded-lg border border-sand bg-white text-sm"
            >
              <option value="recommended">Recommended</option>
              <option value="price_asc">Rate: Low to High</option>
              <option value="price_desc">Rate: High to Low</option>
              <option value="capacity_desc">Highest Capacity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid / Skeleton / Empty Recovery */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="rounded-xl border border-sand bg-white overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] bg-sand/70" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-sand/70 rounded w-1/2" />
                <div className="h-4 bg-sand/50 rounded w-full" />
                <div className="h-10 bg-sand/60 rounded w-1/3 mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="rounded-2xl border border-sand bg-white p-8 sm:p-12 text-center max-w-2xl mx-auto">
          <h2 className="font-display text-2xl font-semibold text-charcoal">
            No Matching Rooms Available
          </h2>
          <p className="mt-2 text-sm text-charcoal/80 leading-relaxed">
            No rooms matched your current dates or guest count ({guestCount} guests). Try adjusting your check-in/check-out window, resetting room category filters, or contacting our team for multi-room assistance.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setRoomTypeFilter('All');
                setGuestCount(2);
                loadRooms({
                  ci: checkIn,
                  co: checkOut,
                  guests: 2,
                  useAvailabilityEndpoint: false,
                });
              }}
              className="min-h-[44px] px-5 py-2.5 rounded-lg bg-forest text-ivory text-sm font-medium hover:bg-evergreen"
            >
              View All Room Categories
            </button>
            <Link
              to="/contact"
              className="min-h-[44px] px-5 py-2.5 rounded-lg border border-sand text-charcoal text-sm font-medium hover:bg-sand/40 inline-flex items-center"
            >
              Contact Front Desk
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              queryString={queryString}
              dataMode={dataMode}
            />
          ))}
        </div>
      )}
    </div>
  );
};
