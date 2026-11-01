"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Menu,
  X,
  ArrowUpRight,
  LayoutDashboard,
  TrendingUp,
  Package,
  BarChart3,
  Cpu,
  Database,
  FileText,
} from "lucide-react";
import { usePurchaseOrder } from "@/lib/purchaseOrderContext";
import { MercatoLogo } from "@/components/brand/MercatoLogo";

const WORKSPACE_LINKS = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/forecasting", label: "Forecasting", icon: TrendingUp },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/models", label: "Models", icon: Cpu },
  { href: "/data", label: "Data", icon: Database },
  { href: "/reports", label: "Reports", icon: FileText },
];

export function Navbar() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const { items, openDrawer } = usePurchaseOrder();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#030407]/85 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-[1280px] mx-auto h-16 px-5 sm:px-8 lg:px-12 flex items-center justify-between gap-4">
        {/* Brand Identity */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D4FF24] rounded-[10px]"
          >
            <MercatoLogo
              size={32}
              className="transition-transform duration-200 group-hover:scale-105"
            />
            <span className="text-[18px] font-semibold tracking-tight text-[#F8FAFC]">
              Mercato
            </span>
          </Link>

          {/* Primary Navigation */}
          {isLanding ? (
            <nav
              aria-label="Landing navigation"
              className="hidden md:flex items-center gap-7"
            >
              <a
                href="#product-demand"
                className="text-[14px] font-medium text-[#94A3B8] hover:text-[#D4FF24] transition-colors"
              >
                Product
              </a>
              <a
                href="#attention-catalog"
                className="text-[14px] font-medium text-[#94A3B8] hover:text-[#D4FF24] transition-colors"
              >
                Catalog
              </a>
              <a
                href="#how-it-works"
                className="text-[14px] font-medium text-[#94A3B8] hover:text-[#D4FF24] transition-colors"
              >
                How it works
              </a>
              <Link
                href="/overview"
                className="text-[14px] font-medium text-[#94A3B8] hover:text-[#D4FF24] transition-colors"
              >
                Workspace
              </Link>
            </nav>
          ) : (
            <nav
              aria-label="Workspace navigation"
              className="hidden lg:flex items-center gap-1"
            >
              {WORKSPACE_LINKS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[13px] font-medium transition-colors ${
                      isActive
                        ? "bg-[#1558C9]/25 text-[#D4FF24] border border-[#1558C9]/60"
                        : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isActive ? "text-[#D4FF24]" : "text-[#3B82F6]"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Purchase Order Drawer Trigger */}
          <button
            type="button"
            onClick={openDrawer}
            aria-label={`Purchase order draft (${items.length} items)`}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#0A0F1D] hover:bg-[#10192E] border border-[#1558C9]/45 text-[#F8FAFC] text-[13px] font-medium transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#D4FF24]" />
            <span className="hidden sm:inline">Purchase orders</span>
            {items.length > 0 && (
              <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-[#D4FF24] text-[#030407] tabular-nums leading-none">
                {items.length}
              </span>
            )}
          </button>

          {/* Primary Workspace Action — High-Voltage Acid Lime Pill */}
          {isLanding ? (
            <Link
              href="/forecasting"
              className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#D4FF24] hover:bg-[#E2FF54] text-[#030407] text-[13px] font-bold tracking-tight transition-all lime-glow-button"
            >
              <span>Open workspace</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1558C9] hover:bg-[#1D6AE5] text-[#F8FAFC] text-[13px] font-semibold transition-colors"
            >
              <span>Balance studio</span>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 rounded-[10px] bg-[#0A0F1D] border border-[#1558C9]/40 text-[#F8FAFC] hover:bg-[#10192E]"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0A0F1D] border-b border-[#1558C9]/40 px-5 py-4 space-y-3">
          {isLanding ? (
            <div className="flex flex-col gap-2">
              <a
                href="#product-demand"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-[10px] text-[15px] font-medium text-[#F8FAFC] hover:bg-white/[0.05]"
              >
                Product
              </a>
              <a
                href="#attention-catalog"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-[10px] text-[15px] font-medium text-[#F8FAFC] hover:bg-white/[0.05]"
              >
                Catalog
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-[10px] text-[15px] font-medium text-[#F8FAFC] hover:bg-white/[0.05]"
              >
                How it works
              </a>
              <Link
                href="/forecasting"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#D4FF24] text-[#030407] text-[14px] font-bold"
              >
                <span>Open workspace</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {WORKSPACE_LINKS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-[10px] text-[14px] font-medium ${
                      isActive
                        ? "bg-[#1558C9]/30 text-[#D4FF24] border border-[#1558C9]"
                        : "text-[#94A3B8] hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
