import { ShieldAlert } from "lucide-react";

/** Prominent academic-prototype safety disclaimer. Shown across the UI. */
export function Disclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-[11px] text-slate-400 leading-snug">
        Academic research prototype — risk classifications are not official swimming or emergency-safety instructions.
      </p>
    );
  }
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
      <p className="text-sm text-amber-900">
        <strong>Academic research prototype.</strong> Its risk classifications are not official swimming or
        emergency-safety instructions. Do not use this system to make real-world safety decisions; always
        follow official authorities and posted lifeguard guidance.
      </p>
    </div>
  );
}
