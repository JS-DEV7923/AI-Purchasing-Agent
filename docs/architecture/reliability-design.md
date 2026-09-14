# Reliability Design: AI Purchasing Agent

Source inputs: PRD and engineering specs under `docs/`.

## 1. Reliability Goals

- No invalid purchase order is silently accepted.
- Every executed action is followed by validation.
- Missing or stale data produces investigation or escalation.
- LLM failure does not break deterministic decisioning.
- Evaluation scenarios are deterministic and repeatable.

## 2. Availability Assumptions

The MVP is a local demo. No formal SLA is required. Target behavior:

- Local app starts using README instructions.
- Recommendation review completes within 10 seconds.
- Evaluation runner produces stable pass/fail output.

## 3. Failure Modes and Responses

| Failure | Detection | Response |
| --- | --- | --- |
| Recommendation not found | Service lookup miss | 404, no run created |
| Product/inventory/forecast/supplier/budget/storage missing | Context fetch result | `investigate_further`, audit missing data |
| Forecast stale or low-confidence | Freshness/confidence check | `investigate_further` or escalation |
| Rule check fails | Rule engine result | Modify, reject, or escalate; block invalid action |
| LLM timeout/failure | Adapter exception/timeout | Template fallback |
| Unsupported action | API schema/action enum check | 400 |
| Approval missing | Action service policy check | 403 `APPROVAL_REQUIRED` |
| Action partial success | Action result status | Post-action validation, recovery required if mismatch |
| Post-action validation failure | Validation check result | Mark `recovery_required`, show failed check and recovery |
| Evaluation state leakage | Scenario reset verification | Reset repository before scenarios |

## 4. Timeouts

- API request timeout: implementation framework default is acceptable for local demo.
- Agent review target: less than 10 seconds.
- Optional LLM timeout: 3 seconds recommended.
- Evaluation runner should fail a scenario if review/action exceeds configured timeout.

## 5. Retries

MVP in-process services do not need retries. Optional LLM adapter may retry once for transient failure.

Action retries:

- Use `idempotencyKey` for action execution.
- Retrying the same action with the same key returns the original result.
- Retrying a failed action with a new key is allowed only if the run is in `recovery_required` and the recovery policy supports retry.

## 6. Idempotency

Required for:

- `POST /api/agent-runs`
- `POST /api/agent-runs/{runId}/actions`

Idempotency prevents:

- Duplicate agent runs for the same click/retry.
- Duplicate PO creation after network or browser retry.

## 7. Graceful Degradation

- If LLM is unavailable, use template explanations.
- If evaluation UI is not implemented, provide API or command output.
- If a mock service has missing data, return `investigate_further` instead of inventing facts.

## 8. Recovery Patterns

| Condition | Recovery |
| --- | --- |
| PO created with wrong quantity | Mark PO invalid in mock repository and escalate |
| PO action fails | Retry if configured, otherwise escalate |
| Partial supplier fulfillment | Create recovery recommendation for remainder or escalate |
| Duplicate PO detected | Block action and escalate |
| Budget/storage exceeded after action | Mark run `recovery_required`, show failed constraint |

## 9. Operational Runbook for Demo

### App Does Not Start

1. Verify dependencies are installed.
2. Verify `.env.example` was copied if required by chosen stack.
3. Run tests or seed reset command.

### Scenario Fails Unexpectedly

1. Reset mock repository state.
2. Run the specific scenario alone.
3. Inspect audit events for missing context, rule check failure, or action mismatch.
4. Verify expected outcome fixture.

### LLM Failure

1. Confirm template fallback is active.
2. Verify no test depends on LLM prose.
3. Check optional API key only if LLM is intended.

## 10. Reliability Quality Gate

- Every action path invokes post-action validation.
- Action partial success cannot become completed without validation pass.
- Missing data does not become fabricated data.
- Idempotency protects duplicate PO creation.
- Audit events are available for failed and successful runs.

