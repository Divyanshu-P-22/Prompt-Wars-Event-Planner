'use client';

/**
 * @file timeline-tab.tsx
 * @description Dynamic Timeline and Milestone management tab for CelebrateAI.
 * Features progress metric tracking, status filtering (All, Pending, In Progress, Completed, Overdue),
 * chronological timeline layout with visual connection nodes, overdue alerts,
 * and dialog-based task creation.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Tag,
  Check,
  ListFilter,
} from 'lucide-react';
import type {
  CelebrateEvent,
  TimelineItem,
  TimelineItemStatus,
  Priority,
} from '@/types';
import {
  formatDateShort,
  getPriorityColor,
  getStatusColor,
  generateId,
  cn,
} from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export interface TimelineTabProps {
  /** The CelebrateEvent entity currently being managed */
  event: CelebrateEvent;
  /** Update callback to sync timeline item mutations back to storage and state */
  onUpdate: (updates: Partial<CelebrateEvent>) => void;
}

const TIMELINE_CATEGORIES = [
  'Planning',
  'Venue',
  'Catering',
  'Decor',
  'Entertainment',
  'Logistics',
  'Administrative',
] as const;

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];

type FilterType = 'all' | 'pending' | 'in_progress' | 'completed' | 'overdue';

interface TaskFormData {
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  category: string;
}

const initialFormData: TaskFormData = {
  title: '',
  description: '',
  dueDate: new Date().toISOString().split('T')[0],
  priority: 'medium',
  category: 'Planning',
};

/**
 * Checks whether an item's due date is in the past and the item is uncompleted.
 *
 * @param item - The TimelineItem to evaluate.
 * @returns True if overdue.
 */
function isTaskOverdue(item: TimelineItem): boolean {
  if (item.status === 'completed') return false;
  if (!item.dueDate) return false;
  const target = new Date(item.dueDate);
  // Compare by start of day
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return target.getTime() < today.getTime();
}

/**
 * TimelineTab component for organizing, scheduling, and tracking event tasks.
 *
 * @param props - TimelineTabProps with event and onUpdate.
 * @returns JSX.Element the rendered timeline schedule.
 */
