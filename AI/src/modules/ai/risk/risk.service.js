const { RandomForestRegression: RFRegression } = require('ml-random-forest');
const prisma = require('../../../config/db');

const N_TREES = parseInt(process.env.MAINT_RISK_TREES || '80', 10);

/**
 * Real ML component: a Random Forest Regressor (ml-random-forest, a JS port
 * consistent with sklearn's RF) trained on SYNTHETIC weak labels, since no
 * real failure history exists yet (see README for the honest limitation).
 * Features: [odometer_km, days_since_last_service, avg_trip_distance_km, acquisition_cost]
 */
async function buildFeaturesForAllVehicles() {
  const vehicles = await prisma.vehicle.findMany();
  const results = [];

  for (const v of vehicles) {
    // eslint-disable-next-line no-await-in-loop
    const [lastService, trips] = await Promise.all([
      prisma.maintenance_log.findFirst({
        where: { vehicle_id: v.vehicle_id, status: 'Completed' },
        orderBy: { service_date: 'desc' },
      }),
      prisma.trip.findMany({
        where: { vehicle_id: v.vehicle_id, status: 'Completed' },
        select: { planned_distance_km: true },
      }),
    ]);

    const daysSinceLastService = lastService
      ? Math.floor((Date.now() - new Date(lastService.service_date).getTime()) / 86400000)
      : 365; // no completed service on record — treat conservatively as ~1yr

    const avgTripDistanceKm =
      trips.length > 0
        ? trips.reduce((sum, t) => sum + Number(t.planned_distance_km || 0), 0) / trips.length
        : 0;

    results.push({
      vehicle_id: v.vehicle_id,
      features: [
        Number(v.odometer_km),
        daysSinceLastService,
        avgTripDistanceKm,
        Number(v.acquisition_cost),
      ],
      // odometer_km here is lifetime odometer; we don't have a separate
      // "odometer at last service" field in the base schema, so we
      // approximate "km since last service" as a fraction of lifetime
      // odometer scaled by recency. Deployments with an odometer snapshot
      // on maintenance_logs should swap this for the exact delta.
      odometerSinceServiceEstimate: estimateKmSinceService(Number(v.odometer_km), daysSinceLastService),
    });
  }

  return results;
}

function estimateKmSinceService(odometerKm, daysSinceLastService) {
  // Rough proxy: assume ~120km/day average utilization when no better
  // signal exists, capped at total odometer. Documented as an estimate,
  // not a precise figure — see README limitations.
  return Math.min(odometerKm, daysSinceLastService * 120);
}

/** Generates a continuous synthetic weak label in [0,100] with noise. */
function syntheticLabel({ daysSinceLastService, odometerSinceServiceEstimate }) {
  const dayRisk = clamp01(daysSinceLastService / 180); // >180 days => saturates near/above 1
  const kmRisk = clamp01(odometerSinceServiceEstimate / 15000); // >15000km => saturates near/above 1
  const base = Math.max(dayRisk, kmRisk) * 100;
  const noise = (Math.random() - 0.5) * 12; // +/-6 points of noise so it isn't a visible hard cutoff
  return Math.min(100, Math.max(0, base + noise));
}

function clamp01(x) {
  return Math.max(0, Math.min(1.3, x)); // allow slight overshoot pre-scale for smoother saturation
}

async function trainAndScoreMaintenanceRisk() {
  const rows = await buildFeaturesForAllVehicles();

  if (rows.length < 5) {
    // Too few vehicles to train anything meaningful — fall back to the
    // transparent heuristic directly (labeled as such in the payload).
    return rows.map((r) => ({
      vehicle_id: r.vehicle_id,
      score: syntheticLabel({
        daysSinceLastService: r.features[1],
        odometerSinceServiceEstimate: r.odometerSinceServiceEstimate,
      }),
      method: 'heuristic_fallback_insufficient_data',
      features: r.features,
    }));
  }

  const X = rows.map((r) => r.features);
  const y = rows.map((r) =>
    syntheticLabel({
      daysSinceLastService: r.features[1],
      odometerSinceServiceEstimate: r.odometerSinceServiceEstimate,
    })
  );

  const rf = new RFRegression({
    nEstimators: N_TREES,
    treeOptions: { maxDepth: 8, minNumSamples: 3 },
    seed: 42,
  });
  rf.train(X, y);

  const predictions = rf.predict(X);

  return rows.map((r, i) => ({
    vehicle_id: r.vehicle_id,
    score: Math.min(100, Math.max(0, predictions[i])),
    method: 'random_forest_synthetic_labels',
    features: {
      odometer_km: r.features[0],
      days_since_last_service: r.features[1],
      avg_trip_distance_km: r.features[2],
      acquisition_cost: r.features[3],
    },
  }));
}

function contributingFactors(features, score) {
  const factors = [];
  if (features.days_since_last_service > 180) {
    factors.push(`${features.days_since_last_service} days since last service (>180 threshold)`);
  }
  if (features.odometer_km > 0) {
    factors.push(`odometer at ${Math.round(features.odometer_km).toLocaleString()} km`);
  }
  if (features.avg_trip_distance_km > 300) {
    factors.push(`high average trip distance (${Math.round(features.avg_trip_distance_km)} km/trip)`);
  }
  if (score >= 70) factors.push('overall risk in the high band (>=70)');
  else if (score >= 40) factors.push('overall risk in the medium band (40-69)');
  else factors.push('overall risk in the low band (<40)');
  return factors;
}

async function scoreAndPersistMaintenanceRisk() {
  const results = await trainAndScoreMaintenanceRisk();

  await Promise.all(
    results.map((r) =>
      prisma.ai_insight.create({
        data: {
          entity_type: 'vehicle',
          entity_id: r.vehicle_id,
          insight_type: 'maintenance_risk',
          score: r.score,
          payload: {
            method: r.method,
            contributing_factors: contributingFactors(r.features, r.score),
          },
        },
      })
    )
  );

  return results;
}

module.exports = { trainAndScoreMaintenanceRisk, scoreAndPersistMaintenanceRisk };
