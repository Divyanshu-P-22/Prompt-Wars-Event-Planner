'use client';

/**
 * @file page.tsx
 * @description Event Detail page container for CelebrateAI.
 * Loads the active CelebrateEvent from EventContext, displays event metadata, quick stats progress,
 * and 5 interactive tabs: Overview, Budget, Timeline, Vendors, and AI Ideas.
 */

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  DollarSign,
  Calendar,
  Users,
  Sparkles,
  MapPin,
  Clock,
  ArrowLeft,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import type { CelebrateEvent } from '@/types';
import { useEvents } from '@/context/EventContext';
import {
  formatCurrency,
  formatDate,
  getDaysUntil,
  getEventEmoji,
  getEventColor,
  calculateBudgetProgress,
  calculateTimelineProgress,
  cn,
} from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { OverviewTab } from '@/components/event-detail/overview-tab';
import { BudgetTab } from '@/components/event-detail/budget-tab';
import { TimelineTab } from '@/components/event-detail/timeline-tab';
import { VendorsTab } from '@/components/event-detail/vendors-tab';
import { IdeasTab } from '@/components/event-detail/ideas-tab';

interface PageProps {
  params?: {
    id?: string;
  };
}

/**
 * Event detail page managing all aspects of an event.
 *
 * @param props - Next.js page props with route params.
 * @returns JSX.Element event detail page.
 */
