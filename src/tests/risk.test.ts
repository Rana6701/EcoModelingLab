import { describe, it, expect } from "vitest";
import {
  variablePoints, categoryForScore, RISK_WEIGHTS, RISK_CATEGORIES,
} from "../config/riskConfig";
import type { Threshold } from "../types";

const th: Threshold = { p50: 2, p85: 6 };

describe("variablePoints scoring curve", () => {
  it("returns null for missing value or missing threshold", () => {
    expect(variablePoints("windSpeed", null, th)).toBeNull();
    expect(variablePoints("windSpeed", undefined, th)).toBeNull();
    expect(variablePoints("windSpeed", NaN, th)).toBeNull();
    expect(variablePoints("windSpeed", 5, null)).toBeNull();
  });

  it("adds zero points at or below p50", () => {
    expect(variablePoints("windSpeed", 1, th)).toBe(0);
    expect(variablePoints("windSpeed", 2, th)).toBe(0);
  });

  it("adds up to half the weight at p85", () => {
    // at p85 exactly => half weight
    const half = RISK_WEIGHTS.windSpeed * 0.5;
    expect(variablePoints("windSpeed", 6, th)).toBeCloseTo(half, 5);
  });

  it("ramps linearly between p50 and p85", () => {
    // midpoint (value 4) => quarter weight
    const quarter = RISK_WEIGHTS.windSpeed * 0.25;
    expect(variablePoints("windSpeed", 4, th)).toBeCloseTo(quarter, 5);
  });

  it("reaches full weight well above p85 and never exceeds it", () => {
    const full = RISK_WEIGHTS.windSpeed;
    expect(variablePoints("windSpeed", 100, th)).toBeCloseTo(full, 5);
    expect(variablePoints("windSpeed", 1e9, th)!).toBeLessThanOrEqual(full);
  });

  it("returns null for a variable with no weight", () => {
    expect(variablePoints("airTemp", 50, th)).toBeNull();
  });
});

describe("categoryForScore boundaries", () => {
  it("maps null/NaN to Insufficient Data", () => {
    expect(categoryForScore(null)).toBe("Insufficient Data");
    expect(categoryForScore(NaN)).toBe("Insufficient Data");
  });
  it("classifies low/moderate/high at the documented cut-points", () => {
    expect(categoryForScore(0)).toBe("Low Risk");
    expect(categoryForScore(33.9)).toBe("Low Risk");
    expect(categoryForScore(34)).toBe("Moderate Risk");
    expect(categoryForScore(66.9)).toBe("Moderate Risk");
    expect(categoryForScore(67)).toBe("High Risk");
    expect(categoryForScore(100)).toBe("High Risk");
  });
  it("clamps above-range scores to High Risk", () => {
    expect(categoryForScore(150)).toBe("High Risk");
  });
  it("weights sum to 100", () => {
    const sum = Object.values(RISK_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });
  it("categories are contiguous and ordered", () => {
    expect(RISK_CATEGORIES[0].label).toBe("Low Risk");
    expect(RISK_CATEGORIES[RISK_CATEGORIES.length - 1].label).toBe("High Risk");
  });
});
