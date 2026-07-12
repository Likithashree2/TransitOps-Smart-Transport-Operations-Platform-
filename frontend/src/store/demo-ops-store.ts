import { create } from "zustand";
import { demoDrivers, demoExpenses, demoFuelLogs, demoMaintenanceLogs, demoOpsEvents, demoTrips, demoVehicles } from "../lib/demo-data";
import type { DriverStatus, Expense, FuelLog, MaintenanceLog, OpsEvent, Trip, Vehicle, VehicleStatus } from "../types/domain";

interface DemoOpsState {
  vehicles: Vehicle[];
  drivers: typeof demoDrivers;
  trips: Trip[];
  maintenanceLogs: MaintenanceLog[];
  fuelLogs: FuelLog[];
  expenses: Expense[];
  opsEvents: OpsEvent[];
  addVehicle: (vehicle: Omit<Vehicle, "id" | "status" | "risk" | "riskScore" | "purchaseYear">) => Vehicle;
  updateDriverStatus: (driverId: number, status: DriverStatus) => void;
  addTrip: (trip: Omit<Trip, "id" | "tripCode" | "status" | "createdAt" | "revenue">) => Trip;
  dispatchTrip: (tripId: number) => void;
  cancelTrip: (tripId: number) => void;
  completeTrip: (tripId: number) => void;
  openMaintenance: (log: Omit<MaintenanceLog, "id" | "status" | "riskScore">) => MaintenanceLog;
  closeMaintenance: (logId: number) => void;
  addFuelLog: (log: Omit<FuelLog, "id">) => FuelLog;
  addExpense: (expense: Omit<Expense, "id">) => Expense;
}

const now = () => new Date().toISOString();

function nextCode(trips: Trip[]) {
  const max = trips.reduce((value, trip) => Math.max(value, Number(trip.tripCode.replace("TR", ""))), 0);
  return `TR${String(max + 1).padStart(3, "0")}`;
}

function addOpsEvent(state: DemoOpsState, trip: Trip, detail: string): OpsEvent[] {
  const vehicle = state.vehicles.find((item) => item.id === trip.vehicleId);
  const driver = state.drivers.find((item) => item.id === trip.driverId);
  const event: OpsEvent = {
    id: Math.max(0, ...state.opsEvents.map((item) => item.id)) + 1,
    tripCode: trip.tripCode,
    route: `${trip.source} -> ${trip.destination}`,
    vehicle: vehicle?.nameModel,
    driver: driver?.fullName.split(" ")[0],
    status: trip.status,
    detail,
    timestamp: now()
  };
  return [event, ...state.opsEvents].slice(0, 10);
}

