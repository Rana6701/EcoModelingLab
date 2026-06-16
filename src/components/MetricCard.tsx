import type { ReactNode } from "react";
import { Card } from "./ui";

export function MetricCard({
  icon, label, value, unit, sublabel, tone = "blue", footnote,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  sublabel?: string;
  tone?: "blue" | "green" | "amber" | "red" | "slate";
  footnote?: string;
}) {
  const toneMap: Record<string, string> = {
    blue: "text-brand-600 bg-brand-50",
    green: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    red: "text-red-600 bg-red-50",
    slate: "text-slate-500 bg-slate-100",
  };
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-ink-900 tabular truncate">
            {value}
            {unit && <span className="text-base font-semibold text-slate-400 ml-1">{unit}</span>}
          </p>
          {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
        </div>
        <div className={`shrink-0 w-10 h-10 rounded-xl grid place-items-center ${toneMap[tone]}`}>{icon}</div>
      </div>
      {footnote && <p className="text-[11px] text-slate-400 mt-3 leading-snug">{footnote}</p>}
    </Card>
  );
}
