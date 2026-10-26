'use client';

/**
 * @file button.tsx
 * @description Reusable, accessible Button component supporting multiple design system variants,
 * sizes, and an asynchronous loading state with animated spinner.
 */

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant aligning with CelebrateAI design tokens */
  variant?: ButtonVariant;
  /** Size modifier controlling padding and typography */
  size?: ButtonSize;
  /** Whether the button is in a loading state */
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-base rounded-2xl gap-2.5',
};

/**
 * Button component supporting various visual states and interactive behaviors.
 *
 * @param props - ButtonProps configuring appearance and behavior.
 * @param ref - Forwarded HTML button ref.
 * @returns JSX.Element button element.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      className,
      children,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading ? 'true' : undefined}
        aria-disabled={isDisabled ? 'true' : undefined}
        className={cn(
          'relative transition-all duration-200 select-none inline-flex items-center justify-center font-semibold cursor-pointer disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          loading && 'pointer-events-none',
          className
        )}
        {...rest}
      >
        {loading && (
          <Loader2
            className={cn(
              'animate-spin shrink-0',
              size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
            )}
            aria-hidden="true"
          />
        )}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
