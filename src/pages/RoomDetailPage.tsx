import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Calendar, Check, Users } from 'lucide-react';
import { useBooking, calculateNights } from '../context/BookingContext';
import { getRooms } from '../services/transactionalApi';
import { trackEvent } from '../services/eventTracker';
import { resolveRoomImage } from '../data/demoSandboxData';
import type { Room } from '../types/api';
import {
  BackLink,
  Breadcrumbs,
  PlaceholderNotice,
  formatTransactionalMoney,
} from '../components/ui/Primitives';

export const RoomDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [urlParams] = useSearchParams();
  const navigate = useNavigate();
  const { searchParams, setSearchParams, setSelectedRoom, dataMode } = useBooking();

  const checkIn = urlParams.get('check_in') || searchParams.check_in;
  const checkOut = urlParams.get('check_out') || searchParams.check_out;
  const guestCount = Number(urlParams.get('guest_count') || searchParams.guest_count || 2);

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getRooms(dataMode)
      .then((list) => {
        if (!mounted) return;
        const found = list.find((r) => String(r.id) === String(id)) || null;
        setRoom(found);
        if (found) {
          trackEvent('room_viewed', dataMode, {
            room_id: found.id,
            room_type: found.room_type,
          });
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id, dataMode]);

  const backQueryString = `?check_in=${encodeURIComponent(checkIn)}&check_out=${encodeURIComponent(
    checkOut
  )}&guest_count=${guestCount}`;

  const nights = calculateNights(checkIn, checkOut);

  const handleProceedToBooking = () => {
    if (!room) return;
    setSearchParams((prev) => ({
      ...prev,
      check_in: checkIn,
      check_out: checkOut,
      guest_count: guestCount,
    }));
    setSelectedRoom(room);
    navigate(`/booking${backQueryString}&room_id=${room.id}`);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-6 w-48 bg-sand/70 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 aspect-[4/3] bg-sand/60 rounded-2xl animate-pulse" />
          <div className="lg:col-span-5 h-80 bg-sand/50 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="font-display text-3xl font-semibold text-charcoal">Room Not Found</h1>
        <p className="mt-3 text-sm text-charcoal/80">
          The requested room could not be found in the current catalog.
        </p>
        <Link
          to={`/rooms${backQueryString}`}
          className="mt-6 inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg bg-forest text-ivory text-sm font-medium"
        >
          Return to Available Rooms
        </Link>
      </div>
    );
  }

  const exceedsCapacity = guestCount > room.capacity;
  const imageUrl = room.image_url || resolveRoomImage(room.room_type);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Rooms', to: `/rooms${backQueryString}` },
          { label: room.room_type },
        ]}
      />
      <BackLink to={`/rooms${backQueryString}`} label="Back to available rooms" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Imagery & Room Overview */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl overflow-hidden border border-sand bg-white">
            <div className="aspect-[4/3] bg-sand/40">
              {!imgFailed ? (
                <img
                  src={imageUrl}
                  alt={`${room.room_type} interior at KARAMO Hotels`}
                  className="w-full h-full object-cover"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-forest font-medium">
                  {room.room_type} — KARAMO Hotels
                </div>
              )}
            </div>
            {dataMode === 'sandbox' && (
              <p className="px-4 py-2.5 text-xs text-charcoal/70 bg-ivory border-t border-sand">
                Illustrative demonstration imagery. Official property photography will replace placeholders before production launch.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-sand bg-white p-6 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-forest">
                {room.hotel_name || 'KARAMO Hotels'}
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-charcoal mt-1">
                {room.room_type}
              </h1>
              <p className="text-sm text-charcoal/75 mt-1">
                {room.hotel_location || '[Location Placeholder]'}
              </p>
            </div>

            <p className="text-base text-charcoal/90 leading-relaxed">
              {room.description || 'Refined contemporary accommodation designed for restful stays.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-sand">
              <div>
                <p className="text-xs text-charcoal/65 uppercase font-semibold">Max Capacity</p>
                <p className="text-sm font-medium text-charcoal mt-1 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-forest" aria-hidden="true" />
                  <span>{room.capacity} Guests</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-charcoal/65 uppercase font-semibold">Bed Setup</p>
                <p className="text-sm font-medium text-charcoal mt-1">
                  {room.bed_configuration_placeholder || 'Pending property specification'}
                </p>
              </div>
              <div>
                <p className="text-xs text-charcoal/65 uppercase font-semibold">Floor Area</p>
                <p className="text-sm font-medium text-charcoal mt-1">
                  {room.room_size_placeholder || 'Pending property specification'}
                </p>
              </div>
            </div>

            {room.illustrative_amenities && room.illustrative_amenities.length > 0 && (
              <div className="pt-4 border-t border-sand">
                <h2 className="font-sans text-sm font-semibold text-charcoal mb-3">
                  Room Features (Illustrative — Confirm with Property)
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {room.illustrative_amenities.map((amenity) => (
                    <li key={amenity} className="flex items-center gap-2 text-sm text-charcoal/85">
                      <Check className="w-4 h-4 text-success shrink-0" aria-hidden="true" />
                      <span>{amenity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <PlaceholderNotice title="Check-in, Check-out & Meal Policy Notice">
            Standard check-in/out times and breakfast/Wi-Fi inclusions are pending final property management confirmation. Review our{' '}
            <Link to="/terms" className="font-semibold text-forest underline">
              Terms &amp; Conditions
            </Link>{' '}
            or contact our concierge before booking if you require verified arrival flexibility.
          </PlaceholderNotice>
        </div>

        {/* Right: Stay Summary & Reserve Card */}
        <aside className="lg:col-span-5 rounded-2xl border border-sand bg-white p-6 space-y-5 lg:sticky lg:top-24">
          <div className="pb-4 border-b border-sand flex items-baseline justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold text-forest tabular-nums">
                {formatTransactionalMoney(room.price_per_night)}
              </p>
              <p className="text-xs text-charcoal/65">per night</p>
            </div>
            <span className="text-xs font-medium text-charcoal/75">
              Room ID #{room.id}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-sand/60">
              <span className="text-charcoal/75 inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-forest" aria-hidden="true" />
                Check-in
              </span>
              <span className="font-medium text-charcoal tabular-nums">{checkIn}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-sand/60">
              <span className="text-charcoal/75 inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-forest" aria-hidden="true" />
                Check-out
              </span>
              <span className="font-medium text-charcoal tabular-nums">{checkOut}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-sand/60">
              <span className="text-charcoal/75 inline-flex items-center gap-1.5">
                <Users className="w-4 h-4 text-forest" aria-hidden="true" />
                Guests
              </span>
              <span className="font-medium text-charcoal tabular-nums">
                {guestCount} (max {room.capacity})
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-charcoal/75">Estimated Nights</span>
              <span className="font-medium text-charcoal tabular-nums">
                {nights > 0 ? `${nights} ${nights === 1 ? 'night' : 'nights'}` : 'Select valid dates'}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-ivory border border-sand p-4 text-xs text-charcoal/80 leading-relaxed">
            Authoritative booking total (nightly rate &times; nights) and a 15-minute soft hold are calculated and locked on our server when you initiate checkout.
          </div>

          {exceedsCapacity && (
            <div role="alert" className="rounded-xl border border-error/40 bg-[#FAEDED] p-3 text-xs text-[#943535]">
              Your selected guest count ({guestCount}) exceeds this room&apos;s maximum capacity ({room.capacity}). Return to availability search to adjust guests or choose a larger suite.
            </div>
          )}

          <button
            type="button"
            disabled={exceedsCapacity || nights < 1}
            onClick={handleProceedToBooking}
            className="w-full min-h-[48px] px-5 py-3 rounded-lg bg-forest text-ivory text-sm font-semibold hover:bg-evergreen transition-colors disabled:opacity-50"
          >
            Continue to Booking
          </button>

          <Link
            to={`/rooms${backQueryString}`}
            className="block text-center text-xs font-medium text-forest hover:underline"
          >
            Change dates or guest count
          </Link>
        </aside>
      </div>
    </div>
  );
};
