/**
 * @file validators.ts
 * @description Zod validation schemas and derived TypeScript types for CelebrateAI.
 * Validates inputs for the event setup wizard, budget line items, vendors,
 * timeline scheduling tasks, and interactive AI chat messages.
 */

import { z } from 'zod';

/**
 * Validation schema for optional styling and cultural event preferences.
 */
export const eventPreferencesSchema = z.object({
  theme: z.string().optional(),
  cuisine: z.array(z.string()).optional(),
  style: z.string().optional(),
  colorScheme: z.array(z.string()).optional(),
  specialRequirements: z.string().optional(),
  culturalConsiderations: z.string().optional(),
});

/**
 * Validation schema for the multi-step event setup wizard.
 * Requires valid event type, non-empty name, date, location, positive guest count and budget.
 */
export const eventFormSchema = z.object({
  type: z.enum(['wedding', 'birthday', 'community'], {
    required_error: 'Please select an event type',
    invalid_type_error: 'Event type must be wedding, birthday, or community',
  }),
  name: z
    .string({ required_error: 'Event name is required' })
    .trim()
    .min(2, { message: 'Event name must be at least 2 characters long' })
    .max(100, { message: 'Event name must not exceed 100 characters' }),
  date: z
    .string({ required_error: 'Event date is required' })
    .min(1, { message: 'Event date is required' }),
  location: z
    .string({ required_error: 'Location is required' })
    .trim()
    .min(2, { message: 'Location must be at least 2 characters' })
    .max(200, { message: 'Location must not exceed 200 characters' }),
  guestCount: z.coerce
    .number({ invalid_type_error: 'Guest count must be a number' })
    .int({ message: 'Guest count must be an integer' })
    .positive({ message: 'Guest count must be greater than 0' }),
  totalBudget: z.coerce
    .number({ invalid_type_error: 'Budget must be a number' })
    .positive({ message: 'Total budget must be greater than 0' }),
  description: z
    .string()
    .max(1000, { message: 'Description must not exceed 1000 characters' })
    .default(''),
  preferences: eventPreferencesSchema.default({}),
});

/**
 * Validation schema for creating or updating a budget line item.
 */
export const budgetItemSchema = z.object({
  id: z.string().optional(),
  category: z
    .string({ required_error: 'Category is required' })
    .trim()
    .min(1, { message: 'Category is required' }),
  name: z
    .string({ required_error: 'Item name is required' })
    .trim()
    .min(1, { message: 'Item name is required' })
    .max(120, { message: 'Item name must not exceed 120 characters' }),
  estimatedCost: z.coerce
    .number({ invalid_type_error: 'Estimated cost must be a number' })
    .min(0, { message: 'Estimated cost cannot be negative' }),
  actualCost: z.coerce
    .number({ invalid_type_error: 'Actual cost must be a number' })
    .min(0, { message: 'Actual cost cannot be negative' })
    .default(0),
  status: z
    .enum(['estimated', 'quoted', 'booked', 'paid'])
    .default('estimated'),
  notes: z.string().default(''),
});

/**
 * Validation schema for creating or updating a vendor entry.
 */
export const vendorSchema = z.object({
  id: z.string().optional(),
  name: z
    .string({ required_error: 'Vendor name is required' })
    .trim()
    .min(1, { message: 'Vendor name is required' })
    .max(120, { message: 'Vendor name must not exceed 120 characters' }),
  category: z
    .string({ required_error: 'Category is required' })
    .trim()
    .min(1, { message: 'Category is required' }),
  contact: z.string().default(''),
  email: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .or(z.literal(''))
    .default(''),
  phone: z.string().default(''),
  estimatedCost: z.coerce
    .number({ invalid_type_error: 'Estimated cost must be a number' })
    .min(0, { message: 'Estimated cost cannot be negative' })
    .default(0),
  status: z
    .enum(['researching', 'contacted', 'negotiating', 'booked', 'paid'])
    .default('researching'),
  notes: z.string().default(''),
  rating: z.coerce
    .number()
    .min(0, { message: 'Rating must be at least 0' })
    .max(5, { message: 'Rating cannot exceed 5' })
    .default(0),
});

/**
 * Validation schema for scheduling a timeline milestone or planning task.
 */
export const timelineItemSchema = z.object({
  id: z.string().optional(),
  title: z
    .string({ required_error: 'Task title is required' })
    .trim()
    .min(1, { message: 'Task title is required' })
    .max(150, { message: 'Task title cannot exceed 150 characters' }),
  description: z.string().default(''),
  dueDate: z
    .string({ required_error: 'Due date is required' })
    .min(1, { message: 'Due date is required' }),
  status: z
    .enum(['pending', 'in_progress', 'completed', 'overdue'])
    .default('pending'),
  priority: z
    .enum(['low', 'medium', 'high', 'critical'])
    .default('medium'),
  category: z
    .string()
    .default('General'),
});

/**
 * Validation schema for AI chat message interactions.
 */
export const aiChatMessageSchema = z.object({
  message: z
    .string({ required_error: 'Message content is required' })
    .trim()
    .min(1, { message: 'Message cannot be empty' })
    .max(2000, { message: 'Message is too long (maximum 2000 characters)' }),
  eventId: z.string().optional(),
});

// Infer static TypeScript types from the Zod schemas
export type EventFormData = z.infer<typeof eventFormSchema>;
export type EventPreferencesData = z.infer<typeof eventPreferencesSchema>;
export type BudgetItemFormData = z.infer<typeof budgetItemSchema>;
export type VendorFormData = z.infer<typeof vendorSchema>;
export type TimelineItemFormData = z.infer<typeof timelineItemSchema>;
export type AIChatMessageFormData = z.infer<typeof aiChatMessageSchema>;
