# Engineering Spec: AI Purchasing Agent

Source PRD: `docs/AI_PURCHASING_AGENT_PRD.md`

## 1. System Overview

The AI Purchasing Agent is a local full-stack demo that reviews purchasing recommendations against mock operational data. It combines deterministic business rules with optional AI-generated decision synthesis/explanation. Deterministic validation remains authoritative for all purchasing actions.

The system must demonstrate an end-to-end loop:

1. Load a purchasing recommendation.
2. Gather operational context from typed tools/services.
3. Compute purchasing feasibility and constraints.
4. Produce a decision: `accept`, `modify`, `reject`, or `investigate_further`.
5. Execute or propose an allowed mock action.
6. Validate the resulting state.
7. Persist/display the audit trail and evaluation outcome.

## 2. Architecture

### Components

| Component | Responsibility |
| --- | --- |
| Frontend app | Displays recommendations, run detail, decision, action controls, validation result, and evaluation output |
| API layer | Exposes endpoints for recommendations, agent runs, actions, validation, and evaluation scenarios |
| Agent orchestrator | Coordinates context retrieval, rule evaluation, optional LLM explanation, action proposal, and audit events |
| Rule engine | Performs deterministic calculations and hard constraint checks |
| Mock data repository | Stores seeded products, inventory, forecasts, suppliers, budgets, storage, recommendations, and POs |
| Action service | Creates/modifies/rejects/escalates mock purchasing actions |
| Validation service | Verifies pre-action and post-action purchasing state |
| Audit logger | Records ordered run events for traceability |
| Evaluation runner | Executes deterministic test scenarios and reports pass/fail |

### Recommended Runtime Shape

The PRD does not mandate a stack. A simple implementation can use:

- Single full-stack web app.
- In-memory or file-backed mock database.
- Server-side TypeScript or Python services.
- Optional LLM call only for explanation synthesis; deterministic fallback required.

The spec is intentionally framework-agnostic.

## 3. Domain Model

### Enums

```text
DecisionType = accept | modify | reject | investigate_further
ActionType = create_po | update_po | reject_recommendation | escalate
ActionStatus = pending_approval | success | failure | partial_success | skipped
ValidationStatus = passed | failed | warning
PurchaseOrderStatus = open | created | modified | invalid | cancelled
AuditEventType = input | tool_call | tool_result | rule_check | decision | action | validation | recovery | error
```

### Product

```json
{
  "productId": "prod_001",
  "sku": "SKU-001",
  "name": "Example Product",
  "categoryId": "cat_001",
  "unitCost": 12.5,
  "casePackSize": 25,
  "unitsPerStorageSlot": 50
}
```

### Inventory

```json
{
  "productId": "prod_001",
  "nodeId": "node_001",
  "onHandUnits": 300,
  "reservedUnits": 50,
  "availableUnits": 250
}
```

### DemandForecast

```json
{
  "productId": "prod_001",
  "nodeId": "node_001",
  "dailyForecastUnits": 70,
  "forecastHorizonDays": 14,
  "confidence": 0.82,
  "lastUpdatedAt": "2026-09-14T00:00:00Z"
}
```

### PurchaseRecommendation

```json
{
  "recommendationId": "rec_001",
  "productId": "prod_001",
  "nodeId": "node_001",
  "recommendedQuantity": 800,
  "source": "mock_replenishment_system",
  "createdAt": "2026-09-14T00:00:00Z"
}
```

### PurchaseOrder

```json
{
  "poId": "po_001",
  "productId": "prod_001",
  "nodeId": "node_001",
  "supplierId": "sup_001",
  "quantity": 800,
  "status": "created",
  "expectedArrivalDate": "2026-09-21",
  "createdAt": "2026-09-14T00:00:00Z"
}
```

### SupplierOption

```json
{
  "supplierId": "sup_001",
  "productId": "prod_001",
  "availableQuantity": 1200,
  "leadTimeDays": 7,
  "minimumOrderQuantity": 250,
  "unitCost": 12.5,
  "reliabilityScore": 0.93
}
```

