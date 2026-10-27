/**
 * @file prompts.ts
 * @description Master prompt engineering templates for Google Gemini AI in CelebrateAI.
 * Builds structured prompts for comprehensive event plan generation, budget analysis,
 * thematic category recommendations, and contextual conversational assistant sessions.
 */

import type { WizardFormData, CelebrateEvent } from '@/types';
import { formatCurrency, formatDate } from './utils';

/**
 * Builds a prompt directing Gemini to generate a complete, structured event plan.
 *
 * @param data - The event configuration gathered from the creation wizard.
 * @returns Formatted prompt string requiring JSON conforming to the AIPlan interface.
 */
export function buildPlanGenerationPrompt(data: WizardFormData): string {
  const cuisineList = data.preferences?.cuisine?.length
    ? data.preferences.cuisine.join(', ')
    : 'Not specified';
  const colorList = data.preferences?.colorScheme?.length
    ? data.preferences.colorScheme.join(', ')
    : 'Not specified';

  return `You are an elite, world-class event planner and creative director specializing in high-touch weddings, memorable birthday milestones, and engaging community celebrations.

Create a comprehensive, personalized, and financially realistic master event plan based on the following specifications:

=== EVENT SPECIFICATIONS ===
- Event Type: ${data.type || 'Celebration'}
- Event Name: ${data.name}
- Target Date: ${data.date || 'TBD'}
- Location / Venue City: ${data.location}
- Expected Guest Count: ${data.guestCount} guests
- Total Budget: ${formatCurrency(data.totalBudget)} ($${data.totalBudget} USD)
- General Description / Vision: ${data.description || 'A joyful celebration tailored to guests.'}

=== PREFERENCES & CONSTRAINTS ===
- Theme: ${data.preferences?.theme || 'Custom celebration'}
- Style: ${data.preferences?.style || 'Sophisticated and warm'}
- Preferred Cuisines: ${cuisineList}
- Color Scheme: ${colorList}
- Cultural / Religious Considerations: ${data.preferences?.culturalConsiderations || 'None specified'}
- Special Requirements / Accessibility: ${data.preferences?.specialRequirements || 'None specified'}

=== INSTRUCTIONS & REQUIREMENTS ===
1. Generate an exhaustive, bespoke event blueprint that strictly adheres to the provided budget ($${data.totalBudget}).
2. The sum of all 'estimatedAmount' values across budget categories must equal the total budget exactly or within 1% margin.
3. Every timeline milestone must feature a realistic ISO date formatted as "YYYY-MM-DD" scheduled logically leading up to the target date (${data.date || 'the celebration'}).
4. Deliver high-value, practical vendor strategies and creative theme options.
5. Your response MUST be valid JSON only. Do not include introductory conversational text or concluding remarks outside the JSON block.

=== REQUIRED JSON OUTPUT STRUCTURE ===
\`\`\`json
{
  "overview": "A compelling 2-3 paragraph executive summary outlining the vision, guest journey, and thematic atmosphere.",
  "highlights": [
    "Key signature moment 1 (e.g. dramatic entrance, interactive cocktail station)",
    "Key signature moment 2",
    "Key signature moment 3",
    "Key signature moment 4"
  ],
  "budgetBreakdown": [
    {
      "category": "Venue & Rentals",
      "percentage": 35,
      "estimatedAmount": 7000,
      "description": "Primary venue hire, ceremony space, seating, and lighting rentals.",
      "priority": "critical"
    },
    {
      "category": "Catering & Beverage",
      "percentage": 30,
      "estimatedAmount": 6000,
      "description": "Multi-course meal, cocktail hour hors d'oeuvres, bar package.",
      "priority": "critical"
    }
  ],
  "timelineMilestones": [
    {
      "title": "Secure Primary Venue",
      "description": "Tour top 3 shortlisted venues and finalize contract deposit.",
      "dueDate": "YYYY-MM-DD",
      "category": "Venue",
      "priority": "critical"
    }
  ],
  "vendorRecommendations": [
    {
      "category": "Catering",
      "importance": "Essential",
      "estimatedBudget": 6000,
      "bookingTimeline": "6-9 months prior",
      "tips": [
        "Schedule tasting session before signing",
        "Request seasonal ingredient alternatives to reduce costs"
      ]
    }
  ],
  "themeSuggestions": [
    {
      "name": "Botanical Elegance",
      "description": "Organic greenery paired with warm candlelight and metallic accents.",
      "colorPalette": ["#2D5A27", "#D4AF37", "#F7F5F0", "#3E2723"],
      "keyElements": ["Hanging eucalyptus arches", "Brass geometric lanterns", "Textured linen napkins"],
      "moodKeywords": ["Warm", "Intimate", "Refined", "Lush"]
    }
  ],
  "tips": [
    "Pro-tip on contracts, buffer funds, guest RSVP management, or day-of coordination."
  ]
}
\`\`\`

Strictly adhere to valid JSON syntax. Prioritize valid values for priority: 'low' | 'medium' | 'high' | 'critical'. Return the JSON block now.`;
}

