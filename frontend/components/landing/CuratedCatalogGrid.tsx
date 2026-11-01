"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { usePurchaseOrder } from "@/lib/purchaseOrderContext";
import { toast } from "sonner";

export interface CatalogItem {
  sku: string;
  name: string;
  category: "Apparel" | "Footwear" | "Accessories" | "Home & Living";
  price: number;
  cost: number;
  availableStock: number;
  requiredStock: number;
  leadTimeDays: number;
  daysOfSupply: number;
  riskStatus: "CRITICAL" | "REORDER_NOW" | "SAFE";
  statusLabel: string;
  image: string;
}

export const CURATED_CATALOG: CatalogItem[] = [
  {
    sku: "FTW-10892",
    name: "Waterproof Trail Running Shoe",
    category: "Footwear",
    price: 160.0,
    cost: 74.0,
    availableStock: 64,
    requiredStock: 160,
    leadTimeDays: 42,
    daysOfSupply: 4.5,
    riskStatus: "CRITICAL",
    statusLabel: "Shortfall: 96 units",
    image: "/products/shoe.png",
  },
  {
    sku: "APP-20241",
    name: "Heavyweight Flannel Overshirt",
    category: "Apparel",
    price: 145.0,
    cost: 68.0,
    availableStock: 120,
    requiredStock: 193,
    leadTimeDays: 35,
    daysOfSupply: 6.5,
    riskStatus: "CRITICAL",
    statusLabel: "Shortfall: 73 units",
    image: "/products/flannel.png",
  },
  {
    sku: "ACC-30118",
    name: "Full-Grain Leather Weekender",
    category: "Accessories",
    price: 340.0,
    cost: 135.0,
    availableStock: 42,
    requiredStock: 92,
    leadTimeDays: 45,
    daysOfSupply: 6.9,
    riskStatus: "CRITICAL",
    statusLabel: "Shortfall: 50 units",
    image: "/products/bag.png",
  },
  {
    sku: "APP-20242",
    name: "Ribbed Cashmere Beanie",
    category: "Apparel",
    price: 65.0,
    cost: 28.0,
    availableStock: 112,
    requiredStock: 148,
    leadTimeDays: 21,
    daysOfSupply: 8.8,
    riskStatus: "REORDER_NOW",
    statusLabel: "Shortfall: 36 units",
    image: "/products/beanie.png",
  },
  {
    sku: "ACC-30115",
    name: "Polarized Acetate Sunglasses",
    category: "Accessories",
    price: 175.0,
    cost: 42.0,
    availableStock: 88,
    requiredStock: 115,
    leadTimeDays: 28,
    daysOfSupply: 9.4,
    riskStatus: "REORDER_NOW",
    statusLabel: "Shortfall: 27 units",
    image: "/products/sunglasses.png",
  },
  {
    sku: "HOM-40502",
    name: "Ceramic Pour-Over Coffee Dripper",
    category: "Home & Living",
    price: 44.0,
    cost: 18.0,
    availableStock: 195,
    requiredStock: 158,
    leadTimeDays: 14,
    daysOfSupply: 24.2,
    riskStatus: "SAFE",
    statusLabel: "In balance",
    image: "/products/dripper.png",
  },
  {
    sku: "HOM-40501",
    name: "Hand-Poured Soy Amber Candle",
    category: "Home & Living",
    price: 38.0,
    cost: 14.0,
    availableStock: 210,
    requiredStock: 172,
    leadTimeDays: 14,
    daysOfSupply: 19.5,
    riskStatus: "SAFE",
    statusLabel: "In balance",
    image: "/products/candle.png",
  },
  {
    sku: "APP-20243",
    name: "Wide-Leg Indigo Selvedge Denim",
    category: "Apparel",
    price: 195.0,
    cost: 92.0,
    availableStock: 140,
    requiredStock: 125,
    leadTimeDays: 28,
    daysOfSupply: 18.2,
    riskStatus: "SAFE",
    statusLabel: "In balance",
    image: "/products/denim.png",
  },
];

const RISK_PRIORITY: Record<CatalogItem["riskStatus"], number> = {
  CRITICAL: 0,
  REORDER_NOW: 1,
  SAFE: 2,
};

