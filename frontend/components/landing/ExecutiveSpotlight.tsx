"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function ExecutiveSpotlight() {
  return (
    <section className="w-full bg-white border border-[#14241E]/25">
      {/* Top Vernier Strip */}
      <div className="flex items-center justify-between px-6 sm:px-10 py-2.5 border-b border-[#14241E]/15 bg-[#F4F3EC] text-[10px] font-tech-mono uppercase tracking-widest text-[#4A5B53]">
        <span>+ MERCHANDISING DOSSIER // ATELIER &amp; MULTI-WAREHOUSE CONTROL</span>
        <span className="text-[#126B54] font-bold">◆ 94.2% VERIFIED SERVICE LEVEL</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#14241E]/15">
        {/* Left 6 Cols: Full-Bleed Architectural Portrait */}
        <div className="lg:col-span-6 flex flex-col justify-between bg-[#0B1410]">
          <div className="relative aspect-[16/11] sm:aspect-[4/3] w-full overflow-hidden">
            <Image
              src="/images/executive_merchandising.jpg"
              alt="Executive Merchandising Atelier with Demand Forecasting Intelligence"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover hover:scale-103 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1410]/85 via-transparent to-transparent pointer-events-none" />
            <span className="absolute top-4 left-4 font-tech-mono text-[10px] px-2.5 py-1 bg-[#0B1410]/90 text-[#E7AD61] border border-[#E7AD61]/40">
              + SPECIMEN ATELIER // PARIS &amp; MILAN
            </span>
          </div>

          {/* Flush Bottom Telemetry Strip under Image */}
          <div className="grid grid-cols-2 divide-x divide-white/15 border-t border-white/15 text-white bg-[#0B1410]">
            <div className="p-5 sm:px-8">
              <span className="text-[10px] font-tech-mono uppercase tracking-widest text-[#E7AD61] block">
                PORTFOLIO CADENCE
              </span>
              <span className="font-display-serif italic text-2xl sm:text-3xl text-white block mt-1">
                Q2 High-Turnover
              </span>
            </div>
            <div className="p-5 sm:px-8">
              <span className="text-[10px] font-tech-mono uppercase tracking-widest text-[#D4F83A] block">
                CYCLE SERVICE LOCK
              </span>
              <span className="font-display-serif italic text-2xl sm:text-3xl text-[#D4F83A] tabular-nums block mt-1">
                94.2% Fulfilled
              </span>
            </div>
          </div>
        </div>

        {/* Right 6 Cols: Editorial Narrative & Hairline Pillars */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div className="p-6 sm:p-10 lg:p-12 space-y-6">
            <div className="space-y-3">
              <span className="text-[11px] font-tech-mono font-bold text-[#126B54] tracking-[0.18em] uppercase block">
                ◆ MERCHANDISING &amp; REPLENISHMENT
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#14241E] tracking-tight leading-[1.08]">
                Crafted for heritage ateliers and{" "}
                <span className="font-display-serif italic text-[#126B54]">
                  modern commerce.
                </span>
              </h2>
            </div>

            <p className="text-sm sm:text-base text-[#4A5B53] leading-relaxed">
              Luxury fashion houses and boutique retailers face a perpetual equilibrium dilemma: stock out of high-margin flagship pieces during seasonal surges, or trap millions in stagnant warehouse inventory. Mercato AI resolves both through continuous stochastic review.
            </p>

            {/* 3 Hairline Pillar Rows (No Icon Boxes) */}
            <div className="border-t border-[#14241E]/15 divide-y divide-[#14241E]/15">
              <div className="py-4 flex items-baseline space-x-4">
                <span className="font-display-serif italic text-2xl text-[#B87F35] shrink-0 w-6">
                  I
                </span>
                <div>
                  <h4 className="text-sm font-bold text-[#14241E] uppercase tracking-wider font-tech-mono">
                    Dynamic Days-of-Supply Horizon
                  </h4>
                  <p className="text-xs sm:text-sm text-[#4A5B53] mt-1 leading-relaxed">
                    Computes real-time runout trajectories from recursive multi-step forecasts, alerting buyers weeks before stock crosses the reorder fulcrum.
                  </p>
                </div>
              </div>

              <div className="py-4 flex items-baseline space-x-4">
                <span className="font-display-serif italic text-2xl text-[#B87F35] shrink-0 w-6">
                  II
                </span>
                <div>
                  <h4 className="text-sm font-bold text-[#14241E] uppercase tracking-wider font-tech-mono">
                    Supplier Freight Jitter Counterweight
                  </h4>
                  <p className="text-xs sm:text-sm text-[#4A5B53] mt-1 leading-relaxed">
                    Embeds historical vendor delivery variance (&sigma;<sub>LT</sub>) directly into safety buffers so customs delays never break retail fulfillment.
                  </p>
                </div>
              </div>

              <div className="py-4 flex items-baseline space-x-4">
                <span className="font-display-serif italic text-2xl text-[#B87F35] shrink-0 w-6">
                  III
                </span>
                <div>
                  <h4 className="text-sm font-bold text-[#14241E] uppercase tracking-wider font-tech-mono">
                    Publication-Grade PO Contracts
                  </h4>
                  <p className="text-xs sm:text-sm text-[#4A5B53] mt-1 leading-relaxed">
                    Compiles signed ReportLab PDF purchase orders and pre-addressed vendor dispatches with a single counterweight release.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Flush Dual-Action Footer Bar */}
          <div className="grid grid-cols-2 border-t border-[#14241E] divide-x divide-[#14241E]">
            <Link
              href="/overview"
              className="py-4 px-6 bg-[#14241E] hover:bg-[#1C332B] text-[#D4F83A] font-tech-mono text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors"
            >
              <span>EXECUTIVE OVERVIEW</span>
              <ArrowUpRight className="w-4 h-4 text-[#E7AD61]" />
            </Link>
            <Link
              href="/models"
              className="py-4 px-6 bg-[#F4F3EC] hover:bg-white text-[#14241E] font-tech-mono text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors"
            >
              <span>INSPECT ML TOURNAMENT</span>
              <ArrowUpRight className="w-4 h-4 text-[#126B54]" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
