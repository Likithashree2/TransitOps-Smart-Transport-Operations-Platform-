import { useMemo, useState } from "react";
import { Activity, BusFront, Clock, Gauge, Users, Wrench } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { KPICard } from "../../components/ui/KPICard";
import { Panel } from "../../components/ui/Panel";
import { Select } from "../../components/ui/Select";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { VehicleStatusChart } from "../../components/charts/VehicleStatusChart";
import { getDashboardKpis } from "../../lib/calculations";
import { driverLabel, vehicleLabel } from "../../lib/formatters";
import { useDemoOpsStore } from "../../store/demo-ops-store";
import type { Trip, VehicleStatus, VehicleType } from "../../types/domain";

export default function DashboardPage() {
  const { vehicles, drivers, trips } = useDemoOpsStore();
  const [typeFilter, setTypeFilter] = useState<VehicleType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | "All">("All");
  const [regionFilter, setRegionFilter] = useState("All");

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter(
        (vehicle) =>
          (typeFilter === "All" || vehicle.type === typeFilter) &&
          (statusFilter === "All" || vehicle.status === statusFilter) &&
          (regionFilter === "All" || vehicle.region === regionFilter)
      ),
    [vehicles, typeFilter, statusFilter, regionFilter]
  );
  const kpis = getDashboardKpis(filteredVehicles, drivers, trips);
  const regions = Array.from(new Set(vehicles.map((vehicle) => vehicle.region)));

  const columns: Column<Trip>[] = [
    { key: "trip", header: "Trip ID", cell: (trip) => <span className="font-mono font-semibold">{trip.tripCode}</span> },
    { key: "route", header: "Route", cell: (trip) => `${trip.source} -> ${trip.destination}` },
    { key: "vehicle", header: "Vehicle", cell: (trip) => <span className="font-mono">{vehicleLabel(vehicles.find((vehicle) => vehicle.id === trip.vehicleId))}</span> },
    { key: "driver", header: "Driver", cell: (trip) => driverLabel(drivers.find((driver) => driver.id === trip.driverId)) },
    { key: "cargo", header: "Cargo", cell: (trip) => `${trip.cargoWeightKg} kg` },
    { key: "status", header: "Status", cell: (trip) => <StatusBadge status={trip.status} /> }
  ];

  return (
    <>
      <PageHeader title="Dashboard" eyebrow="Live fleet operations" />
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as VehicleType | "All")} label="Vehicle Type">
          <option>All</option>
          <option>Van</option>
          <option>Truck</option>
          <option>Mini</option>
          <option>Trailer</option>
        </Select>
        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as VehicleStatus | "All")} label="Status">
          <option>All</option>
          <option>Available</option>
          <option>On Trip</option>
          <option>In Shop</option>
          <option>Retired</option>
        </Select>
        <Select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)} label="Region">
          <option>All</option>
          {regions.map((region) => (
            <option key={region}>{region}</option>
          ))}
        </Select>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        <KPICard label="Active Vehicles" value={kpis.activeVehicles} icon={<BusFront className="h-4 w-4" />} />
        <KPICard label="Available Vehicles" value={kpis.availableVehicles} accent="green" icon={<Activity className="h-4 w-4" />} />
        <KPICard label="Vehicles In Maintenance" value={kpis.vehiclesInMaintenance} accent="amber" icon={<Wrench className="h-4 w-4" />} />
        <KPICard label="Active Trips" value={kpis.activeTrips} icon={<Gauge className="h-4 w-4" />} />
        <KPICard label="Pending Trips" value={kpis.pendingTrips} accent="amber" icon={<Clock className="h-4 w-4" />} />
        <KPICard label="Drivers On Duty" value={kpis.driversOnDuty} icon={<Users className="h-4 w-4" />} />
        <KPICard label="Fleet Utilization" value={kpis.fleetUtilization} suffix="%" accent="green" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Recent Trips">
          <DataTable columns={columns} data={trips.slice(0, 7)} getRowKey={(trip) => trip.id} dense />
        </Panel>
        <Panel title="Vehicle Status">
          <VehicleStatusChart vehicles={filteredVehicles} />
        </Panel>
      </div>
    </>
  );
}
