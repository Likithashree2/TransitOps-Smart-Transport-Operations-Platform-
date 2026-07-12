import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn, formatNumber } from "../../lib/formatters";

interface KPICardProps {
  label: string;
  value: number | string;
  suffix?: string;
  accent?: "blue" | "green" | "amber" | "red";
  icon?: ReactNode;
}

const accents = {
  blue: "border-l-ops-blue",
  green: "border-l-ops-green",
  amber: "border-l-ops-amber",
  red: "border-l-ops-red"
};

export function KPICard({ label, value, suffix, accent = "blue", icon }: KPICardProps) {
  const numericValue = typeof value === "number" ? value : undefined;
  const [displayValue, setDisplayValue] = useState(numericValue ?? value);

  useEffect(() => {
    if (numericValue === undefined) {
      setDisplayValue(value);
      return;
    }
    let frame = 0;
    const totalFrames = 24;
    const interval = window.setInterval(() => {
      frame += 1;
      setDisplayValue(Math.round((numericValue * frame) / totalFrames));
      if (frame >= totalFrames) window.clearInterval(interval);
    }, 18);
    return () => window.clearInterval(interval);
  }, [numericValue, value]);

  return (
    <motion.div
      className={cn("min-h-[86px] border border-l-4 border-ops-border bg-ops-surface px-4 py-3", accents[accent])}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ops-muted">{label}</p>
        <span className="text-ops-muted">{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-bold text-ops-text">
        {typeof displayValue === "number" ? formatNumber(displayValue) : displayValue}
        {suffix}
      </div>
    </motion.div>
  );
}
