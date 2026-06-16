import { describe, it, expect } from "vitest";
import { parseNumber } from "../lib/parse";
import { seriesFor } from "../lib/select";
import type { TimeSeries } from "../types";

// A tiny synthetic timeseries exercising the missing-value contract end to end.
const ts: TimeSeries = {
  demo: {
    vars: ["windSpeed"],
    daily: {
      timestamps: ["2024-01-01T00:00:00", "2024-01-02T00:00:00", "2024-01-03T00:00:00"],
      windSpeed: [1.5, null, 3.0],
    },
    hourly: { timestamps: [], windSpeed: [] },
  },
};

describe("missing values propagate as null, never as fabricated numbers", () => {
  it("parseNumber never invents a value for a gap", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("-")).toBeNull();
  });

  it("seriesFor preserves nulls rather than dropping or zero-filling them", () => {
    const pts = seriesFor(ts, "demo", "windSpeed", "daily");
    expect(pts).toHaveLength(3);
    expect(pts[1].value).toBeNull(); // the gap stays a gap
    expect(pts[0].value).toBe(1.5);
    expect(pts[2].value).toBe(3.0);
  });

  it("returns an empty array for an unknown station (no data available)", () => {
    expect(seriesFor(ts, "nope", "windSpeed", "daily")).toEqual([]);
  });

  it("respects an optional date-range filter", () => {
    const pts = seriesFor(ts, "demo", "windSpeed", "daily",
      ["2024-01-02T00:00:00", "2024-01-03T00:00:00"]);
    expect(pts).toHaveLength(2);
    expect(pts[0].value).toBeNull();
  });
});
