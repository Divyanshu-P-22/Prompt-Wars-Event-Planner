'use client';

/**
 * @file page.tsx
 * @description Landing page for CelebrateAI.
 * Features an animated hero section with floating celebration emojis,
 * interactive feature cards, key product stats, event type showcases,
 * and high-converting calls-to-action powered by Framer Motion and Tailwind CSS.
 */

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Brain,
  DollarSign,
  Calendar,
  Users,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Heart,
  Cake,
  Tent,
} from 'lucide-react';

/**
 * Floating celebration emojis configuration.
 */
interface FloatingEmoji {
  emoji: string;
  position: string;
  delay: number;
  duration: number;
}

const FLOATING_EMOJIS: FloatingEmoji[] = [
  { emoji: '🎉', position: 'top-10 left-[8%]', delay: 0, duration: 6 },
  { emoji: '🎂', position: 'top-16 right-[10%]', delay: 1.2, duration: 5.5 },
  { emoji: '💒', position: 'bottom-24 left-[12%]', delay: 2, duration: 6.5 },
  { emoji: '🎪', position: 'bottom-20 right-[14%]', delay: 0.8, duration: 5.8 },
  { emoji: '🎈', position: 'top-1/2 left-[4%]', delay: 1.6, duration: 6.2 },
  { emoji: '✨', position: 'top-1/3 right-[5%]', delay: 2.4, duration: 5 },
];

/**
 * Feature card specification.
 */
interface FeatureItem {
  icon: React.ElementType;
  title: string;
  description: string;
  iconBg: string;
  iconColor: string;
}

const FEATURES: FeatureItem[] = [
  {
    icon: Brain,
    title: 'AI-Powered Planning',
    description:
      'Intelligent plan generation instantly creates tailored celebration blueprints, custom themes, and expert tips in seconds.',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    icon: DollarSign,
    title: 'Smart Budget Manager',
    description:
      'Automated category allocation distributes your budget across venues, catering, decor, and entertainment with real-time tracking.',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Calendar,
    title: 'Dynamic Timelines',
    description:
      'Step-by-step milestone schedules track what needs to be done month-by-month and day-of, keeping you effortlessly organized.',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-500',
  },
  {
    icon: Users,
    title: 'Vendor Management',
    description:
      'AI vendor checklists and recommendation guides ensure you book top photographers, caterers, and florists at the best rates.',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-500',
  },
];

/**
 * Stat metric item specification.
 */
interface StatItem {
  value: string;
  label: string;
  detail: string;
}

const STATS: StatItem[] = [
  {
    value: '1000+',
    label: 'Events Planned',
    detail: 'Celebrations organized seamlessly',
  },
  {
    value: 'AI-Powered',
    label: 'Suggestions',
    detail: 'Intelligent Gemini recommendations',
  },
  {
    value: '4+',
    label: 'Event Categories',
    detail: 'Weddings, birthdays & community',
  },
  {
    value: '100%',
    label: 'Free',
    detail: 'Start planning without cost',
  },
];

/**
 * Event type highlight card.
 */
interface EventTypeCard {
  type: string;
  title: string;
  emoji: string;
  icon: React.ElementType;
  description: string;
  href: string;
  accentGradient: string;
}

const EVENT_TYPES: EventTypeCard[] = [
  {
    type: 'wedding',
    title: 'Weddings',
    emoji: '💒',
    icon: Heart,
    description:
      'From dream ceremony schedules to floral budget breakdowns, plan your special day with zero stress and pure joy.',
    href: '/events/new?type=wedding',
    accentGradient: 'from-rose-500 via-pink-500 to-purple-500',
  },
  {
    type: 'birthday',
    title: 'Birthdays',
    emoji: '🎂',
    icon: Cake,
    description:
      'Unforgettable milestone bashes, kids themed adventures, or elegant intimate dinners with custom themes and schedules.',
    href: '/events/new?type=birthday',
    accentGradient: 'from-amber-500 via-orange-500 to-rose-500',
  },
  {
    type: 'community',
    title: 'Community Events',
    emoji: '🎪',
    icon: Tent,
    description:
      'Festivals, fundraisers, and neighborhood block parties organized effortlessly with vendor and permit checklists.',
    href: '/events/new?type=community',
    accentGradient: 'from-violet-600 via-purple-600 to-indigo-600',
  },
];

/**
 * Landing Page client component presenting CelebrateAI's core capabilities.
 *
 * @returns {JSX.Element} The rendered Landing Page.
 */
