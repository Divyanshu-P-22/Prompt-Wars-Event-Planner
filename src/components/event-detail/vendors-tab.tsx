'use client';

/**
 * @file vendors-tab.tsx
 * @description Comprehensive Vendor Management tab for CelebrateAI.
 * Displays aggregate vendor statistics, AI vendor category recommendations with booking timeline guidance,
 * interactive vendor cards with status progression, contact details, rating stars,
 * and dialogs for adding and editing vendors.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Sparkles,
  Phone,
  Mail,
  User,
  DollarSign,
  Star,
  CheckCircle,
  Clock,
  Edit2,
  Trash2,
  Lightbulb,
  ChevronDown,
  Building2,
  ExternalLink,
} from 'lucide-react';
import type {
  CelebrateEvent,
  Vendor,
  VendorStatus,
  VendorRecommendation,
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

export interface VendorsTabProps {
  /** The CelebrateEvent entity currently being managed */
  event: CelebrateEvent;
  /** Callback to trigger state and persistence updates on the parent event */
  onUpdate: (updates: Partial<CelebrateEvent>) => void;
}

const VENDOR_CATEGORIES = [
  'Venue',
  'Catering',
  'Photography',
  'Videography',
  'Entertainment & DJ',
  'Decor & Florals',
  'Cake & Desserts',
  'Attire & Styling',
  'Hair & Makeup',
  'Stationery & Signage',
  'Transportation',
  'Officiant',
  'Other',
] as const;

const VENDOR_STATUSES: VendorStatus[] = [
  'researching',
  'contacted',
  'negotiating',
  'booked',
  'paid',
];

interface VendorFormData {
  name: string;
  category: string;
  contact: string;
  email: string;
  phone: string;
  estimatedCost: string;
  status: VendorStatus;
  notes: string;
  rating: number;
}

const initialFormData: VendorFormData = {
  name: '',
  category: 'Venue',
  contact: '',
  email: '',
  phone: '',
  estimatedCost: '',
  status: 'researching',
  notes: '',
  rating: 5,
};

/**
 * VendorsTab component for tracking supplier contracts and AI procurement advice.
 *
 * @param props - VendorsTabProps with event and onUpdate.
 * @returns JSX.Element the rendered vendor management tab.
 */
