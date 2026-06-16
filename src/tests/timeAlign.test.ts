import { describe, it, expect } from "vitest";
import { floorToHour, alignByTimestamp, type TimedPoint } from "../lib/timeAlign";

describe("floorToHour", () => {
  it("zeroes minutes and seconds", () => {
    const out = floorToHour("2024-03-01T13:47:35");
    // Result is timezone-dependent in absolute terms, but must land on an exact hour.
    expect(out.endsWith(":00:00")).toBe(true);
  });
  it("is idempotent", () => {
    const once = floorToHour("2024-03-01T13:47:35");
    expect(floorToHour(once)).toBe(once);
  });
  it("maps two timestamps within the same hour to the same value", () => {
    expect(floorToHour("2024-03-01T13:05:00")).toBe(floorToHour("2024-03-01T13:55:00"));
  });
});

describe("alignByTimestamp inner join", () => {
  const pt = (timestamp: string, value: number | null): TimedPoint => ({ timestamp, value });

  it("keeps only shared timestamps where both values are present", () => {
    const a = [pt("t1", 1), pt("t2", 2), pt("t3", 3)];
    const b = [pt("t2", 20), pt("t3", 30), pt("t4", 40)];
    const r = alignByTimestamp(a, b);
    expect(r.n).toBe(2);
    expect(r.timestamps).toEqual(["t2", "t3"]);
    expect(r.a).toEqual([2, 3]);
    expect(r.b).toEqual([20, 30]);
  });

  it("drops pairs with a null on either side", () => {
    const a = [pt("t1", null), pt("t2", 2)];
    const b = [pt("t1", 10), pt("t2", null)];
    const r = alignByTimestamp(a, b);
    expect(r.n).toBe(0);
    expect(r.a).toEqual([]);
  });

  it("returns an empty aligned pair when there is no timestamp overlap", () => {
    const r = alignByTimestamp([pt("a", 1)], [pt("b", 2)]);
    expect(r.n).toBe(0);
    expect(r.timestamps).toEqual([]);
  });

  it("ignores non-finite values", () => {
    const r = alignByTimestamp([pt("t", Infinity)], [pt("t", 5)]);
    expect(r.n).toBe(0);
  });
});
