import { api, USE_DEMO_DATA } from "../../lib/api";
import { useDemoOpsStore } from "../../store/demo-ops-store";
import type { Vehicle } from "../../types/domain";

export type VehicleCreateInput = Omit<Vehicle, "id" | "status" | "risk" | "riskScore" | "purchaseYear">;

export async function listVehicles() {
  if (USE_DEMO_DATA) return useDemoOpsStore.getState().vehicles;
  const response = await api.get<Vehicle[]>("/vehicles");
  return response.data;
}

export async function createVehicle(input: VehicleCreateInput) {
  if (USE_DEMO_DATA) return useDemoOpsStore.getState().addVehicle(input);
  const response = await api.post<Vehicle>("/vehicles", input);
  return response.data;
}

export async function updateVehicle(id: number, input: Partial<Vehicle>) {
  if (USE_DEMO_DATA) return useDemoOpsStore.getState().vehicles.find((vehicle) => vehicle.id === id);
  const response = await api.patch<Vehicle>(`/vehicles/${id}`, input);
  return response.data;
}
