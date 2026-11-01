"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Calendar,
  FileDown,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Plus,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api, ExecutiveOverview, AIBriefing } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { usePurchaseOrder } from "@/lib/purchaseOrderContext";

export default function OverviewPage() {
  const [overview, setOverview] = useState<ExecutiveOverview | null>(null);
  const [briefing, setBriefing] = useState<AIBriefing | null>(null);
  const { items, addToPO, openDrawer } = usePurchaseOrder();

  useEffect(() => {
    let isMounted = true;
    Promise.all([api.getExecutiveOverview(), api.getAIBriefing()])
      .then(([ov, br]) => {
        if (isMounted) {
          setOverview(ov);
          setBriefing(br);
        }
      })
      .catch((err) => {
        console.warn("Overview error:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#030407] text-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-5 sm:px-8 lg:px-12 py-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
          <div>
            <span className="text-[13px] font-semibold text-[#D4FF24] block mb-1">
              Workspace overview
            </span>
            <h1 className="text-[28px] sm:text-[38px] font-semibold text-[#F8FAFC] tracking-tight leading-tight">
              Demand and{" "}
              <span className="font-display-serif italic font-normal text-[#D4FF24]">
                inventory
              </span>{" "}
              <span className="text-[#3B82F6]">summary</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/reports"
              className="inline-flex items-center text-[14px] px-4 py-2 rounded-full bg-[#0A0F1D] border border-[#1558C9]/50 text-[#F8FAFC] hover:bg-[#10192E] font-semibold transition-colors"
            >
              <FileDown className="w-4 h-4 mr-1.5 text-[#3B82F6]" aria-hidden="true" />
              Export PDF report
            </Link>
            <Link
              href="/forecasting"
              className="inline-flex items-center text-[14px] px-5 py-2 rounded-full bg-[#D4FF24] text-[#030407] hover:bg-[#E2FF54] font-bold transition-all lime-glow-button"
            >
              <span>Open forecasting</span>
              <ArrowUpRight className="w-4 h-4 ml-1" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Executive Briefing Banner */}
        {briefing && (
          <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/45 p-5 sm:p-6 pedestal-ground-shadow">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-[15px] text-[#F8FAFC]">
                  Planning summary
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D4FF24] text-[#030407]">
                  {briefing.model_provenance}
                </span>
                <span className="text-[12px] text-[#94A3B8] tabular-nums">
                  Holdout confidence: {(briefing.confidence_level * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[14px] text-[#94A3B8] leading-[1.6]">
                {briefing.narrative}
              </p>
            </div>
          </div>
        )}

        {/* 4 Core KPI Cards */}
        {overview && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {overview.kpis.map((kpi, idx) => (
              <div
                key={idx}
                className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-5 flex flex-col justify-between pedestal-ground-shadow"
              >
                <div>
                  <span className="text-[12px] font-medium text-[#94A3B8]">
                    {kpi.title}
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-[28px] font-semibold text-[#F8FAFC] tabular-nums tracking-tight">
                      {kpi.value}
                    </span>
                    {kpi.delta_pct !== null && kpi.delta_pct !== undefined && (
                      <span className="text-[12px] font-bold text-[#030407] bg-[#D4FF24] px-2 py-0.5 rounded-full tabular-nums">
                        +{kpi.delta_pct}%
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[12px] text-[#94A3B8] mt-3 pt-3 border-t border-white/[0.08]">
                  {kpi.subtitle}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Recent 30-Day Historical Sales Trend Chart */}
        {overview && overview.recent_trend.length > 0 && (
          <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-6 pedestal-ground-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-2">
              <div>
                <h3 className="font-semibold text-[18px] text-[#F8FAFC]">
                  Historical daily sales (past 30 days)
                </h3>
                <p className="text-[13px] text-[#94A3B8]">
                  Recorded catalog revenue prior to forecast cutoff.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#D4FF24]">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                <span>30-day window</span>
              </div>
            </div>

            <div className="w-full h-72 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={overview.recent_trend}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="overviewRevenueGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#1558C9" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#1558C9" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255, 255, 255, 0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v: number) => `€${v}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0]?.payload as
                        | { date: string; quantity: number; revenue: number }
                        | undefined;
                      if (!d) return null;
                      return (
                        <div className="bg-[#030407] text-[#F8FAFC] p-3 rounded-[10px] text-[12px] floating-overlay-shadow border border-[#1558C9]/60">
                          <div className="font-semibold text-[#D4FF24] tabular-nums">
                            {d.date}
                          </div>
                          <div className="mt-1 flex justify-between gap-4">
                            <span className="text-[#94A3B8]">Units sold:</span>
                            <span className="font-semibold text-[#F8FAFC] tabular-nums">
                              {d.quantity} units
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-[#94A3B8]">Revenue:</span>
                            <span className="font-semibold text-[#60A5FA] tabular-nums">
                              €{d.revenue.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="revenue"
                    stroke="#D4FF24"
                    strokeWidth={2.3}
                    fill="url(#overviewRevenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Bottom Section: Category Breakdown + Top Products Leaderboard */}
        {overview && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Category Performance */}
            <div className="lg:col-span-5 bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-6 space-y-4 pedestal-ground-shadow">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <h3 className="font-semibold text-[17px] text-[#F8FAFC]">
                  Category share &amp; volume
                </h3>
                <span className="text-[12px] text-[#94A3B8]">All products</span>
              </div>

              <div className="space-y-3.5">
                {overview.category_breakdown.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="font-medium text-[#F8FAFC]">
                        {cat.category}
                      </span>
                      <div className="space-x-2 tabular-nums">
                        <span className="text-[#94A3B8]">
                          {cat.units_sold} units
                        </span>
                        <span className="font-semibold text-[#D4FF24]">
                          €{formatNumber(cat.revenue, 0)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#030407] border border-white/[0.06] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#1558C9] to-[#D4FF24] rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, cat.share_pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Products Leaderboard */}
            <div className="lg:col-span-7 bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-6 space-y-4 pedestal-ground-shadow">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <h3 className="font-semibold text-[17px] text-[#F8FAFC]">
                  Product catalog &amp; stock status
                </h3>
                <Link
                  href="/inventory"
                  className="text-[13px] font-semibold text-[#D4FF24] hover:text-[#E2FF54] inline-flex items-center"
                >
                  <span>Open inventory</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[#94A3B8] font-semibold text-[12px]">
                      <th className="pb-2.5">Product</th>
                      <th className="pb-2.5">Category</th>
                      <th className="pb-2.5 text-right">Units sold</th>
                      <th className="pb-2.5 text-right">Revenue</th>
                      <th className="pb-2.5 text-center">Status</th>
                      <th className="pb-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {overview.top_products.map((p) => {
                      const isCritical = p.status_badge
                        .toLowerCase()
                        .includes("stockout");
                      const isReorder = p.status_badge
                        .toLowerCase()
                        .includes("reorder");
                      const inDraft = items.some((po) => po.sku === p.sku);

                      return (
                        <tr
                          key={p.sku}
                          className="hover:bg-[#1558C9]/10 transition-colors"
                        >
                          <td className="py-3 font-medium text-[#F8FAFC]">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-[8px] overflow-hidden bg-[#030407] border border-[#1558C9]/45 shrink-0 relative flex items-center justify-center">
                                {p.sku === "APP-20241" ? (
                                  <Image
                                    src="/products/overshirt.png"
                                    alt={p.name}
                                    fill
                                    sizes="32px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <span className="text-[10px] font-bold text-[#D4FF24]">
                                    {p.sku.slice(0, 3)}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-[13px] text-[#F8FAFC]">
                                  {p.name}
                                </div>
                                <span className="text-[11px] text-[#94A3B8] tabular-nums">
                                  {p.sku}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-[#94A3B8]">{p.category}</td>
                          <td className="py-3 text-right tabular-nums font-medium text-[#F8FAFC]">
                            {formatNumber(p.units_sold, 0)}
                          </td>
                          <td className="py-3 text-right tabular-nums font-semibold text-[#D4FF24]">
                            €{formatNumber(p.revenue, 0)}
                          </td>
                          <td className="py-3 text-center whitespace-nowrap">
                            {isCritical ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FB7185]/15 text-[#FB7185] border border-[#FB7185]/40 whitespace-nowrap">
                                <AlertCircle className="w-3 h-3" aria-hidden="true" />
                                <span>{p.status_badge}</span>
                              </span>
                            ) : isReorder ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/40 whitespace-nowrap">
                                <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                                <span>{p.status_badge}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#D4FF24]/15 text-[#D4FF24] border border-[#D4FF24]/40 whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                                <span>{p.status_badge}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {(isCritical || isReorder) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (inDraft) {
                                      openDrawer();
                                      return;
                                    }
                                    addToPO({
                                      sku: p.sku,
                                      name: p.name,
                                      quantity: 80,
                                      costPrice: 50,
                                      leadTimeDays: 21,
                                      warehouseLocation:
                                        "Primary distribution center",
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#D4FF24] hover:bg-[#E2FF54] text-[#030407] text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" aria-hidden="true" />
                                  <span>{inDraft ? "In draft" : "Add to PO"}</span>
                                </button>
                              )}
                              <Link
                                href={`/forecasting?sku=${encodeURIComponent(
                                  p.sku
                                )}`}
                                className="text-[12px] font-semibold text-[#60A5FA] hover:text-[#D4FF24]"
                              >
                                Forecast
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
