import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { APPROVED_FAQS } from './src/data/faqData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const BACKEND_API_URL = (process.env.BACKEND_API_URL || '').replace(/\/+$/, '');
const DS_API_BASE_URL = (process.env.DS_API_BASE_URL || '').replace(/\/+$/, '');

function hasConfiguredGeminiKey(): boolean {
  const key = process.env.GEMINI_API_KEY?.trim();
  return Boolean(key && key !== 'MY_GEMINI_API_KEY');
}

let cachedAiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!hasConfiguredGeminiKey()) return null;
  if (!cachedAiClient) {
    cachedAiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedAiClient;
}

const ESCALATION_PATTERNS = [
  /\b(emergency|ambulance|medical|bleeding|fire|police|security threat|unsafe|danger|assault)\b/i,
  /\b(dispute|charged twice|double charge|stolen|fraud|chargeback|debited|refund stuck|money deducted)\b/i,
  /\b(angry|furious|terrible|unacceptable|complaint|manager|human|agent|representative|speak to someone|talk to a human)\b/i,
];

function detectEscalationTrigger(message: string, failedTurns: number): {
  triggered: boolean;
  reason: string | null;
} {
  if (failedTurns >= 2) {
    return { triggered: true, reason: 'Repeated clarification needed — offering human concierge.' };
  }
  if (ESCALATION_PATTERNS[0].test(message)) {
    return {
      triggered: true,
      reason: 'Urgent safety or medical concern detected — immediate human escalation recommended.',
    };
  }
  if (ESCALATION_PATTERNS[1].test(message)) {
    return {
      triggered: true,
      reason: 'Payment dispute or billing concern detected — connecting to support & finance desk.',
    };
  }
  if (ESCALATION_PATTERNS[2].test(message)) {
    return {
      triggered: true,
      reason: 'Direct request or dissatisfaction detected — human concierge handoff ready.',
    };
  }
  return { triggered: false, reason: null };
}

