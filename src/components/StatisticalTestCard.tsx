import { useState, type ReactNode } from "react";
import type { StatTest } from "../types";
import { Card, Pill } from "./ui";
import { CorrelationChart } from "./CorrelationChart";
import { ChevronDown, ChevronUp } from "lucide-react";

export function StatisticalTestCard({ test, alpha }: { test: StatTest; alpha: number }) {
  const [open, setOpen] = useState(false);
  const significant = test.pValue !== undefined && test.pValue < alpha;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Pill tone="blue">{test.name}</Pill>
            {test.pValue !== undefined && (
              <Pill tone={significant ? "green" : "slate"}>
                {significant ? "Significant" : "Not significant"} · p {fmtP(test.pValue)}
              </Pill>
            )}
          </div>
          <h3 className="mt-2 font-semibold text-ink-900">{test.title}</h3>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="text-slate-400 hover:text-brand-600 no-print" aria-label="Toggle details">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      <p className="text-sm text-slate-600 mt-2">{test.plainLanguage}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {test.statistic !== undefined && (
          <Stat label={test.statisticName ?? "statistic"} value={String(test.statistic)} />
        )}
        {test.pValue !== undefined && <Stat label="p-value" value={fmtP(test.pValue)} />}
        {test.n !== undefined && <Stat label="n (paired)" value={test.n.toLocaleString()} />}
        {test.dof !== undefined && <Stat label="dof" value={String(test.dof)} />}
        {test.r2 !== undefined && <Stat label="R²" value={String(test.r2)} />}
        {test.rmse !== undefined && <Stat label="RMSE" value={String(test.rmse)} />}
      </div>

      {(test.scatter && test.scatter.length > 0) && (
        <div className="mt-4">
          <CorrelationChart scatter={test.scatter} regression={test.regression}
            xLabel={test.xLabel ?? "x"} yLabel={test.yLabel ?? "y"} height={260} />
        </div>
      )}

      {test.groupMeans && (
        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(test.groupMeans).map(([k, v]) => (
            <span key={k} className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 tabular">
              {k}: <strong>{v}</strong>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="mt-4 border-t border-slate-100 pt-4 space-y-3 text-sm">
          <Row label="Why this test">{test.why}</Row>
          <Row label="Variables">
            {test.variables.map((v) => `${v.name} (${v.type}${v.unit ? `, ${v.unit}` : ""})`).join("; ")}
          </Row>
          <Row label="H₀ (null)">{test.h0}</Row>
          <Row label="H₁ (alternative)">{test.h1}</Row>
          <Row label="Assumptions">{test.assumptions.join("; ")}</Row>
          {test.assumptionChecks && (
            <Row label="Assumption checks">
              {Object.entries(test.assumptionChecks).map(([k, v]) => `${k}: ${String(v)}`).join("; ")}
            </Row>
          )}
          {test.nonParametric && (
            <Row label={`Non-parametric (${test.nonParametric.shown ? "applied — assumption violated" : "for reference"})`}>
              {test.nonParametric.name}: H = {test.nonParametric.H ?? test.nonParametric.statistic},
              p = {fmtP(test.nonParametric.pValue)} — {test.nonParametric.interpretation}
            </Row>
          )}
          {test.equation && <Row label="Fitted model">{test.equation}</Row>}
          {test.expectedWarning && (
            <Row label="Caution">{test.expectedLowCells} expected cell(s) below 5 — chi-square approximation may be unreliable.</Row>
          )}
          <Row label="Decision">{test.interpretation}</Row>
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl px-3 py-2">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="font-semibold text-ink-900 tabular">{value}</p>
    </div>
  );
}
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-700">{children}</span>
    </div>
  );
}
function fmtP(p: number): string {
  if (p < 0.001) return "< 0.001";
  return p.toFixed(3);
}
