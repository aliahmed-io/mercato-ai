/**
 * Mercato AI — Design Tokens & Type Scale
 *
 * Visual Direction: Nocturnal Cobalt & Acid-Lime Precision Kinetic Studio
 * Core Palette:
 * - Midnight Black (#030407): Primary obsidian stage & dark ink on Acid Lime CTAs
 * - Electric Cobalt Blue (#1558C9): Volumetric illumination, demand curves, and structural accents
 * - Acid Lime (#D4FF24): High-voltage primary action, equilibrium signal, and replenishment poise
 */

export const COLORS = {
  /** Core User Palette */
  midnightBlack: "#030407",
  electricCobalt: "#1558C9",
  acidLime: "#D4FF24",

  /** Base 6 Design System Tokens */
  canvas: "#030407",
  surface: "#0A0F1D",
  ink: "#F8FAFC",
  muted: "#94A3B8",
  accent: "#D4FF24",
  metal: "#1E293B",

  /** Derived Surface & Interactive States */
  canvasSubtle: "#070B14",
  surfaceElevated: "#10192E",
  cobaltBright: "#3B82F6",
  cobaltSoft: "rgba(21, 88, 201, 0.18)",
  cobaltBorder: "rgba(21, 88, 201, 0.38)",
  accentHover: "#E2FF54",
  accentSoft: "rgba(212, 255, 36, 0.12)",
  accentBorder: "rgba(212, 255, 36, 0.35)",
  metalLight: "#334155",
  metalDark: "#0F172A",

  /** Semantic Status Tokens (Always paired with explicit text & icon) */
  statusSafeText: "#D4FF24",
  statusSafeBg: "rgba(212, 255, 36, 0.10)",
  statusSafeBorder: "rgba(212, 255, 36, 0.32)",

  statusWarningText: "#FBBF24",
  statusWarningBg: "rgba(251, 191, 36, 0.12)",
  statusWarningBorder: "rgba(251, 191, 36, 0.35)",

  statusCriticalText: "#FB7185",
  statusCriticalBg: "rgba(251, 113, 133, 0.12)",
  statusCriticalBorder: "rgba(251, 113, 133, 0.38)",
} as const;

export type ColorToken = keyof typeof COLORS;

/**
 * 8pt Grid Spacing Tokens (in rem / px equivalents)
 */
export const SPACING = {
  xs: "0.25rem",   // 4px
  sm: "0.5rem",    // 8px  (1x 8pt)
  md: "1rem",      // 16px (2x 8pt)
  lg: "1.5rem",    // 24px (3x 8pt)
  xl: "2rem",      // 32px (4x 8pt)
  "2xl": "2.5rem", // 40px (5x 8pt)
  "3xl": "3rem",   // 48px (6x 8pt)
  "4xl": "4rem",   // 64px (8x 8pt - mobile section spacing)
  "5xl": "7rem",   // 112px (14x 8pt - desktop section spacing)
} as const;

export type SpacingToken = keyof typeof SPACING;

/**
 * Layout & Radius Tokens
 */
export const LAYOUT = {
  maxWidth: "1280px",
  paddingDesktop: "48px",
  paddingTablet: "32px",
  paddingMobile: "20px",
  sectionSpacingDesktop: "112px",
  sectionSpacingMobile: "64px",
} as const;

export const RADII = {
  control: "10px",
  surface: "20px",
  pill: "9999px",
} as const;

export type RadiusToken = keyof typeof RADII;

/**
 * Motion Durations & Spring Physics
 * Transform & opacity only; respects prefers-reduced-motion.
 */
export const MOTION = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  scaleSpring: {
    type: "spring" as const,
    stiffness: 100,
    damping: 22,
  },
} as const;
