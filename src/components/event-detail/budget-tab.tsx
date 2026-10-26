'use client';

/**
 * @file budget-tab.tsx
 * @description Interactive Budget Management tab for CelebrateAI.
 * Displays financial summary metrics, Recharts category breakdown pie chart,
 * complete budget line-items table with modal creation/editing/deletion,
 * and integrated AI Budget Advice with Gemini optimization strategies.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  Plus,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Edit2,
  Trash2,
  CheckCircle,
  FileText,
  Loader2,
  Layers,
  ChevronDown,
} from 'lucide-react';
import type {
  CelebrateEvent,
  BudgetItem,
  BudgetItemStatus,
} from '@/types';
import {
  formatCurrency,
  getStatusColor,
  generateId,
  cn,
} from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export interface BudgetTabProps {
  /** The CelebrateEvent entity currently being managed */
  event: CelebrateEvent;
  /** Update callback to sync modifications back to storage and state */
  onUpdate: (updates: Partial<CelebrateEvent>) => void;
}

const COMMON_CATEGORIES = [
  'Venue',
  'Catering',
  'Decor',
  'Entertainment',
  'Photography',
  'Attire',
  'Transportation',
  'Stationery',
  'Gifts',
  'Miscellaneous',
] as const;

const STATUS_OPTIONS: BudgetItemStatus[] = ['estimated', 'quoted', 'booked', 'paid'];

const PASTEL_PALETTE = [
  '#8b5cf6', // Violet
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#64748b', // Slate
];

interface BudgetItemFormData {
  category: string;
  name: string;
  estimatedCost: string;
  actualCost: string;
  status: BudgetItemStatus;
  notes: string;
}

const initialFormData: BudgetItemFormData = {
  category: 'Venue',
  name: '',
  estimatedCost: '',
  actualCost: '0',
  status: 'estimated',
  notes: '',
};

/**
 * BudgetTab component for managing event finances and receiving AI advice.
 *
 * @param props - BudgetTabProps with event and onUpdate.
 * @returns JSX.Element the rendered budget dashboard.
 */
