import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  MessageSquare,
  PhoneForwarded,
  Send,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { getMyBookings } from '../../services/transactionalApi';
import { trackEvent } from '../../services/eventTracker';
import type { MyBookingItem } from '../../types/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  escalateRecommended?: boolean;
  escalationReason?: string | null;
  source?: string;
}

const SUGGESTED_PROMPTS = [
  'How does the 15-minute room hold work?',
  'What payment methods are accepted?',
  'What are standard check-in & check-out times?',
  'When can I submit a stay review?',
];

export const ConciergeWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [failedTurns, setFailedTurns] = useState(0);
  const [hasTrackedStart, setHasTrackedStart] = useState(false);
  const [escalatedPanel, setEscalatedPanel] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Welcome to KARAMO Hotels. I am an automated AI Virtual Concierge grounded in our approved FAQ guide and current room catalog. I can answer policy FAQs, help you discover rooms, or check your signed-in bookings—and you can switch to a human team member anytime.',
    },
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { roomsCatalog, dataMode } = useBooking();
  const { isGuestAuthenticated, guestToken, guestUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, escalatedPanel]);

  const handleOpen = () => {
    setIsOpen(true);
    if (!hasTrackedStart) {
      trackEvent('assistant_started', dataMode, {
        authenticated: isGuestAuthenticated,
      });
      setHasTrackedStart(true);
    }
  };

  const handleEscalateToHuman = (reason?: string) => {
    trackEvent('assistant_escalated', dataMode, {
      reason: reason || 'guest_requested_human',
    });
    setEscalatedPanel(true);
  };

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let bookingsSummary: Array<{
        booking_id: number;
        room_type: string;
        check_in: string;
        check_out: string;
        booking_status: string;
        payment_status: string | null;
      }> = [];

      if (isGuestAuthenticated && guestToken) {
        try {
          const bookings: MyBookingItem[] = await getMyBookings(
            dataMode,
            guestToken,
            guestUser?.id
          );
          bookingsSummary = bookings.slice(0, 5).map((b) => ({
            booking_id: b.booking_id,
            room_type: b.room_type,
            check_in: b.check_in,
            check_out: b.check_out,
            booking_status: b.booking_status,
            payment_status: b.payment_status,
          }));
        } catch {
          bookingsSummary = [];
        }
      }

      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
          roomCatalogSummary: roomsCatalog.map((r) => ({
            id: r.id,
            room_type: r.room_type,
            price_per_night: r.price_per_night,
            capacity: r.capacity,
          })),
          authenticatedUserContext: isGuestAuthenticated
            ? {
                isAuthenticated: true,
                firstName: guestUser?.full_name.split(' ')[0],
                bookingsSummary,
              }
            : { isAuthenticated: false },
          dataMode,
          failedTurns,
        }),
      });

      const data = (await res.json()) as {
        reply?: string;
        fallbackReply?: string;
        message?: string;
        source?: string;
        escalateRecommended?: boolean;
        escalationReason?: string | null;
      };

      const replyText =
        data.reply ||
        (data.fallbackReply
          ? `${data.message}\n\nApproved FAQ Guidance: ${data.fallbackReply}`
          : data.message || 'Unable to answer right now. Please connect with human support.');

      if (data.escalateRecommended) {
        setFailedTurns((c) => c + 1);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: replyText,
          escalateRecommended: Boolean(data.escalateRecommended),
          escalationReason: data.escalationReason,
          source: data.source,
        },
      ]);
    } catch {
      setFailedTurns((c) => c + 1);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'I could not reach the concierge service right now. Please use "Talk to a Human" below for direct assistance.',
          escalateRecommended: true,
          escalationReason: 'Connection interruption',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          type="button"
          onClick={handleOpen}
          aria-label="Open KARAMO Virtual Concierge"
          className="inline-flex items-center gap-2.5 min-h-[48px] px-5 py-3 rounded-full bg-forest text-ivory shadow-lg hover:bg-evergreen transition-colors border border-gold/40"
        >
          <MessageSquare className="w-5 h-5 text-gold" aria-hidden="true" />
          <span className="text-sm font-medium">Concierge</span>
        </button>
      ) : (
        <section
          role="dialog"
          aria-label="KARAMO Hotels Virtual Concierge"
          className="w-[calc(100vw-2rem)] sm:w-[400px] max-h-[82vh] bg-white rounded-2xl border border-sand shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header with clear AI disclosure */}
          <div className="bg-forest text-ivory px-4 py-3.5 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-full bg-evergreen border border-gold/40 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-gold" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold leading-snug">
                  KARAMO Concierge
                </h2>
                <p className="text-[11px] text-ivory/80">
                  AI Assistant &bull; Grounded in approved FAQs
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close concierge panel"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-ivory/80 hover:text-ivory hover:bg-evergreen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Auth / Human Quick Bar */}
          <div className="px-4 py-2 bg-ivory border-b border-sand flex items-center justify-between gap-2 text-xs">
            <span className="text-charcoal/75 inline-flex items-center gap-1">
              {isGuestAuthenticated ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                  <span>Signed in ({guestUser?.full_name.split(' ')[0]})</span>
                </>
              ) : (
                <span>Browsing as guest</span>
              )}
            </span>
            <button
              type="button"
              onClick={() => handleEscalateToHuman('quick_bar')}
              className="inline-flex items-center gap-1 text-forest font-semibold hover:underline"
            >
              <PhoneForwarded className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Talk to a Human</span>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-ivory/40">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    m.role === 'user'
                      ? 'bg-forest text-ivory'
                      : 'bg-white border border-sand text-charcoal'
                  }`}
                >
                  {m.text}
                </div>
                {m.escalateRecommended && (
                  <button
                    type="button"
                    onClick={() => handleEscalateToHuman(m.escalationReason || 'recommended')}
                    className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sand text-forest text-xs font-semibold hover:bg-gold/30 transition-colors"
                  >
                    <PhoneForwarded className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Escalate to Human Team</span>
                  </button>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-charcoal/70 px-2 py-1">
                <Sparkles className="w-3.5 h-3.5 text-forest" aria-hidden="true" />
                <span>Checking approved hotel information...</span>
              </div>
            )}

            {escalatedPanel && (
              <div className="rounded-xl border border-gold/50 bg-sand/50 p-3.5 text-xs space-y-2.5">
                <p className="font-semibold text-forest">Human Concierge Handoff Ready</p>
                <p className="text-charcoal/85 leading-relaxed">
                  For booking modifications, cancellations, payment verification disputes, or urgent property requests, our human team handles every request directly.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/contact', { state: { escalatedFromAssistant: true } });
                    }}
                    className="px-3 py-2 rounded-lg bg-forest text-ivory font-medium hover:bg-evergreen"
                  >
                    Open Support Contact Form
                  </button>
                  <button
                    type="button"
                    onClick={() => setEscalatedPanel(false)}
                    className="px-3 py-2 rounded-lg border border-sand bg-white text-charcoal font-medium"
                  >
                    Continue Chat
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Suggested Prompts */}
          <div className="px-3 py-2 border-t border-sand bg-white flex gap-1.5 overflow-x-auto">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="shrink-0 text-[11px] px-2.5 py-1.5 rounded-md border border-sand bg-ivory text-charcoal hover:border-forest hover:text-forest transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="p-3 border-t border-sand bg-white flex items-center gap-2"
          >
            <label htmlFor="concierge-input" className="sr-only">
              Ask KARAMO Hotels Concierge
            </label>
            <input
              id="concierge-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about bookings, rooms, OTP, or FAQs..."
              className="flex-1 min-h-[44px] px-3 py-2 rounded-lg border border-sand bg-ivory/60 text-sm text-charcoal focus:border-forest focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="min-w-[44px] min-h-[44px] rounded-lg bg-forest text-ivory flex items-center justify-center hover:bg-evergreen disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      )}
    </div>
  );
};
