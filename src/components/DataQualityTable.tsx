import type { ReactNode } from "react";
import type { DQFile } from "../types";
import { fmtDateRange } from "../lib/format";

export function DataQualityTable({ files }: { files: DQFile[] }) {
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-start text-slate-400 border-b border-slate-200">
            <Th>File</Th><Th>Station</Th><Th>Status</Th><Th>Rows</Th>
            <Th>Date range</Th><Th>Usable %</Th><Th>Duplicates</Th><Th>Flags</Th>
          </tr>
        </thead>
        <tbody>
          {files.map((f, i) => (
            <tr key={i} className="border-b border-slate-100 align-top">
              <Td><span className="font-sans text-xs">{f.file}</span></Td>
              <Td>{f.station}</Td>
              <Td>
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${f.parsed ? "text-emerald-600" : "text-red-600"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${f.parsed ? "bg-emerald-500" : "bg-red-500"}`} />
                  {f.parsed ? "Parsed" : "Failed"}
                </span>
              </Td>
              <Td className="tabular" dir="ltr">{f.rows.toLocaleString()}<span className="text-slate-300"> / {f.rawRows.toLocaleString()}</span></Td>
              <Td className="tabular whitespace-nowrap" dir="ltr">{fmtDateRange(f.dateRange)}</Td>
              <Td className="tabular" dir="ltr">{f.usablePct}%</Td>
              <Td className="tabular" dir="ltr">{f.duplicateTimestamps}</Td>
              <Td>
                {f.unverifiedColumns.length > 0
                  ? <span className="text-amber-600 text-xs">{f.unverifiedColumns.join(", ")} unverified</span>
                  : <span className="text-slate-300 text-xs">—</span>}
                {f.depthLevels && <span className="block text-[11px] text-slate-400">{f.depthLevels.length} depth levels</span>}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="py-2 pe-4 font-medium">{children}</th>;
}
function Td({ children, className = "", dir }: { children: ReactNode; className?: string; dir?: "ltr" | "rtl" }) {
  return <td className={`py-2.5 pe-4 text-slate-700 ${className}`} dir={dir}>{children}</td>;
}
