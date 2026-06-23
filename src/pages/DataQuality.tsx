import { useApp } from "../App";
import { Card, SectionTitle, Empty, InfoNote, Pill } from "../components/ui";
import { MetricCard } from "../components/MetricCard";
import { DataQualityTable } from "../components/DataQualityTable";
import { Importer } from "../components/Importer";
import { Download, FileCheck2, FileX2, AlertTriangle, Layers } from "lucide-react";

function downloadReport(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function DataQuality() {
  const { data } = useApp();
  const { dataQuality: dq, manifest } = data;

  const totalDup = dq.files.reduce((s, f) => s + f.duplicateTimestamps, 0);

  const reportText = [
    "SmartKinneret — data quality / parse report",
    `Generated: ${manifest.generatedAt}`,
    `Files parsed: ${dq.filesParsed}   Files failed: ${dq.filesFailed}`,
    "",
    "PER-FILE SUMMARY",
    ...dq.files.map((f) =>
      `- ${f.file} [${f.station}] parsed=${f.parsed} rows=${f.rows}/${f.rawRows} usable=${f.usablePct}% ` +
      `duplicates=${f.duplicateTimestamps}` +
      (f.unverifiedColumns.length ? ` unverified=${f.unverifiedColumns.join("|")}` : "") +
      (f.depthLevels ? ` depthLevels=${f.depthLevels.length}` : "")
    ),
    "",
    "UNVERIFIED COLUMNS (excluded from stats/risk/ML)",
    ...dq.unverifiedColumns.map((u) => `- ${u.station}.${u.column} (${u.variable}): ${u.reason} | ACTION: ${u.action}`),
    "",
    "UNCONFIRMED / ASSUMED UNITS",
    ...dq.unconfirmedUnits.map((u) => `- ${u.field}: [${u.status}] ${u.detail}`),
    "",
    "PARSE ERRORS",
    ...(dq.parseErrors.length ? dq.parseErrors.map((e) => `- ${e}`) : ["- none"]),
  ].join("\n");

  return (
    <div className="space-y-6">
      <SectionTitle title="Data quality" subtitle="Parsing results, missing data, and every documented assumption & exclusion"
        right={
          <button onClick={() => downloadReport("smartkinneret_dataquality_report.txt", reportText)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 border border-brand-200 rounded-lg px-3 py-1.5 hover:bg-brand-50 no-print">
            <Download size={15} /> Download report
          </button>
        } />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={<FileCheck2 size={18} />} label="Files parsed" value={dq.filesParsed} tone="green" />
        <MetricCard icon={<FileX2 size={18} />} label="Files failed" value={dq.filesFailed} tone={dq.filesFailed ? "red" : "slate"} />
        <MetricCard icon={<AlertTriangle size={18} />} label="Unverified columns" value={dq.unverifiedColumns.length} tone="amber" />
        <MetricCard icon={<Layers size={18} />} label="Duplicate timestamps" value={totalDup.toLocaleString()} tone="slate" />
      </div>

      <Card className="p-5">
        <SectionTitle title="Files parsed" subtitle="Rows kept vs raw, usable percentage, duplicates and flags" />
        {dq.files.length === 0 ? <Empty /> : <DataQualityTable files={dq.files} />}
      </Card>

      {/* Unverified columns */}
      <Card className="p-5">
        <SectionTitle title="Unit / quality unverified columns" subtitle="Kept in the system, excluded from analysis, displayed only as flagged issues" />
        {dq.unverifiedColumns.length === 0 ? <Empty title="No unverified columns" /> : (
          <div className="space-y-3">
            {dq.unverifiedColumns.map((u, i) => (
              <div key={i} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <div className="flex items-center gap-2">
                  <Pill tone="amber">{u.station}</Pill>
                  <span className="font-sans text-sm text-ink-900">{u.column}</span>
                  <span className="text-xs text-slate-400">→ {u.variable}</span>
                </div>
                <p className="text-sm text-slate-700 mt-2">{u.reason}</p>
                <p className="text-sm text-amber-800 mt-1"><strong>Action:</strong> {u.action}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Assumptions & unconfirmed units */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <SectionTitle title="Documented assumptions" />
          <ul className="space-y-2">
            {manifest.assumptions.map((a, i) => (
              <li key={i} className="text-sm text-slate-700 flex gap-2"><span className="text-brand-500">•</span>{a}</li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <SectionTitle title="Unconfirmed / assumed units" />
          <div className="space-y-2">
            {dq.unconfirmedUnits.map((u, i) => (
              <div key={i} className="text-sm border-b border-slate-100 pb-2 last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-ink-900">{u.field}</span>
                  <Pill tone={u.status.includes("unverified") ? "amber" : "slate"}>{u.status}</Pill>
                </div>
                <p className="text-slate-600 mt-0.5">{u.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Excluded columns echo from manifest */}
      <Card className="p-5">
        <SectionTitle title="Excluded columns (manifest)" subtitle="Authoritative list carried in manifest.json" />
        {manifest.excludedColumns.length === 0 ? <Empty title="None" /> : (
          <ul className="space-y-1.5">
            {manifest.excludedColumns.map((c, i) => (
              <li key={i} className="text-sm font-sans text-slate-700 bg-slate-50 rounded-lg px-3 py-2">{c}</li>
            ))}
          </ul>
        )}
      </Card>

      {/* Parse errors */}
      <Card className="p-5">
        <SectionTitle title="Parse errors" />
        {dq.parseErrors.length === 0
          ? <InfoNote>No parse errors were recorded — all {dq.filesParsed} files parsed successfully.</InfoNote>
          : <ul className="space-y-1.5">{dq.parseErrors.map((e, i) => <li key={i} className="text-sm text-red-700 font-sans">{e}</li>)}</ul>}
      </Card>

      {/* In-app importer */}
      <Importer />
    </div>
  );
}
