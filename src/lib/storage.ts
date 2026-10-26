/**
 * @file storage.ts
 * @description Safe localStorage abstraction for persisting and retrieving CelebrateAI events.
 * Provides SSR-safe operations, JSON serialization resilience, and full CRUD utilities.
 */

import type { CelebrateEvent } from '@/types';

/**
 * Storage key used to persist event collections in the browser's localStorage.
 */
export const STORAGE_KEY = 'celebrate-ai-events';

/**
 * Retrieves all saved events from browser localStorage.
 * Returns an empty array in SSR environments or if parsing fails.
 *
 * @returns Array of CelebrateEvent objects.
 */
export function getEvents(): CelebrateEvent[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawData = window.localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      return [];
    }

    const parsed = JSON.parse(rawData);
    if (Array.isArray(parsed)) {
      return parsed as CelebrateEvent[];
    }
    return [];
  } catch (error) {
    console.error('[storage] Failed to parse stored events from localStorage:', error);
    return [];
  }
}

/**
 * Retrieves a single event by its unique identifier.
 *
 * @param id - The unique ID of the event to locate.
 * @returns The matching CelebrateEvent or null if not found.
 */
export function getEvent(id: string): CelebrateEvent | null {
  if (typeof window === 'undefined' || !id) {
    return null;
  }

  const events = getEvents();
  return events.find((event) => event.id === id) ?? null;
}

/**
 * Persists an event into localStorage. If an event with the same ID already exists,
 * it will be overwritten; otherwise, it is appended to the collection.
 *
 * @param event - The CelebrateEvent entity to save.
 */
export function saveEvent(event: CelebrateEvent): void {
  if (typeof window === 'undefined' || !event) {
    return;
  }

  try {
    const events = getEvents();
    const existingIndex = events.findIndex((item) => item.id === event.id);
    const timestamp = new Date().toISOString();

    const preparedEvent: CelebrateEvent = {
      ...event,
      createdAt: event.createdAt || timestamp,
      updatedAt: timestamp,
    };

    if (existingIndex >= 0) {
      events[existingIndex] = preparedEvent;
    } else {
      events.push(preparedEvent);
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('[storage] Failed to save event to localStorage:', error);
  }
}

/**
 * Deletes an event from localStorage by its identifier.
 *
 * @param id - The ID of the event to remove.
 */
export function deleteEvent(id: string): void {
  if (typeof window === 'undefined' || !id) {
    return;
  }

  try {
    const events = getEvents();
    const filteredEvents = events.filter((event) => event.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredEvents));
  } catch (error) {
    console.error(`[storage] Failed to delete event with id ${id}:`, error);
  }
}

/**
 * Applies partial updates to an existing event in localStorage.
 *
 * @param id - The identifier of the event to update.
 * @param updates - Partial object containing fields to merge.
 * @returns The updated CelebrateEvent instance, or null if the event was not found.
 */
export function updateEvent(
  id: string,
  updates: Partial<CelebrateEvent>
): CelebrateEvent | null {
  if (typeof window === 'undefined' || !id) {
    return null;
  }

  try {
    const events = getEvents();
    const targetIndex = events.findIndex((event) => event.id === id);

    if (targetIndex === -1) {
      return null;
    }

    const current = events[targetIndex];
    const updatedEvent: CelebrateEvent = {
      ...current,
      ...updates,
      id: current.id, // Immutable ID
      updatedAt: new Date().toISOString(),
    };

    events[targetIndex] = updatedEvent;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));

    return updatedEvent;
  } catch (error) {
    console.error(`[storage] Failed to update event with id ${id}:`, error);
    return null;
  }
}
