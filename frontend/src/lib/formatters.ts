import type { Driver, Vehicle } from "../types/domain";

export const cn = (...classes: Array<string | false | undefined | null>) => classes.filter(Boolean).join(" ");

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);

export const formatNumber = (value: number) => new Intl.NumberFormat("en-IN").format(Math.round(value));

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));

export const vehicleLabel = (vehicle?: Vehicle) =>
  vehicle ? `${vehicle.registrationNo} / ${vehicle.nameModel}` : "Unassigned";

export const driverLabel = (driver?: Driver) => (driver ? driver.fullName : "Awaiting driver");

export const daysUntil = (isoDate: string) => {
  const today = new Date("2026-07-12T00:00:00+05:30");
  const target = new Date(`${isoDate}T00:00:00+05:30`);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
};
