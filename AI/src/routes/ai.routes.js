const express = require('express');
const { dispatchCopilot } = require('../modules/ai/copilot/copilot.controller');
const { getFuelAnomalies, getLatestFuelAnomalyInsights } = require('../modules/ai/anomaly/anomaly.controller');
const { getMaintenanceRisk, getLatestMaintenanceRiskInsights } = require('../modules/ai/risk/risk.controller');

const router = express.Router();

// 1. AI Dispatch Copilot
router.post('/copilot/dispatch', dispatchCopilot);

// 2. Fuel Anomaly Detection
router.get('/insights/fuel-anomalies', getFuelAnomalies); // recompute + return
router.get('/insights/fuel-anomalies/latest', getLatestFuelAnomalyInsights); // pure read from ai_insights

// 3. Maintenance Risk Score
router.get('/insights/maintenance-risk', getMaintenanceRisk); // recompute + return
router.get('/insights/maintenance-risk/latest', getLatestMaintenanceRiskInsights); // pure read from ai_insights

module.exports = router;