export default function LandingPage(): JSX.Element {
  return (
    <div className="flex flex-col gap-24 pb-24 overflow-hidden">
      {/* ===================================================================
          HERO SECTION
          =================================================================== */}
      <section
        className="relative pt-12 md:pt-20 pb-20 md:pb-28 overflow-hidden"
        aria-labelledby="hero-heading"
      >
        {/* Ambient Gradient Glows */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-gradient-to-tr from-violet-300/40 via-purple-200/30 to-rose-200/40 blur-3xl -z-10 rounded-full pointer-events-none"
          aria-hidden="true"
        />

        {/* Decorative Floating Emojis */}
        {FLOATING_EMOJIS.map((item) => (
          <motion.div
            key={item.emoji}
            className={`absolute hidden sm:flex text-3xl md:text-5xl pointer-events-none select-none drop-shadow-md z-0 ${item.position}`}
            animate={{
              y: [-12, 12, -12],
              rotate: [-6, 6, -6],
            }}
            transition={{
              duration: item.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: item.delay,
            }}
            aria-hidden="true"
          >
            {item.emoji}
          </motion.div>
        ))}

        <div className="section-container relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100/80 border border-violet-200 text-violet-800 text-xs sm:text-sm font-semibold mb-6 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-violet-600" aria-hidden="true" />
            <span>Next-Generation Celebration Assistant</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            id="hero-heading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-6"
          >
            <span>Plan Your Perfect</span>
            <br />
            <span className="gradient-text">Celebration</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-10"
          >
            AI-powered event planning that transforms your vision into reality.
            From weddings to birthdays to community gatherings &mdash; plan
            smarter, celebrate better.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
          >
            <Link
              href="/events/new"
              className="btn-primary text-base px-8 py-4 rounded-2xl w-full sm:w-auto shadow-xl shadow-violet-500/25 group"
              aria-label="Start planning a new event"
            >
              <span>Start Planning</span>
              <ArrowRight
                className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>

            <Link
              href="/dashboard"
              className="btn-secondary text-base px-8 py-4 rounded-2xl w-full sm:w-auto"
              aria-label="View existing events dashboard"
            >
              <span>View Dashboard</span>
            </Link>
          </motion.div>

          {/* Highlights checklist */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-gray-500"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <span>Smart AI Budgets</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <span>Personalized Timelines</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <span>No Credit Card Required</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===================================================================
          FEATURES SECTION
          =================================================================== */}
      <section
        className="section-container"
        aria-labelledby="features-heading"
      >
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2
            id="features-heading"
            className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-4"
          >
            Everything You Need to Plan the Perfect Event
          </h2>
          <p className="text-gray-600 text-base sm:text-lg">
            Say goodbye to chaotic spreadsheets and forgotten tasks. CelebrateAI
            brings intelligent clarity to every detail of your occasion.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {FEATURES.map((feature, idx) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                className="glass-card p-8 flex flex-col gap-5 hover:scale-[1.02] transition-all duration-300 border border-white/60 hover:shadow-2xl hover:shadow-violet-500/10"
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${feature.iconBg} ${feature.iconColor} flex items-center justify-center shadow-inner shrink-0`}
                  aria-hidden="true"
                >
                  <IconComponent className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ===================================================================
          STATS SECTION (Between Features and Event Types)
          =================================================================== */}
      <section
        className="section-container"
        aria-label="CelebrateAI Platform Statistics"
      >
        <div className="glass-card p-8 sm:p-10 border border-violet-100 bg-gradient-to-r from-violet-50/60 via-white/80 to-rose-50/60 shadow-xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-gray-200/80">
            {STATS.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className={`flex flex-col items-center text-center px-4 ${
                  idx > 0 && idx % 2 === 0 ? 'pt-6 lg:pt-0' : ''
                }`}
              >
                <span className="text-3xl sm:text-4xl font-extrabold gradient-text mb-1 tracking-tight">
                  {stat.value}
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-800">
                  {stat.label}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {stat.detail}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================
          EVENT TYPES SECTION
          =================================================================== */}
      <section
        className="section-container"
        aria-labelledby="event-types-heading"
      >
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2
            id="event-types-heading"
            className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-4"
          >
            Crafted for Every Occasion
          </h2>
          <p className="text-gray-600 text-base sm:text-lg">
            Choose your celebration style and let our generative AI design an
            unforgettable roadmap tailored to your crowd and budget.
          </p>
        </div>

        {/* 3 Large Event Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {EVENT_TYPES.map((eventType, idx) => (
            <motion.div
              key={eventType.type}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="group relative rounded-3xl p-1 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
            >
              {/* Animated Gradient Border on hover */}
              <div
                className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${eventType.accentGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`}
                aria-hidden="true"
              />

              <div className="glass-card h-full p-8 flex flex-col justify-between rounded-[22px] bg-white/90 group-hover:bg-white/95 transition-colors">
                <div>
                  {/* Emoji & Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <span
                      className="text-5xl select-none transition-transform duration-300 group-hover:scale-110"
                      role="img"
                      aria-label={`${eventType.title} icon`}
                    >
                      {eventType.emoji}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-violet-100 text-violet-700">
                      Popular
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-violet-700 transition-colors">
                    {eventType.title}
                  </h3>

                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    {eventType.description}
                  </p>
                </div>

                <Link
                  href={eventType.href}
                  className="inline-flex items-center gap-2 font-semibold text-violet-600 group-hover:text-violet-800 transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg py-1"
                  aria-label={`Plan a ${eventType.title} event now`}
                >
                  <span>Plan Now</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===================================================================
          CALL TO ACTION (CTA) SECTION
          =================================================================== */}
      <section
        className="section-container"
        aria-labelledby="cta-heading"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl overflow-hidden p-10 md:p-16 text-center bg-gradient-to-br from-violet-600 via-purple-600 to-rose-600 text-white shadow-2xl shadow-violet-500/30"
        >
          {/* Decorative Background Elements */}
          <div
            className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
            <span
              className="text-4xl mb-4 select-none animate-bounce"
              role="img"
              aria-label="Celebration popper"
            >
              🎉
            </span>

            <h2
              id="cta-heading"
              className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-6 leading-tight"
            >
              Ready to Start Planning?
            </h2>

            <p className="text-violet-100 text-base sm:text-lg mb-10 leading-relaxed max-w-xl">
              Let Google Gemini AI build your complete celebration roadmap in
              minutes. Create budgets, organize vendors, and track your
              milestones without breaking a sweat.
            </p>

            <Link
              href="/events/new"
              className="inline-flex items-center justify-center gap-2 bg-white text-violet-700 hover:bg-violet-50 font-bold px-8 py-4 rounded-2xl text-base shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-[0.98] group"
              aria-label="Create your first event with AI"
            >
              <Sparkles className="w-5 h-5 text-violet-600" aria-hidden="true" />
              <span>Create Your First Event</span>
              <ArrowRight
                className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
