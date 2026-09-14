# AI Workflow: AI Purchasing Agent

Source inputs: PRD, engineering specs, and technical architecture.

## 1. End-to-End Workflow

```text
recommendation input
-> request validation
-> context retrieval via typed tools
-> context normalization
-> deterministic rule checks
-> structured decision selection
-> optional explanation generation
-> pre-action validation
-> human approval if required
-> action execution
-> post-action validation
-> recovery/escalation if needed
-> user-visible result and audit log
```

## 2. Step Design

| Step | Input | Processing | Output | Failure Mode | Validation | Fallback |
| --- | --- | --- | --- | --- | --- | --- |
| Request validation | Recommendation ID, mode | Schema and resource checks | Valid command | Unknown ID or bad payload | API validation | Return typed error |
| Context retrieval | Recommendation | Call product, inventory, forecast, PO, supplier, budget, storage tools | Operational context | Missing/stale data | Required-context check | `investigate_further` |
| Context normalization | Raw service results | Normalize units, timestamps, confidence, open PO totals | Decision context | Contradictory data | Semantic checks | `investigate_further` |
| Rule checks | Decision context | Supply, demand, MOQ, budget, storage, duplicate PO checks | Rule check list | Calculation bug | Unit tests and invariant checks | Block action |
| Decision selection | Rule checks and context | Select enum and quantity | Structured decision | Unsupported or unsafe decision | Enum/schema validation | `investigate_further` or reject |
| Explanation | Structured facts and decision | Template or optional LLM | Buyer-readable summary | Hallucination, timeout | Output schema and grounding check | Template explanation |
| Pre-action validation | Proposed action | Check approval, quantity, supplier, budget, storage | Actionable plan or block | Constraint failure | Validation service | Block/escalate |
| Human review | Decision requiring approval | Buyer approves or declines | Approval command | Missing approval | Policy check | Keep action pending/escalate |
| Action execution | Approved action | Create/update/reject/escalate | Action result | Failure/partial success | Status and idempotency | Recovery path |
| Post-action validation | Action result and expected plan | Re-fetch/recompute state | Validation result | Mismatch | Validation service | Recovery/escalation |

## 3. Decision Workflow

1. If required data is missing, stale, low-confidence, or contradictory, return `investigate_further`.
2. If no feasible quantity satisfies hard constraints, return `reject` or escalation.
3. If original quantity is feasible and appropriate, return `accept`.
4. If a different feasible quantity is better, return `modify`.
5. If action risk exceeds policy threshold, set `requiresApproval = true`.
6. Always attach evidence, constraints checked, risks, unknowns, and confidence.

## 4. Tool-Calling Workflow

The agent may call only registered tools:

- `getRecommendation`
- `getProduct`
- `getInventory`
- `getDemandForecast`
- `getOpenPurchaseOrders`
- `getSupplierOptions`
- `getBudgetStatus`
- `getStorageCapacity`
- `validatePurchasePlan`
- `createPurchaseOrder`
- `updatePurchaseOrder`
- `rejectRecommendation`
- `escalateRecommendation`

For MVP, tool planning can be deterministic and fixed-order. The LLM should not decide arbitrary tool names or arguments.

## 5. Human Review Workflow

Human approval is required when:

- `requiresApproval = true`.
- Proposed quantity materially differs from recommendation.
- Budget threshold is exceeded or near threshold.
- Storage capacity risk exists.
- Forecast confidence is low.
- Supplier availability is partial.
- Action is a retry after failure.

## 6. Output Workflow

The UI/API must display:

- Decision type.
- Recommended final quantity.
- Supplier.
- Explanation.
- Evidence.
- Constraints checked.
- Risks and unknowns.
- Approval requirement.
- Action status.
- Validation status.
- Recovery/escalation if needed.

