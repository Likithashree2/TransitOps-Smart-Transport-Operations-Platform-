import { api, USE_DEMO_DATA } from "../../lib/api";
import { useDemoOpsStore } from "../../store/demo-ops-store";
import type { Expense } from "../../types/domain";

export type ExpenseCreateInput = Omit<Expense, "id">;

export async function listExpenses() {
  if (USE_DEMO_DATA) return useDemoOpsStore.getState().expenses;
  const response = await api.get<Expense[]>("/expenses");
  return response.data;
}

export async function createExpense(input: ExpenseCreateInput) {
  if (USE_DEMO_DATA) return useDemoOpsStore.getState().addExpense(input);
  const response = await api.post<Expense>("/expenses", input);
  return response.data;
}
