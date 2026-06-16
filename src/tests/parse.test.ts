import { describe, it, expect } from "vitest";
import { parseNumber, parseToa5, normalizeColumnName, NA_TOKENS } from "../lib/parse";

describe("parseNumber missing-value handling", () => {
  it("treats documented NA tokens as null", () => {
    for (const tok of ["", "-", "NaN", "NAN", "na", "N/A", "null", "none"]) {
      expect(parseNumber(tok)).toBeNull();
    }
  });
  it("parses real numbers including negatives and decimals", () => {
    expect(parseNumber("3.5")).toBe(3.5);
    expect(parseNumber("-12")).toBe(-12);
    expect(parseNumber(" 42 ")).toBe(42);
    expect(parseNumber(7)).toBe(7);
  });
  it("rejects non-numeric strings and non-finite numbers", () => {
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber(Infinity)).toBeNull();
    expect(parseNumber(null)).toBeNull();
    expect(parseNumber(undefined)).toBeNull();
  });
  it("NA_TOKENS contains the dash token used by the meteo CSVs", () => {
    expect(NA_TOKENS.has("-")).toBe(true);
  });
});

describe("parseToa5 (Campbell TOA5 .dat)", () => {
  const sample = [
    '"TOA5","CR1000","CR1000","1234","CR1000.Std","prog","sig","Table1"',
    '"TIMESTAMP","RECORD","AirTC_Avg","RH","WS_ms_Avg"',
    '"TS","RN","Deg C","%","meters/second"',
    '"","","Avg","Smp","Avg"',
    '"2024-01-01 00:00:00",0,12.5,80,3.2',
    '"2024-01-01 00:10:00",1,12.6,"NAN",3.4',
  ].join("\n");

  it("extracts the four header rows", () => {
    const r = parseToa5(sample);
    expect(r.columns).toEqual(["TIMESTAMP", "RECORD", "AirTC_Avg", "RH", "WS_ms_Avg"]);
    expect(r.units[2]).toBe("Deg C");
    expect(r.aggregations[2]).toBe("Avg");
    expect(r.meta[0]).toBe("TOA5");
  });
  it("parses data rows, keeping timestamp as string and numbers as numbers", () => {
    const r = parseToa5(sample);
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0][0]).toBe("2024-01-01 00:00:00");
    expect(r.rows[0][2]).toBe(12.5);
  });
  it("maps the NAN token to null", () => {
    const r = parseToa5(sample);
    expect(r.rows[1][3]).toBeNull();
  });
  it("returns empty structure for too-short input", () => {
    const r = parseToa5("only\ntwo\nlines");
    expect(r.columns).toEqual([]);
    expect(r.rows).toEqual([]);
  });
});

describe("normalizeColumnName header mapping", () => {
  it("maps the various wind-speed spellings", () => {
    expect(normalizeColumnName("ws_B")).toBe("windSpeed");
    expect(normalizeColumnName("Ws_Z")).toBe("windSpeed");
    expect(normalizeColumnName("WS_ms_Avg")).toBe("windSpeed");
  });
  it("maps wave and current columns", () => {
    expect(normalizeColumnName("Hs (m)")).toBe("waveHeight");
    expect(normalizeColumnName("Magnitude [cm/s]")).toBe("currentMag");
    expect(normalizeColumnName("Depth(mm)")).toBe("sensorDepth");
  });
  it("returns null for unknown headers", () => {
    expect(normalizeColumnName("mystery_column")).toBeNull();
  });
});
