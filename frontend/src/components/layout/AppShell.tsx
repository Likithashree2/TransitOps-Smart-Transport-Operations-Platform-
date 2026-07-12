import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell() {
  return (
    <div className="min-h-screen bg-ops-bg text-ops-text md:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Topbar />
        <motion.main className="mx-auto max-w-[1560px] px-4 py-4 md:px-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
