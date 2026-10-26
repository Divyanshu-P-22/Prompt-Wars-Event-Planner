'use client';

/**
 * @file tabs.tsx
 * @description Tabbed navigation component with compound pattern (Tabs, TabsList, TabsTrigger,
 * TabsContent), animated transitions, and accessibility compliance.
 */

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

/**
 * Internal hook to consume the parent Tabs context.
 *
 * @returns TabsContextValue containing activeTab and state setter.
 * @throws Error if used outside of <Tabs>.
 */
export function useTabs(): TabsContextValue {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs compound components must be rendered inside a <Tabs> container');
  }
  return context;
}

export interface TabsProps {
  /** The value of the tab that should be active by default */
  defaultTab?: string;
  /** Controlled active tab value */
  value?: string;
  /** Callback fired when the active tab changes */
  onValueChange?: (value: string) => void;
  /** Subcomponents or child elements */
  children: React.ReactNode;
  /** Optional custom class name */
  className?: string;
}

/**
 * Root Tabs container managing active tab state.
 *
 * @param props - TabsProps controlling active tab state and containing children.
 * @returns JSX.Element Tabs provider wrapper.
 */
export const Tabs: React.FC<TabsProps> = ({
  defaultTab = '',
  value,
  onValueChange,
  children,
  className,
}) => {
  const [internalTab, setInternalTab] = React.useState<string>(defaultTab);

  const activeTab = value !== undefined ? value : internalTab;

  const handleSetActiveTab = React.useCallback(
    (newTab: string) => {
      if (value === undefined) {
        setInternalTab(newTab);
      }
      onValueChange?.(newTab);
    },
    [value, onValueChange]
  );

  const contextValue = React.useMemo(
    () => ({
      activeTab,
      setActiveTab: handleSetActiveTab,
    }),
    [activeTab, handleSetActiveTab]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

/**
 * Horizontal scrollable container for tab trigger buttons.
 *
 * @param props - HTML div attributes.
 * @returns JSX.Element tablist navigation element.
 */
export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="tablist"
        aria-orientation="horizontal"
        className={cn(
          'flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none border-b border-gray-200 pb-px text-slate-600',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsList.displayName = 'TabsList';

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Unique value identifying this tab */
  value: string;
  /** Optional Lucide icon displayed next to the tab title */
  icon?: LucideIcon;
  /** Tab label */
  children: React.ReactNode;
}

/**
 * Individual tab button that triggers tab switching.
 *
 * @param props - TabsTriggerProps specifying tab value and optional icon.
 * @param ref - Forwarded HTMLButtonElement ref.
 * @returns JSX.Element tab button.
 */
export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, icon: Icon, children, className, disabled, ...props }, ref) => {
    const { activeTab, setActiveTab } = useTabs();
    const isActive = activeTab === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        id={`tab-${value}`}
        aria-selected={isActive}
        aria-controls={`panel-${value}`}
        tabIndex={isActive ? 0 : -1}
        disabled={disabled}
        onClick={() => setActiveTab(value)}
        className={cn(
          'group relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 select-none whitespace-nowrap border-b-2 -mb-px outline-none',
          isActive
            ? 'border-violet-600 text-violet-700 font-semibold'
            : 'border-transparent text-gray-500 hover:text-slate-800 hover:border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {Icon && (
          <Icon
            className={cn(
              'w-4 h-4 transition-colors',
              isActive
                ? 'text-violet-600'
                : 'text-gray-400 group-hover:text-slate-600'
            )}
            aria-hidden="true"
          />
        )}
        <span>{children}</span>
      </button>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The value matching the associated TabsTrigger */
  value: string;
  /** Content rendered when this tab is active */
  children: React.ReactNode;
}

/**
 * Content panel rendered when its corresponding tab is active.
 *
 * @param props - TabsContentProps specifying tab value.
 * @returns JSX.Element animated content panel or null if inactive.
 */
export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  children,
  className,
}) => {
  const { activeTab } = useTabs();
  const isActive = activeTab === value;

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={value}
          role="tabpanel"
          id={`panel-${value}`}
          aria-labelledby={`tab-${value}`}
          tabIndex={0}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={cn('pt-4 focus-visible:outline-none', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
