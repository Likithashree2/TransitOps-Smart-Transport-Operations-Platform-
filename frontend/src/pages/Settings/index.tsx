import { Check, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { PageHeader } from "../../components/ui/PageHeader";
import { Panel } from "../../components/ui/Panel";
import { permissionMatrix, roleLabels, type ModuleKey } from "../../lib/permissions";
import type { Role } from "../../types/domain";

const modules: Array<{ key: ModuleKey; label: string }> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "vehicles", label: "Vehicles" },
  { key: "drivers", label: "Drivers" },
  { key: "trips", label: "Trips" },
  { key: "maintenance", label: "Maintenance" },
  { key: "fuel", label: "Fuel & Expenses" },
  { key: "analytics", label: "Analytics" }
];

const roles = Object.keys(roleLabels) as Role[];

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings & RBAC" eyebrow="Depot controls" />
      <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
        <Panel title="General">
          <div className="space-y-3 p-4">
            <Input label="Depot Name" defaultValue="Gandhinagar Depot GJ-4" />
            <Input label="Currency" defaultValue="INR (Rs)" />
            <Input label="Distance Unit" defaultValue="Kilometers" />
            <Button icon={<Save className="h-4 w-4" />} onClick={() => toast.success("Depot settings saved locally")}>
              Save changes
            </Button>
          </div>
        </Panel>
        <Panel title="Role-Based Access (RBAC)">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ops-border text-[11px] uppercase tracking-wide text-ops-muted">
                  <th className="px-3 py-3">Module</th>
                  {roles.map((role) => (
                    <th key={role} className="px-3 py-3">
                      {roleLabels[role]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((module) => (
                  <tr key={module.key} className="border-b border-ops-border/70">
                    <td className="px-3 py-3 text-sm font-semibold text-ops-text">{module.label}</td>
                    {roles.map((role) => {
                      const access = permissionMatrix[module.key][role];
                      return (
                        <td key={role} className="px-3 py-3">
                          {access === "none" ? (
                            <span className="inline-flex items-center gap-1 text-xs text-ops-muted">
                              <X className="h-4 w-4 text-ops-muted" /> none
                            </span>
                          ) : access === "view" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-ops-blue">
                              <Check className="h-4 w-4" /> view
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-300">
                              <Check className="h-4 w-4" /> full
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
