import { useMemo, useState } from "react";
import { useApp } from "../App";
import { Card, SectionTitle, Empty, InfoNote } from "../components/ui";
import { RiskBadge, StatusBadge } from "../components/StatusBadge";
import { RISK_WEIGHTS, RISK_CATEGORIES, VARIABLE_LABELS } from "../config/riskConfig";
import { VARIABLES, formatValue } from "../config/unitsConfig";
import { fmtDateTime } from "../lib/format";
import { Search, Info, Phone, ShieldAlert, Wind, Waves, Thermometer, AlertOctagon, CheckCircle2, AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Danger assessment helpers ──────────────────────────────────────────────
type DangerLevel = "safe" | "caution" | "danger" | "no-data";

const LEVEL_STYLE: Record<DangerLevel, {
  bg: string; border: string; text: string; label: string; Icon: LucideIcon;
}> = {
  safe:      { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800",  label: "Safe",    Icon: CheckCircle2    },
  caution:   { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-800",  label: "Caution", Icon: AlertTriangle   },
  danger:    { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-800",    label: "Danger",  Icon: AlertOctagon    },
  "no-data": { bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-500",  label: "No data", Icon: Info            },
};

const OVERALL_PRIORITY: DangerLevel[] = ["danger", "caution", "safe", "no-data"];

function worstLevel(levels: DangerLevel[]): DangerLevel {
  for (const l of OVERALL_PRIORITY) if (levels.includes(l)) return l;
  return "no-data";
}

function classifyWind(ms: number | null): DangerLevel {
  if (ms === null) return "no-data";
  if (ms > 8)  return "danger";
  if (ms > 5)  return "caution";
  return "safe";
}
function classifyWave(m: number | null): DangerLevel {
  if (m === null) return "no-data";
  if (m > 1.0) return "danger";
  if (m > 0.5) return "caution";
  return "safe";
}
function classifyAirTemp(c: number | null): DangerLevel {
  if (c === null) return "no-data";
  if (c > 37 || c < 10) return "danger";
  if (c > 32 || c < 15) return "caution";
  return "safe";
}

function maxVal(vals: (number | null | undefined)[]): number | null {
  const nums = vals.filter((v): v is number => typeof v === "number");
  return nums.length > 0 ? Math.max(...nums) : null;
}
function avgVal(vals: (number | null | undefined)[]): number | null {
  const nums = vals.filter((v): v is number => typeof v === "number");
  return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

export function PublicInfo() {
  const { data } = useApp();
  const { stations, manifest } = data;
  const [q, setQ] = useState("");

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return stations;
    return stations.filter((s) => s.name.toLowerCase().includes(t) || s.type.toLowerCase().includes(t));
  }, [stations, q]);

  // ── Danger assessment ────────────────────────────────────────────────────
  const maxWind  = maxVal(stations.map(s => s.latest.windSpeed?.value));
  const maxWave  = maxVal(stations.map(s => s.latest.waveHeight?.value));
  const avgAir   = avgVal(stations.map(s => s.latest.airTemp?.value));

  const windLevel  = classifyWind(maxWind);
  const waveLevel  = classifyWave(maxWave);
  const airLevel   = classifyAirTemp(avgAir);
  const overall    = worstLevel([windLevel, waveLevel]);

  const overallStyle = LEVEL_STYLE[overall];

  return (
    <div className="space-y-6">
      <SectionTitle title="Public information" subtitle="Plain-language station status and how the risk score is built" />

      <Card className="p-5">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a station by name or type…"
            className="w-full text-sm rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-300" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {matches.length === 0 ? <div className="col-span-full"><Empty title="No stations match your search" /></div> :
            matches.map((s) => (
              <div key={s.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink-900">{s.name}</span>
                  <StatusBadge status={s.status} />
                </div>
                <div className="mt-2"><RiskBadge category={s.risk.category} score={s.risk.score} /></div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {s.variables.slice(0, 4).map((v) => {
                    const meta = VARIABLES[v];
                    const latest = s.latest[v];
                    return (
                      <div key={v} className="bg-slate-50 rounded-lg px-2.5 py-1.5">
                        <p className="text-[11px] text-slate-400">{meta.short}</p>
                        <p className="text-sm font-semibold text-ink-900 tabular">{latest ? formatValue(latest.value, meta) : "—"}</p>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-400 mt-2 tabular">Last observation: {fmtDateTime(s.lastTimestamp)}</p>
              </div>
            ))}
        </div>
      </Card>

      {/* ── Danger situation detection ─────────────────────────────────────── */}
      <Card className="p-5">
        <SectionTitle title="זיהוי מצב סכנה — Danger Assessment" subtitle="Based on latest sensor readings across all stations" />

        {/* Overall banner */}
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 mb-5 ${overallStyle.bg} ${overallStyle.border}`}>
          <overallStyle.Icon size={22} className={overallStyle.text} />
          <div>
            <p className={`font-bold text-base ${overallStyle.text}`}>Overall: {overallStyle.label}</p>
            <p className={`text-xs mt-0.5 ${overallStyle.text} opacity-80`}>
              Worst-case across wind and wave readings from all active stations.
            </p>
          </div>
        </div>

        {/* Factor cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Wind */}
          {(() => {
            const s = LEVEL_STYLE[windLevel];
            return (
              <div className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
                <div className={`flex items-center gap-2 font-semibold text-sm ${s.text}`}>
                  <Wind size={16} /> רוח — Wind Speed
                </div>
                <p className={`text-2xl font-bold tabular mt-2 ${s.text}`}>
                  {maxWind !== null ? `${maxWind.toFixed(1)} m/s` : "—"}
                </p>
                <p className={`text-xs mt-1 ${s.text} opacity-75`}>
                  {windLevel === "safe"    && "Calm — suitable for water activity"}
                  {windLevel === "caution" && "Moderate wind — exercise caution"}
                  {windLevel === "danger"  && "Strong wind — avoid open water"}
                  {windLevel === "no-data" && "No recent wind data available"}
                </p>
                <p className={`text-[10px] mt-2 ${s.text} opacity-50`}>Thresholds: &gt;5 m/s caution · &gt;8 m/s danger</p>
              </div>
            );
          })()}

          {/* Waves */}
          {(() => {
            const s = LEVEL_STYLE[waveLevel];
            return (
              <div className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
                <div className={`flex items-center gap-2 font-semibold text-sm ${s.text}`}>
                  <Waves size={16} /> גלים — Wave Height (Hs)
                </div>
                <p className={`text-2xl font-bold tabular mt-2 ${s.text}`}>
                  {maxWave !== null ? `${maxWave.toFixed(2)} m` : "—"}
                </p>
                <p className={`text-xs mt-1 ${s.text} opacity-75`}>
                  {waveLevel === "safe"    && "Low waves — safe conditions"}
                  {waveLevel === "caution" && "Moderate waves — caution advised"}
                  {waveLevel === "danger"  && "High waves — dangerous for swimmers"}
                  {waveLevel === "no-data" && "No recent wave data available"}
                </p>
                <p className={`text-[10px] mt-2 ${s.text} opacity-50`}>Thresholds: &gt;0.5 m caution · &gt;1.0 m danger</p>
              </div>
            );
          })()}

          {/* Temperature */}
          {(() => {
            const s = LEVEL_STYLE[airLevel];
            return (
              <div className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
                <div className={`flex items-center gap-2 font-semibold text-sm ${s.text}`}>
                  <Thermometer size={16} /> טמפרטורה — Air Temp
                </div>
                <p className={`text-2xl font-bold tabular mt-2 ${s.text}`}>
                  {avgAir !== null ? `${avgAir.toFixed(1)} °C` : "—"}
                </p>
                <p className={`text-xs mt-1 ${s.text} opacity-75`}>
                  {airLevel === "safe"    && "Comfortable temperature range"}
                  {airLevel === "caution" && "Temperature at edge of comfort zone"}
                  {airLevel === "danger"  && "Extreme temperature — health risk"}
                  {airLevel === "no-data" && "No recent temperature data available"}
                </p>
                <p className="text-[10px] mt-2 text-slate-400 italic">
                  ⚠ Air temperature only — water temperature not in dataset
                </p>
              </div>
            );
          })()}
        </div>

        <InfoNote tone="amber">
          <span className="inline-flex items-center gap-1.5 font-semibold"><ShieldAlert size={14} /> Dataset limitation:</span>{" "}
          Water temperature sensors are not included in the current dataset. The temperature shown is air temperature only.
          Always check with local lifeguard authorities before entering the water.
        </InfoNote>
      </Card>

      {/* How the score works */}
      <Card className="p-5">
        <SectionTitle title="How the risk score works" subtitle="Transparent, rule-based — no black box" />
        <p className="text-sm text-slate-600">
          Each verified variable contributes points toward a 0–100 score. A variable adds nothing while it
          stays below its typical level (the median, p50) for that station, begins adding points as it rises
          past it, and reaches its full weight once it exceeds the p85 of the observed record. The weighted
          points are summed and mapped to a category.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div>
            <p className="text-sm font-medium text-slate-600 mb-2">Variable weights</p>
            <div className="space-y-1.5">
              {Object.entries(RISK_WEIGHTS).map(([k, w]) => (
                <div key={k}>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 capitalize">{VARIABLE_LABELS[k] ?? k}</span>
                    <span className="tabular font-medium">{w} pts</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 mt-0.5">
                    <div className="h-2 rounded-full bg-brand-500" style={{ width: `${w}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-600 mb-2">Categories</p>
            <div className="space-y-2">
              {RISK_CATEGORIES.map((c) => (
                <div key={c.label} className="flex items-center justify-between text-sm rounded-lg border border-slate-200 px-3 py-2">
                  <RiskBadge category={c.label} />
                  <span className="tabular text-slate-500">{Math.round(c.min)}–{Math.round(c.max)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm rounded-lg border border-slate-200 px-3 py-2">
                <RiskBadge category="Insufficient Data" />
                <span className="tabular text-slate-500">no verified inputs</span>
              </div>
            </div>
          </div>
        </div>
        <InfoNote tone="blue">
          <span className="inline-flex items-center gap-1.5"><Info size={14} /> Risk model v{manifest.riskVersion}.</span>{" "}
          Thresholds are computed from each station's own observed history, so "high" means high relative to
          what that location actually experiences.
        </InfoNote>
      </Card>

      {/* Emergency info */}
      <Card className="p-5">
        <SectionTitle title="Emergency information" subtitle="Israeli national emergency numbers" />
        <InfoNote tone="amber">
          <span className="inline-flex items-center gap-1.5 font-semibold"><ShieldAlert size={14} /> In a life-threatening emergency, call 100 (Police) or 101 (MDA) immediately.</span>
        </InfoNote>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {[
            { label: "Police", number: "100", desc: "שירות המשטרה" },
            { label: "Ambulance (MDA)", number: "101", desc: "מגן דוד אדום" },
            { label: "Fire & Rescue", number: "102", desc: "כיבוי והצלה" },
            { label: "Home Front Command", number: "104", desc: "פיקוד העורף" },
            { label: "Sea Rescue (Police Marine)", number: "100", desc: "יחידה ימית – משטרה" },
            { label: "Nature & Parks Authority", number: "1-800-350-550", desc: "רשות הטבע והגנים" },
          ].map((e) => (
            <a key={e.label} href={`tel:${e.number.replace(/-/g, "")}`}
              className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-200 transition-colors p-4 group">
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 group-hover:text-brand-700">
                <Phone size={14} /> {e.label}
              </p>
              <p className="text-xl font-bold text-ink-900 tabular mt-1">{e.number}</p>
              <p className="text-xs text-slate-400 mt-0.5">{e.desc}</p>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
