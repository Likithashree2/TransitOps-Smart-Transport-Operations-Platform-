import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/formatters";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
  loading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: "border-ops-amber bg-ops-amber text-white hover:bg-ops-amber2",
  secondary: "border-ops-border bg-ops-surface2 text-ops-text hover:border-ops-amber/70",
  ghost: "border-transparent bg-transparent text-ops-muted hover:bg-ops-surface2 hover:text-ops-text",
  danger: "border-red-500/40 bg-red-500/12 text-red-200 hover:bg-red-500/20"
};

export function Button({ className, variant = "primary", icon, loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45",
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
