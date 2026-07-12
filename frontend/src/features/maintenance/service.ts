import { api, USE_DEMO_DATA } from "../../lib/api";
import { useDemoOpsStore } from "../../store/demo-ops-store";
import type { MaintenanceLog } from "../../types/domain";

export type MaintenanceCreateInput = Omit<MaintenanceLog, "id" | "status" | "riskScore">;

export async function listMaintenance() {
  if (USE_DEMO_DATA) return useDemoOpsStore.getState().maintenanceLogs;
  const response = await api.get<MaintenanceLog[]>("/maintenance");
  return response.data;
}

export async function openMaintenance(input: MaintenanceCreateInput) {
  if (USE_DEMO_DATA) return useDemoOpsStore.getState().openMaintenance(input);
  const response = await api.post<MaintenanceLog>("/maintenance", input);
  return response.data;
}

export async function closeMaintenance(id: number) {
  if (USE_DEMO_DATA) {
    useDemoOpsStore.getState().closeMaintenance(id);
    return useDemoOpsStore.getState().maintenanceLogs.find((log) => log.id === id);
  }
  const response = await api.patch<MaintenanceLog>(`/maintenance/${id}/close`);
  return response.data;
}
