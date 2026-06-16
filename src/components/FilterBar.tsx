import type { ReactNode } from "react";

export interface SelectProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

export function Select<T extends string>({ label, value, options, onChange }: SelectProps<T>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="text-sm rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-300"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export function DateInput({ label, value, min, max, onChange }: {
  label: string; value: string; min?: string; max?: string; onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      <input type="date" value={value} min={min} max={max} onChange={(e) => onChange(e.target.value)}
        className="text-sm rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-300 tabular" />
    </label>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-3 bg-white rounded-2xl shadow-card border border-slate-100 p-4 no-print">
      {children}
    </div>
  );
}
