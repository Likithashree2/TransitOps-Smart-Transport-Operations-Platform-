import type { Driver, Expense, FuelLog, MaintenanceLog, Trip, Vehicle, VehicleStatus } from "../types/domain";

export function getDashboardKpis(vehicles: Vehicle[], drivers: Driver[], trips: Trip[]) {
  const activeVehicles = vehicles.filter((vehicle) => vehicle.status !== "Retired").length;
  const availableVehicles = vehicles.filter((vehicle) => vehicle.status === "Available").length;
  const vehiclesInMaintenance = vehicles.filter((vehicle) => vehicle.status === "In Shop").length;
  const activeTrips = trips.filter((trip) => trip.status === "Dispatched").length;
  const pendingTrips = trips.filter((trip) => trip.status === "Draft").length;
  const driversOnDuty = drivers.filter((driver) => driver.status === "On Trip" || driver.status === "Available").length;
  const fleetUtilization = activeVehicles ? Math.round(((activeVehicles - availableVehicles) / activeVehicles) * 100) : 0;
  return { activeVehicles, availableVehicles, vehiclesInMaintenance, activeTrips, pendingTrips, driversOnDuty, fleetUtilization };
}

export function getVehicleStatusData(vehicles: Vehicle[]) {
  const statuses: VehicleStatus[] = ["Available", "On Trip", "In Shop", "Retired"];
  return statuses.map((status) => ({
    status,
    count: vehicles.filter((vehicle) => vehicle.status === status).length
  }));
}

export function getOperationalCost(fuelLogs: FuelLog[], expenses: Expense[], maintenanceLogs: MaintenanceLog[]) {
  return (
    fuelLogs.reduce((total, log) => total + log.cost, 0) +
    expenses.reduce((total, expense) => total + expense.amount, 0) +
    maintenanceLogs.reduce((total, log) => total + log.cost, 0)
  );
}

export function getFuelEfficiency(trips: Trip[]) {
  const completed = trips.filter((trip) => trip.status === "Completed" && trip.fuelConsumedL);
  const distance = completed.reduce((total, trip) => total + trip.plannedDistanceKm, 0);
  const liters = completed.reduce((total, trip) => total + (trip.fuelConsumedL ?? 0), 0);
  return liters ? Number((distance / liters).toFixed(1)) : 0;
}

export function getMonthlyRevenue(trips: Trip[]) {
  const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  const values: Record<string, number> = { Feb: 142000, Mar: 168000, Apr: 152000, May: 206000, Jun: 194000, Jul: 0 };
  trips.forEach((trip) => {
    if (trip.status === "Completed" || trip.status === "Dispatched") {
      const month = new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(trip.createdAt));
      if (month in values) values[month] += trip.revenue;
    }
  });
  return months.map((month) => ({ month, revenue: values[month] }));
}

export function getTopCostliestVehicles(vehicles: Vehicle[], fuelLogs: FuelLog[], expenses: Expense[], maintenanceLogs: MaintenanceLog[]) {
  return vehicles
    .map((vehicle) => {
      const fuel = fuelLogs.filter((log) => log.vehicleId === vehicle.id).reduce((total, log) => total + log.cost, 0);
      const other = expenses.filter((expense) => expense.vehicleId === vehicle.id).reduce((total, expense) => total + expense.amount, 0);
      const maintenance = maintenanceLogs.filter((log) => log.vehicleId === vehicle.id).reduce((total, log) => total + log.cost, 0);
      return { name: vehicle.nameModel, registrationNo: vehicle.registrationNo, total: fuel + other + maintenance };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);
}

export function getVehicleRoiLeaderboard(vehicles: Vehicle[], trips: Trip[], fuelLogs: FuelLog[], maintenanceLogs: MaintenanceLog[]) {
  return vehicles
    .filter((vehicle) => vehicle.status !== "Retired")
    .map((vehicle) => {
      const revenue = trips.filter((trip) => trip.vehicleId === vehicle.id).reduce((total, trip) => total + trip.revenue, 0);
      const fuel = fuelLogs.filter((log) => log.vehicleId === vehicle.id).reduce((total, log) => total + log.cost, 0);
      const maintenance = maintenanceLogs.filter((log) => log.vehicleId === vehicle.id).reduce((total, log) => total + log.cost, 0);
      const roiPct = ((revenue - fuel - maintenance) / vehicle.acquisitionCost) * 100;
      return { vehicle, roiPct: Number(roiPct.toFixed(1)), revenue, cost: fuel + maintenance };
    })
    .sort((a, b) => b.roiPct - a.roiPct)
    .slice(0, 8);
}

export function getAvailableDispatchVehicles(vehicles: Vehicle[]) {
  return vehicles.filter((vehicle) => vehicle.status === "Available");
}

export function getAvailableDispatchDrivers(drivers: Driver[]) {
  const today = new Date("2026-07-12T00:00:00+05:30");
  return drivers.filter((driver) => driver.status === "Available" && new Date(`${driver.licenseExpiry}T00:00:00+05:30`) >= today);
}
