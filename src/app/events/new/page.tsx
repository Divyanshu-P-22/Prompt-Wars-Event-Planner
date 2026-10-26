'use client';

/**
 * @file page.tsx
 * @description Multi-step AI Event Creation Wizard for CelebrateAI.
 * Guides users through selecting an event type, defining core details, configuring
 * budget and stylistic preferences, generating a full AI blueprint via Google Gemini,
 * reviewing the interactive plan, and saving the celebration to state and storage.
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Check,
  CheckCircle2,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  Palette,
  Clock,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Building2,
  CheckCircle,
} from 'lucide-react';

import type {
  CelebrateEvent,
  WizardFormData,
  EventType,
  Priority,
  BudgetItem,
  BudgetItemStatus,
  TimelineItem,
  TimelineItemStatus,
  Vendor,
  VendorStatus,
  AIPlan,
} from '@/types';
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateShort,
  generateId,
} from '@/lib/utils';
import { useEvents } from '@/context/EventContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, type SelectOption } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// ============================================================================
// Constants & Configuration
// ============================================================================

interface EventTypeOption {
  type: EventType;
  emoji: string;
  title: string;
  tagline: string;
  description: string;
  bgGlow: string;
}

const EVENT_TYPE_OPTIONS: readonly EventTypeOption[] = [
  {
    type: 'wedding',
    emoji: '💒',
    title: 'Wedding',
    tagline: 'Your dream day begins here',
    description: 'Plan your dream wedding with AI-powered assistance',
    bgGlow: 'hover:shadow-rose-500/10 hover:border-rose-300',
  },
  {
    type: 'birthday',
    emoji: '🎂',
    title: 'Birthday',
    tagline: 'Milestone memories to cherish',
    description: 'Create an unforgettable birthday celebration',
    bgGlow: 'hover:shadow-amber-500/10 hover:border-amber-300',
  },
  {
    type: 'community',
    emoji: '🎪',
    title: 'Community',
    tagline: 'Gather, celebrate & inspire',
    description: 'Organize community events that bring people together',
    bgGlow: 'hover:shadow-violet-500/10 hover:border-violet-300',
  },
] as const;

const STYLE_OPTIONS: readonly SelectOption[] = [
  { value: 'Formal', label: 'Formal / Black Tie' },
  { value: 'Casual', label: 'Casual & Relaxed' },
  { value: 'Themed', label: 'Themed & Creative' },
  { value: 'Traditional', label: 'Traditional & Cultural' },
  { value: 'Modern', label: 'Modern & Minimalist' },
];

const LOADING_MESSAGES: readonly string[] = [
  'Analyzing your event requirements...',
  'Crafting personalized budget allocation...',
  'Designing your timeline...',
  'Finding the perfect vendors...',
  'Generating creative ideas...',
] as const;

const STEP_LABELS = [
  'Event Type',
  'Details',
  'Budget & Style',
  'AI Magic',
  'Review Plan',
] as const;

const CATEGORY_BAR_GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-sky-400 to-indigo-500',
  'from-fuchsia-500 to-pink-500',
] as const;

// ============================================================================
// Helper Utilities
// ============================================================================

/**
 * Resolves a color string (hex or color name) to a valid CSS color representation.
 *
 * @param colorStr - Input color string, hex code, or human name.
 * @returns CSS color hex string.
 */
function resolveColorHex(colorStr: string): string {
  if (colorStr.startsWith('#')) return colorStr;
  const lower = colorStr.toLowerCase();
  const map: Record<string, string> = {
    gold: '#D97706',
    rose: '#F43F5E',
    pink: '#EC4899',
    lavender: '#A855F7',
    purple: '#7C3AED',
    violet: '#8B5CF6',
    blue: '#3B82F6',
    navy: '#1E3A8A',
    emerald: '#10B981',
    green: '#059669',
    sage: '#84A98C',
    white: '#FFFFFF',
    ivory: '#FFFFF0',
    cream: '#FFFDD0',
    champagne: '#F7E7CE',
    silver: '#D1D5DB',
    black: '#1F2937',
    burgundy: '#800020',
    blush: '#FECDD3',
    coral: '#FB7185',
    peach: '#FFDAB9',
    teal: '#14B8A6',
    amber: '#F59E0B',
  };
  for (const [key, val] of Object.entries(map)) {
    if (lower.includes(key)) return val;
  }
  return '#7C3AED';
}

