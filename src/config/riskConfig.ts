// =====================================================================
// riskConfig.ts — SINGLE SOURCE OF TRUTH for the ecological risk model.
//
// Thresholds are DATA-DRIVEN (computed from observed percentiles during
// preprocessing and stored in /data/processed/risk.json). The *structure*
// of the model — which variables contribute, their weights, the scoring
// curve, and the category cut-points — lives here and nowhere else.
//
// No thresholds or weights are hard-coded inside UI components.
// =====================================================================

import type { RiskCategory, Threshold, VariableKey } from "../types";

export const RISK_VERSION = "1.0.0";

/** Maximum points each verified variable can contribute (sum = 100). */
export const RISK_WEIGHTS: Record<string, number> = {
  windSpeed: 30,
  waveHeight: 35,
  currentMag: 20,
  rainfall: 15,
};

/** Category cut-points on the 0–100 score. */
export const RISK_CATEGORIES: { label: RiskCategory; min: number; max: number }[] = [
  { label: "Low Risk", min: 0, max: 33.999 },
  { label: "Moderate Risk", min: 34, max: 66.999 },
  { label: "High Risk", min: 67, max: 100 },
];

export const VARIABLE_LABELS: Record<string, string> = {
  windSpeed: "wind speed",
  waveHeight: "wave height",
  currentMag: "current magnitude",
  rainfall: "rainfall",
};

export function categoryForScore(score: number | null): RiskCategory {
  if (score === null || Number.isNaN(score)) return "Insufficient Data";
  for (const c of RISK_CATEGORIES) if (score >= c.min && score <= c.max) return c.label;
  return "High Risk";
}

/**
 * Points contributed by one variable, given the data-driven thresholds.
 * Curve: 0 below p50 → up to half-weight by p85 → up to full weight above p85.
 * Mirrors scripts/preprocess.py exactly so client and pipeline agree.
 */
export function variablePoints(
  variable: VariableKey,
  value: number | null | undefined,
  threshold: Threshold | null | undefined
): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  if (!threshold) return null;
  const w = RISK_WEIGHTS[variable];
  if (w === undefined) return null;
  const { p50, p85 } = threshold;
  if (value <= p50) return 0;
  if (value <= p85) {
    return round2((w * 0.5 * (value - p50)) / Math.max(p85 - p50, 1e-9));
  }
  const extra = Math.min((value - p85) / Math.max(p85 - p50, 1e-9), 1);
  return round2(w * (0.5 + 0.5 * extra));
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}
