'use client';

/**
 * @file page.tsx
 * @description Events Dashboard page for CelebrateAI.
 * Displays high-level celebration metrics, an empty state when no events exist,
 * and a responsive card grid for saved CelebrateEvents featuring budget progress bars,
 * timeline completion indicators, and an accessible confirmation modal for deletion.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PartyPopper,
  Plus,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Clock,
  Layers,
} from 'lucide-react';
import type { CelebrateEvent, EventType, EventStatus } from '@/types';
import { useEvents } from '@/context/EventContext';

/**
 * Visual styling configuration for event categories.
 */
interface TypeConfig {
  label: string;
  emoji: string;
  badgeClass: string;
}

const TYPE_CONFIGS: Record<EventType, TypeConfig> = {
  wedding: {
    label: 'Wedding',
    emoji: '💒',
    badgeClass: 'bg-rose-100 text-rose-700 border-rose-200',
  },
  birthday: {
    label: 'Birthday',
    emoji: '🎂',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  community: {
    label: 'Community',
    emoji: '🎪',
    badgeClass: 'bg-violet-100 text-violet-700 border-violet-200',
  },
};

/**
 * Visual styling configuration for event lifecycle statuses.
 */
interface StatusConfig {
  label: string;
  badgeClass: string;
}

const STATUS_CONFIGS: Record<EventStatus, StatusConfig> = {
  planning: {
    label: 'Planning',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
  },
};

/**
 * Formats a monetary number into standard USD currency string.
 *
 * @param {number} amount - Numeric monetary figure.
 * @returns {string} Formatted currency representation.
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

/**
 * Formats an ISO or standard date string into a user-friendly format.
 *
 * @param {string} dateStr - Date string to parse.
 * @returns {string} Readable date string.
 */
function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return 'Date TBD';
  try {
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return dateStr;
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Calculates total spent amount across all budget line items for an event.
 *
 * @param {CelebrateEvent} event - The CelebrateEvent instance.
 * @returns {number} Aggregated amount spent.
 */
function calculateSpentAmount(event: CelebrateEvent): number {
  if (!event.budgetItems || event.budgetItems.length === 0) {
    return 0;
  }
  return event.budgetItems.reduce((sum, item) => {
    if (typeof item.actualCost === 'number' && item.actualCost > 0) {
      return sum + item.actualCost;
    }
    if (item.status === 'paid' || item.status === 'booked') {
      return sum + (item.estimatedCost || 0);
    }
    return sum;
  }, 0);
}

/**
 * Calculates completed vs total tasks for an event's schedule.
 *
 * @param {CelebrateEvent} event - The CelebrateEvent instance.
 * @returns {{ completed: number; total: number; percentage: number }} Progress stats.
 */
function calculateTimelineProgress(event: CelebrateEvent): {
  completed: number;
  total: number;
  percentage: number;
} {
  if (!event.timelineItems || event.timelineItems.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }
  const total = event.timelineItems.length;
  const completed = event.timelineItems.filter(
    (item) => item.status === 'completed'
  ).length;
  const percentage = Math.round((completed / total) * 100);
  return { completed, total, percentage };
}

/**
 * EmptyState component displayed when no events have been created.
 *
 * @returns {JSX.Element} The rendered EmptyState component.
 */
function DashboardEmptyState(): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-10 md:p-16 text-center max-w-2xl mx-auto flex flex-col items-center border border-violet-100 shadow-xl"
      role="region"
      aria-label="No events created yet"
    >
      <div
        className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-violet-100 to-rose-100 text-violet-600 flex items-center justify-center mb-6 shadow-inner"
        aria-hidden="true"
      >
        <PartyPopper className="w-10 h-10 stroke-[1.75]" />
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
        No events yet
      </h2>

      <p className="text-gray-600 text-base max-w-md mx-auto mb-8 leading-relaxed">
        Create your first AI-powered event plan. Our intelligent assistant will
        build your budget breakdown, timeline milestones, and vendor checklists
        in seconds.
      </p>

      <Link
        href="/events/new"
        className="btn-primary text-base px-8 py-3.5 rounded-2xl shadow-lg shadow-violet-500/25 group"
        aria-label="Create your first event"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
        <span>Create Event</span>
        <ArrowRight
          className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden="true"
        />
      </Link>
    </motion.div>
  );
}

/**
 * Dashboard Page component for managing user celebrations.
 *
 * @returns {JSX.Element} The rendered Dashboard page.
 */
