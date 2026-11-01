"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Calendar, Tag, Trash2 } from "lucide-react";
import { api, PromotionEvent, CalendarEvent } from "@/lib/api";
import { toast } from "sonner";

interface PromotionPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSku: string;
  onPromotionsUpdated: () => void;
}

export function PromotionPlannerModal({
  isOpen,
  onClose,
  selectedSku,
  onPromotionsUpdated,
}: PromotionPlannerModalProps) {
  const [promotions, setPromotions] = useState<PromotionEvent[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [name, setName] = useState("Autumn Mid-Season Flash Sale");
  const [startDate, setStartDate] = useState("2026-11-01");
  const [endDate, setEndDate] = useState("2026-11-07");
  const [discountPct, setDiscountPct] = useState(25);
  const [liftFactor, setLiftFactor] = useState(1.4);
  const [applyScope, setApplyScope] = useState<"CURRENT" | "ALL">("CURRENT");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    api.getPromotions().then(setPromotions).catch(console.warn);
    api
      .getPromotionalCalendar()
      .then((res) => {
        setCalendarEvents(res.events || []);
      })
      .catch(console.warn);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.createPromotion({
        name,
        start_date: startDate,
        end_date: endDate,
        discount_pct: Number(discountPct),
        expected_lift_factor: Number(liftFactor),
        sku_scope: applyScope === "CURRENT" ? selectedSku : "ALL",
      });
      toast.success(
        `Scheduled promotional campaign: "${name}" (+${Math.round(
          (liftFactor - 1) * 100
        )}% lift)`
      );
      loadData();
      onPromotionsUpdated();
    } catch {
      toast.error("Failed to create promotional event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deletePromotion(id);
      toast.success("Promotional event removed.");
      loadData();
      onPromotionsUpdated();
    } catch {
      toast.error("Failed to remove promotion.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030407]/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-modal-title"
    >
      <div className="bg-[#0A0F1D] text-[#F8FAFC] rounded-[20px] border border-[#1558C9]/60 floating-overlay-shadow max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-[#030407]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#1558C9]/25 border border-[#1558C9] text-[#D4FF24] flex items-center justify-center">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="promo-modal-title"
                className="text-[18px] font-semibold text-[#F8FAFC]"
              >
                Promotional lift &amp; holiday planner
              </h2>
              <p className="text-[13px] text-[#94A3B8]">
                Simulate marketing discounts and retail events on future demand
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close promotion planner"
            className="w-9 h-9 rounded-full text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* New Campaign Form */}
          <form
            onSubmit={handleCreate}
            className="p-5 rounded-[14px] bg-[#030407]/80 border border-[#1558C9]/40 space-y-4"
          >
            <h3 className="text-[13px] font-semibold text-[#D4FF24] flex items-center">
              <Tag className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Schedule demand campaign
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
              <div className="sm:col-span-2">
                <label className="text-[12px] font-medium text-[#94A3B8] block mb-1">
                  Campaign title
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0F1D] border border-[#1558C9]/50 rounded-[10px] font-medium text-[#F8FAFC] focus:ring-2 focus:ring-[#D4FF24] outline-hidden"
                  placeholder="e.g. Black Friday 30% Off"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#94A3B8] block mb-1">
                  Start date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0F1D] border border-[#1558C9]/50 rounded-[10px] font-medium text-[#F8FAFC] focus:ring-2 focus:ring-[#D4FF24] outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#94A3B8] block mb-1">
                  End date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A0F1D] border border-[#1558C9]/50 rounded-[10px] font-medium text-[#F8FAFC] focus:ring-2 focus:ring-[#D4FF24] outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#94A3B8] block mb-1">
                  Discount offered (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={discountPct}
                  onChange={(e) =>
                    setDiscountPct(parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 bg-[#0A0F1D] border border-[#1558C9]/50 rounded-[10px] font-medium text-[#F8FAFC] focus:ring-2 focus:ring-[#D4FF24] outline-hidden tabular-nums"
                  required
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#94A3B8] block mb-1">
                  Expected lift multiplier (e.g. 1.40× = +40%)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="1.0"
                  max="4.0"
                  value={liftFactor}
                  onChange={(e) =>
                    setLiftFactor(parseFloat(e.target.value) || 1.0)
                  }
                  className="w-full px-3 py-2 bg-[#0A0F1D] border border-[#1558C9]/50 rounded-[10px] font-medium text-[#F8FAFC] focus:ring-2 focus:ring-[#D4FF24] outline-hidden tabular-nums"
                  required
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    checked={applyScope === "CURRENT"}
                    onChange={() => setApplyScope("CURRENT")}
                    className="accent-[#D4FF24]"
                  />
                  <span className="font-medium text-[#F8FAFC]">
                    Selected SKU ({selectedSku}) only
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    checked={applyScope === "ALL"}
                    onChange={() => setApplyScope("ALL")}
                    className="accent-[#D4FF24]"
                  />
                  <span className="font-medium text-[#F8FAFC]">
                    Entire product catalog
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-full bg-[#D4FF24] hover:bg-[#E2FF54] text-[#030407] text-[13px] font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Scheduling..." : "Apply promotional lift"}
              </button>
            </div>
          </form>

          {/* Active Merchant Promotions */}
          <div className="space-y-3">
            <h4 className="text-[13px] font-semibold text-[#F8FAFC]">
              Scheduled promotions ({promotions.length})
            </h4>
            {promotions.length === 0 ? (
              <p className="text-[13px] text-[#94A3B8] py-2">
                No active promotional campaigns scheduled. Forecasts use baseline trend and calendar seasonality.
              </p>
            ) : (
              <div className="space-y-2">
                {promotions.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3.5 rounded-[12px] bg-[#030407] border border-[#1558C9]/45 text-[13px]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#F8FAFC]">
                          {p.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#D4FF24]/15 text-[#D4FF24] border border-[#D4FF24]/40 text-[11px] font-bold tabular-nums">
                          +{Math.round((p.expected_lift_factor - 1) * 100)}% lift
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#1558C9]/25 text-[#60A5FA] text-[11px] font-semibold tabular-nums">
                          {p.discount_pct}% off
                        </span>
                      </div>
                      <p className="text-[12px] text-[#94A3B8] mt-0.5 tabular-nums">
                        {p.start_date} to {p.end_date} · Scope: {p.sku_scope}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="text-[#94A3B8] hover:text-[#FB7185] p-1.5 transition-colors cursor-pointer"
                      aria-label={`Remove ${p.name}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Retail Calendar Events */}
          <div className="space-y-3 pt-4 border-t border-white/[0.08]">
            <h4 className="text-[13px] font-semibold text-[#F8FAFC] flex items-center">
              <Calendar className="w-4 h-4 mr-1.5 text-[#D4FF24]" aria-hidden="true" />
              Retail calendar events
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[13px]">
              {calendarEvents
                .filter((e) => e.type === "calendar_holiday")
                .map((e) => (
                  <div
                    key={e.id}
                    className="p-3 rounded-[10px] bg-[#030407] border border-[#1558C9]/40 space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-[#F8FAFC]">
                      <span>{e.name}</span>
                      <span className="text-[#D4FF24] tabular-nums">
                        {e.expected_lift_factor}×
                      </span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] tabular-nums">
                      {e.start_date} – {e.end_date}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
