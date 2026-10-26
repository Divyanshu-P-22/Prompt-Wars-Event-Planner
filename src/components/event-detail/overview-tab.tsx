'use client';

/**
 * @file overview-tab.tsx
 * @description Comprehensive Overview tab component for CelebrateAI event detail dashboard.
 * Displays executive AI plan overview, key highlights checklist, financial health metrics,
 * mini budget distribution bars, upcoming 3 timeline milestones, and actionable AI tips.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  Lightbulb,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import type { CelebrateEvent, AIPlan, BudgetCategory, TimelineMilestone } from '@/types';
import { formatCurrency, formatDateShort, getDaysUntil, getPriorityColor, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface OverviewTabProps {
  /** The CelebrateEvent entity currently being viewed and managed */
  event: CelebrateEvent;
  /** Callback to trigger state and persistence updates on the parent event */
  onUpdate: (updates: Partial<CelebrateEvent>) => void;
}

const CATEGORY_COLORS = [
  'bg-violet-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-teal-500',
];

/**
 * Overview tab providing an executive dashboard of the entire celebration.
 *
 * @param props - OverviewTabProps containing event data and mutation handler.
 * @returns JSX.Element overview dashboard.
 */
export function OverviewTab({ event, onUpdate }: OverviewTabProps): React.JSX.Element {
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

  // Compute financial totals
  const totalBudget = event.totalBudget || 0;
  const spent = (event.budgetItems || []).reduce(
    (sum, item) => sum + (Number(item.actualCost) || 0),
    0
  );
  const remaining = totalBudget - spent;
  const daysUntil = getDaysUntil(event.date);

  // Category breakdown: Prefer actual budget items if recorded, otherwise fallback to AI plan breakdown
  const budgetBreakdown: Array<{ name: string; amount: number; percentage: number }> = React.useMemo(() => {
    if (event.budgetItems && event.budgetItems.length > 0) {
      const categoryMap = new Map<string, number>();
      let totalEst = 0;
      event.budgetItems.forEach((item) => {
        const cost = Number(item.estimatedCost) || Number(item.actualCost) || 0;
        totalEst += cost;
        categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + cost);
      });

      const categories = Array.from(categoryMap.entries()).map(([name, amount]) => ({
        name,
        amount,
        percentage: totalEst > 0 ? Math.round((amount / totalEst) * 100) : 0,
      }));

      return categories.sort((a, b) => b.amount - a.amount).slice(0, 5);
    }

    if (event.aiPlan?.budgetBreakdown && event.aiPlan.budgetBreakdown.length > 0) {
      return event.aiPlan.budgetBreakdown.slice(0, 5).map((cat: BudgetCategory) => ({
        name: cat.category,
        amount: cat.estimatedAmount,
        percentage: cat.percentage,
      }));
    }

    return [];
  }, [event.budgetItems, event.aiPlan]);

  // Upcoming 3 milestones: Prefer timelineItems, fallback to aiPlan.timelineMilestones
  const upcomingMilestones = React.useMemo(() => {
    if (event.timelineItems && event.timelineItems.length > 0) {
      // Filter non-completed items first, then sort by date
      const pending = event.timelineItems
        .filter((task) => task.status !== 'completed')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

      if (pending.length >= 3) {
        return pending.slice(0, 3);
      }
      // If fewer than 3 pending, include completed
      return [...pending, ...event.timelineItems.filter((t) => t.status === 'completed')].slice(0, 3);
    }

    if (event.aiPlan?.timelineMilestones && event.aiPlan.timelineMilestones.length > 0) {
      return event.aiPlan.timelineMilestones.slice(0, 3).map((m: TimelineMilestone, index: number) => ({
        id: `milestone-${index}`,
        title: m.title,
        description: m.description,
        dueDate: m.dueDate,
        priority: m.priority,
        category: m.category,
        status: 'pending' as const,
      }));
    }

    return [];
  }, [event.timelineItems, event.aiPlan]);

  /**
   * Regenerates the AI event plan if missing or requested by the user.
   */
  const handleRegeneratePlan = async (): Promise<void> => {
    setIsRegenerating(true);
    setRegenerateError(null);

    try {
      const response = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: event.type,
          name: event.name,
          date: event.date,
          location: event.location,
          guestCount: event.guestCount,
          totalBudget: event.totalBudget,
          description: event.description,
          preferences: event.preferences,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate plan. Please try again.');
      }

      const generatedPlan = data.plan as AIPlan;

      // Populate default budget items and timeline items if empty
      const updates: Partial<CelebrateEvent> = {
        aiPlan: generatedPlan,
      };

      if (!event.budgetItems || event.budgetItems.length === 0) {
        updates.budgetItems = generatedPlan.budgetBreakdown.map((cat, idx) => ({
          id: `item-gen-${Date.now()}-${idx}`,
          category: cat.category,
          name: `${cat.category} Allocation`,
          estimatedCost: cat.estimatedAmount,
          actualCost: 0,
          status: 'estimated' as const,
          notes: cat.description,
        }));
      }

      if (!event.timelineItems || event.timelineItems.length === 0) {
        updates.timelineItems = generatedPlan.timelineMilestones.map((m, idx) => ({
          id: `task-gen-${Date.now()}-${idx}`,
          title: m.title,
          description: m.description,
          dueDate: m.dueDate,
          status: 'pending' as const,
          priority: m.priority,
          category: m.category,
        }));
      }

      onUpdate(updates);
    } catch (err) {
      console.error('[OverviewTab] Error regenerating plan:', err);
      setRegenerateError(err instanceof Error ? err.message : 'Unknown generation error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const hasPlan = Boolean(event.aiPlan && event.aiPlan.overview);

  return (
    <div className="space-y-8" role="region" aria-label="Event Overview Tab">
      {/* Quick Stats Grid */}
      <section aria-label="Quick Financial and Schedule Statistics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Budget */}
          <motion.div
            whileHover={{ y: -2 }}
            className="glass-card p-5 border border-white/60 bg-gradient-to-br from-white/90 to-violet-50/50 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total Budget
              </span>
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
                <DollarSign className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {formatCurrency(totalBudget)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Allocated target fund</p>
            </div>
          </motion.div>

          {/* Budget Spent */}
          <motion.div
            whileHover={{ y: -2 }}
            className="glass-card p-5 border border-white/60 bg-gradient-to-br from-white/90 to-rose-50/50 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Budget Spent
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                <TrendingUp className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {formatCurrency(spent)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {totalBudget > 0 ? `${Math.round((spent / totalBudget) * 100)}% of total budget` : 'No expenses logged'}
              </p>
            </div>
          </motion.div>

          {/* Budget Remaining */}
          <motion.div
            whileHover={{ y: -2 }}
            className="glass-card p-5 border border-white/60 bg-gradient-to-br from-white/90 to-emerald-50/50 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Budget Remaining
              </span>
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  remaining >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                )}
              >
                {remaining >= 0 ? (
                  <DollarSign className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                )}
              </div>
            </div>
            <div className="mt-3">
              <div
                className={cn(
                  'text-2xl font-bold tracking-tight',
                  remaining >= 0 ? 'text-emerald-700' : 'text-red-600'
                )}
              >
                {formatCurrency(remaining)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {remaining >= 0 ? 'Available unallocated funds' : 'Warning: Over budget!'}
              </p>
            </div>
          </motion.div>

          {/* Days Until Event */}
          <motion.div
            whileHover={{ y: -2 }}
            className="glass-card p-5 border border-white/60 bg-gradient-to-br from-white/90 to-amber-50/50 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Countdown
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                <Clock className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {daysUntil > 0
                  ? `${daysUntil} Days`
                  : daysUntil === 0
                  ? 'Today! 🎉'
                  : `${Math.abs(daysUntil)} Days Ago`}
              </div>
              <p className="text-xs text-gray-500 mt-1">{formatDateShort(event.date)}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Plan Overview Section or Fallback Notice */}
      {!hasPlan ? (
        <section
          aria-label="No AI Plan"
          className="glass-card p-8 border border-dashed border-violet-200 text-center space-y-4 bg-white/60"
        >
          <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-slate-900">No AI Plan Generated</h3>
            <p className="text-sm text-gray-500">
              Generate a personalized event blueprint powered by Google Gemini, complete with a tailored budget, timeline milestones, and vendor guidance.
            </p>
          </div>

          {regenerateError && (
            <div className="max-w-md mx-auto p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{regenerateError}</span>
            </div>
          )}

          <div>
            <Button
              variant="primary"
              onClick={handleRegeneratePlan}
              loading={isRegenerating}
              aria-label="Generate AI event plan"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Generate AI Plan</span>
            </Button>
          </div>
        </section>
      ) : (
        <section
          aria-label="AI Event Master Plan"
          className="glass-card p-6 sm:p-8 border border-violet-100/80 bg-gradient-to-br from-white/95 via-violet-50/20 to-white/90 shadow-md relative overflow-hidden"
        >
          {/* Subtle decorative glow */}
          <div
            className="absolute -top-12 -right-12 w-48 h-48 bg-violet-400/10 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
                <Sparkles className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">AI Master Plan</h2>
                <p className="text-xs text-gray-500">Gemini-crafted celebration strategy</p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleRegeneratePlan}
              loading={isRegenerating}
              aria-label="Regenerate master plan"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isRegenerating && 'animate-spin')} aria-hidden="true" />
              <span>Regenerate Plan</span>
            </Button>
          </div>

          {regenerateError && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{regenerateError}</span>
            </div>
          )}

          {/* Plan Narrative */}
          <div className="mt-5">
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line">
              {event.aiPlan?.overview}
            </p>
          </div>

          {/* Key Highlights Checklist */}
          {event.aiPlan?.highlights && event.aiPlan.highlights.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-800 mb-3">
                Key Highlights & Priorities
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {event.aiPlan.highlights.map((highlight, index) => (
                  <div
                    key={`highlight-${index}`}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-white/70 border border-emerald-100 text-slate-800 shadow-sm text-sm"
                  >
                    <CheckCircle2
                      className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0 stroke-[2.2]"
                      aria-hidden="true"
                    />
                    <span className="leading-snug">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Two Column Layout: Budget Breakdown Bars & Upcoming Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Budget Allocation Mini Chart */}
        <section
          aria-label="Budget Allocation Mini Chart"
          className="glass-card p-6 border border-white/60 bg-white/80 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Budget Allocation
                </h3>
                <p className="text-xs text-gray-500">Estimated category spending distribution</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                Top Categories
              </span>
            </div>

            {budgetBreakdown.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">
                No budget allocations defined yet.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {budgetBreakdown.map((cat, idx) => {
                  const barColor = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                  return (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                        <span className="text-slate-800 font-semibold">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-900 font-bold">
                            {formatCurrency(cat.amount)}
                          </span>
                          <span className="text-xs text-gray-500 w-8 text-right">
                            {cat.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(cat.percentage, 100)}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
                          className={cn('h-full rounded-full', barColor)}
                          role="progressbar"
                          aria-valuenow={cat.percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${cat.name} allocation: ${cat.percentage}%`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Aggregated across key milestones</span>
            <span className="font-semibold text-slate-700">Target: {formatCurrency(totalBudget)}</span>
          </div>
        </section>

        {/* Timeline Overview: Upcoming 3 Milestones */}
        <section
          aria-label="Upcoming Milestones"
          className="glass-card p-6 border border-white/60 bg-white/80 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Upcoming Milestones
                </h3>
                <p className="text-xs text-gray-500">Next critical timeline deadlines</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                Next In Queue
              </span>
            </div>

            {upcomingMilestones.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">
                No upcoming milestones scheduled.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-gray-100">
                {upcomingMilestones.map((item, index) => (
                  <div key={item.id || index} className="py-3 flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900 truncate">
                          {item.title}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border',
                            getPriorityColor(item.priority)
                          )}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-slate-600 shrink-0 font-medium bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      <span>{formatDateShort(item.dueDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Keep milestones updated to stay on track</span>
            <div className="flex items-center gap-1 text-violet-600 font-medium">
              <span>View Timeline</span>
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </div>
          </div>
        </section>
      </div>

      {/* AI Tips Section */}
      {event.aiPlan?.tips && event.aiPlan.tips.length > 0 && (
        <section
          aria-label="AI Event Planning Tips"
          className="glass-card p-6 border border-amber-100/80 bg-gradient-to-br from-amber-50/30 via-white to-amber-50/10 shadow-sm"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-amber-100/60">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Pro Planner Insights & Advice
            </h3>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {event.aiPlan.tips.map((tip, index) => (
              <div
                key={`tip-${index}`}
                className="p-4 rounded-xl bg-white/80 border border-amber-100 shadow-sm flex flex-col justify-between"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-amber-500 font-bold text-sm shrink-0">#{index + 1}</span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{tip}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default OverviewTab;
