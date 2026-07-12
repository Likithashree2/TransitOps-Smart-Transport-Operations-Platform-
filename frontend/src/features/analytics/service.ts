import { api, USE_DEMO_DATA } from "../../lib/api";
import { getDashboardKpis, getFuelEfficiency, getMonthlyRevenue, getOperationalCost, getTopCostliestVehicles, getVehicleRoiLeaderboard } from "../../lib/calculations";
import { useDemoOpsStore } from "../../store/demo-ops-store";

export async function getDashboardAnalytics() {
  if (USE_DEMO_DATA) {
    const { vehicles, drivers, trips } = useDemoOpsStore.getState();
    return getDashboardKpis(vehicles, drivers, trips);
  }
  const response = await api.get("/analytics/dashboard");
  return response.data;
}

export async function getFleetReport() {
  if (USE_DEMO_DATA) {
    const { vehicles, trips, fuelLogs, expenses, maintenanceLogs } = useDemoOpsStore.getState();
    return {
      fuelEfficiencyKmPerL: getFuelEfficiency(trips),
      operationalCost: getOperationalCost(fuelLogs, expenses, maintenanceLogs),
      monthlyRevenue: getMonthlyRevenue(trips),
      topCostliestVehicles: getTopCostliestVehicles(vehicles, fuelLogs, expenses, maintenanceLogs),
      vehicleRoi: getVehicleRoiLeaderboard(vehicles, trips, fuelLogs, maintenanceLogs)
    };
  }
  const response = await api.get("/analytics/fleet-report");
  return response.data;
}

export async function getVehicleRoi() {
  if (USE_DEMO_DATA) {
    const { vehicles, trips, fuelLogs, maintenanceLogs } = useDemoOpsStore.getState();
    return getVehicleRoiLeaderboard(vehicles, trips, fuelLogs, maintenanceLogs);
  }
  const response = await api.get("/analytics/vehicle-roi");
  return response.data;
}
