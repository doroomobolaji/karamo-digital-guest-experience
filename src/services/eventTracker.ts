import type { TrackedEvent, TrackedEventName } from '../types/api';

// Client Analytics Event Tracker
// Strictly non-PII: uses opaque session/room/booking IDs only. Never stores email, phone, full name, or tokens.

const sessionId =
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `sess-${crypto.randomUUID().slice(0, 8)}`
    : `sess-${Math.random().toString(36).slice(2, 10)}`;

const events: TrackedEvent[] = [];
const listeners = new Set<() => void>();

export function trackEvent(
  event_name: TrackedEventName,
  data_origin: 'live' | 'sandbox',
  metadata: Record<string, string | number | boolean | null> = {}
): TrackedEvent {
  // Strip any accidental PII keys defensively
  const sanitizedMetadata: Record<string, string | number | boolean | null> = {};
  const blockedKeys = new Set(['email', 'phone', 'phone_number', 'password', 'token', 'full_name', 'name']);

  for (const [k, v] of Object.entries(metadata)) {
    if (!blockedKeys.has(k.toLowerCase())) {
      sanitizedMetadata[k] = v;
    }
  }

  const entry: TrackedEvent = {
    event_id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    event_name,
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    data_origin,
    metadata: sanitizedMetadata,
  };

  events.unshift(entry);
  if (events.length > 200) {
    events.pop();
  }
  listeners.forEach((cb) => cb());
  return entry;
}

export function getTrackedEvents(): TrackedEvent[] {
  return [...events];
}

export function subscribeTrackedEvents(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
