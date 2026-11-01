"use client";

import React, { useState, useEffect } from "react";
import { Play, ShieldCheck } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api, ModelBenchmarkItem, BacktestResult, Product } from "@/lib/api";
import { toast } from "sonner";

export default function ModelEvaluationPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSku, setSelectedSku] = useState("APP-20241");
  const [leaderboard, setLeaderboard] = useState<ModelBenchmarkItem[]>([]);
  const [backtest, setBacktest] = useState<BacktestResult | null>(null);
  const [isRunningBacktest, setIsRunningBacktest] = useState(false);

  // Fetch products once on mount with fallback
  useEffect(() => {
    let isMounted = true;
    api
      .getProducts()
      .then((prods) => {
        if (isMounted && prods && prods.length > 0) {
          setProducts(prods);
        }
      })
      .catch(console.warn);

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch leaderboard when selectedSku changes
  useEffect(() => {
    let isMounted = true;
    api
      .getModelLeaderboard(selectedSku)
      .then((lb) => {
        if (isMounted && lb?.leaderboard) {
          setLeaderboard(lb.leaderboard);
        }
      })
      .catch(console.warn);

    return () => {
      isMounted = false;
    };
  }, [selectedSku]);

  const handleRunBacktest = async () => {
    try {
      setIsRunningBacktest(true);
      const res = await api.runBacktest(selectedSku, 3);
      setBacktest(res);
      toast.success(
        "Rolling-origin walk-forward backtest completed across 3 chronological splits."
      );
    } catch {
      toast.error("Backtest failed. Ensure historical data is loaded.");
    } finally {
      setIsRunningBacktest(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#030407] text-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-5 sm:px-8 lg:px-12 py-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
          <div>
            <span className="text-[13px] font-semibold text-[#D4FF24] block mb-1">
              Model evaluation
            </span>
            <h1 className="text-[28px] sm:text-[38px] font-semibold text-[#F8FAFC] tracking-tight leading-tight">
              Chronological holdout{" "}
              <span className="font-display-serif italic font-normal text-[#D4FF24]">
                &amp;
              </span>{" "}
              <span className="text-[#3B82F6]">walk-forward validation</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Select product for model evaluation"
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="min-w-[220px] sm:min-w-[260px] px-4 py-2 text-[14px] font-semibold bg-[#0A0F1D] border border-[#1558C9]/50 rounded-full text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#D4FF24] cursor-pointer"
            >
              {products.length === 0 ? (
                <option value="APP-20241" className="bg-[#0A0F1D] text-[#F8FAFC]">
                  Linen Overshirt (APP-20241)
                </option>
              ) : (
                products.map((p) => (
                  <option
                    key={p.sku}
                    value={p.sku}
                    className="bg-[#0A0F1D] text-[#F8FAFC]"
                  >
                    {p.name} ({p.sku})
                  </option>
                ))
              )}
            </select>

            <button
              type="button"
              onClick={handleRunBacktest}
              disabled={isRunningBacktest}
              className="inline-flex items-center text-[14px] px-5 py-2 rounded-full bg-[#D4FF24] text-[#030407] hover:bg-[#E2FF54] font-bold transition-all cursor-pointer disabled:opacity-50 lime-glow-button"
            >
              <Play
                className={`w-4 h-4 mr-1.5 ${
                  isRunningBacktest ? "animate-spin" : ""
                }`}
                aria-hidden="true"
              />
              {isRunningBacktest
                ? "Running backtest..."
                : "Run walk-forward backtest"}
            </button>
          </div>
        </div>

        {/* Time-Series Validation Methodology Note */}
        <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-5 sm:p-6 space-y-2 pedestal-ground-shadow">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#D4FF24]" aria-hidden="true" />
            <h2 className="font-semibold text-[15px] text-[#F8FAFC]">
              Chronological time-series cross-validation
            </h2>
          </div>
          <p className="text-[14px] text-[#94A3B8] leading-[1.6]">
            Models are evaluated on chronological out-of-sample test partitions. Rolling-origin walk-forward splits expand the training window sequentially so future sales are not mixed into training features.
          </p>
        </div>

        {/* Model Comparison Leaderboard Table */}
        <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-6 overflow-hidden pedestal-ground-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/[0.08] gap-2">
            <div>
              <h3 className="font-semibold text-[18px] text-[#F8FAFC]">
                Model comparison (chronological holdout)
              </h3>
              <p className="text-[13px] text-[#94A3B8]">
                Comparing Seasonal Naive against machine learning models on SKU{" "}
                {selectedSku}.
              </p>
            </div>
            <span className="text-[12px] font-bold px-3 py-1 rounded-full bg-[#D4FF24]/15 text-[#D4FF24] border border-[#D4FF24]/40 self-start sm:self-auto">
              Evaluation horizon: 7 days
            </span>
          </div>

          <div className="overflow-x-auto pt-4">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.08] text-[#94A3B8] font-semibold text-[12px]">
                  <th className="pb-3">Model</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3 text-right">MAE</th>
                  <th className="pb-3 text-right">RMSE</th>
                  <th className="pb-3 text-right">WAPE (%)</th>
                  <th className="pb-3 text-right">Bias (MFE)</th>
                  <th className="pb-3 text-right">vs. Baseline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {leaderboard.map((m) => (
                  <tr
                    key={m.model_id}
                    className="hover:bg-[#1558C9]/10 transition-colors"
                  >
                    <td className="py-3.5 font-semibold text-[#F8FAFC]">
                      {m.model_name}
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          m.is_baseline
                            ? "bg-[#030407] text-[#94A3B8] border border-white/15"
                            : "bg-[#1558C9]/30 text-[#60A5FA] border border-[#1558C9]"
                        }`}
                      >
                        {m.is_baseline ? "Baseline" : "Trained ML"}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-medium tabular-nums text-[#F8FAFC]">
                      {m.mae} units
                    </td>
                    <td className="py-3.5 text-right font-medium tabular-nums text-[#F8FAFC]">
                      {m.rmse} units
                    </td>
                    <td className="py-3.5 text-right font-semibold tabular-nums text-[#D4FF24]">
                      {m.wape_pct}%
                    </td>
                    <td className="py-3.5 text-right tabular-nums text-[#94A3B8]">
                      {m.bias}
                    </td>
                    <td className="py-3.5 text-right font-semibold tabular-nums">
                      {m.is_baseline ? (
                        <span className="text-[#94A3B8]">Reference</span>
                      ) : (
                        <span
                          className={
                            m.lift_vs_baseline_pct >= 0
                              ? "text-[#D4FF24]"
                              : "text-[#FB7185]"
                          }
                        >
                          {m.lift_vs_baseline_pct > 0 ? "+" : ""}
                          {m.lift_vs_baseline_pct}%
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Backtest Walk-Forward Folds Visualization */}
        {backtest && (
          <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-6 space-y-6 pedestal-ground-shadow">
            <div className="pb-4 border-b border-white/[0.08]">
              <h3 className="font-semibold text-[18px] text-[#F8FAFC]">
                Walk-forward folds ({backtest.n_splits} sequential splits)
              </h3>
              <p className="text-[13px] text-[#94A3B8]">
                Sequential evaluation across expanding historical cutoffs.
              </p>
            </div>

            {/* Walk-Forward Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(backtest.summary).map(([modelKey, stats]) => (
                <div
                  key={modelKey}
                  className="p-4 rounded-[14px] bg-[#030407] border border-[#1558C9]/40 space-y-2"
                >
                  <span className="text-[14px] font-semibold text-[#F8FAFC] capitalize">
                    {modelKey.replace(/_/g, " ")}
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[13px] pt-1">
                    <div>
                      <span className="text-[11px] text-[#94A3B8] block">
                        Mean MAE
                      </span>
                      <span className="font-semibold text-[#F8FAFC] tabular-nums">
                        {stats.mean_mae} units
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#94A3B8] block">
                        Mean WAPE
                      </span>
                      <span className="font-semibold text-[#D4FF24] tabular-nums">
                        {stats.mean_wape_pct}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#94A3B8] block">
                        Mean bias
                      </span>
                      <span className="font-semibold text-[#60A5FA] tabular-nums">
                        {stats.mean_bias}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#94A3B8] block">
                        Average lift
                      </span>
                      <span className="font-semibold text-[#D4FF24] tabular-nums">
                        +{stats.mean_lift_pct}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Fold Charts */}
            <div className="space-y-4 pt-2">
              <h4 className="text-[13px] font-semibold text-[#94A3B8]">
                Fold predictions vs. actual demand
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {backtest.folds.map((fold) => {
                  const chartData = fold.actuals.map((act, i) => ({
                    step: `Day ${i + 1}`,
                    actual: act,
                    hist_gradient_boosting:
                      fold.predictions.hist_gradient_boosting?.[i] ?? 0,
                    random_forest: fold.predictions.random_forest?.[i] ?? 0,
                    seasonal_naive: fold.predictions.seasonal_naive?.[i] ?? 0,
                  }));

                  return (
                    <div
                      key={fold.fold}
                      className="p-4 rounded-[14px] border border-[#1558C9]/40 bg-[#030407] space-y-2"
                    >
                      <div className="flex justify-between items-center text-[13px] pb-1.5 border-b border-white/[0.08]">
                        <span className="font-semibold text-[#F8FAFC]">
                          Fold {fold.fold}
                        </span>
                        <span className="text-[11px] text-[#94A3B8] tabular-nums">
                          Origin: {fold.origin_date}
                        </span>
                      </div>
                      <div className="w-full h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="rgba(255, 255, 255, 0.06)"
                            />
                            <XAxis
                              dataKey="step"
                              stroke="#94A3B8"
                              fontSize={10}
                              tickLine={false}
                            />
                            <YAxis
                              stroke="#94A3B8"
                              fontSize={10}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#030407",
                                borderColor: "#1558C9",
                                color: "#F8FAFC",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="actual"
                              stroke="#3B82F6"
                              strokeWidth={2}
                              dot={{ r: 2 }}
                              name="Actual"
                            />
                            <Line
                              type="monotone"
                              dataKey="hist_gradient_boosting"
                              stroke="#D4FF24"
                              strokeWidth={2}
                              strokeDasharray="3 3"
                              dot={{ r: 2 }}
                              name="Gradient Boost"
                            />
                            <Line
                              type="monotone"
                              dataKey="seasonal_naive"
                              stroke="#94A3B8"
                              strokeWidth={1.5}
                              dot={false}
                              name="Naive"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
