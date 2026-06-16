import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ReferenceLine,
} from "recharts";
import { useApp } from "../App";
import { Card, SectionTitle, Empty, InfoNote, Pill } from "../components/ui";
import { StatisticalTestCard } from "../components/StatisticalTestCard";
import { fmtNum } from "../lib/format";
import type { DescriptiveStat } from "../types";
import { Download, Printer } from "lucide-react";

function downloadBlob(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function descriptiveToCsv(desc: Record<string, DescriptiveStat>): string {
  const cols = ["count", "missing", "mean", "median", "min", "max", "std", "p25", "p50", "p75"] as const;
  const head = ["variable", ...cols].join(",");
  const lines = Object.entries(desc).map(([k, s]) =>
    [`"${k}"`, ...cols.map((c) => (s[c] === null || s[c] === undefined ? "" : s[c]))].join(",")
  );
  return [head, ...lines].join("\n");
}

export function Reports() {
  const { data } = useApp();
  const { statistics, manifest } = data;
  const { descriptive, tests, correlationMatrix, ml, alpha } = statistics;

  const heat = useMemo(() => correlationMatrix, [correlationMatrix]);

  return (
    <div className="space-y-6">
      <SectionTitle title="Reports & statistics"
        subtitle={`Descriptive summaries, hypothesis tests (α = ${alpha}) and an exploratory model — verified variables only`}
        right={
          <div className="flex gap-2 no-print">
            <button onClick={() => downloadBlob("smartkinneret_descriptive.csv", descriptiveToCsv(descriptive), "text/csv")}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 border border-brand-200 rounded-lg px-3 py-1.5 hover:bg-brand-50">
              <Download size={15} /> CSV
            </button>
            <button onClick={() => downloadBlob("smartkinneret_statistics.json", JSON.stringify(statistics, null, 2), "application/json")}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 border border-brand-200 rounded-lg px-3 py-1.5 hover:bg-brand-50">
              <Download size={15} /> JSON
            </button>
            <button onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">
              <Printer size={15} /> Print
            </button>
          </div>
        } />

      <InfoNote>
        All analyses below exclude columns flagged as unit/quality unverified
        ({manifest.excludedColumns.length} column{manifest.excludedColumns.length === 1 ? "" : "s"}). Significance
        is assessed at α = {alpha}; where a parametric assumption is violated a non-parametric equivalent is reported.
      </InfoNote>

      {/* Descriptive statistics */}
      <Card className="p-5">
        <SectionTitle title="Descriptive statistics" subtitle="Per verified variable, across the observed record" />
        {Object.keys(descriptive).length === 0 ? <Empty /> : (
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-200">
                  {["Variable", "n", "Missing", "Mean", "Median", "Min", "Max", "Std", "P25", "P75"].map((h) => (
                    <th key={h} className="py-2 pr-4 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(descriptive).map(([k, s]) => (
                  <tr key={k} className="border-b border-slate-100">
                    <td className="py-2 pr-4 text-slate-700">{k}</td>
                    <td className="py-2 pr-4 tabular">{s.count.toLocaleString()}</td>
                    <td className="py-2 pr-4 tabular text-slate-400">{s.missing.toLocaleString()}</td>
                    <td className="py-2 pr-4 tabular">{fmtNum(s.mean)}</td>
                    <td className="py-2 pr-4 tabular">{fmtNum(s.median)}</td>
                    <td className="py-2 pr-4 tabular">{fmtNum(s.min)}</td>
                    <td className="py-2 pr-4 tabular">{fmtNum(s.max)}</td>
                    <td className="py-2 pr-4 tabular">{fmtNum(s.std)}</td>
                    <td className="py-2 pr-4 tabular">{fmtNum(s.p25)}</td>
                    <td className="py-2 pr-4 tabular">{fmtNum(s.p75)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Correlation heatmap */}
      <Card className="p-5">
        <SectionTitle title="Correlation matrix" subtitle="Pearson r between aligned hourly series (verified variables)" />
        {!heat ? <Empty hint="Not enough overlapping data to compute correlations." /> : (
          <Heatmap labels={heat.labels} values={heat.values} />
        )}
      </Card>

      {/* Hypothesis tests */}
      <div>
        <SectionTitle title="Hypothesis tests" subtitle="Each card states the question, hypotheses, assumptions and decision" />
        {tests.length === 0 ? <Card className="p-5"><Empty /></Card> : (
          <div className="space-y-4">
            {tests.map((t) => <StatisticalTestCard key={t.id} test={t} alpha={alpha} />)}
          </div>
        )}
      </div>

      {/* ML section */}
      <Card className="p-5">
        <SectionTitle title="Exploratory model (machine learning)" subtitle="Optional — supplements, does not replace, the transparent rule-based risk model" />
        {!ml ? <Empty hint="No model was trained (insufficient aligned data)." /> : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Pill tone="blue">{ml.model}</Pill>
              <Pill tone="slate">target: {ml.target}</Pill>
              <Pill tone="slate">{ml.split ?? "train/test split"}</Pill>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Metric label="R² (test)" value={fmtNum(ml.r2, 3)} />
              <Metric label="MAE" value={fmtNum(ml.mae, 3)} />
              <Metric label="RMSE" value={fmtNum(ml.rmse, 3)} />
              <Metric label="train / test n" value={`${ml.trainN.toLocaleString()} / ${ml.testN.toLocaleString()}`} />
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Feature importance</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart layout="vertical" data={ml.featureImportance}
                    margin={{ top: 4, right: 16, bottom: 4, left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fill: "#64748b" }} width={80} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                      formatter={(v: number) => [v.toFixed(3), "importance"]} />
                    <Bar dataKey="importance" fill="#0891b2" radius={[0, 4, 4, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Actual vs predicted (test set)</p>
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart margin={{ top: 4, right: 16, bottom: 16, left: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                    <XAxis type="number" dataKey="a" name="actual" tick={{ fontSize: 11, fill: "#94a3b8" }}
                      label={{ value: "actual", position: "insideBottom", offset: -8, fontSize: 11, fill: "#64748b" }} />
                    <YAxis type="number" dataKey="p" name="predicted" tick={{ fontSize: 11, fill: "#94a3b8" }} width={42}
                      label={{ value: "predicted", angle: -90, position: "insideLeft", fontSize: 11, fill: "#64748b" }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} cursor={{ strokeDasharray: "3 3" }} />
                    <ReferenceLine segment={refSegment(ml.actualVsPredicted)} stroke="#ef4444" strokeDasharray="4 4" />
                    <Scatter data={ml.actualVsPredicted.map(([a, p]) => ({ a, p }))} fill="#0891b2" fillOpacity={0.4} isAnimationActive={false} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
            <InfoNote tone="amber">{ml.note}</InfoNote>
          </div>
        )}
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl px-3 py-2">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="font-semibold text-ink-900 tabular">{value}</p>
    </div>
  );
}

function refSegment(pairs: [number, number][]) {
  if (!pairs.length) return [{ x: 0, y: 0 }, { x: 1, y: 1 }];
  let lo = Infinity, hi = -Infinity;
  for (const [a, p] of pairs) { lo = Math.min(lo, a, p); hi = Math.max(hi, a, p); }
  return [{ x: lo, y: lo }, { x: hi, y: hi }];
}

function Heatmap({ labels, values }: { labels: string[]; values: number[][] }) {
  const color = (r: number) => {
    const a = Math.min(Math.abs(r), 1);
    return r >= 0 ? `rgba(8,145,178,${0.12 + a * 0.7})` : `rgba(239,68,68,${0.12 + a * 0.7})`;
  };
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="p-2"></th>
            {labels.map((l) => <th key={l} className="p-2 text-slate-500 font-medium align-bottom whitespace-nowrap">{l}</th>)}
          </tr>
        </thead>
        <tbody>
          {values.map((row, i) => (
            <tr key={i}>
              <th className="p-2 text-right text-slate-500 font-medium whitespace-nowrap">{labels[i]}</th>
              {row.map((v, j) => (
                <td key={j} className="p-0">
                  <div className="w-16 h-12 grid place-items-center tabular font-semibold text-ink-900"
                    style={{ backgroundColor: i === j ? "#f1f5f9" : color(v) }}>
                    {v.toFixed(2)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
