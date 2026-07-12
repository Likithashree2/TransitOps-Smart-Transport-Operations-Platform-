import type { AIInsight, CityCoordinate, Driver, Expense, FuelLog, MaintenanceLog, OpsEvent, Trip, User, Vehicle } from "../types/domain";

export const demoUsers: User[] = [
  { id: 1, email: "fleet@transitops.in", fullName: "Meera S.", role: "fleet_manager", isActive: true },
  { id: 2, email: "dispatcher@transitops.in", fullName: "Raveen K.", role: "dispatcher", isActive: true },
  { id: 3, email: "safety@transitops.in", fullName: "Anjali P.", role: "safety_officer", isActive: true },
  { id: 4, email: "finance@transitops.in", fullName: "Dev M.", role: "financial_analyst", isActive: true }
];

export const demoVehicles: Vehicle[] = [
  { id: 1, registrationNo: "GJ01AB4521", nameModel: "VAN-05", type: "Van", maxLoadCapacityKg: 500, odometerKm: 74000, acquisitionCost: 620000, status: "Available", region: "Ahmedabad", risk: "Low", riskScore: 18, purchaseYear: 2022 },
  { id: 2, registrationNo: "GJ01AB9981", nameModel: "TRUCK-11", type: "Truck", maxLoadCapacityKg: 5000, odometerKm: 192000, acquisitionCost: 2450000, status: "On Trip", region: "Ahmedabad", risk: "High", riskScore: 86, purchaseYear: 2020 },
  { id: 3, registrationNo: "GJ01AB1120", nameModel: "MINI-03", type: "Mini", maxLoadCapacityKg: 1000, odometerKm: 66000, acquisitionCost: 410000, status: "In Shop", region: "Surat", risk: "Medium", riskScore: 56, purchaseYear: 2021 },
  { id: 4, registrationNo: "GJ01AB0087", nameModel: "VAN-09", type: "Van", maxLoadCapacityKg: 750, odometerKm: 241900, acquisitionCost: 540000, status: "Retired", region: "Vadodara", risk: "High", riskScore: 92, purchaseYear: 2017 },
  { id: 5, registrationNo: "GJ05CX4012", nameModel: "VAN-14", type: "Van", maxLoadCapacityKg: 900, odometerKm: 53500, acquisitionCost: 660000, status: "Available", region: "Surat", risk: "Low", riskScore: 22, purchaseYear: 2023 },
  { id: 6, registrationNo: "GJ18DD7720", nameModel: "TRUCK-04", type: "Truck", maxLoadCapacityKg: 6200, odometerKm: 126800, acquisitionCost: 2680000, status: "On Trip", region: "Gandhinagar", risk: "Medium", riskScore: 47, purchaseYear: 2021 },
  { id: 7, registrationNo: "GJ03RA6008", nameModel: "MINI-08", type: "Mini", maxLoadCapacityKg: 1200, odometerKm: 40200, acquisitionCost: 455000, status: "Available", region: "Rajkot", risk: "Low", riskScore: 28, purchaseYear: 2024 },
  { id: 8, registrationNo: "GJ06VB2319", nameModel: "TRAIL-02", type: "Trailer", maxLoadCapacityKg: 9500, odometerKm: 156300, acquisitionCost: 3210000, status: "Available", region: "Vadodara", risk: "Medium", riskScore: 62, purchaseYear: 2020 },
  { id: 9, registrationNo: "GJ27AH8455", nameModel: "VAN-18", type: "Van", maxLoadCapacityKg: 1100, odometerKm: 61900, acquisitionCost: 690000, status: "Available", region: "Ahmedabad", risk: "Low", riskScore: 24, purchaseYear: 2023 },
  { id: 10, registrationNo: "GJ05SX9001", nameModel: "TRUCK-18", type: "Truck", maxLoadCapacityKg: 7000, odometerKm: 218400, acquisitionCost: 2880000, status: "In Shop", region: "Surat", risk: "High", riskScore: 88, purchaseYear: 2018 },
  { id: 11, registrationNo: "GJ01KA3344", nameModel: "MINI-11", type: "Mini", maxLoadCapacityKg: 950, odometerKm: 37850, acquisitionCost: 440000, status: "Available", region: "Gandhinagar", risk: "Low", riskScore: 15, purchaseYear: 2024 },
  { id: 12, registrationNo: "GJ18BR3341", nameModel: "VAN-21", type: "Van", maxLoadCapacityKg: 1400, odometerKm: 89000, acquisitionCost: 710000, status: "On Trip", region: "Gandhinagar", risk: "Medium", riskScore: 51, purchaseYear: 2021 },
  { id: 13, registrationNo: "GJ03MR8080", nameModel: "TRUCK-21", type: "Truck", maxLoadCapacityKg: 8500, odometerKm: 97700, acquisitionCost: 3020000, status: "Available", region: "Rajkot", risk: "Low", riskScore: 31, purchaseYear: 2022 },
  { id: 14, registrationNo: "GJ06CT7077", nameModel: "MINI-15", type: "Mini", maxLoadCapacityKg: 800, odometerKm: 71220, acquisitionCost: 430000, status: "On Trip", region: "Vadodara", risk: "Medium", riskScore: 59, purchaseYear: 2021 },
  { id: 15, registrationNo: "GJ27HS4420", nameModel: "TRAIL-07", type: "Trailer", maxLoadCapacityKg: 12000, odometerKm: 134500, acquisitionCost: 3540000, status: "Available", region: "Ahmedabad", risk: "Medium", riskScore: 45, purchaseYear: 2020 },
  { id: 16, registrationNo: "GJ05LM6012", nameModel: "VAN-24", type: "Van", maxLoadCapacityKg: 1250, odometerKm: 33220, acquisitionCost: 735000, status: "Available", region: "Surat", risk: "Low", riskScore: 19, purchaseYear: 2024 },
  { id: 17, registrationNo: "GJ01BK9034", nameModel: "TRUCK-27", type: "Truck", maxLoadCapacityKg: 5400, odometerKm: 201100, acquisitionCost: 2550000, status: "Retired", region: "Ahmedabad", risk: "High", riskScore: 94, purchaseYear: 2016 },
  { id: 18, registrationNo: "GJ03RK4411", nameModel: "VAN-28", type: "Van", maxLoadCapacityKg: 700, odometerKm: 48720, acquisitionCost: 650000, status: "Available", region: "Rajkot", risk: "Low", riskScore: 33, purchaseYear: 2023 }
];

