import { useState } from "react";
import { useApp } from "../App";
import { Card, SectionTitle, InfoNote } from "../components/ui";
import { RealLakeMap } from "../components/RealLakeMap";
import { RiskBadge, StatusBadge } from "../components/StatusBadge";
import { RiskGauge } from "../components/RiskGauge";
import { VARIABLES, formatValue } from "../config/unitsConfig";
import { fmtDateTime } from "../lib/format";
import { MapPin } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function LakeMapPage() {
  const { data, selectedStation, setSelectedStation, navigate } = useApp();
  const { stations, beaches } = data;
  const [sel, setSel] = useState<string | null>(selectedStation ?? stations[0]?.id ?? null);
  const station = stations.find((s) => s.id === sel) ?? null;
  const { tr } = useLanguage();
  const m = tr.map;

  return (
    <div className="space-y-6">
      <SectionTitle title={m.title} subtitle={m.subtitle} />

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <Card className="p-2">
          <RealLakeMap
            stations={stations}
            beaches={beaches}
            selected={sel}
            onSelect={(id) => { setSel(id); setSelectedStation(id); }}
            height={520}
          />
        </Card>

        <div className="space-y-4">
          {station ? (
            <Card className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-ink-900">{station.name}</h3>
                  <p className="text-xs text-slate-400 capitalize mt-0.5">{station.type.replace("+", " + ")}</p>
                </div>
                <StatusBadge status={station.status} />
              </div>
              <div className="flex flex-col items-center my-3">
                <RiskGauge score={station.risk.score} size={150} />
              </div>
              <div className="flex justify-center mb-3">
                <RiskBadge category={station.risk.category} score={station.risk.score} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {station.variables.slice(0, 6).map((v) => {
                  const meta = VARIABLES[v];
                  const latest = station.latest[v];
                  return (
                    <div key={v} className="bg-slate-50 rounded-lg px-2.5 py-1.5">
                      <p className="text-[11px] text-slate-400">{meta.short}</p>
                      <p className="text-sm font-semibold text-ink-900 tabular">
                        {latest ? formatValue(latest.value, meta) : "—"}
                      </p>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-slate-400 mt-3 tabular inline-flex items-center gap-1">
                <MapPin size={11} /> approx ({station.lat.toFixed(3)}, {station.lng.toFixed(3)}) · last {fmtDateTime(station.lastTimestamp)}
              </p>
              <button
                onClick={() => { setSelectedStation(station.id); navigate("sensors"); }}
                className="mt-3 w-full text-sm font-medium text-brand-600 border border-brand-200 rounded-lg py-2 hover:bg-brand-50 no-print"
              >
                {m.openDetail}
              </button>
            </Card>
          ) : null}

          <InfoNote tone="amber">{m.coordsNote}</InfoNote>
        </div>
      </div>
    </div>
  );
}
