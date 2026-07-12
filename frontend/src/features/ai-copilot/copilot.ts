import { api, USE_DEMO_DATA } from "../../lib/api";
import { getAvailableDispatchDrivers, getAvailableDispatchVehicles } from "../../lib/calculations";
import { useDemoOpsStore } from "../../store/demo-ops-store";

export interface DispatchProposal {
  source: string;
  destination: string;
  vehicleId: number;
  driverId: number;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  explanation: string;
}

const routeDistances: Record<string, number> = {
  "Gandhinagar Depot|Ahmedabad Hub": 45,
  "Ahmedabad Hub|Surat Textile Park": 266,
  "Ahmedabad Hub|Rajkot Yard": 216,
  "Vadodara DC|Ahmedabad Hub": 111,
  "Surat Depot|Ahmedabad Hub": 266
};

function parseCargo(prompt: string) {
  const match = prompt.match(/(\d+)\s*kg/i);
  return match ? Number(match[1]) : 400;
}

function parseVehicleType(prompt: string) {
  if (/truck/i.test(prompt)) return "Truck";
  if (/mini/i.test(prompt)) return "Mini";
  if (/trailer/i.test(prompt)) return "Trailer";
  return "Van";
}

function parseDestination(prompt: string) {
  if (/surat/i.test(prompt)) return "Surat Textile Park";
  if (/vadodara/i.test(prompt)) return "Vadodara DC";
  if (/rajkot/i.test(prompt)) return "Rajkot Yard";
  if (/gandhinagar/i.test(prompt)) return "Gandhinagar Depot";
  return "Ahmedabad Hub";
}

export async function generateDispatchProposal(prompt: string): Promise<DispatchProposal> {
  if (!USE_DEMO_DATA) {
    const response = await api.post("/ai/copilot/dispatch", { prompt });
    return response.data.proposed_trip;
  }

  const { vehicles, drivers } = useDemoOpsStore.getState();
  const cargoWeightKg = parseCargo(prompt);
  const vehicleType = parseVehicleType(prompt);
  const destination = parseDestination(prompt);
  const source = destination === "Ahmedabad Hub" ? "Gandhinagar Depot" : "Ahmedabad Hub";
  const vehicle =
    getAvailableDispatchVehicles(vehicles)
      .filter((item) => item.type === vehicleType && item.maxLoadCapacityKg >= cargoWeightKg)
      .sort((a, b) => a.maxLoadCapacityKg - b.maxLoadCapacityKg)[0] ?? getAvailableDispatchVehicles(vehicles).find((item) => item.type === vehicleType);
  const driver = getAvailableDispatchDrivers(drivers).find((item) => (vehicleType === "Truck" || vehicleType === "Trailer" ? item.licenseCategory === "HMV" : item.licenseCategory === "LMV")) ?? getAvailableDispatchDrivers(drivers)[0];

  if (!vehicle || !driver) {
    throw new Error("No valid vehicle or driver available for this prompt.");
  }

  const plannedDistanceKm = routeDistances[`${source}|${destination}`] ?? 58;
  return {
    source,
    destination,
    vehicleId: vehicle.id,
    driverId: driver.id,
    cargoWeightKg,
    plannedDistanceKm,
    explanation: `${vehicle.nameModel} is ${vehicle.status}, ${vehicle.maxLoadCapacityKg}kg capacity, and ${driver.fullName} has a valid ${driver.licenseCategory} license.`
  };
}