export const demoDrivers: Driver[] = [
  { id: 1, fullName: "Alex Patel", licenseNo: "DL-88215", licenseCategory: "LMV", licenseExpiry: "2028-12-01", contactNumber: "9876500000", safetyScore: 96, status: "Available" },
  { id: 2, fullName: "John Makwana", licenseNo: "DL-49120", licenseCategory: "HMV", licenseExpiry: "2025-03-20", contactNumber: "9722000000", safetyScore: 81, status: "Suspended" },
  { id: 3, fullName: "Priya Shah", licenseNo: "DL-77031", licenseCategory: "LMV", licenseExpiry: "2027-08-01", contactNumber: "9180000000", safetyScore: 99, status: "On Trip" },
  { id: 4, fullName: "Suresh Solanki", licenseNo: "DL-90045", licenseCategory: "LMV", licenseExpiry: "2027-01-01", contactNumber: "9440000000", safetyScore: 88, status: "Available" },
  { id: 5, fullName: "Kiran Rathod", licenseNo: "DL-55210", licenseCategory: "HMV", licenseExpiry: "2026-07-28", contactNumber: "9824119090", safetyScore: 91, status: "Available" },
  { id: 6, fullName: "Neha Joshi", licenseNo: "DL-68001", licenseCategory: "LMV", licenseExpiry: "2029-04-12", contactNumber: "9898102211", safetyScore: 94, status: "Available" },
  { id: 7, fullName: "Bhavesh Parmar", licenseNo: "DL-70112", licenseCategory: "HMV", licenseExpiry: "2028-03-18", contactNumber: "9900012345", safetyScore: 86, status: "On Trip" },
  { id: 8, fullName: "Farhan Sheikh", licenseNo: "DL-43328", licenseCategory: "LMV", licenseExpiry: "2027-11-08", contactNumber: "9327000011", safetyScore: 89, status: "Off Duty" },
  { id: 9, fullName: "Mansi Trivedi", licenseNo: "DL-11982", licenseCategory: "LMV", licenseExpiry: "2026-08-06", contactNumber: "9512107070", safetyScore: 93, status: "Available" },
  { id: 10, fullName: "Harsh Gohil", licenseNo: "DL-33990", licenseCategory: "HMV", licenseExpiry: "2028-09-30", contactNumber: "9879001212", safetyScore: 84, status: "On Trip" },
  { id: 11, fullName: "Ayesha Mirza", licenseNo: "DL-77304", licenseCategory: "LMV", licenseExpiry: "2029-02-20", contactNumber: "9825007878", safetyScore: 97, status: "Available" },
  { id: 12, fullName: "Paresh Desai", licenseNo: "DL-65092", licenseCategory: "HMV", licenseExpiry: "2026-11-10", contactNumber: "9974003232", safetyScore: 78, status: "Suspended" },
  { id: 13, fullName: "Jignesh Rana", licenseNo: "DL-21290", licenseCategory: "HMV", licenseExpiry: "2027-06-18", contactNumber: "9909909090", safetyScore: 90, status: "Available" },
  { id: 14, fullName: "Devika Mehta", licenseNo: "DL-88067", licenseCategory: "LMV", licenseExpiry: "2028-01-23", contactNumber: "9825103030", safetyScore: 95, status: "Available" }
];

