import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import type { Room } from '../../types/api';
import { formatTransactionalMoney } from '../ui/Primitives';
import { resolveRoomImage } from '../../data/demoSandboxData';

export const RoomCard: React.FC<{
  room: Room;
  queryString?: string;
  dataMode: 'live' | 'sandbox';
  onSelectRoom?: (room: Room) => void;
}> = ({ room, queryString = '', dataMode, onSelectRoom }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const imageSrc = room.image_url || resolveRoomImage(room.room_type);

  return (
    <article className="rounded-xl border border-sand bg-white overflow-hidden flex flex-col transition-shadow hover:shadow-md">
      <div className="aspect-[4/3] bg-sand/50 relative overflow-hidden">
        {!imgFailed ? (
          <img
            src={imageSrc}
            alt={`${room.room_type} guestroom at KARAMO Hotels`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-sand text-forest/70 text-sm px-4 text-center">
            {room.room_type} — KARAMO Hotels
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-xl font-semibold text-charcoal">
              {room.room_type}
            </h3>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-charcoal/75 shrink-0 pt-1">
              <Users className="w-3.5 h-3.5 text-forest" aria-hidden="true" />
              Up to {room.capacity} {room.capacity === 1 ? 'guest' : 'guests'}
            </span>
          </div>

          <p className="mt-2 text-sm text-charcoal/80 leading-relaxed line-clamp-2">
            {room.description || 'Thoughtfully appointed KARAMO guestroom.'}
          </p>

          {dataMode === 'sandbox' && (
            <p className="mt-2 text-[11px] text-charcoal/60">
              Illustrative photography &amp; sandbox nightly rate
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-sand/80 flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-forest tabular-nums">
              {formatTransactionalMoney(room.price_per_night)}
            </p>
            <p className="text-xs text-charcoal/65">per night</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/rooms/${room.id}${queryString}`}
              onClick={() => onSelectRoom?.(room)}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg bg-forest text-ivory text-sm font-medium hover:bg-evergreen transition-colors"
            >
              <span>View Details</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};