export function TimelineTab({ event, onUpdate }: TimelineTabProps): React.JSX.Element {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<TaskFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<{ title?: string; dueDate?: string }>({});

  const timelineItems = event.timelineItems || [];

  // Metrics
  const totalTasks = timelineItems.length;
  const completedTasks = timelineItems.filter((i) => i.status === 'completed').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const overdueCount = timelineItems.filter(isTaskOverdue).length;

  // Filter & Sort
  const filteredItems = useMemo(() => {
    return [...timelineItems]
      .filter((item) => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'overdue') return isTaskOverdue(item);
        return item.status === activeFilter;
      })
      .sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        return dateA - dateB;
      });
  }, [timelineItems, activeFilter]);

  /**
   * Toggles task between 'completed' and 'pending'.
   */
  const handleToggleComplete = (id: string, e: React.MouseEvent): void => {
    e.stopPropagation();
    const updated = timelineItems.map((item) => {
      if (item.id === id) {
        const newStatus: TimelineItemStatus =
          item.status === 'completed' ? 'pending' : 'completed';
        return { ...item, status: newStatus };
      }
      return item;
    });
    onUpdate({ timelineItems: updated });
  };

  /**
   * Updates an item's status via dropdown.
   */
  const handleStatusSelect = (id: string, status: TimelineItemStatus): void => {
    const updated = timelineItems.map((item) =>
      item.id === id ? { ...item, status } : item
    );
    onUpdate({ timelineItems: updated });
  };

  /**
   * Deletes a task from the schedule.
   */
  const handleDeleteTask = (id: string, e: React.MouseEvent): void => {
    e.stopPropagation();
    const updated = timelineItems.filter((item) => item.id !== id);
    onUpdate({ timelineItems: updated });
  };

  /**
   * Opens the task creation modal.
   */
  const handleOpenAddDialog = (): void => {
    setFormData({
      ...initialFormData,
      dueDate: event.date || new Date().toISOString().split('T')[0],
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  /**
   * Saves a newly created task.
   */
  const handleSaveTask = (e: React.FormEvent): void => {
    e.preventDefault();

    const errors: { title?: string; dueDate?: string } = {};
    if (!formData.title.trim()) {
      errors.title = 'Task title is required.';
    }
    if (!formData.dueDate) {
      errors.dueDate = 'Due date is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const newTask: TimelineItem = {
      id: generateId(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      dueDate: formData.dueDate,
      priority: formData.priority,
      category: formData.category,
      status: 'pending',
    };

    onUpdate({
      timelineItems: [...timelineItems, newTask],
    });

    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-8" role="region" aria-label="Event Timeline Tab">
      {/* Progress Summary Card */}
      <section
        aria-label="Timeline Progress Summary"
        className="glass-card p-6 border border-white/60 bg-white/85 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Timeline Progress
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              <span className="font-semibold text-violet-700">{completedTasks}</span> of{' '}
              <span className="font-semibold text-slate-700">{totalTasks}</span> tasks completed
              {overdueCount > 0 && (
                <span className="text-rose-600 font-semibold ml-2">
                  ({overdueCount} overdue)
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-violet-700">
              {progressPercent}%
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddDialog}
              aria-label="Add new timeline task"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
              <span>Add Task</span>
            </Button>
          </div>
        </div>

        {/* Smooth Progress Bar */}
        <div className="mt-4 h-3 w-full bg-gray-100 rounded-full overflow-hidden p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-violet-600 to-rose-500 rounded-full"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Task progress: ${progressPercent}%`}
          />
        </div>
      </section>

      {/* Filter Buttons Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100/80 border border-gray-200 text-xs font-semibold overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg transition-all',
              activeFilter === 'all'
                ? 'bg-white text-violet-900 shadow-sm'
                : 'text-gray-600 hover:text-slate-900'
            )}
          >
            All ({totalTasks})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('pending')}
            className={cn(
              'px-3 py-1.5 rounded-lg transition-all',
              activeFilter === 'pending'
                ? 'bg-white text-violet-900 shadow-sm'
                : 'text-gray-600 hover:text-slate-900'
            )}
          >
            Pending ({timelineItems.filter((t) => t.status === 'pending').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('in_progress')}
            className={cn(
              'px-3 py-1.5 rounded-lg transition-all',
              activeFilter === 'in_progress'
                ? 'bg-white text-violet-900 shadow-sm'
                : 'text-gray-600 hover:text-slate-900'
            )}
          >
            In Progress ({timelineItems.filter((t) => t.status === 'in_progress').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('completed')}
            className={cn(
              'px-3 py-1.5 rounded-lg transition-all',
              activeFilter === 'completed'
                ? 'bg-white text-violet-900 shadow-sm'
                : 'text-gray-600 hover:text-slate-900'
            )}
          >
            Completed ({completedTasks})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('overdue')}
            className={cn(
              'px-3 py-1.5 rounded-lg transition-all',
              activeFilter === 'overdue'
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-gray-600 hover:text-rose-600'
            )}
          >
            Overdue ({overdueCount})
          </button>
        </div>

        <span className="text-xs text-gray-500 hidden sm:inline">
          Showing {filteredItems.length} tasks
        </span>
      </div>

      {/* Visual Timeline Section */}
      <section aria-label="Scheduled Timeline Tasks" className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="glass-card py-12 px-4 text-center space-y-3">
            <Clock className="w-10 h-10 text-gray-300 mx-auto" aria-hidden="true" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-800">No tasks in this view</h4>
              <p className="text-xs text-gray-500">
                {activeFilter === 'all'
                  ? 'Add your first milestone or task to begin planning your timeline.'
                  : `No tasks matching the "${activeFilter}" filter.`}
              </p>
            </div>
            {activeFilter === 'all' && (
              <Button variant="primary" size="sm" onClick={handleOpenAddDialog}>
                <Plus className="w-4 h-4 mr-1 stroke-[2.5]" aria-hidden="true" />
                <span>Add Task</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-violet-200">
            <AnimatePresence initial={false}>
              {filteredItems.map((item) => {
                const overdue = isTaskOverdue(item);
                const isExpanded = expandedId === item.id;
                const isCompleted = item.status === 'completed';

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="relative group"
                  >
                    {/* Visual Timeline Node (Dot) */}
                    <div
                      className={cn(
                        'absolute -left-6 sm:-left-8 top-5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white z-10 transition-colors',
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : overdue
                          ? 'bg-rose-500 text-white ring-rose-100'
                          : 'bg-white border-2 border-violet-500 text-violet-600'
                      )}
                      aria-hidden="true"
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : overdue ? (
                        <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-violet-600" />
                      )}
                    </div>

                    {/* Task Card */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className={cn(
                        'glass-card p-4 sm:p-5 border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md',
                        overdue && !isCompleted
                          ? 'border-rose-300 bg-rose-50/20 shadow-rose-500/5'
                          : isCompleted
                          ? 'border-gray-200/60 bg-white/60 opacity-80'
                          : 'border-white/80 bg-white/90'
                      )}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExpandedId(isExpanded ? null : item.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Checkbox & Details */}
                        <div className="flex items-start gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => handleToggleComplete(item.id, e)}
                            className={cn(
                              'mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0',
                              isCompleted
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                : 'border-gray-300 hover:border-violet-500 bg-white'
                            )}
                            aria-label={
                              isCompleted
                                ? `Mark ${item.title} as incomplete`
                                : `Mark ${item.title} as completed`
                            }
                          >
                            {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />}
                          </button>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                className={cn(
                                  'font-bold text-sm sm:text-base text-slate-900 transition-all truncate',
                                  isCompleted && 'line-through text-gray-400'
                                )}
                              >
                                {item.title}
                              </h4>

                              {/* Priority Badge */}
                              <span
                                className={cn(
                                  'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border',
                                  getPriorityColor(item.priority)
                                )}
                              >
                                {item.priority}
                              </span>

                              {/* Category Badge */}
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5" aria-hidden="true" />
                                <span>{item.category}</span>
                              </span>

                              {/* Overdue Badge */}
                              {overdue && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-300 flex items-center gap-1">
                                  <AlertCircle className="w-2.5 h-2.5" aria-hidden="true" />
                                  <span>Overdue</span>
                                </span>
                              )}
                            </div>

                            {item.description && (
                              <p
                                className={cn(
                                  'text-xs text-gray-500 leading-relaxed',
                                  !isExpanded && 'line-clamp-1'
                                )}
                              >
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Date, Expand Toggle, Delete */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div
                            className={cn(
                              'flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-medium whitespace-nowrap',
                              overdue
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            )}
                          >
                            <Calendar className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
                            <span>{formatDateShort(item.dueDate)}</span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteTask(item.id, e)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            aria-label={`Delete task ${item.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>

                          <div className="text-gray-400">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="w-4 h-4" aria-hidden="true" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details Drawer */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-4 pt-4 border-t border-gray-100 space-y-3 cursor-default"
                          >
                            {item.description && (
                              <div className="text-xs sm:text-sm text-slate-700 bg-white/70 p-3 rounded-xl border border-gray-100">
                                <span className="font-semibold block text-[11px] uppercase tracking-wider text-gray-400 mb-1">
                                  Task Description
                                </span>
                                {item.description}
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                              {/* Status changer */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium">Status:</span>
                                <select
                                  value={item.status}
                                  onChange={(e) =>
                                    handleStatusSelect(item.id, e.target.value as TimelineItemStatus)
                                  }
                                  className={cn(
                                    'text-xs font-semibold capitalize px-2.5 py-1 rounded-lg border appearance-none pr-6 cursor-pointer focus:outline-none',
                                    getStatusColor(item.status)
                                  )}
                                  aria-label="Change status"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="completed">Completed</option>
                                  <option value="overdue">Overdue</option>
                                </select>
                              </div>

                              <div className="text-xs text-gray-400">
                                Target Date: <span className="font-semibold text-slate-700">{item.dueDate}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Add Task Modal Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Add Timeline Task"
        description="Schedule a new milestone or actionable checklist item for your celebration."
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <Input
            label="Task Title *"
            placeholder="e.g. Schedule Cake Tasting, Send Formal Invites, Final Walkthrough"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            error={formErrors.title}
            required
          />

          <div className="space-y-1.5">
            <label
              htmlFor="task-description"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Description & Notes
            </label>
            <textarea
              id="task-description"
              rows={3}
              placeholder="What specifically needs to happen to complete this milestone..."
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="input-field text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Due Date *"
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
              }
              error={formErrors.dueDate}
              required
            />

            <div className="space-y-1.5">
              <label
                htmlFor="task-priority"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: e.target.value as Priority,
                  }))
                }
                className="input-field cursor-pointer text-sm capitalize"
                aria-label="Select priority level"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="task-category"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Category
              </label>
              <select
                id="task-category"
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                className="input-field cursor-pointer text-sm"
                aria-label="Select task category"
              >
                {TIMELINE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Schedule Task
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export default TimelineTab;
