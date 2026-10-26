'use client';

/**
 * @file empty-state.tsx
 * @description Accessible Empty State placeholder displayed when data collections,
 * search results, or event schedules contain no items.
 */

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateAction {
  /** Text label displayed on the primary action button */
  label: string;
  /** Click handler callback executed on action trigger */
  onClick: () => void;
  /** Optional icon rendered inside the button */
  icon?: LucideIcon;
}

export interface EmptyStateProps {
  /** Lucide icon representing the empty context */
  icon: LucideIcon;
  /** Primary title of the empty state */
  title: string;
  /** Explanatory description or call-to-action prompt */
  description?: string;
  /** Optional call-to-action button configuration */
  action?: EmptyStateAction;
  /** Optional container class name */
  className?: string;
}

/**
 * EmptyState component with centered icon, text hierarchy, and action button.
 *
 * @param props - EmptyStateProps configuring visual elements and call-to-action.
 * @returns JSX.Element empty state presentation card.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}) => {
  const ActionIcon = action?.icon;

  return (
    <div
      role="region"
      aria-label={title}
      className={cn(
        'glass-card relative flex flex-col items-center justify-center p-8 sm:p-12 text-center border-dashed border-gray-200/80 overflow-hidden',
        className
      )}
    >
      {/* Decorative ambient background blur */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -left-16 w-44 h-44 rounded-full bg-violet-400/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -right-16 w-44 h-44 rounded-full bg-rose-400/10 blur-3xl"
      />

      {/* Icon with glowing backdrop */}
      <div className="relative mb-4 flex items-center justify-center">
        <div
          aria-hidden="true"
          className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-violet-200/60 to-rose-200/40 blur-md opacity-80"
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-violet-100 shadow-md shadow-violet-500/5 text-violet-600">
          <Icon className="w-8 h-8" aria-hidden="true" />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
        {title}
      </h3>

      {description && (
        <p className="mt-2 text-sm text-slate-500 max-w-sm sm:max-w-md leading-relaxed">
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        <div className="mt-6">
          <button
            type="button"
            onClick={action.onClick}
            className="btn-primary cursor-pointer"
          >
            {ActionIcon && <ActionIcon className="w-4 h-4" aria-hidden="true" />}
            <span>{action.label}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
