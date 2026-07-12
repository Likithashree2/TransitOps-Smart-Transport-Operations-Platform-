import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/formatters";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, ...props }, ref) => (
  <label className="block space-y-1">
    {label && <span className="text-[11px] font-semibold uppercase tracking-wide text-ops-muted">{label}</span>}
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-md border border-ops-border bg-[#0D1117] px-3 text-sm text-ops-text outline-none transition placeholder:text-ops-muted/60 focus:border-ops-blue",
        error && "border-red-400/70",
        className
      )}
      {...props}
    />
    {error && <span className="text-xs text-red-300">{error}</span>}
  </label>
));

Input.displayName = "Input";
