/**
 * Mercato AI — Balance Scale & Replenishment Calculation Module
 *
 * Pure functions separated from SVG presentation for deterministic behavior
 * and unit testing.
 */

export interface BalanceScenarioInput {
  /** Current on-hand stock in units */
  availableUnits: number;
  /** Baseline lead-time demand in units */
  baseDemandUnits: number;
  /** Safety stock buffer in units (not already included in baseDemandUnits) */
  bufferUnits: number;
  /** Demand scenario multiplier (e.g., 1.0 = expected, 1.25 = +25% seasonal peak) */
  scenarioMultiplier: number;
  /** Minimum order quantity enforced by supplier */
  minimumOrderQty?: number;
  /** Whether the user is previewing replenishment on the scale */
  isPreviewingReplenishment?: boolean;
}

export interface BalanceComputationResult {
  /** Available on-hand stock (never altered by drafting a PO) */
  availableUnits: number;
  /** Scenario demand (rounded integer units) */
  scenarioDemandUnits: number;
  /** Safety buffer (rounded integer units) */
  bufferUnits: number;
  /** Required stock = scenario demand + buffer */
  requiredUnits: number;
  /** Shortfall = max(0, required - available) */
  shortfallUnits: number;
  /** Recommended order quantity accounting for shortfall and minimum order quantity */
  recommendedOrderUnits: number;
  /** Effective available units shown on the left pan (includes proposed order only in preview mode) */
  effectiveAvailableUnits: number;
  /** Projected excess or shortfall after previewing replenishment (effectiveAvailable - required) */
  netBalanceUnits: number;
  /**
   * Illustrative beam angle in degrees:
   * clamp((required - effectiveAvailable) / max(required, 1), -1, 1) * 10
   * Positive angle lowers the right (required-stock) pan.
   * Negative angle lowers the left (available-stock) pan.
   */
  angleDegrees: number;
  /** Readable status state */
  status: "SHORTFALL" | "BALANCED" | "SURPLUS" | "PROJECTED_BALANCED" | "PROJECTED_SURPLUS";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Computes illustrative beam angle in degrees:
 * clamp((required - available) / max(required, 1), -1, 1) * 10
 */
export function computeBeamAngleDegrees(available: number, required: number): number {
  const safeRequired = Math.max(required, 1);
  const ratio = (required - available) / safeRequired;
  const clamped = clamp(ratio, -1, 1);
  // Avoid -0
  const angle = Number((clamped * 10).toFixed(2));
  return angle === 0 ? 0 : angle;
}

/**
 * Computes moving attachment coordinates for the left and right pans
 * from the central pivot and beam angle so suspension rods remain strictly
 * vertical and pans remain strictly horizontal.
 */
export interface BeamGeometry {
  pivotX: number;
  pivotY: number;
  armLength: number;
  leftAttachX: number;
  leftAttachY: number;
  rightAttachX: number;
  rightAttachY: number;
}

export function computeBeamAttachmentPoints(
  angleDegrees: number,
  pivotX = 500,
  pivotY = 210,
  armLength = 270
): BeamGeometry {
  const rad = (angleDegrees * Math.PI) / 180;
  const dx = armLength * Math.cos(rad);
  const dy = armLength * Math.sin(rad);

  return {
    pivotX,
    pivotY,
    armLength,
    leftAttachX: Number((pivotX - dx).toFixed(2)),
    leftAttachY: Number((pivotY - dy).toFixed(2)),
    rightAttachX: Number((pivotX + dx).toFixed(2)),
    rightAttachY: Number((pivotY + dy).toFixed(2)),
  };
}

/**
 * Computes the complete balance state for a product and demand scenario.
 */
export function calculateBalanceState(input: BalanceScenarioInput): BalanceComputationResult {
  const availableUnits = Math.max(0, Math.round(input.availableUnits));
  const scenarioDemandUnits = Math.max(0, Math.round(input.baseDemandUnits * input.scenarioMultiplier));
  const bufferUnits = Math.max(0, Math.round(input.bufferUnits));
  const requiredUnits = scenarioDemandUnits + bufferUnits;

  const shortfallUnits = Math.max(0, requiredUnits - availableUnits);
  const moq = Math.max(1, Math.round(input.minimumOrderQty ?? 1));

  const recommendedOrderUnits =
    shortfallUnits > 0 ? Math.max(shortfallUnits, moq) : 0;

  const isPreview = Boolean(input.isPreviewingReplenishment && recommendedOrderUnits > 0);
  const effectiveAvailableUnits = isPreview
    ? availableUnits + recommendedOrderUnits
    : availableUnits;

  const netBalanceUnits = effectiveAvailableUnits - requiredUnits;
  const angleDegrees = computeBeamAngleDegrees(effectiveAvailableUnits, requiredUnits);

  let status: BalanceComputationResult["status"];
  if (isPreview) {
    status = netBalanceUnits > 0 ? "PROJECTED_SURPLUS" : "PROJECTED_BALANCED";
  } else if (shortfallUnits > 0) {
    status = "SHORTFALL";
  } else if (netBalanceUnits > 0) {
    status = "SURPLUS";
  } else {
    status = "BALANCED";
  }

  return {
    availableUnits,
    scenarioDemandUnits,
    bufferUnits,
    requiredUnits,
    shortfallUnits,
    recommendedOrderUnits,
    effectiveAvailableUnits,
    netBalanceUnits,
    angleDegrees,
    status,
  };
}
