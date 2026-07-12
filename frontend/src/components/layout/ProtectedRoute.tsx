import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth-store";
import { canAccess, type ModuleKey } from "../../lib/permissions";

export function ProtectedRoute({ module, children }: { module?: ModuleKey; children: ReactNode }) {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (module && !canAccess(user.role, module)) return <Navigate to="/settings" replace />;
  return <>{children}</>;
}
