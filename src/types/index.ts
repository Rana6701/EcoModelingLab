// Central type definitions for the normalized processed data model.

export type StationType = "meteorological" | "wave+current" | "current" | "meteorological+lake" | "water-quality";
export type RiskCategory = "Low Risk" | "Moderate Risk" | "High Risk" | "Insufficient Data";
export type StationStatus = "Available" | "Warning" | "Missing";
export type VariableKey =
  | "windSpeed" | "windDir" | "airTemp" | "humidity" | "rainfall"
  | "waveHeight" | "waveHeightMax" | "waveHeightTop10" | "wavePeriod" | "wavePeriodMean" | "waveDir"
  | "currentMag" | "currentDir" | "sensorDepth"
  | "waterTemp" | "pressure" | "lightLevel"
  | "spCond" | "dissolvedO2" | "turbidity" | "chlorophyll" | "orp";

export interface LatestValue {
  value: number | null;
  unit: string;
  at: string | null;
}

export interface RiskContribution {
  variable: VariableKey;
  value: number | null;
  points: number;
  text: string;
}

export interface RiskResult {
  score: number | null;
  category: RiskCategory;
  contributions: RiskContribution[];
  inputsUsed?: number;
  timestamp?: string;
}

export interface Station {
  id: string;
  name: string;
  type: StationType;
  lat: number;
  lng: number;
  approxCoords: boolean;
  records: number;
  dateRange: [string, string];
  variables: VariableKey[];
  missingPct: number;
  lastTimestamp: string;
  latest: Partial<Record<VariableKey, LatestValue>>;
  status: StationStatus;
  risk: RiskResult;
  dataQualityNote: string;
  assumptions: string[];
  unverified: string[];
}

export interface Manifest {
  generatedAt: string;
  datasetRange: [string, string];
  latestObservation: string;
  riskVersion: string;
  stationCount: number;
  assumptions: string[];
  excludedColumns: string[];
  disclaimer: string;
}

export interface SeriesBlock {
  timestamps: string[];
  [variable: string]: (number | null)[] | string[];
}

export interface StationSeries {
  daily: SeriesBlock;
  hourly: SeriesBlock;
  vars: VariableKey[];
}

export type TimeSeries = Record<string, StationSeries>;

export interface Threshold { p50: number; p85: number; }

export interface Alert {
  id: string;
  station: string;
  stationId: string;
  timestamp: string;
  severity: Exclude<RiskCategory, "Low Risk" | "Insufficient Data">;
  variable: VariableKey;
  value: number | null;
  threshold: number | null;
  score: number | null;
  explanation: string;
  recommendation: string;
}

export interface AlertsData {
  summary: { total: number; high: number; moderate: number };
  alerts: Alert[];
  thresholds: Record<string, Threshold | null>;
  riskVersion: string;
}

export interface DescriptiveStat {
  count: number; missing: number;
  mean: number | null; median: number | null;
  min: number | null; max: number | null; std: number | null;
  p25: number | null; p50: number | null; p75: number | null;
}

export interface StatTest {
  id: string;
  name: string;
  title: string;
  why: string;
  variables: { name: string; type: string; unit?: string }[];
  assumptions: string[];
  h0: string;
  h1: string;
  n?: number;
  statistic?: number;
  statisticName?: string;
  pValue?: number;
  interpretation: string;
  plainLanguage: string;
  // optional shapes
  scatter?: [number, number][];
  regression?: { slope: number; intercept: number; points: [number, number][] };
  xLabel?: string; yLabel?: string;
  groupMeans?: Record<string, number>;
  assumptionChecks?: Record<string, unknown>;
  nonParametric?: { name: string; statistic: number; H?: number; pValue: number; interpretation: string; shown: boolean };
  dof?: number; expectedLowCells?: number; expectedWarning?: boolean;
  contingency?: { rows: string[]; cols: string[]; values: number[][] };
  equation?: string; coefficients?: Record<string, number>;
  r2?: number; mae?: number; rmse?: number;
  trainN?: number; testN?: number;
  actualVsPredicted?: [number, number][];
  residuals?: [number, number][];
}

export interface MLResult {
  target: string; model: string; features: string[];
  trainN: number; testN: number; split?: string;
  trainPeriod: [string, string] | string; testPeriod: [string, string] | string;
  mae: number; rmse: number; r2: number;
  featureImportance: { feature: string; importance: number }[];
  actualVsPredicted: [number, number][];
  note: string;
}

export interface Statistics {
  alpha: number;
  tests: StatTest[];
  descriptive: Record<string, DescriptiveStat>;
  correlationMatrix: { labels: string[]; values: number[][] } | null;
  ml: MLResult | null;
}

export interface DQFile {
  file: string; station: string; parsed: boolean;
  rows: number; rawRows: number; dateRange: [string, string];
  missingPerColumn: Record<string, number>;
  duplicateTimestamps: number;
  timestampGaps: number | null;
  usablePct: number;
  depthLevels: number[] | null;
  unverifiedColumns: string[];
  deployments?: { file: string; rows: number; range?: [string, string] }[];
  note?: string;
}

export interface DataQuality {
  filesParsed: number;
  filesFailed: number;
  files: DQFile[];
  unverifiedColumns: { station: string; column: string; variable: string; reason: string; action: string }[];
  unconfirmedUnits: { field: string; status: string; detail: string }[];
  parseErrors: string[];
}

export interface RiskConfigData {
  version: string;
  weights: Record<string, number>;
  thresholds: Record<string, Threshold | null>;
  method: string;
  categories: Record<string, string>;
  knwSeries: RiskResult[];
  kncSeries: RiskResult[];
}
