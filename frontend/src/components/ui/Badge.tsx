import type { ReactNode } from "react";
import { cn } from "../../lib/formatters";

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span className={cn("inline-flex min-w-20 items-center justify-center rounded px-2 py-1 text-xs font-semibold", className)}>
      {children}
    </span>
  );
}