/**
 * Maps task priority levels to Badge UI variants.
 *
 * @param priority - Priority level string.
 * @returns Corresponding BadgeVariant.
 */
function getPriorityBadgeVariant(
  priority: Priority
): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' {
  switch (priority) {
    case 'critical':
      return 'danger';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
    default:
      return 'default';
  }
}

// ============================================================================
// Main Wizard Component Inner Implementation
// ============================================================================

function EventWizardContent(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addEvent } = useEvents();

  // Wizard Navigation & Data States
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState<number>(0);
  const [generatedPlan, setGeneratedPlan] = useState<AIPlan | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Core Form State
  const [formData, setFormData] = useState<WizardFormData>({
    type: '',
    name: '',
    date: '',
    location: '',
    guestCount: 50,
    totalBudget: 5000,
    description: '',
    preferences: {
      style: 'Modern',
      theme: '',
      cuisine: [],
      colorScheme: [],
      specialRequirements: '',
      culturalConsiderations: '',
    },
  });

  // Raw inputs for comma-delimited fields
  const [cuisineInput, setCuisineInput] = useState<string>('');
  const [colorInput, setColorInput] = useState<string>('');

  // Pre-populate event type from URL search parameters on initial mount
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (
      typeParam === 'wedding' ||
      typeParam === 'birthday' ||
      typeParam === 'community'
    ) {
      setFormData((prev) => ({ ...prev, type: typeParam as EventType }));
    }
  }, [searchParams]);

  // Rotate generation loading messages every 2 seconds during AI generation
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Today's date string in YYYY-MM-DD for date-picker minimum threshold
  const minDate = useMemo(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  // Dynamic placeholders conditioned by the selected event type
  const dynamicPlaceholders = useMemo(() => {
    switch (formData.type) {
      case 'wedding':
        return {
          name: "e.g., Sarah & Michael's Wedding Celebration",
          location: 'e.g., Napa Valley Vineyards or San Francisco, CA',
          description:
            'Share your wedding vision, ceremony details, romantic aesthetics, or dream moments...',
          theme: 'e.g., Rustic Elegance, Bohemian Chic, Classic Romance',
          cuisine: 'e.g., Farm-to-Table, Italian Plated, Vegan Options',
        };
      case 'birthday':
        return {
          name: "e.g., Liam's 30th Rooftop Birthday Bash",
          location: 'e.g., Skyline Lounge, Chicago, IL',
          description:
            'Tell us about the guest of honor, party vibes, music styles, surprise activities...',
          theme: 'e.g., Retro 90s, Neon Disco, Tropical Sunset',
          cuisine: 'e.g., Tapas, Artisanal Pizza, Gourmet Sliders',
        };
      case 'community':
        return {
          name: 'e.g., Annual Riverside Green Block Party',
          location: 'e.g., Riverside Community Park or Downtown Pavilion',
          description:
            'Describe the community mission, family entertainment, volunteer tasks, and goals...',
          theme: 'e.g., Eco-Friendly Festival, Summer Carnival, Cultural Mosaic',
          cuisine: 'e.g., Food Trucks, International Street Food, BBQ',
        };
      default:
        return {
          name: 'e.g., Grand Celebration 2026',
          location: 'e.g., City Center Hall or Venue Name',
          description: 'Describe what you envision for this celebration...',
          theme: 'e.g., Modern Festive, Elegant Minimalist',
          cuisine: 'e.g., Mixed Buffet, Hors d’oeuvres',
        };
    }
  }, [formData.type]);

  // ==========================================================================
  // Form Field Updates
  // ==========================================================================

  const handleTypeSelect = useCallback((selectedType: EventType) => {
    setFormData((prev) => ({ ...prev, type: selectedType }));
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next.type;
      return next;
    });
  }, []);

  const handleInputChange = useCallback(
    (field: keyof WizardFormData, value: unknown) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  const handlePreferenceChange = useCallback((field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value,
      },
    }));
  }, []);

  // Synchronize comma-separated cuisine input
  const handleCuisineBlur = useCallback(() => {
    const list = cuisineInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    handlePreferenceChange('cuisine', list);
  }, [cuisineInput, handlePreferenceChange]);

  // Synchronize comma-separated color scheme input
  const handleColorBlur = useCallback(() => {
    const list = colorInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    handlePreferenceChange('colorScheme', list);
  }, [colorInput, handlePreferenceChange]);

  // ==========================================================================
  // Step Validation Handlers
  // ==========================================================================

  const validateStep2 = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Event name is required (minimum 2 characters)';
    }

    if (!formData.date) {
      errors.date = 'Event date is required';
    } else {
      const parsedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(parsedDate.getTime())) {
        errors.date = 'Please enter a valid date';
      } else if (parsedDate < today) {
        errors.date = 'Event date cannot be in the past';
      }
    }

    if (!formData.location.trim() || formData.location.trim().length < 2) {
      errors.location = 'Location or venue is required (minimum 2 characters)';
    }

    const guests = Number(formData.guestCount);
    if (!guests || isNaN(guests) || guests < 1) {
      errors.guestCount = 'Guest count must be at least 1';
    } else if (guests > 50000) {
      errors.guestCount = 'Guest count cannot exceed 50,000';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.name, formData.date, formData.location, formData.guestCount]);

  const validateStep3 = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    const budget = Number(formData.totalBudget);
    if (!budget || isNaN(budget) || budget <= 0) {
      errors.totalBudget = 'Total budget must be a positive dollar amount';
    } else if (budget > 100000000) {
      errors.totalBudget = 'Budget cannot exceed $100,000,000';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.totalBudget]);

  // ==========================================================================
  // AI Plan Generation
  // ==========================================================================

  const handleGeneratePlan = useCallback(async () => {
    if (!validateStep3()) return;

    // Flush parsed lists
    const finalCuisine = cuisineInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const finalColors = colorInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      type: formData.type,
      name: formData.name.trim(),
      date: formData.date,
      location: formData.location.trim(),
      guestCount: Number(formData.guestCount),
      totalBudget: Number(formData.totalBudget),
      description: formData.description.trim(),
      preferences: {
        ...formData.preferences,
        theme: formData.preferences.theme?.trim() || undefined,
        style: formData.preferences.style || undefined,
        specialRequirements:
          formData.preferences.specialRequirements?.trim() || undefined,
        culturalConsiderations:
          formData.preferences.culturalConsiderations?.trim() || undefined,
        cuisine: finalCuisine.length > 0 ? finalCuisine : undefined,
        colorScheme: finalColors.length > 0 ? finalColors : undefined,
      },
    };

    setIsGenerating(true);
    setGenerationError(null);
    setCurrentStep(4);

    try {
      const response = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.plan) {
        throw new Error(
          data.error ||
            'Unable to generate event plan. Please check your inputs and try again.'
        );
      }

      setGeneratedPlan(data.plan);
      setCurrentStep(5);
    } catch (err) {
      console.error('[EventWizard] Generation error:', err);
      setGenerationError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while communicating with Gemini AI.'
      );
    } finally {
      setIsGenerating(false);
    }
  }, [
    validateStep3,
    cuisineInput,
    colorInput,
    formData.type,
    formData.name,
    formData.date,
    formData.location,
    formData.guestCount,
    formData.totalBudget,
    formData.description,
    formData.preferences,
  ]);

  // ==========================================================================
  // Event Saving & Final Redirect
  // ==========================================================================

  const handleSaveAndStartPlanning = useCallback(() => {
    if (!generatedPlan || !formData.type) return;

    const newEventId = generateId();
    const timestamp = new Date().toISOString();

    // Map AI budget categories to actionable BudgetItem entities
    const budgetItems: BudgetItem[] = (
      generatedPlan.budgetBreakdown || []
    ).map((categoryItem) => ({
      id: generateId(),
      category: categoryItem.category,
      name: `${categoryItem.category} Allocation`,
      estimatedCost: Number(categoryItem.estimatedAmount) || 0,
      actualCost: 0,
      status: 'estimated' as BudgetItemStatus,
      notes: categoryItem.description || '',
    }));

    // Map AI milestones to actionable TimelineItem entities
    const timelineItems: TimelineItem[] = (
      generatedPlan.timelineMilestones || []
    ).map((milestone) => ({
      id: generateId(),
      title: milestone.title,
      description: milestone.description || '',
      dueDate: milestone.dueDate || formData.date,
      status: 'pending' as TimelineItemStatus,
      priority: (milestone.priority as Priority) || 'medium',
      category: milestone.category || 'General',
    }));

    // Map AI vendor recommendations to initial Vendor entities
    const vendors: Vendor[] = (
      generatedPlan.vendorRecommendations || []
    ).map((vendorRec) => ({
      id: generateId(),
      name: `${vendorRec.category} Service`,
      category: vendorRec.category,
      contact: '',
      email: '',
      phone: '',
      estimatedCost: Number(vendorRec.estimatedBudget) || 0,
      status: 'researching' as VendorStatus,
      notes: vendorRec.tips ? vendorRec.tips.join(' • ') : '',
      rating: 0,
    }));

    // Construct final event object
    const newEvent: CelebrateEvent = {
      id: newEventId,
      name: formData.name.trim(),
      type: formData.type as EventType,
      status: 'planning',
      date: formData.date,
      location: formData.location.trim(),
      guestCount: Number(formData.guestCount),
      totalBudget: Number(formData.totalBudget),
      description: formData.description.trim(),
      preferences: {
        ...formData.preferences,
        cuisine: cuisineInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        colorScheme: colorInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      },
      aiPlan: generatedPlan,
      budgetItems,
      timelineItems,
      vendors,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Commit to React context & persistent storage
    addEvent(newEvent);

    // Redirect to the event workspace
    router.push(`/events/${newEventId}`);
  }, [
    generatedPlan,
    formData,
    cuisineInput,
    colorInput,
    addEvent,
    router,
  ]);

  // ==========================================================================
  // Render Step Indicator
  // ==========================================================================

  const renderStepIndicator = () => (
    <nav
      aria-label="Wizard Steps Progress"
      className="max-w-3xl mx-auto mb-10 px-4"
    >
      <ol className="flex items-center justify-between relative">
        {/* Background Connecting Bar */}
        <div
          aria-hidden="true"
          className="absolute top-5 left-6 right-6 h-1 bg-gray-200 -z-0 rounded-full"
        >
          <div
            className="h-full bg-gradient-to-r from-violet-600 via-purple-600 to-rose-500 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${((currentStep - 1) / (STEP_LABELS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;

          return (
            <li
              key={label}
              className="relative z-10 flex flex-col items-center group focus:outline-none"
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-md',
                  isCompleted &&
                    'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-violet-500/30 scale-100',
                  isCurrent &&
                    'bg-white text-violet-700 ring-4 ring-violet-500/30 border-2 border-violet-600 scale-110 shadow-violet-500/40',
                  !isCompleted &&
                    !isCurrent &&
                    'bg-white text-gray-400 border border-gray-200'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
                ) : (
                  <span>{stepNumber}</span>
                )}
              </div>
              <span
                className={cn(
                  'mt-2.5 text-xs font-semibold tracking-tight transition-colors hidden sm:block',
                  isCurrent && 'text-violet-700 font-bold',
                  isCompleted && 'text-slate-700',
                  !isCurrent && !isCompleted && 'text-gray-400'
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );

  // ==========================================================================
  // Render Step 1: Event Type Selection
  // ==========================================================================

  const renderStep1 = () => (
    <motion.section
      key="step-1"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      aria-labelledby="step-1-heading"
      className="space-y-8"
    >
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h2 id="step-1-heading" className="text-3xl font-bold tracking-tight">
          What are we celebrating?
        </h2>
        <p className="text-slate-600 text-base">
          Choose an event category to tailor AI models, budget templates, and
          milestone timelines to your exact vision.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Select Event Type"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2"
      >
        {EVENT_TYPE_OPTIONS.map((item) => {
          const isSelected = formData.type === item.type;
          return (
            <motion.div
              key={item.type}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => handleTypeSelect(item.type)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleTypeSelect(item.type);
                }
              }}
              className={cn(
                'glass-card p-8 rounded-3xl cursor-pointer text-center flex flex-col items-center justify-between transition-all duration-300 relative border-2',
                item.bgGlow,
                isSelected
                  ? 'border-violet-600 shadow-2xl shadow-violet-500/25 ring-2 ring-violet-500/30 bg-violet-50/50'
                  : 'border-transparent hover:border-violet-200'
              )}
            >
              {isSelected && (
                <div
                  aria-hidden="true"
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-md animate-fadeIn"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}

              <div className="space-y-4">
                <span
                  role="img"
                  aria-label={item.title}
                  className="text-6xl block select-none transform transition-transform duration-300 hover:scale-110"
                >
                  {item.emoji}
                </span>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-600">
                    {item.tagline}
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {item.title}
                  </h3>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed px-2">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 pt-4 w-full border-t border-gray-100 flex items-center justify-center">
                <span
                  className={cn(
                    'text-xs font-semibold py-1 px-3 rounded-full transition-colors',
                    isSelected
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 text-slate-600 group-hover:bg-violet-100'
                  )}
                >
                  {isSelected ? 'Selected' : 'Select'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {validationErrors.type && (
        <p
          role="alert"
          className="text-center text-sm font-medium text-rose-500"
        >
          {validationErrors.type}
        </p>
      )}

      {/* Navigation Footer */}
      <div className="flex justify-end pt-6">
        <Button
          variant="primary"
          size="lg"
          disabled={!formData.type}
          onClick={() => {
            if (!formData.type) {
              setValidationErrors({ type: 'Please choose an event category' });
              return;
            }
            setCurrentStep(2);
          }}
          aria-label="Continue to step 2"
        >
          <span>Continue to Details</span>
          <ArrowRight className="w-5 h-5 ml-1" aria-hidden="true" />
        </Button>
      </div>
    </motion.section>
  );

  // ==========================================================================
  // Render Step 2: Basic Details
  // ==========================================================================

  const renderStep2 = () => (
    <motion.section
      key="step-2"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      aria-labelledby="step-2-heading"
      className="space-y-8"
    >
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold uppercase tracking-wider">
          <span>Step 2 of 4</span>
          <span>•</span>
          <span className="capitalize">{formData.type} Details</span>
        </div>
        <h2 id="step-2-heading" className="text-3xl font-bold tracking-tight">
          Tell us the essentials
        </h2>
        <p className="text-slate-600 text-base">
          Foundational details will help Gemini calibrate your schedule, guest
          capacities, and local vendor estimates.
        </p>
      </div>

      <div className="glass-card p-8 sm:p-10 rounded-3xl max-w-3xl mx-auto space-y-6">
        {/* Event Name */}
        <Input
          label="Event Name *"
          placeholder={dynamicPlaceholders.name}
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={validationErrors.name}
          aria-required="true"
        />

        {/* Date and Location Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Input
            type="date"
            min={minDate}
            label="Event Date *"
            icon={Calendar}
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            error={validationErrors.date}
            aria-required="true"
          />

          <Input
            type="text"
            label="Location or Venue *"
            placeholder={dynamicPlaceholders.location}
            icon={MapPin}
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            error={validationErrors.location}
            aria-required="true"
          />
        </div>

        {/* Guest Count */}
        <div className="max-w-xs">
          <Input
            type="number"
            min={1}
            max={50000}
            label="Estimated Guest Count *"
            placeholder="e.g., 75"
            icon={Users}
            value={formData.guestCount || ''}
            onChange={(e) =>
              handleInputChange('guestCount', Number(e.target.value))
            }
            error={validationErrors.guestCount}
            aria-required="true"
          />
        </div>

        {/* Description / Vision */}
        <Textarea
          label="Event Vision & Description (Optional)"
          rows={4}
          placeholder={dynamicPlaceholders.description}
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
        />
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between max-w-3xl mx-auto pt-4">
        <Button
          variant="secondary"
          size="md"
          onClick={() => setCurrentStep(1)}
          aria-label="Back to step 1"
        >
          <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
          <span>Back</span>
        </Button>

        <Button
          variant="primary"
          size="lg"
          onClick={() => {
            if (validateStep2()) {
              setCurrentStep(3);
            }
          }}
          aria-label="Continue to step 3"
        >
          <span>Continue to Budget & Style</span>
          <ArrowRight className="w-5 h-5 ml-1" aria-hidden="true" />
        </Button>
      </div>
    </motion.section>
  );

  // ==========================================================================
  // Render Step 3: Budget & Preferences
  // ==========================================================================

  const renderStep3 = () => (
    <motion.section
      key="step-3"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      aria-labelledby="step-3-heading"
      className="space-y-8"
    >
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold uppercase tracking-wider">
          <span>Step 3 of 4</span>
          <span>•</span>
          <span>Budget & Taste</span>
        </div>
        <h2 id="step-3-heading" className="text-3xl font-bold tracking-tight">
          Budget, Style & Special Touches
        </h2>
        <p className="text-slate-600 text-base">
          Tailor how your celebration looks, tastes, and feels. Gemini will
          allocate every dollar thoughtfully.
        </p>
      </div>

      <div className="glass-card p-8 sm:p-10 rounded-3xl max-w-3xl mx-auto space-y-6">
        {/* Budget and Style Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Input
            type="number"
            min={100}
            step={100}
            label="Total Budget (USD) *"
            placeholder="e.g., 10000"
            icon={DollarSign}
            value={formData.totalBudget || ''}
            onChange={(e) =>
              handleInputChange('totalBudget', Number(e.target.value))
            }
            error={validationErrors.totalBudget}
            aria-required="true"
          />

          <Select
            label="Atmosphere & Style Preference"
            options={[...STYLE_OPTIONS]}
            value={formData.preferences.style || 'Modern'}
            onChange={(e) => handlePreferenceChange('style', e.target.value)}
          />
        </div>

        {/* Theme and Color Palette */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Input
            label="Theme & Aesthetic"
            placeholder={dynamicPlaceholders.theme}
            value={formData.preferences.theme || ''}
            onChange={(e) => handlePreferenceChange('theme', e.target.value)}
          />

          <Input
            label="Color Palette (comma separated)"
            placeholder="e.g., Blush Pink, Ivory, Sage Green, Gold"
            value={colorInput}
            onChange={(e) => setColorInput(e.target.value)}
            onBlur={handleColorBlur}
          />
        </div>

        {/* Cuisine Preferences */}
        <Input
          label="Cuisine & Dining Preferences"
          placeholder={dynamicPlaceholders.cuisine}
          value={cuisineInput}
          onChange={(e) => setCuisineInput(e.target.value)}
          onBlur={handleCuisineBlur}
        />

        {/* Special Requirements */}
        <Textarea
          label="Special Requirements & Accessibility"
          rows={3}
          placeholder="e.g., Dietary restrictions (vegan, peanut allergies), wheelchair ramps, sound equipment, pet-friendly..."
          value={formData.preferences.specialRequirements || ''}
          onChange={(e) =>
            handlePreferenceChange('specialRequirements', e.target.value)
          }
        />

        {/* Cultural Considerations */}
        <Textarea
          label="Cultural, Religious, or Family Customs"
          rows={3}
          placeholder="e.g., Traditional tea ceremony, cultural dance performances, blessing rituals, family traditions..."
          value={formData.preferences.culturalConsiderations || ''}
          onChange={(e) =>
            handlePreferenceChange('culturalConsiderations', e.target.value)
          }
        />
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between max-w-3xl mx-auto pt-4">
        <Button
          variant="secondary"
          size="md"
          onClick={() => setCurrentStep(2)}
          aria-label="Back to step 2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
          <span>Back</span>
        </Button>

        <Button
          variant="primary"
          size="lg"
          onClick={handleGeneratePlan}
          className="shadow-xl shadow-violet-600/30"
          aria-label="Generate Event Plan with Gemini AI"
        >
          <Sparkles className="w-5 h-5 mr-1 animate-pulse" aria-hidden="true" />
          <span>Generate Plan with AI ✨</span>
        </Button>
      </div>
    </motion.section>
  );

  // ==========================================================================
  // Render Step 4: AI Generation (Loading / Error Overlay)
  // ==========================================================================

  const renderStep4 = () => (
    <motion.section
      key="step-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      aria-labelledby="step-4-heading"
      className="glass-card p-10 sm:p-16 rounded-3xl max-w-2xl mx-auto text-center space-y-8 my-8 shadow-2xl border-2 border-violet-100"
    >
      {generationError ? (
        <div className="space-y-6">
          <div className="w-20 h-20 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle className="w-10 h-10" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <h3
              id="step-4-heading"
              className="text-2xl font-bold text-slate-900"
            >
              Plan Generation Notice
            </h3>
            <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
              {generationError}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Button
              variant="secondary"
              onClick={() => setCurrentStep(3)}
              aria-label="Return to edit details"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>Edit Details</span>
            </Button>
            <Button
              variant="primary"
              onClick={handleGeneratePlan}
              aria-label="Retry AI Generation"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              <span>Retry AI Generation</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8 py-6">
          {/* Animated Spinner with Sparkles */}
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full border-4 border-violet-100 border-t-violet-600 animate-spin"
            />
            <div
              aria-hidden="true"
              className="absolute inset-2 rounded-full border-4 border-rose-100 border-b-rose-500 animate-spin [animation-direction:reverse]"
            />
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/40">
              <Sparkles className="w-8 h-8 animate-pulse" aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-3">
            <h3
              id="step-4-heading"
              className="text-2xl font-bold tracking-tight text-slate-900"
            >
              Gemini AI is crafting your celebration
            </h3>

            {/* Rotating Progress Message */}
            <div className="h-8 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={loadingMessageIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="text-violet-700 font-semibold text-base"
                >
                  {LOADING_MESSAGES[loadingMessageIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Structuring budget categories, vendor booking roadmaps, and
            countdown milestones tailored to {formData.guestCount} guests.
          </p>
        </div>
      )}
    </motion.section>
  );

  // ==========================================================================
  // Render Step 5: Plan Review
  // ==========================================================================

  const renderStep5 = () => {
    if (!generatedPlan) return null;

    const topCategories = generatedPlan.budgetBreakdown.slice(0, 5);
    const topMilestones = generatedPlan.timelineMilestones.slice(0, 5);
    const themes = generatedPlan.themeSuggestions.slice(0, 3);

    return (
      <motion.section
        key="step-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.3 }}
        aria-labelledby="step-5-heading"
        className="space-y-10 max-w-5xl mx-auto"
      >
        {/* Header Banner */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>AI Blueprint Ready</span>
          </div>
          <h2
            id="step-5-heading"
            className="text-3xl sm:text-4xl font-extrabold tracking-tight"
          >
            Your AI Celebration Plan is Ready!
          </h2>
          <p className="text-slate-600 text-base">
            Review your custom blueprint crafted by Gemini 2.0 Flash. When
            ready, save your event to unlock real-time budget management, interactive
            checklists, and vendor tracking.
          </p>
        </div>

        {/* Event Quick Snapshot Card */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6 border border-white/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-violet-600">
                {formData.type} Celebration
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                {formData.name}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="purple" size="md">
                <Calendar className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                <span>{formatDate(formData.date)}</span>
              </Badge>
              <Badge variant="info" size="md">
                <MapPin className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                <span>{formData.location}</span>
              </Badge>
              <Badge variant="warning" size="md">
                <Users className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                <span>{formData.guestCount} Guests</span>
              </Badge>
              <Badge variant="success" size="md">
                <DollarSign className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                <span>{formatCurrency(formData.totalBudget)}</span>
              </Badge>
            </div>
          </div>

          {/* Overview Statement */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Executive Overview
            </h4>
            <p className="text-slate-700 text-base leading-relaxed">
              {generatedPlan.overview}
            </p>
          </div>

          {/* Plan Highlights */}
          {generatedPlan.highlights && generatedPlan.highlights.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Key Highlights
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {generatedPlan.highlights.map((highlight, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-violet-50/60 border border-violet-100"
                  >
                    <CheckCircle
                      className="w-4 h-4 text-violet-600 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span className="text-sm text-slate-800 font-medium leading-snug">
                      {highlight}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side-by-side Budget & Timeline Previews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Budget Allocation Preview */}
          <Card className="rounded-3xl border border-white/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl">Budget Allocation</CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Top categories based on your ${formData.totalBudget.toLocaleString()} limit
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                <DollarSign className="w-5 h-5" aria-hidden="true" />
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              {topCategories.map((cat, idx) => {
                const gradient =
                  CATEGORY_BAR_GRADIENTS[idx % CATEGORY_BAR_GRADIENTS.length];
                return (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-800">
                        {cat.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">
                          {cat.percentage}%
                        </span>
                        <span className="font-bold text-violet-700">
                          {formatCurrency(cat.estimatedAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div
                      aria-hidden="true"
                      className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden"
                    >
                      <div
                        className={cn(
                          'h-full rounded-full bg-gradient-to-r transition-all duration-500',
                          gradient
                        )}
                        style={{
                          width: `${Math.min(Math.max(cat.percentage, 5), 100)}%`,
                        }}
                      />
                    </div>

                    <p className="text-xs text-gray-500 leading-tight">
                      {cat.description}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Timeline Milestones Preview */}
          <Card className="rounded-3xl border border-white/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl">Milestones & Schedule</CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Countdown milestones tailored to {formatDateShort(formData.date)}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Clock className="w-5 h-5" aria-hidden="true" />
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-2">
              {topMilestones.map((milestone, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white/70 border border-gray-100 flex items-start justify-between gap-3 shadow-sm hover:border-violet-200 transition-colors"
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">
                        {milestone.title}
                      </h4>
                      <Badge
                        variant={getPriorityBadgeVariant(milestone.priority)}
                        size="sm"
                      >
                        {milestone.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {milestone.description}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2 py-1 rounded-md block">
                      {formatDateShort(milestone.dueDate)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Theme Suggestions */}
        {themes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900">
                  Creative Theme Inspirations
                </h3>
                <p className="text-sm text-gray-500">
                  Aesthetic palettes and styling recommendations from AI
                </p>
              </div>
              <Palette className="w-5 h-5 text-violet-600" aria-hidden="true" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {themes.map((theme, idx) => (
                <div
                  key={idx}
                  className="glass-card p-6 rounded-3xl space-y-4 border border-white/60 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <h4 className="text-lg font-bold text-slate-900">
                      {theme.name}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {theme.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Color Swatch Circles */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                        Color Swatches
                      </span>
                      <div className="flex items-center gap-2">
                        {theme.colorPalette.map((color, colorIdx) => {
                          const hex = resolveColorHex(color);
                          return (
                            <div
                              key={colorIdx}
                              title={color}
                              className="w-7 h-7 rounded-full shadow-sm border border-black/10 flex items-center justify-center transition-transform hover:scale-110"
                              style={{ backgroundColor: hex }}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Key Elements Tags */}
                    {theme.keyElements && theme.keyElements.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {theme.keyElements.slice(0, 3).map((elem, elemIdx) => (
                          <span
                            key={elemIdx}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-slate-700 font-medium"
                          >
                            {elem}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Planning Tips */}
        {generatedPlan.tips && generatedPlan.tips.length > 0 && (
          <div className="glass-card p-6 sm:p-8 rounded-3xl border border-amber-200/60 bg-amber-50/40 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Lightbulb className="w-4 h-4" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Pro Planning Tips from CelebrateAI
              </h3>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {generatedPlan.tips.map((tip, tipIdx) => (
                <li
                  key={tipIdx}
                  className="flex items-start gap-2 text-sm text-slate-700 leading-snug"
                >
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Sticky Action Footer */}
        <div className="glass-card p-6 rounded-3xl border border-violet-100 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <Button
            variant="secondary"
            size="lg"
            onClick={handleGeneratePlan}
            aria-label="Regenerate celebration plan with AI"
          >
            <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
            <span>Regenerate Plan</span>
          </Button>

          <Button
            variant="primary"
            size="lg"
            onClick={handleSaveAndStartPlanning}
            className="w-full sm:w-auto shadow-xl shadow-violet-600/30"
            aria-label="Save and start planning event"
          >
            <span>Save & Start Planning</span>
            <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
          </Button>
        </div>
      </motion.section>
    );
  };

  // ==========================================================================
  // Render Main Layout
  // ==========================================================================

  return (
    <div className="min-h-screen py-10 sm:py-14">
      <div className="section-container">
        {/* Wizard Header Bar */}
        <header className="text-center max-w-2xl mx-auto mb-6 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>CelebrateAI Event Studio</span>
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
            Create Your <span className="gradient-text">Celebration</span>
          </h1>
          <p className="text-slate-600 text-base">
            Let Google Gemini AI architect your budget, timelines, and creative
            details in seconds.
          </p>
        </header>

        {/* Progress Stepper */}
        {renderStepIndicator()}

        {/* Dynamic Wizard Steps */}
        <main>
          <AnimatePresence mode="wait">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

// ============================================================================
// Fallback Skeleton for Next.js Suspense Boundary
// ============================================================================

function WizardLoadingSkeleton(): React.JSX.Element {
  return (
    <div className="min-h-screen py-16 flex items-center justify-center section-container">
      <div className="glass-card p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">
          Loading Event Wizard...
        </h2>
        <p className="text-sm text-gray-500">
          Preparing your AI celebration studio.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Root Page Component
// Wrapped in Suspense to satisfy Next.js useSearchParams requirements.
// ============================================================================

export default function NewEventPage(): React.JSX.Element {
  return (
    <Suspense fallback={<WizardLoadingSkeleton />}>
      <EventWizardContent />
    </Suspense>
  );
}
