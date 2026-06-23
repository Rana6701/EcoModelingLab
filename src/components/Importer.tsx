import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Card } from "./ui";
import { parseToa5, parseNumber, normalizeColumnName } from "../lib/parse";
import { VARIABLES } from "../config/unitsConfig";
import { UploadCloud, FileWarning, CheckCircle2 } from "lucide-react";

interface Preview {
  filename: string;
  format: string;
  columns: string[];
  mapped: { source: string; canonical: string | null }[];
  rows: (string | number | null)[][];
  totalRows: number;
  note?: string;
}

export function Importer() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setError(null); setPreview(null); setBusy(true);
    try {
      const lower = file.name.toLowerCase();
      if (lower.endsWith(".dat")) {
        const text = await file.text();
        const res = parseToa5(text);
        if (res.columns.length === 0) throw new Error("File did not look like a TOA5 .dat file (need ≥5 header/data lines).");
        setPreview(buildPreview(file.name, "Campbell TOA5 (.dat)", res.columns, res.rows, `units row: ${res.units.slice(0, 6).join(", ")}…`));
      } else if (lower.endsWith(".csv") || lower.endsWith(".tsv")) {
        const text = await file.text();
        const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
        const data = parsed.data as unknown as string[][];
        if (!data.length) throw new Error("No rows found in delimited file.");
        const [header, ...body] = data;
        const rows = body.map((r) => r.map((c, i) => (i === 0 ? c : parseNumber(c))));
        setPreview(buildPreview(file.name, "Delimited text (PapaParse)", header, rows));
      } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const aoa = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, blankrows: false });
        if (!aoa.length) throw new Error("No rows found in the first worksheet.");
        const header = (aoa[0] as unknown[]).map((c) => String(c));
        const rows = (aoa.slice(1) as unknown[][]).map((r) => r.map((c, i) => (i === 0 ? String(c) : parseNumber(c))));
        setPreview(buildPreview(file.name, `Spreadsheet (SheetJS · sheet "${wb.SheetNames[0]}")`, header, rows));
      } else {
        throw new Error("Unsupported file type. Use .csv, .tsv, .xlsx, .xls or .dat.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-ink-900">Import & inspect a raw file</h3>
      <p className="text-sm text-slate-500 mt-0.5">
        Parse a sensor file locally in the browser (CSV/TSV, Excel, or Campbell TOA5 .dat) to preview its
        structure and detected variables. Nothing is uploaded to a server.
      </p>

      <label className="mt-4 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 px-6 py-8 cursor-pointer hover:border-brand-400 hover:bg-brand-50/40 transition-colors no-print">
        <UploadCloud size={28} className="text-brand-500" />
        <span className="text-sm font-medium text-slate-600">{busy ? "Parsing…" : "Choose a file or drop it here"}</span>
        <span className="text-xs text-slate-400">.csv · .tsv · .xlsx · .xls · .dat</span>
        <input type="file" accept=".csv,.tsv,.xlsx,.xls,.dat" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </label>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <FileWarning size={16} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {preview && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <CheckCircle2 size={16} className="text-emerald-500" />
            <span className="font-medium text-ink-900">{preview.filename}</span>
            <span className="text-slate-400">· {preview.format}</span>
            <span className="text-slate-400">· {preview.totalRows.toLocaleString()} data rows</span>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 mb-1.5">Detected columns → canonical variable</p>
            <div className="flex flex-wrap gap-2">
              {preview.mapped.map((m, i) => (
                <span key={i} className={`text-xs rounded-lg px-2 py-1 border ${m.canonical ? "border-brand-200 bg-brand-50 text-brand-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                  <span className="font-sans">{m.source}</span>
                  {m.canonical && <span> → {VARIABLES[m.canonical as keyof typeof VARIABLES]?.label ?? m.canonical}</span>}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto scroll-thin border border-slate-200 rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>{preview.columns.map((c, i) => <th key={i} className="px-2.5 py-1.5 text-left font-medium text-slate-500 whitespace-nowrap">{c}</th>)}</tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 8).map((r, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {r.map((c, j) => <td key={j} className="px-2.5 py-1 tabular text-slate-700 whitespace-nowrap">{c === null ? "—" : String(c)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-400">
            Preview of the first 8 rows. This importer demonstrates parsing and column detection; to fold a
            new file into the dashboard, add it to <code>data_raw/</code> and run <code>npm run preprocess</code>.
            {preview.note ? ` ${preview.note}` : ""}
          </p>
        </div>
      )}
    </Card>
  );
}

function buildPreview(
  filename: string, format: string, columns: string[],
  rows: (string | number | null)[][], note?: string
): Preview {
  return {
    filename, format, columns, note,
    mapped: columns.map((c) => ({ source: c, canonical: normalizeColumnName(c) })),
    rows, totalRows: rows.length,
  };
}