export const useDemoOpsStore = create<DemoOpsState>((set, get) => ({
  vehicles: demoVehicles,
  drivers: demoDrivers,
  trips: demoTrips,
  maintenanceLogs: demoMaintenanceLogs,
  fuelLogs: demoFuelLogs,
  expenses: demoExpenses,
  opsEvents: demoOpsEvents,
  addVehicle: (vehicleInput) => {
    const vehicle: Vehicle = {
      ...vehicleInput,
      id: Math.max(...get().vehicles.map((item) => item.id)) + 1,
      status: "Available",
      risk: "Low",
      riskScore: 12,
      purchaseYear: 2026
    };
    set((state) => ({ vehicles: [vehicle, ...state.vehicles] }));
    return vehicle;
  },
  updateDriverStatus: (driverId, status) => {
    set((state) => ({
      drivers: state.drivers.map((driver) => (driver.id === driverId ? { ...driver, status } : driver))
    }));
  },
  addTrip: (tripInput) => {
    const trip: Trip = {
      ...tripInput,
      id: Math.max(...get().trips.map((item) => item.id)) + 1,
      tripCode: nextCode(get().trips),
      status: "Draft",
      createdAt: now(),
      revenue: Math.round(tripInput.plannedDistanceKm * 92 + tripInput.cargoWeightKg * 12)
    };
    set((state) => ({ trips: [trip, ...state.trips], opsEvents: addOpsEvent({ ...state, trips: [trip, ...state.trips] }, trip, "Draft proposal created") }));
    return trip;
  },
  dispatchTrip: (tripId) => {
    set((state) => {
      const trip = state.trips.find((item) => item.id === tripId);
      if (!trip) return state;
      const updatedTrip: Trip = { ...trip, status: "Dispatched", dispatchedAt: now(), etaMinutes: Math.max(30, Math.round(trip.plannedDistanceKm * 1.2)) };
      return {
        trips: state.trips.map((item) => (item.id === tripId ? updatedTrip : item)),
        vehicles: state.vehicles.map((vehicle) => (vehicle.id === trip.vehicleId ? { ...vehicle, status: "On Trip" as VehicleStatus } : vehicle)),
        drivers: state.drivers.map((driver) => (driver.id === trip.driverId ? { ...driver, status: "On Trip" as DriverStatus } : driver)),
        opsEvents: addOpsEvent(state, updatedTrip, `ETA ${updatedTrip.etaMinutes} min`)
      };
    });
  },
  cancelTrip: (tripId) => {
    set((state) => {
      const trip = state.trips.find((item) => item.id === tripId);
      if (!trip) return state;
      const updatedTrip: Trip = { ...trip, status: "Cancelled", cancelledAt: now() };
      return {
        trips: state.trips.map((item) => (item.id === tripId ? updatedTrip : item)),
        vehicles: state.vehicles.map((vehicle) => (vehicle.id === trip.vehicleId ? { ...vehicle, status: "Available" as VehicleStatus } : vehicle)),
        drivers: state.drivers.map((driver) => (driver.id === trip.driverId ? { ...driver, status: "Available" as DriverStatus } : driver)),
        opsEvents: addOpsEvent(state, updatedTrip, "Cancelled by dispatcher")
      };
    });
  },
  completeTrip: (tripId) => {
    set((state) => {
      const trip = state.trips.find((item) => item.id === tripId);
      if (!trip) return state;
      const updatedTrip: Trip = { ...trip, status: "Completed", completedAt: now() };
      return {
        trips: state.trips.map((item) => (item.id === tripId ? updatedTrip : item)),
        vehicles: state.vehicles.map((vehicle) => (vehicle.id === trip.vehicleId ? { ...vehicle, status: "Available" as VehicleStatus } : vehicle)),
        drivers: state.drivers.map((driver) => (driver.id === trip.driverId ? { ...driver, status: "Available" as DriverStatus } : driver)),
        opsEvents: addOpsEvent(state, updatedTrip, "Completed and released")
      };
    });
  },
  openMaintenance: (logInput) => {
    const vehicle = get().vehicles.find((item) => item.id === logInput.vehicleId);
    const log: MaintenanceLog = {
      ...logInput,
      id: Math.max(...get().maintenanceLogs.map((item) => item.id)) + 1,
      status: "Active",
      riskScore: vehicle?.riskScore ?? 50
    };
    set((state) => ({
      maintenanceLogs: [log, ...state.maintenanceLogs],
      vehicles: state.vehicles.map((item) => (item.id === log.vehicleId && item.status !== "Retired" ? { ...item, status: "In Shop" } : item))
    }));
    return log;
  },
  closeMaintenance: (logId) => {
    set((state) => {
      const log = state.maintenanceLogs.find((item) => item.id === logId);
      return {
        maintenanceLogs: state.maintenanceLogs.map((item) => (item.id === logId ? { ...item, status: "Completed" } : item)),
        vehicles: state.vehicles.map((item) => (item.id === log?.vehicleId && item.status !== "Retired" ? { ...item, status: "Available" } : item))
      };
    });
  },
  addFuelLog: (logInput) => {
    const log: FuelLog = { ...logInput, id: Math.max(...get().fuelLogs.map((item) => item.id)) + 1 };
    set((state) => ({ fuelLogs: [log, ...state.fuelLogs] }));
    return log;
  },
  addExpense: (expenseInput) => {
    const expense: Expense = { ...expenseInput, id: Math.max(...get().expenses.map((item) => item.id)) + 1 };
    set((state) => ({ expenses: [expense, ...state.expenses] }));
    return expense;
  }
}));
