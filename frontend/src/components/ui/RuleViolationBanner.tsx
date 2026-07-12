import { AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RuleViolationBannerProps {
  show: boolean;
  title?: string;
  message: string;
}

export function RuleViolationBanner({ show, title = "RULE VIOLATION", message }: RuleViolationBannerProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="rounded-md border border-red-400/70 bg-red-500/10 px-3 py-3 text-red-200"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wide">{title}</div>
              <div className="mt-1 text-sm">{message}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
