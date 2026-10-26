'use client';

/**
 * @file header.tsx
 * @description Fixed top navigation header component for CelebrateAI.
 * Features a glassmorphic blurred backdrop, brand logo with sparkle emoji,
 * desktop navigation links, responsive mobile slide-down menu with animations,
 * and high accessibility compliance (ARIA labels and keyboard navigation).
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Menu, X, Plus, LayoutDashboard } from 'lucide-react';

/**
 * Main application header component with responsive desktop and mobile navigation.
 *
 * @returns {JSX.Element} The rendered Header component.
 */
export function Header(): JSX.Element {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const pathname = usePathname();

  // Close mobile navigation drawer whenever pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  /**
   * Toggles the open/closed state of the mobile slide-down navigation drawer.
   */
  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  /**
   * Closes the mobile navigation drawer.
   */
  const closeMobileMenu = (): void => {
    setIsMobileMenuOpen(false);
  };

  const isDashboardActive = pathname === '/dashboard';
  const isCreateActive = pathname === '/events/new';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/80 backdrop-blur-lg border-b border-white/60 shadow-sm shadow-violet-500/5 transition-colors"
      role="banner"
    >
      <div className="section-container h-full flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 rounded-xl py-1 px-2 -ml-2 transition-all duration-200"
          aria-label="CelebrateAI Home"
        >
          <span
            className="text-2xl transition-transform duration-300 group-hover:scale-125 select-none"
            role="img"
            aria-label="Sparkles emoji"
          >
            ✨
          </span>
          <span className="text-xl font-bold tracking-tight gradient-text">
            CelebrateAI
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-3"
          aria-label="Main Navigation"
        >
          <Link
            href="/dashboard"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
              isDashboardActive
                ? 'bg-violet-100 text-violet-900 font-semibold shadow-inner'
                : 'text-gray-600 hover:text-violet-700 hover:bg-violet-50/80'
            }`}
            aria-current={isDashboardActive ? 'page' : undefined}
          >
            <LayoutDashboard className="w-4 h-4 text-violet-600" aria-hidden="true" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/events/new"
            className={`btn-primary text-sm px-5 py-2.5 rounded-xl shadow-md transition-all duration-200 ${
              isCreateActive ? 'ring-2 ring-violet-500 ring-offset-2' : ''
            }`}
            aria-label="Create a new event"
          >
            <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" aria-hidden="true" />
            <span>Create Event</span>
          </Link>
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="p-2 rounded-xl text-gray-700 hover:text-violet-600 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-colors"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-navigation"
            key="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden border-b border-violet-100 bg-white/95 backdrop-blur-xl shadow-xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
          >
            <div className="section-container py-5 flex flex-col gap-3">
              <Link
                href="/dashboard"
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-base transition-all duration-150 ${
                  isDashboardActive
                    ? 'bg-violet-100 text-violet-900 font-semibold'
                    : 'text-gray-700 hover:bg-violet-50 hover:text-violet-700'
                }`}
                aria-current={isDashboardActive ? 'page' : undefined}
              >
                <LayoutDashboard className="w-5 h-5 text-violet-600" aria-hidden="true" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/events/new"
                onClick={closeMobileMenu}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl shadow-md text-base"
                aria-label="Create a new event"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
                <span>Create Event</span>
              </Link>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-center gap-1.5 text-xs text-gray-500">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" aria-hidden="true" />
                <span>GenAI-Powered Celebration Assistant</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Header;
