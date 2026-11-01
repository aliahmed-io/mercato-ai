"use client";

import React, { useState } from "react";
import { BalanceScale } from "@/components/landing/BalanceScale";
import {
  BalanceControls,
  DEMO_PRODUCTS,
  DemoProductFixture,
} from "@/components/landing/BalanceControls";
import { BalanceSummary } from "@/components/landing/BalanceSummary";
import { calculateBalanceState } from "@/lib/balanceMath";
import { usePurchaseOrder } from "@/lib/purchaseOrderContext";
import { toast } from "sonner";

export function HeroShowcaseCard() {
  const { items, addToPO, openDrawer } = usePurchaseOrder();

  const [selectedSku, setSelectedSku] = useState<string>(DEMO_PRODUCTS[0]!.sku);
  const [scenarioMultiplier, setScenarioMultiplier] = useState<number>(1.0);
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);

  const selectedProduct: DemoProductFixture =
    DEMO_PRODUCTS.find((p) => p.sku === selectedSku) ?? DEMO_PRODUCTS[0]!;

  const computation = calculateBalanceState({
    availableUnits: selectedProduct.availableUnits,
    baseDemandUnits: selectedProduct.baseDemandUnits,
    bufferUnits: selectedProduct.bufferUnits,
    scenarioMultiplier,
    minimumOrderQty: selectedProduct.minimumOrderQty,
    isPreviewingReplenishment: isPreviewing,
  });

  const isInPurchaseOrderDraft = items.some(
    (item) => item.sku === selectedProduct.sku
  );

  const handleSelectProduct = (sku: string) => {
    setSelectedSku(sku);
  };

  const handleChangeScenario = (multiplier: number) => {
    setScenarioMultiplier(multiplier);
  };

  const handleAddToPurchaseOrder = () => {
    if (computation.recommendedOrderUnits <= 0) return;

    if (isInPurchaseOrderDraft) {
      toast.info(
        `${selectedProduct.name} is already in your purchase order draft.`
      );
      openDrawer();
      return;
    }

    addToPO({
      sku: selectedProduct.sku,
      name: selectedProduct.name,
      quantity: computation.recommendedOrderUnits,
      costPrice: selectedProduct.unitCost,
      leadTimeDays: selectedProduct.leadTimeDays,
      warehouseLocation: "Primary distribution center",
    });
  };

  return (
    <section
      aria-label="Interactive stock and demand balance"
      className="relative w-full max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 pt-5 sm:pt-7 pb-12 sm:pb-16 overflow-x-hidden"
    >
      {/* 1. Centered Two-Line Headline & Supporting Copy Above the Scale */}
      <div className="relative z-10 text-center max-w-3xl mx-auto space-y-2.5 mb-4 sm:mb-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0A0F1D] border border-[#1558C9]/50 text-[12px] font-semibold text-[#D4FF24]">
          <span
            className="w-2 h-2 rounded-full bg-[#D4FF24] shadow-[0_0_8px_#D4FF24]"
            aria-hidden="true"
          />
          <span>Interactive demo</span>
        </div>

        <h1 className="text-[38px] sm:text-[54px] lg:text-[64px] font-semibold text-[#F8FAFC] tracking-[-0.03em] leading-[1.02]">
          Stock and demand.
          <br />
          <span className="font-display-serif italic font-normal text-[#D4FF24] pr-2">
            In
          </span>
          <span className="text-[#3B82F6]">balance.</span>
        </h1>

        <p className="text-[16px] sm:text-[18px] text-[#94A3B8] leading-[1.5]">
          Forecast demand. Plan stock with confidence.
        </p>
      </div>

      {/* 2. Large Suspended Balance Scale (~72% content width on desktop) */}
      <div className="relative z-10 w-full lg:w-[74%] mx-auto">
        <BalanceScale
          availableUnits={computation.availableUnits}
          proposedOrderUnits={computation.recommendedOrderUnits}
          isPreviewing={isPreviewing && computation.recommendedOrderUnits > 0}
          scenarioDemandUnits={computation.scenarioDemandUnits}
          bufferUnits={computation.bufferUnits}
          requiredUnits={computation.requiredUnits}
          angleDegrees={computation.angleDegrees}
        />
      </div>

      {/* 3. Compact Horizontal Control Console Below the Pedestal */}
      <div className="relative z-10 max-w-[840px] mx-auto mt-1 bg-[#0A0F1D]/90 backdrop-blur-xl rounded-[20px] border border-[#1558C9]/45 p-4 sm:p-5 pedestal-ground-shadow space-y-3.5">
        <BalanceControls
          products={DEMO_PRODUCTS}
          selectedProduct={selectedProduct}
          onSelectProduct={handleSelectProduct}
          scenarioMultiplier={scenarioMultiplier}
          onChangeScenario={handleChangeScenario}
        />

        <BalanceSummary
          computation={computation}
          minimumOrderQty={selectedProduct.minimumOrderQty}
          isPreviewing={isPreviewing && computation.recommendedOrderUnits > 0}
          isInPurchaseOrderDraft={isInPurchaseOrderDraft}
          onTogglePreview={() => setIsPreviewing(true)}
          onResetPreview={() => setIsPreviewing(false)}
          onAddToPurchaseOrder={handleAddToPurchaseOrder}
          onOpenPurchaseOrderDrawer={openDrawer}
        />
      </div>
    </section>
  );
}
