import type { MaintenanceRisk } from "../../types/domain";
import { Badge } from "./Badge";

const classes: Record<MaintenanceRisk, string> = {
  Low: "border border-green-500/35 bg-green-500/12 text-green-300",
  Medium: "border border-amber-500/35 bg-amber-500/12 text-amber-300",
  High: "border border-red-500/35 bg-red-500/12 text-red-300"
};

export function RiskBadge({ risk, score }: { risk: MaintenanceRisk; score?: number }) {
  return <Badge className={classes[risk]}>{score ? `${risk} ${score}` : risk}</Badge>;
}
