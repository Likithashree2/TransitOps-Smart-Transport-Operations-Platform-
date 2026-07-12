import type { DriverStatus, MaintenanceStatus, TripStatus, VehicleStatus } from "../../types/domain";
import { Badge } from "./Badge";

type Status = VehicleStatus | DriverStatus | TripStatus | MaintenanceStatus;

const classes: Record<Status, string> = {
  Available: "bg-green-500/85 text-[#061009]",
  Completed: "bg-green-600/85 text-[#061009]",
  "On Trip": "bg-blue-400/90 text-[#06111C]",
  Dispatched: "bg-blue-400/90 text-[#06111C]",
  "In Shop": "bg-amber-600 text-[#130A00]",
  Draft: "bg-slate-500 text-[#090B10]",
  Active: "bg-amber-600 text-[#130A00]",
  "Off Duty": "bg-slate-500 text-[#090B10]",
  Retired: "bg-red-300 text-[#210708]",
  Suspended: "bg-orange-500 text-[#160900]",
  Cancelled: "bg-red-300 text-[#210708]"
};

export function StatusBadge({ status }: { status: Status }) {
  return <Badge className={classes[status]}>{status}</Badge>;
}
