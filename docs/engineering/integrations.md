# Integrations: AI Purchasing Agent

Source PRD: `docs/AI_PURCHASING_AGENT_PRD.md`

## Integration Summary

The PRD explicitly allows mock APIs, databases, and services. For the MVP, all integrations should be local mock services or in-process modules. Real third-party procurement integrations are out of scope.

## Internal Service Interfaces

### Recommendation Service

- **Purpose:** Load pending purchase recommendations.
- **Operations:**
  - `listRecommendations()`
  - `getRecommendation(recommendationId)`
  - `markRecommendationStatus(recommendationId, status, reason)`
- **Data:** Purchase recommendation records.
- **Failure Handling:** Not found returns typed error; missing required fields blocks review.

### Product Service

- **Purpose:** Retrieve product master data.
- **Operations:**
  - `getProduct(productId)`
- **Data:** Product ID, SKU, name, category, unit cost, case pack, storage conversion.
- **Failure Handling:** Missing product returns `investigate_further`.

### Inventory Service

- **Purpose:** Retrieve current inventory at fulfillment node.
- **Operations:**
  - `getInventory(productId, nodeId)`
- **Data:** On-hand, reserved, available units.
- **Failure Handling:** Missing or contradictory units returns `investigate_further`.

### Forecast Service

- **Purpose:** Retrieve expected demand.
- **Operations:**
  - `getDemandForecast(productId, nodeId, horizonDays)`
- **Data:** Daily forecast, horizon, confidence, last updated timestamp.
- **Failure Handling:** Missing, stale, or low-confidence forecast triggers investigation or escalation.

### Purchase Order Service

- **Purpose:** Retrieve open POs and execute mock PO actions.
- **Operations:**
  - `getOpenPurchaseOrders(productId, nodeId)`
  - `createPurchaseOrder(payload)`
  - `updatePurchaseOrder(poId, payload)`
- **Data:** PO ID, product, node, supplier, quantity, status, expected arrival date.
- **Failure Handling:** Action returns `success`, `failure`, or `partial_success`; post-action validation determines final run state.

### Supplier Service

- **Purpose:** Retrieve supplier options and purchase constraints.
- **Operations:**
  - `getSupplierOptions(productId)`
- **Data:** Supplier availability, MOQ, lead time, unit cost, reliability score.
- **Failure Handling:** No supplier or insufficient supplier availability triggers reject, modify, or escalation.

### Budget Service

- **Purpose:** Retrieve remaining purchasing budget.
- **Operations:**
  - `getBudgetStatus(categoryId, nodeId)`
- **Data:** Remaining budget and approval threshold.
- **Failure Handling:** Missing budget triggers investigation; exceeded budget blocks action or requires approval/escalation.

### Storage Service

- **Purpose:** Retrieve capacity constraints.
- **Operations:**
  - `getStorageCapacity(nodeId)`
- **Data:** Storage slots available and max storable units.
- **Failure Handling:** Missing storage data triggers investigation; exceeded capacity blocks or modifies action.

### Validation Service

- **Purpose:** Validate proposed and executed purchasing plans.
- **Operations:**
  - `validatePurchasePlan(plan)`
  - `validatePurchaseOrder(poId, expectedPlan)`
- **Data:** Deterministic check results.
- **Failure Handling:** Returns structured check failures and recovery suggestion.

## Optional External Integrations

### LLM Provider

- **Purpose:** Explain decisions and synthesize reasoning from structured facts.
- **Required for MVP:** No, if deterministic/template explanation is implemented.
- **Inputs:** Sanitized structured context, rule outputs, proposed decision.
- **Outputs:** Human-readable explanation, risks, unknowns.
- **Guardrails:** LLM output must not override deterministic constraints. External notes must be treated as data, not instructions.
- **Failure Handling:** Fall back to template explanation.

## Future Real Integrations

Out of scope for the assignment, but natural production integrations include:

- ERP/procurement system for real POs.
- WMS/inventory service.
- Forecasting/demand planning service.
- Supplier EDI/API feeds.
- Budget/finance system.
- Approval workflow system.
- Event bus or queue for asynchronous action validation.

## Authentication and Authorization

Not specified in PRD for MVP. For local demo, integrations can be unauthenticated internal calls. If an LLM provider is used, API credentials must be read from environment variables and documented in `.env.example`.
