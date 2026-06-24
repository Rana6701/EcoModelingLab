import { useMemo } from "react";
import { useApp } from "../App";
import { Card, SectionTitle, InfoNote } from "../components/ui";
import { Wind, Waves, Gauge, MapPin, Clock, ShieldAlert, CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { RiskCategory, Station } from "../types";
import { fmtDateTime } from "../lib/format";
import { VARIABLES, formatValue } from "../config/unitsConfig";

const BEACH_STYLE: Record<Exclude<RiskCategory, "Insufficient Data">, {
  bg: string; border: string; text: string; label: string; Icon: LucideIcon;
}> = {
  "Low Risk": {
    bg: "bg-green-50", border: "border-green-300", text: "text-green-800",
    label: "Safe to Enter", Icon: CheckCircle2,
  },
  "Moderate Risk": {
    bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-800",
    label: "Caution Advised", Icon: AlertTriangle,
  },
  "High Risk": {
    bg: "bg-red-50", border: "border-red-300", text: "text-red-800",
    label: "Dangerous — Avoid Water", Icon: AlertOctagon,
  },
};

const PRIORITY: RiskCategory[] = ["High Risk", "Moderate Risk", "Low Risk", "Insufficient Data"];

function worstCategory(cats: RiskCategory[]): RiskCategory {
  for (const c of PRIORITY) if (cats.includes(c)) return c;
  return "Insufficient Data";
}

function BeachCard({ beach, station }: {
  beach: { name: string; nameEn: string; stationName: string };
  station: Station;
}) {
  const category = station.risk.category as Exclude<RiskCategory, "Insufficient Data">;
  const style = BEACH_STYLE[category];
  const Icon = style.Icon;
  const score = station.risk.score;

  // Only show readings that have an actual value
  const readings: { label: string; value: string; Icon: LucideIcon }[] = [];
  if (station.latest.windSpeed?.value !== null && station.latest.windSpeed !== undefined)
    readings.push({ label: "Wind", value: formatValue(station.latest.windSpeed.value, VARIABLES.windSpeed), Icon: Wind });
  if (station.latest.waveHeight?.value !== null && station.latest.waveHeight !== undefined)
    readings.push({ label: "Wave Ht.", value: formatValue(station.latest.waveHeight.value, VARIABLES.waveHeight), Icon: Waves });
  if (station.latest.currentMag?.value !== null && station.latest.currentMag !== undefined)
    readings.push({ label: "Current", value: formatValue(station.latest.currentMag.value, VARIABLES.currentMag), Icon: Gauge });

  return (
    <div className={`rounded-2xl border-2 ${style.border} ${style.bg} overflow-hidden`}>
      {/* Status banner */}
      <div className={`flex items-center gap-3 px-5 py-4 border-b ${style.border}`}>
        <Icon size={26} className={style.text} />
        <div className="flex-1 min-w-0">
          <p className={`text-xl font-bold leading-tight ${style.text}`}>{style.label}</p>
        </div>
        {score !== null && score !== undefined && (
          <div className={`text-right ${style.text}`}>
            <p className="text-3xl font-bold tabular leading-none">{Math.round(score)}</p>
            <p className="text-xs opacity-60">/ 100</p>
          </div>
        )}
      </div>

      <div className="px-5 pt-4 pb-4">
        {/* Beach name */}
        <div className="flex items-start gap-2 mb-3">
          <MapPin size={15} className="mt-0.5 text-slate-400 shrink-0" />
          <div>
            <p className="font-bold text-ink-900 text-base leading-tight">{beach.nameEn}</p>
            <p className="text-sm text-slate-500">{beach.name}</p>
          </div>
        </div>

        {/* Readings — only those with actual data */}
        {readings.length > 0 && (
          <div className={`grid gap-2 mt-2`} style={{ gridTemplateColumns: `repeat(${readings.length}, 1fr)` }}>
            {readings.map(({ label, value, Icon: ReadIcon }) => (
              <div key={label} className="bg-white/70 rounded-xl p-3 text-center">
                <ReadIcon size={13} className="mx-auto mb-1 text-slate-400" />
                <p className="text-[11px] text-slate-400 mb-0.5">{label}</p>
                <p className="text-sm font-bold tabular text-ink-900">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Risk contributions */}
        {station.risk.contributions.length > 0 && (
          <div className="mt-3 space-y-0.5">
            {station.risk.contributions.slice(0, 2).map((c) => (
              <p key={c.variable} className={`text-xs ${style.text} opacity-80`}>· {c.text}</p>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-black/5 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Clock size={11} />
          <span>Last update: {fmtDateTime(station.lastTimestamp)}</span>
          <span className="mx-1">·</span>
          <span>{beach.stationName}</span>
        </div>
      </div>
    </div>
  );
}

export function BeachSafety() {
  const { data } = useApp();
  const { beaches, stations } = data;

  const stationMap = useMemo(
    () => new Map(stations.map((s) => [s.id, s])),
    [stations]
  );

  // Only beaches whose station has actual risk data
  const activeBeaches = useMemo(
    () => beaches.filter((b) => {
      const s = stationMap.get(b.stationId);
      return s && s.risk.category !== "Insufficient Data";
    }),
    [beaches, stationMap]
  );

  const overallCategory = useMemo<RiskCategory>(
    () => worstCategory(activeBeaches.map((b) => stationMap.get(b.stationId)!.risk.category)),
    [activeBeaches, stationMap]
  );

  const overallStyle = overallCategory !== "Insufficient Data"
    ? BEACH_STYLE[overallCategory as Exclude<RiskCategory, "Insufficient Data">]
    : null;

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Beach Safety"
        subtitle="Water-entry risk level per beach, derived from the nearest sensor station"
      />

      {/* Overall lake banner */}
      {overallStyle && (
        <Card className={`p-5 border-2 ${overallStyle.border} ${overallStyle.bg}`}>
          <div className="flex items-center gap-4">
            <overallStyle.Icon size={32} className={overallStyle.text} />
            <div>
              <p className={`text-xl font-bold ${overallStyle.text}`}>
                Overall lake status: {overallStyle.label}
              </p>
              <p className={`text-sm ${overallStyle.text} opacity-75`}>
                Worst reading across all {activeBeaches.length} monitored beaches
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Beach grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeBeaches.map((beach) => (
          <BeachCard
            key={beach.id}
            beach={beach}
            station={stationMap.get(beach.stationId)!}
          />
        ))}
      </div>

      {/* Color guide */}
      <Card className="p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3">Color guide</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {(Object.entries(BEACH_STYLE) as [string, typeof BEACH_STYLE[keyof typeof BEACH_STYLE]][]).map(([, s]) => {
            const Icon = s.Icon;
            return (
              <div key={s.label} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${s.bg} ${s.border}`}>
                <Icon size={18} className={s.text} />
                <p className={`font-semibold text-sm ${s.text}`}>{s.label}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <InfoNote tone="amber">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <ShieldAlert size={14} /> Important disclaimer:
        </span>{" "}
        This is an academic research prototype. Risk ratings are not official swimming-safety
        instructions. Always consult the on-duty lifeguard before entering the water.
      </InfoNote>
    </div>
  );
}
