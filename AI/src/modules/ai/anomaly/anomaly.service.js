const prisma = require('../../../config/db');
const { IsolationForest, thresholdForContamination } = require('./isolationForest');

const CONTAMINATION = parseFloat(process.env.FUEL_ANOMALY_CONTAMINATION || '0.05');
const N_TREES = parseInt(process.env.FUEL_ANOMALY_TREES || '100', 10);
const SUBSAMPLE = parseInt(process.env.FUEL_ANOMALY_SUBSAMPLE || '64', 10);
const MIN_LOGS_PER_VEHICLE = 5; // below this, scoring is too noisy to be meaningful

/**
 * Builds [liters, liters_per_km, cost_per_liter] for every fuel_log row of
 * a vehicle, using each log's own trip's planned_distance_km (or, if no
 * trip is linked, the vehicle's odometer delta since the previous fuel log)
 * as the distance denominator.
 */
async function buildFeaturesForVehicle(vehicleId) {
  const logs = await prisma.fuel_log.findMany({
    where: { vehicle_id: vehicleId },
    include: { trip: true },
    orderBy: { log_date: 'asc' },
  });

  const rows = [];
  let lastOdometer = null;

  for (const log of logs) {
    const liters = Number(log.liters);
    const cost = Number(log.cost);
    const costPerLiter = liters > 0 ? cost / liters : 0;

    let distanceKm = null;
    if (log.trip && log.trip.planned_distance_km) {
      distanceKm = Number(log.trip.planned_distance_km);
    } else if (log.trip && log.trip.final_odometer_km && lastOdometer !== null) {
      distanceKm = Number(log.trip.final_odometer_km) - lastOdometer;
    }
    if (log.trip && log.trip.final_odometer_km) {
      lastOdometer = Number(log.trip.final_odometer_km);
    }

    // If we truly can't derive a distance, fall back to a neutral 1 so the
    // ratio degrades to "liters" rather than exploding/NaN.
    const litersPerKm = distanceKm && distanceKm > 0 ? liters / distanceKm : liters;

    rows.push({
      fuel_log_id: log.fuel_log_id,
      features: [liters, litersPerKm, costPerLiter],
      raw: { liters, liters_per_km: litersPerKm, cost_per_liter: costPerLiter },
    });
  }

  return rows;
}

/**
 * Scores all fuel logs, grouped per vehicle (never compared across vehicles
 * / fleets, per spec), flags entries above the contamination threshold, and
 * returns the flagged set (does not persist — caller decides).
 */
async function detectFuelAnomalies() {
  const vehicles = await prisma.vehicle.findMany({ select: { vehicle_id: true } });
  const flagged = [];

  for (const { vehicle_id: vehicleId } of vehicles) {
    // eslint-disable-next-line no-await-in-loop
    const rows = await buildFeaturesForVehicle(vehicleId);
    if (rows.length < MIN_LOGS_PER_VEHICLE) {
      // Not enough history for this vehicle to score meaningfully — skip.
      // eslint-disable-next-line no-continue
      continue;
    }

    const featureMatrix = rows.map((r) => r.features);
    const forest = new IsolationForest({ nTrees: N_TREES, subsampleSize: Math.min(SUBSAMPLE, rows.length) });
    forest.fit(featureMatrix);

    const scores = forest.scoreAll(featureMatrix);
    const threshold = thresholdForContamination(scores, CONTAMINATION);

    rows.forEach((row, i) => {
      if (scores[i] >= threshold && scores[i] > 0.5) {
        // 0.5 is the theoretical "no clear anomaly" midpoint for isolation
        // forest scores — used as a floor so a low-contamination fleet
        // with genuinely uniform behavior doesn't force-flag its least-
        // uniform-but-still-normal entry.
        flagged.push({
          vehicle_id: vehicleId,
          fuel_log_id: row.fuel_log_id,
          score: scores[i],
          ...row.raw,
          reason: buildReason(row.raw, featureMatrix, i),
        });
      }
    });
  }

  return flagged;
}

function buildReason(raw, featureMatrix, idx) {
  const litersCol = featureMatrix.map((r) => r[0]);
  const median = medianOf(litersCol);
  if (median > 0 && raw.liters > median * 1.8) {
    return `liters (${raw.liters.toFixed(1)}) is ~${(raw.liters / median).toFixed(1)}x this vehicle's median fuel-log volume (${median.toFixed(1)})`;
  }
  return 'statistically abnormal combination of liters / liters-per-km / cost-per-liter versus this vehicle\'s own history';
}

function medianOf(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Runs detection and persists flags into ai_insights (upsert-by-latest). */
async function detectAndPersistFuelAnomalies() {
  const flagged = await detectFuelAnomalies();

  await Promise.all(
    flagged.map((f) =>
      prisma.ai_insight.create({
        data: {
          entity_type: 'fuel_log',
          entity_id: f.fuel_log_id,
          insight_type: 'fuel_anomaly',
          score: f.score,
          payload: {
            vehicle_id: f.vehicle_id,
            liters: f.liters,
            liters_per_km: f.liters_per_km,
            cost_per_liter: f.cost_per_liter,
            reason: f.reason,
          },
        },
      })
    )
  );

  return { flaggedCount: flagged.length, flagged };
}

module.exports = { detectFuelAnomalies, detectAndPersistFuelAnomalies, CONTAMINATION };
