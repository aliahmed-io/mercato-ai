"use client";

import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { BalanceComputationResult } from "@/lib/balanceMath";

interface BalanceSummaryProps {
  computation: BalanceComputationResult;
  minimumOrderQty: number;
  isPreviewing: boolean;
  isInPurchaseOrderDraft: boolean;
  onTogglePreview: () => void;
  onResetPreview: () => void;
  onAddToPurchaseOrder: () => void;
  onOpenPurchaseOrderDrawer: () => void;
}

export function BalanceSummary({
  computation,
  minimumOrderQty,
  isPreviewing,
  isInPurchaseOrderDraft,
  onTogglePreview,
  onResetPreview,
  onAddToPurchaseOrder,
  onOpenPurchaseOrderDrawer,
}: BalanceSummaryProps) {
  const {
    shortfallUnits,
    netBalanceUnits,
    recommendedOrderUnits,
  } = computation;

  const projectedShortfallUnits = Math.max(0, -netBalanceUnits);
  const projectedExcessUnits = Math.max(0, netBalanceUnits);
  const hasShortfall = shortfallUnits > 0;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-white/[0.08]">
      {/* Balance Status Readout (Never relies on color alone — pairs icon + explicit text) */}
      <div className="flex items-start sm:items-center gap-3" aria-live="polite">
        {isPreviewing ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4FF24]/15 border border-[#D4FF24]/45 text-[#D4FF24] text-[13px] font-semibold">
            <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="tabular-nums">
              Projected balance:{" "}
              {projectedShortfallUnits > 0
                ? `${projectedShortfallUnits} units shortfall remaining`
                : projectedExcessUnits > 0
                ? `+${projectedExcessUnits} units buffer above requirement (MOQ ${minimumOrderQty})`
                : "Exact equilibrium"}
            </span>
          </div>
        ) : hasShortfall ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FB7185]/15 border border-[#FB7185]/45 text-[#FB7185] text-[13px] font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="tabular-nums">
              Shortfall: {shortfallUnits} units below required stock
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4FF24]/15 border border-[#D4FF24]/40 text-[#D4FF24] text-[13px] font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="tabular-nums">
              Stock covers required demand (+{projectedExcessUnits} units margin)
            </span>
          </div>
        )}
      </div>

      {/* Primary & Secondary Actions */}
      <div className="flex flex-wrap items-center gap-2.5">
        {hasShortfall && !isPreviewing && (
          <button
            type="button"
            onClick={onTogglePreview}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#D4FF24] hover:bg-[#E2FF54] text-[#030407] text-[14px] font-bold transition-all cursor-pointer lime-glow-button"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span className="tabular-nums">
              Preview replenishment (+{recommendedOrderUnits})
            </span>
          </button>
        )}

        {isPreviewing && (
          <button
            type="button"
            onClick={onResetPreview}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#030407] hover:bg-[#10192E] text-[#F8FAFC] border border-[#1558C9]/50 text-[13px] font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#3B82F6]" aria-hidden="true" />
            <span>Reset preview</span>
          </button>
        )}

        {recommendedOrderUnits > 0 && (
          <>
            {isInPurchaseOrderDraft ? (
              <button
                type="button"
                onClick={onOpenPurchaseOrderDrawer}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#1558C9]/25 hover:bg-[#1558C9]/40 text-[#D4FF24] border border-[#1558C9] text-[13px] font-semibold transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                <span>In draft order · View</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onAddToPurchaseOrder}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-bold transition-all cursor-pointer ${
                  isPreviewing
                    ? "bg-[#D4FF24] hover:bg-[#E2FF54] text-[#030407] lime-glow-button"
                    : "bg-[#1558C9] hover:bg-[#1D6AE5] text-[#F8FAFC]"
                }`}
              >
                <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                <span className="tabular-nums">
                  Add to purchase order (+{recommendedOrderUnits})
                </span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
