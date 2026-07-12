import { BarChart3, Download, Fuel, IndianRupee, Percent, Route } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { KPICard } from "../../components/ui/KPICard";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { PageHeader } from "../../components/ui/PageHeader";
import { Panel } from "../../components/ui/Panel";
import { MonthlyRevenueChart } from "../../components/charts/MonthlyRevenueChart";
import { TopCostVehiclesChart } from "../../components/charts/TopCostVehiclesChart";
import { RouteMap } from "../../components/map/RouteMap";
import { downloadCsv } from "../../lib/csv";
import { getDashboardKpis, getFuelEfficiency, getMonthlyRevenue, getOperationalCost, getTopCostliestVehicles, getVehicleRoiLeaderboard } from "../../lib/calculations";
import { formatCurrency } from "../../lib/formatters";
import { useDemoOpsStore } from "../../store/demo-ops-store";

type RoiRow = ReturnType<typeof getVehicleRoiLeaderboard>[number];

export default function AnalyticsPage() {
  const { vehicles, drivers, trips, fuelLogs, expenses, maintenanceLogs } = useDemoOpsStore();
  const kpis = getDashboardKpis(vehicles, drivers, trips);
  const fuelEfficiency = getFuelEfficiency(trips);
  const operationalCost = getOperationalCost(fuelLogs, expenses, maintenanceLogs);
  const monthlyRevenue = getMonthlyRevenue(trips);
  const costliest = getTopCostliestVehicles(vehicles, fuelLogs, expenses, maintenanceLogs);
  const roiRows = getVehicleRoiLeaderboard(vehicles, trips, fuelLogs, maintenanceLogs);
  const averageRoi = roiRows.length ? Number((roiRows.reduce((total, row) => total + row.roiPct, 0) / roiRows.length).toFixed(1)) : 0;

  const roiColumns: Column<RoiRow>[] = [
    { key: "vehicle", header: "Vehicle", cell: (row) => <span className="font-mono">{row.vehicle.registrationNo}</span> },
    { key: "model", header: "Model", cell: (row) => row.vehicle.nameModel },
    { key: "revenue", header: "Revenue", cell: (row) => formatCurrency(row.revenue) },
    { key: "cost", header: "Fuel + Maintenance", cell: (row) => formatCurrency(row.cost) },
    { key: "roi", header: "ROI", cell: (row) => <span className={row.roiPct > 5 ? "font-bold text-green-300" : "font-bold text-amber-300"}>{row.roiPct}%</span> }
  ];

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        eyebrow="Operational intelligence"
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={() => downloadCsv("transitops-trips.csv", trips.map((trip) => ({ tripCode: trip.tripCode, source: trip.source, destination: trip.destination, status: trip.status, revenue: trip.revenue })))}
            >
              Trips CSV
            </Button>
            <Button
              icon={<Download className="h-4 w-4" />}
              onClick={() => downloadCsv("transitops-vehicles.csv", vehicles.map((vehicle) => ({ registrationNo: vehicle.registrationNo, model: vehicle.nameModel, type: vehicle.type, status: vehicle.status, region: vehicle.region })))}
            >
              Vehicles CSV
            </Button>
          </div>
        }
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Fuel Efficiency" value={fuelEfficiency} suffix=" km/l" icon={<Fuel className="h-4 w-4" />} />
        <KPICard label="Fleet Utilization" value={kpis.fleetUtilization} suffix="%" accent="green" icon={<Percent className="h-4 w-4" />} />
        <KPICard label="Operational Cost" value={Math.round(operationalCost / 1000)} suffix="k" accent="amber" icon={<IndianRupee className="h-4 w-4" />} />
        <KPICard label="Vehicle ROI" value={averageRoi} suffix="%" accent="green" icon={<BarChart3 className="h-4 w-4" />} />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <Panel title="Monthly Revenue">
          <MonthlyRevenueChart data={monthlyRevenue} />
        </Panel>
        <Panel title="Top Costliest Vehicles">
          <TopCostVehiclesChart data={costliest} />
        </Panel>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Vehicle ROI Leaderboard">
          <DataTable columns={roiColumns} data={roiRows} getRowKey={(row) => row.vehicle.id} dense />
        </Panel>
        <Panel title="Route Map" action={<Route className="h-4 w-4 text-ops-amber2" />}>
          <div className="p-4">
            <RouteMap trips={trips} />
          </div>
        </Panel>
      </div>
    </>
  );
}
