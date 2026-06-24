import { MapContainer, TileLayer, CircleMarker, Tooltip, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Station, Beach } from "../types";
import { RISK_COLOR } from "../lib/format";

const LAKE_CENTER: [number, number] = [32.820, 35.583];

interface Props {
  stations: Station[];
  beaches?: Beach[];
  selected?: string | null;
  onSelect?: (id: string) => void;
  height?: number;
}

export function RealLakeMap({ stations, beaches, selected, onSelect, height = 480 }: Props) {
  const visibleStations = stations.filter((s) => s.lat && s.lng);

  return (
    <div className="relative">
      <div style={{ height }} className="rounded-xl overflow-hidden w-full z-0">
        <MapContainer
          center={LAKE_CENTER}
          zoom={11}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom
          attributionControl
        >
          <LayersControl position="topright">
            {/* Satellite — Esri World Imagery, free, no API key */}
            <LayersControl.BaseLayer checked name="Satellite">
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='Tiles &copy; <a href="https://www.esri.com" target="_blank">Esri</a>'
                maxZoom={18}
              />
            </LayersControl.BaseLayer>

            {/* Street map alternative */}
            <LayersControl.BaseLayer name="Street Map">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Station markers */}
          {visibleStations.map((s) => {
            const color = RISK_COLOR[s.risk.category];
            const isSel = selected === s.id;
            const name  = s.name.replace(/ \(\d{4}(?:-\d{2})?\)$/, "");
            return (
              <CircleMarker
                key={s.id}
                center={[s.lat, s.lng]}
                radius={isSel ? 14 : 10}
                pathOptions={{
                  color: "#fff",
                  weight: 2.5,
                  fillColor: color,
                  fillOpacity: 0.95,
                }}
                eventHandlers={{ click: () => onSelect?.(s.id) }}
              >
                <Tooltip direction="top" offset={[0, -12]} permanent={false}>
                  <div style={{ minWidth: 120 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{name}</p>
                    <p style={{ color, fontSize: 12, margin: 0 }}>{s.risk.category}</p>
                    {s.risk.score !== null && (
                      <p style={{ color: "#64748b", fontSize: 11, margin: 0 }}>Score: {s.risk.score}</p>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}

          {/* Beach markers */}
          {beaches?.map((b) => {
            if (!b.lat || !b.lng) return null;
            return (
              <CircleMarker
                key={b.id}
                center={[b.lat, b.lng]}
                radius={7}
                pathOptions={{
                  color: "#fff",
                  weight: 2,
                  fillColor: "#6366f1",
                  fillOpacity: 0.9,
                }}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <p style={{ fontWeight: 600, fontSize: 12, margin: 0 }}>{b.nameEn}</p>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur rounded-xl px-3 py-2 shadow text-xs flex flex-col gap-1">
        {(["Low Risk", "Moderate Risk", "High Risk"] as const).map((cat) => (
          <span key={cat} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: RISK_COLOR[cat] }} />
            {cat}
          </span>
        ))}
        {(beaches?.length ?? 0) > 0 && (
          <span className="flex items-center gap-1.5 border-t border-slate-200 pt-1 mt-0.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: "#6366f1" }} />
            Beach
          </span>
        )}
      </div>
    </div>
  );
}
