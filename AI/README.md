# TransitOps — AI/ML Layer

Standalone AI module for TransitOps. Assumes the core backend (Express + Prisma
+ PostgreSQL) already exists with `vehicles`, `drivers`, `trips`,
`maintenance_logs`, `fuel_logs`, `expenses`, `ai_insights` tables/models. This
module reuses that same database via the same Prisma client and adds three
features, each behind its own route.

## Features

| Endpoint | What it does | Real ML? |
|---|---|---|
| `POST /api/v1/ai/copilot/dispatch` | Parses a natural-language dispatch request via LLM tool-calling into a proposed (never auto-created) trip | LLM (OpenAI), not a trained model — "AI" but not "ML" |
| `GET /api/v1/ai/insights/fuel-anomalies` | Flags statistically abnormal fuel-log entries per vehicle | **Yes** — Isolation Forest (hand-rolled, see below) |
| `GET /api/v1/ai/insights/maintenance-risk` | Scores each vehicle's breakdown risk 0-100 | **Yes** — Random Forest Regression, trained on synthetic weak labels |

Everything else in the wider hackathon blueprint (ROI, fuel efficiency) is
**formula-driven, not ML** — intentionally, per the task spec — and is out of
scope for this module.

## Why these runtime choices

- **No Python microservice.** The whole stack is Node/Express, dataset sizes
  per vehicle are small (tens–low hundreds of rows in a demo/early-production
  context), and the feature sets are tiny (3–4 numeric features). A
  subprocess-per-request or standalone Python service would add a second
  runtime, deploy target, and IPC/queueing layer for a workload that a plain
  JS implementation handles in single-digit milliseconds. Isolation Forest is
  hand-rolled (see `isolationForest.js`) since it's algorithmically simple
  (random partitioning trees) and this avoids depending on a less-maintained
  npm port. Random Forest uses `ml-random-forest` (part of the mature `ml.js`
  ecosystem) rather than being hand-rolled, since regression-tree ensembles
  are more fiddly to get numerically right and a real library exists.
- **Both anomaly detection and risk scoring live in the same Node process**,
  reusing one runtime/service, per the "minimize infra" guidance.
- **The LLM copilot only ever proposes.** It calls `search_available_vehicles`,
  `search_available_drivers`, `validate_trip` — read-only / validation tools —
  and is constrained (system prompt + response contract) to only reference
  IDs that came back from those tool calls in the same conversation. The
  real `POST /trips` still goes through the existing rules engine for
  independent revalidation before anything is actually created.

## Honest limitations (read this before demoing it as "production AI")

- **Fuel anomaly detection (Isolation Forest):** scored per-vehicle on
  whatever fuel-log history exists for that vehicle. With small samples
  (a few dozen logs, typical for a hackathon/early-stage fleet), isolation
  forest scores are noisier than what you'd get from scikit-learn's more
  mature splitting/subsampling heuristics on larger data. Vehicles with
  fewer than 5 fuel logs are skipped entirely rather than scored unreliably.
  Good for **anomaly triage** (surface it to a human), not for automated
  action (e.g. auto-blocking a driver).
- **Maintenance risk score (Random Forest):** trained on **synthetic weak
  labels** (`high risk if days_since_last_service > 180 OR estimated
  km-since-service > 15,000`, scaled to 0–100 with noise), because no real
  failure-history data exists yet. This means the model is currently
  learning to approximate a rule, with a Random Forest's non-linear/
  interaction-aware smoothing on top — it is **not** predicting real-world
  breakdowns from observed outcomes. The architecture (feature pipeline,
  training loop, persistence into `ai_insights`) is built to be
  production-ready: swap `syntheticLabel()` for real failure-event labels
  once they exist, and the rest of the pipeline is unchanged.
- Neither model is used to gate or block any real mutating action (dispatch,
  maintenance close, etc.) — they only ever write advisory rows into
  `ai_insights` for the frontend to display.

## Folder structure

