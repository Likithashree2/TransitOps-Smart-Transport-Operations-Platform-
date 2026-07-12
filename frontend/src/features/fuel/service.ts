import { api, USE_DEMO_DATA } from "../../lib/api";
import { useDemoOpsStore } from "../../store/demo-ops-store";
import type { FuelLog } from "../../types/domain";

export type FuelCreateInput = Omit<FuelLog, "id">;

export async function listFuelLogs() {
  if (USE_DEMO_DATA) return useDemoOpsStore.getState().fuelLogs;
  const response = await api.get<FuelLog[]>("/fuel-logs");
  return response.data;
}

export async function createFuelLog(input: FuelCreateInput) {
  if (USE_DEMO_DATA) return useDemoOpsStore.getState().addFuelLog(input);
  const response = await api.post<FuelLog>("/fuel-logs", input);
  return response.data;
}
