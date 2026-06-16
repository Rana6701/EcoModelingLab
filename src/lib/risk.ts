// =====================================================================
// risk.ts — client-side risk computation. Uses the weights/curve from
// riskConfig.ts and the data-driven thresholds loaded from risk.json.
// Identical logic to scripts/preprocess.py so results match the pipeline.
// =====================================================================

import {
  RISK_WEIGHTS,
  VARIABLE_LABELS,
  categoryForScore,
  variablePoints,
} from "../config/riskConfig";
import type { RiskResult, Threshold, VariableKey } from "../types";

export type RiskInputs = Partial<Record<VariableKey, number | null>>;
export type ThresholdMap = Record<string, Threshold | null>;

/**
 * Compute a transparent rule-based risk result from verified inputs.
 * Returns "Insufficient Data" when no verified variable is available.
 */
export function computeRisk(inputs: RiskInputs, thresholds: ThresholdMap): RiskResult {
  const contributions: RiskResult["contributions"] = [];
  let total = 0;
  let available = 0;

  for (const variable of Object.keys(RISK_WEIGHTS) as VariableKey[]) {
    const value = inputs[variable];
    const pts = variablePoints(variable, value, thresholds[variable]);
    if (pts === null) continue;
    available += 1;
    total += pts;
    if (pts > 0) {
      const label = VARIABLE_LABELS[variable] ?? variable;
      contributions.push({
        variable,
        value: value ?? null,
        points: pts,
        text: `Elevated ${label} contributed ${trim(pts)} points`,
      });
    }
  }

  if (available === 0) {
    return { score: null, category: "Insufficient Data", contributions: [], inputsUsed: 0 };
  }

  const score = Math.round(Math.min(total, 100) * 10) / 10;
  contributions.sort((x, y) => y.points - x.points);
  return { score, category: categoryForScore(score), contributions, inputsUsed: available };
}

function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n);
}
