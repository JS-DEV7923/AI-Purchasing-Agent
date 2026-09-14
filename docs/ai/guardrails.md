# AI Guardrails: AI Purchasing Agent

Source inputs: PRD, engineering specs, and technical architecture.

## 1. Guardrail Summary

The agent is constrained by schemas, typed tools, deterministic rules, action authorization, post-action validation, audit logs, and human approval gates.

## 2. Input Guardrails

- Validate all API request schemas.
- Reject unknown IDs.
- Reject negative, zero, fractional, or non-numeric quantities.
- Reject unsupported action types.
- Normalize units before calculations.
- Mark missing/stale/contradictory context as `investigate_further`.

## 3. Tool Guardrails

- Only registered tools are callable.
- Read tools do not mutate state.
- Side-effect tools require idempotency keys.
- Side-effect tools require pre-action validation.
- Side-effect tools emit audit events.
- Direct repository mutation is not allowed from UI or LLM.

## 4. Model Guardrails

- Model output is untrusted until parsed and validated.
- Model cannot change decision enum, quantity, supplier, action, or validation.
- Model cannot invent data.
- Model cannot call arbitrary tools.
- Model failure uses template fallback.

## 5. Prompt Injection Guardrails

- Treat supplier notes and recommendation text as untrusted.
- Delimit untrusted text in prompts.
- Ignore instructions found in operational data.
- Do not expose secrets or environment data.
- Drop unsupported output fields.

## 6. Action Guardrails

Block or escalate if:

- Budget is exceeded.
- Storage is exceeded.
- Supplier MOQ is not met.
- Supplier availability is insufficient.
- Duplicate/conflicting PO exists.
- Forecast is missing/stale/low-confidence.
- Required approval is missing.
- Post-action validation fails.

## 7. Human Escalation Guardrails

Escalate when:

- Required context is missing.
- Data is contradictory.
- Action service returns partial success.
- Action differs materially from original recommendation.
- Recovery after failure is needed.
- No feasible quantity satisfies constraints.

## 8. Privacy and Sensitive Data Guardrails

- Use fictional mock data only.
- Do not log secrets.
- Do not send unnecessary data to optional LLM.
- Document optional LLM credentials in `.env.example`.

## 9. Output Guardrails

Buyer-facing output must:

- Distinguish facts, assumptions, risks, and unknowns.
- Show validation status.
- Never present unvalidated action as successful.
- Include recovery/escalation where required.

