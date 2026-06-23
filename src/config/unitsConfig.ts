// =====================================================================
// unitsConfig.ts — central registry of units, variable display metadata,
// and DOCUMENTED unit-conversion functions. Every conversion is annotated.
// =====================================================================

import type { VariableKey } from "../types";

export interface VariableMeta {
  key: VariableKey;
  label: string;
  short: string;
  unit: string;
  /** assumed = unit not documented in source but inferred; unverified = excluded. */
  unitStatus?: "verified" | "assumed" | "unverified";
  decimals: number;
}

export const VARIABLES: Record<VariableKey, VariableMeta> = {
  windSpeed:   { key: "windSpeed",   label: "Wind speed",            short: "Wind",     unit: "m/s",     unitStatus: "assumed",  decimals: 1 },
  windDir:     { key: "windDir",     label: "Wind direction",        short: "Wind dir", unit: "°",       unitStatus: "verified", decimals: 0 },
  airTemp:     { key: "airTemp",     label: "Air temperature",       short: "Temp",     unit: "°C",      unitStatus: "verified", decimals: 1 },
  humidity:    { key: "humidity",    label: "Relative humidity",     short: "Humidity", unit: "%",       unitStatus: "verified", decimals: 0 },
  rainfall:    { key: "rainfall",    label: "Rainfall",              short: "Rain",     unit: "mm",      unitStatus: "verified", decimals: 1 },
  waveHeight:     { key: "waveHeight",     label: "Significant wave height",  short: "Hs",       unit: "m",  unitStatus: "verified", decimals: 2 },
  waveHeightMax:  { key: "waveHeightMax",  label: "Max wave height",          short: "Hs max",   unit: "m",  unitStatus: "verified", decimals: 2 },
  waveHeightTop10:{ key: "waveHeightTop10",label: "Top 10% wave height",      short: "Hs top10", unit: "m",  unitStatus: "verified", decimals: 2 },
  wavePeriod:     { key: "wavePeriod",     label: "Peak wave period",         short: "Tp",       unit: "s",  unitStatus: "verified", decimals: 1 },
  wavePeriodMean: { key: "wavePeriodMean", label: "Mean wave period",         short: "Tm",       unit: "s",  unitStatus: "verified", decimals: 1 },
  waveDir:        { key: "waveDir",        label: "Peak wave direction",      short: "Wave dir", unit: "°",  unitStatus: "verified", decimals: 0 },
  currentMag:  { key: "currentMag",  label: "Current magnitude",     short: "Current",  unit: "cm/s",    unitStatus: "verified", decimals: 1 },
  currentDir:  { key: "currentDir",  label: "Current direction",     short: "Cur dir",  unit: "°",       unitStatus: "verified", decimals: 0 },
  sensorDepth: { key: "sensorDepth", label: "Sensor depth",          short: "Depth",    unit: "mm",      unitStatus: "verified", decimals: 0 },
  waterTemp:   { key: "waterTemp",   label: "Water temperature",     short: "Water T",  unit: "°C",      unitStatus: "verified", decimals: 1 },
  pressure:    { key: "pressure",    label: "Atmospheric pressure",  short: "Pressure", unit: "mbar",    unitStatus: "verified", decimals: 1 },
  lightLevel:  { key: "lightLevel",  label: "Light level",           short: "Light",    unit: "lux",     unitStatus: "verified", decimals: 0 },
  spCond:      { key: "spCond",      label: "Specific conductance",  short: "SpCond",   unit: "µS/cm",   unitStatus: "verified", decimals: 1 },
  dissolvedO2: { key: "dissolvedO2", label: "Dissolved oxygen",      short: "DO",       unit: "mg/L",    unitStatus: "verified", decimals: 2 },
  turbidity:   { key: "turbidity",   label: "Turbidity",             short: "Turb.",    unit: "FNU",     unitStatus: "verified", decimals: 1 },
  chlorophyll: { key: "chlorophyll", label: "Chlorophyll",           short: "Chl",      unit: "µg/L",    unitStatus: "verified", decimals: 2 },
  orp:         { key: "orp",         label: "ORP",                   short: "ORP",      unit: "mV",      unitStatus: "verified", decimals: 0 },
};

// ---- Documented unit conversions --------------------------------------
// Each function states its formula. None are applied silently to source
// data; they exist for utility/testing and explicit use only.

/** Knots → metres per second. 1 kn = 0.514444 m/s. */
export const knotsToMs = (kn: number): number => kn * 0.514444;

/** Kilometres per hour → metres per second. 1 km/h = 1/3.6 m/s. */
export const kmhToMs = (kmh: number): number => kmh / 3.6;

/** Centimetres per second → metres per second. 1 cm/s = 0.01 m/s. */
export const cmsToMs = (cms: number): number => cms / 100;

/** Millimetres → metres. 1 mm = 0.001 m. */
export const mmToM = (mm: number): number => mm / 1000;

/**
 * Fahrenheit → Celsius. (°F − 32) × 5/9.
 * NOTE: deliberately NOT applied to the Ein Gev temperature channel, whose
 * unit is unverified; provided only as a documented utility.
 */
export const fahrenheitToCelsius = (f: number): number => ((f - 32) * 5) / 9;

export function formatValue(v: number | null | undefined, meta: VariableMeta): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return `${v.toFixed(meta.decimals)} ${meta.unit}`;
}
