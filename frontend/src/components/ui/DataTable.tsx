import type { ReactNode } from "react";
import { cn } from "../../lib/formatters";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  getRowKey: (row: T) => string | number;
  dense?: boolean;
}

export function DataTable<T>({ columns, data, getRowKey, dense }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto border-t border-ops-border">
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead>
          <tr className="border-b border-ops-border text-[11px] uppercase tracking-wide text-ops-muted">
            {columns.map((column) => (
              <th key={column.key} className={cn("px-3 py-3 font-semibold", column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={getRowKey(row)} className="border-b border-ops-border/65 transition hover:bg-white/[0.025]">
              {columns.map((column) => (
                <td key={column.key} className={cn(dense ? "px-3 py-2" : "px-3 py-3", "text-sm text-ops-text", column.className)}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