### ConstraintState

```json
{
  "categoryId": "cat_001",
  "nodeId": "node_001",
  "budgetRemaining": 15000,
  "storageSlotsAvailable": 20,
  "maxUnitsStorable": 1000,
  "approvalThresholdAmount": 10000
}
```

### AgentRun

```json
{
  "runId": "run_001",
  "recommendationId": "rec_001",
  "status": "completed",
  "decision": {},
  "actionResult": {},
  "validationResult": {},
  "auditEvents": [],
  "startedAt": "2026-09-14T00:00:00Z",
  "completedAt": "2026-09-14T00:00:05Z"
}
```

## 4. API Contracts

### `GET /api/recommendations`

Returns pending recommendations.

Response:

```json
{
  "recommendations": [
    {
      "recommendationId": "rec_001",
      "productId": "prod_001",
      "nodeId": "node_001",
      "recommendedQuantity": 800,
      "status": "pending"
    }
  ]
}
```

### `GET /api/recommendations/{recommendationId}`

Returns recommendation plus currently known context if available.

### `POST /api/agent-runs`

Starts an agent review.

Request:

```json
{
  "recommendationId": "rec_001",
  "mode": "review_only"
}
```

Response:

```json
{
  "runId": "run_001",
  "decision": {
    "type": "modify",
    "recommendedQuantity": 650,
    "supplierId": "sup_001",
    "confidence": 0.86,
    "requiresApproval": false,
    "summary": "Modify to 650 units because open POs already cover part of expected demand.",
    "evidence": [],
    "constraintsChecked": [],
    "risks": [],
    "unknowns": []
  },
  "auditEvents": []
}
```

### `POST /api/agent-runs/{runId}/actions`

Executes an allowed action from a completed decision.

Request:

```json
{
  "actionType": "create_po",
  "approvedByBuyer": true
}
```

Response:

```json
{
  "actionStatus": "success",
  "purchaseOrder": {},
  "validationResult": {
    "status": "passed",
    "checks": []
  },
  "recovery": null
}
```

### `GET /api/agent-runs/{runId}`

Returns the full run, including audit events.

### `POST /api/evaluations/run`

Runs all seeded evaluation scenarios.

Response:

```json
{
  "summary": {
    "total": 6,
    "passed": 6,
    "failed": 0
  },
  "results": []
}
```

## 5. Agent Orchestration Flow

1. Create `AgentRun` with status `running`.
2. Fetch recommendation.
3. Fetch product.
4. Fetch inventory for `productId` and `nodeId`.
5. Fetch forecast for `productId`, `nodeId`, and configured horizon.
6. Fetch open POs for `productId` and `nodeId`.
7. Fetch supplier options.
8. Fetch budget and storage constraints.
9. Validate required context completeness.
10. Run deterministic calculations and constraint checks.
11. Select decision type and proposed action.
12. Optionally call LLM to synthesize explanation from structured facts.
13. Validate proposed action preconditions.
14. Persist decision and audit events.
15. Return decision to UI/API caller.

## 6. Decision Logic

### Calculations

```text
available_inventory = max(onHandUnits - reservedUnits, availableUnits)
incoming_open_po_quantity = sum(open POs for product/node)
expected_demand_during_lead_time = dailyForecastUnits * selectedSupplier.leadTimeDays
safety_stock = configuredSafetyStockDays * dailyForecastUnits
required_supply = expected_demand_during_lead_time + safety_stock
projected_supply = available_inventory + incoming_open_po_quantity + proposed_purchase_quantity
projected_surplus = projected_supply - required_supply
estimated_cost = proposed_purchase_quantity * supplier.unitCost
storage_units_required = proposed_purchase_quantity
```

### Decision Selection

- Return `investigate_further` if required data is missing, stale, contradictory, or below confidence threshold.
- Return `reject` if no feasible quantity can satisfy budget/storage/MOQ and demand requirements.
- Return `modify` if original quantity is feasible but materially too high or too low.
- Return `accept` if original quantity satisfies required supply and all hard constraints.

