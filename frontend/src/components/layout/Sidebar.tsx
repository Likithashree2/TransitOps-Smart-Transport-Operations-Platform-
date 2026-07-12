import { NavLink } from "react-router-dom";
import { BarChart3, BusFront, CarFront, Gauge, Menu, Settings, ShieldCheck, SquareActivity, Wrench, WalletCards, X } from "lucide-react";
import { cn } from "../../lib/formatters";
import { canAccess, type ModuleKey } from "../../lib/permissions";
import { useAuthStore } from "../../store/auth-store";
import { useUiStore } from "../../store/ui-store";

const navItems: Array<{ label: string; to: string; module: ModuleKey; icon: typeof Gauge }> = [
  { label: "Dashboard", to: "/dashboard", module: "dashboard", icon: Gauge },
  { label: "Vehicle Registry", to: "/vehicles", module: "vehicles", icon: BusFront },
  { label: "Drivers", to: "/drivers", module: "drivers", icon: ShieldCheck },
  { label: "Trip Dispatcher", to: "/trips", module: "trips", icon: CarFront },
  { label: "Maintenance", to: "/maintenance", module: "maintenance", icon: Wrench },
  { label: "Fuel & Expenses", to: "/fuel-expenses", module: "fuel", icon: WalletCards },
  { label: "Reports & Analytics", to: "/analytics", module: "analytics", icon: BarChart3 },
  { label: "Settings & RBAC", to: "/settings", module: "settings", icon: Settings }
];

export function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const filteredNav = navItems.filter((item) => canAccess(user?.role, item.module));

  return (
    <>
      <button
        className="fixed left-3 top-3 z-40 rounded-md border border-ops-border bg-ops-sidebar p-2 text-ops-text md:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </button>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[214px] border-r border-ops-border bg-ops-sidebar transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-ops-border px-4">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center border border-ops-amber bg-ops-amber/20">
              <SquareActivity className="h-4 w-4 text-ops-amber2" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-ops-text">TransitOps</span>
          </div>
          <button className="text-ops-muted md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex h-10 items-center gap-3 rounded-md border px-3 text-sm font-medium transition",
                    isActive
                      ? "border-ops-amber bg-ops-amber/18 text-ops-text"
                      : "border-transparent text-ops-muted hover:border-ops-border hover:bg-ops-surface"
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}
    </>
  );
}
