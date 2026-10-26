/**
 * @file route.ts
 * @description Next.js App Router API route handler for generating a comprehensive AI-powered event plan.
 * Validates the wizard input payload, checks Gemini API configuration, invokes Google Gemini
 * planning services, and returns a structured AIPlan containing budget categories, timeline milestones,
 * vendor recommendations, theme suggestions, and pro tips.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateEventPlan } from '@/lib/gemini';
import { AIPlan, EventType, WizardFormData } from '@/types';

/**
 * Standard informational rate limit headers for AI generation endpoints.
 */
const RATE_LIMIT_HEADERS = {
  'X-RateLimit-Limit': '10',
  'X-RateLimit-Remaining': '9',
  'X-RateLimit-Reset': '60',
} as const;

/**
 * Valid event types supported by CelebrateAI.
 */
const VALID_EVENT_TYPES: readonly EventType[] = ['wedding', 'birthday', 'community'] as const;

/**
 * Sanitizes a string input by trimming and escaping dangerous script tags.
 *
 * @param input - Raw input value to sanitize.
 * @param maxLength - Maximum allowed string length.
 * @returns Sanitized and bounded string.
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
 * POST handler for generating an event plan via Gemini AI.
 *
 * @param request - Incoming Next.js HTTP request containing WizardFormData in JSON body.
 * @returns JSON response with AIPlan on success or descriptive error message on failure.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Verify Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file.',
        },
        { status: 503, headers: RATE_LIMIT_HEADERS }
      );
    }

    // 2. Parse and validate JSON body
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

    // 3. Validate required fields: type, name, date, guestCount, totalBudget
    const rawType = typeof payload.type === 'string' ? payload.type.trim() : '';
    const rawName = sanitizeInput(payload.name, 120);
    const rawDate = typeof payload.date === 'string' ? payload.date.trim() : '';
    const rawGuestCount = Number(payload.guestCount);
    const rawTotalBudget = Number(payload.totalBudget);

    if (!rawType || !VALID_EVENT_TYPES.includes(rawType as EventType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid or missing event type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}.`,
        },
        { status: 400, headers: RATE_LIMIT_HEADERS }
      );
    }

    if (!rawName || rawName.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Event name is required and must be at least 2 characters long.',
        },
        { status: 400, headers: RATE_LIMIT_HEADERS }
      );
    }

    if (!rawDate || isNaN(Date.parse(rawDate))) {
      return NextResponse.json(
        {
          success: false,
          error: 'A valid event date is required (YYYY-MM-DD format recommended).',
        },
        { status: 400, headers: RATE_LIMIT_HEADERS }
      );
    }

    if (!Number.isFinite(rawGuestCount) || rawGuestCount < 1 || rawGuestCount > 100000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Guest count must be a positive number between 1 and 100,000.',
        },
        { status: 400, headers: RATE_LIMIT_HEADERS }
      );
    }

    if (!Number.isFinite(rawTotalBudget) || rawTotalBudget < 0 || rawTotalBudget > 1000000000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Total budget must be a positive number up to 1,000,000,000.',
        },
        { status: 400, headers: RATE_LIMIT_HEADERS }
      );
    }

    // 4. Construct sanitized WizardFormData
    const rawPreferences = (typeof payload.preferences === 'object' && payload.preferences !== null)
      ? (payload.preferences as Record<string, unknown>)
      : {};

    const formData: WizardFormData = {
      type: rawType as EventType,
      name: rawName,
      date: rawDate,
      location: sanitizeInput(payload.location, 200),
      guestCount: Math.round(rawGuestCount),
      totalBudget: Math.round(rawTotalBudget * 100) / 100,
      description: sanitizeInput(payload.description, 1000),
      preferences: {
        theme: sanitizeInput(rawPreferences.theme, 100) || undefined,
        style: sanitizeInput(rawPreferences.style, 50) || undefined,
        specialRequirements: sanitizeInput(rawPreferences.specialRequirements, 500) || undefined,
        culturalConsiderations: sanitizeInput(rawPreferences.culturalConsiderations, 500) || undefined,
        cuisine: Array.isArray(rawPreferences.cuisine)
          ? rawPreferences.cuisine
              .filter((c): c is string => typeof c === 'string')
              .map((c) => sanitizeInput(c, 50))
              .filter(Boolean)
          : undefined,
        colorScheme: Array.isArray(rawPreferences.colorScheme)
          ? rawPreferences.colorScheme
              .filter((c): c is string => typeof c === 'string')
              .map((c) => sanitizeInput(c, 30))
              .filter(Boolean)
          : undefined,
      },
    };

    // 5. Call Gemini AI generator
    const plan: AIPlan = await generateEventPlan(formData);

    // 6. Return successful structured response
    return NextResponse.json(
      {
        success: true,
        plan,
      },
      {
        status: 200,
        headers: RATE_LIMIT_HEADERS,
      }
    );
  } catch (error) {
    console.error('[API Route Error - generate-plan]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred while generating the event plan.',
      },
      {
        status: 500,
        headers: RATE_LIMIT_HEADERS,
      }
    );
  }
}