export function BudgetTab({ event, onUpdate }: BudgetTabProps): React.JSX.Element {
  // SSR mount guard for Recharts ResponsiveContainer
  const [mounted, setMounted] = useState<boolean>(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Modal dialog state
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BudgetItemFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<{ name?: string; estimatedCost?: string }>({});

  // AI Advice state
  const [isFetchingAdvice, setIsFetchingAdvice] = useState<boolean>(false);
  const [adviceText, setAdviceText] = useState<string | null>(null);
  const [adviceError, setAdviceError] = useState<string | null>(null);

  // Financial calculations
  const totalBudget = Number(event.totalBudget) || 0;
  const budgetItems = event.budgetItems || [];

  const estimatedTotal = useMemo(
    () => budgetItems.reduce((acc, item) => acc + (Number(item.estimatedCost) || 0), 0),
    [budgetItems]
  );

  const actualSpent = useMemo(
    () => budgetItems.reduce((acc, item) => acc + (Number(item.actualCost) || 0), 0),
    [budgetItems]
  );

  const remaining = totalBudget - actualSpent;
  const isOverBudget = remaining < 0;

  // Chart data: group by category
  const chartData = useMemo(() => {
    const categoryTotals = new Map<string, number>();

    budgetItems.forEach((item) => {
      const value = Number(item.actualCost) > 0 ? Number(item.actualCost) : Number(item.estimatedCost) || 0;
      categoryTotals.set(item.category, (categoryTotals.get(item.category) || 0) + value);
    });

    const entries = Array.from(categoryTotals.entries())
      .filter(([, val]) => val > 0)
      .map(([name, value]) => ({
        name,
        value,
      }));

    // If no custom items have costs, populate with AI plan breakdown if available
    if (entries.length === 0 && event.aiPlan?.budgetBreakdown) {
      return event.aiPlan.budgetBreakdown.map((cat) => ({
        name: cat.category,
        value: cat.estimatedAmount,
      }));
    }

    return entries;
  }, [budgetItems, event.aiPlan]);

  /**
   * Opens the dialog to add a new budget item.
   */
  const handleOpenAddDialog = (): void => {
    setEditingItemId(null);
    setFormData(initialFormData);
    setFormErrors({});
    setIsDialogOpen(true);
  };

  /**
   * Opens the dialog pre-filled to edit an existing budget line item.
   */
  const handleOpenEditDialog = (item: BudgetItem): void => {
    setEditingItemId(item.id);
    setFormData({
      category: item.category,
      name: item.name,
      estimatedCost: item.estimatedCost.toString(),
      actualCost: item.actualCost.toString(),
      status: item.status,
      notes: item.notes || '',
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  /**
   * Saves a new or edited budget item and propagates changes via onUpdate.
   */
  const handleSaveItem = (e: React.FormEvent): void => {
    e.preventDefault();

    const errors: { name?: string; estimatedCost?: string } = {};
    if (!formData.name.trim()) {
      errors.name = 'Item name is required.';
    }

    const parsedEst = parseFloat(formData.estimatedCost);
    if (isNaN(parsedEst) || parsedEst < 0) {
      errors.estimatedCost = 'Enter a valid estimated cost (e.g. 500).';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const parsedAct = parseFloat(formData.actualCost) || 0;

    let updatedList: BudgetItem[];

    if (editingItemId) {
      updatedList = budgetItems.map((item) =>
        item.id === editingItemId
          ? {
              ...item,
              category: formData.category,
              name: formData.name.trim(),
              estimatedCost: parsedEst,
              actualCost: parsedAct,
              status: formData.status,
              notes: formData.notes.trim(),
            }
          : item
      );
    } else {
      const newItem: BudgetItem = {
        id: generateId(),
        category: formData.category,
        name: formData.name.trim(),
        estimatedCost: parsedEst,
        actualCost: parsedAct,
        status: formData.status,
        notes: formData.notes.trim(),
      };
      updatedList = [...budgetItems, newItem];
    }

    onUpdate({ budgetItems: updatedList });
    setIsDialogOpen(false);
  };

  /**
   * Deletes a budget item by ID.
   */
  const handleDeleteItem = (id: string): void => {
    const updated = budgetItems.filter((item) => item.id !== id);
    onUpdate({ budgetItems: updated });
  };

  /**
   * Quick toggle of item status directly from the table.
   */
  const handleStatusChange = (id: string, newStatus: BudgetItemStatus): void => {
    const updated = budgetItems.map((item) =>
      item.id === id ? { ...item, status: newStatus } : item
    );
    onUpdate({ budgetItems: updated });
  };

  /**
   * Requests strategic AI budget advice from Gemini.
   */
  const handleFetchAIBudgetAdvice = async (): Promise<void> => {
    setIsFetchingAdvice(true);
    setAdviceError(null);

    try {
      const response = await fetch('/api/ai/budget-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate budget advice.');
      }

      setAdviceText(data.advice);
    } catch (err) {
      console.error('[BudgetTab] Error fetching AI advice:', err);
      setAdviceError(err instanceof Error ? err.message : 'Failed to fetch advice.');
    } finally {
      setIsFetchingAdvice(false);
    }
  };

  return (
    <div className="space-y-8" role="region" aria-label="Event Budget Tab">
      {/* Top Financial Summary Cards */}
      <section aria-label="Budget Metrics Summary">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Target Budget */}
          <div className="glass-card p-5 border border-white/60 bg-white/85 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total Budget
              </span>
              <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {formatCurrency(totalBudget)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Preset overall limit</p>
            </div>
          </div>

          {/* Estimated Total */}
          <div className="glass-card p-5 border border-white/60 bg-white/85 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Estimated Total
              </span>
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                <Layers className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {formatCurrency(estimatedTotal)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {totalBudget > 0
                  ? `${Math.round((estimatedTotal / totalBudget) * 100)}% of target planned`
                  : 'Sum of all estimates'}
              </p>
            </div>
          </div>

          {/* Actual Spent */}
          <div className="glass-card p-5 border border-white/60 bg-white/85 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Actual Spent
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {formatCurrency(actualSpent)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {totalBudget > 0
                  ? `${Math.round((actualSpent / totalBudget) * 100)}% paid to date`
                  : 'Total confirmed paid'}
              </p>
            </div>
          </div>

          {/* Remaining Funds */}
          <div className="glass-card p-5 border border-white/60 bg-white/85 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Remaining
              </span>
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center',
                  !isOverBudget ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                )}
              >
                {!isOverBudget ? (
                  <CheckCircle className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                )}
              </div>
            </div>
            <div className="mt-3">
              <div
                className={cn(
                  'text-2xl font-bold tracking-tight',
                  !isOverBudget ? 'text-emerald-700' : 'text-red-600'
                )}
              >
                {formatCurrency(remaining)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {!isOverBudget ? 'Safe unspent cushion' : 'Budget overrun detected!'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Budget Section: Chart and Action Toolbar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recharts Pie Chart Visual Breakdown */}
        <div className="lg:col-span-1 glass-card p-6 border border-white/60 bg-white/85 shadow-sm flex flex-col items-center justify-center min-h-[360px]">
          <div className="w-full text-left mb-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Category Breakdown</h3>
            <p className="text-xs text-gray-500">Visual spending distribution</p>
          </div>

          {mounted && chartData.length > 0 ? (
            <div className="w-full h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PASTEL_PALETTE[index % PASTEL_PALETTE.length]}
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [formatCurrency(val), 'Amount']}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val: string) => (
                      <span className="text-xs text-slate-700 font-medium">{val}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-12 text-center space-y-2">
              <Layers className="w-10 h-10 text-gray-300 mx-auto" aria-hidden="true" />
              <p className="text-xs text-gray-500">Add budget items to view category distribution.</p>
            </div>
          )}
        </div>

        {/* Right Side: Quick Action & Guidance Callout */}
        <div className="lg:col-span-2 glass-card p-6 border border-white/60 bg-white/85 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Expense Tracking
                </h3>
                <p className="text-xs text-gray-500">
                  Manage individual quotes, bookings, and payments
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleFetchAIBudgetAdvice}
                  loading={isFetchingAdvice}
                  aria-label="Request AI budget advice"
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" aria-hidden="true" />
                  <span>AI Budget Advice</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleOpenAddDialog}
                  aria-label="Add budget item"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                  <span>Add Item</span>
                </Button>
              </div>
            </div>

            {/* AI Advice Callout Card */}
            <AnimatePresence>
              {adviceText && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-violet-50/90 via-purple-50/40 to-white border border-violet-200/80 shadow-inner overflow-hidden"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-violet-100">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-600" aria-hidden="true" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-violet-900">
                        Gemini Financial Optimization Advice
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdviceText(null)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                      aria-label="Dismiss AI advice"
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line max-h-60 overflow-y-auto pr-2">
                    {adviceText}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {adviceError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{adviceError}</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>{budgetItems.length} line items recorded</span>
            <span className="font-semibold text-slate-700">
              Allocated: {formatCurrency(actualSpent)}
            </span>
          </div>
        </div>
      </div>

      {/* Budget Items Table */}
      <section aria-label="Budget Items Table" className="glass-card overflow-hidden border border-white/60 shadow-sm">
        <div className="p-4 sm:p-6 pb-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Line Items</h3>
            <p className="text-xs text-gray-500">Itemized ledger of vendor payments and estimated costs</p>
          </div>
        </div>

        {budgetItems.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <DollarSign className="w-10 h-10 text-gray-300 mx-auto" aria-hidden="true" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-800">No budget items added yet</h4>
              <p className="text-xs text-gray-500">
                Track estimated versus actual quotes by adding your first budget line item.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={handleOpenAddDialog}>
              <Plus className="w-4 h-4 mr-1 stroke-[2.5]" aria-hidden="true" />
              <span>Add Budget Item</span>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/70 border-b border-gray-200 text-gray-600 font-semibold uppercase text-[11px] tracking-wider">
                  <th scope="col" className="py-3 px-4">Category</th>
                  <th scope="col" className="py-3 px-4">Item Name</th>
                  <th scope="col" className="py-3 px-4 text-right">Estimated</th>
                  <th scope="col" className="py-3 px-4 text-right">Actual</th>
                  <th scope="col" className="py-3 px-4 text-center">Status</th>
                  <th scope="col" className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {budgetItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-violet-50/30 transition-colors group"
                  >
                    {/* Category */}
                    <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold">
                        {item.category}
                      </span>
                    </td>

                    {/* Name & Notes */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{item.name}</div>
                      {item.notes && (
                        <div className="text-xs text-gray-400 font-normal line-clamp-1 mt-0.5">
                          {item.notes}
                        </div>
                      )}
                    </td>

                    {/* Estimated */}
                    <td className="py-3.5 px-4 text-right text-slate-600 font-medium whitespace-nowrap">
                      {formatCurrency(Number(item.estimatedCost) || 0)}
                    </td>

                    {/* Actual */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(Number(item.actualCost) || 0)}
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="relative inline-block text-left">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value as BudgetItemStatus)}
                          className={cn(
                            'text-xs font-semibold capitalize px-2.5 py-1 rounded-full border appearance-none pr-6 cursor-pointer focus:outline-none focus:ring-1 focus:ring-violet-400',
                            getStatusColor(item.status)
                          )}
                          aria-label={`Change status for ${item.name}`}
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className="w-3 h-3 text-gray-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
                          aria-hidden="true"
                        />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditDialog(item)}
                          className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                          aria-label={`Edit ${item.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add / Edit Budget Item Modal Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingItemId ? 'Edit Budget Item' : 'Add New Budget Item'}
        description="Record expected or actual expenses to track your celebration balance."
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          {/* Category Selection */}
          <div className="space-y-1.5">
            <label htmlFor="budget-category" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Category
            </label>
            <select
              id="budget-category"
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              className="input-field cursor-pointer text-sm"
              aria-label="Select item category"
            >
              {COMMON_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Item Name */}
          <Input
            label="Item Name *"
            placeholder="e.g. Grand Ballroom Rental, DJ System, Bridal Flowers"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            error={formErrors.name}
            required
          />

          {/* Cost Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Estimated Cost ($) *"
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={formData.estimatedCost}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, estimatedCost: e.target.value }))
              }
              error={formErrors.estimatedCost}
              required
            />

            <Input
              label="Actual Cost ($)"
              type="number"
              min="0"
              step="any"
              placeholder="0.00"
              value={formData.actualCost}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, actualCost: e.target.value }))
              }
            />
          </div>

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label htmlFor="budget-status" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Procurement Status
            </label>
            <select
              id="budget-status"
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as BudgetItemStatus,
                }))
              }
              className="input-field cursor-pointer text-sm capitalize"
              aria-label="Select procurement status"
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label htmlFor="budget-notes" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Notes (Optional)
            </label>
            <textarea
              id="budget-notes"
              rows={3}
              placeholder="Vendor terms, payment schedule, or deposit details..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="input-field text-sm resize-none"
            />
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingItemId ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export default BudgetTab;
