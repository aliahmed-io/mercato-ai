"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { SignatureForecastChart } from "@/components/charts/SignatureForecastChart";
import { api, ForecastResponse } from "@/lib/api";

const PREVIEW_SKUS = [
  {
    sku: "APP-20241",
    name: "Heavyweight Flannel Overshirt",
    category: "Apparel",
    price: 145,
    image: "/products/overshirt.png",
  },
  {
    sku: "APP-20242",
    name: "Ribbed Cashmere Beanie",
    category: "Apparel",
    price: 65,
    image: "/products/beanie.png",
  },
  {
    sku: "ACC-30110",
    name: "Full-Grain Leather Tote Bag",
    category: "Accessories",
    price: 280,
    image: "/products/tote.png",
  },
  {
    sku: "HOM-40501",
    name: "Hand-Poured Soy Amber Candle",
    category: "Home & Living",
    price: 38,
    image: "/products/candle.png",
  },
];

export function LandingForecastSandbox() {
  const [selectedSku, setSelectedSku] = useState("APP-20241");
  const [horizon, setHorizon] = useState<7 | 14 | 28>(14);
  const [demandScenario, setDemandScenario] = useState<number>(1.0);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);

  useEffect(() => {
    let isMounted = true;
    api
      .getForecast(selectedSku, horizon)
      .then((data) => {
        if (isMounted) {
          setForecastData(data);
        }
      })
      .catch((err) => {
        console.warn("Forecast sandbox notice:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSku, horizon]);

  const isLoading =
    !forecastData ||
    forecastData.sku !== selectedSku ||
    forecastData.horizon_days !== horizon;

  const currentItem =
    PREVIEW_SKUS.find((s) => s.sku === selectedSku) ?? PREVIEW_SKUS[0]!;

  const displayedPoints =
    forecastData?.points.map((pt) => {
      if (demandScenario === 1.0) return pt;
      const elevated = Math.round(pt.predicted_quantity * demandScenario);
      return {
        ...pt,
        predicted_quantity: elevated,
        lower_80: Math.round(
          (pt.lower_80 ?? pt.predicted_quantity * 0.85) * demandScenario
        ),
        upper_80: Math.round(
          (pt.upper_80 ?? pt.predicted_quantity * 1.15) * demandScenario
        ),
        lower_95: Math.round(
          (pt.lower_95 ?? pt.predicted_quantity * 0.75) * demandScenario
        ),
        upper_95: Math.round(
          (pt.upper_95 ?? pt.predicted_quantity * 1.25) * demandScenario
        ),
      };
    }) || [];

  const totalForecastedUnits = displayedPoints.reduce(
    (sum, p) => sum + p.predicted_quantity,
    0
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left 4 Columns: Compact Explanation & Plain Controls */}
      <div className="lg:col-span-4 space-y-6 bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-6 pedestal-ground-shadow">
        <div className="space-y-2.5">
          <span className="text-[13px] font-semibold text-[#D4FF24] block">
            Understand the demand
          </span>
          <h2 className="text-[28px] sm:text-[38px] font-semibold text-[#F8FAFC] tracking-tight leading-[1.08]">
            See where{" "}
            <span className="font-display-serif italic font-normal text-[#D4FF24]">
              demand
            </span>{" "}
            <span className="text-[#3B82F6]">is heading.</span>
          </h2>
          <p className="text-[15px] text-[#94A3B8] leading-[1.6]">
            Compare recent daily sales against 7, 14, and 28-day forecasts. Shaded bands show the 80% and 95% range of expected demand so you can size safety buffers appropriately.
          </p>
        </div>

        {/* Product Selection List */}
        <div className="space-y-2">
          <label className="block text-[12px] font-medium text-[#94A3B8]">
            Select product
          </label>
          <div className="space-y-1.5">
            {PREVIEW_SKUS.map((item) => {
              const isSelected = item.sku === selectedSku;
              return (
                <button
                  key={item.sku}
                  type="button"
                  onClick={() => setSelectedSku(item.sku)}
                  className={`w-full p-2.5 rounded-[12px] text-left flex items-center gap-3 transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-[#1558C9]/25 border-[#D4FF24] text-[#F8FAFC]"
                      : "bg-[#030407]/70 border-white/[0.06] hover:border-[#1558C9]/50 text-[#94A3B8] hover:text-[#F8FAFC]"
                  }`}
                >
                  <div className="relative w-10 h-10 rounded-[8px] overflow-hidden bg-[#030407] border border-[#1558C9]/40 shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[14px] font-semibold block truncate text-[#F8FAFC]">
                      {item.name}
                    </span>
                    <span className="text-[12px] text-[#94A3B8] tabular-nums">
                      {item.sku} · €{item.price}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Forecast Horizon Switch */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium text-[#94A3B8]">Forecast horizon</span>
            <span className="font-semibold text-[#D4FF24] tabular-nums">
              {horizon} days
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 bg-[#030407] p-1 rounded-full border border-[#1558C9]/40">
            {([7, 14, 28] as const).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizon(h)}
                className={`py-2 rounded-full text-[13px] font-semibold transition-colors cursor-pointer tabular-nums ${
                  horizon === h
                    ? "bg-[#1558C9] text-[#F8FAFC]"
                    : "text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
              >
                {h} days
              </button>
            ))}
          </div>
        </div>

        {/* Demand Scenario Switch */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium text-[#94A3B8]">Demand scenario</span>
            <span className="font-semibold text-[#D4FF24] tabular-nums">
              {demandScenario === 1.0
                ? "Expected"
                : `+${Math.round((demandScenario - 1) * 100)}%`}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 bg-[#030407] p-1 rounded-full border border-[#1558C9]/40">
            {[
              { label: "Baseline", value: 1.0 },
              { label: "+25% promo", value: 1.25 },
              { label: "+60% peak", value: 1.6 },
            ].map((promo) => (
              <button
                key={promo.value}
                type="button"
                onClick={() => setDemandScenario(promo.value)}
                className={`py-2 rounded-full text-[12px] font-bold transition-colors cursor-pointer ${
                  demandScenario === promo.value
                    ? "bg-[#D4FF24] text-[#030407]"
                    : "text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
              >
                {promo.label}
              </button>
            ))}
          </div>
        </div>

        {/* Concise Horizon Total */}
        <div className="pt-4 border-t border-white/[0.08] flex items-baseline justify-between">
          <span className="text-[13px] text-[#94A3B8]">
            Projected {horizon}-day demand
          </span>
          <span className="text-[22px] font-bold text-[#D4FF24] tabular-nums">
            {totalForecastedUnits} units
          </span>
        </div>
      </div>

      {/* Right 8 Columns: Large Forecast Chart */}
      <div className="lg:col-span-8">
        {isLoading ? (
          <div className="h-[480px] w-full bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 flex flex-col items-center justify-center space-y-3">
            <div className="w-6 h-6 rounded-full border-2 border-[#D4FF24] border-t-transparent animate-spin" />
            <span className="text-[14px] text-[#94A3B8]">
              Loading {horizon}-day forecast for {currentItem.name}...
            </span>
          </div>
        ) : (
          <SignatureForecastChart
            history={forecastData?.history || []}
            forecastPoints={displayedPoints}
            productName={currentItem.name}
            unitPrice={currentItem.price}
            height={400}
          />
        )}
      </div>
    </div>
  );
}
