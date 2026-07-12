import { AlertCircle } from "lucide-react";

export function ErrorState({ label = "Unable to load this section" }: { label?: string }) {
  return (
    <div className="rounded-md border border-red-400/50 bg-red-500/10 p-3 text-sm text-red-200">
      <span className="inline-flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        {label}
      </span>
    </div>
  );
}
