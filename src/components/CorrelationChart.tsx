import {
  Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart,
} from "recharts";
import { Empty } from "./ui";

export function CorrelationChart({
  scatter, regression, xLabel, yLabel, height = 300,
}: {
  scatter: [number, number][];
  regression?: { points: [number, number][] } | null;
  xLabel: string;
  yLabel: string;
  height?: number;
}) {
  if (!scatter || scatter.length === 0) return <Empty hint="No aligned observations to plot." />;
  const pts = scatter.map(([x, y]) => ({ x, y }));
  const reg = regression?.points?.map(([x, y]) => ({ x, ry: y })) ?? [];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart margin={{ top: 10, right: 20, bottom: 24, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
        <XAxis type="number" dataKey="x" name={xLabel} tick={{ fontSize: 11, fill: "#94a3b8" }}
          label={{ value: xLabel, position: "insideBottom", offset: -12, fontSize: 11, fill: "#64748b" }} />
        <YAxis type="number" dataKey="y" name={yLabel} tick={{ fontSize: 11, fill: "#94a3b8" }} width={50}
          label={{ value: yLabel, angle: -90, position: "insideLeft", fontSize: 11, fill: "#64748b" }} />
        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
          cursor={{ strokeDasharray: "3 3" }} />
        <Scatter data={pts} fill="#0891b2" fillOpacity={0.45} isAnimationActive={false} />
        {reg.length > 0 && (
          <Line data={reg} dataKey="ry" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} legendType="none" />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
