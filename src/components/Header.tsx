import { Activity } from "lucide-react";
import type { Manifest } from "../types";
import { fmtDateTime, fmtDateRange } from "../lib/format";
import { useLanguage } from "../context/LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header({ manifest }: { manifest: Manifest | null }) {
  const { t } = useLanguage();

  return (
    <header className="bg-gradient-to-r from-brand-800 via-brand-700 to-brand-500 text-white">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-8 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 grid place-items-center backdrop-blur">
            <Activity size={22} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">{t("header.appName")}</h1>
            <p className="text-brand-100 text-xs sm:text-sm">{t("header.subtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {manifest && (
            <div className="hidden md:flex flex-col items-end text-right rtl:items-start rtl:text-left">
              <span className="text-[11px] uppercase tracking-wide text-brand-100">{t("header.latestObs")}</span>
              <span className="text-sm font-semibold tabular">{fmtDateTime(manifest.latestObservation)}</span>
              <span className="text-[11px] text-brand-100 tabular">{t("header.data")} {fmtDateRange(manifest.datasetRange)}</span>
            </div>
          )}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
