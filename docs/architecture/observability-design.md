# Observability Design: AI Purchasing Agent

Source inputs: PRD and engineering specs under `docs/`.

## 1. Observability Goals

- Explain why each decision was made.
- Debug failed or unexpected scenarios.
- Prove hard constraints were enforced.
- Show validation happened after actions.
- Support evaluator review without inspecting code.

## 2. Correlation IDs

Use:

- `correlationId` for each HTTP request.
- `runId` for each agent run.
- `evaluationRunId` for each evaluation run.
- `eventId` and `sequence` for audit events.

Every log/audit event created during a run should include `runId`.

## 3. Structured Logs

Required application log fields:

- `timestamp`
- `level`
- `component`
- `correlationId`
- `runId` where applicable
- `message`
- `errorCode` where applicable
- `durationMs` where applicable

## 4. Audit Events

Audit events are the main observability surface for the assignment.

Required event types:

| Type | Purpose |
| --- | --- |
| `input` | Capture recommendation and run request |
| `tool_call` | Record typed service request |
| `tool_result` | Record normalized service result or error |
| `rule_check` | Record deterministic check inputs and outcome |
| `decision` | Record final decision, evidence, risks, unknowns |
| `action` | Record action attempt and result |
| `validation` | Record validation checks and status |
| `recovery` | Record retry, invalidation, or escalation guidance |
| `error` | Record unexpected failure |

## 5. Metrics

### Demo Metrics

- `agent_runs_total`
- `agent_run_duration_ms`
- `decisions_total_by_type`
- `actions_attempted_total`
- `actions_validated_total`
- `validation_failures_total`
- `invalid_actions_blocked_total`
- `escalations_total`
- `llm_fallbacks_total`

### Evaluation Metrics

- `evaluation_scenarios_total`
- `evaluation_scenarios_passed`
- `evaluation_scenarios_failed`
- `evaluation_duration_ms`
- `expected_actual_decision_mismatches_total`

## 6. Traces

Full distributed tracing is not required. If spans are easy to implement, use:

- `agent.fetch_context`
- `agent.evaluate_rules`
- `agent.select_decision`
- `agent.generate_explanation`
- `action.execute`
- `validation.post_action`
- `evaluation.run_scenario`

Otherwise, ordered audit events are sufficient.

## 7. Dashboards and UI Surfaces

### Run Detail

Show:

- Input recommendation.
- Retrieved context.
- Rule checks.
- Decision.
- Action result.
- Validation result.
- Recovery/escalation.
- Total duration.
- Ordered audit events.

### Evaluation Summary

Show:

- Scenario ID/name.
- Expected decision.
- Actual decision.
- Expected validation status.
- Actual validation status.
- Pass/fail.
- Failure reason.

## 8. Alerts and Warnings

Production alerting is not required. Local UI/API should expose warnings for:

- Missing data.
- Stale/low-confidence forecast.
- Constraint violation.
- Approval required.
- Action failure.
- Post-action validation failure.
- LLM fallback used.

## 9. Debugging Requirements

- Every blocked action identifies the blocking check.
- Every validation failure identifies expected vs actual state.
- Every investigation decision lists missing, stale, or contradictory data.
- Every evaluation failure links to the associated `runId` and audit events.