/**
 * Builds a prompt for generating strategic budget optimization advice.
 *
 * @param event - The CelebrateEvent entity with current budget line items and financial limits.
 * @returns Formatted prompt string for Gemini to generate actionable plain-text financial guidance.
 */
export function buildBudgetAdvicePrompt(event: CelebrateEvent): string {
  const items = event.budgetItems || [];
  const totalSpent = items.reduce((sum, item) => sum + (Number(item.actualCost) || 0), 0);
  const totalEstimated = items.reduce((sum, item) => sum + (Number(item.estimatedCost) || 0), 0);
  const remainingBudget = event.totalBudget - totalSpent;

  const itemsSummary = items.length
    ? items
        .map(
          (item) =>
            `- [${item.category}] ${item.name}: Estimated ${formatCurrency(item.estimatedCost)}, Actual ${formatCurrency(item.actualCost)} (Status: ${item.status})`
        )
        .join('\n')
    : 'No itemized expenses recorded yet.';

  const aiCategories = event.aiPlan?.budgetBreakdown?.length
    ? event.aiPlan.budgetBreakdown
        .map(
          (cat) =>
            `- ${cat.category}: ${cat.percentage}% (${formatCurrency(cat.estimatedAmount)}) - ${cat.description}`
        )
        .join('\n')
    : 'No AI plan categories established.';

  return `You are a financial advisor and certified master event planner. Analyze the following celebration budget and provide actionable, strategic advice to optimize spending, prevent cost overruns, and find hidden savings.

=== EVENT CONTEXT ===
- Event Name: ${event.name}
- Event Type: ${event.type}
- Scheduled Date: ${formatDate(event.date)}
- Location: ${event.location}
- Guest Count: ${event.guestCount}
- Total Allocated Budget: ${formatCurrency(event.totalBudget)}
- Total Committed / Spent: ${formatCurrency(totalSpent)}
- Total Projected Estimates: ${formatCurrency(totalEstimated)}
- Remaining Balance: ${formatCurrency(remainingBudget)}

=== CURRENT TRACKED ITEMS ===
${itemsSummary}

=== TARGET BUDGET BREAKDOWN BENCHMARKS ===
${aiCategories}

=== ANALYSIS INSTRUCTIONS ===
Provide a well-structured markdown assessment covering:
1. **Executive Financial Health**: A 2-sentence summary of whether the budget is healthy, at risk, or overextended.
2. **Top 3 High-Impact Savings Opportunities**: Concrete ways to save 10-20% on the largest line items without compromising guest experience.
3. **Hidden Costs & Buffer Warnings**: 3-4 often-overlooked expenses for a ${event.type} in ${event.location} (e.g. gratuities, delivery surcharges, overtime fees, permits).
4. **Negotiation Playbook**: 2 specific tactical scripts/tips to negotiate with vendors (e.g., caterers, venues, photographers).
5. **Recommended Immediate Action**: The single most urgent next step the planner should execute this week.

Format using clean Markdown with bold headings, bullet points, and exact dollar figures where applicable. Do not wrap in JSON.`;
}

/**
 * Builds a prompt for generating specialized recommendations in a specific category.
 *
 * @param event - The event context.
 * @param category - The target category (e.g., 'themes', 'menu', 'decor', 'entertainment', 'venues').
 * @returns Formatted prompt requiring a JSON array of AIRecommendation objects.
 */
