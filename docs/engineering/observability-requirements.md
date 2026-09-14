# Observability Requirements: AI Purchasing Agent

Source PRD: `docs/AI_PURCHASING_AGENT_PRD.md`

## Observability Goals

The system must make agent behavior understandable to buyers and evaluators. Observability should support debugging, evaluation, and trust rather than production operations at large scale.

## Required Logs

### Agent Run Logs

Each agent run must log:

- `runId`
- `recommendationId`
- Start and completion timestamps
- Run status
- Decision type
- Proposed quantity and supplier
- Action type and status
- Validation status
- Error or recovery state if applicable

### Audit Events

Each run must include ordered audit events:

| Event Type | Required Fields |
| --- | --- |
| `input` | Recommendation payload |
| `tool_call` | Tool name, request payload, timestamp |
| `tool_result` | Tool name, normalized response or error |
| `rule_check` | Check name, inputs, pass/fail/warning, reason |
| `decision` | Decision type, quantity, supplier, evidence, risks, unknowns, confidence |
| `action` | Action type, request, result status, PO ID if any |
| `validation` | Validation status, check results, failure reason |
| `recovery` | Recovery action or escalation reason |
| `error` | Error code, message, component |

## Metrics

### Demo Metrics

- Total scenarios run.
- Scenario pass rate.
- Agent review duration.
- Number of actions attempted.
- Number of actions validated.
- Number of validation failures.
- Number of invalid actions blocked.
- Number of escalations.
- Decision distribution by type.

### Quality Metrics

- Hard constraint enforcement rate.
- Percentage of executed actions followed by validation.
- Number of missing-data investigations.
- Number of LLM fallback explanations used, if applicable.
- Scenario expected-vs-actual decision match rate.

## Traces

Production tracing is not required. For the demo, an ordered audit event list is sufficient. If tracing is easy in the chosen framework, span names should map to:

- `agent.fetch_context`
- `agent.evaluate_rules`
- `agent.generate_explanation`
- `action.execute`
- `validation.post_action`
- `evaluation.run_scenario`

## Dashboards / UI Surfaces

### Run Detail View

Should display:

- Input recommendation.
- Retrieved context.
- Rule checks.
- Decision.
- Action result.
- Validation result.
- Recovery/escalation.
- Total duration.

### Evaluation Summary

Should display:

- Scenario name.
- Expected decision.
- Actual decision.
- Expected validation status.
- Actual validation status.
- Pass/fail.
- Failure reason.

## Alerts

Production alerting is not required for the assignment. If implemented locally, expose clear warnings for:

- Missing required data.
- Constraint violation.
- Action failure.
- Post-action validation failure.
- LLM failure with deterministic fallback.

## Debugging Requirements

- Every failed scenario must include a readable failure reason.
- Every validation failure must identify the failed check.
- Every blocked action must identify the blocking constraint.
- Every investigation decision must list missing, stale, or contradictory data.

## Data Retention

Not specified in PRD. For the local demo, in-memory retention for the app session or file-backed seed/output data is acceptable. README should state which approach is used.
