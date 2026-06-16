// =====================================================================
// timeAlign.ts — align two time-stamped series by exact timestamp before
// running paired statistics. Mirrors the inner-join the preprocessor uses.
// =====================================================================

export interface TimedPoint {
  timestamp: string; // ISO
  value: number | null;
}

export interface AlignedPair {
  timestamps: string[];
  a: number[];
  b: number[];
  n: number;
}

/** Round an ISO timestamp down to the start of its hour (for hourly alignment). */
export function floorToHour(iso: string): string {
  const d = new Date(iso);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 19);
}

/**
 * Inner-join two series on identical timestamps, keeping only pairs where
 * BOTH values are present (non-null, finite). This guarantees aligned,
 * complete pairs for Pearson/Spearman/regression.
 */
export function alignByTimestamp(seriesA: TimedPoint[], seriesB: TimedPoint[]): AlignedPair {
  const mapB = new Map<string, number>();
  for (const p of seriesB) {
    if (p.value !== null && Number.isFinite(p.value)) mapB.set(p.timestamp, p.value);
  }
  const timestamps: string[] = [];
  const a: number[] = [];
  const b: number[] = [];
  for (const p of seriesA) {
    if (p.value === null || !Number.isFinite(p.value)) continue;
    const bv = mapB.get(p.timestamp);
    if (bv === undefined) continue;
    timestamps.push(p.timestamp);
    a.push(p.value);
    b.push(bv);
  }
  return { timestamps, a, b, n: timestamps.length };
}
