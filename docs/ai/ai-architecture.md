# Agentic AI Architecture: AI Purchasing Agent

Source inputs:

- `docs/AI_PURCHASING_AGENT_PRD.md`
- `docs/engineering/`
- `docs/architecture/`

## 1. AI System Summary

The AI Purchasing Agent is a constrained decision-support and action agent for purchasing recommendations. It investigates a recommendation, gathers operational context through typed tools, applies deterministic purchasing rules, optionally uses an LLM to synthesize buyer-readable reasoning, proposes or executes allowed actions, and validates the resulting state.

The model is not the source of truth for purchasing constraints. Deterministic services own calculations, validation, action authorization, and post-action verification.

## 2. AI Components

| Component | AI Role | Deterministic Boundary |
| --- | --- | --- |
| Agent run orchestrator | Plans and sequences the review workflow | Only calls approved typed services |
| Context builder | Constructs normalized context for decisioning and optional LLM explanation | Uses retrieved data only; no invented fields |
| Decision engine | Produces structured decision from rule results | Must obey rule engine and validation output |
| Explanation adapter | Generates buyer-readable explanation | Cannot alter decision, quantity, supplier, action, or validation |
| Tool execution layer | Executes approved tool calls | Validates schema, permissions, idempotency, and side effects |
| Validation service | Checks proposed and executed actions | Final authority for acceptability |
| Evaluation runner | Measures decision, action, validation, and explanation quality | Uses deterministic expected outcomes |

## 3. Autonomy Level

Recommended autonomy: **supervised bounded autonomy**.

- The agent may gather context automatically.
- The agent may classify recommendations.
- The agent may propose actions.
- The agent may auto-execute only low-risk actions when configured.
- The agent must require buyer approval for high-risk, materially changed, uncertain, or constraint-sensitive actions.
- The agent must never bypass deterministic validation.

## 4. Inputs and Outputs

### Inputs

- Purchase recommendation.
- Product data.
- Inventory.
- Forecast.
- Open purchase orders.
- Supplier options.
- Budget state.
- Storage state.
- Policy config.
- Optional buyer approval command.

### Outputs

- Structured decision: `accept`, `modify`, `reject`, or `investigate_further`.
- Proposed quantity and supplier.
- Evidence, constraints checked, risks, unknowns, confidence.
- Optional natural-language explanation.
- Action result.
- Validation result.
- Recovery or escalation guidance.
- Audit events.

## 5. Requirement to AI Component Mapping

| Requirement Area | AI Component |
| --- | --- |
| Gather relevant purchasing context | Orchestrator, context builder, typed tools |
| Do not trust recommendation blindly | Rule engine, decision engine |
| Decide accept/modify/reject/investigate | Decision engine |
| Explain important factors | Explanation adapter |
| Execute allowed action | Tool execution layer, action service |
| Validate result | Validation service |
| Handle action mismatch | Validation service, recovery policy |
| Evaluation scenarios | Evaluation runner |
| Auditability | Audit logger across every AI step |

## 6. Assumptions

- LLM is optional and explanation-only for MVP.
- Deterministic fallback must be sufficient for tests and demo.
- Mock operational data is trusted as the system of record, but text fields inside it are untrusted prompt input.
- No long-term memory is required for the assignment.
- Evaluation should assess structured outcomes, not prose wording.

## 7. Open Questions

- Should any low-risk PO creation be auto-executed in the final demo, or should all action execution require buyer approval?
- What safety stock formula should be used beyond configurable demo policy?
- If an LLM is used, which provider/model will be selected for the implementation?

