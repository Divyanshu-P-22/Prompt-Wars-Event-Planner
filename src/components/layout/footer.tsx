/**
 * @file footer.tsx
 * @description Accessible, clean footer component for CelebrateAI.
 * Displays project attribution, links to Google Gemini and CelebrateAI repository,
 * and maintains consistent design system styling across all viewports.
 */

import React from 'react';
import Link from 'next/link';
import { Sparkles, ExternalLink } from 'lucide-react';

/**
 * Application footer component displaying copyright and AI provider attribution.
 *
 * @returns {JSX.Element} The rendered Footer component.
 */
export function Footer(): JSX.Element {
  return (
    <footer
      className="w-full border-t border-gray-200/80 bg-white/60 backdrop-blur-sm py-6 text-sm text-gray-500 transition-colors"
      role="contentinfo"
      aria-label="Site Footer"
    >
      <div className="section-container flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand Copyright */}
        <div className="flex items-center gap-2 text-center sm:text-left">
          <Link
            href="/"
            className="font-semibold text-gray-800 hover:text-violet-600 transition-colors inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-md"
            aria-label="CelebrateAI Home"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-500" aria-hidden="true" />
            <span>CelebrateAI</span>
          </Link>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>

        {/* Centered Attribution */}
        <div className="text-center font-medium text-gray-600">
          <span>Built with </span>
          <span className="text-violet-600 select-none" role="img" aria-label="purple heart">
            💜
          </span>
          <span> by CelebrateAI &mdash; Powered by </span>
          <a
            href="https://ai.google.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-600 hover:text-violet-800 font-semibold underline decoration-violet-300 underline-offset-4 hover:decoration-violet-600 transition-colors inline-flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
            aria-label="Google Gemini Developer Portal (opens in a new tab)"
          >
            Google Gemini
            <ExternalLink className="w-3 h-3 ml-0.5" aria-hidden="true" />
          </a>
        </div>

        {/* Links */}
        <div className="flex items-center gap-4 text-xs">
          <Link
            href="/dashboard"
            className="hover:text-violet-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
          >
            Dashboard
          </Link>
          <span className="text-gray-300" aria-hidden="true">&bull;</span>
          <Link
            href="/events/new"
            className="hover:text-violet-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
          >
            New Event
          </Link>
          <span className="text-gray-300" aria-hidden="true">&bull;</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-violet-600 transition-colors inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
            aria-label="Project GitHub Repository (opens in a new tab)"
          >
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
