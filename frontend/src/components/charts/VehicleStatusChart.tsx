import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Vehicle } from "../../types/domain";
import { getVehicleStatusData } from "../../lib/calculations";

const colors: Record<string, string> = {
  Available: "#3FB950",
  "On Trip": "#5AA2E8",
  "In Shop": "#B66A00",
  Retired: "#F87171"
};

export function VehicleStatusChart({ vehicles }: { vehicles: Vehicle[] }) {
  const data = getVehicleStatusData(vehicles);
  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 12, right: 24, top: 8, bottom: 8 }}>
          <CartesianGrid stroke="#202833" horizontal={false} />
          <XAxis type="number" stroke="#8A94A6" allowDecimals={false} />
          <YAxis dataKey="status" type="category" stroke="#8A94A6" width={76} />
          <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} contentStyle={{ background: "#11151B", border: "1px solid #2A313C", color: "#E7ECF3" }} />
          <Bar dataKey="count" radius={[0, 3, 3, 0]}>
            {data.map((entry) => (
              <Cell key={entry.status} fill={colors[entry.status]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
