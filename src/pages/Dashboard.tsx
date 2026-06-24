import { useMemo } from "react";
import type { ReactNode } from "react";
import { useApp } from "../App";
import { Card, SectionTitle } from "../components/ui";
import { RealLakeMap } from "../components/RealLakeMap";
import { TimeSeriesChart } from "../components/TimeSeriesChart";
import { seriesFor } from "../lib/select";
import { VARIABLES } from "../config/unitsConfig";
import { Wind, Waves, Thermometer, AlertTriangle, Activity } from "lucide-react";
import type { VariableKey } from "../types";
import { fmtDateTime, fmtDate } from "../lib/format";
import { useLanguage } from "../context/LanguageContext";

function getLatest(stations: ReturnType<typeof useApp>["data"]["stations"], key: VariableKey) {
  for (const s of stations) {
    const v = s.latest[key];
    if (v?.value != null) return { value: v.value, unit: v.unit, at: v.at };
  }
  return null;
}

export function Dashboard() {
  const { data } = useApp();
  const { stations, timeseries, alerts, beaches } = data;
  const { tr } = useLanguage();

  const d = tr.dashboard;

  const wind = getLatest(stations, "windSpeed");
  const wave = getLatest(stations, "waveHeight");
  const temp = getLatest(stations, "waterTemp");

  const topRisk = useMemo(
    () =>
      [...stations]
        .filter((s) => s.risk.score !== null)
        .sort((a, b) => (b.risk.score ?? 0) - (a.risk.score ?? 0))[0],
    [stations]
  );

  const safeZones = stations.filter((s) => s.risk.category === "Low Risk").length;
  const warnings  = stations.filter((s) => s.risk.category === "Moderate Risk").length;
  const dangers   = stations.filter((s) => s.risk.category === "High Risk").length;
  const online    = stations.filter((s) => s.status === "Available").length;

  const recentEvents = useMemo(
    () =>
      [...alerts.alerts]
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, 4),
    [alerts.alerts]
  );

  const chartStation = useMemo(
    () => stations.find((s) => timeseries[s.id]?.vars.includes("windSpeed")),
    [stations, timeseries]
  );
  const waveStation = useMemo(
    () => stations.find((s) => timeseries[s.id]?.vars.includes("waveHeight")),
    [stations, timeseries]
  );
  const windSeries = chartStation
    ? seriesFor(timeseries, chartStation.id, "windSpeed", "daily")
    : [];
  const waveSeries = waveStation
    ? seriesFor(timeseries, waveStation.id, "waveHeight", "daily")
    : [];

  const riskCat   = topRisk?.risk.category ?? "Low Risk";
  const riskLabel = riskCat === "Low Risk"
    ? tr.risk.lowRisk
    : riskCat === "Moderate Risk"
    ? tr.risk.moderateRisk
    : riskCat === "High Risk"
    ? tr.risk.highRisk
    : tr.risk.insufficientData;

  // Alert title translation map
  const alertTitleMap: Partial<Record<VariableKey, string>> = d.alertTitles;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Wind size={20} />}
          label={d.windSpeed}
          value={wind ? `${wind.value.toFixed(1)} ${wind.unit}` : "—"}
          sub={wind?.at ? `${d.lastReading} ${fmtDate(wind.at)}` : d.noData}
        />
        <StatCard
          icon={<Waves size={20} />}
          label={d.waveHeight}
          value={wave ? `${wave.value.toFixed(2)} m` : "—"}
          sub={wave?.at ? `${d.lastReading} ${fmtDate(wave.at)}` : d.noData}
        />
        <StatCard
          icon={<Thermometer size={20} />}
          label={d.waterTemp}
          value={temp ? `${temp.value.toFixed(1)} °C` : "—"}
          sub={temp?.at ? `${d.lastReading} ${fmtDate(temp.at)}` : d.noData}
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          label={d.highestRisk}
          value={riskLabel.replace(" Risk", "").replace(" סיכון", "").replace(" الخطر", "") || "—"}
          valueTone={riskCat === "High Risk" ? "red" : riskCat === "Moderate Risk" ? "amber" : undefined}
          sub={topRisk ? topRisk.name : undefined}
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <Card className="lg:col-span-3 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">{d.lakeOverview}</h2>
            <div className="flex flex-wrap gap-2">
              {safeZones > 0 && <ZonePill color="green">{safeZones} {d.lowRiskZone}</ZonePill>}
              {warnings  > 0 && <ZonePill color="amber">{warnings} {d.moderateZone}</ZonePill>}
              {dangers   > 0 && <ZonePill color="red">{dangers} {d.highRiskZone}</ZonePill>}
            </div>
          </div>
          <RealLakeMap stations={stations} beaches={beaches} height={380} />
        </Card>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card className="p-5 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={15} className="text-slate-400" />
              <h3 className="font-semibold text-slate-900">{d.recentEvents}</h3>
            </div>
            {recentEvents.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">{d.noRiskEvents}</p>
            ) : (
              <div className="space-y-2">
                {recentEvents.map((evt) => {
                  const isHigh = evt.severity === "High Risk";
                  const title  = alertTitleMap[evt.variable] ?? VARIABLES[evt.variable]?.label ?? evt.variable;
                  return (
                    <div
                      key={evt.id}
                      className={`p-3 rounded-xl border-l-4 ${
                        isHigh ? "border-red-400 bg-red-50/40" : "border-amber-400 bg-amber-50/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold ${isHigh ? "text-red-700" : "text-amber-700"}`}>
                          {title}
                        </p>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                          isHigh ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {isHigh ? d.high : d.med}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{evt.station}</p>
                      <p className="text-[11px] text-slate-400 mt-1 tabular">
                        {fmtDateTime(evt.timestamp)}
                        {evt.value != null && ` · ${evt.value.toFixed(2)} ${VARIABLES[evt.variable]?.unit ?? ""}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <div className="rounded-2xl bg-brand-600 p-5 text-white">
            <h3 className="font-semibold mb-4">{d.datasetSummary}</h3>
            <div className="space-y-2.5">
              {[
                { label: d.totalStations,     value: stations.length },
                { label: d.beachesMonitored,  value: beaches.length },
                { label: d.riskEventsLogged,  value: alerts.summary.total.toLocaleString() },
                { label: d.highRiskEvents,    value: alerts.summary.high.toLocaleString() },
                { label: d.stationsOnline,    value: `${online} / ${stations.length}` },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-brand-100 text-sm">{r.label}</span>
                  <span className="font-bold tabular">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {(windSeries.length > 0 || waveSeries.length > 0) && (
        <Card className="p-5">
          <SectionTitle title={d.trends} subtitle={d.trendsSubtitle} />
          <div className="grid lg:grid-cols-2 gap-6">
            {windSeries.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  {d.windSpeedChart} — {chartStation?.name}
                </p>
                <TimeSeriesChart data={windSeries} variable="windSpeed" height={180} />
              </div>
            )}
            {waveSeries.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  {d.waveHeightChart} — {waveStation?.name}
                </p>
                <TimeSeriesChart data={waveSeries} variable="waveHeight" height={180} />
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, sub, valueTone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  valueTone?: "amber" | "red";
}) {
  const valueStyle = { amber: "text-amber-600", red: "text-red-600" };
  return (
    <Card className="p-4">
      <div className="mb-3">
        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 grid place-items-center">{icon}</div>
      </div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className={`text-2xl font-bold tabular ${valueTone ? valueStyle[valueTone] : "text-slate-900"}`}>{value}</p>
      {sub && <p className="text-xs mt-1 text-slate-400">{sub}</p>}
    </Card>
  );
}

function ZonePill({ children, color }: { children: ReactNode; color: "green" | "amber" | "red" }) {
  const style = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50  text-amber-700",
    red:   "bg-red-50    text-red-700",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${style[color]}`}>{children}</span>
  );
}
