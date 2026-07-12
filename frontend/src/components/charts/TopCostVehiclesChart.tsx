import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function TopCostVehiclesChart({ data }: { data: Array<{ name: string; total: number }> }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 18, top: 8, bottom: 8 }}>
          <CartesianGrid stroke="#202833" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis dataKey="name" type="category" stroke="#8A94A6" width={88} />
          <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} contentStyle={{ background: "#11151B", border: "1px solid #2A313C", color: "#E7ECF3" }} />
          <Bar dataKey="total" fill="#F87171" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
