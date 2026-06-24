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
import { useLanguage } from "../context/LanguageContext";

function maxVal(vals: (number | null | undefined)[]): number | null {
  const nums = vals.filter((v): v is number => typeof v === "number");
  return nums.length > 0 ? Math.max(...nums) : null;
}
function avgVal(vals: (number | null | undefined)[]): number | null {
  const nums = vals.filter((v): v is number => typeof v === "number");
  return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
}

type Level = "safe" | "caution" | "danger" | "no-data";

const LEVEL_STYLES: Record<Level, { bg: string; border: string; text: string }> = {
  safe:      { bg: "bg-green-50",  border: "border-green-300",  text: "text-green-800"  },
  caution:   { bg: "bg-amber-50",  border: "border-amber-300",  text: "text-amber-800"  },
  danger:    { bg: "bg-red-50",    border: "border-red-300",    text: "text-red-800"    },
  "no-data": { bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-500"  },
};

const RISK_LEVEL_STATIC: { category: RiskCategory; range: string; bg: string; border: string; text: string; Icon: LucideIcon }[] = [
  { category: "Low Risk",      range: "0 – 33",   bg: "bg-green-50", border: "border-green-300", text: "text-green-800", Icon: CheckCircle2 },
  { category: "Moderate Risk", range: "34 – 66",  bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-800", Icon: AlertTriangle },
  { category: "High Risk",     range: "67 – 100", bg: "bg-red-50",   border: "border-red-300",   text: "text-red-800",   Icon: AlertOctagon },
];

const VARIABLE_ICONS: LucideIcon[] = [Wind, Waves, Gauge, CloudRain, Thermometer];
const VARIABLE_WEIGHTS = [
  RISK_WEIGHTS.windSpeed,
  RISK_WEIGHTS.waveHeight,
  RISK_WEIGHTS.currentMag,
  RISK_WEIGHTS.rainfall,
  0,
];

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

const CONTACTS_KEYS = ["police", "ambulance", "fire", "homeFront", "seaRescue", "natureParks"] as const;
const CONTACT_NUMBERS = ["100", "101", "102", "104", "100", "*3639"];
const CONTACT_DESCS = ["שירות המשטרה", "מגן דוד אדום", "כיבוי והצלה", "פיקוד העורף", "יחידה ימית – משטרה", "רשות הטבע והגנים"];

export function PublicInfo() {
  const { data } = useApp();
  const { stations } = data;
  const { tr } = useLanguage();
  const p = tr.public;

  const maxWind = maxVal(stations.map(s => s.latest.windSpeed?.value));
  const maxWave = maxVal(stations.map(s => s.latest.waveHeight?.value));
  const avgTemp = avgVal(stations.map(s => s.latest.airTemp?.value));

  const windLv = classifyWind(maxWind);
  const waveLv = classifyWave(maxWave);
  const overall = worst([windLv, waveLv]);
  const ovStyle = LEVEL_STYLES[overall];

  const LEVEL_LABELS: Record<Level, string> = {
    safe: p.safe.headline,
    caution: p.caution.headline,
    danger: p.danger.headline,
    "no-data": p.noData.headline,
  };

  const overallText = {
    safe:      { headline: p.safe.headline,    sub: p.safe.sub    },
    caution:   { headline: p.caution.headline, sub: p.caution.sub },
    danger:    { headline: p.danger.headline,  sub: p.danger.sub  },
    "no-data": { headline: p.noData.headline,  sub: p.noData.sub  },
  }[overall];

  const OverallIcon = useMemo(() => {
    if (overall === "safe")    return CheckCircle2;
    if (overall === "caution") return AlertTriangle;
    if (overall === "danger")  return AlertOctagon;
    return Info;
  }, [overall]);

  return (
    <div className="space-y-8">
      <SectionTitle title={p.title} subtitle={p.subtitle} />

      {/* 1. Current conditions */}
      <Card className={`p-6 border-2 ${ovStyle.border} ${ovStyle.bg}`}>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">{p.currentConditions}</p>
        <div className="flex items-start gap-4">
          <OverallIcon size={40} className={ovStyle.text} />
          <div className="flex-1">
            <h2 className={`text-2xl font-bold ${ovStyle.text}`}>{overallText.headline}</h2>
            <p className={`text-sm mt-1 ${ovStyle.text} opacity-80`}>{overallText.sub}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-5">
          {(() => {
            const s = LEVEL_STYLES[windLv];
            return (
              <div className={`rounded-xl border p-3 ${s.bg} ${s.border}`}>
                <div className={`flex items-center gap-2 text-sm font-semibold ${s.text} mb-1`}>
                  <Wind size={15} /> {p.windSpeed}
                </div>
                <p className={`text-xl font-bold tabular ${s.text}`}>
                  {maxWind !== null ? `${maxWind.toFixed(1)} m/s` : "—"}
                </p>
                <p className={`text-xs mt-0.5 ${s.text} opacity-70`}>{LEVEL_LABELS[windLv]}</p>
              </div>
            );
          })()}
          {(() => {
            const s = LEVEL_STYLES[waveLv];
            return (
              <div className={`rounded-xl border p-3 ${s.bg} ${s.border}`}>
                <div className={`flex items-center gap-2 text-sm font-semibold ${s.text} mb-1`}>
                  <Waves size={15} /> {p.waveHeight}
                </div>
                <p className={`text-xl font-bold tabular ${s.text}`}>
                  {maxWave !== null ? `${maxWave.toFixed(2)} m` : "—"}
                </p>
                <p className={`text-xs mt-0.5 ${s.text} opacity-70`}>{LEVEL_LABELS[waveLv]}</p>
              </div>
            );
          })()}
          {(() => {
            const s = LEVEL_STYLES["no-data"];
            return (
              <div className={`rounded-xl border p-3 ${s.bg} ${s.border}`}>
                <div className={`flex items-center gap-2 text-sm font-semibold ${s.text} mb-1`}>
                  <Thermometer size={15} /> {p.airTemp}
                </div>
                <p className={`text-xl font-bold tabular ${s.text}`}>
                  {avgTemp !== null ? `${avgTemp.toFixed(1)} °C` : "—"}
                </p>
                <p className={`text-xs mt-0.5 ${s.text} opacity-70`}>{p.informational}</p>
              </div>
            );
          })()}
        </div>

        <p className="text-xs text-slate-400 mt-4 italic">{p.basedOn}</p>
      </Card>

      {/* 2. Risk levels */}
      <Card className="p-5">
        <SectionTitle title={p.riskLevelsTitle} subtitle={p.riskLevelsSubtitle} />
        <div className="space-y-3 mt-2">
          {RISK_LEVEL_STATIC.map((s, idx) => {
            const item = p.riskLevelItems[idx];
            const { Icon, bg, border, text, range } = s;
            const CATEGORY_LABELS: Record<RiskCategory, string> = {
              "Low Risk": tr.risk.lowRisk,
              "Moderate Risk": tr.risk.moderateRisk,
              "High Risk": tr.risk.highRisk,
              "Insufficient Data": tr.risk.insufficientData,
            };
            return (
              <div key={s.category} className={`flex gap-4 rounded-xl border p-4 ${bg} ${border}`}>
                <Icon size={24} className={`${text} mt-0.5 shrink-0`} />
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`font-bold text-base ${text}`}>{CATEGORY_LABELS[s.category]}</span>
                    <span className={`text-xs tabular px-2 py-0.5 rounded-full border ${border} ${text} opacity-70`}>
                      {p.scoreLabel.replace("{range}", range)}
                    </span>
                  </div>
                  <p className={`font-semibold text-sm mt-0.5 ${text}`}>{item?.headline}</p>
                  <p className={`text-sm mt-1 ${text} opacity-80`}>{item?.body}</p>
                </div>
              </div>
            );
          })}
          <div className="flex gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <Info size={24} className="text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-base text-slate-600">{p.insufficientData}</span>
              <p className="text-sm mt-1 text-slate-500">{p.insufficientDataDesc}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Station status vs risk level */}
      <Card className="p-5">
        <SectionTitle title={p.stationVsRisk} subtitle={p.stationVsRiskSubtitle} />
        <div className="grid sm:grid-cols-2 gap-4 mt-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={18} className="text-brand-600" />
              <span className="font-semibold text-slate-800">{p.stationStatus}</span>
            </div>
            <p className="text-sm text-slate-600 mb-3">{p.stationStatusDesc}</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                <span><strong>{p.statusAvailable}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span><strong>{p.statusWarning}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                <span><strong>{p.statusMissing}</strong></span>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Waves size={18} className="text-brand-600" />
              <span className="font-semibold text-slate-800">{p.riskLevelLabel}</span>
            </div>
            <p className="text-sm text-slate-600 mb-3">{p.riskLevelDesc}</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                <span><strong>{p.riskLow}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span><strong>{p.riskModerate}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                <span><strong>{p.riskHigh}</strong></span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">{p.sensorWarningNote}</p>
          </div>
        </div>
      </Card>

      {/* 4. Variable explainers */}
      <Card className="p-5">
        <SectionTitle title={p.indicatorsTitle} subtitle={p.indicatorsSubtitle} />
        <div className="grid sm:grid-cols-2 gap-4 mt-3">
          {p.variableExplainers.map((expl, idx) => {
            const Icon = VARIABLE_ICONS[idx] ?? Wind;
            const weight = VARIABLE_WEIGHTS[idx] ?? 0;
            return (
              <div key={expl.label} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={18} className="text-brand-600 shrink-0" />
                  <span className="font-semibold text-slate-800">{expl.label}</span>
                  {weight > 0 && (
                    <span className="ml-auto text-xs font-medium text-brand-600 bg-brand-50 border border-brand-100 rounded-full px-2 py-0.5">
                      {weight} pts
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-3">{expl.why}</p>
                <div className="grid grid-cols-3 gap-1 text-[11px]">
                  <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 px-2 py-1.5 text-center">
                    <p className="font-semibold">{p.safeLabel}</p>
                    <p className="opacity-80 mt-0.5">{expl.safe}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1.5 text-center">
                    <p className="font-semibold">{p.cautionLabel}</p>
                    <p className="opacity-80 mt-0.5">{expl.caution}</p>
                  </div>
                  <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-2 py-1.5 text-center">
                    <p className="font-semibold">{p.dangerLabel}</p>
                    <p className="opacity-80 mt-0.5">{expl.danger}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 5. Risk score calculation */}
      <Card className="p-5">
        <SectionTitle title={p.calcTitle} subtitle={p.calcSubtitle} />
        <p className="text-sm text-slate-600 mt-1 mb-4">{p.calcDesc}</p>

        <div className="space-y-2 mb-5">
          {Object.entries(RISK_WEIGHTS).map(([key, w]) => {
            const label = p.weightLabels[key as keyof typeof p.weightLabels] ?? key;
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-0.5">
                  <span className="text-slate-600">{label}</span>
                  <span className="tabular font-semibold text-slate-700">{w} {p.ptsMax}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-brand-500" style={{ width: `${w}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-sm font-semibold text-slate-700 mb-2">{p.scoringCurve}</p>
        <div className="grid sm:grid-cols-3 gap-2">
          {p.scoreSteps.map((step) => (
            <div key={step.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500 mb-1">{step.label}</p>
              <p className="text-sm font-bold text-brand-700">{step.pts}</p>
              <p className="text-xs text-slate-500 mt-1">{step.desc}</p>
            </div>
          ))}
        </div>

        <InfoNote tone="blue">
          <Info size={13} className="inline mr-1" />
          {p.noVerifiedNote}
        </InfoNote>
      </Card>

      {/* 6. Disclaimer */}
      <Card className="p-5 border-amber-200 bg-amber-50">
        <div className="flex gap-3">
          <ShieldAlert size={24} className="text-amber-700 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-amber-900 text-base">{p.disclaimerTitle}</p>
            <p className="text-sm text-amber-800 mt-1 leading-relaxed">{p.disclaimerBody}</p>
          </div>
        </div>
      </Card>

      {/* 7. Emergency contacts */}
      <Card className="p-5">
        <SectionTitle title={p.emergencyTitle} subtitle={p.emergencySubtitle} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {CONTACTS_KEYS.map((key, i) => (
            <a key={key} href={`tel:${CONTACT_NUMBERS[i].replace(/-/g, "")}`}
              className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-brand-50 hover:border-brand-200 transition-colors p-4 group">
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 group-hover:text-brand-700">
                <Phone size={14} /> {p.contacts[key]}
              </p>
              <p className="text-xl font-bold text-ink-900 tabular mt-1">{CONTACT_NUMBERS[i]}</p>
              <p className="text-xs text-slate-400 mt-0.5">{CONTACT_DESCS[i]}</p>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