export const demoTrips: Trip[] = [
  { id: 1, tripCode: "TR001", source: "Gandhinagar Depot", destination: "Ahmedabad Hub", vehicleId: 2, driverId: 7, cargoWeightKg: 4200, plannedDistanceKm: 45, status: "Dispatched", etaMinutes: 45, revenue: 18500, createdAt: "2026-07-11T08:00:00+05:30", dispatchedAt: "2026-07-11T08:20:00+05:30" },
  { id: 2, tripCode: "TR002", source: "Ahmedabad Hub", destination: "Surat Textile Park", vehicleId: 5, driverId: 1, cargoWeightKg: 760, plannedDistanceKm: 266, finalOdometerKm: 53766, fuelConsumedL: 32, status: "Completed", revenue: 32400, createdAt: "2026-07-09T09:00:00+05:30", dispatchedAt: "2026-07-09T09:12:00+05:30", completedAt: "2026-07-09T15:40:00+05:30" },
  { id: 3, tripCode: "TR003", source: "Rajkot Yard", destination: "Vadodara DC", vehicleId: 14, driverId: 3, cargoWeightKg: 620, plannedDistanceKm: 280, status: "Dispatched", etaMinutes: 80, revenue: 26700, createdAt: "2026-07-11T10:10:00+05:30", dispatchedAt: "2026-07-11T10:25:00+05:30" },
  { id: 4, tripCode: "TR004", source: "Vatva Industrial Area", destination: "Sanand Warehouse", vehicleId: 6, driverId: 10, cargoWeightKg: 5900, plannedDistanceKm: 38, status: "Draft", revenue: 13800, createdAt: "2026-07-12T08:10:00+05:30" },
  { id: 5, tripCode: "TR005", source: "Surat Textile Park", destination: "Rajkot Yard", vehicleId: 12, driverId: 5, cargoWeightKg: 980, plannedDistanceKm: 432, status: "Dispatched", etaMinutes: 190, revenue: 45200, createdAt: "2026-07-11T12:30:00+05:30", dispatchedAt: "2026-07-11T12:45:00+05:30" },
  { id: 6, tripCode: "TR006", source: "Mansa", destination: "Kalol Depot", cargoWeightKg: 300, plannedDistanceKm: 28, status: "Cancelled", revenue: 0, createdAt: "2026-07-10T11:30:00+05:30", cancelledAt: "2026-07-10T12:12:00+05:30" },
  { id: 7, tripCode: "TR007", source: "Ahmedabad Hub", destination: "Vadodara DC", vehicleId: 9, driverId: 6, cargoWeightKg: 850, plannedDistanceKm: 111, finalOdometerKm: 62011, fuelConsumedL: 13, status: "Completed", revenue: 19800, createdAt: "2026-07-08T07:00:00+05:30", dispatchedAt: "2026-07-08T07:20:00+05:30", completedAt: "2026-07-08T11:12:00+05:30" },
  { id: 8, tripCode: "TR008", source: "Surat Depot", destination: "Ahmedabad Hub", vehicleId: 16, driverId: 11, cargoWeightKg: 740, plannedDistanceKm: 266, status: "Draft", revenue: 30500, createdAt: "2026-07-12T09:05:00+05:30" },
  { id: 9, tripCode: "TR009", source: "Gandhinagar Depot", destination: "Rajkot Yard", vehicleId: 13, driverId: 13, cargoWeightKg: 6100, plannedDistanceKm: 242, status: "Draft", revenue: 39900, createdAt: "2026-07-12T09:22:00+05:30" },
  { id: 10, tripCode: "TR010", source: "Vadodara DC", destination: "Surat Textile Park", vehicleId: 8, driverId: 4, cargoWeightKg: 7600, plannedDistanceKm: 154, finalOdometerKm: 156454, fuelConsumedL: 21, status: "Completed", revenue: 31800, createdAt: "2026-07-06T06:45:00+05:30", dispatchedAt: "2026-07-06T07:05:00+05:30", completedAt: "2026-07-06T13:20:00+05:30" },
  { id: 11, tripCode: "TR011", source: "Rajkot Yard", destination: "Ahmedabad Hub", vehicleId: 7, driverId: 9, cargoWeightKg: 690, plannedDistanceKm: 216, status: "Completed", finalOdometerKm: 40416, fuelConsumedL: 25, revenue: 24900, createdAt: "2026-07-05T08:00:00+05:30", dispatchedAt: "2026-07-05T08:16:00+05:30", completedAt: "2026-07-05T13:10:00+05:30" },
  { id: 12, tripCode: "TR012", source: "Ahmedabad Hub", destination: "Gandhinagar Depot", vehicleId: 1, driverId: 14, cargoWeightKg: 360, plannedDistanceKm: 45, status: "Completed", finalOdometerKm: 74045, fuelConsumedL: 5, revenue: 9200, createdAt: "2026-07-04T09:00:00+05:30", dispatchedAt: "2026-07-04T09:10:00+05:30", completedAt: "2026-07-04T10:15:00+05:30" },
  { id: 13, tripCode: "TR013", source: "Surat Depot", destination: "Vadodara DC", vehicleId: 10, driverId: 8, cargoWeightKg: 4100, plannedDistanceKm: 154, status: "Cancelled", revenue: 0, createdAt: "2026-07-03T12:00:00+05:30", cancelledAt: "2026-07-03T12:26:00+05:30" },
  { id: 14, tripCode: "TR014", source: "Vadodara DC", destination: "Rajkot Yard", vehicleId: 15, driverId: 13, cargoWeightKg: 9200, plannedDistanceKm: 280, status: "Completed", finalOdometerKm: 134780, fuelConsumedL: 40, revenue: 48200, createdAt: "2026-07-02T05:30:00+05:30", dispatchedAt: "2026-07-02T05:48:00+05:30", completedAt: "2026-07-02T15:10:00+05:30" },
  { id: 15, tripCode: "TR015", source: "GIDC Naroda", destination: "Ahmedabad Hub", vehicleId: 18, driverId: 6, cargoWeightKg: 430, plannedDistanceKm: 23, status: "Draft", revenue: 7800, createdAt: "2026-07-12T10:30:00+05:30" },
  { id: 16, tripCode: "TR016", source: "Ahmedabad Hub", destination: "Rajkot Yard", vehicleId: 13, driverId: 4, cargoWeightKg: 5000, plannedDistanceKm: 216, status: "Completed", finalOdometerKm: 97916, fuelConsumedL: 31, revenue: 37400, createdAt: "2026-06-25T06:30:00+05:30", dispatchedAt: "2026-06-25T06:50:00+05:30", completedAt: "2026-06-25T14:20:00+05:30" },
  { id: 17, tripCode: "TR017", source: "Surat Depot", destination: "Gandhinagar Depot", vehicleId: 16, driverId: 11, cargoWeightKg: 910, plannedDistanceKm: 305, status: "Completed", finalOdometerKm: 33525, fuelConsumedL: 35, revenue: 34800, createdAt: "2026-06-18T07:10:00+05:30", dispatchedAt: "2026-06-18T07:35:00+05:30", completedAt: "2026-06-18T15:50:00+05:30" },
  { id: 18, tripCode: "TR018", source: "Vadodara DC", destination: "Ahmedabad Hub", vehicleId: 8, driverId: 5, cargoWeightKg: 7100, plannedDistanceKm: 111, status: "Completed", finalOdometerKm: 156565, fuelConsumedL: 18, revenue: 24600, createdAt: "2026-05-21T08:25:00+05:30", dispatchedAt: "2026-05-21T08:42:00+05:30", completedAt: "2026-05-21T12:25:00+05:30" }
];

