import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";
import type { ChartPoint } from "../lib/select";
import { VARIABLES } from "../config/unitsConfig";
import type { VariableKey } from "../types";
import { Empty } from "./ui";

export function TimeSeriesChart({
  data, variable, height = 260,
}: { data: ChartPoint[]; variable: VariableKey; height?: number }) {
  const meta = VARIABLES[variable];
  const points = data.filter((d) => d.value !== null);
  if (points.length === 0) return <Empty hint="No observations for this selection." />;

  const rows = data.map((d) => ({ t: d.t, value: d.value }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
        <XAxis
          dataKey="t"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickFormatter={(t) => safeFormat(t)}
          minTickGap={40}
        />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} width={48}
          label={{ value: meta.unit, angle: -90, position: "insideLeft", fontSize: 11, fill: "#94a3b8" }} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
          labelFormatter={(t) => safeFormat(String(t), true)}
          formatter={(v) => [v == null ? "—" : `${v} ${meta.unit}`, meta.label]}
        />
        <Line type="monotone" dataKey="value" stroke="#0891b2" strokeWidth={2} dot={false}
          connectNulls={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function safeFormat(t: string, withTime = false): string {
  try { return format(parseISO(t), withTime ? "d MMM yyyy HH:mm" : "d MMM"); } catch { return t; }
}
