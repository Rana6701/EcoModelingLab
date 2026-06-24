import type { ReactNode } from "react";
import { useLanguage } from "../context/LanguageContext";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-card border border-slate-100 print-card ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Pill({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "blue" | "amber" | "red" | "green" }) {
  const map: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-brand-50 text-brand-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    green: "bg-emerald-50 text-emerald-700",
  };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${map[tone]}`}>{children}</span>;
}

export function Empty({ title, hint }: { title?: string; hint?: string }) {
  const { tr } = useLanguage();
  const label = title ?? tr.components.empty.noData;
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 text-slate-400">
      <div className="w-12 h-12 rounded-full bg-slate-100 grid place-items-center mb-3 text-slate-300 text-xl">∅</div>
      <p className="font-medium text-slate-500">{label}</p>
      {hint && <p className="text-sm mt-1 max-w-sm">{hint}</p>}
    </div>
  );
}

export function InfoNote({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "amber" }) {
  const map = {
    blue: "bg-brand-50/70 border-brand-200 text-brand-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
  } as const;
  return <div className={`text-sm rounded-xl border px-3 py-2 ${map[tone]}`}>{children}</div>;
}
