import type { Alert } from "../types";
import { VARIABLES } from "../config/unitsConfig";
import { fmtDateTime } from "../lib/format";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function AlertCard({ alert }: { alert: Alert }) {
  const { tr } = useLanguage();
  const ac = tr.components.alertCard;
  const high = alert.severity === "High Risk";
  const meta = VARIABLES[alert.variable];
  return (
    <div className={`rounded-xl border p-4 ${high ? "border-red-200 bg-red-50/60" : "border-amber-200 bg-amber-50/50"}`}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 mt-0.5 ${high ? "text-red-500" : "text-amber-500"}`}>
          {high ? <AlertTriangle size={18} /> : <AlertCircle size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-ink-900">
              {alert.station} · {meta?.label ?? alert.variable}
            </p>
            <span className={`text-xs font-semibold ${high ? "text-red-600" : "text-amber-600"}`}>{alert.severity}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 tabular">{fmtDateTime(alert.timestamp)}</p>
          <p className="text-sm text-slate-700 mt-2">{alert.explanation}.</p>
          <div className="flex flex-wrap gap-2 mt-2 text-[11px] tabular">
            {alert.value !== null && (
              <span className="bg-white/70 border border-slate-200 rounded-lg px-2 py-0.5">
                {ac.value} {alert.value} {meta?.unit}
              </span>
            )}
            {alert.threshold !== null && (
              <span className="bg-white/70 border border-slate-200 rounded-lg px-2 py-0.5">
                {ac.threshold} {alert.threshold} {meta?.unit}
              </span>
            )}
            {alert.score !== null && (
              <span className="bg-white/70 border border-slate-200 rounded-lg px-2 py-0.5">
                {ac.riskScore} {alert.score}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
