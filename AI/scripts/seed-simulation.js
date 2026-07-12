/**
 * Injects a handful of obviously-anomalous data points so both AI models
 * have something concrete to catch during a demo:
 *   - 3x-normal-liters fuel logs for a couple of existing vehicles
 *   - a couple of vehicles with very high odometer + no recent service
 *
 * Assumes the core backend has already run its own seed (vehicles, drivers,
 * trips must already exist). This script only ADDS demo-anomaly rows; it
 * does not touch the core schema or existing rows beyond the two vehicles
 * it nudges into an obviously-high-risk state.
 *
 * Usage: npm run seed:simulate
 */
require('dotenv').config();
const prisma = require('../src/config/db');

async function main() {
  const vehicles = await prisma.vehicle.findMany({ take: 6, orderBy: { vehicle_id: 'asc' } });
  if (vehicles.length < 2) {
    console.error('Need at least 2 vehicles already seeded by the core backend. Aborting.');
    process.exit(1);
  }

  // ---- Fuel anomaly demo data --------------------------------------
  // Pick the first vehicle with existing fuel history to compute a realistic
  // "normal" liters baseline; fall back to a flat default if none exists.
  const anomalyTargets = vehicles.slice(0, 2);

  for (const v of anomalyTargets) {
    const history = await prisma.fuel_log.findMany({
      where: { vehicle_id: v.vehicle_id },
      orderBy: { log_date: 'desc' },
      take: 10,
    });

    const normalLiters =
      history.length > 0
        ? history.reduce((sum, l) => sum + Number(l.liters), 0) / history.length
        : 40; // reasonable default for a van-class vehicle

    const anomalousLiters = Math.round(normalLiters * 3 * 10) / 10;
    const plausibleCostPerLiter = 95; // INR/liter ballpark, keep cost_per_liter itself unremarkable

    // Ensure there's enough history for the Isolation Forest to have a
    // baseline to compare against (min 5 rows required by anomaly.service).
    const need = Math.max(0, 5 - history.length);
    for (let i = 0; i < need; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await prisma.fuel_log.create({
        data: {
          vehicle_id: v.vehicle_id,
          liters: Math.round((normalLiters + (Math.random() - 0.5) * 4) * 10) / 10,
          cost: Math.round(normalLiters * plausibleCostPerLiter),
          log_date: new Date(Date.now() - (i + 2) * 7 * 86400000),
        },
      });
    }

    await prisma.fuel_log.create({
      data: {
        vehicle_id: v.vehicle_id,
        liters: anomalousLiters,
        cost: Math.round(anomalousLiters * plausibleCostPerLiter),
        log_date: new Date(),
      },
    });

    console.log(
      `[seed] injected anomalous fuel log for vehicle ${v.vehicle_id}: ${anomalousLiters}L (baseline ~${normalLiters.toFixed(1)}L)`
    );
  }

  // ---- Maintenance risk demo data ------------------------------------
  const riskTargets = vehicles.slice(2, 4).length >= 2 ? vehicles.slice(2, 4) : vehicles.slice(0, 2);

  for (const v of riskTargets) {
    await prisma.vehicle.update({
      where: { vehicle_id: v.vehicle_id },
      data: { odometer_km: Number(v.odometer_km) + 20000 }, // push well past the 15,000km-since-service signal
    });

    // Backdate (or create) a "last service" record beyond the 180-day threshold.
    const oldServiceDate = new Date(Date.now() - 220 * 86400000);
    await prisma.maintenance_log.create({
      data: {
        vehicle_id: v.vehicle_id,
        service_type: 'Oil Change',
        cost: 2500,
        service_date: oldServiceDate,
        status: 'Completed',
        notes: 'Seeded demo record: intentionally stale to trigger high maintenance risk.',
      },
    });

    console.log(`[seed] pushed vehicle ${v.vehicle_id} into high-risk territory (odometer +20,000km, last service 220 days ago)`);
  }

  console.log('[seed] done. Run GET /api/v1/ai/insights/fuel-anomalies and /maintenance-risk to see them caught.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
