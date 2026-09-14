# Component Design: AI Purchasing Agent

Source inputs: PRD and engineering specs under `docs/`.

## Component Summary

| Component | Owns | Depends On | Primary Failure Mode |
| --- | --- | --- | --- |
| Frontend UI | Buyer/evaluator workflow state | API layer | Misleading or stale run display |
| API layer | HTTP contracts, request validation, error mapping | Application services | Invalid input reaches domain services |
| Agent run orchestrator | Run lifecycle and workflow ordering | Services, rules, decision, explanation, audit | Missing context or skipped audit event |
| Typed mock services | Domain-specific data access operations | Mock repository | Missing/stale data handling |
| Rule engine | Deterministic calculations and hard checks | Domain types, policy config | Incorrect constraint decision |
| Decision engine | Decision selection and action proposal | Rule engine output | Flaky or unsupported decision |
| Explanation adapter | Human-readable explanation | Optional LLM, templates | LLM failure or hallucinated explanation |
| Action service | PO/reject/escalate action execution | Repository, validation | Partial success treated as success |
| Validation service | Pre-action and post-action validation | Repository, rule engine | Invalid PO passes silently |
| Audit logger | Ordered audit events | Repository | Missing traceability |
| Evaluation runner | Scenario setup and pass/fail comparison | Repository, orchestrator, action service | Evaluation diverges from real app flow |
| Mock repository | Seed data and mutable demo state | Local memory/file/SQLite | State leakage between scenarios |

## Frontend UI

### Responsibilities

- Render recommendation list.
- Trigger recommendation review.
- Display retrieved context, decision, evidence, confidence, risks, unknowns, and action controls.
- Execute buyer-approved action.
- Display validation results and recovery guidance.
- Display evaluation results.

### Owned State

- Client-side view state only.
- Selected recommendation/run IDs.
- Loading and error states.

### Dependencies

- `GET /api/recommendations`
- `GET /api/recommendations/{recommendationId}`
- `POST /api/agent-runs`
- `POST /api/agent-runs/{runId}/actions`
- `GET /api/agent-runs/{runId}`
- `POST /api/evaluations/run`

### Reliability Notes

- UI must not infer success from action HTTP success alone; it must render validation status.
- UI should show blocked, recovery, and escalation states distinctly.

## API Layer

### Responsibilities

- Validate request payloads.
- Normalize commands for application services.
- Map domain errors to HTTP status codes.
- Return stable JSON response shapes.
- Enforce supported action enums.

### Owned State

- None, except per-request correlation IDs.

### Dependencies

- Agent orchestrator.
- Action service.
- Evaluation runner.
- Mock repository for read endpoints.

### Failure Modes

- Bad request payloads.
- Unknown resource IDs.
- Domain service errors.

### Reliability Notes

- Return 400 for schema/action validation errors.
- Return 404 for unknown recommendation/run/PO.
- Return 409 for state conflicts, such as executing an action before decision readiness.
- Return 500 only for unexpected application failures.

## Agent Run Orchestrator

### Responsibilities

- Create and update `AgentRun` state.
- Retrieve operational context through typed services.
- Log every tool call and result.
- Invoke rule engine and decision engine.
- Invoke explanation adapter.
- Run pre-action validation for proposed action.
- Persist decision and audit events.

### Owned State

- Agent run lifecycle state.
- Decision output before action execution.

### Dependencies

- Recommendation, product, inventory, forecast, PO, supplier, budget, and storage services.
- Rule engine.
- Decision engine.
- Explanation adapter.
- Validation service.
- Audit logger.

### Failure Modes

- Required context missing.
- Service retrieval error.
- Decision cannot be produced.
- Optional LLM failure.

### Reliability Notes

- Missing or stale required context produces `investigate_further`.
- LLM failure must not fail the run if deterministic explanation fallback is available.

## Typed Mock Services

### Responsibilities

- Provide domain-specific operations instead of direct repository access.
- Normalize missing data into typed errors.
- Keep mock integration boundaries similar to future real service integrations.

### Owned Data

- No direct ownership; data belongs to mock repository.

### Failure Modes

- Unknown product, recommendation, node, supplier, or missing required data.

## Rule Engine

### Responsibilities

- Calculate available inventory.
- Calculate incoming open PO quantity.
- Calculate expected demand during lead time.
- Calculate safety stock.
- Calculate required and projected supply.
- Check supplier MOQ and availability.
- Check budget.
- Check storage.
- Check duplicate/conflicting open POs.

### Owned Data

- Pure functions and policy configuration.

### Reliability Notes

- Must be unit tested independent of LLM and UI.
- Must return structured check results with pass/fail/warning and reason.

## Decision Engine

### Responsibilities

- Convert rule outputs into `accept`, `modify`, `reject`, or `investigate_further`.
- Propose final quantity and supplier.
- Mark `requiresApproval` based on policy.
- Provide structured evidence, risks, unknowns, and confidence.

### Reliability Notes

- Must output only supported enum values.
- Must not propose actions that fail hard constraints.
- Must prefer `investigate_further` when required facts are missing or contradictory.

## Explanation Adapter

### Responsibilities

- Generate buyer-readable decision summaries.
- Use templates by default or optional LLM when configured.
- Keep deterministic facts and rule outputs as source material.

### Failure Modes

- LLM timeout.
- LLM parse failure.
- Hallucinated explanation.

### Controls

- Structured input only.
- Parsed output schema.
- Template fallback.
- Explanation cannot change decision, action, or validation result.

## Action Service

### Responsibilities

- Execute allowed mock actions:
  - `create_po`
  - `update_po`
  - `reject_recommendation`
  - `escalate`
- Enforce approval requirements.
- Write resulting state through repository.
- Invoke post-action validation.
- Produce recovery guidance.

### Reliability Notes

- Partial success must be represented explicitly.
- Post-action validation is mandatory for all executed actions.

## Validation Service

### Responsibilities

- Pre-action validation of proposed plans.
- Post-action validation of resulting PO/recommendation state.
- Identify failed checks.
- Recommend recovery path.

### Reliability Notes

- It is the final authority on whether an action is acceptable.
- Validation results must be visible in UI and audit log.

## Audit Logger

### Responsibilities

- Append ordered audit events.
- Include correlation/run IDs and timestamps.
- Persist input, tool calls, tool results, rule checks, decisions, actions, validation, recovery, and errors.

### Reliability Notes

- Audit failures should be surfaced because traceability is a core requirement.

## Evaluation Runner

### Responsibilities

- Load/reset scenario fixtures.
- Execute scenarios through the same orchestrator/action/validation path used by the UI.
- Compare expected and actual decisions/validation outcomes.
- Report pass/fail and failure reasons.

### Reliability Notes

- Evaluation must not assert prose wording.
- Evaluation should assert structured decision and validation fields.

## Mock Repository

### Responsibilities

- Own seed data and mutable demo state.
- Store recommendations, products, inventory, forecasts, supplier options, budgets, storage, POs, agent runs, audit events, and evaluation outputs.

### Storage Choices

- In-memory store for fastest implementation.
- JSON file-backed store if persistence across reload is desired.
- SQLite if relational queries and realistic persistence are useful.

### Reliability Notes

- Must support scenario reset to avoid state leakage.
- Must generate stable IDs or deterministic IDs for repeatable evaluation.

