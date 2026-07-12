const prisma = require('../../../config/db');
const { scoreAndPersistMaintenanceRisk } = require('./risk.service');

/**
 * On-demand recompute + return. Per cross-cutting requirements, in normal
 * operation this is computed asynchronously (risk.job.js, triggered after
 * trip-completion / maintenance-close events) and the frontend just reads
 * ai_insights. This endpoint exists for demo/debug and for judges who want
 * to see it run live.
 */
async function getMaintenanceRisk(req, res) {
  try {
    const results = await scoreAndPersistMaintenanceRisk();
    return res.status(200).json(
      results
        .sort((a, b) => b.score - a.score)
        .map((r) => ({
          vehicle_id: r.vehicle_id,
          score: Number(r.score.toFixed(1)),
          method: r.method,
        }))
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[risk] scoring failed:', err);
    return res.status(500).json({ error: 'Maintenance risk scoring failed.' });
  }
}

async function getLatestMaintenanceRiskInsights(req, res) {
  const insights = await prisma.ai_insight.findMany({
    where: { entity_type: 'vehicle', insight_type: 'maintenance_risk' },
    orderBy: { created_at: 'desc' },
    take: 200,
  });
  return res.status(200).json(insights);
}

module.exports = { getMaintenanceRisk, getLatestMaintenanceRiskInsights };
