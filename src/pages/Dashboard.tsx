import { useMemo, useState } from "react";
import { useApp } from "../App";
import { MetricCard } from "../components/MetricCard";
import { Card, SectionTitle, Empty } from "../components/ui";
import { FilterBar, Select } from "../components/FilterBar";
import { TimeSeriesChart } from "../components/TimeSeriesChart";
import { StationCard } from "../components/StationCard";
import { RiskGauge } from "../components/RiskGauge";
import { seriesFor, type Aggregation } from "../lib/select";
import { VARIABLES } from "../config/unitsConfig";
import type { VariableKey } from "../types";
import { Radio, Bell, Waves, Activity } from "lucide-react";

export function Dashboard() {
  const { data, setSelectedStation, navigate } = useApp();
  const { stations, timeseries, alerts } = data;

  const chartStations = useMemo(
    () => stations.filter((s) => timeseries[s.id]?.vars.length),
    [stations, timeseries]
  );
  const [stationId, setStationId] = useState(chartStations[0]?.id ?? "");
  const stationVars = timeseries[stationId]?.vars ?? [];
  const [variable, setVariable] = useState<VariableKey>(stationVars[0] ?? "windSpeed");
  const [agg, setAgg] = useState<Aggregation>("daily");

  const effectiveVar = stationVars.includes(variable) ? variable : stationVars[0];
  const series = effectiveVar ? seriesFor(timeseries, stationId, effectiveVar, agg) : [];

  const online = stations.filter((s) => s.status === "Available").length;
  const ranked = [...stations].filter((s) => s.risk.score !== null)
    .sort((a, b) => (b.risk.score ?? 0) - (a.risk.score ?? 0));
  const topRisk = ranked[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<Radio size={18} />} label="Sensors available" value={`${online}/${stations.length}`}
          tone="green" sublabel="reporting verified data" />
        <MetricCard icon={<Bell size={18} />} label="Risk events logged" value={alerts.summary.total.toLocaleString()}
          tone="amber" sublabel={`${alerts.summary.high} high · ${alerts.summary.moderate} moderate`} />
        <MetricCard icon={<Waves size={18} />} label="Highest station risk"
          value={topRisk ? topRisk.risk.category.replace(" Risk", "") : "—"}
          tone={topRisk?.risk.category === "High Risk" ? "red" : topRisk?.risk.category === "Moderate Risk" ? "amber" : "green"}
          sublabel={topRisk ? `${topRisk.name} · ${topRisk.risk.score}` : undefined} />
        <MetricCard icon={<Activity size={18} />} label="Risk model" value={`v${data.manifest.riskVersion}`}
          tone="blue" sublabel="transparent rule-based" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5">
          <SectionTitle title="Observed conditions" subtitle="Latest available observations — not a live feed"
            right={
              <FilterBar>
                <Select label="Station" value={stationId} onChange={setStationId}
                  options={chartStations.map((s) => ({ value: s.id, label: s.name }))} />
                <Select label="Variable" value={effectiveVar ?? ""} onChange={(v) => setVariable(v as VariableKey)}
                  options={stationVars.map((v) => ({ value: v, label: VARIABLES[v].label }))} />
                <Select label="Resolution" value={agg} onChange={setAgg}
                  options={[{ value: "daily", label: "Daily" }, { value: "hourly", label: "Hourly" }]} />
              </FilterBar>
            } />
          {effectiveVar
            ? <TimeSeriesChart data={series} variable={effectiveVar} height={300} />
            : <Empty />}
        </Card>

        <Card className="p-5">
          <SectionTitle title="Current risk" subtitle={topRisk?.name ?? "—"} />
          {topRisk ? (
            <div className="flex flex-col items-center">
              <RiskGauge score={topRisk.risk.score} />
              <div className="mt-3 w-full space-y-1.5">
                {topRisk.risk.contributions.length === 0 && (
                  <p className="text-sm text-slate-400 text-center">All verified inputs below their median thresholds.</p>
                )}
                {topRisk.risk.contributions.map((c) => (
                  <div key={c.variable} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{VARIABLES[c.variable]?.label}</span>
                    <span className="tabular font-medium">+{c.points}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <Empty />}
        </Card>
      </div>

      <div>
        <SectionTitle title="Sensor network" subtitle="Tap a station for details"
          right={<button onClick={() => navigate("sensors")} className="text-sm text-brand-600 font-medium no-print">View all →</button>} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map((s) => (
            <StationCard key={s.id} station={s}
              onSelect={(id) => { setSelectedStation(id); navigate("sensors"); }} />
          ))}
        </div>
      </div>
    </div>
  );
}
