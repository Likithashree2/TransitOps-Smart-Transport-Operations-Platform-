import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function MonthlyRevenueChart({ data }: { data: Array<{ month: string; revenue: number }> }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 20, bottom: 8, left: 12 }}>
          <CartesianGrid stroke="#202833" vertical={false} />
          <XAxis dataKey="month" stroke="#8A94A6" />
          <YAxis stroke="#8A94A6" tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
          <Tooltip cursor={{ fill: "rgba(90,162,232,0.06)" }} contentStyle={{ background: "#11151B", border: "1px solid #2A313C", color: "#E7ECF3" }} />
          <Bar dataKey="revenue" fill="#5AA2E8" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
