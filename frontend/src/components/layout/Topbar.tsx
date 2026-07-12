import { Bell, LogOut, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button";
import { roleLabels } from "../../lib/permissions";
import { useAuthStore } from "../../store/auth-store";
import { useUiStore } from "../../store/ui-store";
import { daysUntil } from "../../lib/formatters";
import { useDemoOpsStore } from "../../store/demo-ops-store";

export function Topbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { globalSearch, setGlobalSearch } = useUiStore();
  const drivers = useDemoOpsStore((state) => state.drivers);
  const alertCount = drivers.filter((driver) => daysUntil(driver.licenseExpiry) <= 30 || driver.status === "Suspended").length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ops-border bg-ops-bg/95 px-4 backdrop-blur md:px-5">
      <div className="relative ml-10 w-full max-w-sm md:ml-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ops-muted" />
        <input
          value={globalSearch}
          onChange={(event) => setGlobalSearch(event.target.value)}
          placeholder="Search vehicles, trips, drivers..."
          className="h-9 w-full rounded-md border border-ops-border bg-[#0D1117] pl-9 pr-3 text-sm text-ops-text outline-none focus:border-ops-blue"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button className="relative rounded-md border border-ops-border bg-ops-surface p-2 text-ops-muted hover:text-ops-text" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {alertCount > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-ops-amber px-1 text-[10px] font-bold text-white">{alertCount}</span>}
        </button>
        <div className="hidden items-center gap-2 rounded-md border border-ops-border bg-ops-surface px-2 py-1.5 md:flex">
          <div className="text-right">
            <div className="text-xs font-semibold text-ops-text">{user?.fullName}</div>
            <div className="text-[10px] text-ops-blue">{user ? roleLabels[user.role] : "Guest"}</div>
          </div>
          <div className="grid h-8 w-8 place-items-center rounded-full bg-ops-blue text-xs font-black text-[#06111C]">
            {user?.fullName
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </div>
        </div>
        <Button
          variant="ghost"
          className="h-9 px-2"
          icon={<LogOut className="h-4 w-4" />}
          onClick={() => {
            logout();
            navigate("/login");
          }}
        />
      </div>
    </header>
  );
}
