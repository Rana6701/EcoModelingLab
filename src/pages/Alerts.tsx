import { useMemo, useState } from "react";
import { useApp } from "../App";
import { Card, SectionTitle, Empty, InfoNote } from "../components/ui";
import { MetricCard } from "../components/MetricCard";
import { AlertCard } from "../components/AlertCard";
import { FilterBar, Select, DateInput } from "../components/FilterBar";
import { VARIABLES } from "../config/unitsConfig";
import type { VariableKey } from "../types";
import { Bell, AlertTriangle, AlertCircle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const PAGE = 40;

export function Alerts() {
  const { data } = useApp();
  const { alerts, stations } = data;
  const all = alerts.alerts;
  const { tr } = useLanguage();
  const a = tr.alerts;

  const [severity, setSeverity] = useState<"all" | "High Risk" | "Moderate Risk">("all");
  const [stationId, setStationId] = useState("all");
  const [variable, setVariable] = useState<"all" | VariableKey>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const variableOptions = useMemo(() => {
    const present = Array.from(new Set(all.map((al) => al.variable)));
    return present;
  }, [all]);

  const filtered = useMemo(() => {
    return all.filter((al) => {
      if (severity !== "all" && al.severity !== severity) return false;
      if (stationId !== "all" && al.stationId !== stationId) return false;
      if (variable !== "all" && al.variable !== variable) return false;
      if (from && al.timestamp.slice(0, 10) < from) return false;
      if (to && al.timestamp.slice(0, 10) > to) return false;
      return true;
    });
  }, [all, severity, stationId, variable, from, to]);

  const shown = filtered.slice(0, limit);
  const [dmin, dmax] = data.manifest.datasetRange.map((d) => d.slice(0, 10));

  return (
    <div className="space-y-6">
      <SectionTitle title={a.title} subtitle={a.subtitle} />

      <div className="grid grid-cols-3 gap-4">
        <MetricCard icon={<Bell size={18} />} label={a.totalLogged} value={alerts.summary.total.toLocaleString()} tone="blue" />
        <MetricCard icon={<AlertTriangle size={18} />} label={a.highSeverity} value={alerts.summary.high.toLocaleString()} tone="red" />
        <MetricCard icon={<AlertCircle size={18} />} label={a.moderateSeverity} value={alerts.summary.moderate.toLocaleString()} tone="amber" />
      </div>

      <FilterBar>
        <Select label={a.severity} value={severity} onChange={(v) => { setSeverity(v as typeof severity); setLimit(PAGE); }}
          options={[{ value: "all", label: a.all }, { value: "High Risk", label: a.high }, { value: "Moderate Risk", label: a.moderate }]} />
        <Select label={a.station} value={stationId} onChange={(v) => { setStationId(v); setLimit(PAGE); }}
          options={[{ value: "all", label: a.allStations }, ...stations.map((s) => ({ value: s.id, label: s.name }))]} />
        <Select label={a.variable} value={variable} onChange={(v) => { setVariable(v as typeof variable); setLimit(PAGE); }}
          options={[{ value: "all", label: a.allVariables }, ...variableOptions.map((v) => ({ value: v, label: VARIABLES[v]?.label ?? v }))]} />
        <DateInput label={a.from} value={from} min={dmin} max={dmax} onChange={(v) => { setFrom(v); setLimit(PAGE); }} />
        <DateInput label={a.to} value={to} min={dmin} max={dmax} onChange={(v) => { setTo(v); setLimit(PAGE); }} />
      </FilterBar>

      <InfoNote>
        {a.showing.replace("{a}", Math.min(limit, filtered.length).toLocaleString()).replace("{b}", filtered.length.toLocaleString())}{" "}
        {a.footerNote}
      </InfoNote>

      <Card className="p-5">
        {shown.length === 0 ? (
          <Empty title={a.noMatch} hint={a.noMatchHint} />
        ) : (
          <div className="space-y-3">
            {shown.map((al) => <AlertCard key={al.id} alert={al} />)}
          </div>
        )}
        {limit < filtered.length && (
          <button onClick={() => setLimit((l) => l + PAGE)}
            className="mt-4 w-full text-sm font-medium text-brand-600 border border-brand-200 rounded-lg py-2 hover:bg-brand-50 no-print">
            {a.loadMore.replace("{n}", (filtered.length - limit).toLocaleString())}
          </button>
        )}
      </Card>
    </div>
  );
}