export const demoMaintenanceLogs: MaintenanceLog[] = [
  { id: 1, vehicleId: 3, serviceType: "Oil Change", cost: 2500, serviceDate: "2026-07-07", status: "Active", notes: "Mini vehicle in shop for oil and belt inspection.", riskScore: 56 },
  { id: 2, vehicleId: 10, serviceType: "Engine Repair", cost: 18000, serviceDate: "2026-07-06", status: "Active", notes: "High odometer truck reported vibration under load.", riskScore: 88 },
  { id: 3, vehicleId: 2, serviceType: "Tyre Replace", cost: 6200, serviceDate: "2026-06-22", status: "Completed", notes: "Front pair replaced after Ahmedabad route run.", riskScore: 72 },
  { id: 4, vehicleId: 1, serviceType: "Brake Inspection", cost: 3100, serviceDate: "2026-06-14", status: "Completed", notes: "Preventive check cleared.", riskScore: 18 },
  { id: 5, vehicleId: 8, serviceType: "Hydraulic Check", cost: 9200, serviceDate: "2026-05-28", status: "Completed", notes: "Trailer coupling pressure normalized.", riskScore: 62 },
  { id: 6, vehicleId: 17, serviceType: "Retirement Audit", cost: 4800, serviceDate: "2026-05-10", status: "Completed", notes: "Vehicle removed from dispatch pool.", riskScore: 94 }
];

