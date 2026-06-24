import { RISK_COLOR } from "../lib/format";
import { categoryForScore } from "../config/riskConfig";
import { useLanguage } from "../context/LanguageContext";
import type { RiskCategory } from "../types";

/** Semicircular gauge (0–100) coloured by the risk category. */
export function RiskGauge({ score, size = 180 }: { score: number | null; size?: number }) {
  const { tr } = useLanguage();
  const w = size;
  const h = size / 2 + 26;
  const cx = w / 2;
  const cy = size / 2;
  const r = size / 2 - 14;
  const category = categoryForScore(score);
  const color = RISK_COLOR[category];

  const LABELS: Record<RiskCategory, string> = {
    "Low Risk": tr.risk.lowRisk,
    "Moderate Risk": tr.risk.moderateRisk,
    "High Risk": tr.risk.highRisk,
    "Insufficient Data": tr.risk.insufficientData,
  };

  const frac = score === null ? 0 : Math.max(0, Math.min(1, score / 100));
  const endDeg = 180 - frac * 180;
  const needle = polar(cx, cy, r, endDeg);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Risk score ${score ?? "insufficient"}`}>
      <path d={describeArc(cx, cy, r, 180, 0)} fill="none" stroke="#e2e8f0" strokeWidth={14} strokeLinecap="round" />
      {score !== null && (
        <path d={describeArc(cx, cy, r, 180, endDeg)} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" />
      )}
      {score !== null && <circle cx={needle.x} cy={needle.y} r={7} fill="#fff" stroke={color} strokeWidth={3} />}
      <text x={cx} y={cy - 2} textAnchor="middle" className="tabular" fontSize={30} fontWeight={800} fill="#0f172a">
        {score === null ? "—" : score}
      </text>
      <text x={cx} y={cy + 18} textAnchor="middle" fontSize={12} fontWeight={600} fill={color}>
        {LABELS[category]}
      </text>
    </svg>
  );
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}
function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}
