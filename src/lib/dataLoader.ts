// =====================================================================
// dataLoader.ts — loads the processed JSON artifacts produced by
// `npm run preprocess`. Exposes a single hook-friendly loader with
// caching and an explicit "no data" outcome (the UI shows a proper
// "No data available" message rather than inventing values).
// =====================================================================

import type {
  AlertsData, Beach, DataQuality, Manifest, RiskConfigData, Station, Statistics, TimeSeries,
} from "../types";

export interface ProcessedData {
  manifest: Manifest;
  stations: Station[];
  beaches: Beach[];
  timeseries: TimeSeries;
  alerts: AlertsData;
  dataQuality: DataQuality;
  statistics: Statistics;
  risk: RiskConfigData;
}

const BASE = `${import.meta.env.BASE_URL ?? "/"}data/processed`;

async function getJson<T>(name: string): Promise<T> {
  const res = await fetch(`${BASE}/${name}`);
  if (!res.ok) throw new Error(`Failed to load ${name} (${res.status})`);
  return (await res.json()) as T;
}

let cache: ProcessedData | null = null;

export async function loadProcessedData(): Promise<ProcessedData> {
  if (cache) return cache;
  const [manifest, stations, beaches, timeseries, alerts, dataQuality, statistics, risk] =
    await Promise.all([
      getJson<Manifest>("manifest.json"),
      getJson<Station[]>("stations.json"),
      getJson<Beach[]>("beaches.json"),
      getJson<TimeSeries>("timeseries.json"),
      getJson<AlertsData>("alerts.json"),
      getJson<DataQuality>("dataQuality.json"),
      getJson<Statistics>("statistics.json"),
      getJson<RiskConfigData>("risk.json"),
    ]);
  cache = { manifest, stations, beaches, timeseries, alerts, dataQuality, statistics, risk };
  return cache;
}
