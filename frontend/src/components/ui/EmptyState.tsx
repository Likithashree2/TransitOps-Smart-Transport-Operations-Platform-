import { Inbox } from "lucide-react";

export function EmptyState({ label = "No records found" }: { label?: string }) {
  return (
    <div className="grid min-h-32 place-items-center border-t border-ops-border text-sm text-ops-muted">
      <span className="inline-flex items-center gap-2">
        <Inbox className="h-4 w-4" />
        {label}
      </span>
    </div>
  );
}
