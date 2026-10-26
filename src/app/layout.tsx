/**
 * @file layout.tsx
 * @description Root layout component for CelebrateAI (Server Component).
 * Configures the Inter Google font, sets global application metadata, initializes
 * global state via EventProvider, and wraps page views with the fixed Header and Footer.
 */

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { EventProvider } from '@/context/EventContext';
import { Header, Footer } from '@/components/layout';

// Use system font stack to avoid build-time network fetch.
// In production the browser loads the real Inter from the CSS @import in globals.css.
const interClassName = 'font-sans';

export const metadata: Metadata = {
  title: 'CelebrateAI — AI Event Planning Assistant',
  description:
    'AI-powered event planning that transforms your vision into reality. Plan weddings, birthdays, and community gatherings with intelligent budget allocation, dynamic milestone timelines, and vendor coordination powered by Google Gemini.',
  keywords: [
    'CelebrateAI',
    'AI Event Planner',
    'Event Assistant',
    'Wedding Planning',
    'Birthday Planner',
    'Community Events',
    'Gemini AI',
    'Smart Budget',
    'Event Timelines',
  ],
  authors: [{ name: 'CelebrateAI Team' }],
  colorScheme: 'light',
  openGraph: {
    title: 'CelebrateAI — AI Event Planning Assistant',
    description:
      'GenAI-powered event planning assistant for unforgettable weddings, birthdays, and community gatherings.',
    type: 'website',
    locale: 'en_US',
    siteName: 'CelebrateAI',
  },
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
};

/**
 * RootLayout server component wrapping every page in CelebrateAI.
 *
 * @param {Readonly<{ children: React.ReactNode }>} props - The layout props containing page children.
 * @returns {JSX.Element} The rendered root HTML shell.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en" className={interClassName} style={{ colorScheme: 'light' }}>
      <body className="min-h-screen flex flex-col bg-gradient-to-br from-violet-50/30 via-white to-rose-50/30 text-slate-900 antialiased selection:bg-violet-200 selection:text-violet-900">
        <EventProvider>
          <Header />
          <main className="flex-1 min-h-screen pt-16 flex flex-col" id="main-content">
            {children}
          </main>
          <Footer />
        </EventProvider>
      </body>
    </html>
  );
}
