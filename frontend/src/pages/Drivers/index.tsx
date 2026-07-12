import { useMemo, useState } from "react";
import { Ban, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Panel } from "../../components/ui/Panel";
import { RuleViolationBanner } from "../../components/ui/RuleViolationBanner";
import { Select } from "../../components/ui/Select";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { updateDriver } from "../../features/drivers/service";
import { daysUntil, formatDate } from "../../lib/formatters";
import { useDemoOpsStore } from "../../store/demo-ops-store";
import { useUiStore } from "../../store/ui-store";
import type { Driver, DriverStatus } from "../../types/domain";

function expiryClass(driver: Driver) {
  const days = daysUntil(driver.licenseExpiry);
  if (days < 0) return "text-red-300 font-semibold";
  if (days <= 30) return "text-amber-300 font-semibold";
  return "text-ops-text";
}

function SafetyScore({ score }: { score: number }) {
  const color = score >= 90 ? "bg-green-400" : score >= 80 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="w-28">
      <div className="mb-1 flex justify-between text-xs">
        <span>{score}%</span>
      </div>
      <div className="h-1.5 rounded bg-[#202833]">
        <div className={`h-1.5 rounded ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function DriversPage() {
  const drivers = useDemoOpsStore((state) => state.drivers);
  const globalSearch = useUiStore((state) => state.globalSearch);
  const [statusFilter, setStatusFilter] = useState<DriverStatus | "All">("All");
  const [search, setSearch] = useState("");
  const query = `${search} ${globalSearch}`.trim().toLowerCase();
  const ruleDriver = drivers.find((driver) => daysUntil(driver.licenseExpiry) < 0 || driver.status === "Suspended");

  const filteredDrivers = useMemo(
    () =>
      drivers.filter((driver) => {
        const matchesSearch = !query || `${driver.fullName} ${driver.licenseNo} ${driver.licenseCategory}`.toLowerCase().includes(query);
        return matchesSearch && (statusFilter === "All" || driver.status === statusFilter);
      }),
    [drivers, query, statusFilter]
  );

  async function setDriverStatus(driver: Driver, status: DriverStatus) {
    await updateDriver(driver.id, { status });
    toast.success(`${driver.fullName} marked ${status}`);
  }

  const columns: Column<Driver>[] = [
    { key: "driver", header: "Driver", cell: (driver) => <span className="font-semibold">{driver.fullName}</span> },
    { key: "license", header: "License Number", cell: (driver) => <span className="font-mono">{driver.licenseNo}</span> },
    { key: "category", header: "Category", cell: (driver) => driver.licenseCategory },
    { key: "expiry", header: "License Expiry", cell: (driver) => <span className={expiryClass(driver)}>{formatDate(driver.licenseExpiry)}{daysUntil(driver.licenseExpiry) < 0 ? " EXPIRED" : ""}</span> },
    { key: "contact", header: "Contact", cell: (driver) => driver.contactNumber.replace(/(\d{4})\d{3}(\d{3})/, "$1xxx$2") },
    { key: "score", header: "Safety Score", cell: (driver) => <SafetyScore score={driver.safetyScore} /> },
    { key: "status", header: "Status", cell: (driver) => <StatusBadge status={driver.status} /> },
    {
      key: "actions",
      header: "Actions",
      cell: (driver) => (
        <div className="flex gap-2">
          {driver.status === "Suspended" ? (
            <Button variant="secondary" className="h-8 px-2" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => setDriverStatus(driver, "Available")}>
              Reactivate
            </Button>
          ) : (
            <Button variant="danger" className="h-8 px-2" icon={<Ban className="h-4 w-4" />} onClick={() => setDriverStatus(driver, "Suspended")}>
              Suspend
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      <PageHeader title="Drivers & Safety Profiles" eyebrow="License compliance" />
      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_180px_1.5fr]">
        <Input placeholder="Search drivers..." value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as DriverStatus | "All")}>
          <option>All</option>
          <option>Available</option>
          <option>On Trip</option>
          <option>Off Duty</option>
          <option>Suspended</option>
        </Select>
        <RuleViolationBanner
          show={Boolean(ruleDriver)}
          title="RULE VIOLATION"
          message={`${ruleDriver?.fullName ?? "Driver"} license expired or suspended - dispatch blocked`}
        />
      </div>
      <Panel
        title="Safety Register"
        action={
          <div className="hidden items-center gap-2 text-xs text-ops-muted md:flex">
            <ShieldAlert className="h-4 w-4 text-ops-amber2" />
            Expired and suspended drivers are excluded from dispatch.
          </div>
        }
      >
        <DataTable columns={columns} data={filteredDrivers} getRowKey={(driver) => driver.id} dense />
      </Panel>
    </>
  );
}
