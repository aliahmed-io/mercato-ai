"use client";

import React from "react";
import Link from "next/link";
import { MercatoLogo } from "@/components/brand/MercatoLogo";

export function Footer() {
  return (
    <footer className="w-full bg-[#030407] border-t border-white/[0.08] text-[#F8FAFC] mt-auto">
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 lg:px-12 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2 max-w-sm">
          <Link href="/" className="flex items-center gap-2.5">
            <MercatoLogo size={26} />
            <span className="text-[17px] font-semibold tracking-tight text-[#F8FAFC]">
              Mercato
            </span>
          </Link>
          <p className="text-[14px] text-[#94A3B8] leading-relaxed">
            Stock and demand, in balance. Demand forecasting and replenishment planning built for clarity and precision.
          </p>
        </div>

        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-6 text-[14px] font-medium text-[#94A3B8]"
        >
          <Link href="/overview" className="hover:text-[#D4FF24] transition-colors">
            Overview
          </Link>
          <Link href="/forecasting" className="hover:text-[#D4FF24] transition-colors">
            Forecasting
          </Link>
          <Link href="/inventory" className="hover:text-[#D4FF24] transition-colors">
            Inventory
          </Link>
          <Link href="/analytics" className="hover:text-[#D4FF24] transition-colors">
            Analytics
          </Link>
          <Link href="/models" className="hover:text-[#D4FF24] transition-colors">
            Models
          </Link>
          <Link href="/data" className="hover:text-[#D4FF24] transition-colors">
            Data
          </Link>
          <Link href="/reports" className="hover:text-[#D4FF24] transition-colors">
            Reports
          </Link>
        </nav>
      </div>
    </footer>
  );
}
