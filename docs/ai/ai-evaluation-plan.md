# AI Evaluation Plan: AI Purchasing Agent

Source inputs: PRD, engineering specs, and technical architecture.

## 1. Evaluation Goals

- Verify the agent gathers required context.
- Verify structured decisions are correct.
- Verify tool calls and actions are authorized.
- Verify hard constraints are enforced.
- Verify every action is validated.
- Verify explanations are grounded in retrieved facts.
- Verify failure and recovery behavior.

## 2. Evaluation Dataset

Use deterministic seed scenarios:

| Scenario | Expected Decision | Required Checks |
| --- | --- | --- |
| Accept recommendation | `accept` | Demand coverage, MOQ, budget, storage, duplicate PO |
| Modify quantity down | `modify` | Open PO and overstock logic |
| Modify quantity up | `modify` or `investigate_further` | Demand spike evidence |
| Reject hard constraint | `reject` or escalation | Budget/storage infeasibility |
| Missing data | `investigate_further` | Missing forecast/supplier/budget |
| Action failure recovery | recovery/escalation | Post-action mismatch detection |
| Prompt injection note | Same deterministic decision | Ignore malicious external text |
| LLM failure | Same deterministic decision | Template fallback |

## 3. Metrics

### Core Agent Metrics

- Decision accuracy against expected outcome.
- Required context retrieval coverage.
- Tool-call correctness.
- Hard constraint enforcement rate.
- Action validation rate.
- Recovery correctness.

### Explanation Metrics

- Structured output validity rate.
- Groundedness rate.
- Contradiction rate.
- Missing unknowns/risk rate.

### Operational Metrics

- Review latency.
- LLM fallback rate.
- Retry rate.
- Evaluation pass rate.

## 4. Acceptance Thresholds

- 100% hard constraint enforcement.
- 100% executed actions followed by validation.
- 0 invalid POs silently accepted.
- At least 4 of 5 core scenario decisions correct.
- 100% required context either retrieved or explicitly marked missing.
- 0 explanation outputs that contradict deterministic decision.
- Recommendation review completes within 10 seconds.

## 5. Eval Assertions

Do assert:

- Decision enum.
- Proposed quantity.
- Supplier ID.
- Approval requirement.
- Validation status.
- Failed checks.
- Recovery path.
- Audit event presence.

Do not assert:

- Exact explanation wording.
- LLM prose style.

## 6. Regression Cadence

Run evaluations:

- After changing rules.
- After changing prompt.
- After changing model/provider.
- After changing tool schemas.
- Before final submission.

## 7. Launch Gate

The project is ready for demo when:

- Evaluation suite passes thresholds.
- Manual end-to-end Scenario 1 works.
- Audit log is visible.
- LLM fallback path works or LLM is not required.
- Documentation explains validation and evaluation.

