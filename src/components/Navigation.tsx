import {
  LayoutDashboard, Radio, Map, Bell, TrendingUp, BarChart3, Info, ShieldCheck, Umbrella,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type PageId =
  | "dashboard" | "sensors" | "map" | "beaches" | "alerts" | "forecast" | "reports" | "public" | "quality";

export const PAGES: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: "dashboard",  label: "Dashboard",           icon: LayoutDashboard },
  { id: "beaches",    label: "Beach Safety",         icon: Umbrella },
  { id: "alerts",     label: "Alerts",               icon: Bell },
  { id: "forecast",   label: "Forecast",             icon: TrendingUp },
  { id: "map",        label: "Lake Map",             icon: Map },
  { id: "sensors",    label: "Sensor Network",       icon: Radio },
  { id: "reports",    label: "Reports & Statistics", icon: BarChart3 },
  { id: "quality",    label: "Data Quality",         icon: ShieldCheck },
  { id: "public",     label: "Public Information",   icon: Info },
];

export function Navigation({ page, onNavigate }: { page: PageId; onNavigate: (p: PageId) => void }) {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-20 no-print">
      <div className="max-w-7xl mx-auto px-2 sm:px-6">
        <div className="flex gap-1 overflow-x-auto scroll-thin">
          {PAGES.map((p) => {
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
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
