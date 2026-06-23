import type { Station } from "../types";
import { Card } from "./ui";
import { StatusBadge, RiskBadge } from "./StatusBadge";
import { VARIABLES } from "../config/unitsConfig";
import { formatValue } from "../config/unitsConfig";
import { fmtDateTime } from "../lib/format";
import { Wind, Waves, Thermometer, MapPin } from "lucide-react";

const TYPE_ICON = {
  meteorological: Wind,
  "wave+current": Waves,
  current: Waves,
  "meteorological+lake": Thermometer,
  "water-quality": Thermometer,
} as const;

export function StationCard({ station, onSelect }: { station: Station; onSelect?: (id: string) => void }) {
  const Icon = TYPE_ICON[station.type] ?? Thermometer;
  const shown = station.variables.slice(0, 4);
  const displayName = station.name.replace(/ \(\d{4}(?:-\d{2})?\)$/, "");

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 grid place-items-center">
            <Icon size={18} />
          </div>
          <div>
            <button onClick={() => onSelect?.(station.id)} className="font-semibold text-ink-900 hover:text-brand-600 text-left">
              {displayName}
            </button>
            <p className="text-xs text-slate-400 capitalize">{station.type.replace("+", " + ")}</p>
          </div>
        </div>
        <StatusBadge status={station.status} />
      </div>

      <div className="mt-3"><RiskBadge category={station.risk.category} score={station.risk.score} /></div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        {shown.map((v) => {
          const latest = station.latest[v];
          const meta = VARIABLES[v];
          return (
            <div key={v} className="bg-slate-50 rounded-lg px-2.5 py-1.5">
              <p className="text-[11px] text-slate-400">{meta.short}</p>
              <p className="text-sm font-semibold text-ink-900 tabular">
                {latest ? formatValue(latest.value, meta) : "—"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1"><MapPin size={11} /> approx. position</span>
        <span className="tabular">last: {fmtDateTime(station.lastTimestamp)}</span>
      </div>
      {station.unverified.length > 0 && (
        <p className="text-[11px] text-amber-600 mt-2">
          {station.unverified.length} column(s) flagged unit/quality unverified — excluded from analysis.
        </p>
      )}
    </Card>
  );
}
