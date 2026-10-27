/**
 * @file gemini.ts
 * @description Server-side Google Gemini AI client integration for CelebrateAI.
 * Orchestrates GenAI event plan creation, budget optimization advice, thematic recommendations,
 * and conversational planning interactions with robust fallback mechanisms and error handling.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  AIPlan,
  AIRecommendation,
  AIMessage,
  CelebrateEvent,
  WizardFormData,
} from '@/types';
import {
  buildPlanGenerationPrompt,
  buildBudgetAdvicePrompt,
  buildRecommendationsPrompt,
  buildChatSystemPrompt,
} from './prompts';
import { formatCurrency } from './utils';

// Initialize the Google Generative AI client with the server-side environment key
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

/**
 * Extracts and parses JSON content from a model response string,
 * safely handling markdown code blocks and wrapping text.
 *
 * @param rawText - Raw text output from the Gemini model.
 * @returns Parsed JSON object or array.
 * @throws Error if no valid JSON can be extracted.
 */
function extractJsonFromResponse<T>(rawText: string): T {
  let cleaned = rawText.trim();

  // Strip markdown code fences if present (e.g. ```json ... ``` or ``` ...)
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = cleaned.match(codeBlockRegex);
  if (match && match[1]) {
    cleaned = match[1].trim();
  }

  // Attempt direct parse first
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Locate the first '{' or '[' and matching closing bracket
    const firstBrace = cleaned.search(/[\{\[]/);
    const lastCurly = cleaned.lastIndexOf('}');
    const lastSquare = cleaned.lastIndexOf(']');
    const lastBrace = Math.max(lastCurly, lastSquare);

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(extracted) as T;
    }

    throw new Error('Could not parse valid JSON from AI response text.');
  }
}

/**
 * Generates a comprehensive master event plan using Gemini AI.
 * Falls back to a deterministic, high-quality event plan if API calls fail or credentials are missing.
 *
 * @param eventData - Event parameters collected from the multi-step wizard.
 * @returns Complete AIPlan structure containing budget breakdowns, timeline milestones, and suggestions.
 */
export async function generateEventPlan(eventData: WizardFormData): Promise<AIPlan> {
  if (!apiKey) {
    console.warn('[Gemini] GEMINI_API_KEY is not defined. Supplying fallback event plan.');
    return getFallbackEventPlan(eventData);
  }

  try {
    const prompt = buildPlanGenerationPrompt(eventData);
    const responseResult = await model.generateContent(prompt);
    const response = await responseResult.response;
    const responseText = response.text();

    const parsedPlan = extractJsonFromResponse<AIPlan>(responseText);

    // Verify required AIPlan fields exist
    if (
      !parsedPlan.overview ||
      !Array.isArray(parsedPlan.budgetBreakdown) ||
      !Array.isArray(parsedPlan.timelineMilestones)
    ) {
      throw new Error('AIPlan response did not conform to required schema structure.');
    }

    return parsedPlan;
  } catch (error) {
    console.error('[Gemini] Error generating event plan:', error);
    return getFallbackEventPlan(eventData);
  }
}

/**
 * Generates customized, actionable budget optimization guidance for an active event.
 *
 * @param event - The CelebrateEvent entity with existing expenses and spending targets.
 * @returns Plain-text or markdown advice evaluating budget health and savings strategies.
 */
export async function getBudgetAdvice(event: CelebrateEvent): Promise<string> {
  if (!apiKey) {
    console.warn('[Gemini] GEMINI_API_KEY is not defined. Supplying fallback budget advice.');
    return getFallbackBudgetAdvice(event);
  }

  try {
    const prompt = buildBudgetAdvicePrompt(event);
    const responseResult = await model.generateContent(prompt);
    const response = await responseResult.response;
    const text = response.text();
    return text || getFallbackBudgetAdvice(event);
  } catch (error) {
    console.error('[Gemini] Error generating budget advice:', error);
    return getFallbackBudgetAdvice(event);
  }
}

/**
 * Generates curated recommendations for a specific event category (e.g. decor, menu, venues).
 *
 * @param event - The active CelebrateEvent entity.
 * @param category - The target category identifier.
 * @returns Array of AIRecommendation objects.
 */
