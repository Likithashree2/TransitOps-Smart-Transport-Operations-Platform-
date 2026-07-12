import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Panel } from "../../components/ui/Panel";
import { Select } from "../../components/ui/Select";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { createExpense } from "../../features/expenses/service";
import { createFuelLog } from "../../features/fuel/service";
import { getOperationalCost } from "../../lib/calculations";
import { formatCurrency, formatDate, vehicleLabel } from "../../lib/formatters";
import { useDemoOpsStore } from "../../store/demo-ops-store";
import type { Expense, ExpenseCategory, FuelLog } from "../../types/domain";

const fuelSchema = z.object({
  vehicleId: z.coerce.number().positive(),
  tripId: z.coerce.number().optional(),
  liters: z.coerce.number().positive(),
  cost: z.coerce.number().min(0),
  logDate: z.string().min(1)
});

const expenseSchema = z.object({
  vehicleId: z.coerce.number().optional(),
  tripId: z.coerce.number().optional(),
  category: z.enum(["Toll", "Misc", "Permit", "Parking", "Loading"]),
  amount: z.coerce.number().min(0),
  expenseDate: z.string().min(1),
  note: z.string().optional()
});

type FuelForm = z.infer<typeof fuelSchema>;
type ExpenseForm = z.infer<typeof expenseSchema>;

export default function FuelExpensePage() {
  const { vehicles, trips, fuelLogs, expenses, maintenanceLogs } = useDemoOpsStore();
  const fuelForm = useForm<FuelForm>({ resolver: zodResolver(fuelSchema), defaultValues: { vehicleId: 1, tripId: undefined, liters: 42, cost: 3150, logDate: "2026-07-12" } });
  const expenseForm = useForm<ExpenseForm>({ resolver: zodResolver(expenseSchema), defaultValues: { vehicleId: 1, tripId: undefined, category: "Toll", amount: 120, expenseDate: "2026-07-12" } });
  const totalOperationalCost = getOperationalCost(fuelLogs, expenses, maintenanceLogs);

  async function onFuelSubmit(values: FuelForm) {
    await createFuelLog({ ...values, tripId: values.tripId || undefined });
    toast.success("Fuel log added");
    fuelForm.reset({ ...values, liters: 0, cost: 0 });
  }

  async function onExpenseSubmit(values: ExpenseForm) {
    await createExpense({ ...values, vehicleId: values.vehicleId || undefined, tripId: values.tripId || undefined });
    toast.success("Expense added");
    expenseForm.reset({ ...values, amount: 0 });
  }

  const fuelColumns: Column<FuelLog>[] = [
    { key: "vehicle", header: "Vehicle", cell: (log) => <span className="font-mono">{vehicleLabel(vehicles.find((vehicle) => vehicle.id === log.vehicleId))}</span> },
    { key: "trip", header: "Trip", cell: (log) => <span className="font-mono">{trips.find((trip) => trip.id === log.tripId)?.tripCode ?? "-"}</span> },
    { key: "date", header: "Date", cell: (log) => formatDate(log.logDate) },
    { key: "liters", header: "Liters", cell: (log) => `${log.liters} L` },
    { key: "cost", header: "Cost", cell: (log) => formatCurrency(log.cost) },
    {
      key: "anomaly",
      header: "Anomaly",
      cell: (log) =>
        log.isAnomaly ? (
          <span className="inline-flex items-center gap-1 rounded border border-amber-400/50 bg-amber-400/10 px-2 py-1 text-xs font-semibold text-amber-200">
            <AlertTriangle className="h-3 w-3" /> unusual
          </span>
        ) : (
          <span className="text-xs text-ops-muted">normal</span>
        )
    }
  ];

  const expenseColumns: Column<Expense>[] = [
    { key: "trip", header: "Trip", cell: (expense) => <span className="font-mono">{trips.find((trip) => trip.id === expense.tripId)?.tripCode ?? "-"}</span> },
    { key: "vehicle", header: "Vehicle", cell: (expense) => <span className="font-mono">{vehicleLabel(vehicles.find((vehicle) => vehicle.id === expense.vehicleId))}</span> },
    { key: "category", header: "Category", cell: (expense) => expense.category },
    { key: "date", header: "Date", cell: (expense) => formatDate(expense.expenseDate) },
    { key: "amount", header: "Amount", cell: (expense) => formatCurrency(expense.amount) },
    { key: "status", header: "Trip Status", cell: (expense) => expense.tripId ? <StatusBadge status={trips.find((trip) => trip.id === expense.tripId)?.status ?? "Draft"} /> : <span className="text-xs text-ops-muted">Unlinked</span> }
  ];

  return (
    <>
      <PageHeader title="Fuel & Expense Management" eyebrow="Cost control" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Fuel Logs">
          <form className="grid gap-3 border-b border-ops-border p-4 md:grid-cols-5" onSubmit={fuelForm.handleSubmit(onFuelSubmit)}>
            <Select label="Vehicle" {...fuelForm.register("vehicleId", { valueAsNumber: true })}>
              {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.registrationNo}</option>)}
            </Select>
            <Select label="Trip optional" {...fuelForm.register("tripId", { valueAsNumber: true })}>
              <option value="">None</option>
              {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.tripCode}</option>)}
            </Select>
            <Input label="Liters" type="number" {...fuelForm.register("liters", { valueAsNumber: true })} />
            <Input label="Cost" type="number" {...fuelForm.register("cost", { valueAsNumber: true })} />
            <Input label="Date" type="date" {...fuelForm.register("logDate")} />
            <Button className="md:col-span-5" icon={<Plus className="h-4 w-4" />} type="submit">Log Fuel</Button>
          </form>
          <DataTable columns={fuelColumns} data={fuelLogs} getRowKey={(log) => log.id} dense />
        </Panel>

        <Panel title="Other Expenses">
          <form className="grid gap-3 border-b border-ops-border p-4 md:grid-cols-5" onSubmit={expenseForm.handleSubmit(onExpenseSubmit)}>
            <Select label="Vehicle" {...expenseForm.register("vehicleId", { valueAsNumber: true })}>
              <option value="">None</option>
              {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.registrationNo}</option>)}
            </Select>
            <Select label="Trip optional" {...expenseForm.register("tripId", { valueAsNumber: true })}>
              <option value="">None</option>
              {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.tripCode}</option>)}
            </Select>
            <Select label="Category" {...expenseForm.register("category")}>
              {(["Toll", "Misc", "Permit", "Parking", "Loading"] as ExpenseCategory[]).map((category) => <option key={category}>{category}</option>)}
            </Select>
            <Input label="Amount" type="number" {...expenseForm.register("amount", { valueAsNumber: true })} />
            <Input label="Date" type="date" {...expenseForm.register("expenseDate")} />
            <Button className="md:col-span-5" icon={<Plus className="h-4 w-4" />} type="submit">Add Expense</Button>
          </form>
          <DataTable columns={expenseColumns} data={expenses} getRowKey={(expense) => expense.id} dense />
        </Panel>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_auto]">
        <div className="rounded-md border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
          <div className="font-bold">Anomaly explanation</div>
          <div className="mt-1">{fuelLogs.find((log) => log.isAnomaly)?.anomalyReason}</div>
        </div>
        <div className="border border-ops-border bg-ops-surface px-5 py-3 text-right">
          <div className="text-xs font-semibold uppercase tracking-wide text-ops-muted">Total Operational Cost</div>
          <div className="mt-1 text-2xl font-extrabold text-ops-amber2">{formatCurrency(totalOperationalCost)}</div>
        </div>
      </div>
    </>
  );
}
