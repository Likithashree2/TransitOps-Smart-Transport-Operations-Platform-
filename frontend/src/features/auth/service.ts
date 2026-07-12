import type { Role } from "../../types/domain";
import { useAuthStore } from "../../store/auth-store";

export async function login(email: string, password: string, role?: Role) {
  return useAuthStore.getState().login(email, password, role);
}

export function logout() {
  useAuthStore.getState().logout();
}
