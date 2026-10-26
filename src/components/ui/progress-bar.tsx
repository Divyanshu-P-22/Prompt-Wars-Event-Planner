'use client';

/**
 * @file progress-bar.tsx
 * @description Animated progress bar using framer-motion with customizable track heights,
 * celebration theme color gradients, and optional status labels.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type ProgressBarSize = 'sm' | 'md' | 'lg';

export interface ProgressBarProps {
  /** Numerical value representing progress percentage (0 - 100) */
  value: number;
  /** Fill color theme or custom background class (defaults to violet) */
  color?: string;
  /** Height modifier for the progress track */
  size?: ProgressBarSize;
  /** Whether to show the percentage indicator on the right */
  showLabel?: boolean;
  /** Optional descriptive title displayed above or beside the bar */
  label?: string;
  /** Optional custom class name applied to container */
  className?: string;
}

const sizeClasses: Record<ProgressBarSize, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const predefinedColors: Record<string, string> = {
  violet: 'bg-gradient-to-r from-violet-600 to-purple-600',
  purple: 'bg-gradient-to-r from-purple-600 to-violet-500',
  rose: 'bg-gradient-to-r from-rose-500 to-pink-500',
  amber: 'bg-gradient-to-r from-amber-500 to-yellow-500',
  emerald: 'bg-gradient-to-r from-emerald-500 to-teal-500',
  blue: 'bg-gradient-to-r from-blue-600 to-indigo-600',
};

/**
 * Progress bar component with smooth motion transitions.
 *
 * @param props - ProgressBarProps defining progress value, labels, colors, and sizing.
 * @returns JSX.Element progress bar element.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'violet',
  size = 'md',
  showLabel = false,
  label,
  className,
}) => {
  const clampedValue = Math.min(100, Math.max(0, isNaN(value) ? 0 : value));
  const roundedPercent = Math.round(clampedValue);

  const fillClass =
    predefinedColors[color] ||
    (color.startsWith('bg-') ? color : 'bg-gradient-to-r from-violet-600 to-purple-600');

  return (
    <div className={cn('w-full', className)}>
      {(label || showLabel) && (
        <div className="flex items-center justify-between gap-2 mb-1.5 text-xs sm:text-sm font-medium text-slate-700">
          {label && <span className="truncate">{label}</span>}
          {showLabel && (
            <span className="ml-auto font-semibold text-slate-600 tabular-nums">
              {roundedPercent}%
            </span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={roundedPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
        className={cn(
          'w-full bg-slate-100 rounded-full overflow-hidden shadow-inner',
          sizeClasses[size]
        )}
      >
        <motion.div
          className={cn('h-full rounded-full transition-colors', fillClass)}
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
