import type { RiskCategory, StationStatus } from "../types";
import { RISK_COLOR, STATUS_STYLE } from "../lib/format";

export function StatusBadge({ status }: { status: StationStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.text}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function RiskBadge({ category, score }: { category: RiskCategory; score?: number | null }) {
  const color = RISK_COLOR[category];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {category}
      {score !== undefined && score !== null && <span className="tabular opacity-70">· {score}</span>}
    </span>
  );
}
