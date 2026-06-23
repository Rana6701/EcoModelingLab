import { Activity } from "lucide-react";
import type { Manifest } from "../types";
import { fmtDateTime, fmtDateRange } from "../lib/format";

export function Header({ manifest }: { manifest: Manifest | null }) {
  return (
    <header className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 grid place-items-center backdrop-blur">
            <Activity size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">SmartKinneret</h1>
            <p className="text-brand-100 text-xs sm:text-sm">
              Lake Kinneret environmental risk monitoring
            </p>
          </div>
        </div>
        {manifest && (
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-[11px] uppercase tracking-wide text-brand-100">Latest available observation</span>
            <span className="text-sm font-semibold tabular">{fmtDateTime(manifest.latestObservation)}</span>
            <span className="text-[11px] text-brand-100 tabular">data: {fmtDateRange(manifest.datasetRange)}</span>
          </div>
        )}
      </div>
    </header>
  );
}
