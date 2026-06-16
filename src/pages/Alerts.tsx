import { useMemo, useState } from "react";
import { useApp } from "../App";
import { Card, SectionTitle, Empty, InfoNote } from "../components/ui";
import { MetricCard } from "../components/MetricCard";
import { AlertCard } from "../components/AlertCard";
import { FilterBar, Select, DateInput } from "../components/FilterBar";
import { VARIABLES } from "../config/unitsConfig";
import type { VariableKey } from "../types";
import { Bell, AlertTriangle, AlertCircle } from "lucide-react";

const PAGE = 40;

export function Alerts() {
  const { data } = useApp();
  const { alerts, stations } = data;
  const all = alerts.alerts;

  const [severity, setSeverity] = useState<"all" | "High Risk" | "Moderate Risk">("all");
  const [stationId, setStationId] = useState("all");
  const [variable, setVariable] = useState<"all" | VariableKey>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const variableOptions = useMemo(() => {
    const present = Array.from(new Set(all.map((a) => a.variable)));
    return present;
  }, [all]);

  const filtered = useMemo(() => {
    return all.filter((a) => {
      if (severity !== "all" && a.severity !== severity) return false;
      if (stationId !== "all" && a.stationId !== stationId) return false;
      if (variable !== "all" && a.variable !== variable) return false;
      if (from && a.timestamp.slice(0, 10) < from) return false;
      if (to && a.timestamp.slice(0, 10) > to) return false;
      return true;
    });
  }, [all, severity, stationId, variable, from, to]);

  const shown = filtered.slice(0, limit);
  const [dmin, dmax] = data.manifest.datasetRange.map((d) => d.slice(0, 10));

  return (
    <div className="space-y-6">
      <SectionTitle title="Alerts"
        subtitle="Threshold exceedances logged across the dataset — derived from the transparent risk model, not a live warning service" />

      <div className="grid grid-cols-3 gap-4">
        <MetricCard icon={<Bell size={18} />} label="Total logged" value={alerts.summary.total.toLocaleString()} tone="blue" />
        <MetricCard icon={<AlertTriangle size={18} />} label="High severity" value={alerts.summary.high.toLocaleString()} tone="red" />
        <MetricCard icon={<AlertCircle size={18} />} label="Moderate severity" value={alerts.summary.moderate.toLocaleString()} tone="amber" />
      </div>

      <FilterBar>
        <Select label="Severity" value={severity} onChange={(v) => { setSeverity(v as typeof severity); setLimit(PAGE); }}
          options={[{ value: "all", label: "All" }, { value: "High Risk", label: "High" }, { value: "Moderate Risk", label: "Moderate" }]} />
        <Select label="Station" value={stationId} onChange={(v) => { setStationId(v); setLimit(PAGE); }}
          options={[{ value: "all", label: "All stations" }, ...stations.map((s) => ({ value: s.id, label: s.name }))]} />
        <Select label="Variable" value={variable} onChange={(v) => { setVariable(v as typeof variable); setLimit(PAGE); }}
          options={[{ value: "all", label: "All variables" }, ...variableOptions.map((v) => ({ value: v, label: VARIABLES[v]?.label ?? v }))]} />
        <DateInput label="From" value={from} min={dmin} max={dmax} onChange={(v) => { setFrom(v); setLimit(PAGE); }} />
        <DateInput label="To" value={to} min={dmin} max={dmax} onChange={(v) => { setTo(v); setLimit(PAGE); }} />
      </FilterBar>

      <InfoNote>
        Showing <strong>{Math.min(limit, filtered.length).toLocaleString()}</strong> of{" "}
        <strong>{filtered.length.toLocaleString()}</strong> matching alerts. An alert is logged when an
        observed verified variable exceeds its data-driven p85 threshold; "High" corresponds to a combined
        risk score ≥ 67.
      </InfoNote>

      <Card className="p-5">
        {shown.length === 0 ? (
          <Empty title="No alerts match these filters" hint="Try widening the date range or clearing a filter." />
        ) : (
          <div className="space-y-3">
            {shown.map((a) => <AlertCard key={a.id} alert={a} />)}
          </div>
        )}
        {limit < filtered.length && (
          <button onClick={() => setLimit((l) => l + PAGE)}
            className="mt-4 w-full text-sm font-medium text-brand-600 border border-brand-200 rounded-lg py-2 hover:bg-brand-50 no-print">
            Load more ({(filtered.length - limit).toLocaleString()} remaining)
          </button>
        )}
      </Card>
    </div>
  );
}
