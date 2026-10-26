/**
 * @file route.ts
 * @description Next.js App Router API route handler for real-time AI assistant chat.
 * Maintains conversation flow by taking existing message history, active CelebrateEvent context,
 * and user message to query Google Gemini for customized event planning advice and responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { chatWithAI } from '@/lib/gemini';
import { AIMessage, CelebrateEvent } from '@/types';

/**
 * Standard informational rate limit headers.
 */
const RATE_LIMIT_HEADERS = {
  'X-RateLimit-Limit': '30',
  'X-RateLimit-Remaining': '29',
  'X-RateLimit-Reset': '60',
} as const;

/**
 * Sanitizes string inputs to prevent script injection and trim whitespace.
 *
 * @param input - Raw input to sanitize.
 * @param maxLength - Maximum allowed character length.
 * @returns Cleaned string.
 */
function sanitizeInput(input: unknown, maxLength = 2000): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .slice(0, maxLength);
}

/**
 * Sanitizes and validates the conversational history.
 *
 * @param rawMessages - Candidate message array.
 * @returns Validated list of AIMessage objects.
 */
function sanitizeMessages(rawMessages: unknown): AIMessage[] {
  if (!Array.isArray(rawMessages)) {
    return [];
  }

  return rawMessages
    .filter((msg): msg is Record<string, unknown> => typeof msg === 'object' && msg !== null)
    .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
    .map((msg) => ({
      id: typeof msg.id === 'string' ? msg.id : `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: msg.role as 'user' | 'assistant',
      content: sanitizeInput(msg.content, 2000),
      timestamp: typeof msg.timestamp === 'string' ? msg.timestamp : new Date().toISOString(),
    }))
    .filter((msg) => msg.content.length > 0);
}

/**
 * Validates the core event fields necessary for contextual chat.
 *
 * @param event - The candidate event object.
 * @returns Error string if validation fails, or null if valid.
 */
function validateEvent(event: unknown): string | null {
  if (!event || typeof event !== 'object') {
    return 'Missing or invalid event object.';
  }

  const candidate = event as Partial<CelebrateEvent>;

  if (!candidate.name || typeof candidate.name !== 'string' || candidate.name.trim().length === 0) {
    return 'Event name is required for context.';
  }

  if (!candidate.type || !['wedding', 'birthday', 'community'].includes(candidate.type)) {
    return 'Event type is required and must be one of: wedding, birthday, community.';
  }

  return null;
}

/**
 * POST handler for event assistant chat.
 *
 * @param request - NextRequest carrying { event, messages, userMessage } in JSON body.
 * @returns JSON response containing AI message response string or error details.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Verify Gemini API key configuration
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file.',
        },
        { status: 503, headers: RATE_LIMIT_HEADERS }
      );
    }

    // 2. Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload provided in request body.' },
        { status: 400, headers: RATE_LIMIT_HEADERS }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Request body must be a valid JSON object.' },
        { status: 400, headers: RATE_LIMIT_HEADERS }
      );
    }

    const { event, messages, userMessage } = body as {
      event?: unknown;
      messages?: unknown;
      userMessage?: unknown;
    };

    // 3. Validate userMessage
    const sanitizedUserMessage = sanitizeInput(userMessage, 2000);
    if (!sanitizedUserMessage || sanitizedUserMessage.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'userMessage is required and cannot be empty.',
        },
        { status: 400, headers: RATE_LIMIT_HEADERS }
      );
    }

    // 4. Validate event context
    const eventValidationError = validateEvent(event);
    if (eventValidationError) {
      return NextResponse.json(
        { success: false, error: eventValidationError },
        { status: 400, headers: RATE_LIMIT_HEADERS }
      );
    }

    const rawEvent = event as Partial<CelebrateEvent>;

    // 5. Sanitize event details
    const sanitizedEvent: CelebrateEvent = {
      id: rawEvent.id || 'event-temp-id',
      name: sanitizeInput(rawEvent.name, 120),
      type: rawEvent.type!,
      status: rawEvent.status || 'planning',
      date: sanitizeInput(rawEvent.date, 50) || new Date().toISOString().split('T')[0],
      location: sanitizeInput(rawEvent.location, 200),
      guestCount: Math.round(Number(rawEvent.guestCount) || 1),
      totalBudget: Math.round((Number(rawEvent.totalBudget) || 0) * 100) / 100,
      description: sanitizeInput(rawEvent.description, 1000),
      preferences: rawEvent.preferences || {},
      aiPlan: rawEvent.aiPlan || null,
      budgetItems: Array.isArray(rawEvent.budgetItems) ? rawEvent.budgetItems : [],
      timelineItems: Array.isArray(rawEvent.timelineItems) ? rawEvent.timelineItems : [],
      vendors: Array.isArray(rawEvent.vendors) ? rawEvent.vendors : [],
      createdAt: rawEvent.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 6. Sanitize messages list
    const sanitizedMessages: AIMessage[] = sanitizeMessages(messages);

    // 7. Call Gemini AI chat service
    const response: string = await chatWithAI(sanitizedEvent, sanitizedMessages, sanitizedUserMessage);

    // 8. Return successful response
    return NextResponse.json(
      {
        success: true,
        response,
      },
      {
        status: 200,
        headers: RATE_LIMIT_HEADERS,
      }
    );
  } catch (error) {
    console.error('[API Route Error - chat]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred while communicating with the AI assistant.',
      },
      {
        status: 500,
        headers: RATE_LIMIT_HEADERS,
      }
    );
  }
}
