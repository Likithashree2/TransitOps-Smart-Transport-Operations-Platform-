import type { Role } from "../types/domain";

export type ModuleKey =
  | "dashboard"
  | "vehicles"
  | "drivers"
  | "trips"
  | "maintenance"
  | "fuel"
  | "analytics"
  | "settings";

export const roleLabels: Record<Role, string> = {
  fleet_manager: "Fleet Manager",
  dispatcher: "Dispatcher",
  safety_officer: "Safety Officer",
  financial_analyst: "Financial Analyst"
};

export const permissionMatrix: Record<ModuleKey, Record<Role, "full" | "view" | "none">> = {
  dashboard: {
    fleet_manager: "view",
    dispatcher: "full",
    safety_officer: "view",
    financial_analyst: "view"
  },
  vehicles: {
    fleet_manager: "full",
    dispatcher: "view",
    safety_officer: "none",
    financial_analyst: "none"
  },
  drivers: {
    fleet_manager: "view",
    dispatcher: "none",
    safety_officer: "full",
    financial_analyst: "none"
  },
  trips: {
    fleet_manager: "view",
    dispatcher: "full",
    safety_officer: "view",
    financial_analyst: "none"
  },
  maintenance: {
    fleet_manager: "full",
    dispatcher: "none",
    safety_officer: "none",
    financial_analyst: "none"
  },
  fuel: {
    fleet_manager: "none",
    dispatcher: "none",
    safety_officer: "none",
    financial_analyst: "full"
  },
  analytics: {
    fleet_manager: "view",
    dispatcher: "none",
    safety_officer: "none",
    financial_analyst: "full"
  },
  settings: {
    fleet_manager: "view",
    dispatcher: "view",
    safety_officer: "view",
    financial_analyst: "view"
  }
};

export const canAccess = (role: Role | undefined, module: ModuleKey) =>
  Boolean(role && permissionMatrix[module][role] !== "none");

export const firstRouteForRole = (role: Role) => {
  if (role === "dispatcher") return "/dashboard";
  if (role === "fleet_manager") return "/vehicles";
  if (role === "safety_officer") return "/drivers";
  return "/fuel-expenses";
};
