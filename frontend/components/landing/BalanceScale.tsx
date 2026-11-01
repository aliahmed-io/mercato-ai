"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { computeBeamAttachmentPoints } from "@/lib/balanceMath";
import { MOTION } from "@/lib/tokens";

export interface BalanceScaleProps {
  availableUnits: number;
  proposedOrderUnits: number;
  isPreviewing: boolean;
  scenarioDemandUnits: number;
  bufferUnits: number;
  requiredUnits: number;
  angleDegrees: number;
}

const PIVOT_X = 500;
const PIVOT_Y = 250;
const HALF_SPAN = 280;
const ROD_LENGTH = 118;

/**
 * Sculptural Precision Balance Scale — Nocturnal Cobalt & Acid-Lime Edition
 * - Custom SVG (viewBox="0 130 1000 435")
 * - Machined obsidian-titanium & Electric Cobalt (#1558C9) geometry with Acid Lime (#D4FF24) fulcrum core
 * - Beam rotates around explicit pivot (500, 250)
 * - Pan attachment coordinates computed from beam angle so suspension rods remain vertical and pans stay horizontal
 * - HTML quantity labels sit outside the SVG near the two pans
 */
export function BalanceScale({
  availableUnits,
  proposedOrderUnits,
  isPreviewing,
  scenarioDemandUnits,
  bufferUnits,
  requiredUnits,
  angleDegrees,
}: BalanceScaleProps) {
  const prefersReducedMotion = useReducedMotion();

  const effectiveAvailableUnits = isPreviewing
    ? availableUnits + proposedOrderUnits
    : availableUnits;

  const { leftAttachX, leftAttachY, rightAttachX, rightAttachY } =
    computeBeamAttachmentPoints(angleDegrees, PIVOT_X, PIVOT_Y, HALF_SPAN);

  const springTransition = prefersReducedMotion
    ? { duration: 0 }
    : MOTION.scaleSpring;

  // Compute block heights (clamped for visual clarity inside pan assembly)
  const maxReference = Math.max(effectiveAvailableUnits, requiredUnits, 240);
  const availableBlockHeight = Math.max(
    24,
    Math.min(78, Math.round((availableUnits / maxReference) * 78))
  );
  const proposedBlockHeight =
    isPreviewing && proposedOrderUnits > 0
      ? Math.max(
          18,
          Math.min(58, Math.round((proposedOrderUnits / maxReference) * 78))
        )
      : 0;

  const demandBlockHeight = Math.max(
    22,
    Math.min(64, Math.round((scenarioDemandUnits / maxReference) * 78))
  );
  const bufferBlockHeight = Math.max(
    12,
    Math.min(28, Math.round((bufferUnits / maxReference) * 78))
  );

  return (
    <div className="relative w-full select-none">
      {/* Ambient Volumetric Electric Cobalt & Acid Lime Studio Spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-10 -bottom-6 cobalt-stage-glow rounded-full blur-2xl opacity-95"
      />

      {/* HTML Quantity Readouts Near the Two Pans (Outside SVG) */}
      <div className="relative z-10 grid grid-cols-2 gap-4 sm:gap-8 max-w-[780px] mx-auto px-2 sm:px-6 mb-1">
        {/* Left Pan Label: Available Stock */}
        <div className="flex flex-col items-start sm:items-center text-left sm:text-center bg-[#0A0F1D]/85 backdrop-blur-md border border-[#1558C9]/40 rounded-[14px] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full bg-[#D4FF24] shadow-[0_0_8px_#D4FF24]"
              aria-hidden="true"
            />
            <span className="text-[12px] sm:text-[13px] font-medium text-[#94A3B8]">
              {isPreviewing ? "Projected stock" : "Available stock"}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-[24px] sm:text-[32px] font-semibold tracking-tight text-[#F8FAFC] tabular-nums leading-none">
              {effectiveAvailableUnits}
            </span>
            <span className="text-[13px] font-medium text-[#94A3B8]">
              units
            </span>
          </div>
          <div className="min-h-[20px] mt-1">
            {isPreviewing && proposedOrderUnits > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D4FF24]/15 text-[#D4FF24] border border-[#D4FF24]/40 text-[11px] font-semibold tabular-nums">
                +{proposedOrderUnits} proposed order
              </span>
            ) : (
              <span className="text-[11px] text-[#94A3B8] tabular-nums">
                On-hand warehouse inventory
              </span>
            )}
          </div>
        </div>

        {/* Right Pan Label: Required Stock */}
        <div className="flex flex-col items-end sm:items-center text-right sm:text-center bg-[#0A0F1D]/85 backdrop-blur-md border border-[#1558C9]/40 rounded-[14px] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full bg-[#1558C9] shadow-[0_0_8px_#3B82F6]"
              aria-hidden="true"
            />
            <span className="text-[12px] sm:text-[13px] font-medium text-[#94A3B8]">
              Required stock
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-[24px] sm:text-[32px] font-semibold tracking-tight text-[#F8FAFC] tabular-nums leading-none">
              {requiredUnits}
            </span>
            <span className="text-[13px] font-medium text-[#94A3B8]">
              units
            </span>
          </div>
          <div className="min-h-[20px] mt-1">
            <span className="text-[11px] text-[#94A3B8] tabular-nums">
              {scenarioDemandUnits} forecast + {bufferUnits} buffer
            </span>
          </div>
        </div>
      </div>

      {/* Sculptural Balance Scale SVG Stage */}
      <div className="relative z-10 w-full h-[250px] sm:h-[310px] lg:h-[340px]">
        <svg
          viewBox="0 130 1000 435"
          className="w-full h-full overflow-visible"
          role="img"
          aria-label={`Balance scale comparing ${effectiveAvailableUnits} available units on the left pan against ${requiredUnits} required units on the right pan.`}
        >
          <defs>
            {/* Electric Cobalt & Obsidian Titanium Beam Gradient */}
            <linearGradient id="beamAluminum" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="28%" stopColor="#1E293B" />
              <stop offset="75%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#030407" />
            </linearGradient>

            {/* Darker Underside Depth */}
            <linearGradient id="beamUnderside" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1558C9" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1558C9" />
            </linearGradient>

            {/* Pedestal Column Gradient */}
            <linearGradient id="pedestalBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0A0F1D" />
              <stop offset="35%" stopColor="#1E293B" />
              <stop offset="50%" stopColor="#1558C9" />
              <stop offset="65%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#060913" />
            </linearGradient>

            {/* Pan Tray Gradient */}
            <linearGradient id="panSurface" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1E293B" />
            </linearGradient>

            {/* Available Stock Weight Block (Obsidian Cobalt) */}
            <linearGradient id="stockBlock" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            {/* Proposed Replenishment Block (Acid Lime #D4FF24) */}
            <linearGradient id="proposedBlock" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E5FF66" />
              <stop offset="100%" stopColor="#D4FF24" />
            </linearGradient>

            {/* Required Demand Weight Block (Electric Cobalt #1558C9) */}
            <linearGradient id="demandBlock" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1D6AE5" />
              <stop offset="100%" stopColor="#103E91" />
            </linearGradient>

            {/* Safety Buffer Cap */}
            <linearGradient id="bufferBlock" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#1558C9" />
            </linearGradient>

            {/* Cobalt Studio Floor Shadow */}
            <radialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1558C9" stopOpacity="0.42" />
              <stop offset="55%" stopColor="#030407" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#030407" stopOpacity="0" />
            </radialGradient>

            {/* Acid Lime Pivot Glow */}
            <radialGradient id="limePivotGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D4FF24" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#D4FF24" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 1. Ambient Cobalt Floor Shadow */}
          <ellipse
            cx="500"
            cy="530"
            rx="310"
            ry="24"
            fill="url(#floorShadow)"
          />

          {/* 2. Fixed Pedestal Assembly */}
          <g id="scale-pedestal">
            {/* Base Plinth Shadow */}
            <rect
              x="360"
              y="512"
              width="280"
              height="14"
              rx="7"
              fill="#050811"
              stroke="#1558C9"
              strokeOpacity="0.4"
            />
            {/* Stepped Titanium Base */}
            <rect
              x="384"
              y="494"
              width="232"
              height="20"
              rx="6"
              fill="url(#pedestalBody)"
              stroke="#3B82F6"
              strokeOpacity="0.35"
            />
            {/* Acid Lime Horizon Calibration Strip on Pedestal Base */}
            <rect
              x="445"
              y="502"
              width="110"
              height="3.5"
              rx="1.75"
              fill="#D4FF24"
            />
            {/* Tapered Central Column */}
            <path
              d="M472 248 L528 248 L548 494 L452 494 Z"
              fill="url(#pedestalBody)"
              stroke="#1558C9"
              strokeOpacity="0.45"
            />
            {/* Subtle Vertical Cobalt Spine */}
            <rect
              x="498"
              y="268"
              width="4"
              height="218"
              rx="2"
              fill="#3B82F6"
              opacity="0.55"
            />
            {/* Fulcrum Fork Cradle */}
            <path
              d="M466 250 C466 218, 534 218, 534 250 L524 274 L476 274 Z"
              fill="#0A0F1D"
              stroke="#1558C9"
              strokeWidth="1.5"
            />
          </g>

          {/* 3. Left Suspended Pan Assembly (Available Stock) */}
          <motion.g
            initial={false}
            animate={{ x: leftAttachX, y: leftAttachY }}
            transition={springTransition}
          >
            {/* Upper Shackle */}
            <circle cx="0" cy="0" r="6" fill="#0A0F1D" stroke="#3B82F6" strokeWidth="2" />
            {/* Vertical Suspension Rods */}
            <line
              x1="-74"
              y1={ROD_LENGTH}
              x2="0"
              y2="4"
              stroke="#3B82F6"
              strokeWidth="2.2"
              strokeOpacity="0.85"
            />
            <line
              x1="74"
              y1={ROD_LENGTH}
              x2="0"
              y2="4"
              stroke="#3B82F6"
              strokeWidth="2.2"
              strokeOpacity="0.85"
            />
            <line
              x1="0"
              y1={ROD_LENGTH}
              x2="0"
              y2="4"
              stroke="#94A3B8"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity="0.45"
            />

            {/* Weight Blocks on Left Pan */}
            {/* Current Available Stock Block */}
            <rect
              x="-66"
              y={ROD_LENGTH - availableBlockHeight}
              width="132"
              height={availableBlockHeight}
              rx="7"
              fill="url(#stockBlock)"
              stroke="#60A5FA"
              strokeWidth="1.2"
            />

            {/* Proposed Replenishment Block (Stacked on top when previewing) */}
            {isPreviewing && proposedOrderUnits > 0 && (
              <g>
                <rect
                  x="-66"
                  y={ROD_LENGTH - availableBlockHeight - proposedBlockHeight - 4}
                  width="132"
                  height={proposedBlockHeight}
                  rx="7"
                  fill="url(#proposedBlock)"
                  stroke="#F8FAFC"
                  strokeWidth="1.2"
                />
                <text
                  x="0"
                  y={
                    ROD_LENGTH -
                    availableBlockHeight -
                    proposedBlockHeight / 2 -
                    1
                  }
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#030407"
                  fontSize="13"
                  fontWeight="800"
                >
                  +{proposedOrderUnits}
                </text>
              </g>
            )}

            {/* Horizontal Pan Tray */}
            <rect
              x="-102"
              y={ROD_LENGTH}
              width="204"
              height="12"
              rx="6"
              fill="url(#panSurface)"
              stroke="#60A5FA"
              strokeWidth="1"
            />
            <rect
              x="-86"
              y={ROD_LENGTH + 12}
              width="172"
              height="5"
              rx="2.5"
              fill="#D4FF24"
              opacity="0.85"
            />
          </motion.g>

          {/* 4. Right Suspended Pan Assembly (Required Stock) */}
          <motion.g
            initial={false}
            animate={{ x: rightAttachX, y: rightAttachY }}
            transition={springTransition}
          >
            {/* Upper Shackle */}
            <circle cx="0" cy="0" r="6" fill="#0A0F1D" stroke="#3B82F6" strokeWidth="2" />
            {/* Vertical Suspension Rods */}
            <line
              x1="-74"
              y1={ROD_LENGTH}
              x2="0"
              y2="4"
              stroke="#3B82F6"
              strokeWidth="2.2"
              strokeOpacity="0.85"
            />
            <line
              x1="74"
              y1={ROD_LENGTH}
              x2="0"
              y2="4"
              stroke="#3B82F6"
              strokeWidth="2.2"
              strokeOpacity="0.85"
            />
            <line
              x1="0"
              y1={ROD_LENGTH}
              x2="0"
              y2="4"
              stroke="#94A3B8"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity="0.45"
            />

            {/* Weight Blocks on Right Pan */}
            {/* Scenario Demand Base Block */}
            <rect
              x="-66"
              y={ROD_LENGTH - demandBlockHeight}
              width="132"
              height={demandBlockHeight}
              rx="7"
              fill="url(#demandBlock)"
              stroke="#3B82F6"
              strokeWidth="1.2"
            />
            {/* Safety Buffer Cap Block */}
            <rect
              x="-66"
              y={ROD_LENGTH - demandBlockHeight - bufferBlockHeight - 3}
              width="132"
              height={bufferBlockHeight}
              rx="6"
              fill="url(#bufferBlock)"
              stroke="#93C5FD"
              strokeWidth="1"
            />

            {/* Horizontal Pan Tray */}
            <rect
              x="-102"
              y={ROD_LENGTH}
              width="204"
              height="12"
              rx="6"
              fill="url(#panSurface)"
              stroke="#60A5FA"
              strokeWidth="1"
            />
            <rect
              x="-86"
              y={ROD_LENGTH + 12}
              width="172"
              height="5"
              rx="2.5"
              fill="#1558C9"
            />
          </motion.g>

          {/* 5. Rotating Balance Beam (Rotates around explicit SVG pivot 500, 250) */}
          <motion.g
            initial={false}
            animate={{ rotate: angleDegrees }}
            transition={springTransition}
            style={{
              originX: "500px",
              originY: "250px",
              transformBox: "view-box",
            }}
          >
            {/* Broad Sculptural Beam Body */}
            <path
              d="M204 242 C204 235, 360 227, 500 227 C640 227, 796 235, 796 242 L790 258 C790 262, 640 266, 500 266 C360 266, 210 262, 210 258 Z"
              fill="url(#beamAluminum)"
              stroke="#60A5FA"
              strokeWidth="1.2"
            />
            {/* Illuminated Electric Cobalt Underside */}
            <path
              d="M214 256 L786 256 L782 263 L218 263 Z"
              fill="url(#beamUnderside)"
            />
            {/* Left & Right Terminal Nodes */}
            <circle
              cx={PIVOT_X - HALF_SPAN}
              cy={PIVOT_Y}
              r="9"
              fill="#0A0F1D"
              stroke="#D4FF24"
              strokeWidth="2.5"
            />
            <circle
              cx={PIVOT_X + HALF_SPAN}
              cy={PIVOT_Y}
              r="9"
              fill="#0A0F1D"
              stroke="#3B82F6"
              strokeWidth="2.5"
            />

            {/* Central Equilibrium Pointer Needle */}
            <path d="M500 186 L493 227 L507 227 Z" fill="#D4FF24" />
          </motion.g>

          {/* 6. Central Pivot Detail (Acid Lime Core inside Electric Cobalt Housing) */}
          <g id="scale-pivot-hub">
            <circle cx={PIVOT_X} cy={PIVOT_Y} r="36" fill="url(#limePivotGlow)" />
            <circle
              cx={PIVOT_X}
              cy={PIVOT_Y}
              r="22"
              fill="#0A0F1D"
              stroke="#1558C9"
              strokeWidth="2.5"
            />
            <circle cx={PIVOT_X} cy={PIVOT_Y} r="13" fill="#D4FF24" />
            <circle cx={PIVOT_X} cy={PIVOT_Y} r="5" fill="#030407" />
          </g>
        </svg>
      </div>
    </div>
  );
}
