import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useApp } from "../App";
import { Card, SectionTitle, Empty, InfoNote } from "../components/ui";
import { FilterBar, Select } from "../components/FilterBar";
import { VARIABLES } from "../config/unitsConfig";
import { getBlock } from "../lib/select";
import { fmtNum } from "../lib/format";
import type { VariableKey } from "../types";
import { TrendingUp } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface MonthStat { month: string; mean: number | null; n: number; }

function climatology(months: string[], timestamps: string[], values: (number | null)[]): MonthStat[] {
  const sums = Array(12).fill(0);
  const counts = Array(12).fill(0);
  for (let i = 0; i < timestamps.length; i++) {
    const v = values[i];
    if (v === null || v === undefined || Number.isNaN(v)) continue;
    const m = Number(timestamps[i].slice(5, 7)) - 1;
    if (m < 0 || m > 11) continue;
    sums[m] += v; counts[m] += 1;
  }
  return months.map((month, i) => ({
    month,
    mean: counts[i] > 0 ? Math.round((sums[i] / counts[i]) * 100) / 100 : null,
    n: counts[i],
  }));
}

export function Forecast() {
  const { data } = useApp();
  const { stations, timeseries } = data;
  const { tr } = useLanguage();
  const f = tr.forecast;
  const months = tr.months;

  const chartStations = useMemo(
    () => stations.filter((s) => timeseries[s.id]?.vars.length),
    [stations, timeseries]
  );
  const [stationId, setStationId] = useState(chartStations[0]?.id ?? "");
  const vars = timeseries[stationId]?.vars ?? [];
  const [variable, setVariable] = useState<VariableKey>(vars[0] ?? "windSpeed");
  const effective = vars.includes(variable) ? variable : vars[0];
  const meta = effective ? VARIABLES[effective] : null;

  const stats = useMemo(() => {
    if (!effective) return [];
    const block = getBlock(timeseries, stationId, "daily");
    if (!block) return [];
    return climatology(months, block.timestamps as string[], (block[effective] as (number | null)[]) ?? []);
  }, [timeseries, stationId, effective, months]);

  const valid = stats.filter((s) => s.mean !== null);
  const peak = valid.length ? valid.reduce((a, b) => ((b.mean ?? 0) > (a.mean ?? 0) ? b : a)) : null;
  const low = valid.length ? valid.reduce((a, b) => ((b.mean ?? 0) < (a.mean ?? 0) ? b : a)) : null;
  const overall = valid.length ? valid.reduce((s, m) => s + (m.mean ?? 0), 0) / valid.length : null;

  const rows = stats.map((s) => ({ ...s, display: s.mean ?? 0 }));

  return (
    <div className="space-y-6">
      <SectionTitle title={f.title} subtitle={f.subtitle} />

      <InfoNote tone="amber">
        <strong>{f.disclaimerTitle}</strong> {f.disclaimer}
      </InfoNote>

      <FilterBar>
        <Select label={f.station} value={stationId} onChange={setStationId}
          options={chartStations.map((s) => ({ value: s.id, label: s.name }))} />
        <Select label={f.variable} value={effective ?? ""} onChange={(v) => setVariable(v as VariableKey)}
          options={vars.map((v) => ({ value: v, label: VARIABLES[v].label }))} />
      </FilterBar>

      {!effective || valid.length === 0 ? (
        <Card className="p-5"><Empty hint={f.noData} /></Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">{f.peakMonth}</p>
              <p className="text-xl font-bold text-ink-900 mt-1">{peak?.month}</p>
              <p className="text-sm text-slate-500 tabular">{fmtNum(peak?.mean, meta?.decimals ?? 2)} {meta?.unit}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">{f.lowMonth}</p>
              <p className="text-xl font-bold text-ink-900 mt-1">{low?.month}</p>
              <p className="text-sm text-slate-500 tabular">{fmtNum(low?.mean, meta?.decimals ?? 2)} {meta?.unit}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wide">{f.overallMean}</p>
              <p className="text-xl font-bold text-ink-900 mt-1 tabular">{fmtNum(overall, meta?.decimals ?? 2)}</p>
              <p className="text-sm text-slate-500">{meta?.unit}</p>
            </Card>
          </div>

          <Card className="p-5">
            <SectionTitle
              title={f.monthlyAvg.replace("{label}", meta?.label ?? "")}
              subtitle={f.climatology}
              right={<span className="inline-flex items-center gap-1.5 text-xs text-slate-400"><TrendingUp size={14} /> {meta?.unit}</span>}
            />
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} width={48}
                  label={{ value: meta?.unit, angle: -90, position: "insideLeft", fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v: number, _n, p) => {
                    const n = (p?.payload as MonthStat)?.n ?? 0;
                    return [`${v} ${meta?.unit} (n=${n})`, meta?.label];
                  }} />
                <Bar dataKey="display" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                  {rows.map((r, i) => (
                    <Cell key={i} fill={r.mean === null ? "#e2e8f0" : "#0891b2"} fillOpacity={r.mean === null ? 0.4 : 0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[11px] text-slate-400 mt-2">{f.chartNote}</p>
          </Card>
        </>
      )}
    </div>
  );
}
