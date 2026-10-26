/**
 * @file route.ts
 * @description Next.js App Router API route handler for tailored AI recommendations.
 * Accepts an event object and a recommendation category ('themes' | 'menu' | 'decor' | 'entertainment' | 'venues'),
 * invoking Google Gemini to produce creative, context-specific suggestions with actionable details.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRecommendations } from '@/lib/gemini';
import { AIRecommendation, CelebrateEvent } from '@/types';

/**
 * Valid recommendation categories supported by the endpoint.
 */
const VALID_CATEGORIES = ['themes', 'menu', 'decor', 'entertainment', 'venues'] as const;
type RecommendationCategory = (typeof VALID_CATEGORIES)[number];

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
 * Validates the core event fields necessary for recommendation generation.
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
    return 'Event name is required.';
  }

  if (!candidate.type || !['wedding', 'birthday', 'community'].includes(candidate.type)) {
    return 'Event type is required and must be one of: wedding, birthday, community.';
  }

  if (candidate.totalBudget === undefined || typeof candidate.totalBudget !== 'number' || candidate.totalBudget < 0) {
    return 'Event totalBudget is required and must be a valid non-negative number.';
  }

  if (candidate.guestCount === undefined || typeof candidate.guestCount !== 'number' || candidate.guestCount < 1) {
    return 'Event guestCount is required and must be a positive integer.';
  }

  return null;
}

/**
 * POST handler for generating category-specific recommendations.
 *
 * @param request - NextRequest carrying { event, category } in JSON body.
 * @returns JSON response containing AIRecommendation list or error details.
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

    const { event, category } = body as { event?: unknown; category?: unknown };

    // 3. Validate category
    if (!category || typeof category !== 'string' || !VALID_CATEGORIES.includes(category.toLowerCase() as RecommendationCategory)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid or missing category. Must be one of: ${VALID_CATEGORIES.join(', ')}.`,
        },
        { status: 400, headers: RATE_LIMIT_HEADERS }
      );
    }

    const normalizedCategory = category.toLowerCase() as RecommendationCategory;

    // 4. Validate event
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

    // 6. Invoke Gemini recommendations service
    const recommendations: AIRecommendation[] = await getRecommendations(sanitizedEvent, normalizedCategory);

    // 7. Return recommendations
    return NextResponse.json(
      {
        success: true,
        recommendations,
      },
      {
        status: 200,
        headers: RATE_LIMIT_HEADERS,
      }
    );
  } catch (error) {
    console.error('[API Route Error - recommendations]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred while generating recommendations.',
      },
      {
        status: 500,
        headers: RATE_LIMIT_HEADERS,
      }
    );
  }
}
