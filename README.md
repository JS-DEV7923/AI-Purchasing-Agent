# AI Purchasing Agent

Local full-stack demo for an auditable purchasing recommendation agent. It reviews seeded replenishment recommendations, gathers mock operational context, applies deterministic purchasing constraints, proposes a decision, executes an approved mock action, validates the resulting state, and exposes the full audit trail.

## Run Locally

Requirements: Node.js 20 or newer.

```bash
npm test
npm run evaluate
npm start
```

Open `http://localhost:3000` after starting the app.

No package install is required because the project uses Node's built-in HTTP server and test runner. If `npm` is not available in your shell, use the equivalent direct commands:

```bash
node --test
node scripts/run-evaluation.js
node src/server.js
```

## What Is Implemented

- Full-stack local app with static UI and JSON API.
- Typed-ish domain validation at API boundaries.
- In-memory mock repository with deterministic seed/reset behavior.
- Purchasing rule engine for demand coverage, safety stock, MOQ, supplier availability, budget, storage, and overstock.
- Decision engine returning `accept`, `modify`, `reject`, or `investigate_further`.
- Template explanation fallback; no LLM or secret is required.
- Action service for PO creation, rejection, and escalation.
- Post-action validation loop with recovery state for mismatched or partial actions.
- Ordered audit events for inputs, tool calls, rule checks, decisions, actions, validation, and recovery.
- Evaluation runner covering accept, modify down, modify up, hard constraint rejection, missing data, and action failure recovery.

## API

- `GET /api/health`
- `GET /api/recommendations`
- `GET /api/recommendations/{recommendationId}`
- `POST /api/agent-runs`
- `GET /api/agent-runs/{runId}`
- `POST /api/agent-runs/{runId}/actions`
- `POST /api/evaluations/run`

Example:

```bash
curl -X POST http://localhost:3000/api/agent-runs \
  -H 'content-type: application/json' \
  -d '{"recommendationId":"rec_accept","mode":"review_only","idempotencyKey":"demo-1"}'
```

## Evaluation Scenarios

`npm run evaluate` executes the same service paths used by the UI:

- `accept_recommendation`: accepts 800 units and validates the created PO.
- `modify_down`: modifies 800 units down because inventory and open POs reduce the needed buy.
- `modify_up`: increases the buy because demand is higher.
- `reject_hard_constraint`: rejects when budget/storage constraints make a valid buy impossible.
- `missing_data`: investigates further when forecast and supplier data are missing.
- `action_failure_recovery`: detects a partial PO creation mismatch and marks recovery required.

## Architecture Notes

The implementation follows the approved docs under `docs/`:

- Modular monolith with `src/domain`, `src/repository`, `src/services`, `src/http`, and `public`.
- Deterministic services are authoritative; explanation text cannot change decisions or validation.
- Mutable state is in memory and reset by the evaluation runner.
- `idempotencyKey` is supported for agent review and action execution.

## Deploy on Vercel

This project is configured for Vercel as a plain Node.js HTTP server:

- `src/server.js` is the server entrypoint Vercel captures.
- `vercel.json` selects the "Other" framework preset and includes `public/**` in the function bundle.
- No build step is required.

Recommended Vercel project settings:

- Framework Preset: Other
- Build Command: leave empty
- Output Directory: leave empty
- Install Command: default is fine

## Configuration

No production environment variables are required for the current implementation.

Vercel manages the runtime port automatically. Locally, `PORT` is optional and defaults to `3000`:

```bash
PORT=4000 npm start
```

## Known Limitations

- No real ERP, WMS, supplier, budget, forecast, or approval workflow integrations.
- State is process-local and resets on restart.
- Authentication is intentionally omitted for the local assignment MVP.
- The explanation adapter is deterministic template text rather than an external LLM.
