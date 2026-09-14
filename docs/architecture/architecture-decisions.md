# Architecture Decisions: AI Purchasing Agent

Source inputs: PRD and engineering specs under `docs/`.

## ADR-001: Use a Modular Monolith for the MVP

- **Decision:** Implement the system as a local full-stack modular monolith with internal service boundaries.
- **Alternatives considered:** Microservices, serverless functions, separate frontend/backend repos.
- **Why selected:** The assignment scope is 6-8 hours, uses mock data, and values core workflow quality over infrastructure.
- **Trade-offs:** Less representative of production distributed procurement systems, but much faster and easier to run.
- **Consequences:** Internal boundaries must remain clean so future real integrations can replace mock services.

## ADR-002: Use Mock Repository as the System of Record

- **Decision:** Use an in-memory or file-backed mock repository for demo data and mutable state.
- **Alternatives considered:** SQLite, Postgres, external database.
- **Why selected:** Real persistence is not required, and deterministic fixtures are more important than database realism.
- **Trade-offs:** In-memory state can reset on reload; file-backed state adds some complexity.
- **Consequences:** Evaluation runner needs a reset function for repeatability.

## ADR-003: Make Deterministic Rules Authoritative

- **Decision:** Rule engine and validation service decide whether actions are valid; LLM output cannot override them.
- **Alternatives considered:** Let LLM reason and decide all outcomes; use pure rules with no LLM.
- **Why selected:** The assignment explicitly requires reliable constraint handling and validation. LLM-only decisions would be unsafe and hard to test.
- **Trade-offs:** Less flexible natural reasoning, but far more testable and trustworthy.
- **Consequences:** Business rules must be implemented as readable, unit-tested functions.

## ADR-004: Keep LLM Optional and Explanation-Only

- **Decision:** Use optional LLM only to synthesize explanations from structured facts, with template fallback.
- **Alternatives considered:** Require an LLM provider; avoid LLM entirely.
- **Why selected:** Optional LLM supports the AI-agent framing while keeping the demo runnable without secrets and stable in tests.
- **Trade-offs:** The "agent" may appear more rule-driven, but the workflow remains AI-assisted if LLM is configured.
- **Consequences:** `.env.example` must document optional credentials, and tests must not depend on LLM prose.

## ADR-005: Use Synchronous Request Flows

- **Decision:** Run recommendation review, action execution, and validation synchronously for MVP.
- **Alternatives considered:** Background jobs, queues, event bus.
- **Why selected:** Local demo flows are small and should complete within 10 seconds.
- **Trade-offs:** Not representative of long-running production procurement workflows.
- **Consequences:** Future real integrations may introduce async events, but MVP does not need them.

## ADR-006: Require Post-Action Validation for Every Action

- **Decision:** Action service must invoke validation after every executed action.
- **Alternatives considered:** Validate only before action; validate only selected high-risk actions.
- **Why selected:** The assignment emphasizes validating the result and handling mismatches.
- **Trade-offs:** Slightly more code and UI states.
- **Consequences:** Action result cannot be considered complete until validation status is known.

## ADR-007: Use Audit Events as the Primary Observability Surface

- **Decision:** Store ordered audit events for each agent run.
- **Alternatives considered:** Console logs only; production tracing stack.
- **Why selected:** Evaluators need to inspect decision behavior, and production observability is out of scope.
- **Trade-offs:** Audit events are less powerful than distributed tracing, but sufficient for a local demo.
- **Consequences:** Every major workflow step must append an audit event.

## ADR-008: Keep Single-Node MVP with `nodeId` in Schemas

- **Decision:** Implement one fulfillment node initially while retaining `nodeId` on all relevant entities.
- **Alternatives considered:** Full multi-node optimization; omit node fields.
- **Why selected:** Multi-node logic is unnecessary for Scenario 1, but retaining `nodeId` prevents avoidable refactors.
- **Trade-offs:** Some fields look more general than the MVP uses.
- **Consequences:** Tests should still include `nodeId` in fixtures.

## ADR-009: Use API Idempotency for Agent Runs and Actions

- **Decision:** `POST /api/agent-runs` and action execution accept `idempotencyKey`.
- **Alternatives considered:** Ignore retries; rely on browser disabling buttons.
- **Why selected:** Duplicate PO creation is a core risk, and idempotency is a simple control.
- **Trade-offs:** Requires storing idempotency keys and conflict behavior.
- **Consequences:** Action service must detect repeated keys and return original results.

## ADR-010: Evaluate Structured Outputs, Not Prose

- **Decision:** Evaluation runner asserts decision enums, validation status, action status, and check outcomes.
- **Alternatives considered:** Human-only evaluation or matching explanation text.
- **Why selected:** LLM/template prose may vary, but structured outcomes must be stable.
- **Trade-offs:** Does not automatically judge explanation quality beyond required fields.
- **Consequences:** Explanation quality should be reviewed through fields and audit evidence.