export async function getRecommendations(
  event: CelebrateEvent,
  category: string
): Promise<AIRecommendation[]> {
  if (!apiKey) {
    console.warn('[Gemini] GEMINI_API_KEY is not defined. Supplying fallback recommendations.');
    return getFallbackRecommendations(category);
  }

  try {
    const prompt = buildRecommendationsPrompt(event, category);
    const responseResult = await model.generateContent(prompt);
    const response = await responseResult.response;
    const text = response.text();

    const recommendations = extractJsonFromResponse<AIRecommendation[]>(text);
    if (!Array.isArray(recommendations)) {
      throw new Error('Expected AIRecommendation array from model response.');
    }

    return recommendations;
  } catch (error) {
    console.error(`[Gemini] Error generating recommendations for "${category}":`, error);
    return getFallbackRecommendations(category);
  }
}

/**
 * Carries out a contextual conversational interaction between the planner and CelebrateAI.
 *
 * @param event - The CelebrateEvent context.
 * @param messages - Prior conversational history.
 * @param userMessage - Latest message from the user.
 * @returns The assistant's text response.
 */
export async function chatWithAI(
  event: CelebrateEvent,
  messages: AIMessage[],
  userMessage: string
): Promise<string> {
  if (!apiKey) {
    console.warn('[Gemini] GEMINI_API_KEY is not defined. Supplying fallback chat response.');
    return getFallbackChatResponse(userMessage, event);
  }

  try {
    const systemInstruction = buildChatSystemPrompt(event);
    const formattedHistory = messages
      .slice(-8) // Maintain relevant recent context window
      .map((m) => `${m.role === 'user' ? 'Client' : 'CelebrateAI'}: ${m.content}`)
      .join('\n\n');

    const conversationPrompt = `${systemInstruction}\n\n=== RECENT CONVERSATION ===\n${formattedHistory}\n\nClient: ${userMessage}\n\nCelebrateAI:`;

    const responseResult = await model.generateContent(conversationPrompt);
    const response = await responseResult.response;
    const text = response.text();

    return text || getFallbackChatResponse(userMessage, event);
  } catch (error) {
    console.error('[Gemini] Error in chat interaction:', error);
    return getFallbackChatResponse(userMessage, event);
  }
}

// ============================================================================
// Deterministic Fallback Generators (Safety Nets)
// ============================================================================

/**
 * Creates a deterministic, realistic AIPlan when Gemini is unavailable.
 */