export default function EventDetailPage({ params }: PageProps): React.JSX.Element {
  const router = useRouter();
  const routeParams = useParams<{ id: string }>();
  const eventId = routeParams?.id || params?.id || '';

  const { getEvent, updateEvent, loading } = useEvents();
  const [event, setEvent] = useState<CelebrateEvent | null>(null);

  // Sync event from context on load
  useEffect(() => {
    if (eventId) {
      const found = getEvent(eventId);
      if (found) {
        setEvent(found);
      }
    }
  }, [eventId, getEvent, loading]);

  /**
   * Applies updates to the active event and updates local state.
   */
  const handleUpdateEvent = (updates: Partial<CelebrateEvent>): void => {
    if (!event) return;

    const updated = updateEvent(event.id, updates);
    if (updated) {
      setEvent(updated);
    } else {
      setEvent((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  // Quick stats metrics
  const budgetStats = useMemo(() => {
    if (!event) return { spent: 0, total: 0, percent: 0 };
    const spent = (event.budgetItems || []).reduce(
      (sum, item) => sum + (Number(item.actualCost) || 0),
      0
    );
    const total = event.totalBudget || 0;
    const percent = total > 0 ? Math.min(Math.round((spent / total) * 100), 100) : 0;
    return { spent, total, percent };
  }, [event]);

  const timelineStats = useMemo(() => {
    if (!event || !event.timelineItems) return { completed: 0, total: 0, percentage: 0 };
    return calculateTimelineProgress(event.timelineItems);
  }, [event]);

  const vendorStats = useMemo(() => {
    if (!event || !event.vendors) return { booked: 0, total: 0 };
    const total = event.vendors.length;
    const booked = event.vendors.filter(
      (v) => v.status === 'booked' || v.status === 'paid'
    ).length;
    return { booked, total };
  }, [event]);

  // Loading state
  if (loading && !event) {
    return (
      <main className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading celebration details...</p>
        </div>
      </main>
    );
  }

  // Not Found state
  if (!event) {
    return (
      <main className="min-h-screen pt-24 pb-16 flex items-center justify-center section-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="glass-card max-w-md w-full p-8 text-center space-y-4 border border-white/60 shadow-xl"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-7 h-7" aria-hidden="true" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900">Event Not Found</h1>
            <p className="text-sm text-gray-500">
              The celebration you are looking for does not exist or may have been removed.
            </p>
          </div>

          <div className="pt-2">
            <Link href="/dashboard" className="btn-primary w-full inline-flex">
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  const daysUntil = getDaysUntil(event.date);
  const countdownText =
    daysUntil > 0
      ? `in ${daysUntil} days`
      : daysUntil === 0
      ? 'today!'
      : `${Math.abs(daysUntil)} days ago`;

  return (
    <main className="min-h-screen pt-20 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="section-container space-y-8"
      >
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-violet-700 transition-colors py-1 px-2 rounded-lg hover:bg-violet-50/60"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Dashboard</span>
          </Link>

          <span
            className={cn(
              'text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border',
              getEventColor(event.type)
            )}
          >
            {event.type}
          </span>
        </div>

        {/* Event Header Banner */}
        <header className="glass-card p-6 sm:p-8 border border-white/80 bg-gradient-to-br from-white/95 via-violet-50/20 to-rose-50/20 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Title & Metadata */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl select-none" role="img" aria-label="Event icon">
                  {getEventEmoji(event.type)}
                </span>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {event.name}
                  </h1>
                  {event.description && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 line-clamp-1 max-w-2xl">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Meta Chips */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-700 font-medium pt-1">
                {/* Date */}
                <div className="flex items-center gap-1.5 bg-white/70 px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                  <Calendar className="w-4 h-4 text-violet-600" aria-hidden="true" />
                  <span>{formatDate(event.date)}</span>
                  <span className="text-xs text-gray-400">({countdownText})</span>
                </div>

                {/* Location */}
                {event.location && (
                  <div className="flex items-center gap-1.5 bg-white/70 px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                    <MapPin className="w-4 h-4 text-rose-500" aria-hidden="true" />
                    <span>{event.location}</span>
                  </div>
                )}

                {/* Guest Count */}
                <div className="flex items-center gap-1.5 bg-white/70 px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                  <Users className="w-4 h-4 text-amber-500" aria-hidden="true" />
                  <span>{event.guestCount} Guests</span>
                </div>

                {/* Total Budget */}
                <div className="flex items-center gap-1.5 bg-white/70 px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                  <DollarSign className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  <span>{formatCurrency(event.totalBudget)} Budget</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Quick Stats Row */}
        <section aria-label="Quick Performance Metrics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Budget Progress */}
            <div className="glass-card p-5 border border-white/60 bg-white/85 shadow-sm">
              <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
                <span>Budget Spent</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(budgetStats.spent)} / {formatCurrency(budgetStats.total)}
                </span>
              </div>
              <div className="mt-3 h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${budgetStats.percent}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full bg-gradient-to-r from-violet-600 to-purple-600 rounded-full"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>{budgetStats.percent}% allocated</span>
                <span>{formatCurrency(Math.max(0, budgetStats.total - budgetStats.spent))} left</span>
              </div>
            </div>

            {/* Timeline Progress */}
            <div className="glass-card p-5 border border-white/60 bg-white/85 shadow-sm">
              <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
                <span>Timeline Progress</span>
                <span className="font-bold text-slate-800">
                  {timelineStats.completed} / {timelineStats.total} Tasks
                </span>
              </div>
              <div className="mt-3 h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${timelineStats.percentage}%` }}
                  transition={{ duration: 0.6 }}
                  className="h-full bg-gradient-to-r from-purple-600 to-rose-500 rounded-full"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>{timelineStats.percentage}% completed</span>
                <span>{timelineStats.total - timelineStats.completed} remaining</span>
              </div>
            </div>

            {/* Vendors Booked */}
            <div className="glass-card p-5 border border-white/60 bg-white/85 shadow-sm">
              <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
                <span>Vendors Booked</span>
                <span className="font-bold text-slate-800">
                  {vendorStats.booked} / {vendorStats.total} Booked
                </span>
              </div>
              <div className="mt-3 h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      vendorStats.total > 0
                        ? Math.round((vendorStats.booked / vendorStats.total) * 100)
                        : 0
                    }%`,
                  }}
                  transition={{ duration: 0.6 }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>
                  {vendorStats.total > 0
                    ? `${Math.round((vendorStats.booked / vendorStats.total) * 100)}% finalized`
                    : 'No vendors listed'}
                </span>
                <span>{vendorStats.total - vendorStats.booked} in negotiation</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5-Tab Navigation Component */}
        <section aria-label="Event Management Tabs">
          <Tabs defaultTab="overview" className="space-y-6">
            <div className="border-b border-gray-200">
              <TabsList className="border-none gap-2">
                <TabsTrigger value="overview" icon={LayoutDashboard}>
                  Overview
                </TabsTrigger>
                <TabsTrigger value="budget" icon={DollarSign}>
                  Budget
                </TabsTrigger>
                <TabsTrigger value="timeline" icon={Calendar}>
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="vendors" icon={Users}>
                  Vendors
                </TabsTrigger>
                <TabsTrigger value="ideas" icon={Sparkles}>
                  AI Ideas
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: Overview */}
            <TabsContent value="overview">
              <OverviewTab event={event} onUpdate={handleUpdateEvent} />
            </TabsContent>

            {/* TAB 2: Budget */}
            <TabsContent value="budget">
              <BudgetTab event={event} onUpdate={handleUpdateEvent} />
            </TabsContent>

            {/* TAB 3: Timeline */}
            <TabsContent value="timeline">
              <TimelineTab event={event} onUpdate={handleUpdateEvent} />
            </TabsContent>

            {/* TAB 4: Vendors */}
            <TabsContent value="vendors">
              <VendorsTab event={event} onUpdate={handleUpdateEvent} />
            </TabsContent>

            {/* TAB 5: AI Ideas & Chat */}
            <TabsContent value="ideas">
              <IdeasTab event={event} onUpdate={handleUpdateEvent} />
            </TabsContent>
          </Tabs>
        </section>
      </motion.div>
    </main>
  );
}
