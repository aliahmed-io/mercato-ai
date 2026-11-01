"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { ForecastPoint, HistoricalPoint } from "@/lib/api";
import { formatNumber } from "@/lib/utils";

interface SignatureForecastChartProps {
  history: HistoricalPoint[];
  forecastPoints: ForecastPoint[];
  productName: string;
  unitPrice?: number;
  height?: number;
}

interface MergedPoint {
  date: string;
  displayDate: string;
  isForecast: boolean;
  actual?: number;
  predicted?: number;
  lower80?: number;
  upper80?: number;
  lower95?: number;
  upper95?: number;
  band80Diff?: number;
  band95Diff?: number;
}

export function SignatureForecastChart({
  history,
  forecastPoints,
  productName,
  unitPrice = 145,
  height = 380,
}: SignatureForecastChartProps) {
  const [showConfidence, setShowConfidence] = useState<"both" | "95" | "80" | "none">("both");

  const mergedData: MergedPoint[] = [];
  const visibleHistory = history.slice(-45);

  visibleHistory.forEach((h) => {
    mergedData.push({
      date: h.date,
      displayDate: h.date.slice(5),
      isForecast: false,
      actual: h.quantity,
    });
  });

  const lastHistory = visibleHistory[visibleHistory.length - 1];
  const cutoffDate = lastHistory ? lastHistory.date : "";

  forecastPoints.forEach((f, idx) => {
    if (idx === 0 && lastHistory) {
      mergedData[mergedData.length - 1] = {
        ...mergedData[mergedData.length - 1]!,
        predicted: lastHistory.quantity,
        lower80: lastHistory.quantity,
        upper80: lastHistory.quantity,
        lower95: lastHistory.quantity,
        upper95: lastHistory.quantity,
      };
    }

    const low80 = Math.max(0, f.lower_80);
    const up80 = Math.max(low80, f.upper_80);
    const low95 = Math.max(0, f.lower_95);
    const up95 = Math.max(low95, f.upper_95);

    mergedData.push({
      date: f.target_date,
      displayDate: f.target_date.slice(5),
      isForecast: true,
      predicted: f.predicted_quantity,
      lower80: low80,
      upper80: up80,
      band80Diff: Math.max(0, up80 - low80),
      lower95: low95,
      upper95: up95,
      band95Diff: Math.max(0, up95 - low95),
    });
  });

  const totalForecastUnits = forecastPoints.reduce(
    (acc, p) => acc + p.predicted_quantity,
    0
  );
  const totalExpectedRevenue = totalForecastUnits * unitPrice;

  return (
    <div className="w-full bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-5 sm:p-6 pedestal-ground-shadow">
      {/* Header with Title and Interval Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-4">
        <div>
          <h3 className="text-[18px] sm:text-[20px] font-semibold text-[#F8FAFC] tracking-tight">
            {productName}
          </h3>
          <p className="text-[13px] text-[#94A3B8] mt-0.5">
            Historical sales in electric cobalt · Forecast trajectory in acid lime
          </p>
        </div>

        {/* Confidence Band Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[12px] font-medium text-[#94A3B8]">
            Uncertainty band:
          </span>
          <div className="inline-flex bg-[#030407] p-1 rounded-full border border-[#1558C9]/45">
            {(["both", "95", "80", "none"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setShowConfidence(mode)}
                className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-colors cursor-pointer ${
                  showConfidence === mode
                    ? "bg-[#D4FF24] text-[#030407]"
                    : "text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
              >
                {mode === "both" ? "80% & 95%" : mode === "none" ? "Off" : `${mode}%`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full pt-5" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={mergedData}
            margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
          >
            <defs>
              {/* Electric Cobalt Fill under Actual Demand */}
              <linearGradient id="actualCobaltGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1558C9" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#1558C9" stopOpacity={0.0} />
              </linearGradient>
              {/* Translucent Cobalt 95% Uncertainty Band */}
              <linearGradient id="cobaltBand95" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1558C9" stopOpacity={0.26} />
                <stop offset="100%" stopColor="#1558C9" stopOpacity={0.04} />
              </linearGradient>
              {/* Translucent Acid Lime 80% Uncertainty Band */}
              <linearGradient id="limeBand80" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4FF24" stopOpacity={0.24} />
                <stop offset="100%" stopColor="#D4FF24" stopOpacity={0.04} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255, 255, 255, 0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="displayDate"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "rgba(21, 88, 201, 0.4)" }}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "rgba(21, 88, 201, 0.4)" }}
              tickFormatter={(v: number) => `${v}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0]?.payload as MergedPoint | undefined;
                if (!data) return null;

                return (
                  <div className="bg-[#030407] text-[#F8FAFC] p-3.5 rounded-[12px] floating-overlay-shadow border border-[#1558C9]/60 text-[12px] min-w-[205px]">
                    <div className="font-semibold pb-1.5 border-b border-white/10 flex justify-between items-center gap-3">
                      <span className="tabular-nums">{data.date}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          data.isForecast
                            ? "bg-[#D4FF24] text-[#030407]"
                            : "bg-[#1558C9] text-[#F8FAFC]"
                        }`}
                      >
                        {data.isForecast ? "Forecast" : "Actual"}
                      </span>
                    </div>

                    <div className="pt-2 space-y-1">
                      {data.actual !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-[#94A3B8]">Actual demand:</span>
                          <span className="font-semibold tabular-nums text-[#60A5FA]">
                            {data.actual} units
                          </span>
                        </div>
                      )}
                      {data.predicted !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-[#94A3B8]">Forecast demand:</span>
                          <span className="font-semibold tabular-nums text-[#D4FF24]">
                            {data.predicted} units
                          </span>
                        </div>
                      )}
                      {data.lower80 !== undefined &&
                        (showConfidence === "both" || showConfidence === "80") && (
                          <div className="flex justify-between items-center text-[11px] text-[#94A3B8]">
                            <span>80% range:</span>
                            <span className="tabular-nums text-[#F8FAFC]">
                              {data.lower80}–{data.upper80} units
                            </span>
                          </div>
                        )}
                      {data.lower95 !== undefined &&
                        (showConfidence === "both" || showConfidence === "95") && (
                          <div className="flex justify-between items-center text-[11px] text-[#94A3B8]">
                            <span>95% range:</span>
                            <span className="tabular-nums text-[#F8FAFC]">
                              {data.lower95}–{data.upper95} units
                            </span>
                          </div>
                        )}
                      {data.predicted !== undefined && (
                        <div className="pt-1.5 mt-1 border-t border-white/10 flex justify-between text-[11px]">
                          <span className="text-[#94A3B8]">Expected value:</span>
                          <span className="font-semibold tabular-nums text-[#F8FAFC]">
                            €{((data.predicted || 0) * unitPrice).toFixed(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />

            {cutoffDate && (
              <ReferenceLine
                x={cutoffDate.slice(5)}
                stroke="#3B82F6"
                strokeWidth={1.25}
                strokeDasharray="4 4"
                label={{
                  value: "Forecast start",
                  position: "insideTopRight",
                  fill: "#94A3B8",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              />
            )}

            {/* Shaded 95% Uncertainty Band (Electric Cobalt) */}
            {(showConfidence === "both" || showConfidence === "95") && (
              <Area
                type="monotone"
                dataKey="upper95"
                stroke="transparent"
                fill="url(#cobaltBand95)"
                connectNulls
              />
            )}

            {/* Shaded 80% Uncertainty Band (Acid Lime) */}
            {(showConfidence === "both" || showConfidence === "80") && (
              <Area
                type="monotone"
                dataKey="upper80"
                stroke="transparent"
                fill="url(#limeBand80)"
                connectNulls
              />
            )}

            {/* Subtle Fill under Historical Demand */}
            <Area
              type="monotone"
              dataKey="actual"
              stroke="transparent"
              fill="url(#actualCobaltGradient)"
              connectNulls
            />

            {/* Actual Demand in Electric Cobalt (#3B82F6) */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#3B82F6"
              strokeWidth={2.4}
              dot={{ r: 2, fill: "#3B82F6" }}
              activeDot={{ r: 5, fill: "#3B82F6", stroke: "#030407", strokeWidth: 2 }}
              name="Actual demand"
            />

            {/* Forecast Demand in Acid Lime (#D4FF24) */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#D4FF24"
              strokeWidth={2.6}
              strokeDasharray="5 4"
              dot={{ r: 3, fill: "#D4FF24" }}
              activeDot={{ r: 6, fill: "#D4FF24", stroke: "#030407", strokeWidth: 2 }}
              name="Forecast demand"
            />

            <Legend
              verticalAlign="top"
              align="right"
              iconType="plainline"
              wrapperStyle={{ paddingBottom: 12, fontSize: 12, color: "#F8FAFC" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Architectural Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-white/[0.08]">
        <div>
          <span className="text-[12px] text-[#94A3B8] block">
            Forecast volume
          </span>
          <span className="text-[18px] font-semibold tabular-nums text-[#D4FF24]">
            {formatNumber(totalForecastUnits, 0)} units
          </span>
        </div>
        <div className="sm:border-l sm:border-white/[0.08] sm:pl-4">
          <span className="text-[12px] text-[#94A3B8] block">
            Expected revenue
          </span>
          <span className="text-[18px] font-semibold tabular-nums text-[#F8FAFC]">
            €{formatNumber(totalExpectedRevenue, 0)}
          </span>
        </div>
        <div className="sm:border-l sm:border-white/[0.08] sm:pl-4">
          <span className="text-[12px] text-[#94A3B8] block">
            Unit price
          </span>
          <span className="text-[18px] font-semibold tabular-nums text-[#F8FAFC]">
            €{formatNumber(unitPrice, 2)}
          </span>
        </div>
        <div className="sm:border-l sm:border-white/[0.08] sm:pl-4">
          <span className="text-[12px] text-[#94A3B8] block">
            Uncertainty range
          </span>
          <span className="text-[14px] font-medium text-[#60A5FA] inline-flex items-center mt-0.5">
            80% and 95% intervals
          </span>
        </div>
      </div>
    </div>
  );
}
