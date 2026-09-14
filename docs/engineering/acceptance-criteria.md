# Acceptance Criteria: AI Purchasing Agent

Source PRD: `docs/AI_PURCHASING_AGENT_PRD.md`

## Global Acceptance Criteria

### AC-001: Local Demo Runs

Given a fresh clone of the repository, when the evaluator follows the README setup and run instructions, then the full-stack application starts locally without requiring real procurement integrations.

### AC-002: MVP Scenario End-to-End

Given a seeded purchase recommendation for 800 units, when the buyer runs the agent review, then the system gathers context, produces a decision, exposes an explanation, executes or proposes an allowed action, and validates the resulting state.

### AC-003: Recommendation Is Not Trusted Blindly

Given recommendations with different inventory, demand, supplier, budget, and storage conditions, when the agent evaluates them, then it may produce accept, modify, reject, or investigate decisions based on evidence rather than always accepting the original quantity.

### AC-004: Hard Constraints Are Deterministic

Given a recommendation that violates budget, storage, supplier MOQ, or duplicate/open PO constraints, when the agent proposes an action, then deterministic validation blocks or modifies the action before PO creation.

### AC-005: All Actions Are Validated

Given any executed mock action, when the action service returns, then the system runs post-action validation and records the validation result in the run audit log.

### AC-006: Invalid PO Is Not Silently Accepted

Given an action returns an unexpected quantity, partial success, duplicate PO, or failed status, when validation runs, then the run is marked failed/recovery/escalated rather than success.

### AC-007: Audit Log Exists

Given any agent run, when the buyer opens the run detail or the evaluator inspects the run output, then the audit log includes recommendation input, data retrieval steps, decision, action attempt, validation result, and errors if present.

### AC-008: Secrets Are Not Committed

Given the repository contents, when an evaluator inspects configuration, then required variables are documented in `.env.example` and no API keys, passwords, or tokens are committed.

## Scenario Acceptance Criteria

### AC-009: Accept Recommendation Scenario

Given current inventory, incoming POs, and proposed 800 units meet demand coverage and all constraints, when the agent reviews the recommendation, then it returns `accept`, supports creating a PO for 800 units, and validates the resulting state as acceptable.

### AC-010: Modify Quantity Down Scenario

Given current inventory and open POs make 800 units materially excessive, when the agent reviews the recommendation, then it returns `modify` with a lower quantity that still meets demand coverage and passes budget, storage, and supplier checks.

### AC-011: Modify Quantity Up or Investigate Scenario

Given demand has increased enough that 800 units may be insufficient, when the forecast data is available and reliable, then the agent returns `modify` with a higher valid quantity; when required evidence is missing or low-confidence, then the agent returns `investigate_further` or escalates.

### AC-012: Reject or Escalate Hard Constraint Scenario

Given the proposed purchase cannot fit budget or storage constraints and no valid modification exists, when the agent evaluates the recommendation, then it returns `reject` or escalation and does not create a PO.

### AC-013: Missing Data Scenario

Given required forecast, supplier, budget, inventory, or storage data is missing, stale, or contradictory, when the agent evaluates the recommendation, then it returns `investigate_further` and clearly lists missing or unreliable facts.

### AC-014: Action Failure Recovery Scenario

Given a valid proposed action but the mock action service returns failure, partial success, or a mismatched created PO, when validation runs, then the system records the mismatch and provides retry, invalidation, or escalation as recovery.

## UI Acceptance Criteria

### AC-015: Recommendation List

Given seeded recommendations exist, when the buyer opens the app, then the recommendation list displays product, suggested quantity, node, urgency/status, and a way to open details.

### AC-016: Recommendation Detail

Given a buyer opens a recommendation, when the detail view loads, then it displays retrieved facts, decision status, constraints checked, key evidence, risks, confidence, and action controls.

### AC-017: Action Result

Given a buyer executes or approves an action, when the action completes, then the UI displays created/updated/rejected/escalated status, validation result, and recovery if needed.

### AC-018: Evaluation Output

Given the evaluator runs the test scenarios, when the evaluation completes, then output shows expected decision, actual decision, validation result, and pass/fail for each scenario.

## Non-Functional Acceptance Criteria

### AC-019: Latency

Given seeded local data and normal local runtime conditions, when a single recommendation review runs, then it completes within 10 seconds and records run duration.

### AC-020: Testability

Given deterministic business rules, when unit tests run, then inventory coverage, MOQ, budget, storage, duplicate PO, and validation rules are tested without requiring an LLM call.

### AC-021: Documentation Completeness

Given the final repository, when an evaluator reviews documentation, then README or docs include setup/run instructions, architecture diagram, approach, test scenarios, evaluation approach, mock data description, and decision validation explanation.
