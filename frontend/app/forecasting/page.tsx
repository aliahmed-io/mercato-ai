"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Download, RefreshCw, Sparkles } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SignatureForecastChart } from "@/components/charts/SignatureForecastChart";
import { PromotionPlannerModal } from "@/components/forecasting/PromotionPlannerModal";
import { api, Product, ForecastResponse } from "@/lib/api";
import { toast } from "sonner";

function ForecastingContent() {
  const searchParams = useSearchParams();
  const initialSku = searchParams.get("sku") || "APP-20241";

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSku, setSelectedSku] = useState(initialSku);
  const [modelName, setModelName] = useState("hist_gradient_boosting");
  const [horizonDays, setHorizonDays] = useState(7);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chart" | "table" | "importance">(
    "chart"
  );
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api
      .getProducts()
      .then((data) => {
        if (isMounted) setProducts(data);
      })
      .catch(console.warn);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    api
      .generateForecast(selectedSku, modelName, horizonDays)
      .then((res) => {
        if (isMounted) setForecast(res);
      })
      .catch(() => {
        toast.error("Failed to generate forecast.");
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSku, modelName, horizonDays]);

  const handleRetrain = async () => {
    try {
      setLoading(true);
      const res = await api.generateForecast(
        selectedSku,
        modelName,
        horizonDays
      );
      setForecast(res);
      toast.success(
        `Updated ${horizonDays}-day forecast using ${modelName.replace(/_/g, " ")}`
      );
    } catch {
      toast.error("Failed to update forecast.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#030407] text-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-5 sm:px-8 lg:px-12 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
          <div>
            <span className="text-[13px] font-semibold text-[#D4FF24] block mb-1">
              Demand forecasting
            </span>
            <h1 className="text-[28px] sm:text-[38px] font-semibold text-[#F8FAFC] tracking-tight leading-tight">
              Product demand{" "}
              <span className="font-display-serif italic font-normal text-[#D4FF24]">
                forecast
              </span>{" "}
              <span className="text-[#3B82F6]">&amp; scenarios</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsPromoModalOpen(true)}
              className="inline-flex items-center text-[14px] px-4 py-2 rounded-full bg-[#0A0F1D] border border-[#1558C9]/50 text-[#F8FAFC] hover:bg-[#10192E] font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-[#D4FF24]" aria-hidden="true" />
              Plan promotion
            </button>

            <button
              type="button"
              onClick={handleRetrain}
              disabled={loading}
              className="inline-flex items-center text-[14px] px-4 py-2 rounded-full bg-[#0A0F1D] border border-[#1558C9]/50 hover:bg-[#10192E] text-[#F8FAFC] font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 mr-1.5 ${
                  loading ? "animate-spin text-[#D4FF24]" : "text-[#3B82F6]"
                }`}
                aria-hidden="true"
              />
              Refresh forecast
            </button>

            <a
              href={api.getForecastCsvUrl(selectedSku)}
              download
              className="inline-flex items-center text-[14px] px-5 py-2 rounded-full bg-[#D4FF24] text-[#030407] hover:bg-[#E2FF54] font-bold transition-all cursor-pointer lime-glow-button"
            >
              <Download className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Export CSV
            </a>
          </div>
        </div>

        {/* Studio Controls Bar */}
        <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/45 p-5 pedestal-ground-shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Product Selector */}
            <div className="space-y-1.5">
              <label
                htmlFor="forecast-sku-select"
                className="text-[12px] font-medium text-[#94A3B8] block"
              >
                Product
              </label>
              <select
                id="forecast-sku-select"
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                className="block w-full px-3.5 py-2 text-[14px] font-semibold bg-[#030407] border border-[#1558C9]/50 rounded-[10px] text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#D4FF24] cursor-pointer"
              >
                {products.map((p) => (
                  <option
                    key={p.sku}
                    value={p.sku}
                    className="bg-[#0A0F1D] text-[#F8FAFC]"
                  >
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Model Selector */}
            <div className="space-y-1.5">
              <span className="text-[12px] font-medium text-[#94A3B8] block">
                Forecasting model
              </span>
              <div className="grid grid-cols-3 rounded-full border border-[#1558C9]/45 p-1 bg-[#030407]">
                {[
                  { id: "hist_gradient_boosting", label: "Gradient Boost" },
                  { id: "random_forest", label: "Random Forest" },
                  { id: "seasonal_naive", label: "Seasonal Naive" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModelName(m.id)}
                    className={`px-2.5 py-1.5 text-[12px] font-semibold rounded-full transition-colors cursor-pointer truncate ${
                      modelName === m.id
                        ? "bg-[#1558C9] text-[#F8FAFC]"
                        : "text-[#94A3B8] hover:text-[#F8FAFC]"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Horizon Selector */}
            <div className="space-y-1.5">
              <span className="text-[12px] font-medium text-[#94A3B8] block">
                Forecast horizon
              </span>
              <div className="grid grid-cols-3 rounded-full border border-[#1558C9]/45 p-1 bg-[#030407]">
                {[
                  { days: 7, label: "7 days" },
                  { days: 14, label: "14 days" },
                  { days: 28, label: "28 days" },
                ].map((h) => (
                  <button
                    key={h.days}
                    type="button"
                    onClick={() => setHorizonDays(h.days)}
                    className={`px-3 py-1.5 text-[13px] font-bold rounded-full transition-colors cursor-pointer tabular-nums ${
                      horizonDays === h.days
                        ? "bg-[#D4FF24] text-[#030407]"
                        : "text-[#94A3B8] hover:text-[#F8FAFC]"
                    }`}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Model Evaluation Metrics Strip */}
        {forecast && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-[#0A0F1D] rounded-[16px] border border-[#1558C9]/40 p-4">
              <span className="text-[12px] font-medium text-[#94A3B8] block">
                Mean Abs Error (MAE)
              </span>
              <span className="text-[22px] font-semibold text-[#F8FAFC] tabular-nums mt-1 block">
                {forecast.metrics.mae ?? 0.0}{" "}
                <span className="text-[13px] font-normal text-[#94A3B8]">
                  units
                </span>
              </span>
            </div>

            <div className="bg-[#0A0F1D] rounded-[16px] border border-[#1558C9]/40 p-4">
              <span className="text-[12px] font-medium text-[#94A3B8] block">
                Root Mean Sq (RMSE)
              </span>
              <span className="text-[22px] font-semibold text-[#F8FAFC] tabular-nums mt-1 block">
                {forecast.metrics.rmse ?? 0.0}{" "}
                <span className="text-[13px] font-normal text-[#94A3B8]">
                  units
                </span>
              </span>
            </div>

            <div className="bg-[#0A0F1D] rounded-[16px] border border-[#1558C9]/40 p-4">
              <span className="text-[12px] font-medium text-[#94A3B8] block">
                WAPE
              </span>
              <span className="text-[22px] font-semibold text-[#D4FF24] tabular-nums mt-1 block">
                {forecast.metrics.wape_pct ?? 0.0}%
              </span>
            </div>

            <div className="bg-[#0A0F1D] rounded-[16px] border border-[#1558C9]/40 p-4">
              <span className="text-[12px] font-medium text-[#94A3B8] block">
                Forecast bias
              </span>
              <span className="text-[22px] font-semibold text-[#60A5FA] tabular-nums mt-1 block">
                {forecast.metrics.bias ?? 0.0}
              </span>
            </div>

            <div className="bg-[#0A0F1D] rounded-[16px] border border-[#1558C9]/40 p-4 col-span-2 sm:col-span-1">
              <span className="text-[12px] font-medium text-[#94A3B8] block">
                vs. Baseline
              </span>
              <span className="text-[22px] font-semibold text-[#D4FF24] tabular-nums mt-1 block">
                +{forecast.metrics.lift_vs_baseline_pct ?? 0.0}%
              </span>
            </div>
          </div>
        )}

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
          {[
            { id: "chart", label: "Forecast chart" },
            { id: "table", label: "Daily forecast table" },
            { id: "importance", label: "Feature drivers" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 text-[14px] font-semibold rounded-full transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#D4FF24] text-[#030407]"
                  : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.05]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Signature Chart */}
        {activeTab === "chart" && forecast && (
          <SignatureForecastChart
            history={forecast.history}
            forecastPoints={forecast.points}
            productName={forecast.product_name}
            unitPrice={forecast.summary_stats.unit_price}
            height={440}
          />
        )}

        {/* Tab 2: Forecast Data Table */}
        {activeTab === "table" && forecast && (
          <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-6 overflow-hidden pedestal-ground-shadow">
            <div className="pb-4 border-b border-white/[0.08]">
              <h3 className="font-semibold text-[18px] text-[#F8FAFC]">
                Daily forecast values &amp; uncertainty intervals
              </h3>
              <p className="text-[13px] text-[#94A3B8]">
                Projected demand for {forecast.horizon_days} calendar days with 80% and 95% intervals.
              </p>
            </div>

            <div className="overflow-x-auto pt-4">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-white/[0.08] text-[#94A3B8] font-semibold text-[12px]">
                    <th className="pb-3">Target date</th>
                    <th className="pb-3">SKU</th>
                    <th className="pb-3 text-right">Predicted units</th>
                    <th className="pb-3 text-right">80% interval</th>
                    <th className="pb-3 text-right">95% interval</th>
                    <th className="pb-3 text-right">Expected revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {forecast.points.map((pt, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-[#1558C9]/10 transition-colors"
                    >
                      <td className="py-3 font-semibold text-[#F8FAFC] tabular-nums">
                        {pt.target_date}
                      </td>
                      <td className="py-3 text-[#94A3B8] tabular-nums">
                        {forecast.sku}
                      </td>
                      <td className="py-3 text-right font-semibold text-[#D4FF24] tabular-nums">
                        {pt.predicted_quantity.toFixed(1)}
                      </td>
                      <td className="py-3 text-right tabular-nums text-[#F8FAFC]">
                        {pt.lower_80.toFixed(1)} – {pt.upper_80.toFixed(1)}
                      </td>
                      <td className="py-3 text-right tabular-nums text-[#94A3B8]">
                        {pt.lower_95.toFixed(1)} – {pt.upper_95.toFixed(1)}
                      </td>
                      <td className="py-3 text-right tabular-nums font-semibold text-[#60A5FA]">
                        €
                        {(
                          pt.predicted_quantity *
                          forecast.summary_stats.unit_price
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Feature Importance */}
        {activeTab === "importance" && forecast && (
          <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-6 space-y-4 pedestal-ground-shadow">
            <div className="pb-3 border-b border-white/[0.08]">
              <h3 className="font-semibold text-[18px] text-[#F8FAFC]">
                Feature drivers &amp; lag weights
              </h3>
              <p className="text-[13px] text-[#94A3B8]">
                Relative contribution of historical lag and rolling window features.
              </p>
            </div>

            {Object.keys(forecast.feature_importance).length > 0 ? (
              <div className="space-y-3 pt-2">
                {Object.entries(forecast.feature_importance)
                  .slice(0, 10)
                  .map(([feature, imp]) => (
                    <div key={feature} className="space-y-1.5">
                      <div className="flex justify-between text-[13px]">
                        <span className="font-medium text-[#F8FAFC]">
                          {feature}
                        </span>
                        <span className="font-semibold tabular-nums text-[#D4FF24]">
                          {(imp * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#030407] border border-white/[0.06] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#1558C9] to-[#D4FF24] rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, imp * 250)}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="p-4 rounded-[12px] bg-[#030407] border border-[#1558C9]/40 text-[13px] text-[#94A3B8]">
                Feature importance is computed for tree-based models (Gradient Boosting and Random Forest). The Seasonal Naive baseline repeats the prior week&apos;s demand.
              </div>
            )}
          </div>
        )}

        <PromotionPlannerModal
          isOpen={isPromoModalOpen}
          onClose={() => setIsPromoModalOpen(false)}
          selectedSku={selectedSku}
          onPromotionsUpdated={handleRetrain}
        />
      </main>

      <Footer />
    </div>
  );
}

export default function ForecastingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#030407] text-[#F8FAFC] flex items-center justify-center text-[15px]">
          Loading forecasting workspace...
        </div>
      }
    >
      <ForecastingContent />
    </Suspense>
  );
}
