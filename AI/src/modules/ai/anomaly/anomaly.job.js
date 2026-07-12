const cron = require('node-cron');
const { detectAndPersistFuelAnomalies } = require('./anomaly.service');

const INTERVAL_SEC = parseInt(process.env.FUEL_ANOMALY_JOB_INTERVAL_SEC || '45', 10);

let running = false;

async function runOnce() {
  if (running) return; // avoid overlapping runs if a scan takes longer than the interval
  running = true;
  try {
    const { flaggedCount } = await detectAndPersistFuelAnomalies();
    if (flaggedCount > 0) {
      // eslint-disable-next-line no-console
      console.log(`[anomaly.job] flagged ${flaggedCount} fuel log(s)`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[anomaly.job] run failed:', err);
  } finally {
    running = false;
  }
}

/** Registers a cron task; call once at server boot. Runs every INTERVAL_SEC seconds. */
function start() {
  // node-cron's minimum granularity is 1 minute for standard 5-field cron,
  // so for sub-minute intervals (default 45s) we use a plain setInterval
  // instead and keep node-cron available for anyone who wants a stricter
  // cron-style schedule (e.g. every minute: '*/1 * * * *').
  if (INTERVAL_SEC >= 60) {
    const everyNMinutes = Math.round(INTERVAL_SEC / 60);
    cron.schedule(`*/${everyNMinutes} * * * *`, runOnce);
  } else {
    setInterval(runOnce, INTERVAL_SEC * 1000);
  }
  // eslint-disable-next-line no-console
  console.log(`[anomaly.job] scheduled every ${INTERVAL_SEC}s`);
}

module.exports = { start, runOnce };
