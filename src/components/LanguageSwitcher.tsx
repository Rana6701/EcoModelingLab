import { useLanguage } from "../context/LanguageContext";
import type { Language } from "../i18n/translations";

const OPTIONS: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "he", label: "עב" },
  { code: "ar", label: "ع" },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-0.5 bg-white/10 rounded-xl p-1 shrink-0">
      {OPTIONS.map((opt) => (
        <button
          key={opt.code}
          onClick={() => setLang(opt.code)}
          className={`px-2.5 py-1 rounded-lg text-sm font-semibold transition-colors ${
            lang === opt.code
              ? "bg-white text-brand-700"
              : "text-brand-100 hover:text-white hover:bg-white/10"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