export function buildRecommendationsPrompt(
  event: CelebrateEvent,
  category: string
): string {
  const cuisineList = event.preferences?.cuisine?.join(', ') || 'Eclectic / flexible';
  const colorList = event.preferences?.colorScheme?.join(', ') || 'Harmonious palette';

  return `You are a visionary event designer and producer specializing in ${category} for ${event.type} celebrations.

Generate 4 to 6 creative, distinct, and practical recommendations tailored precisely to this event:

=== EVENT DETAILS ===
- Event: "${event.name}" (${event.type})
- Location: ${event.location}
- Guests: ${event.guestCount}
- Overall Budget: ${formatCurrency(event.totalBudget)}
- Theme / Style: ${event.preferences?.theme || 'Custom'} (${event.preferences?.style || 'Contemporary'})
- Preferred Cuisines: ${cuisineList}
- Color Scheme: ${colorList}
- Cultural Considerations: ${event.preferences?.culturalConsiderations || 'None'}
- Special Requirements: ${event.preferences?.specialRequirements || 'None'}
- Category Requested: "${category}"

=== REQUIREMENTS ===
- Provide a diverse spectrum of options (e.g. classic, modern trendsetting, budget-friendly, and experiential).
- Every recommendation must include concrete actionable details and relevant tags.
- Output MUST be valid JSON only as an array of AIRecommendation objects.

=== JSON SCHEMA ===
\`\`\`json
[
  {
    "id": "rec-1",
    "category": "${category}",
    "title": "Clear, evocative title",
    "description": "Engaging description explaining why this fits the event and how it delights guests.",
    "details": [
      "Specific operational or aesthetic detail 1",
      "Specific detail 2 (e.g., equipment needed, timing, serving style)",
      "Estimated cost impact or vendor requirements"
    ],
    "tags": ["Trending", "Crowd-Pleaser", "Budget-Friendly"]
  }
]
\`\`\`

Return only the valid JSON array enclosed in \`\`\`json ... \`\`\` or raw JSON.`;
}

/**
 * Builds the comprehensive conversational system prompt for the CelebrateAI assistant.
 *
 * @param event - The current active CelebrateEvent context.
 * @returns Master system instruction string for the conversational session.
 */
export function buildChatSystemPrompt(event: CelebrateEvent): string {
  const totalSpent = (event.budgetItems || []).reduce(
    (sum, item) => sum + (Number(item.actualCost) || 0),
    0
  );
  const totalEstimated = (event.budgetItems || []).reduce(
    (sum, item) => sum + (Number(item.estimatedCost) || 0),
    0
  );
  const completedTasks = (event.timelineItems || []).filter(
    (t) => t.status === 'completed'
  ).length;

  const currencySymbol = '$';

  return `You are a friendly, creative event-planning assistant for CelebrateAI.

Answer the user's actual question directly before offering additional services.

Use the event details provided as context, including the guest count, budget, venue, and currency.

For entertainment questions (e.g. "How to make this party full fun?"), suggest practical activities, games, music, food ideas, and a suitable timeline tailored to the specific guest count, venue, and vibe.

For budget questions (e.g. "Help me with reducing the budget"), provide specific cost-saving actions, estimated savings only when supported by available data, and a revised budget when sufficient information is available. If calculating an illustrative savings target, clearly state that it is an illustrative target.

Avoid generic advice about vendor contracts, milestones, or checklists unless the user specifically asks about those topics.

Keep responses conversational, useful, engaging, and specific.
Never invent event details or claim to have analyzed expenses that were not provided.

=== EVENT CONTEXT ===
- Event Title: ${event.name}
- Event Type: ${event.type}
- Status: ${event.status}
- Date: ${formatDate(event.date)}
- Location / Venue: ${event.location || 'Home / Local venue'}
- Guest Count: ${event.guestCount} guests
- Currency: USD (${currencySymbol})
- Total Allocated Budget: ${formatCurrency(event.totalBudget)}
- Tracked Spend to Date: ${formatCurrency(totalSpent)} (Projected: ${formatCurrency(totalEstimated)})
- Description / Vision: ${event.description || 'A joyful celebration'}
- Style & Theme: ${event.preferences?.style || 'Not specified'} / ${event.preferences?.theme || 'Not specified'}
- Cuisine Preferences: ${event.preferences?.cuisine?.join(', ') || 'Not specified'}
- Color Scheme: ${event.preferences?.colorScheme?.join(', ') || 'Not specified'}
- Cultural Considerations: ${event.preferences?.culturalConsiderations || 'None'}
- Special Requirements: ${event.preferences?.specialRequirements || 'None'}
- Current Tasks Completed: ${completedTasks} / ${event.timelineItems?.length || 0}
- Current Vendors Registered: ${event.vendors?.length || 0}`;
}
