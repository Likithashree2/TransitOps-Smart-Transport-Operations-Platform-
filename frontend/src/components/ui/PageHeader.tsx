import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, eyebrow, actions }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 border-b border-ops-border pb-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-wide text-ops-amber2">{eyebrow}</p>}
        <h1 className="mt-1 text-xl font-extrabold tracking-tight text-ops-text">{title}</h1>
      </div>
      {actions}
    </div>
  );
}
