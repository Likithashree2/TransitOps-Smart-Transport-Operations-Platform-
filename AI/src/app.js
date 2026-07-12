require('dotenv').config();
const express = require('express');
const aiRoutes = require('./routes/ai.routes');
const anomalyJob = require('./modules/ai/anomaly/anomaly.job');

const app = express();
app.use(express.json());

// Mount point: in the real TransitOps backend this module is required and
// mounted at the same base path as the rest of the API, e.g.:
//   app.use('/api/v1/ai', require('transitops-ai-layer/src/routes/ai.routes'));
app.use('/api/v1/ai', aiRoutes);

app.get('/healthz', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4001;

if (require.main === module) {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[ai-layer] listening on :${PORT}`);
  });

  // Scheduled fuel-anomaly scan (cross-cutting requirement: runs both
  // on-demand via the endpoint AND as a background job).
  anomalyJob.start();

  // Maintenance risk is recalculated event-driven (see risk.job.js,
  // scheduleMaintenanceRiskRecalc), not on a fixed timer — but we also run
  // one pass at boot so ai_insights isn't empty on a fresh demo DB.
  require('./modules/ai/risk/risk.job').runOnce().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[ai-layer] initial maintenance-risk pass failed:', err);
  });
}

module.exports = app;
