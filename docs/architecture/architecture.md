# Technical Architecture: AI Purchasing Agent

Source inputs:

- `docs/AI_PURCHASING_AGENT_PRD.md`
- `docs/engineering/requirements.md`
- `docs/engineering/engineering-spec.md`
- `docs/engineering/acceptance-criteria.md`
- `docs/engineering/technical-constraints.md`
- `docs/engineering/integrations.md`
- `docs/engineering/security-requirements.md`
- `docs/engineering/observability-requirements.md`
- `docs/engineering/technical-risks.md`

## 1. Architecture Summary

The AI Purchasing Agent should be implemented as a local full-stack modular monolith with clear internal boundaries:

- Frontend UI for buyer/evaluator workflows.
- API layer for recommendations, agent runs, actions, and evaluations.
- Agent orchestration layer that coordinates context gathering, decisioning, action proposal, action execution, validation, and audit logging.
- Deterministic rule and validation core that is authoritative for all purchasing constraints.
- Mock repository that owns seed data, mutable demo state, agent runs, purchase orders, audit events, and evaluation results.
- Optional LLM explanation adapter that can improve human-readable reasoning but must never override deterministic checks.

This architecture intentionally avoids microservices, queues, production procurement integrations, and production identity. The assignment values end-to-end correctness, explainability, validation, and evaluation over infrastructure sophistication.

## 2. Goals

- Demonstrate Scenario 1 end-to-end: recommendation review, decision, action, and validation.
- Keep hard purchasing constraints deterministic, testable, and independent of LLM output.
- Make all agent behavior auditable through ordered run events.
- Support deterministic evaluation scenarios with stable expected outcomes.
- Keep the system locally runnable without real ERP, WMS, supplier, forecast, budget, or storage systems.
- Preserve clean interfaces for future replacement of mock services with real integrations.

## 3. Non-Goals

- Production deployment architecture.
- Real authentication, procurement, supplier, finance, WMS, or forecasting integrations.
- Event-driven distributed processing.
- Autonomous high-risk purchasing without human approval.
- Multi-node inventory optimization beyond retaining `nodeId` in schemas.

## 4. Major Assumptions

| ID | Assumption | Reason |
| --- | --- | --- |
| A-001 | MVP runs as a local modular monolith | Meets 6-8 hour scope and full-stack demo requirement |
| A-002 | Data is in-memory or file-backed mock data | Real integrations and production persistence are out of scope |
| A-003 | Deterministic rule engine is authoritative | Prevents unsafe or flaky LLM-driven purchasing decisions |
| A-004 | LLM is optional and used only for explanation synthesis | Keeps tests stable and demo runnable without secrets |
| A-005 | Buyer approval is represented as an API/UI flag, not a real workflow system | Approval workflow integration is out of scope |
| A-006 | Single-node MVP retains `nodeId` in every relevant entity | Avoids overbuilding while preserving future extensibility |
| A-007 | Safety stock policy is configurable in seed/demo policy | The PRD does not define a final formula |

## 5. System Boundaries

### Inside the System

- Buyer-facing frontend.
- API endpoints.
- Agent orchestration.
- Domain rules and validation.
- Mock operational services.
- Audit logging.
- Evaluation runner.
- Optional LLM adapter.

### Outside the System

- Real ERP/procurement system.
- Real supplier APIs/EDI.
- Real WMS/inventory system.
- Real forecasting service.
- Real budget/finance system.
- Real approval workflow.
- Production identity provider.

These outside systems are represented by mock internal services for the assignment.

## 6. Trust Boundaries

| Boundary | Trusted Side | Untrusted or Less Trusted Side | Controls |
| --- | --- | --- | --- |
| Browser to API | Server-side API validation | Browser payloads | Schema validation, supported action enums, positive integer quantities |
| API to agent core | Typed domain services | Raw request bodies | Request validation and normalized command objects |
| Agent core to LLM | Deterministic facts and checks | LLM output | Structured prompt, schema parsing, deterministic validation after output |
| Agent core to mock data | Service methods | Direct data mutation | Repository interface, action service, post-action validation |
| Mock external notes to model | Application instructions | Supplier/recommendation text | Treat notes as data, not instructions |