```
transitops-ai-layer/
├── package.json
├── .env.example
├── README.md
├── src/
│   ├── app.js                          # standalone entrypoint / mount point
│   ├── config/
│   │   ├── db.js                       # shared Prisma client
│   │   └── openai.js
│   ├── routes/
│   │   └── ai.routes.js
│   └── modules/ai/
│       ├── copilot/
│       │   ├── copilot.tools.js        # tool schemas + DB-backed executors
│       │   ├── copilot.service.js      # tool-calling loop
│       │   └── copilot.controller.js
│       ├── anomaly/
│       │   ├── isolationForest.js      # hand-rolled Isolation Forest
│       │   ├── anomaly.service.js      # features, scoring, persistence
│       │   ├── anomaly.controller.js
│       │   └── anomaly.job.js          # scheduled scan (30-60s)
│       └── risk/
│           ├── risk.service.js         # features, synthetic labels, RF, persistence
│           ├── risk.controller.js
│           └── risk.job.js             # async, event-driven recalculation
└── scripts/
    └── seed-simulation.js              # injects demo-obvious anomalies/risk
```

## Setup

```bash
cp .env.example .env    # fill in OPENAI_API_KEY and DATABASE_URL
npm install
npm run seed:simulate   # optional: injects obvious anomalies for a demo
npm start                # standalone mode on PORT (default 4001)
```

To integrate into the existing core backend instead of running standalone,
just mount the router:

```js
app.use('/api/v1/ai', require('transitops-ai-layer/src/routes/ai.routes'));
```

and call `require('.../modules/ai/risk/risk.job').scheduleMaintenanceRiskRecalc()`
from the rules engine right after a trip completes or a maintenance record
closes (fire-and-forget, never awaited in the request path).

## Env vars

| Var | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | same DB as the core backend |
| `OPENAI_API_KEY` | yes, for the copilot | |
| `OPENAI_MODEL` | no | default `gpt-4o-mini` |
| `FUEL_ANOMALY_CONTAMINATION` | no | default `0.05` |
| `FUEL_ANOMALY_TREES` | no | default `100` |
| `FUEL_ANOMALY_SUBSAMPLE` | no | default `64` |
| `FUEL_ANOMALY_JOB_INTERVAL_SEC` | no | default `45` |
| `MAINT_RISK_TREES` | no | default `80` |
| `PORT` | no | default `4001` |

## Usage — curl examples

### 1. AI Dispatch Copilot

```bash
curl -X POST http://localhost:4001/api/v1/ai/copilot/dispatch \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Send the nearest available van to Ahmedabad Hub with 400kg"}'
```

Success:
```json
{
  "match": true,
  "proposed_trip": {
    "vehicle_id": 5,
    "driver_id": 2,
    "source": null,
    "destination": "Ahmedabad Hub",
    "cargo_weight_kg": 400
  },
  "explanation": "VAN-05 is Available with 500kg capacity, sufficient for the 400kg cargo; driver 2 has the highest safety score among available drivers.",
  "note": "This is a human-reviewable suggestion only. POST /trips still re-validates everything via the rules engine before any trip is created."
}
```

No match:
```json
{ "match": false, "proposed_trip": null, "explanation": "No Available vehicle has capacity >= 5000kg." }
```

### 2. Fuel Anomaly Detection

```bash
# Recompute now and return freshly flagged rows
curl http://localhost:4001/api/v1/ai/insights/fuel-anomalies

# Just read the latest persisted insights (what the frontend should normally call)
curl http://localhost:4001/api/v1/ai/insights/fuel-anomalies/latest
```

### 3. Maintenance Risk Score

```bash
# Recompute now and return scores
curl http://localhost:4001/api/v1/ai/insights/maintenance-risk

# Just read the latest persisted insights
curl http://localhost:4001/api/v1/ai/insights/maintenance-risk/latest
```

## Cross-cutting notes

- All AI computation runs async/background relative to mutating endpoints —
  never inline in a request/response cycle. The `/latest` read endpoints are
  how the frontend should normally consume insights; the non-`/latest`
  endpoints recompute synchronously and are meant for demos/debugging.
- Fuel anomaly detection runs both on-demand (the endpoint) and on a
  scheduled interval (`anomaly.job.js`, default 45s).
- Maintenance risk recalculates asynchronously, triggered by trip-completion
  and maintenance-close events (`risk.job.js`), debounced so a burst of
  events doesn't trigger a training run per event.
