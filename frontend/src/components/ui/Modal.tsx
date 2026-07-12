import type { ReactNode } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./Button";

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, open, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="w-full max-w-2xl rounded-md border border-ops-border bg-ops-surface shadow-glow"
            initial={{ scale: 0.97, y: 18 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: 18 }}
          >
            <div className="flex items-center justify-between border-b border-ops-border px-4 py-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-ops-text">{title}</h2>
              <Button variant="ghost" className="h-8 w-8 px-0" onClick={onClose} aria-label="Close modal" icon={<X className="h-4 w-4" />} />
            </div>
            <div className="p-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
