import { useMemo } from "react";
import { useApp } from "../App";
import { Card, SectionTitle, InfoNote } from "../components/ui";
import {
  CheckCircle2, AlertTriangle, AlertOctagon,
  Wind, Waves, Thermometer, CloudRain, Gauge,
  Phone, ShieldAlert, Activity, Info,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { RiskCategory } from "../types";
import { RISK_WEIGHTS } from "../config/riskConfig";

// ── helpers ─────────────────────────────────────────────────────────────────

function maxVal(vals: (number | null | undefined)[]): number | null {
  const nums = vals.filter((v): v is number => typeof v === "number");
  return nums.length > 0 ? Math.max(...nums) : null;
}
function avgVal(vals: (number | null | undefined)[]): number | null {
  const nums = vals.filter((v): v is number => typeof v === "number");
  return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

type Level = "safe" | "caution" | "danger" | "no-data";

const LEVEL: Record<Level, { bg: string; border: string; text: string; label: string }> = {
  safe:      { bg: "bg-green-50",  border: "border-green-300",  text: "text-green-800",  label: "Safe"    },
  caution:   { bg: "bg-amber-50",  border: "border-amber-300",  text: "text-amber-800",  label: "Caution" },
  danger:    { bg: "bg-red-50",    border: "border-red-300",    text: "text-red-800",    label: "Danger"  },
  "no-data": { bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-500",  label: "No data" },
};

function classifyWind(ms: number | null): Level {
  if (ms === null) return "no-data";
  return ms > 8 ? "danger" : ms > 5 ? "caution" : "safe";
}
function classifyWave(m: number | null): Level {
  if (m === null) return "no-data";
  return m > 1.0 ? "danger" : m > 0.5 ? "caution" : "safe";
}
const WORST: Level[] = ["danger", "caution", "safe", "no-data"];
function worst(levels: Level[]): Level {
  for (const l of WORST) if (levels.includes(l)) return l;
  return "no-data";
}

// ── Risk level descriptions ─────────────────────────────────────────────────

const RISK_LEVELS: {
  category: RiskCategory;
  range: string;
  Icon: LucideIcon;
  bg: string; border: string; text: string;
  headline: string;
  body: string;
}[] = [
  {
    category: "Low Risk", range: "0 – 33",
    Icon: CheckCircle2,
    bg: "bg-green-50", border: "border-green-300", text: "text-green-800",
    headline: "Conditions are calm",
    body: "Wind, waves, and currents are within normal range. Generally suitable for water activities, but always check with the lifeguard on duty.",
  },
  {
    category: "Moderate Risk", range: "34 – 66",
    Icon: AlertTriangle,
    bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-800",
    headline: "Elevated environmental conditions",
    body: "One or more indicators — wind speed, wave height, or current — are above their typical level. Exercise caution; inexperienced or young swimmers should stay out.",
  },
  {
    category: "High Risk", range: "67 – 100",
    Icon: AlertOctagon,
    bg: "bg-red-50", border: "border-red-300", text: "text-red-800",
    headline: "Dangerous conditions",
    body: "Conditions are significantly above normal. It is strongly advised to avoid entering the water. Follow instructions from lifeguards and local authorities.",
  },
];

// ── Variable explanations ────────────────────────────────────────────────────

const VARIABLE_EXPLAINERS: {
  Icon: LucideIcon; label: string; weight: number;
  why: string; safe: string; caution: string; danger: string;
}[] = [
  {
    Icon: Wind,
    label: "Wind Speed",
    weight: RISK_WEIGHTS.windSpeed,
    why: "Strong wind raises waves and can quickly exhaust swimmers. Above 5 m/s warrants caution; above 8 m/s is dangerous for open-water swimming.",
    safe: "< 5 m/s", caution: "5 – 8 m/s", danger: "> 8 m/s",
  },
  {
    Icon: Waves,
    label: "Wave Height (Hs)",
    weight: RISK_WEIGHTS.waveHeight,
    why: "Significant wave height measures the average of the highest third of waves. Even 0.5 m waves can knock a person off their feet near the shore.",
    safe: "< 0.5 m", caution: "0.5 – 1.0 m", danger: "> 1.0 m",
  },
  {
    Icon: Gauge,
    label: "Current Magnitude",
    weight: RISK_WEIGHTS.currentMag,
    why: "Lake currents can drag swimmers away from shore or into deeper water. Even slow currents are tiring to swim against over time.",
    safe: "< p50", caution: "p50 – p85", danger: "> p85",
  },
  {
    Icon: CloudRain,
    label: "Rainfall",
    weight: RISK_WEIGHTS.rainfall,
    why: "Heavy rain reduces visibility, lowers water temperature sharply, and can bring debris into the lake. It is also a signal of storm conditions.",
    safe: "< p50", caution: "p50 – p85", danger: "> p85",
  },
  {
    Icon: Thermometer,
    label: "Air Temperature",
    weight: 0,
    why: "Not included in the risk score (water temperature sensors are not in this dataset), but extreme air temperature affects comfort and safety. Shown as informational only.",
    safe: "15 – 32 °C", caution: "32 – 37 °C or < 15 °C", danger: "> 37 °C or < 10 °C",
  },
];

// ── Scoring curve explainer ──────────────────────────────────────────────────

const SCORE_STEPS = [
  { label: "Below median (p50)", pts: "0 pts", desc: "Variable is at a normal level — no contribution to score." },
  { label: "Between p50 and p85", pts: "0 → ½ weight", desc: "Elevated above typical — partial contribution, scaling linearly." },
  { label: "Above p85", pts: "½ → full weight", desc: "Significantly elevated — full contribution reached as it rises further above p85." },
];

// ── Component ────────────────────────────────────────────────────────────────

export function PublicInfo() {
  const { data } = useApp();
  const { stations } = data;

  const maxWind = maxVal(stations.map(s => s.latest.windSpeed?.value));
  const maxWave = maxVal(stations.map(s => s.latest.waveHeight?.value));
  const avgTemp = avgVal(stations.map(s => s.latest.airTemp?.value));

  const windLv = classifyWind(maxWind);
  const waveLv = classifyWave(maxWave);
  const overall = worst([windLv, waveLv]);
  const ovStyle = LEVEL[overall];

  const OverallIcon = useMemo(() => {
    if (overall === "safe")    return CheckCircle2;
    if (overall === "caution") return AlertTriangle;
    if (overall === "danger")  return AlertOctagon;
    return Info;
  }, [overall]);

  const overallText = {
    safe:      { headline: "Conditions appear calm",        sub: "Wind and waves are within normal ranges." },
    caution:   { headline: "Elevated conditions detected",  sub: "Wind or wave readings are above typical levels." },
    danger:    { headline: "Dangerous conditions",          sub: "Significant wind or wave activity detected." },
    "no-data": { headline: "Insufficient current data",     sub: "Not enough recent sensor readings to assess conditions." },
  }[overall];

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Public Information"
        subtitle="Plain-language guide to lake safety — what the system measures and what it means"
      />

      {/* ── 1. Is it safe right now? ── */}
      <Card className={`p-6 border-2 ${ovStyle.border} ${ovStyle.bg}`}>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Current conditions</p>
        <div className="flex items-start gap-4">
          <OverallIcon size={40} className={ovStyle.text} />
          <div className="flex-1">
            <h2 className={`text-2xl font-bold ${ovStyle.text}`}>{overallText.headline}</h2>
            <p className={`text-sm mt-1 ${ovStyle.text} opacity-80`}>{overallText.sub}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-5">
          {/* Wind */}
          {(() => {
            const s = LEVEL[windLv];
            return (
              <div className={`rounded-xl border p-3 ${s.bg} ${s.border}`}>
                <div className={`flex items-center gap-2 text-sm font-semibold ${s.text} mb-1`}>
                  <Wind size={15} /> Wind speed
                </div>
                <p className={`text-xl font-bold tabular ${s.text}`}>
                  {maxWind !== null ? `${maxWind.toFixed(1)} m/s` : "—"}
                </p>
                <p className={`text-xs mt-0.5 ${s.text} opacity-70`}>{s.label}</p>
              </div>
            );
          })()}
          {/* Waves */}
          {(() => {
            const s = LEVEL[waveLv];
            return (
              <div className={`rounded-xl border p-3 ${s.bg} ${s.border}`}>
                <div className={`flex items-center gap-2 text-sm font-semibold ${s.text} mb-1`}>
                  <Waves size={15} /> Wave height
                </div>
                <p className={`text-xl font-bold tabular ${s.text}`}>
                  {maxWave !== null ? `${maxWave.toFixed(2)} m` : "—"}
                </p>
                <p className={`text-xs mt-0.5 ${s.text} opacity-70`}>{s.label}</p>
              </div>
            );
          })()}
          {/* Temp — informational only */}
          {(() => {
            const s = LEVEL["no-data"]; // neutral style; temp not in score
            return (
              <div className={`rounded-xl border p-3 ${s.bg} ${s.border}`}>
                <div className={`flex items-center gap-2 text-sm font-semibold ${s.text} mb-1`}>
                  <Thermometer size={15} /> Air temperature
                </div>
                <p className={`text-xl font-bold tabular ${s.text}`}>
                  {avgTemp !== null ? `${avgTemp.toFixed(1)} °C` : "—"}
                </p>
                <p className={`text-xs mt-0.5 ${s.text} opacity-70`}>Informational · not in risk score</p>
              </div>
            );
          })()}
        </div>

        <p className="text-xs text-slate-400 mt-4 italic">
          Based on the latest available readings across all active sensor stations.
          Always check with the on-duty lifeguard before entering the water.
        </p>
      </Card>

      {/* ── 2. What the risk levels mean ── */}
      <Card className="p-5">
        <SectionTitle title="What do the risk levels mean?" subtitle="Plain-language description of each category" />
        <div className="space-y-3 mt-2">
          {RISK_LEVELS.map(({ category, range, Icon, bg, border, text, headline, body }) => (
            <div key={category} className={`flex gap-4 rounded-xl border p-4 ${bg} ${border}`}>
              <Icon size={24} className={`${text} mt-0.5 shrink-0`} />
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`font-bold text-base ${text}`}>{category}</span>
                  <span className={`text-xs tabular px-2 py-0.5 rounded-full border ${border} ${text} opacity-70`}>
                    score {range}
                  </span>
                </div>
                <p className={`font-semibold text-sm mt-0.5 ${text}`}>{headline}</p>
                <p className={`text-sm mt-1 ${text} opacity-80`}>{body}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <Info size={24} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-base text-slate-600">Insufficient Data</span>
              <p className="text-sm mt-1 text-slate-500">
                The station has no recent verified readings, or sensor data is missing. No risk conclusion can be drawn.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ── 3. Station status vs. risk level ── */}
      <Card className="p-5">
        <SectionTitle title="Station status vs. risk level" subtitle="These are two separate things — don't confuse them" />
        <div className="grid sm:grid-cols-2 gap-4 mt-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={18} className="text-brand-600" />
              <span className="font-semibold text-slate-800">Station status</span>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Describes the <strong>health of the sensor hardware</strong>, not the water conditions.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                <span><strong>Available</strong> — sensor is operating normally</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span><strong>Warning</strong> — sensor has data gaps or quality issues</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                <span><strong>Missing</strong> — no data received recently</span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Waves size={18} className="text-brand-600" />
              <span className="font-semibold text-slate-800">Risk level</span>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Describes <strong>how dangerous the water conditions are</strong>, based on measured values.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                <span><strong>Low Risk</strong> — calm conditions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span><strong>Moderate Risk</strong> — elevated conditions</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                <span><strong>High Risk</strong> — dangerous conditions</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              A sensor with <em>Warning</em> status can still report <em>Low Risk</em> conditions — the sensor is degraded but the readings say the water is calm.
            </p>
          </div>
        </div>
      </Card>

      {/* ── 4. What each variable means ── */}
      <Card className="p-5">
        <SectionTitle title="What do the indicators measure?" subtitle="Plain-language explanation of each environmental variable" />
        <div className="grid sm:grid-cols-2 gap-4 mt-3">
          {VARIABLE_EXPLAINERS.map(({ Icon, label, weight, why, safe, caution, danger }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={18} className="text-brand-600 shrink-0" />
                <span className="font-semibold text-slate-800">{label}</span>
                {weight > 0 && (
                  <span className="ml-auto text-xs font-medium text-brand-600 bg-brand-50 border border-brand-100 rounded-full px-2 py-0.5">
                    {weight} pts
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 mb-3">{why}</p>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 px-2 py-1.5 text-center">
                  <p className="font-semibold">Safe</p>
                  <p className="opacity-80 mt-0.5">{safe}</p>
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1.5 text-center">
                  <p className="font-semibold">Caution</p>
                  <p className="opacity-80 mt-0.5">{caution}</p>
                </div>
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 text-center">
                  <p className="font-semibold">Danger</p>
                  <p className="opacity-80 mt-0.5">{danger}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── 5. How the risk score is calculated ── */}
      <Card className="p-5">
        <SectionTitle title="How is the risk score calculated?" subtitle="Transparent, rule-based scoring — no black box" />
        <p className="text-sm text-slate-600 mt-1 mb-4">
          Each sensor variable contributes a certain number of points (up to its <em>weight</em>) depending on
          how the current reading compares to the historical distribution at that station.
          The thresholds — p50 and p85 — are the median and 85th percentile of all past observations,
          so "high" means high relative to what this location normally experiences.
        </p>

        {/* Weight bars */}
        <div className="space-y-2 mb-5">
          {Object.entries(RISK_WEIGHTS).map(([key, w]) => {
            const labels: Record<string, string> = {
              windSpeed: "Wind Speed", waveHeight: "Wave Height",
              currentMag: "Current Magnitude", rainfall: "Rainfall",
            };
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-0.5">
                  <span className="text-slate-600">{labels[key] ?? key}</span>
                  <span className="tabular font-semibold text-slate-700">{w} pts max</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-brand-500" style={{ width: `${w}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Scoring curve */}
        <p className="text-sm font-semibold text-slate-700 mb-2">Scoring curve per variable</p>
        <div className="grid sm:grid-cols-3 gap-2">
          {SCORE_STEPS.map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500 mb-1">{s.label}</p>
              <p className="text-sm font-bold text-brand-700">{s.pts}</p>
              <p className="text-xs text-slate-500 mt-1">{s.desc}</p>
            </div>
          ))}
        </div>

        <InfoNote tone="blue">
          <Info size={13} className="inline mr-1" />
          If a station has no verified data for a variable, that variable contributes 0 points and is excluded from
          the score. A station with fewer verified variables will have a lower maximum possible score —
          which is why some stations show "Insufficient Data" instead of a number.
        </InfoNote>
      </Card>

      {/* ── 6. Disclaimer ── */}
      <Card className="p-5 border-amber-200 bg-amber-50">
        <div className="flex gap-3">
          <ShieldAlert size={24} className="text-amber-700 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-amber-900 text-base">Important disclaimer</p>
            <p className="text-sm text-amber-800 mt-1 leading-relaxed">
              This system is an <strong>academic research prototype</strong>. Its risk classifications are
              computed automatically from sensor data and are <strong>not official swimming-safety or
              emergency instructions</strong>. They do not replace the judgment of a certified lifeguard
              or the regulations of the Nature and Parks Authority. Always follow the instructions of
              on-site lifeguards and official authorities before entering the water.
            </p>
          </div>
        </div>
      </Card>

      {/* ── 7. Emergency contacts ── */}
      <Card className="p-5">
        <SectionTitle title="Emergency contacts" subtitle="Israeli national emergency numbers" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {[
            { label: "Police",               number: "100", desc: "שירות המשטרה" },
            { label: "Ambulance (MDA)",       number: "101", desc: "מגן דוד אדום" },
            { label: "Fire & Rescue",         number: "102", desc: "כיבוי והצלה" },
            { label: "Home Front Command",    number: "104", desc: "פיקוד העורף" },
            { label: "Sea Rescue (Police)",   number: "100", desc: "יחידה ימית – משטרה" },
            { label: "Nature & Parks Auth.",  number: "*3639", desc: "רשות הטבע והגנים" },
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
