// =====================================================================
// parse.ts — parsing utilities shared by the in-app importer and tests.
//  * parseNumber: missing-value-safe numeric coercion
//  * parseToa5:   Campbell Scientific TOA5 (.dat) parser
//  * normalizeColumnName: maps source headers to canonical variable keys
// =====================================================================

import type { VariableKey } from "../types";

/** Tokens that represent missing values across the source files. */
export const NA_TOKENS = new Set(["", "-", "nan", "na", "n/a", "null", "none"]);

/**
 * Coerce a raw cell to a number, treating documented NA tokens as missing.
 * Returns null for anything that is not a finite number.
 */
export function parseNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const s = String(raw).trim();
  if (NA_TOKENS.has(s.toLowerCase())) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export interface Toa5Result {
  /** environment line fields (file format, logger, table, ...). */
  meta: string[];
  /** canonical column names (row 2). */
  columns: string[];
  /** unit per column (row 3). */
  units: string[];
  /** aggregation per column (row 4): Avg / Min / Max / Smp / Tot. */
  aggregations: string[];
  /** data rows aligned to `columns`. */
  rows: (string | number | null)[][];
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

/**
 * Parse a Campbell Scientific TOA5 .dat file (used by the Ein Gev station).
 * Structure: line1 = environment metadata, line2 = field names,
 * line3 = units, line4 = aggregation type, line5+ = data.
 */
export function parseToa5(text: string): Toa5Result {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 5) {
    return { meta: [], columns: [], units: [], aggregations: [], rows: [] };
  }
  const meta = splitCsvLine(lines[0]).map(unquote);
  const columns = splitCsvLine(lines[1]).map(unquote);
  const units = splitCsvLine(lines[2]).map(unquote);
  const aggregations = splitCsvLine(lines[3]).map(unquote);
  const rows: (string | number | null)[][] = [];
  for (let i = 4; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]).map(unquote);
    rows.push(
      cells.map((c, idx) => (idx === 0 ? c : parseNumber(c)))
    );
  }
  return { meta, columns, units, aggregations, rows };
}

function unquote(s: string): string {
  const t = s.trim();
  if (t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1);
  return t;
}

/** Maps the many source header spellings to canonical variable keys. */
const COLUMN_MAP: Record<string, VariableKey> = {
  // wind speed
  ws_b: "windSpeed", ws_z: "windSpeed", ws_ms_avg: "windSpeed", ws: "windSpeed",
  // wind direction
  wd: "windDir", wd_z: "windDir", winddir: "windDir",
  // air temperature
  td_b: "airTemp", ta_z: "airTemp", airtc_avg: "airTemp",
  // humidity
  rh: "humidity", rh_z: "humidity", rh_max: "humidity",
  // rainfall
  rain: "rainfall", rain_z: "rainfall", rain_mm_tot: "rainfall",
  // waves
  "hs (m)": "waveHeight", "tp (sec)": "wavePeriod", "dirpeak(deg)": "waveDir",
  "depth(mm)": "sensorDepth",
  // currents
  "magnitude [cm/s]": "currentMag", "direction [degrees]": "currentDir",
};

export function normalizeColumnName(header: string): VariableKey | null {
  return COLUMN_MAP[header.trim().toLowerCase()] ?? null;
}
