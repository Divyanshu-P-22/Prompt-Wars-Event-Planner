'use client';

/**
 * @file loading-spinner.tsx
 * @description GenAI celebration styled loading spinner and full-page overlay loader
 * with gradient SVG circle and dynamic messages.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export type LoadingSpinnerSize = 'sm' | 'md' | 'lg';

export interface LoadingSpinnerProps {
  /** Size modifier for the spinning indicator */
  size?: LoadingSpinnerSize;
  /** Optional descriptive message displayed below the spinner */
  message?: string;
  /** Optional container class name */
  className?: string;
}

const sizeConfig: Record<
  LoadingSpinnerSize,
  {
    dimensions: string;
    strokeWidth: number;
    textSize: string;
  }
> = {
  sm: { dimensions: 'w-6 h-6', strokeWidth: 5, textSize: 'text-xs' },
  md: { dimensions: 'w-10 h-10', strokeWidth: 4, textSize: 'text-sm' },
  lg: { dimensions: 'w-16 h-16', strokeWidth: 3.5, textSize: 'text-base' },
};

/**
 * Centered loading spinner featuring a vibrant CelebrateAI violet-rose gradient.
 *
 * @param props - LoadingSpinnerProps configuring size and status text.
 * @returns JSX.Element spinner with accessible loading feedback.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  className,
}) => {
  const gradientId = React.useId();
  const config = sizeConfig[size];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center justify-center gap-3 py-4', className)}
    >
      <svg
        className={cn('animate-spin shrink-0', config.dimensions)}
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="60%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx="25"
          cy="25"
          r="20"
          stroke="#e2e8f0"
          strokeWidth={config.strokeWidth}
          className="opacity-40"
        />
        {/* Animated fill arc */}
        <path
          d="M25 5 A 20 20 0 0 1 45 25"
          stroke={`url(#${gradientId})`}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
        />
      </svg>

      {message && (
        <p
          className={cn(
            'font-medium text-slate-600 animate-pulse text-center select-none tracking-tight',
            config.textSize
          )}
        >
          {message}
        </p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export interface FullPageLoaderProps {
  /** Optional message to present to the user */
  message?: string;
  /** Size modifier for the loader spinner */
  size?: LoadingSpinnerSize;
  /** Optional custom class name */
  className?: string;
}

/**
 * Fullscreen overlay loader blocking interaction during heavy asynchronous operations.
 *
 * @param props - FullPageLoaderProps configuring loader overlay message and sizing.
 * @returns JSX.Element fixed fullscreen backdrop with spinner.
 */
export const FullPageLoader: React.FC<FullPageLoaderProps> = ({
  message = 'Loading your celebration plan...',
  size = 'lg',
  className,
}) => {
  return (
    <div
      role="alert"
      aria-busy="true"
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md transition-opacity',
        className
      )}
    >
      <LoadingSpinner size={size} message={message} />
    </div>
  );
};

export default LoadingSpinner;
