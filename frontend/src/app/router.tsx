import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import { firstRouteForRole } from "../lib/permissions";
import { useAuthStore } from "../store/auth-store";
import LoginPage from "../pages/Login";
import DashboardPage from "../pages/Dashboard";
import VehicleRegistryPage from "../pages/VehicleRegistry";
import DriversPage from "../pages/Drivers";
import TripDispatcherPage from "../pages/TripDispatcher";
import MaintenancePage from "../pages/Maintenance";
import FuelExpensePage from "../pages/FuelExpense";
import AnalyticsPage from "../pages/Analytics";
import SettingsPage from "../pages/Settings";

function RootRedirect() {
  const user = useAuthStore.getState().user;
  return <Navigate to={user ? firstRouteForRole(user.role) : "/login"} replace />;
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <RootRedirect /> },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute module="dashboard">
            <DashboardPage />
          </ProtectedRoute>
        )
      },
      {
        path: "vehicles",
        element: (
          <ProtectedRoute module="vehicles">
            <VehicleRegistryPage />
          </ProtectedRoute>
        )
      },
      {
        path: "drivers",
        element: (
          <ProtectedRoute module="drivers">
            <DriversPage />
          </ProtectedRoute>
        )
      },
      {
        path: "trips",
        element: (
          <ProtectedRoute module="trips">
            <TripDispatcherPage />
          </ProtectedRoute>
        )
      },
      {
        path: "maintenance",
        element: (
          <ProtectedRoute module="maintenance">
            <MaintenancePage />
          </ProtectedRoute>
        )
      },
      {
        path: "fuel-expenses",
        element: (
          <ProtectedRoute module="fuel">
            <FuelExpensePage />
          </ProtectedRoute>
        )
      },
      {
        path: "analytics",
        element: (
          <ProtectedRoute module="analytics">
            <AnalyticsPage />
          </ProtectedRoute>
        )
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute module="settings">
            <SettingsPage />
          </ProtectedRoute>
        )
      }
    ]
  }
]);
