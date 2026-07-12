import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightLeft, CheckCircle2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Panel } from "../../components/ui/Panel";
import { RiskBadge } from "../../components/ui/RiskBadge";
import { Select } from "../../components/ui/Select";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Textarea } from "../../components/ui/Textarea";
import { closeMaintenance, openMaintenance } from "../../features/maintenance/service";
import { formatCurrency, formatDate, vehicleLabel } from "../../lib/formatters";
import { useDemoOpsStore } from "../../store/demo-ops-store";
import type { MaintenanceLog } from "../../types/domain";

const maintenanceSchema = z.object({
  vehicleId: z.coerce.number().positive("Vehicle is required"),
  serviceType: z.string().min(2, "Service type is required"),
  cost: z.coerce.number().min(0, "Cost cannot be negative"),
  serviceDate: z.string().min(1, "Service date is required"),
  notes: z.string().optional()
});

type MaintenanceForm = z.infer<typeof maintenanceSchema>;

export default function MaintenancePage() {
  const { vehicles, maintenanceLogs } = useDemoOpsStore();
  const activeVehicles = vehicles.filter((vehicle) => vehicle.status !== "Retired");
  const form = useForm<MaintenanceForm>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: { vehicleId: 1, serviceType: "Oil Change", cost: 2500, serviceDate: "2026-07-12", notes: "" }
  });

  async function onSubmit(values: MaintenanceForm) {
    await openMaintenance(values);
    toast.success("Maintenance opened; vehicle moved to In Shop");
    form.reset({ vehicleId: values.vehicleId, serviceType: "Oil Change", cost: 2500, serviceDate: "2026-07-12", notes: "" });
  }

  async function closeLog(log: MaintenanceLog) {
    await closeMaintenance(log.id);
    toast.success("Maintenance closed; vehicle restored to Available");
  }

  const columns: Column<MaintenanceLog>[] = [
    { key: "vehicle", header: "Vehicle", cell: (log) => <span className="font-mono">{vehicleLabel(vehicles.find((vehicle) => vehicle.id === log.vehicleId))}</span> },
    { key: "service", header: "Service", cell: (log) => log.serviceType },
    { key: "date", header: "Date", cell: (log) => formatDate(log.serviceDate) },
    { key: "cost", header: "Cost", cell: (log) => formatCurrency(log.cost) },
    { key: "status", header: "Status", cell: (log) => <StatusBadge status={log.status} /> },
    {
      key: "risk",
      header: "Risk Score",
      cell: (log) => {
        const vehicle = vehicles.find((item) => item.id === log.vehicleId);
        return <RiskBadge risk={vehicle?.risk ?? "Medium"} score={log.riskScore} />;
      }
    },
    {
      key: "action",
      header: "Action",
      cell: (log) =>
        log.status === "Active" ? (
          <Button variant="secondary" className="h-8 px-2" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => closeLog(log)}>
            Close
          </Button>
        ) : (
          <span className="text-xs text-ops-muted">Closed</span>
        )
    }
  ];

  return (
    <>
      <PageHeader title="Maintenance" eyebrow="Service lifecycle" />
      <div className="grid gap-4 xl:grid-cols-[.82fr_1.18fr]">
        <Panel title="Log Service Record">
          <form className="space-y-3 p-4" onSubmit={form.handleSubmit(onSubmit)}>
            <Select label="Vehicle" {...form.register("vehicleId", { valueAsNumber: true })} error={form.formState.errors.vehicleId?.message}>
              {activeVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.registrationNo} / {vehicle.nameModel} / {vehicle.status}
                </option>
              ))}
            </Select>
            <Input label="Service Type" {...form.register("serviceType")} error={form.formState.errors.serviceType?.message} />
            <Input label="Cost" type="number" {...form.register("cost", { valueAsNumber: true })} error={form.formState.errors.cost?.message} />
            <Input label="Service Date" type="date" {...form.register("serviceDate")} error={form.formState.errors.serviceDate?.message} />
            <Textarea label="Notes" {...form.register("notes")} />
            <Button className="w-full" icon={<Wrench className="h-4 w-4" />} type="submit">
              Save
            </Button>
          </form>
          <div className="border-t border-ops-border p-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm">
              <span className="font-semibold text-green-300">Available</span>
              <ArrowRightLeft className="h-5 w-5 text-ops-muted" />
              <span className="text-right font-semibold text-ops-amber2">In Shop</span>
            </div>
            <p className="mt-3 text-xs text-ops-muted">Note: In Shop vehicles are removed from the dispatch pool.</p>
          </div>
        </Panel>
        <Panel title="Service Log">
          <DataTable columns={columns} data={maintenanceLogs} getRowKey={(log) => log.id} dense />
        </Panel>
      </div>
    </>
  );
}
