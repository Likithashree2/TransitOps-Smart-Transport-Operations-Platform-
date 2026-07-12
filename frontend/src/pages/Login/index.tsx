import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, CheckSquare, SquareActivity } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { roleLabels, firstRouteForRole } from "../../lib/permissions";
import { useAuthStore } from "../../store/auth-store";
import type { Role } from "../../types/domain";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(["fleet_manager", "dispatcher", "safety_officer", "financial_analyst"])
});

type LoginForm = z.infer<typeof loginSchema>;

const roleEmail: Record<Role, string> = {
  fleet_manager: "fleet@transitops.in",
  dispatcher: "dispatcher@transitops.in",
  safety_officer: "safety@transitops.in",
  financial_analyst: "finance@transitops.in"
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, login, failedAttempts } = useAuthStore();
  const [error, setError] = useState("");
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "dispatcher@transitops.in", password: "demo1234", role: "dispatcher" }
  });

  if (user) return <Navigate to={firstRouteForRole(user.role)} replace />;

  const selectedRole = form.watch("role");

  async function onSubmit(values: LoginForm) {
    setError("");
    try {
      await login(values.email, values.password, values.role);
      navigate(firstRouteForRole(values.role));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid credentials");
    }
  }

  return (
    <main className="grid min-h-screen bg-ops-bg text-ops-text lg:grid-cols-[42%_58%]">
      <section className="flex min-h-[48vh] flex-col border-r border-ops-border bg-[#CFD5DC] px-8 py-10 text-[#161B22] lg:min-h-screen lg:px-20">
        <div className="mt-8">
          <div className="grid h-14 w-14 place-items-center border border-ops-amber bg-ops-amber/20">
            <SquareActivity className="h-7 w-7 text-ops-amber" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight">TransitOps</h1>
          <p className="mt-1 text-sm text-slate-600">Smart Transport Operations Platform</p>
        </div>
        <div className="mt-24 space-y-3 text-sm">
          <p className="font-semibold">One login, four roles:</p>
          {Object.entries(roleLabels).map(([role, label]) => (
            <button
              key={role}
              className="flex items-center gap-2 text-left"
              onClick={() => {
                const typedRole = role as Role;
                form.setValue("role", typedRole);
                form.setValue("email", roleEmail[typedRole]);
              }}
            >
              <span className="h-2 w-2 rounded-full bg-ops-amber" />
              {label}
            </button>
          ))}
        </div>
        <p className="mt-auto text-xs font-semibold uppercase tracking-wide text-slate-400">TransitOps 2026 - RBAC enabled</p>
      </section>

      <section className="flex items-center justify-center px-6 py-10">
        <motion.div className="w-full max-w-[440px]" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-extrabold tracking-tight">Sign in to your account</h2>
          <p className="mt-1 text-sm text-ops-muted">Enter your credentials to continue</p>
          <form className="mt-8 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <Input label="Email" {...form.register("email")} error={form.formState.errors.email?.message} />
            <Input label="Password" type="password" {...form.register("password")} error={form.formState.errors.password?.message} />
            <Select
              label="Role (RBAC)"
              {...form.register("role")}
              onChange={(event) => {
                const role = event.target.value as Role;
                form.setValue("role", role);
                form.setValue("email", roleEmail[role]);
              }}
            >
              {Object.entries(roleLabels).map(([role, label]) => (
                <option key={role} value={role}>
                  {label}
                </option>
              ))}
            </Select>
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-ops-muted">
                <CheckSquare className="h-4 w-4 text-green-400" />
                Remember me
              </label>
              <button type="button" className="font-semibold text-ops-blue">
                Forgot password?
              </button>
            </div>
            {(error || failedAttempts > 0) && (
              <div className="rounded-md border border-red-400/70 bg-red-500/10 p-3 text-sm text-red-200">
                <div className="flex gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <div>
                    <p className="font-bold">Error state</p>
                    <p>Invalid credentials.</p>
                    <p>Account locked after 5 failed attempts.</p>
                  </div>
                </div>
              </div>
            )}
            <Button className="w-full" type="submit" loading={form.formState.isSubmitting}>
              Sign In
            </Button>
          </form>
          <div className="mt-6 border-t border-ops-border pt-4 text-xs leading-5 text-ops-muted">
            <p>Access is scoped by role after login:</p>
            <p>Fleet Manager → Fleet, Maintenance</p>
            <p>Dispatcher → Dashboard, Trips</p>
            <p>Safety Officer → Drivers, Compliance</p>
            <p>Financial Analyst → Fuel & Expenses, Analytics</p>
            <p className="mt-2 text-ops-amber2">Selected: {roleLabels[selectedRole]}</p>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
