'use client';

/**
 * @file EventContext.tsx
 * @description React Context and provider for global event state management in CelebrateAI.
 * Manages reactive state in client components, initializes from browser storage,
 * syncs updates, and exposes CRUD utilities through the useEvents custom hook.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { CelebrateEvent } from '@/types';
import {
  getEvents as getEventsFromStorage,
  getEvent as getEventFromStorage,
  saveEvent as saveEventToStorage,
  deleteEvent as deleteEventFromStorage,
  updateEvent as updateEventInStorage,
} from '@/lib/storage';

/**
 * Interface describing the shape of the global event context.
 */
export interface EventContextType {
  /** Collection of all saved CelebrateEvents */
  events: CelebrateEvent[];
  /** True while events are being read from browser storage on initial load */
  loading: boolean;
  /** Adds a new event or overwrites an existing event with matching ID */
  addEvent: (event: CelebrateEvent) => void;
  /** Applies partial property updates to an existing event */
  updateEvent: (id: string, updates: Partial<CelebrateEvent>) => CelebrateEvent | null;
  /** Permanently deletes an event by identifier */
  deleteEvent: (id: string) => void;
  /** Retrieves an event by ID from current state or storage */
  getEvent: (id: string) => CelebrateEvent | null;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

interface EventProviderProps {
  children: ReactNode;
}

/**
 * Context Provider component managing CelebrateAI event state across the application.
 *
 * @param props.children - Child components that have access to the context.
 */
export function EventProvider({ children }: EventProviderProps): React.JSX.Element {
  const [events, setEvents] = useState<CelebrateEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize events from localStorage on component mount
  useEffect(() => {
    try {
      const storedEvents = getEventsFromStorage();
      setEvents(storedEvents);
    } catch (error) {
      console.error('[EventContext] Failed to initialize events from storage:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Adds or replaces an event in state and writes to persistent storage.
   */
  const addEvent = useCallback((event: CelebrateEvent): void => {
    try {
      saveEventToStorage(event);
      setEvents((prev) => {
        const index = prev.findIndex((item) => item.id === event.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = event;
          return next;
        }
        return [...prev, event];
      });
    } catch (error) {
      console.error('[EventContext] Failed to add event:', error);
    }
  }, []);

  /**
   * Updates an existing event partially in state and storage.
   */
  const updateEvent = useCallback(
    (id: string, updates: Partial<CelebrateEvent>): CelebrateEvent | null => {
      try {
        const updated = updateEventInStorage(id, updates);
        if (updated) {
          setEvents((prev) =>
            prev.map((item) => (item.id === id ? updated : item))
          );
        }
        return updated;
      } catch (error) {
        console.error(`[EventContext] Failed to update event with id ${id}:`, error);
        return null;
      }
    },
    []
  );

  /**
   * Deletes an event by ID from both state and localStorage.
   */
  const deleteEvent = useCallback((id: string): void => {
    try {
      deleteEventFromStorage(id);
      setEvents((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error(`[EventContext] Failed to delete event with id ${id}:`, error);
    }
  }, []);

  /**
   * Retrieves an event by ID from memory state or fallback to storage.
   */
  const getEvent = useCallback(
    (id: string): CelebrateEvent | null => {
      if (!id) return null;
      const foundInMemory = events.find((item) => item.id === id);
      if (foundInMemory) {
        return foundInMemory;
      }
      return getEventFromStorage(id);
    },
    [events]
  );

  const contextValue = useMemo<EventContextType>(
    () => ({
      events,
      loading,
      addEvent,
      updateEvent,
      deleteEvent,
      getEvent,
    }),
    [events, loading, addEvent, updateEvent, deleteEvent, getEvent]
  );

  return (
    <EventContext.Provider value={contextValue}>
      {children}
    </EventContext.Provider>
  );
}

/**
 * Custom React hook for consuming the CelebrateAI event context.
 *
 * @throws Error if invoked outside of an EventProvider hierarchy.
 * @returns The EventContextType context interface.
 */
export function useEvents(): EventContextType {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
}
