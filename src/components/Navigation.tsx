import {
  LayoutDashboard, Radio, Map, Bell, TrendingUp, BarChart3, Info, Umbrella, FlaskConical,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export type PageId =
  | "dashboard" | "sensors" | "map" | "beaches" | "alerts" | "forecast" | "reports" | "research" | "public";

type PageDef = { id: PageId; key: keyof ReturnType<typeof useLanguage>["tr"]["nav"]; icon: LucideIcon };

const PAGE_DEFS: PageDef[] = [
  { id: "dashboard", key: "dashboard", icon: LayoutDashboard },
  { id: "beaches",   key: "beaches",   icon: Umbrella },
  { id: "alerts",    key: "alerts",    icon: Bell },
  { id: "forecast",  key: "forecast",  icon: TrendingUp },
  { id: "map",       key: "map",       icon: Map },
  { id: "sensors",   key: "sensors",   icon: Radio },
  { id: "reports",   key: "reports",   icon: BarChart3 },
  { id: "research",  key: "research",  icon: FlaskConical },
  { id: "public",    key: "public",    icon: Info },
];

export function Navigation({ page, onNavigate }: { page: PageId; onNavigate: (p: PageId) => void }) {
  const { tr } = useLanguage();

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 no-print overflow-x-hidden">
      <div className="w-full max-w-[1440px] mx-auto px-2 sm:px-6 xl:px-8">
        <div className="flex gap-1 overflow-x-auto scroll-thin">
          {PAGE_DEFS.map((p) => {
            const Icon = p.icon;
            const active = page === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onNavigate(p.id)}
                className={`flex items-center gap-2 px-3.5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-slate-500 hover:text-brand-600 hover:border-brand-200"
                }`}
              >
                <Icon size={16} />
                {tr.nav[p.key]}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
