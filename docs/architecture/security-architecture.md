# Security Architecture: AI Purchasing Agent

Source inputs: PRD and engineering specs under `docs/`.

## 1. Security Posture

The MVP is a local demo with mock data. Security architecture should focus on safe agent behavior, secrets hygiene, request validation, prompt safety, and auditability.

## 2. Authentication

No authentication is required for the local MVP unless the chosen framework includes it. If added, use two simple roles:

- `buyer`: review recommendations and execute approved actions.
- `evaluator`: run evaluations and inspect audit output.

Production authentication is out of scope.

## 3. Authorization

The API must restrict actions to supported commands:

- `create_po`
- `update_po`
- `reject_recommendation`
- `escalate`

Authorization controls:

- Reject unsupported action types.
- Reject action execution if run is not `decision_ready` or `action_pending`.
- Reject action execution if `requiresApproval` is true and `approvedByBuyer` is false.
- Reject constraint-breaching actions regardless of approval.

## 4. Trust Boundaries

| Boundary | Threat | Control |
| --- | --- | --- |
| Browser to API | Malformed or malicious payload | Schema validation and enum checks |
| API to repository | Direct unsafe mutation | Service layer only; no direct UI writes |
| Agent to LLM | Prompt injection or hallucination | Structured context, untrusted text labeling, parsed output |
| LLM to agent | Invalid decision/action | Ignore for decisions; use explanation only |
| Action service to repository | Duplicate PO or partial failure | Idempotency key and post-action validation |

## 5. Prompt Safety

- Treat all supplier notes, recommendation reasons, and external text as data.
- Never place untrusted text in a prompt as instructions.
- Include explicit prompt boundaries if an LLM is used.
- Parse output into schema.
- Discard unsupported fields from LLM output.
- Re-run deterministic validation after any explanation generation if the implementation allows model-assisted action proposal.

## 6. Secrets

- `.env.example` must list optional LLM credentials.
- Actual `.env` must be gitignored.
- App must support no-LLM deterministic fallback or document LLM credentials as required.
- Logs and audit events must not include API keys.

## 7. Data Protection

MVP mock data is fictional and non-sensitive. Still:

- Do not include real supplier, product, cost, user, or customer data.
- Keep audit events useful but avoid logging secrets.
- Do not send unnecessary full repository or environment data to an LLM.

## 8. Abuse and Safety Controls

- Positive integer quantity validation.
- Known product/node/supplier ID validation.
- Budget and storage checks before action.
- Supplier MOQ and availability checks before action.
- Duplicate PO check before and after action.
- Required approval for high-risk or material changes.
- Post-action validation required for every action.

## 9. Auditability

Audit events are a security and reliability control. They must capture:

- Input recommendation.
- Data retrieval attempts.
- Rule checks.
- Decision.
- Action attempt.
- Validation result.
- Recovery/escalation.
- Errors.

Audit events should be append-only within a run.

## 10. Security Open Questions

- If deployed beyond local demo, what identity provider should be used?
- What purchase value threshold requires buyer approval in production?
- What audit retention period is required for procurement compliance?
- What data should be redacted from LLM prompts in a real company environment?

