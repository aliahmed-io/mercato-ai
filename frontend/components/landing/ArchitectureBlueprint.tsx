"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ArchitectureBlueprint() {
  return (
    <div className="space-y-8">
      {/* Section Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <span className="text-[13px] font-semibold text-[#D4FF24] block">
            How it works
          </span>
          <h2 className="text-[28px] sm:text-[40px] font-semibold text-[#F8FAFC] tracking-tight leading-[1.08]">
            From forecast{" "}
            <span className="font-display-serif italic font-normal text-[#D4FF24]">
              to
            </span>{" "}
            <span className="text-[#3B82F6]">purchase order.</span>
          </h2>
          <p className="text-[16px] text-[#94A3B8] leading-[1.6]">
            Three clear steps connect daily sales history to a reviewed supplier purchase order.
          </p>
        </div>

        <Link
          href="/inventory"
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#D4FF24] hover:text-[#E2FF54] transition-colors self-start md:self-end"
        >
          <span>Explore inventory planning</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Three Clear Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step 1: Forecast demand */}
        <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-6 sm:p-7 flex flex-col justify-between space-y-6 pedestal-ground-shadow">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#D4FF24] text-[#030407] text-[13px] font-bold tabular-nums">
                1
              </span>
              <span className="text-[12px] font-medium text-[#94A3B8]">
                7, 14, or 28-day horizon
              </span>
            </div>

            {/* Small Diagram 1: Forecast Curve with Uncertainty Band */}
            <div className="w-full h-32 rounded-[14px] bg-[#030407] border border-[#1558C9]/40 p-3 flex items-center justify-center">
              <svg
                viewBox="0 0 260 90"
                className="w-full h-full overflow-visible"
                aria-hidden="true"
              >
                {/* Baseline Grid */}
                <line x1="16" y1="72" x2="244" y2="72" stroke="#1E293B" strokeWidth="1" />
                <line x1="130" y1="14" x2="130" y2="72" stroke="#1558C9" strokeWidth="1" strokeDasharray="3 3" />

                {/* Translucent Cobalt Confidence Fan */}
                <path
                  d="M 130 46 C 165 40, 200 22, 240 16 L 240 54 C 200 56, 165 52, 130 46 Z"
                  fill="#1558C9"
                  fillOpacity="0.32"
                />

                {/* Historical Demand Line (Electric Cobalt) */}
                <path
                  d="M 20 60 C 48 58, 68 42, 95 50 C 110 54, 120 48, 130 46"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Forecast Demand Line (Acid Lime) */}
                <path
                  d="M 130 46 C 165 44, 200 34, 240 32"
                  fill="none"
                  stroke="#D4FF24"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  strokeLinecap="round"
                />
                <circle cx="130" cy="46" r="3.5" fill="#3B82F6" />
                <circle cx="240" cy="32" r="4" fill="#D4FF24" />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-[20px] font-semibold text-[#F8FAFC] tracking-tight">
                Forecast demand
              </h3>
              <p className="text-[15px] text-[#94A3B8] leading-[1.6]">
                Clean daily sales history and project expected demand across your supplier lead time, including 80% and 95% uncertainty ranges.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-[13px] text-[#94A3B8]">
            <span>Input</span>
            <span className="font-semibold text-[#F8FAFC]">Daily sales &amp; seasonality</span>
          </div>
        </div>

        {/* Step 2: Identify a stock gap */}
        <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-6 sm:p-7 flex flex-col justify-between space-y-6 pedestal-ground-shadow">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#D4FF24] text-[#030407] text-[13px] font-bold tabular-nums">
                2
              </span>
              <span className="text-[12px] font-medium text-[#94A3B8]">
                Lead-time demand + buffer
              </span>
            </div>

            {/* Small Diagram 2: Balance Comparison */}
            <div className="w-full h-32 rounded-[14px] bg-[#030407] border border-[#1558C9]/40 p-3 flex items-center justify-center">
              <svg
                viewBox="0 0 260 90"
                className="w-full h-full overflow-visible"
                aria-hidden="true"
              >
                {/* Pedestal */}
                <path d="M 122 44 L 138 44 L 144 76 L 116 76 Z" fill="#1558C9" />
                <rect x="104" y="74" width="52" height="5" rx="2.5" fill="#F8FAFC" />

                {/* Tilted Beam Showing Shortfall on Right */}
                <g transform="rotate(6 130 42)">
                  <rect x="52" y="39" width="156" height="6" rx="3" fill="#3B82F6" />
                </g>
                <circle cx="130" cy="42" r="6" fill="#D4FF24" stroke="#030407" strokeWidth="1.5" />

                {/* Left Pan (Available) */}
                <g transform="translate(60, 34)">
                  <line x1="0" y1="0" x2="0" y2="24" stroke="#3B82F6" strokeWidth="1.5" />
                  <rect x="-16" y="10" width="32" height="14" rx="3" fill="#D4FF24" />
                  <rect x="-24" y="24" width="48" height="4" rx="2" fill="#F8FAFC" />
                </g>

                {/* Right Pan (Required = Demand + Buffer) */}
                <g transform="translate(200, 50)">
                  <line x1="0" y1="0" x2="0" y2="20" stroke="#3B82F6" strokeWidth="1.5" />
                  <rect x="-16" y="0" width="32" height="20" rx="3" fill="#1558C9" />
                  <rect x="-24" y="20" width="48" height="4" rx="2" fill="#3B82F6" />
                </g>
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-[20px] font-semibold text-[#F8FAFC] tracking-tight">
                Identify a stock gap
              </h3>
              <p className="text-[15px] text-[#94A3B8] leading-[1.6]">
                Compare available warehouse inventory against required lead-time demand plus safety stock to surface shortfalls before stockouts happen.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-[13px] text-[#94A3B8]">
            <span>Calculation</span>
            <span className="font-semibold text-[#D4FF24] tabular-nums">Shortfall = Required − Available</span>
          </div>
        </div>

        {/* Step 3: Review a purchase order */}
        <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-6 sm:p-7 flex flex-col justify-between space-y-6 pedestal-ground-shadow">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#D4FF24] text-[#030407] text-[13px] font-bold tabular-nums">
                3
              </span>
              <span className="text-[12px] font-medium text-[#94A3B8]">
                Supplier draft &amp; export
              </span>
            </div>

            {/* Small Diagram 3: Purchase Order Document Card */}
            <div className="w-full h-32 rounded-[14px] bg-[#030407] border border-[#1558C9]/40 p-3 flex items-center justify-center">
              <svg
                viewBox="0 0 260 90"
                className="w-full h-full overflow-visible"
                aria-hidden="true"
              >
                {/* PO Sheet */}
                <rect
                  x="60"
                  y="10"
                  width="140"
                  height="70"
                  rx="8"
                  fill="#0A0F1D"
                  stroke="#1558C9"
                  strokeWidth="1.5"
                />
                {/* Header bar */}
                <rect x="74" y="22" width="56" height="6" rx="3" fill="#F8FAFC" />
                <rect x="158" y="21" width="28" height="8" rx="4" fill="#D4FF24" />
                {/* Line items */}
                <line x1="74" y1="38" x2="186" y2="38" stroke="#1E293B" strokeWidth="1.5" />
                <rect x="74" y="45" width="68" height="5" rx="2.5" fill="#3B82F6" />
                <rect x="162" y="45" width="24" height="5" rx="2.5" fill="#D4FF24" />
                <rect x="74" y="57" width="52" height="5" rx="2.5" fill="#1558C9" />
                <rect x="162" y="57" width="24" height="5" rx="2.5" fill="#F8FAFC" />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-[20px] font-semibold text-[#F8FAFC] tracking-tight">
                Review a purchase order
              </h3>
              <p className="text-[15px] text-[#94A3B8] leading-[1.6]">
                Preview how proposed order quantities affect your projected balance, adjust quantities for supplier minimums, and export a formatted purchase order summary.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-[13px] text-[#94A3B8]">
            <span>Output</span>
            <span className="font-semibold text-[#F8FAFC]">Reviewed PO draft &amp; export</span>
          </div>
        </div>
      </div>
    </div>
  );
}
