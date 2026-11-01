"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api, Product, InventoryItem } from "@/lib/api";

export default function ReportsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSku, setSelectedSku] = useState("APP-20241");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([api.getProducts(), api.getInventoryStatus()])
      .then(([prods, inv]) => {
        if (isMounted) {
          setProducts(prods);
          setInventory(inv);
        }
      })
      .catch(console.warn);

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#030407] text-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-5 sm:px-8 lg:px-12 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
          <div>
            <span className="text-[13px] font-semibold text-[#D4FF24] block mb-1">
              Reports &amp; exports
            </span>
            <h1 className="text-[28px] sm:text-[38px] font-semibold text-[#F8FAFC] tracking-tight leading-tight">
              Forecasting reports{" "}
              <span className="font-display-serif italic font-normal text-[#D4FF24]">
                &amp;
              </span>{" "}
              <span className="text-[#3B82F6]">CSV exports</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center text-[14px] px-4 py-2 rounded-full bg-[#0A0F1D] border border-[#1558C9]/50 text-[#F8FAFC] hover:bg-[#10192E] font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 mr-1.5 text-[#3B82F6]" aria-hidden="true" />
              Print view
            </button>
            <a
              href={api.getPdfReportUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-[14px] px-5 py-2 rounded-full bg-[#D4FF24] text-[#030407] hover:bg-[#E2FF54] font-bold transition-all cursor-pointer lime-glow-button"
            >
              <Download className="w-4 h-4 mr-1.5" aria-hidden="true" />
              Download PDF report
            </a>
          </div>
        </div>

        {/* 2 Export Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: PDF Report */}
          <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-6 space-y-4 flex flex-col justify-between pedestal-ground-shadow">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#1558C9]/25 border border-[#1558C9] text-[#D4FF24] flex items-center justify-center">
                <FileText className="w-5 h-5" aria-hidden="true" />
              </div>
              <h2 className="font-semibold text-[19px] text-[#F8FAFC]">
                Sales forecast &amp; inventory PDF summary
              </h2>
              <p className="text-[14px] text-[#94A3B8] leading-[1.6]">
                Formatted executive summary containing historical sales, multi-step forecast horizons, prediction intervals, and stock replenishment recommendations.
              </p>
              <ul className="space-y-2 text-[13px] text-[#94A3B8] pt-1">
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-[#D4FF24] mr-2 shrink-0" aria-hidden="true" />
                  Historical revenue and unit volumes
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-[#D4FF24] mr-2 shrink-0" aria-hidden="true" />
                  Lead-time demand and safety buffer breakdown
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-[#D4FF24] mr-2 shrink-0" aria-hidden="true" />
                  Chronological holdout evaluation metrics
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-white/[0.08]">
              <a
                href={api.getPdfReportUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-full bg-[#D4FF24] hover:bg-[#E2FF54] text-[#030407] text-[14px] font-bold flex items-center justify-center gap-1.5 transition-all lime-glow-button"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Generate &amp; download PDF</span>
              </a>
            </div>
          </div>

          {/* Card 2: Product Forecast CSV Data Export */}
          <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-6 space-y-4 flex flex-col justify-between pedestal-ground-shadow">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#1558C9]/25 border border-[#1558C9] text-[#60A5FA] flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" aria-hidden="true" />
              </div>
              <h2 className="font-semibold text-[19px] text-[#F8FAFC]">
                Product forecast CSV export
              </h2>
              <p className="text-[14px] text-[#94A3B8] leading-[1.6]">
                Export daily forecast quantities along with 80% and 95% lower and upper bounds for spreadsheet or ERP planning.
              </p>

              <div className="space-y-1.5 pt-1">
                <label
                  htmlFor="report-sku-select"
                  className="text-[12px] font-medium text-[#94A3B8] block"
                >
                  Select product for CSV export:
                </label>
                <select
                  id="report-sku-select"
                  value={selectedSku}
                  onChange={(e) => setSelectedSku(e.target.value)}
                  className="w-full px-3.5 py-2 text-[14px] bg-[#030407] border border-[#1558C9]/50 rounded-[10px] font-semibold text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#D4FF24]"
                >
                  {products.length === 0 ? (
                    <option value={selectedSku} className="bg-[#0A0F1D] text-[#F8FAFC]">
                      Linen Overshirt ({selectedSku})
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
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08]">
              <a
                href={api.getForecastCsvUrl(selectedSku)}
                download
                className="w-full py-2.5 rounded-full bg-[#1558C9] hover:bg-[#1D6AE5] text-[#F8FAFC] text-[14px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Export forecast CSV ({selectedSku})</span>
              </a>
            </div>
          </div>
        </div>

        {/* Live Document Preview Box */}
        <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-6 sm:p-8 space-y-6 pedestal-ground-shadow">
          <div className="border-b border-white/[0.08] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-[12px] font-semibold text-[#D4FF24] block">
                Report preview
              </span>
              <h2 className="text-[20px] font-semibold text-[#F8FAFC] tracking-tight mt-0.5">
                Current stock &amp; replenishment summary
              </h2>
            </div>
            <span className="text-[12px] font-medium text-[#94A3B8] tabular-nums">
              Ref: MERCATO-RPT-2026
            </span>
          </div>

          <p className="text-[14px] text-[#94A3B8] leading-[1.6]">
            <strong className="text-[#F8FAFC] font-semibold">Summary:</strong>{" "}
            Demand forecasts are generated across catalog products using gradient boosting and random forest models evaluated on chronological holdout splits. Required stock combines lead-time demand with safety stock buffers.
          </p>

          <div className="pt-1">
            <h3 className="text-[13px] font-semibold text-[#94A3B8] mb-3">
              Current reorder recommendations
            </h3>
            <div className="overflow-x-auto border border-white/[0.08] rounded-[12px]">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-[#030407] border-b border-white/[0.08]">
                  <tr className="text-[12px] font-semibold text-[#94A3B8]">
                    <th className="p-3">SKU</th>
                    <th className="p-3">Product</th>
                    <th className="p-3 text-right">Available stock</th>
                    <th className="p-3 text-right">Required stock (ROP)</th>
                    <th className="p-3 text-right">Lead-time demand</th>
                    <th className="p-3 text-right">Safety buffer</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Recommended order</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {inventory.slice(0, 6).map((item) => (
                    <tr key={item.sku} className="hover:bg-[#1558C9]/10">
                      <td className="p-3 font-semibold text-[#F8FAFC] tabular-nums">
                        {item.sku}
                      </td>
                      <td className="p-3 font-medium text-[#F8FAFC]">
                        {item.product_name}
                      </td>
                      <td className="p-3 text-right tabular-nums font-semibold text-[#F8FAFC]">
                        {item.current_stock}
                      </td>
                      <td className="p-3 text-right tabular-nums font-semibold text-[#60A5FA]">
                        {item.reorder_point.toFixed(0)}
                      </td>
                      <td className="p-3 text-right tabular-nums text-[#94A3B8]">
                        {item.lead_time_demand.toFixed(0)}
                      </td>
                      <td className="p-3 text-right tabular-nums text-[#94A3B8]">
                        {item.safety_stock.toFixed(0)}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        {item.risk_status === "CRITICAL" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FB7185]/15 text-[#FB7185] border border-[#FB7185]/40 whitespace-nowrap">
                            <AlertCircle className="w-3 h-3" aria-hidden="true" />
                            <span>{item.status_badge}</span>
                          </span>
                        ) : item.risk_status === "REORDER_NOW" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/40 whitespace-nowrap">
                            <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                            <span>{item.status_badge}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#D4FF24]/15 text-[#D4FF24] border border-[#D4FF24]/40 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                            <span>{item.status_badge}</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right tabular-nums font-semibold text-[#D4FF24] whitespace-nowrap">
                        {item.suggested_reorder_qty > 0
                          ? `+${item.suggested_reorder_qty} units`
                          : "0 units"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
