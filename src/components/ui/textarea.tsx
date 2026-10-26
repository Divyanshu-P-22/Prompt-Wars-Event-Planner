'use client';

/**
 * @file textarea.tsx
 * @description Accessible multiline textarea component matching the CelebrateAI input styling,
 * with label and validation error support.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Optional label text rendered above the textarea */
  label?: string;
  /** Error message to display below the textarea */
  error?: string;
}

/**
 * Styled multi-line textarea input with optional label and error messaging.
 *
 * @param props - TextareaProps including label and validation status.
 * @param ref - Forwarded HTMLTextAreaElement ref.
 * @returns JSX.Element wrapping label, textarea, and error message.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, disabled, rows = 4, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'input-field min-h-[96px] resize-y leading-relaxed',
            error &&
              'border-red-400 focus:border-red-500 focus:ring-red-400/30 text-red-900 placeholder:text-red-300',
            disabled && 'opacity-60 cursor-not-allowed bg-gray-50',
            className
          )}
          {...props}
        />

        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-medium text-red-500 mt-1"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