function getFallbackEventPlan(data: WizardFormData): AIPlan {
  const budget = data.totalBudget || 5000;
  const eventDate = data.date || new Date().toISOString().split('T')[0];

  return {
    overview: `A wonderfully organized ${data.type || 'celebration'} in ${data.location || 'your selected city'} for ${data.guestCount || 50} cherished guests, carefully mapped to maximize enjoyment within your ${formatCurrency(budget)} budget.`,
    highlights: [
      `Signature welcome experience customized for ${data.guestCount} guests`,
      `Cohesive ${data.preferences?.style || 'thematic'} decor and ambiance`,
      `Curated culinary selection catering to diverse dietary tastes`,
      `Well-paced timeline milestones ensuring stress-free execution`,
    ],
    budgetBreakdown: [
      {
        category: 'Venue & Rentals',
        percentage: 35,
        estimatedAmount: Math.round(budget * 0.35),
        description: 'Event space hire, staging, tables, and seating',
        priority: 'critical',
      },
      {
        category: 'Catering & Beverages',
        percentage: 30,
        estimatedAmount: Math.round(budget * 0.3),
        description: 'Multi-course dining, beverages, bar setup, and tableware',
        priority: 'critical',
      },
      {
        category: 'Decor & Florals',
        percentage: 15,
        estimatedAmount: Math.round(budget * 0.15),
        description: 'Centerpieces, ambient lighting, signage, and entry accents',
        priority: 'medium',
      },
      {
        category: 'Photography & Media',
        percentage: 12,
        estimatedAmount: Math.round(budget * 0.12),
        description: 'Professional photographer or photo booth capture',
        priority: 'high',
      },
      {
        category: 'Contingency & Buffer',
        percentage: 8,
        estimatedAmount: Math.round(budget * 0.08),
        description: 'Emergency buffer and miscellaneous unexpected items',
        priority: 'high',
      },
    ],
    timelineMilestones: [
      {
        title: 'Lock In Venue & Date',
        description: 'Tour top shortlisted venues and finalize deposit contract.',
        dueDate: eventDate,
        category: 'Venue',
        priority: 'critical',
      },
      {
        title: 'Book Catering & Key Vendors',
        description: 'Confirm menu tastings, staffing, and primary vendor deposits.',
        dueDate: eventDate,
        category: 'Vendors',
        priority: 'high',
      },
      {
        title: 'Send Invitations & Launch RSVP',
        description: 'Distribute digital or physical invites with a clear deadline.',
        dueDate: eventDate,
        category: 'Guests',
        priority: 'high',
      },
      {
        title: 'Final Coordination & Run of Show',
        description: 'Review day-of schedule and supplier deliveries.',
        dueDate: eventDate,
        category: 'Logistics',
        priority: 'medium',
      },
    ],
    vendorRecommendations: [
      {
        category: 'Venue',
        importance: 'Critical',
        estimatedBudget: Math.round(budget * 0.35),
        bookingTimeline: '6-9 months prior',
        tips: [
          'Verify load-in access times and noise restrictions',
          'Inquire if chairs and tables are included in rental rates',
        ],
      },
      {
        category: 'Catering',
        importance: 'High',
        estimatedBudget: Math.round(budget * 0.3),
        bookingTimeline: '4-6 months prior',
        tips: [
          'Request a private tasting session before contract signing',
          'Ask for per-person package breakdowns including service fees',
        ],
      },
      {
        category: 'Photography',
        importance: 'High',
        estimatedBudget: Math.round(budget * 0.12),
        bookingTimeline: '3-5 months prior',
        tips: [
          'Review full wedding/event client galleries, not just highlights',
          'Prepare a must-capture group photo shot list',
        ],
      },
    ],
    themeSuggestions: [
      {
        name: data.preferences?.theme || 'Modern Celebratory Elegance',
        description:
          'A contemporary aesthetic blending warm neutrals, subtle metallic accents, and ambient lighting.',
        colorPalette: data.preferences?.colorScheme?.length
          ? data.preferences.colorScheme
          : ['#7C3AED', '#F43F5E', '#F59E0B', '#1E293B'],
        keyElements: [
          'Warm ambient string or uplighting',
          'Custom botanical centerpieces and table runners',
          'Minimalist calligraphy signage and place cards',
        ],
        moodKeywords: ['Joyful', 'Sophisticated', 'Unforgettable', 'Vibrant'],
      },
    ],
    tips: [
      'Maintain an 8-10% contingency buffer to accommodate surprise last-minute fees or guest changes.',
      'Establish a single point-of-contact for all vendors on the day of the event.',
      'Confirm final headcounts with your caterer 10-14 days prior to avoid overpaying.',
    ],
  };
}

/**
 * Creates fallback budget advisory notes when Gemini is unavailable.
 */
function getFallbackBudgetAdvice(event: CelebrateEvent): string {
  const items = event.budgetItems || [];
  const totalSpent = items.reduce((sum, item) => sum + (Number(item.actualCost) || 0), 0);
  const remaining = event.totalBudget - totalSpent;

  return `### Executive Financial Health
Your overall budget of **${formatCurrency(event.totalBudget)}** currently has **${formatCurrency(remaining)}** remaining uncommitted. Allocating funds methodically across your primary vendor categories will protect against eleventh-hour overruns.

### Top 3 High-Impact Savings Opportunities
- **Catering & Beverage Optimization**: Consider a curated beer, wine, and signature cocktail bar rather than a full premium open bar.
- **Floral & Decor Repurposing**: Relocate ceremony or stage floral arrangements to reception dining tables or the photo backdrop.
- **Digital Invitation Suite**: Leverage dynamic digital RSVPs and online communications to eliminate costly paper printing and postage.

### Hidden Costs & Buffer Warnings
- **Service Fees & Gratuities**: Standard 18-22% catering and bartending gratuities are commonly excluded from base quote estimates.
- **Vendor Meals & Overtime**: Budget for vendor hot meals and clearly verify overtime rates in all supplier contracts.
- **Permit & Load-In Fees**: Confirm with your venue whether early access, security, or municipal sound permits require extra fees.

### Negotiation Playbook
1. **Off-Peak Flexibility**: If your date or schedule offers slight flexibility, ask venues for off-peak or weekday package incentives.
2. **Bundle Vendor Services**: Inquire whether your entertainment or photography partners offer bundled lighting, sound, or photo booth options.

### Recommended Immediate Action
Lock in your top 2 highest-cost categories (Venue & Catering) first before committing discretionary funds to smaller decor items.`;
}

