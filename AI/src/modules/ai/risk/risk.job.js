const { scoreAndPersistMaintenanceRisk } = require('./risk.service');

let queued = false;
let running = false;

/**
 * Call this from the core backend's rules-engine AFTER a trip is marked
 * Completed or a maintenance record is Closed — e.g.:
 *
 *   const { scheduleMaintenanceRiskRecalc } = require('.../modules/ai/risk/risk.job');
 *   await rulesEngine.transition(...);
 *   scheduleMaintenanceRiskRecalc(); // fire-and-forget, never awaited in the request path
 *
 * It debounces bursts of events (e.g. several trips completing back to
 * back) into a single recompute pass, and never runs inline with the
 * triggering request — it's scheduled on the next tick / short delay.
 */
function scheduleMaintenanceRiskRecalc({ delayMs = 2000 } = {}) {
  if (queued) return; // already have a pending run that will pick up latest state
  queued = true;
  setTimeout(async () => {
    queued = false;
    if (running) return; // a run is already in flight; the next event will re-queue
    running = true;
    try {
      const results = await scoreAndPersistMaintenanceRisk();
      // eslint-disable-next-line no-console
      console.log(`[risk.job] recalculated maintenance risk for ${results.length} vehicle(s)`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[risk.job] recalculation failed:', err);
    } finally {
      running = false;
    }
  }, delayMs);
}

/** For manual/cron invocation (npm run job:risk), bypasses debouncing. */
async function runOnce() {
  return scoreAndPersistMaintenanceRisk();
}

module.exports = { scheduleMaintenanceRiskRecalc, runOnce };
