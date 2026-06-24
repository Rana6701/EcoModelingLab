import type { Beach, Station } from "../types";
import { LAKE_BOUNDS } from "../config/stationConfig";
import { RISK_COLOR } from "../lib/format";

const W = 360;
const H = 480;
const PAD = 40;

function project(lat: number, lng: number) {
  const x = PAD + ((lng - LAKE_BOUNDS.lngMin) / (LAKE_BOUNDS.lngMax - LAKE_BOUNDS.lngMin)) * (W - 2 * PAD);
  const y = PAD + ((LAKE_BOUNDS.latMax - lat) / (LAKE_BOUNDS.latMax - LAKE_BOUNDS.latMin)) * (H - 2 * PAD);
  return { x, y };
}

// Approximate Lake Kinneret outline (stylized — not a survey boundary).
const LAKE_PATH =
  "M 175 60 C 250 55 300 110 300 190 C 300 250 270 300 250 350 C 235 395 215 430 175 435 " +
  "C 130 430 95 380 85 320 C 76 265 70 215 80 165 C 92 100 120 64 175 60 Z";

// Flag-pin shape: vertical pole + filled triangle flag
function BeachPin({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y - 18} stroke={color} strokeWidth={2} />
      <polygon points={`${x},${y - 18} ${x + 10},${y - 13} ${x},${y - 8}`} fill={color} stroke="#fff" strokeWidth={1} />
      <circle cx={x} cy={y} r={3} fill={color} stroke="#fff" strokeWidth={1.5} />
    </g>
  );
}

export function LakeMap({ stations, beaches, selected, onSelect, onSelectBeach }: {
  stations: Station[];
  beaches?: Beach[];
  selected?: string | null;
  onSelect?: (id: string) => void;
  onSelectBeach?: (id: string) => void;
}) {
  const stationMap = new Map(stations.map((s) => [s.id, s]));

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-sm mx-auto" role="img" aria-label="Lake Kinneret station map">
        <defs>
          <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a5f3fc" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <path d={LAKE_PATH} fill="url(#lake)" fillOpacity={0.5} stroke="#0891b2" strokeWidth={2} />
        <text x={W / 2} y={H - 12} textAnchor="middle" fontSize={11} fill="#64748b">Lake Kinneret (stylized · approximate positions)</text>

        {/* Station circles */}
        {stations.filter(s => s.risk.category !== "Insufficient Data").map((s) => {
          const { x, y } = project(s.lat, s.lng);
          const color = RISK_COLOR[s.risk.category];
          const isSel = selected === s.id;
          const label = s.name.replace(/ \(\d{4}(?:-\d{2})?\)$/, "");
          return (
            <g key={s.id} className="cursor-pointer" onClick={() => onSelect?.(s.id)}>
              {isSel && <circle cx={x} cy={y} r={16} fill={color} fillOpacity={0.18} />}
              <circle cx={x} cy={y} r={9} fill={color} stroke="#fff" strokeWidth={2.5} />
              <text x={x + 13} y={y + 4} fontSize={11} fontWeight={600} fill="#0f172a">{label}</text>
            </g>
          );
        })}

        {/* Beach flag pins — label left for east shore (high x), right for west */}
        {beaches?.map((b) => {
          const station = stationMap.get(b.stationId);
          const category = station?.risk.category ?? "Insufficient Data";
          const color = RISK_COLOR[category];
          const { x, y } = project(b.lat, b.lng);
          const eastSide = x > 200;
          return (
            <g key={b.id} className="cursor-pointer" onClick={() => onSelectBeach?.(b.id)}>
              <title>{b.nameEn}</title>
              <BeachPin x={x} y={y} color={color} />
              <text
                x={eastSide ? x - 5 : x + 13}
                y={y - 10}
                fontSize={10}
                fontWeight={700}
                fill="#0f172a"
                textAnchor={eastSide ? "end" : "start"}
              >{b.name}</text>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs text-slate-500">
        {(["Low Risk", "Moderate Risk", "High Risk"] as const).map((c) => (
          <span key={c} className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_COLOR[c] }} />{c}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 border-l border-slate-200 pl-3">
          <span className="text-slate-400">●</span> Station
          <span className="text-slate-400 ml-1">⚑</span> Beach
        </span>
      </div>
    </div>
  );
}
