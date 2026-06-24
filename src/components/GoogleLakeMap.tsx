/**
 * GoogleLakeMap — real satellite map of Lake Kinneret via Google Maps JS API.
 *
 * Setup:
 *   1. Get a key at https://console.cloud.google.com → APIs & Services → Maps JavaScript API
 *   2. Create .env.local in the project root and add:
 *        VITE_GOOGLE_MAPS_API_KEY=your_key_here
 *   3. On Vercel: add VITE_GOOGLE_MAPS_API_KEY in Project → Settings → Environment Variables
 *
 * Marker coordinates come directly from the processed data (stations.json / beaches.json).
 * No coordinates are invented or hardcoded here.
 */

import { useState } from "react";
import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import type { Station, Beach } from "../types";

// Loaded once at module level — safe because env vars are build-time constants.
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

const LAKE_CENTER = { lat: 32.82, lng: 35.59 };

const MAP_OPTIONS: google.maps.MapOptions = {
  mapTypeId:          "hybrid",
  mapTypeControl:     true,
  streetViewControl:  false,
  fullscreenControl:  true,
  zoomControl:        true,
};

// Risk level → fill colour
const RISK_COLOR: Record<string, string> = {
  "Low Risk":          "#10b981",
  "Moderate Risk":     "#f59e0b",
  "High Risk":         "#ef4444",
  "Insufficient Data": "#94a3b8",
};
const BEACH_COLOR = "#6366f1";

/** SVG circle encoded as a data-URL — avoids needing google.maps.SymbolPath at init time. */
function circleUrl(fill: string, diameter = 26): string {
  const r = diameter / 2 - 2;
  const c = diameter / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${diameter}" height="${diameter}">
    <circle cx="${c}" cy="${c}" r="${r}" fill="${fill}" stroke="white" stroke-width="2.5"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

type Selected =
  | { kind: "station"; data: Station }
  | { kind: "beach";   data: Beach };

// ─── Public component ────────────────────────────────────────────────────────

export function GoogleLakeMap({
  stations,
  beaches,
  height = 520,
  onStationSelect,
}: {
  stations:          Station[];
  beaches:           Beach[];
  height?:           number;
  onStationSelect?:  (id: string) => void;
}) {
  // Always show the "key missing" fallback when there is no key.
  // The inner component (which calls hooks) is only mounted when a key exists.
  if (!API_KEY) {
    return <MissingKeyFallback height={height} />;
  }
  return <MapInner stations={stations} beaches={beaches} height={height} onStationSelect={onStationSelect} />;
}

// ─── Inner component (hooks must be called consistently) ─────────────────────

function MapInner({
  stations,
  beaches,
  height,
  onStationSelect,
}: {
  stations:          Station[];
  beaches:           Beach[];
  height:            number;
  onStationSelect?:  (id: string) => void;
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: API_KEY!,
  });

  const [selected, setSelected] = useState<Selected | null>(null);

  if (loadError) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-red-50 border border-red-200 p-10 text-center" style={{ height }}>
        <div>
          <p className="font-semibold text-red-700 mb-1">Failed to load Google Maps</p>
          <p className="text-xs text-red-500">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-slate-100 animate-pulse" style={{ height }}>
        <p className="text-slate-400 text-sm">Loading map…</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={LAKE_CENTER}
        zoom={11}
        options={MAP_OPTIONS}
        onClick={() => setSelected(null)}
      >
        {/* Station markers — coordinates from data.stations (stations.json) */}
        {stations.map((s) => (
          <Marker
            key={s.id}
            position={{ lat: s.lat, lng: s.lng }}
            icon={{
              url:    circleUrl(RISK_COLOR[s.risk.category] ?? "#94a3b8", 28),
              anchor: new window.google.maps.Point(14, 14),
            }}
            title={s.name}
            onClick={() => { setSelected({ kind: "station", data: s }); onStationSelect?.(s.id); }}
          />
        ))}

        {/* Beach markers — coordinates from data.beaches (beaches.json) */}
        {beaches.map((b) => (
          <Marker
            key={b.id}
            position={{ lat: b.lat, lng: b.lng }}
            icon={{
              url:    circleUrl(BEACH_COLOR, 22),
              anchor: new window.google.maps.Point(11, 11),
            }}
            title={b.nameEn}
            onClick={() => setSelected({ kind: "beach", data: b })}
          />
        ))}

        {/* Info window — station */}
        {selected?.kind === "station" && (
          <InfoWindow
            position={{ lat: selected.data.lat, lng: selected.data.lng }}
            options={{ pixelOffset: new window.google.maps.Size(0, -18) }}
            onCloseClick={() => setSelected(null)}
          >
            <StationPopup station={selected.data} />
          </InfoWindow>
        )}

        {/* Info window — beach */}
        {selected?.kind === "beach" && (
          <InfoWindow
            position={{ lat: selected.data.lat, lng: selected.data.lng }}
            options={{ pixelOffset: new window.google.maps.Size(0, -14) }}
            onCloseClick={() => setSelected(null)}
          >
            <BeachPopup beach={selected.data} stations={stations} />
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Legend overlay */}
      <Legend />
    </div>
  );
}

