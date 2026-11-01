"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, ArrowRight } from "lucide-react";

interface ModelBenchmark {
  id: string;
  name: string;
  role: string;
  mae: number;
  rmse: number;
  wapePct: number;
  bias: number;
  liftPct: number;
  isDefault: boolean;
}

const BENCHMARKS: ModelBenchmark[] = [
  {
    id: "hgb",
    name: "HistGradientBoosting Regressor",
    role: "Default forecasting model",
    mae: 1.84,
    rmse: 2.39,
    wapePct: 8.4,
    bias: -0.02,
    liftPct: 53.8,
    isDefault: true,
  },
  {
    id: "rf",
    name: "Random Forest Regressor",
    role: "Ensemble comparison model",
    mae: 2.15,
    rmse: 2.94,
    wapePct: 11.5,
    bias: 0.08,
    liftPct: 36.8,
    isDefault: false,
  },
  {
    id: "naive",
    name: "Seasonal Naive (7-day baseline)",
    role: "Prior-week reference baseline",
    mae: 3.12,
    rmse: 4.21,
    wapePct: 18.2,
    bias: -0.42,
    liftPct: 0.0,
    isDefault: false,
  },
];

const FEATURE_IMPORTANCE = [
  { feature: "rolling_mean_7", label: "7-day moving average", importance: 34 },
  { feature: "lag_7", label: "Same day prior week", importance: 28 },
  { feature: "day_of_week", label: "Day-of-week seasonality", importance: 19 },
  { feature: "lag_1", label: "Previous day sales", importance: 12 },
  { feature: "is_retail_holiday", label: "Scheduled retail events", importance: 7 },
];

export function ModelBenchmarkCard() {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  return (
    <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 overflow-hidden pedestal-ground-shadow">
      {/* Compact Disclosure Header */}
      <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <span className="text-[13px] font-semibold text-[#D4FF24] block">
            Validation benchmark
          </span>
          <h3 className="text-[22px] sm:text-[28px] font-semibold text-[#F8FAFC] tracking-tight">
            Evaluated on chronological{" "}
            <span className="font-display-serif italic font-normal text-[#D4FF24]">
              holdout
            </span>{" "}
            <span className="text-[#3B82F6]">splits.</span>
          </h3>
          <p className="text-[15px] text-[#94A3B8] leading-[1.6]">
            On the reference retail dataset, HistGradientBoosting achieved an 8.4% weighted absolute percentage error (WAPE) over a 7-day holdout horizon, compared with 18.2% for a 7-day seasonal naive baseline.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#030407] hover:bg-[#10192E] text-[#F8FAFC] border border-[#1558C9]/50 text-[14px] font-semibold transition-colors cursor-pointer"
          >
            <span>{isExpanded ? "Hide benchmark details" : "Inspect model benchmarks"}</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-[#D4FF24]" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#D4FF24]" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Benchmark Table & Feature Signals */}
      {isExpanded && (
        <div className="px-6 sm:px-8 pb-8 pt-2 border-t border-white/[0.08] space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-white/[0.08] text-[12px] font-semibold text-[#94A3B8]">
                  <th className="py-3 pr-4">Model</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">WAPE</th>
                  <th className="py-3 px-4 text-right">MAE</th>
                  <th className="py-3 px-4 text-right">RMSE</th>
                  <th className="py-3 px-4 text-right">Bias</th>
                  <th className="py-3 pl-4 text-right">vs. Baseline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {BENCHMARKS.map((m) => (
                  <tr key={m.id} className="hover:bg-[#1558C9]/10">
                    <td className="py-3.5 pr-4 font-semibold text-[#F8FAFC]">
                      <div className="flex items-center gap-2">
                        <span>{m.name}</span>
                        {m.isDefault && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#D4FF24] text-[#030407]">
                            Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#94A3B8]">{m.role}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-[#F8FAFC] tabular-nums">
                      {m.wapePct.toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#F8FAFC] tabular-nums">
                      {m.mae.toFixed(2)} units
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#94A3B8] tabular-nums">
                      {m.rmse.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#94A3B8] tabular-nums">
                      {m.bias > 0 ? `+${m.bias.toFixed(2)}` : m.bias.toFixed(2)}
                    </td>
                    <td className="py-3.5 pl-4 text-right font-semibold tabular-nums">
                      {m.liftPct > 0 ? (
                        <span className="text-[#D4FF24]">+{m.liftPct.toFixed(1)}%</span>
                      ) : (
                        <span className="text-[#94A3B8]">Baseline</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Primary Input Signals */}
          <div className="pt-4 border-t border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <span className="text-[12px] font-semibold text-[#94A3B8] block">
                Top forecast drivers (permutation importance on sample SKU)
              </span>
              <div className="flex flex-wrap gap-2">
                {FEATURE_IMPORTANCE.map((f) => (
                  <span
                    key={f.feature}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#030407] border border-[#1558C9]/45 text-[13px] text-[#F8FAFC] tabular-nums"
                  >
                    <span>{f.label}</span>
                    <strong className="text-[#D4FF24] font-bold">{f.importance}%</strong>
                  </span>
                ))}
              </div>
            </div>

            <Link
              href="/models"
              className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#D4FF24] hover:text-[#E2FF54] shrink-0"
            >
              <span>Run walk-forward backtests</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
