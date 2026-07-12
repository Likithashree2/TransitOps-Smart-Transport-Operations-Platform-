import type { ReactNode } from "react";
import { cn } from "../../lib/formatters";

export function Panel({ children, className, title, action }: { children: ReactNode; className?: string; title?: string; action?: ReactNode }) {
  return (
    <section className={cn("border border-ops-border bg-ops-surface", className)}>
      {(title || action) && (
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-ops-border px-4 py-3">
          {title && <h2 className="text-xs font-bold uppercase tracking-wide text-ops-text">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
