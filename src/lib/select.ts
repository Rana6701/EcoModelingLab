// select.ts — pure helpers to slice the processed timeseries for charts,
// respecting the selected station, variable, aggregation and date range.
import type { SeriesBlock, StationSeries, TimeSeries, VariableKey } from "../types";

export type Aggregation = "hourly" | "daily";

export interface ChartPoint { t: string; value: number | null; }

export function getBlock(ts: TimeSeries, stationId: string, agg: Aggregation): SeriesBlock | null {
  const s: StationSeries | undefined = ts[stationId];
  if (!s) return null;
  return agg === "hourly" ? s.hourly : s.daily;
}

export function seriesFor(
  ts: TimeSeries,
  stationId: string,
  variable: VariableKey,
  agg: Aggregation,
  range?: [string, string]
): ChartPoint[] {
  const block = getBlock(ts, stationId, agg);
  if (!block) return [];
  const stamps = block.timestamps as string[];
  const values = (block[variable] as (number | null)[]) ?? [];
  const out: ChartPoint[] = [];
  for (let i = 0; i < stamps.length; i++) {
    const t = stamps[i];
    if (range && (t < range[0] || t > range[1])) continue;
    out.push({ t, value: values[i] ?? null });
  }
  return out;
}

/** Stations that actually expose a given variable in the timeseries. */
export function stationsWithVariable(ts: TimeSeries, variable: VariableKey): string[] {
  return Object.keys(ts).filter((id) => ts[id].vars.includes(variable));
}
