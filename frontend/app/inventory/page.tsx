"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  ShoppingBag,
  Edit3,
  Check,
  Info,
  AlertCircle,
  AlertTriangle,
  Plus,
  Minus,
  Send,
  Truck,
  Download,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { api, InventoryItem, PurchaseOrder } from "@/lib/api";
import { toast } from "sonner";
import { usePurchaseOrder } from "@/lib/purchaseOrderContext";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [useStochastic, setUseStochastic] = useState(true);
  const [filter, setFilter] = useState<
    "ALL" | "CRITICAL" | "REORDER_NOW" | "SAFE"
  >("ALL");
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editStockVal, setEditStockVal] = useState<number>(0);
  const [editLeadVal, setEditLeadVal] = useState<number>(14);
  const { items: draftItems, addToPO, openDrawer } = usePurchaseOrder();

  const loadData = () => {
    api.getInventoryStatus().then(setItems).catch(console.warn);
    api.getPurchaseOrders().then(setPurchaseOrders).catch(console.warn);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDispatchPO = async (poNumber: string) => {
    try {
      const res = await api.dispatchPurchaseOrder(poNumber);
      setPurchaseOrders((prev) =>
        prev.map((p) => (p.po_number === poNumber ? res : p))
      );
      toast.success(`Purchase order ${poNumber} marked as dispatched.`);
      if (res.mailto_url) {
        const mailLink = document.createElement("a");
        mailLink.href = res.mailto_url;
        mailLink.click();
      }
    } catch {
      toast.error("Failed to dispatch purchase order.");
    }
  };

  const handleReceivePO = async (poNumber: string) => {
    try {
      const res = await api.receivePurchaseOrder(poNumber);
      setPurchaseOrders((prev) =>
        prev.map((p) => (p.po_number === poNumber ? res : p))
      );
      toast.success(
        `Received ${poNumber}. On-hand warehouse stock updated.`
      );
      loadData();
    } catch {
      toast.error("Failed to receive purchase order.");
    }
  };

  const handleStartEdit = (item: InventoryItem) => {
    setEditingSku(item.sku);
    setEditStockVal(item.current_stock);
    setEditLeadVal(item.lead_time_days);
  };

  const handleQuickAdjustStock = async (sku: string, delta: number) => {
    const currentItem = items.find((i) => i.sku === sku);
    if (!currentItem) return;
    const newStock = Math.max(0, currentItem.current_stock + delta);
    try {
      const updated = await api.updateInventoryItem({
        sku,
        current_stock: newStock,
        lead_time_days: currentItem.lead_time_days,
      });
      setItems((prev) => prev.map((i) => (i.sku === sku ? updated : i)));
      toast.success(`Updated ${sku} available stock to ${newStock} units.`);
    } catch {
      toast.error("Failed to update stock.");
    }
  };

  const handleSaveEdit = async (sku: string) => {
    try {
      const updated = await api.updateInventoryItem({
        sku,
        current_stock: editStockVal,
        lead_time_days: editLeadVal,
      });
      setItems((prev) => prev.map((i) => (i.sku === sku ? updated : i)));
      setEditingSku(null);
      toast.success(`Saved stock settings for ${sku}.`);
    } catch {
      toast.error("Failed to save stock settings.");
    }
  };

  const handleRowAddToPO = (item: InventoryItem) => {
    const alreadyInDraft = draftItems.some((d) => d.sku === item.sku);
    if (alreadyInDraft) {
      toast.info(`${item.product_name} is already in your purchase order draft.`);
      openDrawer();
      return;
    }

    const qty =
      item.suggested_reorder_qty > 0 ? item.suggested_reorder_qty : 50;
    addToPO({
      sku: item.sku,
      name: item.product_name,
      quantity: qty,
      costPrice: item.cost_price,
      leadTimeDays: item.lead_time_days,
      warehouseLocation: item.warehouse_location,
    });
  };

  const filteredItems = items.filter((i) => {
    if (filter === "ALL") return true;
    return i.risk_status === filter;
  });

  const criticalCount = items.filter((i) => i.risk_status === "CRITICAL").length;
  const reorderCount = items.filter(
    (i) => i.risk_status === "REORDER_NOW"
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#030407] text-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 max-w-[1280px] mx-auto w-full px-5 sm:px-8 lg:px-12 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
          <div>
            <span className="text-[13px] font-semibold text-[#D4FF24] block mb-1">
              Inventory &amp; purchasing
            </span>
            <h1 className="text-[28px] sm:text-[38px] font-semibold text-[#F8FAFC] tracking-tight leading-tight">
              Compare available stock{" "}
              <span className="font-display-serif italic font-normal text-[#D4FF24]">
                and
              </span>{" "}
              <span className="text-[#3B82F6]">required thresholds</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openDrawer}
              className="inline-flex items-center text-[14px] px-5 py-2.5 rounded-full bg-[#D4FF24] text-[#030407] hover:bg-[#E2FF54] font-bold transition-all cursor-pointer lime-glow-button"
            >
              <ShoppingBag className="w-4 h-4 mr-2" aria-hidden="true" />
              <span>Review purchase order draft ({draftItems.length})</span>
            </button>
          </div>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0A0F1D] p-5 rounded-[20px] border border-[#1558C9]/40 pedestal-ground-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#FB7185]">
                Low stock · Immediate order
              </span>
              <AlertCircle className="w-4 h-4 text-[#FB7185]" aria-hidden="true" />
            </div>
            <div className="text-[30px] font-semibold text-[#F8FAFC] tabular-nums mt-2">
              {criticalCount} SKUs
            </div>
            <p className="text-[13px] text-[#94A3B8] mt-1">
              Available stock is below safety buffer.
            </p>
          </div>

          <div className="bg-[#0A0F1D] p-5 rounded-[20px] border border-[#1558C9]/40 pedestal-ground-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#FBBF24]">
                Below reorder threshold
              </span>
              <AlertTriangle className="w-4 h-4 text-[#FBBF24]" aria-hidden="true" />
            </div>
            <div className="text-[30px] font-semibold text-[#F8FAFC] tabular-nums mt-2">
              {reorderCount} SKUs
            </div>
            <p className="text-[13px] text-[#94A3B8] mt-1">
              Available stock is below required lead-time demand + buffer.
            </p>
          </div>

          <div className="bg-[#0A0F1D] p-5 rounded-[20px] border border-[#1558C9]/40 pedestal-ground-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#D4FF24]">
                In balance
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#D4FF24]" aria-hidden="true" />
            </div>
            <div className="text-[30px] font-semibold text-[#F8FAFC] tabular-nums mt-2">
              {Math.max(0, items.length - criticalCount - reorderCount)} SKUs
            </div>
            <p className="text-[13px] text-[#94A3B8] mt-1">
              Available stock covers lead-time demand and safety buffer.
            </p>
          </div>
        </div>

        {/* Aligned Available vs. Required Inventory Comparison Table */}
        <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 overflow-hidden pedestal-ground-shadow">
          {/* Table Toolbar & Filters */}
          <div className="p-5 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-4 bg-[#030407]/60">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-[#94A3B8]">
                  Status:
                </span>
                <div className="inline-flex rounded-full bg-[#0A0F1D] border border-[#1558C9]/45 p-1 text-[12px] font-semibold">
                  {(["ALL", "CRITICAL", "REORDER_NOW", "SAFE"] as const).map(
                    (mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setFilter(mode)}
                        className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                          filter === mode
                            ? "bg-[#D4FF24] text-[#030407]"
                            : "text-[#94A3B8] hover:text-[#F8FAFC]"
                        }`}
                      >
                        {mode === "ALL"
                          ? "All products"
                          : mode === "CRITICAL"
                          ? "Low stock"
                          : mode === "REORDER_NOW"
                          ? "Reorder needed"
                          : "In balance"}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Buffer Formula Toggle */}
              <div className="flex items-center gap-2 sm:border-l sm:border-white/[0.08] sm:pl-4">
                <span className="text-[13px] font-medium text-[#94A3B8]">
                  Buffer model:
                </span>
                <div className="inline-flex rounded-full bg-[#0A0F1D] border border-[#1558C9]/45 p-1 text-[12px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setUseStochastic(true)}
                    className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                      useStochastic
                        ? "bg-[#1558C9] text-[#F8FAFC]"
                        : "text-[#94A3B8] hover:text-[#F8FAFC]"
                    }`}
                  >
                    Demand + lead-time variance
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseStochastic(false)}
                    className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                      !useStochastic
                        ? "bg-[#1558C9] text-[#F8FAFC]"
                        : "text-[#94A3B8] hover:text-[#F8FAFC]"
                    }`}
                  >
                    Demand variance only
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[13px] text-[#94A3B8] tabular-nums">
              Showing{" "}
              <span className="font-semibold text-[#D4FF24]">
                {filteredItems.length}
              </span>{" "}
              of {items.length} SKUs
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#030407]/40 text-[#94A3B8] font-semibold text-[12px]">
                  <th className="py-3.5 px-5">Product</th>
                  <th className="py-3.5 px-3">Supplier &amp; lead time</th>
                  <th className="py-3.5 px-3 text-right">Available stock</th>
                  <th className="py-3.5 px-3 text-right">Required stock (ROP)</th>
                  <th className="py-3.5 px-3 text-right">Lead-time demand</th>
                  <th className="py-3.5 px-3 text-right">Safety buffer</th>
                  <th className="py-3.5 px-3 text-right">Gap / Excess</th>
                  <th className="py-3.5 px-3 text-center">Stock status</th>
                  <th className="py-3.5 px-3 text-right">Recommended order</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filteredItems.map((item) => {
                  const isEditing = editingSku === item.sku;
                  const isCritical = item.risk_status === "CRITICAL";
                  const isReorder = item.risk_status === "REORDER_NOW";
                  const inDraft = draftItems.some((d) => d.sku === item.sku);

                  const safetyStockVal = Math.round(
                    useStochastic
                      ? item.safety_stock_stochastic ?? item.safety_stock
                      : item.safety_stock_deterministic ?? item.safety_stock
                  );
                  const requiredStockVal = Math.round(
                    useStochastic
                      ? item.reorder_point
                      : item.reorder_point_deterministic ??
                          item.lead_time_demand + safetyStockVal
                  );
                  const gapUnits = item.current_stock - requiredStockVal;

                  return (
                    <tr
                      key={item.sku}
                      className="hover:bg-[#1558C9]/10 transition-colors"
                    >
                      {/* Product */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[10px] overflow-hidden bg-[#030407] border border-[#1558C9]/45 shrink-0 relative flex items-center justify-center">
                            {item.sku === "APP-20241" ? (
                              <Image
                                src="/products/overshirt.png"
                                alt={item.product_name}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-[11px] font-bold text-[#D4FF24]">
                                {item.sku.slice(0, 3)}
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-[#F8FAFC] block">
                              {item.product_name}
                            </span>
                            <span className="text-[12px] text-[#94A3B8] tabular-nums block">
                              {item.sku} · €{item.cost_price.toFixed(2)} unit cost
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Supplier & Lead Time */}
                      <td className="py-3.5 px-3">
                        <span className="font-medium text-[#F8FAFC] block truncate max-w-[150px]">
                          {item.supplier_name ?? "Premier Wholesale Corp"}
                        </span>
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            aria-label={`Lead time days for ${item.product_name}`}
                            value={editLeadVal}
                            onChange={(e) =>
                              setEditLeadVal(parseInt(e.target.value, 10) || 1)
                            }
                            className="w-16 mt-1 px-2 py-0.5 text-right bg-[#030407] border border-[#D4FF24] rounded-[6px] font-semibold text-[12px] text-[#F8FAFC] tabular-nums"
                          />
                        ) : (
                          <span className="text-[12px] text-[#94A3B8] tabular-nums block">
                            {item.lead_time_days}d lead time · {item.warehouse_location}
                          </span>
                        )}
                      </td>

                      {/* Available Stock */}
                      <td className="py-3.5 px-3 text-right tabular-nums">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            aria-label={`Available stock for ${item.product_name}`}
                            value={editStockVal}
                            onChange={(e) =>
                              setEditStockVal(parseInt(e.target.value, 10) || 0)
                            }
                            className="w-16 px-2 py-1 text-right bg-[#030407] border border-[#D4FF24] rounded-[6px] font-semibold text-[12px] text-[#F8FAFC]"
                          />
                        ) : (
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickAdjustStock(item.sku, -10)
                              }
                              className="w-6 h-6 rounded-[6px] bg-[#030407] border border-[#1558C9]/40 hover:bg-[#1558C9]/30 text-[#94A3B8] hover:text-[#F8FAFC] flex items-center justify-center cursor-pointer"
                              aria-label={`Decrease ${item.product_name} stock by 10`}
                            >
                              <Minus className="w-3 h-3" aria-hidden="true" />
                            </button>
                            <span className="font-semibold text-[14px] text-[#F8FAFC] px-1">
                              {item.current_stock}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickAdjustStock(item.sku, 10)
                              }
                              className="w-6 h-6 rounded-[6px] bg-[#030407] border border-[#1558C9]/40 hover:bg-[#1558C9]/30 text-[#94A3B8] hover:text-[#F8FAFC] flex items-center justify-center cursor-pointer"
                              aria-label={`Increase ${item.product_name} stock by 10`}
                            >
                              <Plus className="w-3 h-3" aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Required Stock (ROP) */}
                      <td className="py-3.5 px-3 text-right tabular-nums font-semibold text-[#60A5FA]">
                        {requiredStockVal} units
                      </td>

                      {/* Lead-time Demand */}
                      <td className="py-3.5 px-3 text-right tabular-nums text-[#94A3B8]">
                        {item.lead_time_demand.toFixed(0)} units
                      </td>

                      {/* Safety Buffer */}
                      <td className="py-3.5 px-3 text-right tabular-nums text-[#94A3B8]">
                        {safetyStockVal} units
                      </td>

                      {/* Gap / Excess */}
                      <td className="py-3.5 px-3 text-right tabular-nums font-semibold whitespace-nowrap">
                        {gapUnits < 0 ? (
                          <span className="text-[#FB7185] whitespace-nowrap">{gapUnits} units</span>
                        ) : (
                          <span className="text-[#D4FF24] whitespace-nowrap">+{gapUnits} units</span>
                        )}
                      </td>

                      {/* Accessible Stock Status Badge */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#FB7185]/15 text-[#FB7185] border border-[#FB7185]/40 whitespace-nowrap">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>{item.status_badge}</span>
                          </span>
                        ) : isReorder ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/40 whitespace-nowrap">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>{item.status_badge}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#D4FF24]/15 text-[#D4FF24] border border-[#D4FF24]/40 whitespace-nowrap">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>{item.status_badge}</span>
                          </span>
                        )}
                      </td>

                      {/* Recommended Order */}
                      <td className="py-3.5 px-3 text-right tabular-nums whitespace-nowrap">
                        {item.suggested_reorder_qty > 0 ? (
                          <span className="font-bold text-[#D4FF24] bg-[#D4FF24]/15 border border-[#D4FF24]/35 px-2.5 py-1 rounded-full inline-flex items-center justify-end whitespace-nowrap">
                            +{item.suggested_reorder_qty} units
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {isEditing ? (
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(item.sku)}
                              className="p-2 rounded-full bg-[#D4FF24] text-[#030407] hover:bg-[#E2FF54] transition-colors cursor-pointer"
                              aria-label={`Save changes for ${item.product_name}`}
                            >
                              <Check className="w-4 h-4" aria-hidden="true" />
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRowAddToPO(item)}
                                className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-colors cursor-pointer ${
                                  inDraft
                                    ? "bg-[#1558C9]/30 text-[#D4FF24] border border-[#1558C9]"
                                    : "bg-[#D4FF24] text-[#030407] hover:bg-[#E2FF54]"
                                }`}
                              >
                                {inDraft ? "In draft order" : "Add to PO"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartEdit(item)}
                                className="p-1.5 rounded-full text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.06] transition-colors cursor-pointer"
                                aria-label={`Edit stock and lead time for ${item.product_name}`}
                              >
                                <Edit3 className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Saved Purchase Orders & Receiving Ledger */}
        <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 overflow-hidden pedestal-ground-shadow">
          <div className="p-5 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 bg-[#030407]/60">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-[#1558C9]/25 border border-[#1558C9] text-[#D4FF24] flex items-center justify-center">
                <Truck className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-[17px] font-semibold text-[#F8FAFC]">
                  Saved purchase orders &amp; receiving
                </h2>
                <p className="text-[13px] text-[#94A3B8]">
                  Export PDF purchase orders, send supplier emails, and mark orders received when inventory arrives.
                </p>
              </div>
            </div>
            <div className="text-[13px] text-[#94A3B8] tabular-nums">
              <span className="font-semibold text-[#D4FF24]">
                {purchaseOrders.length}
              </span>{" "}
              orders recorded
            </div>
          </div>

          {purchaseOrders.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-[15px] font-semibold text-[#F8FAFC]">
                No saved purchase orders yet
              </p>
              <p className="text-[13px] text-[#94A3B8] max-w-md mx-auto">
                Add items from the table above to your purchase order draft, then save the order in the drawer.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#030407]/40 text-[#94A3B8] font-semibold text-[12px]">
                    <th className="py-3 px-5">PO number &amp; date</th>
                    <th className="py-3 px-4">Supplier &amp; destination</th>
                    <th className="py-3 px-4 text-right">Quantity</th>
                    <th className="py-3 px-4 text-right">Total cost</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {purchaseOrders.map((po) => {
                    const isDraft = po.status === "DRAFT";
                    const isDispatched = po.status === "DISPATCHED";
                    const isReceived = po.status === "RECEIVED";

                    return (
                      <tr
                        key={po.id}
                        className="hover:bg-[#1558C9]/10 transition-colors"
                      >
                        <td className="py-3.5 px-5">
                          <span className="font-semibold text-[#F8FAFC] tabular-nums block">
                            {po.po_number}
                          </span>
                          <span className="text-[12px] text-[#94A3B8] tabular-nums block">
                            Created {new Date(po.created_at).toLocaleDateString()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-[#F8FAFC] block">
                            {po.supplier_name}
                          </span>
                          <span className="text-[12px] text-[#94A3B8] block">
                            {po.supplier_email} · {po.warehouse_location}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right tabular-nums">
                          <span className="font-semibold text-[#F8FAFC] block">
                            {po.total_units} units
                          </span>
                          <span className="text-[12px] text-[#94A3B8] block">
                            {po.items.length} items
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-[#D4FF24]">
                          €{po.total_cost.toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold ${
                              isDraft
                                ? "bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/40"
                                : isDispatched
                                ? "bg-[#1558C9]/25 text-[#60A5FA] border border-[#1558C9]"
                                : "bg-[#D4FF24]/15 text-[#D4FF24] border border-[#D4FF24]/40"
                            }`}
                          >
                            {isReceived && (
                              <CheckCircle2
                                className="w-3.5 h-3.5 mr-1"
                                aria-hidden="true"
                              />
                            )}
                            {isDispatched && (
                              <Send
                                className="w-3.5 h-3.5 mr-1"
                                aria-hidden="true"
                              />
                            )}
                            {po.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            {isDraft && (
                              <button
                                type="button"
                                onClick={() => handleDispatchPO(po.po_number)}
                                className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#D4FF24] text-[#030407] hover:bg-[#E2FF54] text-[12px] font-bold transition-colors cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                                <span>Send to supplier</span>
                              </button>
                            )}

                            {isDispatched && (
                              <button
                                type="button"
                                onClick={() => handleReceivePO(po.po_number)}
                                className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#1558C9] text-[#F8FAFC] hover:bg-[#1D6AE5] text-[12px] font-semibold transition-colors cursor-pointer"
                              >
                                <Truck className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                                <span>Mark received &amp; restock</span>
                              </button>
                            )}

                            {isReceived && (
                              <span className="text-[12px] font-semibold text-[#D4FF24] bg-[#D4FF24]/15 border border-[#D4FF24]/35 px-2.5 py-1 rounded-full inline-flex items-center">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                                Stock updated
                              </span>
                            )}

                            <a
                              href={api.getPoPdfUrl(po.po_number)}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Download PDF for ${po.po_number}`}
                              className="p-2 rounded-full text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.06] transition-colors inline-flex items-center justify-center"
                            >
                              <Download className="w-4 h-4" aria-hidden="true" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Formula Reference Note */}
        <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 p-6 space-y-4 pedestal-ground-shadow">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#D4FF24]" aria-hidden="true" />
            <h3 className="font-semibold text-[15px] text-[#F8FAFC]">
              How required stock (reorder point) is calculated
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
            <div className="p-4 rounded-[12px] bg-[#030407] border border-[#1558C9]/40 space-y-1">
              <span className="font-semibold text-[#D4FF24] block">
                1. Lead-time demand
              </span>
              <p className="text-[#94A3B8] leading-relaxed">
                Expected daily demand multiplied by the supplier lead time in days.
              </p>
            </div>
            <div className="p-4 rounded-[12px] bg-[#030407] border border-[#1558C9]/40 space-y-1">
              <span className="font-semibold text-[#60A5FA] block">
                2. Safety buffer
              </span>
              <p className="text-[#94A3B8] leading-relaxed">
                {useStochastic
                  ? "Buffers against both daily sales volatility and supplier delivery delay variation (95% cycle service target)."
                  : "Buffers against daily sales volatility over a fixed lead time (95% cycle service target)."}
              </p>
            </div>
            <div className="p-4 rounded-[12px] bg-[#030407] border border-[#1558C9]/40 space-y-1">
              <span className="font-semibold text-[#F8FAFC] block">
                3. Required threshold (ROP)
              </span>
              <p className="text-[#94A3B8] leading-relaxed">
                Required stock equals lead-time demand plus safety buffer. When available stock drops below this level, an order is recommended.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
