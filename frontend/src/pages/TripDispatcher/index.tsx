import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, CheckCircle2, Circle, RadioTower, SendHorizonal, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Panel } from "../../components/ui/Panel";
import { RuleViolationBanner } from "../../components/ui/RuleViolationBanner";
import { Select } from "../../components/ui/Select";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Textarea } from "../../components/ui/Textarea";
import { generateDispatchProposal } from "../../features/ai-copilot/copilot";
import { createTrip, dispatchTrip } from "../../features/trips/service";
import { getAvailableDispatchDrivers, getAvailableDispatchVehicles } from "../../lib/calculations";
import { daysUntil, driverLabel, vehicleLabel } from "../../lib/formatters";
import { useDemoOpsStore } from "../../store/demo-ops-store";

const tripSchema = z.object({
  source: z.string().min(2, "Source is required"),
  destination: z.string().min(2, "Destination is required"),
  vehicleId: z.coerce.number().positive("Vehicle is required"),
  driverId: z.coerce.number().positive("Driver is required"),
  cargoWeightKg: z.coerce.number().positive("Cargo weight is required"),
  plannedDistanceKm: z.coerce.number().positive("Distance is required"),
  etaMinutes: z.coerce.number().optional()
});

type TripForm = z.infer<typeof tripSchema>;

const lifecycle = ["Draft", "Dispatched", "Completed"];

