"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

export function DualVarianceComparison() {
  const [dailyDemand, setDailyDemand] = useState<number>(14);
  const [leadTimeJitter, setLeadTimeJitter] = useState<number>(2.5);
  const leadTimeDays = 14;
  const dailyDemandStd = 3.5;
  const zFactor = 1.65; // 95% cycle-service level

  // 1. Traditional single-variance formula:
  const ssTraditional = zFactor * dailyDemandStd * Math.sqrt(leadTimeDays);

  // 2. Mercato AI dual-variance formula:
  const varianceLTD =
    leadTimeDays * Math.pow(dailyDemandStd, 2) +
    Math.pow(dailyDemand, 2) * Math.pow(leadTimeJitter, 2);
  const sigmaLTD = Math.sqrt(varianceLTD);
  const ssDualVariance = zFactor * sigmaLTD;

  const leadTimeDemand = dailyDemand * leadTimeDays;
  const ropTraditional = Math.round(leadTimeDemand + ssTraditional);
  const ropDualVariance = Math.round(leadTimeDemand + ssDualVariance);
  const bufferDeficit = Math.round(ssDualVariance - ssTraditional);
  const daysShortfall = Math.max(0, Math.round(bufferDeficit / Math.max(1, dailyDemand)));

  // Angular collapse of static ERP beam
  const erpTiltDeg = Math.min(
    14.0,
    Number(((bufferDeficit / Math.max(1, ropDualVariance)) * 32).toFixed(1))
  );

  return (
    <div className="w-full bg-white border border-[#14241E]/25">
      {/* Top Vernier Calibration Strip */}
      <div className="flex items-center justify-between px-6 sm:px-10 py-2.5 border-b border-[#14241E]/15 bg-[#F4F3EC] text-[10px] font-tech-mono uppercase tracking-widest text-[#4A5B53]">
        <span>+ MATHEMATICAL PROOF // STOCHASTIC LEAD-TIME TORQUE</span>
        <span className="text-[#14241E] font-bold">
          ◆ COUNTERWEIGHT DELTA: +{bufferDeficit} UNITS
        </span>
      </div>

      {/* Asymmetric Header + Interactive Vernier Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-[#14241E]/15">
        <div className="lg:col-span-6 p-6 sm:p-10 lg:border-r border-[#14241E]/15 space-y-4">
          <span className="text-[11px] font-tech-mono font-bold text-[#126B54] tracking-[0.18em] uppercase block">
            ◆ TORSION EQUILIBRIUM LABORATORY
          </span>
          <h3 className="text-3xl sm:text-4xl lg:text-[44px] font-normal text-[#14241E] tracking-tight leading-[1.06]">
            Why static ERP scales{" "}
            <span className="font-display-serif italic text-[#991B1B]">
              tip into stockout.
            </span>
          </h3>
          <p className="text-sm text-[#4A5B53] leading-relaxed max-w-xl">
            Legacy inventory formulas assume suppliers deliver with zero variance (&sigma;<sub>LT</sub> = 0). Drag the calibration riders on the right to see how even a 2.5-day customs delay collapses static ERP buffers while Mercato AI&apos;s dual-variance counterweight holds 0.0&deg; equilibrium.
          </p>
        </div>

        {/* Right 6 Cols: Flush Vernier Calibration Riders */}
        <div className="lg:col-span-6 divide-y divide-[#14241E]/15 bg-[#FAF9F5] flex flex-col justify-between">
          {/* Rider 01: Daily Demand */}
          <div className="p-6 sm:px-10 sm:py-7 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-tech-mono uppercase tracking-widest text-[#4A5B53]">
                RIDER I // DAILY DEMAND VELOCITY (d̄)
              </span>
              <span className="font-display-serif italic text-3xl text-[#14241E] tabular-nums">
                {dailyDemand} <span className="text-xs font-tech-mono not-italic text-[#76867E]">units/day</span>
              </span>
            </div>
            <div className="h-2 w-full vernier-scale-light opacity-60" />
            <input
              type="range"
              min={5}
              max={40}
              step={1}
              value={dailyDemand}
              onChange={(e) => setDailyDemand(Number(e.target.value))}
              className="w-full accent-[#14241E] cursor-pointer"
              aria-label="Average Daily Sales Velocity"
            />
            <div className="flex justify-between text-[10px] font-tech-mono text-[#76867E]">
              <span>5u/d (ATELIER EDITION)</span>
              <span>40u/d (FLAGSHIP RUN)</span>
            </div>
          </div>

          {/* Rider 02: Supplier Delay Jitter */}
          <div className="p-6 sm:px-10 sm:py-7 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-tech-mono uppercase tracking-widest text-[#991B1B]">
                RIDER II // VENDOR FREIGHT JITTER (&sigma;<sub>LT</sub>)
              </span>
              <span className="font-display-serif italic text-3xl text-[#991B1B] tabular-nums">
                ±{leadTimeJitter.toFixed(1)} <span className="text-xs font-tech-mono not-italic text-[#76867E]">days</span>
              </span>
            </div>
            <div className="h-2 w-full vernier-scale-light opacity-60" />
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={leadTimeJitter}
              onChange={(e) => setLeadTimeJitter(Number(e.target.value))}
              className="w-full accent-[#991B1B] cursor-pointer"
              aria-label="Supplier Lead Time Jitter"
            />
            <div className="flex justify-between text-[10px] font-tech-mono text-[#76867E]">
              <span>0.0d (IDEALIZED ERP)</span>
              <span>±5.0d (PORT CONGESTION)</span>
            </div>
          </div>
        </div>
      </div>

      {/* CENTERPIECE SUPERIMPOSED TWIN-BEAM SVG INSTRUMENT STAGE */}
      <div className="bg-[#0B1410] text-white border-b border-[#14241E] px-6 sm:px-10 py-8 relative overflow-hidden">
        <div className="absolute inset-0 enamel-grid-surface opacity-55 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/12 text-[11px] font-tech-mono">
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center space-x-1.5 text-[#D4F83A]">
              <span className="w-3 h-0.5 bg-[#D4F83A] inline-block" />
              <span>MERCATO DUAL-VARIANCE BEAM (0.0° LOCKED)</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 text-[#F87171]">
              <span className="w-3 h-0.5 bg-[#F87171] inline-block" />
              <span>STATIC ERP BEAM (-{erpTiltDeg}° DEFLECTION)</span>
            </span>
          </div>
          <span className="text-[#E7AD61]">
            σ_LTD = {sigmaLTD.toFixed(1)} UNITS · Z = 1.65
          </span>
        </div>

        <div className="relative z-10 w-full h-[140px] flex items-center justify-center pt-2">
          <svg
            viewBox="0 0 860 130"
            className="w-full h-full overflow-visible"
            aria-label="Superimposed comparison of Static ERP beam deflection vs Mercato AI equilibrium beam"
          >
            {/* Central Vertical Plumb Line */}
            <line
              x1="430"
              y1="10"
              x2="430"
              y2="115"
              stroke="#E7AD61"
              strokeWidth="1"
              strokeDasharray="2 3"
              strokeOpacity="0.45"
            />

            {/* BEAM 1: Traditional Static ERP Beam (Tips into Stockout Deficit) */}
            <motion.g
              initial={false}
              animate={{ rotate: erpTiltDeg }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              style={{ originX: "430px", originY: "58px", transformBox: "view-box" }}
            >
              <line
                x1="110"
                y1="58"
                x2="750"
                y2="58"
                stroke="#F87171"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <rect x="95" y="42" width="76" height="16" fill="#7F1D1D" stroke="#F87171" strokeWidth="1.2" />
              <text x="133" y="53" textAnchor="middle" fill="#FECACA" fontSize="9" fontFamily="monospace">
                ERP: {Math.round(ssTraditional)}u SS
              </text>
              <circle cx="750" cy="58" r="5" fill="#F87171" />
            </motion.g>

            {/* BEAM 2: Mercato AI Dual-Variance Beam (Locked at 0.0 deg with Brass Counterweight) */}
            <g>
              <line
                x1="110"
                y1="58"
                x2="750"
                y2="58"
                stroke="#D4F83A"
                strokeWidth="3"
              />
              {/* Left Supply Base + Dynamic Brass Counterweight */}
              <rect x="95" y="34" width="76" height="22" fill="#126B54" stroke="#D4F83A" strokeWidth="1.2" />
              <text x="133" y="48" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontFamily="monospace" fontWeight="bold">
                BASE {Math.round(ssTraditional)}u
              </text>

              {bufferDeficit > 0 && (
                <g>
                  <rect
                    x="176"
                    y="30"
                    width="96"
                    height="26"
                    fill="#E7AD61"
                    stroke="#0B1410"
                    strokeWidth="1.5"
                  />
                  <text
                    x="224"
                    y="46"
                    textAnchor="middle"
                    fill="#0B1410"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    +{bufferDeficit}u JITTER CW
                  </text>
                </g>
              )}

              {/* Right Demand + Vendor Jitter Load */}
              <rect x="650" y="32" width="110" height="24" fill="#1E3A8A" stroke="#60A5FA" strokeWidth="1.2" />
              <text x="705" y="47" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontFamily="monospace" fontWeight="bold">
                ROP {ropDualVariance}u (±{leadTimeJitter}d)
              </text>
            </g>

            {/* Central Knife-Edge Diamond Fulcrum */}
            <polygon
              points="430,40 446,58 430,76 414,58"
              fill="#0B1410"
              stroke="#E7AD61"
              strokeWidth="2.2"
            />
            <polygon points="430,49 438,58 430,67 422,58" fill="#D4F83A" />
            <path d="M 406 116 L 454 116 L 438 74 L 422 74 Z" fill="#070D0A" stroke="#E7AD61" strokeWidth="1.2" />
          </svg>
        </div>
      </div>

      {/* BOTTOM SPLIT ARCHITECTURAL LEDGER (NO RED/GREEN SAAS BOXES) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#14241E]/15">
        {/* Left 6 Cols: Traditional Static ERP Audit */}
        <div className="lg:col-span-6 p-6 sm:p-10 space-y-6 bg-[#FAF9F5]">
          <div className="flex items-baseline justify-between border-b border-[#14241E]/15 pb-4">
            <div>
              <span className="text-[10px] font-tech-mono uppercase tracking-widest text-[#991B1B] block">
                SPECIMEN A // LEGACY ERP FORMULA
              </span>
              <h4 className="font-display-serif text-2xl sm:text-3xl text-[#14241E] mt-1">
                Single-Variance Assumption
              </h4>
            </div>
            <span className="font-tech-mono text-xs font-bold text-[#991B1B]">
              -{erpTiltDeg}&deg; UNBALANCED
            </span>
          </div>

          <div className="grid grid-cols-2 divide-x divide-[#14241E]/15 border-b border-[#14241E]/15 pb-6">
            <div className="pr-4">
              <span className="text-[10px] font-tech-mono uppercase tracking-widest text-[#76867E] block">
                STATIC SAFETY BUFFER
              </span>
              <span className="font-display-serif italic text-4xl sm:text-5xl text-[#14241E] tabular-nums block mt-1">
                {Math.round(ssTraditional)} <span className="text-sm font-tech-mono not-italic text-[#76867E]">u</span>
              </span>
            </div>
            <div className="pl-4">
              <span className="text-[10px] font-tech-mono uppercase tracking-widest text-[#76867E] block">
                UNPROTECTED ROP
              </span>
              <span className="font-display-serif italic text-4xl sm:text-5xl text-[#991B1B] tabular-nums block mt-1">
                {ropTraditional} <span className="text-sm font-tech-mono not-italic text-[#76867E]">u</span>
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between text-xs font-tech-mono text-[#991B1B]">
            <span>FAILURE MODE AT ±{leadTimeJitter.toFixed(1)}D DELAY:</span>
            <span className="font-bold">STOCKOUT {daysShortfall} DAYS BEFORE ARRIVAL</span>
          </div>
        </div>

        {/* Right 6 Cols: Mercato AI Dual-Variance Audit */}
        <div className="lg:col-span-6 p-6 sm:p-10 space-y-6 bg-white">
          <div className="flex items-baseline justify-between border-b border-[#14241E]/15 pb-4">
            <div>
              <span className="text-[10px] font-tech-mono uppercase tracking-widest text-[#126B54] block">
                SPECIMEN B // MERCATO AI ENGINE
              </span>
              <h4 className="font-display-serif text-2xl sm:text-3xl text-[#14241E] mt-1">
                Dual-Variance Synthesis
              </h4>
            </div>
            <span className="font-tech-mono text-xs font-bold px-2 py-0.5 bg-[#14241E] text-[#D4F83A]">
              ◆ 0.0&deg; EQUILIBRIUM
            </span>
          </div>

          <div className="grid grid-cols-2 divide-x divide-[#14241E]/15 border-b border-[#14241E]/15 pb-6">
            <div className="pr-4">
              <span className="text-[10px] font-tech-mono uppercase tracking-widest text-[#126B54] block">
                COUNTERWEIGHTED BUFFER
              </span>
              <span className="font-display-serif italic text-4xl sm:text-5xl text-[#126B54] tabular-nums block mt-1">
                {Math.round(ssDualVariance)} <span className="text-sm font-tech-mono not-italic text-[#76867E]">u</span>
              </span>
            </div>
            <div className="pl-4">
              <span className="text-[10px] font-tech-mono uppercase tracking-widest text-[#14241E] block">
                PROTECTED ROP
              </span>
              <span className="font-display-serif italic text-4xl sm:text-5xl text-[#14241E] tabular-nums block mt-1">
                {ropDualVariance} <span className="text-sm font-tech-mono not-italic text-[#76867E]">u</span>
              </span>
            </div>
          </div>

          <div className="flex items-baseline justify-between text-xs font-tech-mono text-[#126B54]">
            <span>AUTONOMOUS COUNTERWEIGHT ALLOCATION:</span>
            <span className="font-bold">+{bufferDeficit} UNITS · 95.0% CSL GUARANTEED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
