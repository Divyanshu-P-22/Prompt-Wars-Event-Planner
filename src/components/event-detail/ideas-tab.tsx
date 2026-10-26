'use client';

/**
 * @file ideas-tab.tsx
 * @description AI Recommendations and Conversational Planning Assistant tab for CelebrateAI.
 * Features visual theme aesthetic cards with color palette swatches, mood tags, key elements,
 * and an interactive chat interface communicating with Google Gemini via /api/ai/chat.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Palette,
  Tag,
  CheckCircle,
  Lightbulb,
  Loader2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import type {
  CelebrateEvent,
  ThemeSuggestion,
  AIMessage,
} from '@/types';
import { generateId, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface IdeasTabProps {
  /** The CelebrateEvent entity currently being planned */
  event: CelebrateEvent;
  /** Callback to trigger event updates */
  onUpdate: (updates: Partial<CelebrateEvent>) => void;
}

const QUICK_PROMPTS = [
  'Suggest menu ideas',
  'Recommend entertainment',
  'Decor inspiration',
  'Gift ideas for guests',
  'Day-of schedule',
] as const;

/**
 * IdeasTab component providing AI theme concepts and conversational event planning.
 *
 * @param props - IdeasTabProps with event and onUpdate.
 * @returns JSX.Element the rendered ideas and chat interface.
 */
export function IdeasTab({ event, onUpdate }: IdeasTabProps): React.JSX.Element {
  // Chat messages state
  const [messages, setMessages] = useState<AIMessage[]>(() => [
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Hello! I'm your dedicated CelebrateAI assistant for **${event.name}**. I have full context on your **${event.type}** celebration for **${event.guestCount} guests** in **${event.location || 'your selected city'}**.\n\nAsk me anything or choose one of the quick prompts above to get tailored ideas for decor, menus, entertainment, or day-of coordination!`,
      timestamp: new Date().toISOString(),
    },
  ]);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /**
   * Sends a user query to the Gemini AI chat endpoint.
   */
  const handleSendMessage = async (textToSend?: string): Promise<void> => {
    const query = (textToSend !== undefined ? textToSend : inputMessage).trim();
    if (!query || isLoading) return;

    setChatError(null);

    const userMsg: AIMessage = {
      id: generateId(),
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          event,
          messages: updatedMessages,
          userMessage: query,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to receive AI response. Please try again.');
      }

      const aiMsg: AIMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('[IdeasTab] Error sending chat message:', err);
      const errMsg = err instanceof Error ? err.message : 'Unknown AI communication error.';
      setChatError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const themeSuggestions = event.aiPlan?.themeSuggestions || [];

  return (
    <div className="space-y-10" role="region" aria-label="Event Ideas and AI Chat Tab">
      {/* SECTION 1: Theme Suggestions */}
      <section aria-label="AI Theme Suggestions" className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
              <Palette className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Theme Suggestions</h3>
              <p className="text-xs text-gray-500">
                Aesthetic concepts, curated color palettes, and ambiance keywords
              </p>
            </div>
          </div>
        </div>

        {themeSuggestions.length === 0 ? (
          <div className="glass-card p-8 text-center space-y-3 border border-dashed border-gray-200">
            <Sparkles className="w-8 h-8 text-violet-400 mx-auto" aria-hidden="true" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-800">No theme suggestions in current plan</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Ask the AI assistant below for creative aesthetic concepts or regenerate your master plan.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleSendMessage('Suggest 3 creative theme aesthetics with color palettes and decor details')}
            >
              <Lightbulb className="w-3.5 h-3.5 mr-1 text-amber-500" aria-hidden="true" />
              <span>Ask AI For Theme Ideas</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themeSuggestions.map((theme: ThemeSuggestion, idx: number) => (
              <motion.div
                key={`theme-${idx}`}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="glass-card p-6 border border-white/80 bg-white/90 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Theme Title */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-violet-600 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Curated Concept #{idx + 1}</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                      {theme.name}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {theme.description}
                    </p>
                  </div>

                  {/* Color Palette Swatches */}
                  {theme.colorPalette && theme.colorPalette.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block">
                        Color Palette
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {theme.colorPalette.map((color, colorIdx) => (
                          <div
                            key={`color-${colorIdx}`}
                            className="group relative flex items-center"
                          >
                            <span
                              className="w-7 h-7 rounded-full shadow-inner ring-2 ring-white border border-black/10 inline-block transition-transform group-hover:scale-125 cursor-pointer"
                              style={{ backgroundColor: color }}
                              title={color}
                              aria-label={`Color swatch ${color}`}
                            />
                            <span className="sr-only">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Elements Checklist */}
                  {theme.keyElements && theme.keyElements.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block">
                        Key Signature Elements
                      </span>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {theme.keyElements.map((elem, elemIdx) => (
                          <li key={`elem-${elemIdx}`} className="flex items-start gap-1.5 leading-snug">
                            <CheckCircle className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{elem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Mood Keywords Tags */}
                {theme.moodKeywords && theme.moodKeywords.length > 0 && (
                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center gap-1.5 flex-wrap">
                    {theme.moodKeywords.map((tag, tagIdx) => (
                      <span
                        key={`tag-${tagIdx}`}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-100"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 2: AI Chat Interface */}
      <section aria-label="AI Event Planner Chat Assistant" className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
              <Bot className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">AI Planning Assistant</h3>
              <p className="text-xs text-gray-500">
                Interactive real-time consultation with Gemini AI
              </p>
            </div>
          </div>
        </div>

        {/* Chat Card Box */}
        <div className="glass-card border border-white/80 bg-white/90 shadow-lg overflow-hidden flex flex-col h-[580px]">
          {/* Quick Prompt Chips */}
          <div className="p-3 border-b border-gray-100 bg-slate-50/70 overflow-x-auto scrollbar-none flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 shrink-0 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-500" aria-hidden="true" />
              <span>Prompt Ideas:</span>
            </span>
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white text-violet-700 hover:bg-violet-50 hover:text-violet-900 border border-violet-200 transition-colors shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div
            className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 scroll-smooth"
            role="log"
            aria-live="polite"
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex items-end gap-2.5 max-w-[85%] sm:max-w-[75%]',
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 shadow-sm',
                      isUser
                        ? 'bg-violet-600 text-white'
                        : 'bg-gradient-to-tr from-purple-500 to-rose-500 text-white'
                    )}
                    aria-hidden="true"
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      'p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm whitespace-pre-line',
                      isUser
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-br-none'
                        : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/80'
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-end gap-2.5 max-w-[75%] mr-auto">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-rose-500 text-white flex items-center justify-center text-xs shrink-0 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-100 text-slate-600 rounded-bl-none border border-slate-200/80 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-600" aria-hidden="true" />
                  <span className="text-xs font-medium">CelebrateAI is thinking...</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {chatError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 max-w-md mx-auto">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{chatError}</span>
              </div>
            )}

            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          {/* Input Footer Area */}
          <div className="p-3 sm:p-4 border-t border-gray-100 bg-white/80">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about entertainment, timeline pacing, decor, catering..."
                disabled={isLoading}
                className="input-field text-xs sm:text-sm py-2.5"
                aria-label="Message to CelebrateAI assistant"
              />

              <Button
                type="submit"
                variant="primary"
                disabled={!inputMessage.trim() || isLoading}
                loading={isLoading}
                className="shrink-0 px-4 py-2.5"
                aria-label="Send message to AI"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Ask AI</span>
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default IdeasTab;