export const demoFuelLogs: FuelLog[] = [
  { id: 1, vehicleId: 1, tripId: 12, liters: 5, cost: 520, logDate: "2026-07-04" },
  { id: 2, vehicleId: 5, tripId: 2, liters: 32, cost: 3150, logDate: "2026-07-09" },
  { id: 3, vehicleId: 9, tripId: 7, liters: 13, cost: 1280, logDate: "2026-07-08" },
  { id: 4, vehicleId: 8, tripId: 10, liters: 21, cost: 2050, logDate: "2026-07-06" },
  { id: 5, vehicleId: 7, tripId: 11, liters: 25, cost: 2450, logDate: "2026-07-05" },
  { id: 6, vehicleId: 15, tripId: 14, liters: 40, cost: 3920, logDate: "2026-07-02" },
  { id: 7, vehicleId: 2, tripId: 1, liters: 110, cost: 8400, logDate: "2026-07-11", isAnomaly: true, anomalyReason: "110 L logged for a short 45 km route; expected range is 8-14 L." },
  { id: 8, vehicleId: 13, tripId: 16, liters: 31, cost: 3010, logDate: "2026-06-25" },
  { id: 9, vehicleId: 16, tripId: 17, liters: 35, cost: 3360, logDate: "2026-06-18" },
  { id: 10, vehicleId: 8, tripId: 18, liters: 18, cost: 1760, logDate: "2026-05-21" }
];

