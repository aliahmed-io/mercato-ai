"use client";

import React from "react";
import Image from "next/image";

export interface DemoProductFixture {
  sku: string;
  name: string;
  category: string;
  thumbnail: string;
  availableUnits: number;
  baseDemandUnits: number;
  bufferUnits: number;
  minimumOrderQty: number;
  unitCost: number;
  leadTimeDays: number;
}

export const DEMO_PRODUCTS: DemoProductFixture[] = [
  {
    sku: "APP-20241",
    name: "Heavyweight Flannel Overshirt",
    category: "Apparel",
    thumbnail: "/products/flannel.png",
    availableUnits: 120,
    baseDemandUnits: 158,
    bufferUnits: 35,
    minimumOrderQty: 80,
    unitCost: 68,
    leadTimeDays: 35,
  },
  {
    sku: "FTW-10892",
    name: "Waterproof Trail Running Shoe",
    category: "Footwear",
    thumbnail: "/products/shoe.png",
    availableUnits: 64,
    baseDemandUnits: 130,
    bufferUnits: 30,
    minimumOrderQty: 100,
    unitCost: 74,
    leadTimeDays: 42,
  },
  {
    sku: "HOM-40502",
    name: "Ceramic Pour-Over Coffee Dripper",
    category: "Home & Living",
    thumbnail: "/products/dripper.png",
    availableUnits: 195,
    baseDemandUnits: 132,
    bufferUnits: 26,
    minimumOrderQty: 60,
    unitCost: 18,
    leadTimeDays: 14,
  },
  {
    sku: "ACC-30118",
    name: "Full-Grain Leather Weekender",
    category: "Accessories",
    thumbnail: "/products/bag.png",
    availableUnits: 42,
    baseDemandUnits: 74,
    bufferUnits: 18,
    minimumOrderQty: 50,
    unitCost: 135,
    leadTimeDays: 45,
  },
];

interface BalanceControlsProps {
  products: DemoProductFixture[];
  selectedProduct: DemoProductFixture;
  onSelectProduct: (sku: string) => void;
  scenarioMultiplier: number;
  onChangeScenario: (multiplier: number) => void;
}

const SCENARIO_PRESETS = [
  { label: "Baseline (1.0×)", value: 1.0 },
  { label: "Seasonal lift (1.2×)", value: 1.2 },
  { label: "Peak campaign (1.4×)", value: 1.4 },
];

export function BalanceControls({
  products,
  selectedProduct,
  onSelectProduct,
  scenarioMultiplier,
  onChangeScenario,
}: BalanceControlsProps) {
  const demandPercentage = Math.round((scenarioMultiplier - 1) * 100);
  const formattedScenarioLabel =
    demandPercentage === 0
      ? "Baseline forecast (0%)"
      : demandPercentage > 0
      ? `+${demandPercentage}% demand surge`
      : `${demandPercentage}% softer demand`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
      {/* Product Selector with Compact Thumbnail */}
      <div className="flex items-center gap-3.5 bg-[#030407]/90 p-3 rounded-[14px] border border-[#1558C9]/45">
        <div className="relative w-12 h-12 rounded-[10px] bg-[#0A0F1D] border border-[#1558C9]/40 overflow-hidden shrink-0">
          <Image
            src={selectedProduct.thumbnail}
            alt={selectedProduct.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <label
            htmlFor="hero-product-selector"
            className="block text-[12px] font-medium text-[#94A3B8] mb-0.5"
          >
            Selected product
          </label>
          <select
            id="hero-product-selector"
            value={selectedProduct.sku}
            onChange={(e) => onSelectProduct(e.target.value)}
            className="w-full bg-[#030407] text-[14px] sm:text-[15px] font-semibold text-[#F8FAFC] truncate focus:outline-none cursor-pointer"
          >
            {products.map((product) => (
              <option
                key={product.sku}
                value={product.sku}
                className="bg-[#0A0F1D] text-[#F8FAFC]"
              >
                {product.name} ({product.sku})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Labeled Demand Scenario Slider */}
      <div className="bg-[#030407]/90 p-3 rounded-[14px] border border-[#1558C9]/45 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="hero-demand-scenario"
            className="text-[12px] font-medium text-[#94A3B8]"
          >
            Demand scenario
          </label>
          <span className="text-[13px] font-semibold text-[#D4FF24] tabular-nums">
            {formattedScenarioLabel}
          </span>
        </div>

        <input
          id="hero-demand-scenario"
          type="range"
          min={0.8}
          max={1.5}
          step={0.05}
          value={scenarioMultiplier}
          onChange={(e) => onChangeScenario( parseFloat(e.target.value) )}
          aria-valuetext={formattedScenarioLabel}
          className="w-full h-2 bg-[#1E293B] rounded-lg appearance-none cursor-pointer accent-[#D4FF24]"
        />

        <div className="flex items-center justify-between gap-1 pt-0.5">
          {SCENARIO_PRESETS.map((preset) => {
            const isSelected =
              Math.abs(scenarioMultiplier - preset.value) < 0.02;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChangeScenario(preset.value)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#1558C9] text-[#F8FAFC] border border-[#3B82F6]"
                    : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.06]"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