export default function TripDispatcherPage() {
  const { vehicles, drivers, opsEvents } = useDemoOpsStore();
  const availableVehicles = getAvailableDispatchVehicles(vehicles);
  const availableDrivers = getAvailableDispatchDrivers(drivers);
  const [prompt, setPrompt] = useState("Send the nearest available van to Ahmedabad Hub with 400kg");
  const [proposalText, setProposalText] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const form = useForm<TripForm>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      source: "Gandhinagar Depot",
      destination: "Ahmedabad Hub",
      vehicleId: 1,
      driverId: 1,
      cargoWeightKg: 700,
      plannedDistanceKm: 38
    }
  });

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === Number(form.watch("vehicleId")));
  const selectedDriver = drivers.find((driver) => driver.id === Number(form.watch("driverId")));
  const cargoWeight = Number(form.watch("cargoWeightKg") || 0);
  const capacityExceeded = Boolean(selectedVehicle && cargoWeight > selectedVehicle.maxLoadCapacityKg);
  const capacityOverBy = selectedVehicle ? Math.max(0, cargoWeight - selectedVehicle.maxLoadCapacityKg) : 0;
  const driverBlocked = Boolean(selectedDriver && (selectedDriver.status === "Suspended" || daysUntil(selectedDriver.licenseExpiry) < 0));
  const dispatchBlocked = capacityExceeded || driverBlocked;

  const sortedEvents = useMemo(() => opsEvents.slice(0, 6), [opsEvents]);

  async function runCopilot() {
    setCopilotLoading(true);
    try {
      const proposal = await generateDispatchProposal(prompt);
      form.reset({
        source: proposal.source,
        destination: proposal.destination,
        vehicleId: proposal.vehicleId,
        driverId: proposal.driverId,
        cargoWeightKg: proposal.cargoWeightKg,
        plannedDistanceKm: proposal.plannedDistanceKm
      });
      setProposalText(proposal.explanation);
      toast.success("AI proposal generated");
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : "Could not generate proposal");
    } finally {
      setCopilotLoading(false);
    }
  }

  async function onSubmit(values: TripForm) {
    const vehicle = vehicles.find((item) => item.id === Number(values.vehicleId));
    if (vehicle && values.cargoWeightKg > vehicle.maxLoadCapacityKg) {
      toast.error(`Capacity exceeded by ${values.cargoWeightKg - vehicle.maxLoadCapacityKg}kg`);
      return;
    }
    const trip = await createTrip({
      ...values,
      vehicleId: Number(values.vehicleId),
      driverId: Number(values.driverId),
      cargoWeightKg: Number(values.cargoWeightKg),
      plannedDistanceKm: Number(values.plannedDistanceKm)
    });
    await dispatchTrip(trip.id);
    toast.success(`${trip.tripCode} dispatched`);
    form.setValue("cargoWeightKg", 400);
  }

  return (
    <>
      <PageHeader title="Trip Dispatcher" eyebrow="AI-assisted operations desk" />
      <div className="grid gap-4 xl:grid-cols-[1.08fr_.92fr]">
        <div className="space-y-4">
          <Panel title="AI Dispatch Copilot">
            <div className="space-y-3 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-md border border-ops-amber bg-ops-amber/15">
                  <Bot className="h-5 w-5 text-ops-amber2" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold uppercase tracking-wide">AI Dispatch Copilot</h2>
                  <p className="text-sm text-ops-muted">Or just tell me what you need</p>
                </div>
              </div>
              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} aria-label="Copilot prompt" />
                <Button className="h-full min-h-20" icon={<Sparkles className="h-4 w-4" />} onClick={runCopilot} loading={copilotLoading}>
                  Generate Trip Proposal
                </Button>
              </div>
              {proposalText && <div className="rounded-md border border-ops-blue/40 bg-ops-blue/10 px-3 py-2 text-sm text-blue-200">{proposalText}</div>}
            </div>
          </Panel>

          <Panel title="Create Trip">
            <form className="space-y-3 p-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-3 md:grid-cols-2">
                <Input label="Source" {...form.register("source")} error={form.formState.errors.source?.message} />
                <Input label="Destination" {...form.register("destination")} error={form.formState.errors.destination?.message} />
                <Select label="Vehicle" {...form.register("vehicleId", { valueAsNumber: true })} error={form.formState.errors.vehicleId?.message}>
                  {availableVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.registrationNo} / {vehicle.type} / {vehicle.maxLoadCapacityKg}kg / {vehicle.region}
                    </option>
                  ))}
                </Select>
                <Select label="Driver" {...form.register("driverId", { valueAsNumber: true })} error={form.formState.errors.driverId?.message}>
                  {availableDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.fullName} / {driver.licenseCategory} / valid
                    </option>
                  ))}
                </Select>
                <Input label="Cargo Weight" type="number" {...form.register("cargoWeightKg", { valueAsNumber: true })} error={form.formState.errors.cargoWeightKg?.message} />
                <Input label="Planned Distance" type="number" {...form.register("plannedDistanceKm", { valueAsNumber: true })} error={form.formState.errors.plannedDistanceKm?.message} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md border border-ops-border bg-[#0D1117] p-3 text-xs text-ops-muted">
                  <div className="font-semibold text-ops-text">Vehicle Selected</div>
                  <div className="mt-1 font-mono">{vehicleLabel(selectedVehicle)}</div>
                  <div>{selectedVehicle?.type} / {selectedVehicle?.maxLoadCapacityKg}kg / {selectedVehicle?.region}</div>
                </div>
                <div className="rounded-md border border-ops-border bg-[#0D1117] p-3 text-xs text-ops-muted">
                  <div className="font-semibold text-ops-text">Driver Selected</div>
                  <div className="mt-1">{driverLabel(selectedDriver)}</div>
                  <div>{selectedDriver?.licenseCategory} / license {selectedDriver ? (daysUntil(selectedDriver.licenseExpiry) < 0 ? "expired" : "valid") : "unknown"}</div>
                </div>
              </div>
              <RuleViolationBanner
                show={capacityExceeded}
                message={`Capacity exceeded by ${capacityOverBy}kg - dispatch blocked`}
              />
              <RuleViolationBanner
                show={driverBlocked}
                message={`${selectedDriver?.fullName ?? "Driver"} is suspended or license expired - dispatch blocked`}
              />
              <div className="flex items-center gap-3 border-t border-ops-border pt-3">
                <Button type="submit" disabled={dispatchBlocked} icon={<SendHorizonal className="h-4 w-4" />}>
                  Dispatch Trip
                </Button>
                <Button type="button" variant="danger" onClick={() => form.reset()}>
                  Cancel
                </Button>
              </div>
            </form>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Trip Lifecycle">
            <div className="p-4">
              <div className="flex items-center justify-between">
                {lifecycle.map((step, index) => (
                  <div key={step} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className={`grid h-8 w-8 place-items-center rounded-full ${index < 2 ? "bg-ops-blue text-[#06111C]" : "bg-ops-border text-ops-muted"}`}>
                        {index < 2 ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                      </span>
                      <span className="text-xs font-semibold text-ops-muted">{step}</span>
                    </div>
                    {index < lifecycle.length - 1 && <div className="mx-2 h-px flex-1 bg-ops-border" />}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">Cancelled is an alternate terminal state from Dispatched.</div>
            </div>
          </Panel>

          <Panel title="Live Ops Board" action={<RadioTower className="h-4 w-4 text-ops-blue" />}>
            <div className="space-y-3 p-4">
              {sortedEvents.map((event) => (
                <div key={event.id} className="border border-dashed border-ops-border bg-[#0D1117] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-sm font-bold text-ops-text">{event.tripCode}</div>
                      <div className="mt-1 text-sm text-ops-text">{event.route}</div>
                      <div className="mt-2 flex gap-2 text-xs text-ops-muted">
                        <span>{event.vehicle ?? "Unassigned"}</span>
                        <span>/</span>
                        <span>{event.driver ?? "Awaiting driver"}</span>
                      </div>
                    </div>
                    <StatusBadge status={event.status} />
                  </div>
                  <div className="mt-2 text-xs text-ops-muted">{event.detail}</div>
                </div>
              ))}
              <p className="text-xs text-ops-muted">On complete: odometer → fuel log → expenses → vehicle and driver available.</p>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
