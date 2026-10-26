'use client';

/**
 * @file input.tsx
 * @description Accessible text input component supporting icons, floating/standard labels,
 * helper texts, validation errors, and the CelebrateAI input-field styling.
 */

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional label text rendered above the input */
  label?: string;
  /** Error message to display below the input; triggers invalid state */
  error?: string;
  /** Optional Lucide icon displayed on the left interior of the input */
  icon?: LucideIcon;
}

/**
 * Styled input field with optional label, leading icon, and error handling.
 *
 * @param props - InputProps configuring input behaviors and visual elements.
 * @param ref - Forwarded HTMLInputElement ref.
 * @returns JSX.Element containing label, icon, input field, and error message.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, icon: Icon, id, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {Icon && (
            <div
              className="pointer-events-none absolute left-3.5 flex items-center justify-center text-gray-400"
              aria-hidden="true"
            >
              <Icon className="w-4 h-4" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'input-field',
              Icon && 'pl-10',
              error &&
                'border-red-400 focus:border-red-500 focus:ring-red-400/30 text-red-900 placeholder:text-red-300',
              disabled && 'opacity-60 cursor-not-allowed bg-gray-50',
              className
            )}
            {...props}
          />
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-medium text-red-500 mt-1 animate-fadeIn"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
