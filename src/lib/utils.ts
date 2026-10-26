/**
 * @file utils.ts
 * @description General-purpose helper functions for CelebrateAI.
 * Provides class combining, monetary and date formatting, progress metrics,
 * styling lookups for event states and priorities, and unique ID generation.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, differenceInCalendarDays, isValid } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { EventType, Priority, BudgetItem, TimelineItem } from '@/types';

/**
 * Combines conditional class names using clsx and merges Tailwind CSS classes safely.
 *
 * @param inputs - List of class names, conditionals, or objects.
 * @returns Merged class string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a numeric value into a USD currency string.
 *
 * @param amount - The numeric dollar amount to format.
 * @returns Formatted currency string (e.g. "$1,250" or "$1,250.50").
 */
export function formatCurrency(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: safeAmount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}

/**
 * Formats an ISO date string or Date object into a readable date format (e.g., "September 24, 2026").
 *
 * @param date - ISO date string or parseable date string.
 * @returns Formatted date string or fallback representation.
 */
export function formatDate(date: string): string {
  if (!date) return 'No date set';
  try {
    const parsed = parseISO(date);
    if (isValid(parsed)) {
      return format(parsed, 'MMMM d, yyyy');
    }
    const fallback = new Date(date);
    if (isValid(fallback)) {
      return format(fallback, 'MMMM d, yyyy');
    }
  } catch {
    // Return original string on parsing error
  }
  return date;
}

/**
 * Formats an ISO date string into a compact format (e.g., "Sep 24, 2026").
 *
 * @param date - ISO date string or parseable date string.
 * @returns Short formatted date string or fallback.
 */
export function formatDateShort(date: string): string {
  if (!date) return 'TBD';
  try {
    const parsed = parseISO(date);
    if (isValid(parsed)) {
      return format(parsed, 'MMM d, yyyy');
    }
    const fallback = new Date(date);
    if (isValid(fallback)) {
      return format(fallback, 'MMM d, yyyy');
    }
  } catch {
    // Return original string on parsing error
  }
  return date;
}

/**
 * Generates a standard RFC4122 version 4 UUID.
 *
 * @returns A unique identifier string.
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Calculates the number of calendar days remaining until an event date.
 * Returns negative numbers for past dates, zero for today.
 *
 * @param date - ISO date string for the target event.
 * @returns Number of days until the event.
 */
export function getDaysUntil(date: string): number {
  if (!date) return 0;
  try {
    const parsed = parseISO(date);
    const target = isValid(parsed) ? parsed : new Date(date);
    if (isValid(target)) {
      return differenceInCalendarDays(target, new Date());
    }
  } catch {
    return 0;
  }
  return 0;
}

/**
 * Returns an expressive emoji symbol associated with an event type.
 *
 * @param type - The EventType category.
 * @returns Associated Unicode emoji.
 */
export function getEventEmoji(type: EventType): string {
  switch (type) {
    case 'wedding':
      return '💍';
    case 'birthday':
      return '🎂';
    case 'community':
      return '🎉';
    default:
      return '✨';
  }
}

/**
 * Returns Tailwind CSS styling classes matching the theme of the event type.
 *
 * @param type - The EventType category.
 * @returns Tailwind CSS color classes for backgrounds, text, and borders.
 */
export function getEventColor(type: EventType): string {
  switch (type) {
    case 'wedding':
      return 'text-rose-600 bg-rose-50 border-rose-200';
    case 'birthday':
      return 'text-violet-600 bg-violet-50 border-violet-200';
    case 'community':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    default:
      return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

/**
 * Returns Tailwind CSS badge classes corresponding to lifecycle or execution status.
 *
 * @param status - Status string from events, budget items, timelines, or vendors.
 * @returns Tailwind CSS classes matching the status tone.
 */
export function getStatusColor(status: string): string {
  const normalized = (status || '').toLowerCase();
  switch (normalized) {
    case 'completed':
    case 'paid':
    case 'booked':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'in_progress':
    case 'negotiating':
    case 'contacted':
      return 'text-violet-700 bg-violet-50 border-violet-200';
    case 'planning':
    case 'researching':
    case 'quoted':
    case 'estimated':
    case 'pending':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'overdue':
    case 'cancelled':
      return 'text-rose-700 bg-rose-50 border-rose-200';
    default:
      return 'text-slate-700 bg-slate-50 border-slate-200';
  }
}

/**
 * Returns Tailwind CSS styling classes corresponding to a priority level.
 *
 * @param priority - The Priority enum value.
 * @returns Tailwind CSS badge classes.
 */
export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case 'critical':
      return 'text-rose-700 bg-rose-100 border-rose-300';
    case 'high':
      return 'text-amber-700 bg-amber-100 border-amber-300';
    case 'medium':
      return 'text-violet-700 bg-violet-100 border-violet-300';
    case 'low':
    default:
      return 'text-slate-600 bg-slate-100 border-slate-300';
  }
}

/**
 * Computes aggregate financial metrics from a list of budget line items.
 *
 * @param items - Array of BudgetItem objects.
 * @returns Object containing total actual spent, total estimated cost, and percent consumed.
 */
export function calculateBudgetProgress(items: BudgetItem[]): {
  spent: number;
  estimated: number;
  percentage: number;
} {
  if (!items || items.length === 0) {
    return { spent: 0, estimated: 0, percentage: 0 };
  }

  const spent = items.reduce((total, item) => total + (Number(item.actualCost) || 0), 0);
  const estimated = items.reduce((total, item) => total + (Number(item.estimatedCost) || 0), 0);
  const percentage = estimated > 0 ? Math.min(Math.round((spent / estimated) * 100), 100) : 0;

  return { spent, estimated, percentage };
}

/**
 * Computes completion metrics from a collection of timeline items.
 *
 * @param items - Array of TimelineItem objects.
 * @returns Object containing count of completed items, total items, and percentage completed.
 */
export function calculateTimelineProgress(items: TimelineItem[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  if (!items || items.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  const completed = items.filter((item) => item.status === 'completed').length;
  const total = items.length;
  const percentage = Math.round((completed / total) * 100);

  return { completed, total, percentage };
}
