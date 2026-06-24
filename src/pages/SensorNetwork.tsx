import { useMemo, useState, useEffect } from "react";
import { useApp } from "../App";
import { Card, SectionTitle, Empty, InfoNote, Pill } from "../components/ui";
import { StatusBadge, RiskBadge } from "../components/StatusBadge";
import { RiskGauge } from "../components/RiskGauge";
import { TimeSeriesChart } from "../components/TimeSeriesChart";
import { FilterBar, Select } from "../components/FilterBar";
import { VARIABLES, formatValue } from "../config/unitsConfig";
import { fmtDateTime, fmtDateRange } from "../lib/format";
import { seriesFor, type Aggregation } from "../lib/select";
import type { Station, VariableKey } from "../types";
import { MapPin, AlertTriangle, Database } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function SensorNetwork() {
  const { data, selectedStation, setSelectedStation } = useApp();
  const { stations, timeseries } = data;
  const { tr } = useLanguage();
  const s = tr.sensors;

  const initial = selectedStation ?? stations[0]?.id ?? "";
  const [activeId, setActiveId] = useState(initial);
  useEffect(() => { if (selectedStation) setActiveId(selectedStation); }, [selectedStation]);

  const station = stations.find((st) => st.id === activeId) ?? stations[0];

  return (
    <div className="space-y-6">
      <SectionTitle
        title={s.title}
        subtitle={s.subtitle.replace("{n}", String(stations.length))}
      />
      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        <div className="space-y-2">
          {stations.map((st) => {
            const active = st.id === station?.id;
            return (
              <button key={st.id}
                onClick={() => { setActiveId(st.id); setSelectedStation(st.id); }}
                className={`w-full text-left rounded-xl border px-3.5 py-3 transition-colors ${
                  active ? "border-brand-400 bg-brand-50" : "border-slate-200 bg-white hover:border-brand-200"
                }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink-900">{st.name}</span>
                  <StatusBadge status={st.status} />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-slate-400 capitalize">{st.type.replace("+", " + ")}</span>
                  <RiskBadge category={st.risk.category} score={st.risk.score} />
                </div>
              </button>
            );
          })}
        </div>
        {station ? <StationDetail station={station} timeseries={timeseries} /> : <Empty />}
      </div>
    </div>
  );
}

function StationDetail({ station, timeseries }: { station: Station; timeseries: ReturnType<typeof useApp>["data"]["timeseries"] }) {
  const { tr } = useLanguage();
  const s = tr.sensors;

  const vars = timeseries[station.id]?.vars ?? [];
  const [variable, setVariable] = useState<VariableKey>(vars[0] ?? "windSpeed");
  const [agg, setAgg] = useState<Aggregation>("daily");
  const effective = vars.includes(variable) ? variable : vars[0];
  const series = useMemo(
    () => (effective ? seriesFor(timeseries, station.id, effective, agg) : []),
    [timeseries, station.id, effective, agg]
  );

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-ink-900">{station.name}</h3>
            <p className="text-sm text-slate-500 capitalize mt-0.5">
              {station.type.replace("+", " + ")} {s.stationType}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> {s.approxPosition} ({station.lat.toFixed(3)}, {station.lng.toFixed(3)})
              </span>
              <span className="inline-flex items-center gap-1">
                <Database size={12} /> {station.records.toLocaleString()} {s.records}
              </span>
              <span>{fmtDateRange(station.dateRange)}</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <RiskGauge score={station.risk.score} size={150} />
          </div>
        </div>

        {station.risk.contributions.length > 0 ? (
          <div className="mt-4 grid sm:grid-cols-2 gap-2">
            {station.risk.contributions.map((c) => (
              <div key={c.variable} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-sm">
                <span className="text-slate-600">{VARIABLES[c.variable]?.label ?? c.variable}</span>
                <span className="tabular font-semibold">+{c.points}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 mt-4">
            {station.risk.score === null ? s.noRiskData : s.noPtsAdded}
          </p>
        )}
      </Card>

      <Card className="p-5">
        <SectionTitle title={s.latestObs} subtitle={fmtDateTime(station.lastTimestamp)} />
        {station.variables.length === 0 ? <Empty /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {station.variables.map((v) => {
              const meta = VARIABLES[v];
              const latest = station.latest[v];
              return (
                <div key={v} className="bg-slate-50 rounded-xl px-3 py-2.5">
                  <p className="text-[11px] text-slate-400">
                    {meta.label}
                    {meta.unitStatus === "assumed" && <span className="text-amber-500"> · {s.assumedUnit}</span>}
                  </p>
                  <p className="text-lg font-semibold text-ink-900 tabular">
                    {latest ? formatValue(latest.value, meta) : "—"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {station.unverified.length > 0 && (
        <InfoNote tone="amber">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <AlertTriangle size={14} /> {s.unverifiedTitle}
          </span>
          <ul className="mt-1.5 list-disc pl-5 space-y-0.5">
            {station.unverified.map((u, i) => <li key={i}>{u}</li>)}
          </ul>
          <p className="mt-1.5">{s.unverifiedNote}</p>
        </InfoNote>
      )}

      {station.assumptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {station.assumptions.map((a, i) => <Pill key={i} tone="amber">{a}</Pill>)}
        </div>
      )}

      <Card className="p-5">
        <SectionTitle title={s.timeSeries} subtitle={s.verifiedOnly}
          right={
            <FilterBar>
              <Select label={s.variable} value={effective ?? ""} onChange={(v) => setVariable(v as VariableKey)}
                options={vars.map((v) => ({ value: v, label: VARIABLES[v].label }))} />
              <Select label={s.resolution} value={agg} onChange={setAgg}
                options={[{ value: "daily", label: s.daily }, { value: "hourly", label: s.hourly }]} />
            </FilterBar>
          } />
        {effective
          ? <TimeSeriesChart data={series} variable={effective} height={300} />
          : <Empty hint={s.noVars} />
        }
      </Card>
    </div>
  );
}