/**
 * Creates fallback recommendations for a requested category.
 */
function getFallbackRecommendations(category: string): AIRecommendation[] {
  return [
    {
      id: 'rec-1',
      category,
      title: 'Signature Interactive Station',
      description:
        'An engaging focal point that brings guests together, encourages conversation, and creates memorable photo moments.',
      details: [
        'Requires an 8x8 ft dedicated open floor space',
        'Staffed by 1 attendant for seamless flow',
        'Estimated budget impact: 5-8% of total allocation',
      ],
      tags: ['Interactive', 'Crowd-Favorite', 'Memorable'],
    },
    {
      id: 'rec-2',
      category,
      title: 'Curated Ambient Lighting & Sound',
      description:
        'Transforms the sensory atmosphere dynamically as day transitions into evening celebration.',
      details: [
        'Warm wireless LED uplighting fixtures',
        'Balanced dual-speaker sound zones for speech clarity and background music',
        'Dimmable mood lighting for dining and party segments',
      ],
      tags: ['Ambiance', 'Essential', 'High-Impact'],
    },
    {
      id: 'rec-3',
      category,
      title: 'Personalized Guest Keepsake & Favors',
      description:
        'A thoughtful, sustainable memento tailored to the celebration theme that guests will genuinely value.',
      details: [
        'Eco-friendly packaging and artisanal elements',
        'Can double as elegant escort cards or place markers',
        'Cost-effective when ordered in bulk early',
      ],
      tags: ['Personalized', 'Keepsake', 'Budget-Friendly'],
    },
  ];
}

/**
 * Creates fallback chat assistance when Gemini is unavailable.
 */
function getFallbackChatResponse(userMessage: string, event: CelebrateEvent): string {
  const query = userMessage.toLowerCase();
  const guestCount = event.guestCount || 5;
  const location = event.location || 'home';
  const budget = event.totalBudget || 5000;

  // Entertainment / Fun queries
  if (query.includes('fun') || query.includes('entertainment') || query.includes('activity') || query.includes('game') || query.includes('music')) {
    return `For your ${event.type || 'celebration'} at ${location} with ${guestCount} guests, here are direct ideas to make the party full of fun:

- **Party Games**: Dumb Charades, party trivia tailored to the guest of honor, and a mini scavenger or treasure hunt.
- **Music & Vibe**: Create a collaborative shared playlist where everyone adds 3 favorite tracks, and host a mini dance challenge or lip-sync battle.
- **Interactive Food Station**: Set up a DIY pizza, taco, snack, or mocktail/cocktail station where guests can customize their bites.
- **Capture Memories**: Create a fun photo booth nook with simple props and record short, funny video messages.
- **Signature Surprise**: Organize a special reveal moment, cake ceremony, or a heartfelt group toast.`;
  }

  // Budget reduction queries
  if (query.includes('budget') || query.includes('reduce') || query.includes('cost') || query.includes('saving') || query.includes('cheap') || query.includes('cut')) {
    const targetBudget = Math.round(budget * 0.7);
    const savings = budget - targetBudget;
    return `To help reduce your ${formatCurrency(budget)} budget, here is a practical plan:

First, set a target budget of **${formatCurrency(targetBudget)}** — an illustrative potential saving of **${formatCurrency(savings)} (30%)** (this is an illustrative target, not a calculated estimate from actual receipts):

- **Food & Beverage First**: Prioritize core food and cake, compare local catering or buffet options, and buy only what you need.
- **DIY Decor**: Use fairy lights, candles, and printable banners instead of hiring an expensive commercial decorator.
- **Streamlined Entertainment**: Use a curated playlist and high-quality Bluetooth speaker instead of hiring a costly DJ or live band.
- **Digital Invites**: Send stylish digital invitations via WhatsApp or email to save on printing and postage.
- **Contingency Reserve**: Set aside 10% of your reduced budget as a reserve for unexpected last-minute expenses.`;
  }

  // General specific fallback
  return `Regarding your question about **"${userMessage}"** for **${event.name}** (${guestCount} guests at ${location}, budget: ${formatCurrency(budget)}):

- **Direct Focus**: For a party of this scale, prioritize guest engagement, good food, and a seamless flow over complex logistics.
- **Tailored Suggestion**: Cater specifically to your ${guestCount} attendees by keeping activities interactive and personal.
- **Next Step**: Would you like specific game ideas, a minute-by-minute timeline, or cost-saving tips for this?`;
}