export function CuratedCatalogGrid() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const { addToPO, items, openDrawer } = usePurchaseOrder();

  const categories = ["All", "Apparel", "Footwear", "Accessories", "Home & Living"];

  const filteredItems = (
    activeCategory === "All"
      ? CURATED_CATALOG
      : CURATED_CATALOG.filter((item) => item.category === activeCategory)
  )
    .slice()
    .sort((a, b) => RISK_PRIORITY[a.riskStatus] - RISK_PRIORITY[b.riskStatus])
    .slice(0, 6);

  const handleAdd = (item: CatalogItem) => {
    const shortfall = Math.max(0, item.requiredStock - item.availableStock);
    const recommendedQty = shortfall > 0 ? Math.max(30, shortfall) : 0;
    if (recommendedQty <= 0) return;

    const alreadyInDraft = items.some((poItem) => poItem.sku === item.sku);
    if (alreadyInDraft) {
      toast.info(`${item.name} is already in your purchase order draft.`);
      openDrawer();
      return;
    }

    addToPO({
      sku: item.sku,
      name: item.name,
      quantity: recommendedQty,
      costPrice: item.cost,
      leadTimeDays: item.leadTimeDays,
      warehouseLocation: "Primary distribution center",
    });
  };

  return (
    <div className="space-y-6">
      {/* Section Header & Category Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <span className="text-[13px] font-semibold text-[#D4FF24] block">
            See what needs attention
          </span>
          <h2 className="text-[28px] sm:text-[40px] font-semibold text-[#F8FAFC] tracking-tight leading-[1.08]">
            Compare available stock{" "}
            <span className="font-display-serif italic font-normal text-[#D4FF24]">
              against
            </span>{" "}
            <span className="text-[#3B82F6]">required thresholds.</span>
          </h2>
          <p className="text-[16px] text-[#94A3B8] leading-[1.6]">
            Products below their required lead-time stock are surfaced first so you can add recommended quantities to a draft purchase order.
          </p>
        </div>

        {/* Category Filter Controls */}
        <div
          role="group"
          aria-label="Filter products by category"
          className="inline-flex flex-wrap gap-1 bg-[#0A0F1D] p-1 rounded-full border border-[#1558C9]/45 self-start md:self-end"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors cursor-pointer ${
                activeCategory === cat
                  ? "bg-[#D4FF24] text-[#030407]"
                  : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.05]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* High-Contrast Architectural Table Surface */}
      <div className="bg-[#0A0F1D] rounded-[20px] border border-[#1558C9]/40 overflow-hidden pedestal-ground-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#030407]/60 text-[12px] font-semibold text-[#94A3B8]">
                <th className="py-4 px-5 sm:px-6">Product</th>
                <th className="py-4 px-4 text-right">Available stock</th>
                <th className="py-4 px-4 text-right">Required stock</th>
                <th className="py-4 px-4 text-right hidden sm:table-cell">Gap / Buffer</th>
                <th className="py-4 px-4">Stock status</th>
                <th className="py-4 px-5 sm:px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-[14px]">
              {filteredItems.map((item) => {
                const isInDraft = items.some((po) => po.sku === item.sku);
                const diff = item.availableStock - item.requiredStock;
                const shortfall = Math.max(0, item.requiredStock - item.availableStock);
                const recommendedQty = shortfall > 0 ? Math.max(30, shortfall) : 0;

                return (
                  <tr
                    key={item.sku}
                    className="hover:bg-[#1558C9]/10 transition-colors"
                  >
                    {/* Product Cell */}
                    <td className="py-4 px-5 sm:px-6">
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-11 h-11 rounded-[10px] overflow-hidden bg-[#030407] border border-[#1558C9]/45 shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[#F8FAFC] truncate">
                            {item.name}
                          </div>
                          <div className="text-[12px] text-[#94A3B8] tabular-nums">
                            {item.sku} · {item.category} · {item.leadTimeDays}d lead time
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Available Stock */}
                    <td className="py-4 px-4 text-right font-semibold text-[#F8FAFC] tabular-nums whitespace-nowrap">
                      {item.availableStock} units
                    </td>

                    {/* Required Stock */}
                    <td className="py-4 px-4 text-right font-medium text-[#60A5FA] tabular-nums whitespace-nowrap">
                      {item.requiredStock} units
                    </td>

                    {/* Gap / Buffer */}
                    <td className="py-4 px-4 text-right tabular-nums whitespace-nowrap hidden sm:table-cell">
                      {diff < 0 ? (
                        <span className="font-semibold text-[#FB7185]">
                          {diff} units
                        </span>
                      ) : (
                        <span className="font-semibold text-[#D4FF24]">
                          +{diff} units
                        </span>
                      )}
                    </td>

                    {/* Accessible Stock Status Badge (Icon + Text) */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {item.riskStatus === "CRITICAL" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#FB7185]/15 text-[#FB7185] border border-[#FB7185]/40">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>{item.statusLabel}</span>
                        </span>
                      )}
                      {item.riskStatus === "REORDER_NOW" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/40">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>{item.statusLabel}</span>
                        </span>
                      )}
                      {item.riskStatus === "SAFE" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#D4FF24]/15 text-[#D4FF24] border border-[#D4FF24]/40">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>{item.statusLabel}</span>
                        </span>
                      )}
                    </td>

                    {/* Action Cell */}
                    <td className="py-4 px-5 sm:px-6 text-right whitespace-nowrap">
                      {recommendedQty > 0 ? (
                        isInDraft ? (
                          <button
                            type="button"
                            onClick={openDrawer}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1558C9]/30 text-[#D4FF24] border border-[#1558C9] text-[13px] font-semibold hover:bg-[#1558C9]/45 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>In draft order</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAdd(item)}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#D4FF24] hover:bg-[#E2FF54] text-[#030407] text-[13px] font-bold transition-colors cursor-pointer tabular-nums"
                          >
                            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Add +{recommendedQty} to order</span>
                          </button>
                        )
                      ) : (
                        <span className="text-[13px] text-[#94A3B8]">
                          No order needed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer Link to Full Inventory Workspace */}
        <div className="px-5 sm:px-6 py-4 bg-[#030407]/70 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[13px] text-[#94A3B8]">
            Drafting a purchase order adds items to your review drawer without changing current on-hand stock.
          </span>
          <Link
            href="/inventory"
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#D4FF24] hover:text-[#E2FF54] transition-colors shrink-0"
          >
            <span>Open full inventory table</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
