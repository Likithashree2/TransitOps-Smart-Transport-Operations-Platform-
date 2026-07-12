import { api, USE_DEMO_DATA } from "../../lib/api";
import { useDemoOpsStore } from "../../store/demo-ops-store";
import type { Trip } from "../../types/domain";

export type TripCreateInput = Omit<Trip, "id" | "tripCode" | "status" | "createdAt" | "revenue">;

export async function listTrips() {
  if (USE_DEMO_DATA) return useDemoOpsStore.getState().trips;
  const response = await api.get<Trip[]>("/trips");
  return response.data;
}

export async function createTrip(input: TripCreateInput) {
  if (USE_DEMO_DATA) return useDemoOpsStore.getState().addTrip(input);
  const response = await api.post<Trip>("/trips", input);
  return response.data;
}

export async function dispatchTrip(id: number) {
  if (USE_DEMO_DATA) {
    useDemoOpsStore.getState().dispatchTrip(id);
    return useDemoOpsStore.getState().trips.find((trip) => trip.id === id);
  }
  const response = await api.post<Trip>(`/trips/${id}/dispatch`);
  return response.data;
}

export async function completeTrip(id: number) {
  if (USE_DEMO_DATA) {
    useDemoOpsStore.getState().completeTrip(id);
    return useDemoOpsStore.getState().trips.find((trip) => trip.id === id);
  }
  const response = await api.post<Trip>(`/trips/${id}/complete`);
  return response.data;
}

export async function cancelTrip(id: number) {
  if (USE_DEMO_DATA) {
    useDemoOpsStore.getState().cancelTrip(id);
    return useDemoOpsStore.getState().trips.find((trip) => trip.id === id);
  }
  const response = await api.post<Trip>(`/trips/${id}/cancel`);
  return response.data;
}
