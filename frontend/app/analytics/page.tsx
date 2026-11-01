"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api, ProductAnalytics } from "@/lib/api";
import { formatNumber } from "@/lib/utils";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<ProductAnalytics[]>([]);
  const [selectedSku, setSelectedSku] = useState<string>("APP-20241");

  useEffect(() => {
    let isMounted = true;
    api
      .getProductAnalytics()
      .then((data) => {
        if (isMounted) {
          setAnalytics(data);
          if (data.length > 0) {
            setSelectedSku((prev) => prev || data[0]!.sku);
          }
        }
      })
      .catch(console.warn);

    return () => {
      isMounted = false;
    };
  }, []);

  const activeProduct =
    analytics.find((p) => p.sku === selectedSku) || analytics[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#030407] text-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-5 sm:px-8 lg:px-12 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
          <div>
            <span className="text-[13px] font-semibold text-[#D4FF24] block mb-1">
              Demand analytics
            </span>
            <h1 className="text-[28px] sm:text-[38px] font-semibold text-[#F8FAFC] tracking-tight leading-tight">
              Product demand{" "}
              <span className="font-display-serif italic font-normal text-[#D4FF24]">
                variability
              </span>{" "}
              <span className="text-[#3B82F6]">&amp; seasonality</span>
            </h1>
          </div>
          <p className="text-[14px] text-[#94A3B8] max-w-sm">
            Inspect daily sales variability, zero-demand frequency, and day-of-week buying patterns across the catalog.
          </p>
        </div>

        {/* Selected Product Spotlight Card */}
        {activeProduct && (
          <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-6 space-y-6 pedestal-ground-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D4FF24] text-[#030407]">
                    {activeProduct.category}
                  </span>
                  <span className="text-[12px] text-[#94A3B8] tabular-nums">
                    {activeProduct.sku}
                  </span>
                </div>
                <h2 className="text-[20px] font-semibold text-[#F8FAFC] mt-1">
                  {activeProduct.name}
                </h2>
              </div>

              {/* Demand Profile Badge */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[11px] font-medium text-[#94A3B8] block">
                    Demand profile
                  </span>
                  <span className="text-[14px] font-semibold text-[#F8FAFC]">
                    {activeProduct.demand_profile} demand
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[12px] font-semibold tabular-nums ${
                    activeProduct.demand_profile === "Smooth"
                      ? "bg-[#D4FF24]/15 text-[#D4FF24] border border-[#D4FF24]/40"
                      : "bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/40"
                  }`}
                >
                  CV = {activeProduct.cv_variability}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-[14px] bg-[#030407] border border-[#1558C9]/40">
                <span className="text-[12px] font-medium text-[#94A3B8] block">
                  Daily mean demand
                </span>
                <span className="text-[22px] font-semibold text-[#F8FAFC] tabular-nums mt-1 block">
                  {activeProduct.daily_mean} units
                </span>
              </div>

              <div className="p-4 rounded-[14px] bg-[#030407] border border-[#1558C9]/40">
                <span className="text-[12px] font-medium text-[#94A3B8] block">
                  Standard deviation
                </span>
                <span className="text-[22px] font-semibold text-[#60A5FA] tabular-nums mt-1 block">
                  {activeProduct.daily_std} units
                </span>
              </div>

              <div className="p-4 rounded-[14px] bg-[#030407] border border-[#1558C9]/40">
                <span className="text-[12px] font-medium text-[#94A3B8] block">
                  Zero-demand days
                </span>
                <span className="text-[22px] font-semibold text-[#F8FAFC] tabular-nums mt-1 block">
                  {activeProduct.zero_days_pct}%
                </span>
              </div>

              <div className="p-4 rounded-[14px] bg-[#030407] border border-[#1558C9]/40">
                <span className="text-[12px] font-medium text-[#94A3B8] block">
                  Total revenue
                </span>
                <span className="text-[22px] font-semibold text-[#D4FF24] tabular-nums mt-1 block">
                  €{formatNumber(activeProduct.total_revenue, 0)}
                </span>
              </div>
            </div>

            {/* Day of Week Seasonality Bar Chart */}
            <div className="pt-2">
              <h3 className="text-[13px] font-semibold text-[#94A3B8] mb-3">
                Day-of-week seasonality (average daily units)
              </h3>
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activeProduct.weekday_pattern}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255, 255, 255, 0.06)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0]?.payload as
                          | { day: string; avg_demand: number }
                          | undefined;
                        if (!d) return null;
                        return (
                          <div className="bg-[#030407] border border-[#1558C9]/60 text-[#F8FAFC] p-2.5 rounded-[10px] text-[12px] tabular-nums">
                            <span className="font-semibold text-[#D4FF24]">
                              {d.day}:
                            </span>{" "}
                            {d.avg_demand} avg units
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="avg_demand" radius={[6, 6, 0, 0]}>
                      {activeProduct.weekday_pattern.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index >= 4 ? "#D4FF24" : "#1558C9"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Catalog Demand Variability Table */}
        <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-6 overflow-hidden pedestal-ground-shadow">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <h3 className="font-semibold text-[18px] text-[#F8FAFC]">
              Catalog demand variability comparison
            </h3>
            <span className="text-[13px] text-[#94A3B8]">Sorted by revenue</span>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.08] text-[#94A3B8] font-semibold text-[12px]">
                  <th className="py-3">Product</th>
                  <th className="py-3">Category</th>
                  <th className="py-3 text-right">Revenue</th>
                  <th className="py-3 text-right">Daily mean</th>
                  <th className="py-3 text-right">Daily std</th>
                  <th className="py-3 text-right">CV (Std / Mean)</th>
                  <th className="py-3 text-center">Profile</th>
                  <th className="py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {analytics.map((item) => (
                  <tr
                    key={item.sku}
                    className={`hover:bg-[#1558C9]/15 transition-colors cursor-pointer ${
                      item.sku === selectedSku ? "bg-[#1558C9]/20" : ""
                    }`}
                    onClick={() => setSelectedSku(item.sku)}
                  >
                    <td className="py-3.5 text-[#F8FAFC]">
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-[11px] text-[#94A3B8] tabular-nums">
                        {item.sku}
                      </div>
                    </td>
                    <td className="py-3.5 text-[#94A3B8]">{item.category}</td>
                    <td className="py-3.5 text-right font-semibold text-[#D4FF24] tabular-nums">
                      €{formatNumber(item.total_revenue, 0)}
                    </td>
                    <td className="py-3.5 text-right tabular-nums text-[#F8FAFC] font-medium">
                      {item.daily_mean}
                    </td>
                    <td className="py-3.5 text-right tabular-nums text-[#94A3B8]">
                      {item.daily_std}
                    </td>
                    <td className="py-3.5 text-right tabular-nums font-semibold text-[#60A5FA]">
                      {item.cv_variability}
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#030407] border border-[#1558C9]/45 text-[#F8FAFC]">
                        {item.demand_profile}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <span className="text-[13px] font-semibold text-[#D4FF24]">
                        Inspect
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
