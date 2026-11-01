"use client";

import React, { useState } from "react";
import { X, Trash2, ShoppingBag, Download, Send } from "lucide-react";
import { usePurchaseOrder } from "@/lib/purchaseOrderContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function PurchaseOrderDrawer() {
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    removeItem,
    updateQuantity,
    clearPO,
    totalCost,
    totalUnits,
  } = usePurchaseOrder();
  const [supplierNotes, setSupplierNotes] = useState(
    "Standard replenishment order for primary distribution center."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isDrawerOpen) return null;

  const handleSubmitOrder = async () => {
    if (items.length === 0) {
      toast.error("Your purchase order draft is empty.");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await api.createPurchaseOrder(
        items.map((i) => ({ sku: i.sku, quantity: i.quantity })),
        supplierNotes
      );
      toast.success(
        `Purchase order ${res.po_number} saved (€${res.total_cost.toLocaleString()}). Receive delivery in Inventory when stock arrives.`
      );
      clearPO();
      closeDrawer();
    } catch {
      toast.error("Failed to save purchase order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (items.length === 0) return;
    const headers = [
      "SKU",
      "Product Name",
      "Quantity",
      "Unit Cost (€)",
      "Total Cost (€)",
      "Lead Time (Days)",
      "Warehouse",
    ];
    const rows = items.map((i) => [
      i.sku,
      `"${i.name}"`,
      i.quantity,
      i.costPrice.toFixed(2),
      (i.quantity * i.costPrice).toFixed(2),
      i.leadTimeDays,
      `"${i.warehouseLocation}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n"
    );
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Mercato_PO_Draft_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Purchase order draft exported as CSV.");
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="po-drawer-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#030407]/75 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0A0F1D] floating-overlay-shadow flex flex-col border-l border-[#1558C9]/50 text-[#F8FAFC]">
          {/* Header */}
          <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-[#030407]/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#1558C9]/25 border border-[#1558C9] text-[#D4FF24] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2
                  id="po-drawer-title"
                  className="text-[17px] font-semibold text-[#F8FAFC]"
                >
                  Purchase order draft
                </h2>
                <p className="text-[12px] text-[#94A3B8] tabular-nums">
                  {items.length} {items.length === 1 ? "line item" : "line items"} ·{" "}
                  {totalUnits} total units
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Close purchase order drawer"
              className="w-9 h-9 rounded-full text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#030407] border border-[#1558C9]/45 flex items-center justify-center mx-auto text-[#D4FF24]">
                  <ShoppingBag className="w-5 h-5" aria-hidden="true" />
                </div>
                <p className="text-[15px] font-semibold text-[#F8FAFC]">
                  No draft purchase order items
                </p>
                <p className="text-[13px] text-[#94A3B8] max-w-xs mx-auto leading-relaxed">
                  Select &ldquo;Add to purchase order&rdquo; from the balance scale or inventory table to stage items for review.
                </p>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-[12px] bg-[#030407] border border-[#1558C9]/40 text-[12px] text-[#94A3B8]">
                  Drafting an order does not change current on-hand stock. Stock updates only when a saved order is marked received.
                </div>

                {items.map((item) => (
                  <div
                    key={item.sku}
                    className="p-4 rounded-[14px] border border-[#1558C9]/40 bg-[#030407]/80 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-semibold text-[#D4FF24] block">
                          {item.sku}
                        </span>
                        <h4 className="text-[14px] font-semibold text-[#F8FAFC]">
                          {item.name}
                        </h4>
                        <p className="text-[12px] text-[#94A3B8] mt-0.5 tabular-nums">
                          {item.warehouseLocation} · {item.leadTimeDays}-day lead time
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.sku)}
                        className="text-[#94A3B8] hover:text-[#FB7185] transition-colors p-1 cursor-pointer"
                        aria-label={`Remove ${item.name} from draft`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.08] text-[13px]">
                      <div className="flex items-center gap-2">
                        <span className="text-[#94A3B8]">Qty:</span>
                        <div className="flex items-center border border-[#1558C9]/50 rounded-[8px] overflow-hidden bg-[#0A0F1D]">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.sku, item.quantity - 10)
                            }
                            aria-label="Decrease quantity by 10"
                            className="px-2.5 py-1 bg-[#030407] hover:bg-[#1558C9]/30 font-semibold text-[#F8FAFC] cursor-pointer"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            aria-label={`Quantity for ${item.name}`}
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                item.sku,
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                            className="w-14 text-center text-[13px] font-semibold text-[#F8FAFC] bg-transparent tabular-nums outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.sku, item.quantity + 10)
                            }
                            aria-label="Increase quantity by 10"
                            className="px-2.5 py-1 bg-[#030407] hover:bg-[#1558C9]/30 font-semibold text-[#F8FAFC] cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[#94A3B8] text-[11px] block">
                          Line total
                        </span>
                        <span className="font-semibold text-[#D4FF24] tabular-nums text-[14px]">
                          €
                          {(item.quantity * item.costPrice).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {items.length > 0 && (
              <div className="pt-2">
                <label
                  htmlFor="po-supplier-notes"
                  className="block text-[12px] font-medium text-[#94A3B8] mb-1.5"
                >
                  Supplier notes
                </label>
                <textarea
                  id="po-supplier-notes"
                  value={supplierNotes}
                  onChange={(e) => setSupplierNotes(e.target.value)}
                  rows={3}
                  className="w-full text-[13px] p-3 rounded-[10px] border border-[#1558C9]/50 bg-[#030407] text-[#F8FAFC] focus:ring-2 focus:ring-[#D4FF24] outline-hidden resize-none"
                />
              </div>
            )}
          </div>

          {/* Footer Summary */}
          {items.length > 0 && (
            <div className="p-6 border-t border-white/[0.08] bg-[#030407]/85 space-y-4">
              <div className="space-y-1.5 text-[13px]">
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Proposed units:</span>
                  <span className="font-semibold text-[#F8FAFC] tabular-nums">
                    {totalUnits} units
                  </span>
                </div>
                <div className="flex justify-between text-[15px] font-semibold text-[#F8FAFC] pt-2 border-t border-white/[0.08]">
                  <span>Estimated order cost:</span>
                  <span className="tabular-nums text-[#D4FF24]">
                    €
                    {totalCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center justify-center px-4 py-2.5 rounded-full border border-[#1558C9]/60 bg-[#0A0F1D] text-[13px] font-semibold text-[#F8FAFC] hover:bg-[#1558C9]/25 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 mr-1.5 text-[#3B82F6]" aria-hidden="true" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className="flex items-center justify-center px-4 py-2.5 rounded-full bg-[#D4FF24] hover:bg-[#E2FF54] text-[#030407] text-[13px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                      Save PO record
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
