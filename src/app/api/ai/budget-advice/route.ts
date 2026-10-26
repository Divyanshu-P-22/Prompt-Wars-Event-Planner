/**
 * @file route.ts
 * @description Next.js App Router API route handler for budget optimization advice.
 * Evaluates the event's financial allocations, guest count, and current line items,
 * invoking Google Gemini to deliver strategic cost-saving tips, contingency planning,
 * and reallocation suggestions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBudgetAdvice } from '@/lib/gemini';
import { CelebrateEvent } from '@/types';

/**
 * Standard informational rate limit headers.
 */
const RATE_LIMIT_HEADERS = {
  'X-RateLimit-Limit': '20',
  'X-RateLimit-Remaining': '19',
  'X-RateLimit-Reset': '60',
} as const;

/**
 * Sanitizes string inputs to prevent script injection and trim whitespace.
 *
 * @param input - Raw input to sanitize.
 * @param maxLength - Maximum allowed character length.
 * @returns Cleaned string.
 */
function sanitizeInput(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .slice(0, maxLength);
}

/**
 * Validates whether the incoming object meets CelebrateEvent structural requirements.
 *
 * @param event - The candidate event object.
 * @returns An error message string if invalid, or null if valid.
 */
function validateEvent(event: unknown): string | null {
  if (!event || typeof event !== 'object') {
    return 'Event data must be a valid JSON object.';
  }

  const candidate = event as Partial<CelebrateEvent>;

  if (!candidate.name || typeof candidate.name !== 'string' || candidate.name.trim().length === 0) {
    return 'Event name is required.';
  }

  if (!candidate.type || !['wedding', 'birthday', 'community'].includes(candidate.type)) {
    return 'Event type is required and must be one of: wedding, birthday, community.';
  }

  if (candidate.totalBudget === undefined || typeof candidate.totalBudget !== 'number' || candidate.totalBudget < 0) {
    return 'Event totalBudget is required and must be a non-negative number.';
  }

  if (candidate.guestCount === undefined || typeof candidate.guestCount !== 'number' || candidate.guestCount < 1) {
    return 'Event guestCount is required and must be a positive integer.';
  }

  return null;
}

/**
 * POST handler for requesting budget optimization advice.
 *
 * @param request - NextRequest holding the event payload.
 * @returns JSON response with AI-generated advice or error details.
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

    const payload = body as Record<string, unknown>;
    // Accept either { event: CelebrateEvent } or direct CelebrateEvent in the body
    const rawEvent = (payload.event && typeof payload.event === 'object' ? payload.event : payload) as Partial<CelebrateEvent>;

    // 3. Validate event data
    const validationError = validateEvent(rawEvent);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400, headers: RATE_LIMIT_HEADERS }
      );
    }

    // 4. Sanitize event details before sending to AI
    const sanitizedEvent: CelebrateEvent = {
      id: rawEvent.id || 'event-temp-id',
      name: sanitizeInput(rawEvent.name, 120),
      type: rawEvent.type!,
      status: rawEvent.status || 'planning',
      date: sanitizeInput(rawEvent.date, 50) || new Date().toISOString().split('T')[0],
      location: sanitizeInput(rawEvent.location, 200),
      guestCount: Math.round(rawEvent.guestCount!),
      totalBudget: Math.round(rawEvent.totalBudget! * 100) / 100,
      description: sanitizeInput(rawEvent.description, 1000),
      preferences: rawEvent.preferences || {},
      aiPlan: rawEvent.aiPlan || null,
      budgetItems: Array.isArray(rawEvent.budgetItems) ? rawEvent.budgetItems : [],
      timelineItems: Array.isArray(rawEvent.timelineItems) ? rawEvent.timelineItems : [],
      vendors: Array.isArray(rawEvent.vendors) ? rawEvent.vendors : [],
      createdAt: rawEvent.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 5. Invoke Gemini AI budget advice service
    const advice: string = await getBudgetAdvice(sanitizedEvent);

    // 6. Return response
    return NextResponse.json(
      {
        success: true,
        advice,
      },
      {
        status: 200,
        headers: RATE_LIMIT_HEADERS,
      }
    );
  } catch (error) {
    console.error('[API Route Error - budget-advice]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred while generating budget advice.',
      },
      {
        status: 500,
        headers: RATE_LIMIT_HEADERS,
      }
    );
  }
}
