'use client';

/**
 * @file dialog.tsx
 * @description Accessible Modal Dialog component featuring frosted glass aesthetics,
 * smooth Framer Motion animations, keyboard navigation (Escape to dismiss), and backdrop click dismissal.
 */

import * as React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type DialogSize = 'sm' | 'md' | 'lg';

export interface DialogProps {
  /** Whether the dialog is visibly presented */
  open: boolean;
  /** Callback fired to close the modal */
  onClose: () => void;
  /** Optional modal title heading */
  title?: string;
  /** Optional secondary subtitle or description */
  description?: string;
  /** Content rendered inside the dialog body */
  children: React.ReactNode;
  /** Maximum width modifier for the modal container */
  size?: DialogSize;
  /** Optional class name applied to the modal card */
  className?: string;
}

const sizeClasses: Record<DialogSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

/**
 * Modal Dialog component presenting high-priority tasks, forms, or confirmations.
 *
 * @param props - DialogProps controlling visibility, dismissal, title, and body.
 * @returns JSX.Element animated modal dialog or null.
 */
export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className,
}) => {
  const titleId = React.useId();
  const descId = React.useId();

  // Escape key listener for keyboard accessibility
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll when modal is active
  React.useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          aria-hidden={!open}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'glass-card relative z-10 w-full overflow-hidden p-6 sm:p-8 shadow-2xl bg-white/95 border border-white/60',
              sizeClasses[size],
              className
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
              <div className="space-y-1">
                {title && (
                  <h2
                    id={titleId}
                    className="text-xl font-bold tracking-tight text-slate-900"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p id={descId} className="text-sm text-gray-500">
                    {description}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="btn-ghost -mr-2 -mt-2 p-2 rounded-xl text-gray-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <div className="pt-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Dialog;
