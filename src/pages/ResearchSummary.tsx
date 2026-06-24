import { useApp } from "../App";
import { Card, SectionTitle, InfoNote } from "../components/ui";
import { FlaskConical } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const RESULT_TONES = ["blue", "amber", "amber", "green"] as const;

const TONE_STYLE = {
  blue:  "bg-blue-50 border-blue-200 text-blue-700",
  amber: "bg-amber-50 border-amber-200 text-amber-700",
  green: "bg-green-50 border-green-200 text-green-700",
};

export function ResearchSummary() {
  const { data } = useApp();
  const { statistics } = data;
  const { alpha } = statistics;
  const { tr } = useLanguage();
  const res = tr.research;

  const questions = res.questions.map((q, i) => ({ ...q, resultTone: RESULT_TONES[i] }));

  return (
    <div className="space-y-6">
      <SectionTitle title={res.title} subtitle={res.subtitle} />

      <InfoNote>
        {res.infoNote.replace("{alpha}", String(alpha))}
      </InfoNote>

      <Card className="p-5">
        <SectionTitle title={res.overview} subtitle={res.overviewSubtitle} />
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-start text-slate-500 text-xs font-semibold uppercase tracking-wide">
                <th className="pb-2 pe-6">{res.colQuestion}</th>
                <th className="pb-2 pe-6">{res.colVariables}</th>
                <th className="pb-2 pe-6">{res.colTest}</th>
                <th className="pb-2">{res.colResult}</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 pe-6 font-medium text-slate-800">{q.question}</td>
                  <td className="py-2.5 pe-6 text-slate-500">{q.variables}</td>
                  <td className="py-2.5 pe-6 text-slate-500">{q.test}</td>
                  <td className="py-2.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${TONE_STYLE[q.resultTone]}`}>
                      {q.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div>
        <SectionTitle title={res.detailedTitle} subtitle={res.detailedSubtitle} />
        <div className="space-y-4">
          {questions.map((q, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 grid place-items-center shrink-0 mt-0.5">
                  <FlaskConical size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <p className="font-semibold text-slate-900">{q.question}</p>
                    <span className={`shrink-0 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${TONE_STYLE[q.resultTone]}`}>
                      {q.result}
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{res.whatTested}</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{q.what}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{res.whyTest}</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{q.why}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{res.conclusion}</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{q.conclusion}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
