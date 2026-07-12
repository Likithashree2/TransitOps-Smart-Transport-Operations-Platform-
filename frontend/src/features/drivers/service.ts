import { api, USE_DEMO_DATA } from "../../lib/api";
import { useDemoOpsStore } from "../../store/demo-ops-store";
import type { Driver, DriverStatus } from "../../types/domain";

export async function listDrivers() {
  if (USE_DEMO_DATA) return useDemoOpsStore.getState().drivers;
  const response = await api.get<Driver[]>("/drivers");
  return response.data;
}

export async function updateDriver(id: number, input: Partial<Driver>) {
  if (USE_DEMO_DATA && input.status) {
    useDemoOpsStore.getState().updateDriverStatus(id, input.status as DriverStatus);
    return useDemoOpsStore.getState().drivers.find((driver) => driver.id === id);
  }
  const response = await api.patch<Driver>(`/drivers/${id}`, input);
  return response.data;
}
