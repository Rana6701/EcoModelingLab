// format.ts — display helpers (dates, numbers, risk colors).
import { format, parseISO } from "date-fns";
import type { RiskCategory, StationStatus } from "../types";

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return format(parseISO(iso), "d MMM yyyy, HH:mm"); } catch { return iso; }
}
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try { return format(parseISO(iso), "d MMM yyyy"); } catch { return iso; }
}
export function fmtDateRange(range: [string, string] | undefined): string {
  if (!range) return "—";
  return `${fmtDate(range[0])} – ${fmtDate(range[1])}`;
}
export function fmtNum(v: number | null | undefined, decimals = 2): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return v.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
}

export const RISK_COLOR: Record<RiskCategory, string> = {
  "Low Risk": "#10b981",
  "Moderate Risk": "#f59e0b",
  "High Risk": "#ef4444",
  "Insufficient Data": "#94a3b8",
};

export const RISK_TEXT: Record<RiskCategory, string> = {
  "Low Risk": "text-emerald-700",
  "Moderate Risk": "text-amber-700",
  "High Risk": "text-red-700",
  "Insufficient Data": "text-slate-500",
};

export const RISK_BG: Record<RiskCategory, string> = {
  "Low Risk": "bg-emerald-50 border-emerald-200",
  "Moderate Risk": "bg-amber-50 border-amber-200",
  "High Risk": "bg-red-50 border-red-200",
  "Insufficient Data": "bg-slate-50 border-slate-200",
};

export const STATUS_STYLE: Record<StationStatus, { dot: string; text: string; label: string }> = {
  Available: { dot: "bg-emerald-500", text: "text-emerald-700", label: "Available" },
  Warning: { dot: "bg-amber-500", text: "text-amber-700", label: "Warning" },
  Missing: { dot: "bg-slate-400", text: "text-slate-500", label: "Missing data" },
};