### Quantity Adjustment

Recommended quantity should be rounded to the supplier MOQ or case pack where applicable.

```text
raw_needed_quantity = required_supply - available_inventory - incoming_open_po_quantity
rounded_quantity = round_up_to_increment(max(raw_needed_quantity, 0), casePackSize)
final_quantity = max(rounded_quantity, supplier.minimumOrderQuantity if raw_needed_quantity > 0)
```

## 7. Validation Service

### Pre-Action Validation Checks

- Required fields exist.
- Supplier exists and supplies the product.
- Quantity is positive when action type creates or updates a PO.
- Quantity satisfies supplier MOQ.
- Supplier available quantity is sufficient.
- Estimated cost is less than or equal to budget remaining.
- Quantity fits storage capacity.
- The action does not create duplicate/conflicting open POs.
- Approval is present when `requiresApproval` is true.

### Post-Action Validation Checks

- Created/updated PO exists.
- PO product, node, supplier, and quantity match approved action.
- PO status is valid.
- Budget impact remains within limits.
- Storage impact remains within limits.
- Projected supply meets required supply unless the decision intentionally escalated/investigated.
- No duplicate or conflicting PO was created.

## 8. State Transitions

### Recommendation

```text
pending -> under_review -> accepted | modified | rejected | investigation_required | escalated
```

### Agent Run

```text
created -> running -> decision_ready -> action_pending -> validating -> completed
created -> running -> failed
validating -> recovery_required -> completed
```

### Purchase Order

```text
none -> created -> validated
none -> creation_failed -> recovery_required
created -> invalid -> escalated
```

## 9. Error Handling

| Error | Behavior |
| --- | --- |
| Recommendation not found | Return 404 and create no run |
| Required data missing | Return `investigate_further`; no action allowed |
| Data retrieval failure | Audit error and return `investigate_further` |
| Constraint failure | Return `reject`, `modify`, or escalation; block invalid action |
| LLM failure | Continue with deterministic decision and template explanation |
| Action failure | Record failed action and return recovery |
| Post-action validation failure | Mark run `recovery_required`; show mismatch and next step |

## 10. Frontend Behavior

### Recommendation List

- Show product name/SKU, node, recommended quantity, status, urgency if available, and created timestamp.
- Provide an action to open detail.

### Recommendation Detail

- Show original recommendation.
- Show retrieved context grouped by inventory, forecast, open POs, supplier, budget, and storage.
- Show decision badge, final quantity, supplier, confidence, approval requirement, explanation, risks, and unknowns.
- Show action buttons appropriate to decision type.

### Action Result

- Show action status, PO details if created, validation checks, pass/fail status, and recovery path.

### Evaluation View

- Show scenario name, expected decision, actual decision, validation status, pass/fail, and failure reason.

## 11. Test Strategy

### Unit Tests

- Supply calculations.
- Safety stock calculation.
- MOQ validation.
- Budget validation.
- Storage validation.
- Duplicate PO detection.
- Decision selection.
- Pre-action validation.
- Post-action validation.

### Integration Tests

- `POST /api/agent-runs` returns expected decision for seeded scenarios.
- `POST /api/agent-runs/{runId}/actions` executes and validates a PO.
- Action failure produces recovery.
- Missing data produces `investigate_further`.

### Evaluation Scenarios

Implement the six scenarios from `acceptance-criteria.md` and `requirements.md`.

## 12. Documentation Requirements

- README setup and run instructions.
- Architecture diagram.
- Approach and design tradeoffs.
- Mock API/data description.
- Test scenarios and evaluation approach.
- Validation feedback loop explanation.
- `.env.example`.

## 13. Known Non-Blocking Assumptions

- MVP is single-node but schemas retain `nodeId`.
- Safety stock policy is configurable.
- LLM is optional for explanation; deterministic rules must be sufficient for tests.
- Low-risk actions may be auto-executed only if configured; otherwise buyer approval is required.