## 7. Runtime Architecture

Recommended runtime:

- Single web application process.
- Shared domain package/module.
- API route handlers call application services.
- Application services call repository interfaces.
- Repository uses in-memory state or a local JSON/SQLite store.
- Evaluation runner can be invoked through API and optionally CLI/test command.

Suggested module layout:

```text
src/
  app/ or pages/          # Frontend routes and UI components
  api/                    # HTTP route handlers
  domain/                 # Entities, schemas, enums, domain errors
  services/               # Recommendation, product, inventory, forecast, supplier, budget, storage, PO services
  agent/                  # Orchestrator, decision engine, explanation adapter
  rules/                  # Purchasing calculations and hard checks
  validation/             # Pre-action and post-action validators
  repositories/           # Mock data store and run state
  evaluation/             # Scenario runner and expected outcomes
  observability/          # Audit event and metrics helpers
```

## 8. Core Flows

### Recommendation Review

1. Frontend calls `POST /api/agent-runs` with `recommendationId`.
2. API validates request and calls `AgentRunOrchestrator`.
3. Orchestrator creates a run and logs input.
4. Orchestrator retrieves recommendation, product, inventory, forecast, open POs, suppliers, budget, and storage through typed services.
5. Rule engine computes projected supply, required supply, cost, capacity, supplier availability, MOQ, and duplicate PO checks.
6. Decision engine returns `accept`, `modify`, `reject`, or `investigate_further`.
7. Explanation adapter generates template or optional LLM explanation.
8. Pre-action validation verifies proposed action feasibility.
9. Run is saved as `decision_ready`.
10. API returns run, decision, and audit events.

### Action Execution and Validation

1. Frontend calls `POST /api/agent-runs/{runId}/actions`.
2. API validates action type and approval flag.
3. Action service verifies the decision allows the requested action.
4. Action service creates/modifies PO, rejects recommendation, or escalates.
5. Validation service re-fetches resulting state.
6. Validation service checks PO details, budget, storage, supplier, demand coverage, and duplicates.
7. If validation passes, run becomes `completed`.
8. If validation fails, run becomes `recovery_required` with retry, invalidation, or escalation guidance.
9. Audit log records action, validation, and recovery.

### Evaluation

1. Evaluator runs `POST /api/evaluations/run` or a test command.
2. Evaluation runner resets or loads scenario fixtures.
3. Each scenario invokes the same agent and validation paths as the UI.
4. Actual decision and validation result are compared with expected outcomes.
5. Summary reports total, passed, failed, and failure reasons.

## 9. Requirement to Component Mapping

| Requirements | Components |
| --- | --- |
| REQ-001, REQ-018 | Frontend, API layer, Recommendation service, Mock repository |
| REQ-002, REQ-010, REQ-011 | Agent orchestrator, Decision engine, Explanation adapter |
| REQ-003, REQ-004 | Agent orchestrator, Typed service interfaces |
| REQ-005 through REQ-009, REQ-020, REQ-023 | Rule engine, Validation service |
| REQ-012 through REQ-016 | Action service, Validation service, Audit logger |
| REQ-017 | Audit logger, Mock repository, Run detail API/UI |
| REQ-019, REQ-021 | Evaluation runner, Scenario fixtures |
| REQ-022 | API layer, Agent orchestrator, Observability helpers |
| REQ-024 | Configuration, optional LLM adapter, documentation |
| REQ-025 | Documentation and architecture package |

## 10. Quality Gate

- Every major requirement maps to one or more components.
- Every component has a clear responsibility.
- API boundaries are defined in `api-contract.md`.
- Data ownership is defined in `data-model.md`.
- Synchronous and action failure modes are covered in `reliability-design.md`.
- Retry, timeout, and idempotency behavior are defined for agent runs, actions, and optional LLM calls.
- Trust boundaries, authorization, secrets, and prompt safety are defined in `security-architecture.md`.
- Logs, metrics, traces, dashboards, and audit events are defined in `observability-design.md`.
- Architectural decisions and tradeoffs are recorded in `architecture-decisions.md`.