export default function DashboardPage(): JSX.Element {
  const { events = [], deleteEvent, loading } = useEvents();
  const [eventToDelete, setEventToDelete] = useState<CelebrateEvent | null>(null);

  // Compute summary stats
  const totalEvents = events.length;
  const totalBudget = events.reduce((sum, ev) => sum + (ev.totalBudget || 0), 0);
  const upcomingEvents = events.filter(
    (ev) => ev.status === 'planning' || ev.status === 'in_progress'
  ).length;
  const completedEvents = events.filter((ev) => ev.status === 'completed').length;

  /**
   * Confirms and executes event deletion.
   */
  const handleConfirmDelete = (): void => {
    if (eventToDelete) {
      deleteEvent(eventToDelete.id);
      setEventToDelete(null);
    }
  };

  /**
   * Cancels the active deletion dialog.
   */
  const handleCancelDelete = (): void => {
    setEventToDelete(null);
  };

  return (
    <div className="section-container py-8 md:py-12 flex flex-col gap-10">
      {/* ===================================================================
          HEADER AREA
          =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200/80">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Your Events
          </h1>
          <p className="text-gray-500 text-sm sm:text-base mt-1">
            Manage your AI-crafted celebrations, track budgets, and monitor milestones.
          </p>
        </div>

        <Link
          href="/events/new"
          className="btn-primary text-sm px-6 py-3 rounded-xl shadow-md w-full sm:w-auto self-start sm:self-auto shrink-0"
          aria-label="Create a new event"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
          <span>Create New Event</span>
        </Link>
      </div>

      {/* ===================================================================
          SUMMARY STATS AT TOP
          =================================================================== */}
      <section
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        aria-label="Dashboard Overview Statistics"
      >
        {/* Total Events */}
        <div className="glass-card p-5 sm:p-6 flex flex-col justify-between border border-violet-100">
          <div className="flex items-center justify-between text-gray-500 text-xs sm:text-sm font-medium mb-3">
            <span>Total Events</span>
            <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
              <Layers className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {totalEvents}
          </div>
          <span className="text-xs text-gray-400 mt-1">
            {totalEvents === 1 ? '1 active celebration' : `${totalEvents} celebrations`}
          </span>
        </div>

        {/* Total Budget */}
        <div className="glass-card p-5 sm:p-6 flex flex-col justify-between border border-violet-100">
          <div className="flex items-center justify-between text-gray-500 text-xs sm:text-sm font-medium mb-3">
            <span>Total Budget</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 truncate">
            {formatCurrency(totalBudget)}
          </div>
          <span className="text-xs text-gray-400 mt-1">Across all planned events</span>
        </div>

        {/* Upcoming Events */}
        <div className="glass-card p-5 sm:p-6 flex flex-col justify-between border border-violet-100">
          <div className="flex items-center justify-between text-gray-500 text-xs sm:text-sm font-medium mb-3">
            <span>Upcoming Events</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {upcomingEvents}
          </div>
          <span className="text-xs text-gray-400 mt-1">Planning or in progress</span>
        </div>

        {/* Completed Events */}
        <div className="glass-card p-5 sm:p-6 flex flex-col justify-between border border-violet-100">
          <div className="flex items-center justify-between text-gray-500 text-xs sm:text-sm font-medium mb-3">
            <span>Completed</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {completedEvents}
          </div>
          <span className="text-xs text-gray-400 mt-1">Celebrations accomplished</span>
        </div>
      </section>

      {/* ===================================================================
          EVENTS GRID OR EMPTY STATE
          =================================================================== */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
          {[1, 2, 3].map((skeleton) => (
            <div
              key={skeleton}
              className="glass-card p-6 h-72 animate-pulse flex flex-col justify-between"
              aria-hidden="true"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
              <div className="space-y-3 py-4">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
              </div>
              <div className="h-8 bg-gray-200 rounded-xl" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <DashboardEmptyState />
      ) : (
        <section
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          aria-label="Events List"
        >
          {events.map((event: CelebrateEvent, index: number) => {
            const typeConfig = TYPE_CONFIGS[event.type] || {
              label: event.type,
              emoji: '🎉',
              badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
            };

            const statusConfig = STATUS_CONFIGS[event.status] || {
              label: event.status,
              badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
            };

            const spentAmount = calculateSpentAmount(event);
            const totalBudgetVal = event.totalBudget || 0;
            const budgetPercentage =
              totalBudgetVal > 0
                ? Math.min(100, Math.round((spentAmount / totalBudgetVal) * 100))
                : 0;

            const timelineStats = calculateTimelineProgress(event);

            return (
              <motion.article
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                className="glass-card p-6 flex flex-col justify-between hover:shadow-2xl hover:scale-[1.01] transition-all duration-200 border border-white/70 relative group"
                aria-labelledby={`event-title-${event.id}`}
              >
                <div>
                  {/* Card Header: Emojis + Badges + Delete */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="text-3xl select-none p-2 rounded-2xl bg-violet-50/80 border border-violet-100/60"
                        role="img"
                        aria-label={typeConfig.label}
                      >
                        {typeConfig.emoji}
                      </span>
                      <div>
                        <h2
                          id={`event-title-${event.id}`}
                          className="text-lg font-bold text-slate-900 group-hover:text-violet-700 transition-colors line-clamp-1"
                        >
                          {event.name}
                        </h2>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {/* Type Badge */}
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${typeConfig.badgeClass}`}
                          >
                            {typeConfig.label}
                          </span>
                          {/* Status Badge */}
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusConfig.badgeClass}`}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete Event Button */}
                    <button
                      type="button"
                      onClick={() => setEventToDelete(event)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 shrink-0"
                      aria-label={`Delete event ${event.name}`}
                      title="Delete event"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Metadata Row: Date & Location */}
                  <div className="space-y-2 py-3 border-y border-gray-100 text-xs text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-violet-500 shrink-0" aria-hidden="true" />
                      <span className="font-medium">{formatDisplayDate(event.date)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" aria-hidden="true" />
                      <span className="truncate">{event.location || 'Location TBD'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                      <span>{event.guestCount ? `${event.guestCount.toLocaleString()} guests` : 'Guest count TBD'}</span>
                    </div>
                  </div>

                  {/* Budget Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-500 font-medium">Budget Tracked</span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(spentAmount)} / {formatCurrency(totalBudgetVal)}
                      </span>
                    </div>
                    <div
                      className="w-full h-2 rounded-full bg-gray-100 overflow-hidden"
                      role="progressbar"
                      aria-valuenow={budgetPercentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Budget utilization"
                    >
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          budgetPercentage > 95
                            ? 'bg-rose-500'
                            : budgetPercentage > 75
                            ? 'bg-amber-500'
                            : 'bg-gradient-to-r from-violet-500 to-purple-600'
                        }`}
                        style={{ width: `${budgetPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Timeline Progress */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-500 font-medium">Timeline Milestones</span>
                      <span className="font-semibold text-slate-800">
                        {timelineStats.completed} of {timelineStats.total} done ({timelineStats.percentage}%)
                      </span>
                    </div>
                    <div
                      className="w-full h-2 rounded-full bg-gray-100 overflow-hidden"
                      role="progressbar"
                      aria-valuenow={timelineStats.percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Timeline milestone progress"
                    >
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${timelineStats.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action: View Details */}
                <Link
                  href={`/events/${event.id}`}
                  className="btn-secondary text-xs sm:text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 group-hover:bg-violet-600 group-hover:text-white group-hover:border-transparent transition-all duration-200"
                  aria-label={`View details for ${event.name}`}
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>View Details</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
              </motion.article>
            );
          })}
        </section>
      )}

      {/* ===================================================================
          DELETE CONFIRMATION MODAL
          =================================================================== */}
      <AnimatePresence>
        {eventToDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-desc"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="glass-card max-w-md w-full p-6 sm:p-8 bg-white/95 shadow-2xl border border-red-100"
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3
                    id="delete-dialog-title"
                    className="text-lg font-bold text-slate-900"
                  >
                    Delete Celebration?
                  </h3>
                  <p className="text-xs text-gray-500">This action cannot be undone.</p>
                </div>
              </div>

              <p id="delete-dialog-desc" className="text-sm text-gray-600 mb-6 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900">&ldquo;{eventToDelete.name}&rdquo;</strong>?
                All associated AI blueprints, budget items, and timeline milestones will be lost.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  className="btn-ghost px-5 py-2.5 rounded-xl text-sm"
                  aria-label="Cancel deletion"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="btn-danger px-5 py-2.5 rounded-xl text-sm"
                  aria-label="Confirm permanent event deletion"
                >
                  Delete Event
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
