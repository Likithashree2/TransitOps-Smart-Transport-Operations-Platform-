export type Role = "fleet_manager" | "dispatcher" | "safety_officer" | "financial_analyst";

export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";
export type VehicleType = "Van" | "Truck" | "Mini" | "Trailer";
export type DriverStatus = "Available" | "On Trip" | "Off Duty" | "Suspended";
export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";
export type MaintenanceStatus = "Active" | "Completed";
export type MaintenanceRisk = "Low" | "Medium" | "High";
export type ExpenseCategory = "Toll" | "Misc" | "Permit" | "Parking" | "Loading";

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
}

export interface Vehicle {
  id: number;
  registrationNo: string;
  nameModel: string;
  type: VehicleType;
  maxLoadCapacityKg: number;
  odometerKm: number;
  acquisitionCost: number;
  status: VehicleStatus;
  region: string;
  risk: MaintenanceRisk;
  riskScore: number;
  purchaseYear: number;
}

export interface Driver {
  id: number;
  fullName: string;
  licenseNo: string;
  licenseCategory: "LMV" | "HMV";
  licenseExpiry: string;
  contactNumber: string;
  safetyScore: number;
  status: DriverStatus;
}

export interface Trip {
  id: number;
  tripCode: string;
  source: string;
  destination: string;
  vehicleId?: number;
  driverId?: number;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  finalOdometerKm?: number;
  fuelConsumedL?: number;
  status: TripStatus;
  etaMinutes?: number;
  revenue: number;
  createdAt: string;
  dispatchedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface MaintenanceLog {
  id: number;
  vehicleId: number;
  serviceType: string;
  cost: number;
  serviceDate: string;
  status: MaintenanceStatus;
  notes?: string;
  riskScore: number;
}

export interface FuelLog {
  id: number;
  vehicleId: number;
  tripId?: number;
  liters: number;
  cost: number;
  logDate: string;
  isAnomaly?: boolean;
  anomalyReason?: string;
}

export interface Expense {
  id: number;
  vehicleId?: number;
  tripId?: number;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  note?: string;
}

export interface AIInsight {
  id: number;
  entityType: "vehicle" | "fuel_log" | "driver" | "trip";
  entityId: number;
  insightType: "maintenance_risk" | "fuel_anomaly" | "license_alert" | "dispatch_proposal";
  score?: number;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface OpsEvent {
  id: number;
  tripCode: string;
  route: string;
  vehicle?: string;
  driver?: string;
  status: TripStatus;
  detail: string;
  timestamp: string;
}

export interface CityCoordinate {
  name: string;
  lat: number;
  lng: number;
}
