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

export function SensorNetwork() {
  const { data, selectedStation, setSelectedStation } = useApp();
  const { stations, timeseries } = data;

  const initial = selectedStation ?? stations[0]?.id ?? "";
  const [activeId, setActiveId] = useState(initial);
  useEffect(() => { if (selectedStation) setActiveId(selectedStation); }, [selectedStation]);

  const station = stations.find((s) => s.id === activeId) ?? stations[0];

  return (
    <div className="space-y-6">
      <SectionTitle title="Sensor network"
        subtitle={`${stations.length} stations · verified variables only · latest available observations`} />

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Master list */}
        <div className="space-y-2">
          {stations.map((s) => {
            const active = s.id === station?.id;
            return (
              <button key={s.id}
                onClick={() => { setActiveId(s.id); setSelectedStation(s.id); }}
                className={`w-full text-left rounded-xl border px-3.5 py-3 transition-colors ${
                  active ? "border-brand-400 bg-brand-50" : "border-slate-200 bg-white hover:border-brand-200"
                }`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink-900">{s.name}</span>
                  <StatusBadge status={s.status} />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-slate-400 capitalize">{s.type.replace("+", " + ")}</span>
                  <RiskBadge category={s.risk.category} score={s.risk.score} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail */}
        {station ? <StationDetail station={station} timeseries={timeseries} /> : <Empty />}
      </div>
    </div>
  );
}

function StationDetail({ station, timeseries }: { station: Station; timeseries: ReturnType<typeof useApp>["data"]["timeseries"] }) {
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
            <p className="text-sm text-slate-500 capitalize mt-0.5">{station.type.replace("+", " + ")} station</p>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1"><MapPin size={12} /> approx. position ({station.lat.toFixed(3)}, {station.lng.toFixed(3)})</span>
              <span className="inline-flex items-center gap-1"><Database size={12} /> {station.records.toLocaleString()} records</span>
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
            {station.risk.score === null
              ? "Insufficient verified data to compute a risk score for this station."
              : "All verified inputs are below their median thresholds, so no variable adds risk points."}
          </p>
        )}
      </Card>

      {/* Latest verified values */}
      <Card className="p-5">
        <SectionTitle title="Latest available observation" subtitle={fmtDateTime(station.lastTimestamp)} />
        {station.variables.length === 0 ? <Empty /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {station.variables.map((v) => {
              const meta = VARIABLES[v];
              const latest = station.latest[v];
              return (
                <div key={v} className="bg-slate-50 rounded-xl px-3 py-2.5">
                  <p className="text-[11px] text-slate-400">{meta.label}
                    {meta.unitStatus === "assumed" && <span className="text-amber-500"> · assumed unit</span>}
                  </p>
                  <p className="text-lg font-semibold text-ink-900 tabular">{latest ? formatValue(latest.value, meta) : "—"}</p>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {station.unverified.length > 0 && (
        <InfoNote tone="amber">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <AlertTriangle size={14} /> Unit / quality unverified
          </span>
          <ul className="mt-1.5 list-disc pl-5 space-y-0.5">
            {station.unverified.map((u, i) => <li key={i}>{u}</li>)}
          </ul>
          <p className="mt-1.5">These columns are excluded from statistics, risk scoring and machine-learning models, and are shown only as flagged quality issues.</p>
        </InfoNote>
      )}

      {station.assumptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {station.assumptions.map((a, i) => <Pill key={i} tone="amber">{a}</Pill>)}
        </div>
      )}

      {/* Chart */}
      <Card className="p-5">
        <SectionTitle title="Observed time series" subtitle="Verified variables only"
          right={
            <FilterBar>
              <Select label="Variable" value={effective ?? ""} onChange={(v) => setVariable(v as VariableKey)}
                options={vars.map((v) => ({ value: v, label: VARIABLES[v].label }))} />
              <Select label="Resolution" value={agg} onChange={setAgg}
                options={[{ value: "daily", label: "Daily" }, { value: "hourly", label: "Hourly" }]} />
            </FilterBar>
          } />
        {effective ? <TimeSeriesChart data={series} variable={effective} height={300} /> : <Empty hint="No verified variables available for this station." />}
      </Card>
    </div>
  );
}
