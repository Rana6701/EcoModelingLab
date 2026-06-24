import type { RiskCategory, StationStatus } from "../types";
import { RISK_COLOR, STATUS_STYLE } from "../lib/format";
import { useLanguage } from "../context/LanguageContext";

export function StatusBadge({ status }: { status: StationStatus }) {
  const { tr } = useLanguage();
  const s = STATUS_STYLE[status];
  const LABELS: Record<StationStatus, string> = {
    Available: tr.risk.available,
    Warning: tr.risk.warning,
    Missing: tr.risk.missing,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.text}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot}`} />
      {LABELS[status]}
    </span>
  );
}

export function RiskBadge({ category, score }: { category: RiskCategory; score?: number | null }) {
  const { tr } = useLanguage();
  const color = RISK_COLOR[category];
  const LABELS: Record<RiskCategory, string> = {
    "Low Risk": tr.risk.lowRisk,
    "Moderate Risk": tr.risk.moderateRisk,
    "High Risk": tr.risk.highRisk,
    "Insufficient Data": tr.risk.insufficientData,
  };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {LABELS[category]}
      {score !== undefined && score !== null && <span className="tabular opacity-70">· {score}</span>}
    </span>
  );
}
