import { useState, type ReactNode } from "react";
import type { StatTest } from "../types";
import { Card, Pill } from "./ui";
import { CorrelationChart } from "./CorrelationChart";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { testTranslations } from "../i18n/translations";

export function StatisticalTestCard({ test, alpha }: { test: StatTest; alpha: number }) {
  const [open, setOpen] = useState(false);
  const { tr, lang } = useLanguage();
  const st = tr.components.statTest;

  const tl = testTranslations[lang][test.id];
  const name           = tl?.name           ?? test.name;
  const title          = tl?.title          ?? test.title;
  const plainLanguage  = tl?.plainLanguage  ?? test.plainLanguage;
  const why            = tl?.why            ?? test.why;
  const h0             = tl?.h0             ?? test.h0;
  const h1             = tl?.h1             ?? test.h1;
  const assumptions    = tl?.assumptions    ?? test.assumptions;
  const interpretation = tl?.interpretation ?? test.interpretation;
  const equation       = tl?.equation       ?? test.equation;
  const npName         = tl?.nonParametric?.name         ?? test.nonParametric?.name;
  const npInterp       = tl?.nonParametric?.interpretation ?? test.nonParametric?.interpretation;

  const significant = test.pValue !== undefined && test.pValue < alpha;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Pill tone="blue">{name}</Pill>
            {test.pValue !== undefined && (
              <Pill tone={significant ? "green" : "slate"}>
                {significant ? st.significant : st.notSignificant} · p {fmtP(test.pValue)}
              </Pill>
            )}
          </div>
          <h3 className="mt-2 font-semibold text-ink-900">{title}</h3>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="text-slate-400 hover:text-brand-600 no-print" aria-label="Toggle details">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      <p className="text-sm text-slate-600 mt-2">{plainLanguage}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {test.statistic !== undefined && (
          <Stat label={test.statisticName ?? st.statistic} value={String(test.statistic)} />
        )}
        {test.pValue !== undefined && <Stat label={st.pValue} value={fmtP(test.pValue)} />}
        {test.n !== undefined && <Stat label={st.nPaired} value={test.n.toLocaleString()} />}
        {test.dof !== undefined && <Stat label={st.dof} value={String(test.dof)} />}
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
          <Row label={st.whyTest}>{why}</Row>
          <Row label={st.variables}>
            {test.variables.map((v) => `${v.name} (${v.type}${v.unit ? `, ${v.unit}` : ""})`).join("; ")}
          </Row>
          {h0 && <Row label={st.h0}>{h0}</Row>}
          {h1 && <Row label={st.h1}>{h1}</Row>}
          <Row label={st.assumptions}>{assumptions.join("; ")}</Row>
          {test.assumptionChecks && (
            <Row label={st.assumptionChecks}>
              {Object.entries(test.assumptionChecks).map(([k, v]) => `${k}: ${String(v)}`).join("; ")}
            </Row>
          )}
          {test.nonParametric && npName && npInterp && (
            <Row label={`${test.nonParametric.shown ? st.nonParamApplied : st.nonParamRef}`}>
              {npName}: H = {test.nonParametric.H ?? test.nonParametric.statistic},
              p = {fmtP(test.nonParametric.pValue)} — {npInterp}
            </Row>
          )}
          {equation && <Row label={st.fittedModel}>{equation}</Row>}
          {test.expectedWarning && (
            <Row label={st.caution}>{test.expectedLowCells} {st.expectedCells}</Row>
          )}
          <Row label={st.decision}>{interpretation}</Row>
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl px-3 py-2">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="font-semibold text-ink-900 tabular" dir="ltr">{value}</p>
    </div>
  );
}
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3">
      <span className="text-slate-400 text-start">{label}</span>
      <span className="text-slate-700">{children}</span>
    </div>
  );
}
function fmtP(p: number): string {
  if (p < 0.001) return "< 0.001";
  return p.toFixed(3);
}