// ─── Info-window content ─────────────────────────────────────────────────────

function StationPopup({ station }: { station: Station }) {
  const name  = station.name.replace(/ \(\d{4}(?:-\d{2})?\)$/, "");
  const color = RISK_COLOR[station.risk.category] ?? "#94a3b8";
  const wind  = station.latest.windSpeed;
  const wave  = station.latest.waveHeight;
  const temp  = station.latest.waterTemp;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", minWidth: 180 }}>
      <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{name}</p>

      <span style={{
        display:      "inline-block",
        background:   color + "22",
        color,
        border:       `1px solid ${color}55`,
        borderRadius: 20,
        padding:      "2px 10px",
        fontSize:     11,
        fontWeight:   600,
        marginBottom: 8,
      }}>
        {station.risk.category}
      </span>

      <table style={{ fontSize: 12, borderCollapse: "collapse", width: "100%" }}>
        <tbody>
          {station.risk.score !== null && (
            <Row label="Risk score" value={String(station.risk.score)} />
          )}
          {wind?.value != null && (
            <Row label="Wind speed" value={`${wind.value.toFixed(1)} ${wind.unit}`} />
          )}
          {wave?.value != null && (
            <Row label="Wave Hs" value={`${wave.value.toFixed(2)} m`} />
          )}
          {temp?.value != null && (
            <Row label="Water temp" value={`${temp.value.toFixed(1)} °C`} />
          )}
        </tbody>
      </table>
    </div>
  );
}

function BeachPopup({ beach, stations }: { beach: Beach; stations: Station[] }) {
  const station = stations.find((s) => s.id === beach.stationId) ?? null;
  const color   = station ? (RISK_COLOR[station.risk.category] ?? "#94a3b8") : BEACH_COLOR;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", minWidth: 200 }}>
      {/* Names */}
      <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 1 }}>{beach.nameEn}</p>
      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{beach.name}</p>

      {/* Risk badge */}
      {station && (
        <span style={{
          display:      "inline-block",
          background:   color + "22",
          color,
          border:       `1px solid ${color}55`,
          borderRadius: 20,
          padding:      "2px 10px",
          fontSize:     11,
          fontWeight:   600,
          marginBottom: 8,
        }}>
          {station.risk.category}
        </span>
      )}

      {/* Details table */}
      <table style={{ fontSize: 12, borderCollapse: "collapse", width: "100%" }}>
        <tbody>
          {station?.risk.score !== null && station?.risk.score !== undefined && (
            <Row label="Risk score" value={`${Math.round(station.risk.score)} / 100`} />
          )}
          <Row label="Source station" value={beach.stationName} />
          <Row label="Latitude"       value={beach.lat.toFixed(6)} />
          <Row label="Longitude"      value={beach.lng.toFixed(6)} />
        </tbody>
      </table>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={{ color: "#64748b", paddingRight: 10, paddingBottom: 2 }}>{label}</td>
      <td style={{ fontWeight: 600, paddingBottom: 2 }}>{value}</td>
    </tr>
  );
}

// ─── Legend ──────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="absolute bottom-8 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2.5 shadow text-xs flex flex-col gap-1.5">
      {(["Low Risk", "Moderate Risk", "High Risk"] as const).map((cat) => (
        <span key={cat} className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: RISK_COLOR[cat] }} />
          {cat}
        </span>
      ))}
      <span className="flex items-center gap-2 border-t border-slate-200 pt-1.5 mt-0.5">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: BEACH_COLOR }} />
        Beach
      </span>
    </div>
  );
}

// ─── Missing-key fallback ─────────────────────────────────────────────────────

function MissingKeyFallback({ height }: { height: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-300"
      style={{ height }}
    >
      <div className="text-center max-w-sm px-6">
        <p className="text-base font-semibold text-slate-700 mb-2">
          Google Maps API key not configured
        </p>
        <p className="text-sm text-slate-500 leading-relaxed">
          Create a <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">.env.local</code> file
          in the project root and add:
        </p>
        <pre className="mt-3 bg-slate-100 rounded-lg px-4 py-2.5 text-xs text-left font-mono text-slate-700 select-all">
          VITE_GOOGLE_MAPS_API_KEY=your_key_here
        </pre>
        <p className="text-xs text-slate-400 mt-3">
          Get a key at{" "}
          <span className="font-mono">console.cloud.google.com</span>
          {" "}→ APIs & Services → Maps JavaScript API
        </p>
      </div>
    </div>
  );
}