export const demoExpenses: Expense[] = [
  { id: 1, tripId: 1, vehicleId: 2, category: "Toll", amount: 420, expenseDate: "2026-07-11", note: "SG Highway toll" },
  { id: 2, tripId: 2, vehicleId: 5, category: "Toll", amount: 620, expenseDate: "2026-07-09", note: "NH48 toll cluster" },
  { id: 3, tripId: 2, vehicleId: 5, category: "Loading", amount: 900, expenseDate: "2026-07-09" },
  { id: 4, tripId: 7, vehicleId: 9, category: "Parking", amount: 250, expenseDate: "2026-07-08" },
  { id: 5, tripId: 10, vehicleId: 8, category: "Permit", amount: 1100, expenseDate: "2026-07-06" },
  { id: 6, tripId: 11, vehicleId: 7, category: "Misc", amount: 500, expenseDate: "2026-07-05" },
  { id: 7, tripId: 14, vehicleId: 15, category: "Toll", amount: 890, expenseDate: "2026-07-02" },
  { id: 8, vehicleId: 3, category: "Misc", amount: 350, expenseDate: "2026-07-07", note: "Shop consumables" }
];

export const demoInsights: AIInsight[] = [
  { id: 1, entityType: "vehicle", entityId: 10, insightType: "maintenance_risk", score: 0.88, payload: { reason: "High odometer and active engine repair" }, createdAt: "2026-07-12T08:00:00+05:30" },
  { id: 2, entityType: "fuel_log", entityId: 7, insightType: "fuel_anomaly", score: 0.97, payload: { expectedLiters: 12, observedLiters: 110 }, createdAt: "2026-07-12T08:30:00+05:30" },
  { id: 3, entityType: "driver", entityId: 5, insightType: "license_alert", score: 0.7, payload: { daysUntilExpiry: 16 }, createdAt: "2026-07-12T06:00:00+05:30" }
];

export const cityCoordinates: CityCoordinate[] = [
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { name: "Gandhinagar", lat: 23.2156, lng: 72.6369 },
  { name: "Surat", lat: 21.1702, lng: 72.8311 },
  { name: "Vadodara", lat: 22.3072, lng: 73.1812 },
  { name: "Rajkot", lat: 22.3039, lng: 70.8022 }
];

export const demoOpsEvents: OpsEvent[] = [
  { id: 1, tripCode: "TR001", route: "Gandhinagar Depot -> Ahmedabad Hub", vehicle: "TRUCK-11", driver: "Bhavesh", status: "Dispatched", detail: "ETA 45 min", timestamp: "2026-07-12T09:05:00+05:30" },
  { id: 2, tripCode: "TR004", route: "Vatva Industrial Area -> Sanand Warehouse", vehicle: "TRUCK-04", driver: "Suresh", status: "Draft", detail: "Awaiting driver confirmation", timestamp: "2026-07-12T08:48:00+05:30" },
  { id: 3, tripCode: "TR006", route: "Mansa -> Kalol Depot", status: "Cancelled", detail: "Vehicle went to shop", timestamp: "2026-07-10T12:12:00+05:30" },
  { id: 4, tripCode: "TR003", route: "Rajkot Yard -> Vadodara DC", vehicle: "MINI-15", driver: "Priya", status: "Dispatched", detail: "ETA 80 min", timestamp: "2026-07-11T10:25:00+05:30" }
];
