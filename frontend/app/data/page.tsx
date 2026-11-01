"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Database,
  Info,
  Download,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api, ImportPreviewResult } from "@/lib/api";
import { toast } from "sonner";

export default function DataIngestionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [skuCol, setSkuCol] = useState("StockCode");
  const [dateCol, setDateCol] = useState("InvoiceDate");
  const [qtyCol, setQtyCol] = useState("Quantity");
  const [priceCol, setPriceCol] = useState("UnitPrice");
  const [invoiceCol, setInvoiceCol] = useState("InvoiceNo");

  const [validation, setValidation] = useState<ImportPreviewResult | null>(
    null
  );
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setValidation(null);
    }
  };

  const handleValidate = async () => {
    if (!file) {
      toast.error("Please select a CSV file first.");
      return;
    }

    try {
      setIsValidating(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sku_col", skuCol);
      formData.append("date_col", dateCol);
      formData.append("qty_col", qtyCol);
      formData.append("price_col", priceCol);
      formData.append("invoice_col", invoiceCol);
      const res = await api.previewCsv(formData);
      setValidation(res);
      if (res.detected_columns) {
        if (res.detected_columns.sku && res.detected_columns.sku !== "Not found")
          setSkuCol(res.detected_columns.sku);
        if (
          res.detected_columns.date &&
          res.detected_columns.date !== "Not found"
        )
          setDateCol(res.detected_columns.date);
        if (
          res.detected_columns.quantity &&
          res.detected_columns.quantity !== "Not found"
        )
          setQtyCol(res.detected_columns.quantity);
        if (
          res.detected_columns.price &&
          !res.detected_columns.price.includes("Defaulted") &&
          !res.detected_columns.price.includes("Optional")
        )
          setPriceCol(res.detected_columns.price);
        if (
          res.detected_columns.invoice &&
          !res.detected_columns.invoice.includes("Auto") &&
          !res.detected_columns.invoice.includes("Optional")
        )
          setInvoiceCol(res.detected_columns.invoice);
      }
      if (res.validation_status === "valid") {
        toast.success(
          `Validated ${res.valid_rows} clean sales transactions across ${res.skus_detected} SKUs.`
        );
      } else {
        toast.warning("Validation warnings detected. Review audit summary below.");
      }
    } catch {
      toast.error("CSV validation failed. Check column headers.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!file) return;

    try {
      setIsImporting(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sku_col", skuCol);
      formData.append("date_col", dateCol);
      formData.append("qty_col", qtyCol);
      formData.append("price_col", priceCol);
      formData.append("invoice_col", invoiceCol);

      const res = await api.importCsv(formData);
      toast.success(
        `Imported ${res.imported_transactions} transactions across ${res.products_configured} products.`
      );
      setFile(null);
      setValidation(null);
    } catch {
      toast.error("Import failed. Check server logs.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleSeedBenchmark = async () => {
    try {
      setIsSeeding(true);
      const res = await api.seedBenchmark();
      toast.success(res.message);
    } catch {
      toast.error("Failed to load benchmark dataset.");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#030407] text-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-5 sm:px-8 lg:px-12 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
          <div>
            <span className="text-[13px] font-semibold text-[#D4FF24] block mb-1">
              Data management
            </span>
            <h1 className="text-[28px] sm:text-[38px] font-semibold text-[#F8FAFC] tracking-tight leading-tight">
              Transaction CSV import{" "}
              <span className="font-display-serif italic font-normal text-[#D4FF24]">
                &amp;
              </span>{" "}
              <span className="text-[#3B82F6]">benchmark dataset</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={api.getSampleCsvUrl()}
              download="mercato_sample_retail_transactions.csv"
              className="inline-flex items-center text-[14px] px-4 py-2 rounded-full bg-[#0A0F1D] border border-[#1558C9]/50 text-[#F8FAFC] hover:bg-[#10192E] font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 mr-1.5 text-[#D4FF24]" aria-hidden="true" />
              Download sample CSV
            </a>
          </div>
        </div>

        {/* Benchmark Dataset Reset / Seeding Card */}
        <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/45 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 pedestal-ground-shadow">
          <div className="flex items-start gap-3.5 max-w-2xl">
            <div className="w-10 h-10 rounded-[10px] bg-[#1558C9]/25 border border-[#1558C9] text-[#D4FF24] flex items-center justify-center shrink-0 mt-0.5">
              <Database className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 className="text-[17px] font-semibold text-[#F8FAFC]">
                Load or reset the reference retail dataset
              </h2>
              <p className="text-[14px] text-[#94A3B8] leading-[1.6]">
                Replaces the current local database records with the 8-SKU reference retail catalog, 180 days of daily transaction history, and initial warehouse stock levels. Use this if you want to restore the default workspace state after testing custom CSV imports or stock edits.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSeedBenchmark}
            disabled={isSeeding}
            className="inline-flex items-center text-[14px] px-5 py-2.5 rounded-full bg-[#D4FF24] text-[#030407] hover:bg-[#E2FF54] font-bold transition-all cursor-pointer disabled:opacity-50 shrink-0 self-start md:self-center lime-glow-button"
          >
            <Database className="w-4 h-4 mr-2" aria-hidden="true" />
            {isSeeding ? "Restoring dataset..." : "Restore reference dataset"}
          </button>
        </div>

        {/* Upload & Column Mapping Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* File Upload Box */}
          <div className="lg:col-span-5 bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-6 space-y-5 pedestal-ground-shadow">
            <h3 className="font-semibold text-[18px] text-[#F8FAFC]">
              1. Select retail transactions CSV
            </h3>
            <p className="text-[14px] text-[#94A3B8] leading-[1.6]">
              Upload transaction records (such as Shopify, ERP, or UCI Online Retail exports) to preview and validate before importing.
            </p>

            <div className="border-2 border-dashed border-[#1558C9]/60 hover:border-[#D4FF24] rounded-[14px] p-8 text-center transition-colors bg-[#030407]/70">
              <UploadCloud className="w-10 h-10 text-[#D4FF24] mx-auto mb-3" aria-hidden="true" />
              <label className="cursor-pointer block">
                <span className="text-[14px] font-semibold text-[#D4FF24] hover:underline">
                  Choose a CSV file
                </span>{" "}
                <span className="text-[14px] text-[#94A3B8]">or drag and drop</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {file && (
                <div className="mt-3 inline-flex items-center text-[13px] font-semibold px-3 py-1 rounded-full bg-[#D4FF24]/15 text-[#D4FF24] border border-[#D4FF24]/40">
                  <FileCheck className="w-4 h-4 mr-1.5" aria-hidden="true" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {/* Documented Rules Notice */}
            <div className="p-4 rounded-[12px] bg-[#030407] border border-[#1558C9]/40 text-[13px] space-y-1.5 text-[#94A3B8]">
              <div className="font-semibold text-[#F8FAFC] flex items-center">
                <Info className="w-4 h-4 mr-1.5 text-[#D4FF24]" aria-hidden="true" />
                Automated cleaning steps:
              </div>
              <ul className="list-disc list-inside space-y-1 text-[12px]">
                <li>Cancelled invoices (starting with &apos;C&apos;) and negative quantities are filtered.</li>
                <li>Non-product administrative codes (POST, DOT, M) are excluded.</li>
                <li>Missing values and duplicate rows are removed.</li>
                <li>Daily sales are aggregated onto a continuous calendar.</li>
              </ul>
            </div>
          </div>

          {/* Column Mapping Inputs */}
          <div className="lg:col-span-7 bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-6 space-y-5 pedestal-ground-shadow">
            <h3 className="font-semibold text-[18px] text-[#F8FAFC]">
              2. Map CSV column headers
            </h3>
            <p className="text-[14px] text-[#94A3B8]">
              Match the column names in your CSV file to the required transaction fields.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-medium text-[#94A3B8] block mb-1">
                  Product SKU / Stock code *
                </label>
                <input
                  type="text"
                  value={skuCol}
                  onChange={(e) => setSkuCol(e.target.value)}
                  className="w-full px-3.5 py-2 text-[14px] bg-[#030407] border border-[#1558C9]/50 rounded-[10px] font-medium text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#D4FF24]"
                  placeholder="StockCode or SKU"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#94A3B8] block mb-1">
                  Transaction date *
                </label>
                <input
                  type="text"
                  value={dateCol}
                  onChange={(e) => setDateCol(e.target.value)}
                  className="w-full px-3.5 py-2 text-[14px] bg-[#030407] border border-[#1558C9]/50 rounded-[10px] font-medium text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#D4FF24]"
                  placeholder="InvoiceDate or Date"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#94A3B8] block mb-1">
                  Quantity sold *
                </label>
                <input
                  type="text"
                  value={qtyCol}
                  onChange={(e) => setQtyCol(e.target.value)}
                  className="w-full px-3.5 py-2 text-[14px] bg-[#030407] border border-[#1558C9]/50 rounded-[10px] font-medium text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#D4FF24]"
                  placeholder="Quantity"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#94A3B8] block mb-1">
                  Unit price
                </label>
                <input
                  type="text"
                  value={priceCol}
                  onChange={(e) => setPriceCol(e.target.value)}
                  className="w-full px-3.5 py-2 text-[14px] bg-[#030407] border border-[#1558C9]/50 rounded-[10px] font-medium text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#D4FF24]"
                  placeholder="UnitPrice or Price"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[12px] font-medium text-[#94A3B8] block mb-1">
                  Invoice / Order number
                </label>
                <input
                  type="text"
                  value={invoiceCol}
                  onChange={(e) => setInvoiceCol(e.target.value)}
                  className="w-full px-3.5 py-2 text-[14px] bg-[#030407] border border-[#1558C9]/50 rounded-[10px] font-medium text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#D4FF24]"
                  placeholder="InvoiceNo"
                />
              </div>
            </div>

            {/* Validation & Import Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleValidate}
                disabled={!file || isValidating}
                className="px-5 py-2.5 rounded-full bg-[#1558C9] text-[#F8FAFC] hover:bg-[#1D6AE5] text-[14px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isValidating ? "Validating CSV..." : "Validate CSV structure"}
              </button>

              {validation && validation.validation_status === "valid" && (
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isImporting}
                  className="px-5 py-2.5 rounded-full bg-[#D4FF24] text-[#030407] hover:bg-[#E2FF54] text-[14px] font-bold transition-colors disabled:opacity-50 cursor-pointer lime-glow-button"
                >
                  {isImporting
                    ? "Importing..."
                    : `Import ${validation.valid_rows} records`}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Validation Audit Results Card */}
        {validation && (
          <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-6 space-y-5 pedestal-ground-shadow">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                {validation.validation_status === "valid" ? (
                  <CheckCircle2 className="w-5 h-5 text-[#D4FF24]" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[#FB7185]" aria-hidden="true" />
                )}
                <h3 className="font-semibold text-[18px] text-[#F8FAFC]">
                  Data quality validation report
                </h3>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-[12px] font-bold uppercase ${
                  validation.validation_status === "valid"
                    ? "bg-[#D4FF24]/15 text-[#D4FF24] border border-[#D4FF24]/40"
                    : "bg-[#FB7185]/15 text-[#FB7185] border border-[#FB7185]/40"
                }`}
              >
                {validation.validation_status}
              </span>
            </div>

            {/* Audit Numbers Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-[12px] bg-[#030407] border border-[#1558C9]/40">
                <span className="text-[11px] text-[#94A3B8] block">
                  Raw input rows
                </span>
                <span className="text-[20px] font-semibold text-[#F8FAFC] tabular-nums">
                  {validation.total_raw_rows}
                </span>
              </div>
              <div className="p-3.5 rounded-[12px] bg-[#030407] border border-[#1558C9]/40">
                <span className="text-[11px] text-[#94A3B8] block">
                  Valid transactions
                </span>
                <span className="text-[20px] font-semibold text-[#D4FF24] tabular-nums">
                  {validation.valid_rows}
                </span>
              </div>
              <div className="p-3.5 rounded-[12px] bg-[#030407] border border-[#1558C9]/40">
                <span className="text-[11px] text-[#94A3B8] block">
                  Returns filtered
                </span>
                <span className="text-[20px] font-semibold text-[#FBBF24] tabular-nums">
                  {validation.return_rows_detected}
                </span>
              </div>
              <div className="p-3.5 rounded-[12px] bg-[#030407] border border-[#1558C9]/40">
                <span className="text-[11px] text-[#94A3B8] block">
                  Admin codes filtered
                </span>
                <span className="text-[20px] font-semibold text-[#94A3B8] tabular-nums">
                  {validation.admin_rows_filtered}
                </span>
              </div>
              <div className="p-3.5 rounded-[12px] bg-[#030407] border border-[#1558C9]/40">
                <span className="text-[11px] text-[#94A3B8] block">
                  Unique SKUs
                </span>
                <span className="text-[20px] font-semibold text-[#60A5FA] tabular-nums">
                  {validation.skus_detected}
                </span>
              </div>
            </div>

            {/* Preview Records Table */}
            {validation.preview_rows.length > 0 && (
              <div className="pt-2">
                <h4 className="text-[13px] font-semibold text-[#94A3B8] mb-2">
                  Sample preview (first 5 rows)
                </h4>
                <div className="overflow-x-auto border border-white/[0.08] rounded-[12px]">
                  <table className="w-full text-left text-[13px]">
                    <thead className="bg-[#030407] border-b border-white/[0.08]">
                      <tr className="text-[12px] font-semibold text-[#94A3B8]">
                        <th className="p-3">SKU</th>
                        <th className="p-3">Date</th>
                        <th className="p-3 text-right">Quantity</th>
                        <th className="p-3 text-right">Unit price</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {validation.preview_rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-[#1558C9]/10">
                          <td className="p-3 font-semibold text-[#F8FAFC] tabular-nums">
                            {String(row["sku"])}
                          </td>
                          <td className="p-3 text-[#94A3B8] tabular-nums">
                            {String(row["invoice_date"])}
                          </td>
                          <td className="p-3 text-right tabular-nums font-semibold text-[#D4FF24]">
                            {String(row["quantity"])}
                          </td>
                          <td className="p-3 text-right tabular-nums text-[#94A3B8]">
                            €{Number(row["unit_price"]).toFixed(2)}
                          </td>
                          <td className="p-3 text-right tabular-nums font-semibold text-[#F8FAFC]">
                            €{Number(row["total_amount"]).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
