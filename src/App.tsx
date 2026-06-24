import { createContext, useContext, useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Navigation, type PageId } from "./components/Navigation";
import { loadProcessedData, type ProcessedData } from "./lib/dataLoader";
import { Dashboard } from "./pages/Dashboard";
import { SensorNetwork } from "./pages/SensorNetwork";
import { LakeMapPage } from "./pages/LakeMapPage";
import { BeachSafety } from "./pages/BeachSafety";
import { Alerts } from "./pages/Alerts";
import { Forecast } from "./pages/Forecast";
import { Reports } from "./pages/Reports";
import { PublicInfo } from "./pages/PublicInfo";
import { ResearchSummary } from "./pages/ResearchSummary";

interface AppState {
  data: ProcessedData;
  selectedStation: string | null;
  setSelectedStation: (id: string | null) => void;
  navigate: (p: PageId) => void;
}
const Ctx = createContext<AppState | null>(null);
export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within App");
  return v;
}

export default function App() {
  const [data, setData] = useState<ProcessedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<PageId>("dashboard");
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

  useEffect(() => {
    loadProcessedData().then(setData).catch((e) => setError(String(e)));
  }, []);

  const navigate = (p: PageId) => { setPage(p); window.scrollTo({ top: 0 }); };

  if (error) {
    return (
      <div className="min-h-full">
        <Header manifest={null} />
        <div className="max-w-3xl mx-auto p-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="font-semibold text-amber-900">No processed data available</h2>
            <p className="text-sm text-amber-800 mt-2">
              The app could not load <code>/data/processed</code>. Run <code>npm run preprocess</code> to
              generate it from the raw files in <code>data_raw/</code>, then reload.
            </p>
            <p className="text-xs text-amber-700 mt-3 font-sans break-all">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-full">
        <Header manifest={null} />
        <div className="max-w-[1440px] mx-auto p-8 animate-pulse text-slate-400">Loading monitoring data…</div>
      </div>
    );
  }

  const state: AppState = { data, selectedStation, setSelectedStation, navigate };

  return (
    <Ctx.Provider value={state}>
      <div className="flex flex-col flex-1">
        <Header manifest={data.manifest} />
        <Navigation page={page} onNavigate={navigate} />
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-8 py-6 space-y-6">
          {page === "dashboard" && <Dashboard />}
          {page === "sensors" && <SensorNetwork />}
          {page === "map" && <LakeMapPage />}
          {page === "beaches" && <BeachSafety />}
          {page === "alerts" && <Alerts />}
          {page === "forecast" && <Forecast />}
          {page === "reports" && <Reports />}
          {page === "research" && <ResearchSummary />}
          {page === "public" && <PublicInfo />}
        </main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 xl:px-8 py-4 flex items-center justify-end">
            <p className="text-[11px] text-slate-400 tabular">
              Risk model v{data.manifest.riskVersion} · generated {data.manifest.generatedAt}
            </p>
          </div>
        </footer>
      </div>
    </Ctx.Provider>
  );
}
