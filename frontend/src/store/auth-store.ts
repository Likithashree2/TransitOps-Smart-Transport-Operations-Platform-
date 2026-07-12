import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, User } from "../types/domain";
import { demoUsers } from "../lib/demo-data";
import { USE_DEMO_DATA, api } from "../lib/api";

interface AuthState {
  user?: User;
  token?: string;
  failedAttempts: number;
  login: (email: string, password: string, role?: Role) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: undefined,
      token: undefined,
      failedAttempts: 0,
      login: async (email, password, role) => {
        if (USE_DEMO_DATA) {
          const user = demoUsers.find((candidate) => candidate.email === email && (!role || candidate.role === role));
          if (!user || password !== "demo1234") {
            set({ failedAttempts: get().failedAttempts + 1 });
            throw new Error("Invalid credentials");
          }
          const token = `demo-token-${user.role}`;
          localStorage.setItem("transitops-token", token);
          set({ user, token, failedAttempts: 0 });
          return;
        }
        const response = await api.post("/auth/login", { email, password });
        localStorage.setItem("transitops-token", response.data.token);
        set({ user: response.data.user, token: response.data.token, failedAttempts: 0 });
      },
      logout: () => {
        localStorage.removeItem("transitops-token");
        set({ user: undefined, token: undefined, failedAttempts: 0 });
      }
    }),
    {
      name: "transitops-auth",
      partialize: (state) => ({ user: state.user, token: state.token, failedAttempts: state.failedAttempts })
    }
  )
);
