import { describe, it, expect } from "vitest";
import {
  knotsToMs, kmhToMs, cmsToMs, mmToM, fahrenheitToCelsius, formatValue, VARIABLES,
} from "../config/unitsConfig";

describe("documented unit conversions", () => {
  it("knots → m/s", () => {
    expect(knotsToMs(1)).toBeCloseTo(0.514444, 5);
    expect(knotsToMs(0)).toBe(0);
  });
  it("km/h → m/s", () => {
    expect(kmhToMs(3.6)).toBeCloseTo(1, 6);
  });
  it("cm/s → m/s", () => {
    expect(cmsToMs(100)).toBe(1);
    expect(cmsToMs(50)).toBeCloseTo(0.5, 6);
  });
  it("mm → m", () => {
    expect(mmToM(1000)).toBe(1);
  });
  it("°F → °C reference points", () => {
    expect(fahrenheitToCelsius(32)).toBeCloseTo(0, 6);
    expect(fahrenheitToCelsius(212)).toBeCloseTo(100, 6);
    expect(fahrenheitToCelsius(98.6)).toBeCloseTo(37, 1);
  });
});

describe("variable metadata integrity", () => {
  it("flags Bteha/Zemah wind unit as assumed", () => {
    expect(VARIABLES.windSpeed.unitStatus).toBe("assumed");
  });
  it("every variable has a label, short label and unit", () => {
    for (const v of Object.values(VARIABLES)) {
      expect(v.label.length).toBeGreaterThan(0);
      expect(v.short.length).toBeGreaterThan(0);
      expect(typeof v.unit).toBe("string");
    }
  });
});

describe("formatValue", () => {
  it("renders an em dash for missing values", () => {
    expect(formatValue(null, VARIABLES.windSpeed)).toBe("—");
    expect(formatValue(undefined, VARIABLES.windSpeed)).toBe("—");
    expect(formatValue(NaN, VARIABLES.windSpeed)).toBe("—");
  });
  it("respects decimal precision and appends the unit", () => {
    expect(formatValue(3.14159, VARIABLES.windSpeed)).toBe("3.1 m/s");
    expect(formatValue(0.123, VARIABLES.waveHeight)).toBe("0.12 m");
    expect(formatValue(271, VARIABLES.windDir)).toBe("271 °");
  });
});
