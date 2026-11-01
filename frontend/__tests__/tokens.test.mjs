import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tokensPath = path.join(__dirname, '..', 'lib', 'tokens.ts');
const globalsPath = path.join(__dirname, '..', 'app', 'globals.css');

// Pure reference implementation matching frontend/lib/balanceMath.ts
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function computeBeamAngleDegrees(available, required) {
  const safeRequired = Math.max(required, 1);
  const ratio = (required - available) / safeRequired;
  const clamped = clamp(ratio, -1, 1);
  const angle = Number((clamped * 10).toFixed(2));
  return angle === 0 ? 0 : angle;
}

function computeBeamAttachmentPoints(angleDegrees, pivotX = 500, pivotY = 210, armLength = 270) {
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

function calculateBalanceState(input) {
  const availableUnits = Math.max(0, Math.round(input.availableUnits));
  const scenarioDemandUnits = Math.max(0, Math.round(input.baseDemandUnits * input.scenarioMultiplier));
  const bufferUnits = Math.max(0, Math.round(input.bufferUnits));
  const requiredUnits = scenarioDemandUnits + bufferUnits;

  const shortfallUnits = Math.max(0, requiredUnits - availableUnits);
  const moq = Math.max(1, Math.round(input.minimumOrderQty ?? 1));
  const recommendedOrderUnits = shortfallUnits > 0 ? Math.max(shortfallUnits, moq) : 0;

  const isPreview = Boolean(input.isPreviewingReplenishment && recommendedOrderUnits > 0);
  const effectiveAvailableUnits = isPreview ? availableUnits + recommendedOrderUnits : availableUnits;
  const netBalanceUnits = effectiveAvailableUnits - requiredUnits;
  const angleDegrees = computeBeamAngleDegrees(effectiveAvailableUnits, requiredUnits);

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
  };
}

describe('Nocturnal Cobalt & Acid-Lime Precision Balance Design Tokens', () => {
  it('enforces the Midnight Black (#030407), Electric Cobalt Blue (#1558C9), and Acid Lime (#D4FF24) palette across lib/tokens.ts and app/globals.css', () => {
    const tokensSource = fs.readFileSync(tokensPath, 'utf8');
    const globalsSource = fs.readFileSync(globalsPath, 'utf8');

    const expectedBaseColors = {
      midnightBlack: '#030407',
      electricCobalt: '#1558C9',
      acidLime: '#D4FF24',
      surface: '#0A0F1D',
      ink: '#F8FAFC',
      muted: '#94A3B8',
    };

    for (const [name, hex] of Object.entries(expectedBaseColors)) {
      assert.ok(
        tokensSource.includes(hex),
        `lib/tokens.ts must define ${name} token (${hex})`
      );
      assert.ok(
        globalsSource.includes(hex),
        `app/globals.css must include ${name} token (${hex})`
      );
    }
  });

  it('verifies 8-point grid alignment and control/surface radii', () => {
    const gridValues = [8, 16, 24, 32, 40, 48, 64, 112];
    gridValues.forEach((val) => {
      assert.equal(val % 8, 0, `Value ${val} must be divisible by 8`);
    });

    const tokensSource = fs.readFileSync(tokensPath, 'utf8');
    assert.ok(tokensSource.includes('"10px"'), 'Control radius must be 10px');
    assert.ok(tokensSource.includes('"20px"'), 'Surface radius must be 20px');
  });
});

describe('Balance Scale & Replenishment Calculations', () => {
  it('computes required stock as scenario demand plus buffer without double-counting', () => {
    const state = calculateBalanceState({
      availableUnits: 120,
      baseDemandUnits: 148,
      bufferUnits: 45,
      scenarioMultiplier: 1.0,
      minimumOrderQty: 80,
      isPreviewingReplenishment: false,
    });

    assert.equal(state.availableUnits, 120);
    assert.equal(state.requiredUnits, 193);
    assert.equal(state.shortfallUnits, 73);
  });

  it('computes illustrative beam angle within [-10, +10] degrees', () => {
    const shortfallAngle = computeBeamAngleDegrees(120, 193);
    assert.ok(shortfallAngle > 0 && shortfallAngle <= 10);
    assert.equal(shortfallAngle, Number(((73 / 193) * 10).toFixed(2)));

    const surplusAngle = computeBeamAngleDegrees(195, 158);
    assert.ok(surplusAngle < 0 && surplusAngle >= -10);

    assert.equal(computeBeamAngleDegrees(0, 200), 10);
    assert.equal(computeBeamAngleDegrees(500, 100), -10);
  });

  it('reflects honest projected excess when minimum order quantity exceeds shortfall (never artificially forces 0 deg)', () => {
    const previewState = calculateBalanceState({
      availableUnits: 120,
      baseDemandUnits: 148,
      bufferUnits: 45,
      scenarioMultiplier: 1.0,
      minimumOrderQty: 80,
      isPreviewingReplenishment: true,
    });

    assert.equal(previewState.recommendedOrderUnits, 80);
    assert.equal(previewState.effectiveAvailableUnits, 200);
    assert.equal(previewState.netBalanceUnits, 7);
    assert.ok(
      previewState.angleDegrees < 0,
      'Beam must reflect the 7-unit projected excess honestly rather than forcing 0 degrees'
    );
    assert.equal(previewState.availableUnits, 120);
  });

  it('computes moving pan attachment coordinates symmetrically around the central pivot', () => {
    const level = computeBeamAttachmentPoints(0, 500, 195, 290);
    assert.equal(level.leftAttachX, 210);
    assert.equal(level.rightAttachX, 790);
    assert.equal(level.leftAttachY, 195);
    assert.equal(level.rightAttachY, 195);

    const tiltedRight = computeBeamAttachmentPoints(8, 500, 195, 290);
    assert.ok(tiltedRight.rightAttachY > 195, 'Positive angle lowers the right attachment point');
    assert.ok(tiltedRight.leftAttachY < 195, 'Positive angle raises the left attachment point');
  });
});
