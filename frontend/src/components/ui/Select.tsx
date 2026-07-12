import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/formatters";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, className, children, ...props }, ref) => (
  <label className="block space-y-1">
    {label && <span className="text-[11px] font-semibold uppercase tracking-wide text-ops-muted">{label}</span>}
    <span className="relative block">
      <select
        ref={ref}
        className={cn(
          "h-9 w-full appearance-none rounded-md border border-ops-border bg-[#0D1117] px-3 pr-8 text-sm text-ops-text outline-none transition focus:border-ops-blue",
          error && "border-red-400/70",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-ops-muted" />
    </span>
    {error && <span className="text-xs text-red-300">{error}</span>}
  </label>
));

Select.displayName = "Select";
