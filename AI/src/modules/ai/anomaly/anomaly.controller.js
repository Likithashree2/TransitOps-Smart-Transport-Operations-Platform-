const { detectAndPersistFuelAnomalies } = require('./anomaly.service');
const prisma = require('../../../config/db');

/**
 * On-demand trigger. Note per the cross-cutting requirements: the frontend
 * should normally just READ from ai_insights (already populated by the
 * scheduled job in anomaly.job.js). This endpoint re-runs detection
 * synchronously and returns the freshly flagged rows, for demo/debug use
 * and for the "run it right now" hackathon-judge moment.
 */
async function getFuelAnomalies(req, res) {
  try {
    const { flaggedCount, flagged } = await detectAndPersistFuelAnomalies();
    return res.status(200).json({
      flagged_count: flaggedCount,
      anomalies: flagged.map((f) => ({
        fuel_log_id: f.fuel_log_id,
        vehicle_id: f.vehicle_id,
        score: Number(f.score.toFixed(3)),
        liters: f.liters,
        liters_per_km: Number(f.liters_per_km.toFixed(3)),
        cost_per_liter: Number(f.cost_per_liter.toFixed(2)),
        reason: f.reason,
      })),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[anomaly] detection failed:', err);
    return res.status(500).json({ error: 'Fuel anomaly detection failed.' });
  }
}

/** Read-only variant that just returns the latest persisted insights. */
async function getLatestFuelAnomalyInsights(req, res) {
  const insights = await prisma.ai_insight.findMany({
    where: { entity_type: 'fuel_log', insight_type: 'fuel_anomaly' },
    orderBy: { created_at: 'desc' },
    take: 100,
  });
  return res.status(200).json(insights);
}

module.exports = { getFuelAnomalies, getLatestFuelAnomalyInsights };
