# AI Observability: AI Purchasing Agent

Source inputs: PRD, engineering specs, and technical architecture.

## 1. Observability Goals

- Show what the agent knew.
- Show what tools it used.
- Show why it decided.
- Show whether action execution matched intent.
- Show whether validation passed.
- Debug model, prompt, retrieval, and tool failures.

## 2. Required AI Audit Events

| Event | Required Fields |
| --- | --- |
| `ai.context_built` | runId, recommendationId, included sources, missing sources |
| `ai.rule_checks_completed` | runId, checks, pass/fail counts |
| `ai.decision_selected` | runId, decision, quantity, supplier, confidence |
| `ai.explanation_generated` | runId, mode, promptVersion, modelName, fallbackUsed |
| `ai.explanation_rejected` | runId, reason, fallbackUsed |
| `ai.tool_authorized` | runId, tool, sideEffect, approvalRequired |
| `ai.tool_executed` | runId, tool, status, idempotencyKey |
| `ai.validation_completed` | runId, status, failedChecks |
| `ai.recovery_selected` | runId, recoveryType, reason |

## 3. AI Metrics

- `ai_decision_total_by_type`
- `ai_required_context_missing_total`
- `ai_rule_check_failures_total`
- `ai_llm_calls_total`
- `ai_llm_failures_total`
- `ai_llm_fallbacks_total`
- `ai_explanation_schema_failures_total`
- `ai_tool_calls_total_by_tool`
- `ai_side_effect_tools_blocked_total`
- `ai_post_action_validation_failures_total`
- `ai_eval_pass_rate`

## 4. Trace Spans

Recommended spans:

- `agent.retrieve_context`
- `agent.normalize_context`
- `agent.evaluate_rules`
- `agent.select_decision`
- `agent.generate_explanation`
- `agent.pre_action_validation`
- `agent.execute_action`
- `agent.post_action_validation`

## 5. Dashboards

For MVP, dashboards can be UI panels or JSON output:

- Run detail with audit timeline.
- Evaluation summary.
- Tool call coverage.
- Validation failure breakdown.
- LLM fallback/debug panel if LLM is enabled.

## 6. Alerts and Warnings

Production alerting is not required. Display local warnings for:

- Missing required context.
- LLM fallback.
- Explanation rejected.
- Side-effect tool blocked.
- Post-action validation failure.
- Evaluation scenario failure.

## 7. Drift and Quality Monitoring

For MVP, drift monitoring is represented by deterministic regression scenarios. For future production, track:

- Forecast confidence distribution changes.
- Supplier partial fulfillment rate.
- Buyer override rate.
- Validation failure rate.
- Explanation contradiction rate.

