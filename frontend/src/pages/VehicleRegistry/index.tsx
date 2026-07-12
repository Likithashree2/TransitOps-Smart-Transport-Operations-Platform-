import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { Panel } from "../../components/ui/Panel";
import { RiskBadge } from "../../components/ui/RiskBadge";
import { Select } from "../../components/ui/Select";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { createVehicle } from "../../features/vehicles/service";
import { formatCurrency, formatNumber } from "../../lib/formatters";
import { useDemoOpsStore } from "../../store/demo-ops-store";
import { useUiStore } from "../../store/ui-store";
import type { Vehicle, VehicleStatus, VehicleType } from "../../types/domain";

const vehicleSchema = z.object({
  registrationNo: z.string().min(4, "Registration number is required"),
  nameModel: z.string().min(2, "Vehicle / model is required"),
  type: z.enum(["Van", "Truck", "Mini", "Trailer"]),
  maxLoadCapacityKg: z.coerce.number().positive("Capacity must be greater than zero"),
  odometerKm: z.coerce.number().min(0, "Odometer cannot be negative"),
  acquisitionCost: z.coerce.number().min(0, "Acquisition cost cannot be negative"),
  region: z.string().min(2, "Region is required")
});

type VehicleForm = z.infer<typeof vehicleSchema>;

export default function VehicleRegistryPage() {
  const vehicles = useDemoOpsStore((state) => state.vehicles);
  const globalSearch = useUiStore((state) => state.globalSearch);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | "All">("All");
  const [typeFilter, setTypeFilter] = useState<VehicleType | "All">("All");
  const [regionFilter, setRegionFilter] = useState("All");
  const [sortKey, setSortKey] = useState<"registrationNo" | "odometerKm" | "riskScore">("registrationNo");
  const form = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { type: "Van", region: "Ahmedabad", odometerKm: 0, acquisitionCost: 0, maxLoadCapacityKg: 500 }
  });

  const regions = Array.from(new Set(vehicles.map((vehicle) => vehicle.region)));
  const query = `${search} ${globalSearch}`.trim().toLowerCase();
  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter((vehicle) => {
        const matchesSearch = !query || `${vehicle.registrationNo} ${vehicle.nameModel} ${vehicle.region}`.toLowerCase().includes(query);
        return (
          matchesSearch &&
          (statusFilter === "All" || vehicle.status === statusFilter) &&
          (typeFilter === "All" || vehicle.type === typeFilter) &&
          (regionFilter === "All" || vehicle.region === regionFilter)
        );
      })
      .sort((a, b) => {
        if (sortKey === "registrationNo") return a.registrationNo.localeCompare(b.registrationNo);
        return b[sortKey] - a[sortKey];
      });
  }, [vehicles, query, statusFilter, typeFilter, regionFilter, sortKey]);

  async function onSubmit(values: VehicleForm) {
    if (vehicles.some((vehicle) => vehicle.registrationNo.toLowerCase() === values.registrationNo.toLowerCase())) {
      form.setError("registrationNo", { message: "Registration No. must be unique" });
      return;
    }
    await createVehicle(values);
    toast.success("Vehicle added to registry");
    form.reset({ type: "Van", region: "Ahmedabad", odometerKm: 0, acquisitionCost: 0, maxLoadCapacityKg: 500 });
    setModalOpen(false);
  }

  const columns: Column<Vehicle>[] = [
    { key: "registration", header: "Registration", cell: (vehicle) => <span className="font-mono font-bold">{vehicle.registrationNo}</span> },
    { key: "model", header: "Vehicle / Model", cell: (vehicle) => vehicle.nameModel },
    { key: "type", header: "Type", cell: (vehicle) => vehicle.type },
    { key: "capacity", header: "Capacity", cell: (vehicle) => `${formatNumber(vehicle.maxLoadCapacityKg)} kg` },
    { key: "odometer", header: "Odometer", cell: (vehicle) => `${formatNumber(vehicle.odometerKm)} km` },
    { key: "region", header: "Region", cell: (vehicle) => vehicle.region },
    { key: "status", header: "Status", cell: (vehicle) => <StatusBadge status={vehicle.status} /> },
    { key: "risk", header: "Maintenance Risk", cell: (vehicle) => <RiskBadge risk={vehicle.risk} score={vehicle.riskScore} /> },
    { key: "actions", header: "Actions", cell: () => <Button variant="secondary" className="h-8 px-2">View</Button> }
  ];

  return (
    <>
      <PageHeader
        title="Vehicle Registry"
        eyebrow="Fleet asset control"
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>Add Vehicle</Button>}
      />
      <Panel
        title="Fleet Register"
        action={
          <Button variant="ghost" className="h-8" icon={<ArrowDownUp className="h-4 w-4" />} onClick={() => setSortKey(sortKey === "registrationNo" ? "odometerKm" : sortKey === "odometerKm" ? "riskScore" : "registrationNo")}>
            Sort
          </Button>
        }
      >
        <div className="grid gap-3 p-4 md:grid-cols-5">
          <Input placeholder="Search reg. no..." value={search} onChange={(event) => setSearch(event.target.value)} />
          <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as VehicleType | "All")}>
            <option>All</option>
            <option>Van</option>
            <option>Truck</option>
            <option>Mini</option>
            <option>Trailer</option>
          </Select>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as VehicleStatus | "All")}>
            <option>All</option>
            <option>Available</option>
            <option>On Trip</option>
            <option>In Shop</option>
            <option>Retired</option>
          </Select>
          <Select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}>
            <option>All</option>
            {regions.map((region) => (
              <option key={region}>{region}</option>
            ))}
          </Select>
          <div className="rounded-md border border-ops-border bg-[#0D1117] px-3 py-2 text-xs text-ops-muted">
            Rule: Retired/In Shop vehicles are hidden from Trip Dispatcher.
          </div>
        </div>
        <DataTable columns={columns} data={filteredVehicles} getRowKey={(vehicle) => vehicle.id} dense />
      </Panel>

      <Modal title="Add Vehicle" open={modalOpen} onClose={() => setModalOpen(false)}>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
          <Input label="Registration Number" {...form.register("registrationNo")} error={form.formState.errors.registrationNo?.message} />
          <Input label="Vehicle / Model" {...form.register("nameModel")} error={form.formState.errors.nameModel?.message} />
          <Select label="Type" {...form.register("type")}>
            <option>Van</option>
            <option>Truck</option>
            <option>Mini</option>
            <option>Trailer</option>
          </Select>
          <Input label="Maximum Capacity" type="number" {...form.register("maxLoadCapacityKg")} error={form.formState.errors.maxLoadCapacityKg?.message} />
          <Input label="Odometer" type="number" {...form.register("odometerKm")} error={form.formState.errors.odometerKm?.message} />
          <Input label="Acquisition Cost" type="number" {...form.register("acquisitionCost")} error={form.formState.errors.acquisitionCost?.message} />
          <Input label="Region" {...form.register("region")} error={form.formState.errors.region?.message} />
          <div className="flex items-end justify-between rounded-md border border-ops-border bg-[#0D1117] px-3 py-2 text-xs text-ops-muted">
            <span>Initial status</span>
            <span className="font-semibold text-green-300">Available</span>
          </div>
          <div className="md:col-span-2 flex items-center justify-between border-t border-ops-border pt-3">
            <p className="text-xs text-ops-muted">Acquisition: {formatCurrency(Number(form.watch("acquisitionCost") || 0))}</p>
            <Button type="submit">Save Vehicle</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
