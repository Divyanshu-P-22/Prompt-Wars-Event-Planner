'use client';

/**
 * @file select.tsx
 * @description Accessible custom-styled native Select component with dropdown chevron,
 * option list mapping, label, and validation error state.
 */

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  /** Unique value identifier for the option */
  value: string;
  /** Human-readable display text */
  label: string;
  /** Whether this specific option is disabled */
  disabled?: boolean;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Optional label text rendered above the dropdown */
  label?: string;
  /** Error message to display below the dropdown */
  error?: string;
  /** Array of selectable option items */
  options: SelectOption[];
  /** Placeholder item displayed when no option has been selected */
  placeholder?: string;
}

/**
 * Styled select dropdown component wrapping the native HTML select element.
 *
 * @param props - SelectProps including option items, placeholder, label, and error.
 * @param ref - Forwarded HTMLSelectElement ref.
 * @returns JSX.Element select field with chevron icon and feedback messages.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      options,
      placeholder,
      id,
      disabled,
      defaultValue,
      value,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            value={value}
            defaultValue={defaultValue}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'input-field appearance-none pr-10 cursor-pointer bg-no-repeat',
              error &&
                'border-red-400 focus:border-red-500 focus:ring-red-400/30 text-red-900',
              disabled && 'opacity-60 cursor-not-allowed bg-gray-50',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          <div
            className="pointer-events-none absolute right-3.5 flex items-center justify-center text-gray-400"
            aria-hidden="true"
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

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

Select.displayName = 'Select';

export default Select;
