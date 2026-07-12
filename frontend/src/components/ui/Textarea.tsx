import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/formatters";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, className, ...props }, ref) => (
  <label className="block space-y-1">
    {label && <span className="text-[11px] font-semibold uppercase tracking-wide text-ops-muted">{label}</span>}
    <textarea
      ref={ref}
      className={cn(
        "min-h-20 w-full resize-none rounded-md border border-ops-border bg-[#0D1117] px-3 py-2 text-sm text-ops-text outline-none transition placeholder:text-ops-muted/60 focus:border-ops-blue",
        error && "border-red-400/70",
        className
      )}
      {...props}
    />
    {error && <span className="text-xs text-red-300">{error}</span>}
  </label>
));

Textarea.displayName = "Textarea";
