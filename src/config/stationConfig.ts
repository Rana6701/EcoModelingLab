// =====================================================================
// stationConfig.ts — station metadata mirror (names, types, approx map
// positions). Marker coordinates are APPROXIMATE, for the stylized SVG
// map only — they are NOT survey-grade GPS coordinates.
// =====================================================================

export interface StationMeta {
  id: string;
  name: string;
  type: "meteorological" | "wave+current" | "current";
  /** Approximate lat/lng — stylized map placement only. */
  lat: number;
  lng: number;
}

export const STATION_META: StationMeta[] = [
  { id: "bteha",   name: "Bteha",            type: "meteorological", lat: 32.876, lng: 35.638 },
  { id: "zemah",   name: "Zemah",            type: "meteorological", lat: 32.704, lng: 35.585 },
  { id: "ginosar", name: "Ginosar",          type: "meteorological", lat: 32.844, lng: 35.512 },
  { id: "eingev",  name: "Ein Gev",          type: "meteorological", lat: 32.779, lng: 35.646 },
  { id: "knw",     name: "Golan Beach (KNW)", type: "wave+current",  lat: 32.842, lng: 35.651 },
  { id: "knc",     name: "Station F (KNC)",   type: "current",       lat: 32.810, lng: 35.595 },
];

// Lake Kinneret approximate geographic bounding box (for mapping lat/lng
// to the stylized SVG). Approximate — display only.
export const LAKE_BOUNDS = { latMin: 32.69, latMax: 32.89, lngMin: 35.50, lngMax: 35.66 };
