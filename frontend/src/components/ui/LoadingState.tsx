import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading operational data" }: { label?: string }) {
  return (
    <div className="grid min-h-40 place-items-center text-ops-muted">
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}
