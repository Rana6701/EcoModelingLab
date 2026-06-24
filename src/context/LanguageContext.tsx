import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type Language, type Translations } from "../i18n/translations";

const RTL_LANGS: Language[] = ["he", "ar"];

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
  tr: Translations; // full typed translation object for arrays
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("sk_lang") as Language | null;
    return saved && saved in translations ? saved : "en";
  });

  const isRTL = RTL_LANGS.includes(lang);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem("sk_lang", l);
  };

  // Sync <html> dir and lang attributes
  useEffect(() => {
    document.documentElement.dir  = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang, isRTL]);

  const tr = translations[lang] as Translations;

  // Simple dot-path string getter
  function t(key: string): string {
    const parts = key.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let node: any = tr;
    for (const p of parts) {
      if (node == null || typeof node !== "object") return key;
      node = node[p];
    }
    return typeof node === "string" ? node : key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tr, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