function matchFaqKnowledgeBase(message: string): {
  reply: string;
  matchedFaqIds: string[];
  uncertain: boolean;
} {
  const stopWords = new Set([
    'how', 'does', 'the', 'work', 'what', 'are', 'can', 'when', 'for', 'with',
    'you', 'your', 'that', 'this', 'from', 'have', 'and', 'not', 'who', 'where',
  ]);
  const tokens = message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !stopWords.has(t));

  if (tokens.length === 0) {
    return {
      reply:
        'Hello! I am the KARAMO Hotels AI Concierge. I can help with approved hotel FAQs, room discovery, booking steps, or checking your signed-in reservations. How may I assist you?',
      matchedFaqIds: [],
      uncertain: false,
    };
  }

  const scored = APPROVED_FAQS.map((faq) => {
    const haystack = `${faq.category} ${faq.question} ${faq.answer}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) score += 1;
      if (faq.question.toLowerCase().includes(token)) score += 2;
    }
    return { faq, score };
  })
    .filter((item) => item.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  if (scored.length === 0) {
    return {
      reply:
        'I do not have a confirmed answer for that specific question in our approved KARAMO Hotels documentation. I recommend speaking directly with a human member of our team so we never share unverified details.',
      matchedFaqIds: [],
      uncertain: true,
    };
  }

  const top = scored[0].faq;
  const second = scored[1]?.faq;
  const parts = [`${top.answer}`];
  if (second && scored[1].score >= 3) {
    parts.push(`Related detail (${second.question}): ${second.answer}`);
  }
  return {
    reply: parts.join('\n\n'),
    matchedFaqIds: scored.map((s) => s.faq.id),
    uncertain: false,
  };
}

async function checkReachable(url: string): Promise<boolean> {
  if (!url) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const resp = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
    return resp.status < 500;
  } catch {
    return false;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  // System capability and connectivity check (exposes booleans only, never secrets or internal URLs)
  app.get('/api/system/status', async (_req: Request, res: Response) => {
    const [transactionalReachable, dsReachable] = await Promise.all([
      BACKEND_API_URL ? checkReachable(`${BACKEND_API_URL}/api/hotels`) : Promise.resolve(false),
      DS_API_BASE_URL
        ? checkReachable(`${DS_API_BASE_URL}/api/v1/guest-experience/checkout-health`)
        : Promise.resolve(false),
    ]);

    res.json({
      transactionalConfigured: Boolean(BACKEND_API_URL),
      transactionalReachable,
      dsConfigured: Boolean(DS_API_BASE_URL),
      dsReachable,
      geminiConfigured: hasConfiguredGeminiKey(),
    });
  });

  // Proxy to TECHYJAUNT_GROUP_7 Transactional Backend
  app.all('/api/backend/*', async (req: Request, res: Response) => {
    if (!BACKEND_API_URL) {
      return res.status(503).json({
        code: 'BACKEND_UNCONFIGURED',
        message: 'Transactional backend (BACKEND_API_URL) is not configured in this environment.',
      });
    }

    const upstreamPath = req.originalUrl.replace(/^\/api\/backend/, '/api');
    const targetUrl = `${BACKEND_API_URL}${upstreamPath}`;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (req.headers.authorization) {
        headers['Authorization'] = req.headers.authorization;
      }

      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
      };

      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const upstreamRes = await fetch(targetUrl, fetchOptions);
      const rawText = await upstreamRes.text();
      res.status(upstreamRes.status);
      try {
        return res.json(JSON.parse(rawText));
      } catch {
        return res.send(rawText);
      }
    } catch {
      return res.status(503).json({
        code: 'BACKEND_UNREACHABLE',
        message: 'Unable to reach the configured transactional backend service.',
      });
    }
  });

  // Proxy to FastAPI Data Science Service
  app.get('/api/ds/*', async (req: Request, res: Response) => {
    if (!DS_API_BASE_URL) {
      return res.status(503).json({
        code: 'DS_UNCONFIGURED',
        message: 'Data Science analytical service (DS_API_BASE_URL) is not configured.',
      });
    }

    const upstreamPath = req.originalUrl.replace(
      /^\/api\/ds/,
      '/api/v1/guest-experience'
    );
    const targetUrl = `${DS_API_BASE_URL}${upstreamPath}`;

    try {
      const upstreamRes = await fetch(targetUrl, { method: 'GET' });
      const rawText = await upstreamRes.text();
      res.status(upstreamRes.status);
      try {
        return res.json(JSON.parse(rawText));
      } catch {
        return res.send(rawText);
      }
    } catch {
      return res.status(503).json({
        code: 'DS_UNREACHABLE',
        message: 'Unable to reach the configured Data Science analytical service.',
      });
    }
  });

  // Grounded Server-Side Virtual Assistant Endpoint
  app.post('/api/assistant/chat', async (req: Request, res: Response) => {
    const {
      message,
      history = [],
      roomCatalogSummary = [],
      authenticatedUserContext = null,
      dataMode = 'sandbox',
      failedTurns = 0,
    } = (req.body || {}) as {
      message?: string;
      history?: Array<{ role: 'user' | 'assistant'; text: string }>;
      roomCatalogSummary?: Array<{
        id: number;
        room_type: string;
        price_per_night: number | string;
        capacity: number;
      }>;
      authenticatedUserContext?: {
        isAuthenticated: boolean;
        firstName?: string;
        bookingsSummary?: Array<{
          booking_id: number;
          room_type: string;
          check_in: string;
          check_out: string;
          booking_status: string;
          payment_status: string | null;
        }>;
      } | null;
      dataMode?: 'live' | 'sandbox';
      failedTurns?: number;
    };

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Please enter a message for the concierge.' });
    }

    const trimmed = message.trim().slice(0, 1000);
    const escalation = detectEscalationTrigger(trimmed, Number(failedTurns) || 0);
    const faqFallback = matchFaqKnowledgeBase(trimmed);

    const ai = getAiClient();
    if (!ai) {
      return res.json({
        reply: escalation.triggered
          ? `${faqFallback.reply}\n\n${escalation.reason} You can use the "Talk to a Human" button below to connect directly with KARAMO Hotels support.`
          : faqFallback.reply,
        source: 'faq_knowledge_base',
        escalateRecommended: escalation.triggered || faqFallback.uncertain,
        escalationReason: escalation.reason,
        matchedFaqIds: faqFallback.matchedFaqIds,
      });
    }

    try {
      const faqContext = APPROVED_FAQS.map(
        (f) => `[Q${f.number} - ${f.category}] ${f.question}\nA: ${f.answer}`
      ).join('\n\n');

      const catalogContext =
        roomCatalogSummary.length > 0
          ? JSON.stringify(roomCatalogSummary)
          : 'No live rooms loaded.';

      const authContext = authenticatedUserContext?.isAuthenticated
        ? `Guest IS signed in (${authenticatedUserContext.firstName || 'Guest'}). Known bookings for this signed-in account ONLY: ${JSON.stringify(authenticatedUserContext.bookingsSummary || [])}`
        : 'Guest is NOT signed in. Never invent or reveal personal booking details; prompt them to sign in or visit My Account to check bookings.';

      const systemInstruction = `You are the KARAMO Hotels AI Virtual Concierge.
Strict Rules:
1. Never claim to be human. Be courteous, concise, and clear.
2. Answer ONLY using the Approved Hotel FAQs below, the Room Catalog summary (${dataMode} mode), and the Authenticated Guest Context if signed in.
3. NEVER invent room prices, room availability for specific dates (direct user to the Rooms Search bar if dates haven't been checked), street addresses, check-in/check-out times (those are unconfirmed placeholders), taxes, refund promises, or booking confirmations.
4. Clearly remind the user if they are viewing Sandbox Demo data vs Live data when quoting catalog rates.
5. Never claim you have issued a refund, modified a booking, or cancelled a reservation—explain that online modifications/cancellations require human staff and offer to escalate.
6. If the guest mentions an emergency/safety issue, payment dispute, dissatisfaction, or asks something outside approved FAQs, clearly tell them you are connecting/escalating to a human KARAMO Hotels team member.

=== APPROVED 27 FAQs ===
${faqContext}

=== CURRENT ROOM CATALOG (${dataMode.toUpperCase()}) ===
${catalogContext}

=== AUTHENTICATED GUEST CONTEXT ===
${authContext}`;

      const conversationPrompt = [
        ...history.slice(-6).map((h) => `${h.role === 'user' ? 'Guest' : 'Assistant'}: ${h.text}`),
        `Guest: ${trimmed}`,
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: conversationPrompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const replyText = response.text?.trim() || faqFallback.reply;

      return res.json({
        reply: replyText,
        source: 'gemini_grounded',
        escalateRecommended: escalation.triggered || faqFallback.uncertain,
        escalationReason: escalation.reason,
        matchedFaqIds: faqFallback.matchedFaqIds,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unable to reach Gemini concierge service.';
      return res.status(502).json({
        message: `AI Concierge service error: ${errorMessage}. Check Settings > Secrets if GEMINI_API_KEY is configured, or use the approved FAQ & Human Support options.`,
        fallbackReply: faqFallback.reply,
        escalateRecommended: true,
        escalationReason: escalation.reason || 'AI model unavailable — human support available.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KARAMO Hotels platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