export function VendorsTab({ event, onUpdate }: VendorsTabProps): React.JSX.Element {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [formData, setFormData] = useState<VendorFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<{ name?: string; estimatedCost?: string }>({});

  const vendors = event.vendors || [];

  // Aggregated Stats
  const totalVendors = vendors.length;
  const bookedCount = vendors.filter(
    (v) => v.status === 'booked' || v.status === 'paid'
  ).length;
  const totalVendorCost = useMemo(
    () => vendors.reduce((sum, v) => sum + (Number(v.estimatedCost) || 0), 0),
    [vendors]
  );

  /**
   * Opens dialog to create a new vendor.
   */
  const handleOpenAddDialog = (presetCategory?: string): void => {
    setEditingVendorId(null);
    setFormData({
      ...initialFormData,
      category: presetCategory || 'Venue',
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  /**
   * Opens dialog prefilled with an existing vendor.
   */
  const handleOpenEditDialog = (vendor: Vendor): void => {
    setEditingVendorId(vendor.id);
    setFormData({
      name: vendor.name,
      category: vendor.category,
      contact: vendor.contact || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      estimatedCost: vendor.estimatedCost.toString(),
      status: vendor.status,
      notes: vendor.notes || '',
      rating: vendor.rating || 5,
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  /**
   * Saves a new or edited vendor.
   */
  const handleSaveVendor = (e: React.FormEvent): void => {
    e.preventDefault();

    const errors: { name?: string; estimatedCost?: string } = {};
    if (!formData.name.trim()) {
      errors.name = 'Vendor name is required.';
    }

    const parsedCost = parseFloat(formData.estimatedCost);
    if (isNaN(parsedCost) || parsedCost < 0) {
      errors.estimatedCost = 'Enter a valid cost amount (e.g. 1500).';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    let updatedList: Vendor[];

    if (editingVendorId) {
      updatedList = vendors.map((v) =>
        v.id === editingVendorId
          ? {
              ...v,
              name: formData.name.trim(),
              category: formData.category,
              contact: formData.contact.trim(),
              email: formData.email.trim(),
              phone: formData.phone.trim(),
              estimatedCost: parsedCost,
              status: formData.status,
              notes: formData.notes.trim(),
              rating: formData.rating,
            }
          : v
      );
    } else {
      const newVendor: Vendor = {
        id: generateId(),
        name: formData.name.trim(),
        category: formData.category,
        contact: formData.contact.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        estimatedCost: parsedCost,
        status: formData.status,
        notes: formData.notes.trim(),
        rating: formData.rating,
      };
      updatedList = [...vendors, newVendor];
    }

    onUpdate({ vendors: updatedList });
    setIsDialogOpen(false);
  };

  /**
   * Deletes a vendor by ID.
   */
  const handleDeleteVendor = (id: string): void => {
    const updated = vendors.filter((v) => v.id !== id);
    onUpdate({ vendors: updated });
  };

  /**
   * Changes a vendor's status directly from the card dropdown.
   */
  const handleStatusChange = (id: string, newStatus: VendorStatus): void => {
    const updated = vendors.map((v) =>
      v.id === id ? { ...v, status: newStatus } : v
    );
    onUpdate({ vendors: updated });
  };

  /**
   * Updates a vendor's rating directly by clicking stars.
   */
  const handleRatingChange = (id: string, newRating: number): void => {
    const updated = vendors.map((v) =>
      v.id === id ? { ...v, rating: newRating } : v
    );
    onUpdate({ vendors: updated });
  };

  return (
    <div className="space-y-8" role="region" aria-label="Event Vendors Tab">
      {/* Top Stats Overview */}
      <section aria-label="Vendor Statistics">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Vendors */}
          <div className="glass-card p-5 border border-white/60 bg-white/85 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total Vendors
              </span>
              <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                <Users className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {totalVendors}
              </div>
              <p className="text-xs text-gray-500 mt-1">Partners currently in pipeline</p>
            </div>
          </div>

          {/* Booked Vendors */}
          <div className="glass-card p-5 border border-white/60 bg-white/85 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Secured / Booked
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-emerald-700 tracking-tight">
                {bookedCount}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {totalVendors > 0
                  ? `${Math.round((bookedCount / totalVendors) * 100)}% contracts finalized`
                  : 'Contracts signed or paid'}
              </p>
            </div>
          </div>

          {/* Total Committed Cost */}
          <div className="glass-card p-5 border border-white/60 bg-white/85 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Total Vendor Cost
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {formatCurrency(totalVendorCost)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Aggregated vendor quotes</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Vendor Recommendations Section */}
      {event.aiPlan?.vendorRecommendations && event.aiPlan.vendorRecommendations.length > 0 && (
        <section
          aria-label="AI Vendor Recommendations"
          className="glass-card p-6 border border-violet-100/90 bg-gradient-to-br from-violet-50/40 via-white to-purple-50/20 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-violet-100/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  AI Vendor Recommendations
                </h3>
                <p className="text-xs text-gray-500">
                  Target budgets, ideal booking windows, and negotiation tips
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenAddDialog()}
              aria-label="Add new vendor"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
              <span>Add Vendor</span>
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.aiPlan.vendorRecommendations.map((rec: VendorRecommendation, index: number) => (
              <div
                key={`rec-${index}`}
                className="p-5 rounded-2xl bg-white/90 border border-violet-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-slate-900 text-base">{rec.category}</h4>
                    <span
                      className={cn(
                        'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border',
                        rec.importance?.toLowerCase() === 'critical'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-violet-50 text-violet-700 border-violet-200'
                      )}
                    >
                      {rec.importance}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-gray-500">Estimated Budget:</span>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(rec.estimatedBudget)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-violet-700 font-medium">
                    <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Book: {rec.bookingTimeline}</span>
                  </div>

                  {rec.tips && rec.tips.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        <Lightbulb className="w-3 h-3 text-amber-500" aria-hidden="true" />
                        <span>Pro Tips</span>
                      </div>
                      <ul className="text-xs text-gray-600 space-y-1 pl-4 list-disc">
                        {rec.tips.map((tip, tipIdx) => (
                          <li key={`tip-${tipIdx}`} className="leading-snug">
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleOpenAddDialog(rec.category)}
                    className="w-full text-xs font-semibold py-2 rounded-xl text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                    <span>Track {rec.category} Vendor</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Vendor List Section */}
      <section aria-label="Active Vendors">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Active Vendors</h3>
            <p className="text-xs text-gray-500">Track contact information, pricing quotes, and status</p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenAddDialog()}
            aria-label="Add new vendor"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            <span>Add Vendor</span>
          </Button>
        </div>

        {vendors.length === 0 ? (
          <div className="glass-card py-16 px-4 text-center space-y-3 mt-4 border border-dashed border-gray-300">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto" aria-hidden="true" />
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-slate-800">No vendors added yet</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Keep all your event caterers, venue coordinators, photographers, and entertainers organized in one place.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenAddDialog()}
            >
              <Plus className="w-4 h-4 mr-1 stroke-[2.5]" aria-hidden="true" />
              <span>Add Your First Vendor</span>
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {vendors.map((vendor) => (
                <motion.div
                  key={vendor.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="glass-card p-5 border border-white/80 bg-white/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header: Name, Category, Edit/Delete */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                          {vendor.category}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 truncate">
                          {vendor.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditDialog(vendor)}
                          className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors cursor-pointer"
                          aria-label={`Edit ${vendor.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVendor(vendor.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          aria-label={`Delete ${vendor.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1" aria-label={`Rating: ${vendor.rating || 5} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingChange(vendor.id, star)}
                          className="text-amber-400 hover:scale-125 transition-transform cursor-pointer"
                          aria-label={`Rate ${star} star`}
                        >
                          <Star
                            className={cn(
                              'w-4 h-4',
                              star <= (vendor.rating || 5)
                                ? 'fill-amber-400 stroke-amber-400'
                                : 'text-gray-300'
                            )}
                            aria-hidden="true"
                          />
                        </button>
                      ))}
                      <span className="text-xs text-gray-400 ml-1">
                        ({vendor.rating || 5}.0)
                      </span>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      {vendor.contact && (
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
                          <span className="truncate">{vendor.contact}</span>
                        </div>
                      )}
                      {vendor.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
                          <a
                            href={`mailto:${vendor.email}`}
                            className="text-violet-600 hover:underline truncate"
                          >
                            {vendor.email}
                          </a>
                        </div>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />
                          <a
                            href={`tel:${vendor.phone}`}
                            className="hover:text-slate-900 truncate"
                          >
                            {vendor.phone}
                          </a>
                        </div>
                      )}
                      {!vendor.contact && !vendor.email && !vendor.phone && (
                        <p className="text-gray-400 italic">No contact information added.</p>
                      )}
                    </div>

                    {/* Notes */}
                    {vendor.notes && (
                      <p className="text-xs text-gray-500 line-clamp-2 italic">
                        &ldquo;{vendor.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Footer: Estimated Cost & Status Dropdown */}
                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] block text-gray-400 uppercase tracking-wider font-semibold">
                        Quote / Cost
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {formatCurrency(Number(vendor.estimatedCost) || 0)}
                      </span>
                    </div>

                    <div className="relative inline-block text-left">
                      <select
                        value={vendor.status}
                        onChange={(e) =>
                          handleStatusChange(vendor.id, e.target.value as VendorStatus)
                        }
                        className={cn(
                          'text-xs font-semibold capitalize px-2.5 py-1.5 rounded-xl border appearance-none pr-6 cursor-pointer focus:outline-none focus:ring-1 focus:ring-violet-400',
                          getStatusColor(vendor.status)
                        )}
                        aria-label={`Change status for ${vendor.name}`}
                      >
                        {VENDOR_STATUSES.map((st) => (
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
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Add / Edit Vendor Modal Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingVendorId ? 'Edit Vendor Details' : 'Add New Vendor'}
        description="Maintain quotes, agreements, contact details, and progress milestones with your vendor."
      >
        <form onSubmit={handleSaveVendor} className="space-y-4">
          <Input
            label="Vendor / Company Name *"
            placeholder="e.g. Skyline Event Hall, Artisan Patisserie, DJ Groove"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            error={formErrors.name}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="vendor-category"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Service Category
              </label>
              <select
                id="vendor-category"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="input-field cursor-pointer text-sm"
                aria-label="Select vendor category"
              >
                {VENDOR_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Contact Person"
              placeholder="e.g. Jessica Miller"
              value={formData.contact}
              onChange={(e) => setFormData((prev) => ({ ...prev, contact: e.target.value }))}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="contact@vendor.com"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="(555) 000-0000"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="vendor-status"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Procurement Status
              </label>
              <select
                id="vendor-status"
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as VendorStatus,
                  }))
                }
                className="input-field cursor-pointer text-sm capitalize"
                aria-label="Select vendor status"
              >
                {VENDOR_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="vendor-rating"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Vendor Rating (1-5 Stars)
              </label>
              <select
                id="vendor-rating"
                value={formData.rating}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    rating: Number(e.target.value),
                  }))
                }
                className="input-field cursor-pointer text-sm"
                aria-label="Select vendor rating"
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} {r === 1 ? 'Star' : 'Stars'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="vendor-notes"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Notes, Deliverables & Contract Specs
            </label>
            <textarea
              id="vendor-notes"
              rows={3}
              placeholder="Payment terms, required deposits, load-in hours, package inclusions..."
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="input-field text-sm resize-none"
            />
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
              {editingVendorId ? 'Save Changes' : 'Add Vendor'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export default VendorsTab;
