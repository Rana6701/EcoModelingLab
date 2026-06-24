import { useMemo } from "react";
import { useApp } from "../App";
import { Card, SectionTitle, InfoNote } from "../components/ui";
import { Wind, Waves, Gauge, MapPin, Clock, ShieldAlert, CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { RiskCategory, Station } from "../types";
import { fmtDateTime } from "../lib/format";
import { VARIABLES, formatValue } from "../config/unitsConfig";
import { useLanguage } from "../context/LanguageContext";

type BeachStyleKey = Exclude<RiskCategory, "Insufficient Data">;
type BeachStyle = { bg: string; border: string; text: string; label: string; Icon: LucideIcon };

const BEACH_STYLE_BASE: Record<BeachStyleKey, Omit<BeachStyle, "label">> = {
  "Low Risk":      { bg: "bg-green-50", border: "border-green-300",  text: "text-green-800",  Icon: CheckCircle2 },
  "Moderate Risk": { bg: "bg-amber-50", border: "border-amber-300",  text: "text-amber-800",  Icon: AlertTriangle },
  "High Risk":     { bg: "bg-red-50",   border: "border-red-300",    text: "text-red-800",    Icon: AlertOctagon },
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
  const { tr } = useLanguage();
  const b = tr.beaches;

  const category = station.risk.category as BeachStyleKey;
  const base = BEACH_STYLE_BASE[category];
  const BEACH_LABELS: Record<BeachStyleKey, string> = {
    "Low Risk":      b.safeToEnter,
    "Moderate Risk": b.cautionAdvised,
    "High Risk":     b.dangerous,
  };
  const label = BEACH_LABELS[category];
  const Icon = base.Icon;
  const score = station.risk.score;

  const readings: { label: string; value: string; Icon: LucideIcon }[] = [];
  if (station.latest.windSpeed?.value !== null && station.latest.windSpeed !== undefined)
    readings.push({ label: "Wind", value: formatValue(station.latest.windSpeed.value, VARIABLES.windSpeed), Icon: Wind });
  if (station.latest.waveHeight?.value !== null && station.latest.waveHeight !== undefined)
    readings.push({ label: "Wave Ht.", value: formatValue(station.latest.waveHeight.value, VARIABLES.waveHeight), Icon: Waves });
  if (station.latest.currentMag?.value !== null && station.latest.currentMag !== undefined)
    readings.push({ label: "Current", value: formatValue(station.latest.currentMag.value, VARIABLES.currentMag), Icon: Gauge });

  return (
    <div className={`rounded-2xl border-2 ${base.border} ${base.bg} overflow-hidden`}>
      <div className={`flex items-center gap-3 px-5 py-4 border-b ${base.border}`}>
        <Icon size={26} className={base.text} />
        <div className="flex-1 min-w-0">
          <p className={`text-xl font-bold leading-tight ${base.text}`}>{label}</p>
        </div>
        {score !== null && score !== undefined && (
          <div className={`text-right ${base.text}`}>
            <p className="text-3xl font-bold tabular leading-none">{Math.round(score)}</p>
            <p className="text-xs opacity-60">/ 100</p>
          </div>
        )}
      </div>

      <div className="px-5 pt-4 pb-4">
        <div className="flex items-start gap-2 mb-3">
          <MapPin size={15} className="mt-0.5 text-slate-400 shrink-0" />
          <div>
            <p className="font-bold text-ink-900 text-base leading-tight">{beach.nameEn}</p>
            <p className="text-sm text-slate-500">{beach.name}</p>
          </div>
        </div>

        {readings.length > 0 && (
          <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: `repeat(${readings.length}, 1fr)` }}>
            {readings.map(({ label: rl, value, Icon: ReadIcon }) => (
              <div key={rl} className="bg-white/70 rounded-xl p-3 text-center">
                <ReadIcon size={13} className="mx-auto mb-1 text-slate-400" />
                <p className="text-[11px] text-slate-400 mb-0.5">{rl}</p>
                <p className="text-sm font-bold tabular text-ink-900">{value}</p>
              </div>
            ))}
          </div>
        )}

        {station.risk.contributions.length > 0 && (
          <div className="mt-3 space-y-0.5">
            {station.risk.contributions.slice(0, 2).map((c) => (
              <p key={c.variable} className={`text-xs ${base.text} opacity-80`}>· {c.text}</p>
            ))}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-black/5 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Clock size={11} />
          <span>{b.lastUpdate} {fmtDateTime(station.lastTimestamp)}</span>
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
  const { tr } = useLanguage();
  const b = tr.beaches;

  const stationMap = useMemo(
    () => new Map(stations.map((s) => [s.id, s])),
    [stations]
  );

  const activeBeaches = useMemo(
    () => beaches.filter((bch) => {
      const s = stationMap.get(bch.stationId);
      return s && s.risk.category !== "Insufficient Data";
    }),
    [beaches, stationMap]
  );

  const overallCategory = useMemo<RiskCategory>(
    () => worstCategory(activeBeaches.map((bch) => stationMap.get(bch.stationId)!.risk.category)),
    [activeBeaches, stationMap]
  );

  const BEACH_LABELS: Record<BeachStyleKey, string> = {
    "Low Risk":      b.safeToEnter,
    "Moderate Risk": b.cautionAdvised,
    "High Risk":     b.dangerous,
  };

  const overallBase = overallCategory !== "Insufficient Data"
    ? BEACH_STYLE_BASE[overallCategory as BeachStyleKey]
    : null;
  const overallLabel = overallCategory !== "Insufficient Data"
    ? BEACH_LABELS[overallCategory as BeachStyleKey]
    : null;

  return (
    <div className="space-y-6">
      <SectionTitle title={b.title} subtitle={b.subtitle} />

      {overallBase && overallLabel && (
        <Card className={`p-5 border-2 ${overallBase.border} ${overallBase.bg}`}>
          <div className="flex items-center gap-4">
            <overallBase.Icon size={32} className={overallBase.text} />
            <div>
              <p className={`text-xl font-bold ${overallBase.text}`}>
                {b.overallStatus} {overallLabel}
              </p>
              <p className={`text-sm ${overallBase.text} opacity-75`}>
                {b.worstReading.replace("{n}", String(activeBeaches.length))}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {activeBeaches.map((beach) => (
          <BeachCard key={beach.id} beach={beach} station={stationMap.get(beach.stationId)!} />
        ))}
      </div>

      <Card className="p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3">{b.colorGuide}</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {(Object.entries(BEACH_STYLE_BASE) as [BeachStyleKey, typeof BEACH_STYLE_BASE[BeachStyleKey]][]).map(([key, s]) => {
            const Icon = s.Icon;
            return (
              <div key={key} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${s.bg} ${s.border}`}>
                <Icon size={18} className={s.text} />
                <p className={`font-semibold text-sm ${s.text}`}>{BEACH_LABELS[key]}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <InfoNote tone="amber">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <ShieldAlert size={14} /> {b.disclaimerTitle}
        </span>{" "}
        {b.disclaimer}
      </InfoNote>
    </div>
  );
}
