# Agent Tool Design: AI Purchasing Agent

Source inputs: PRD, engineering specs, and technical architecture.

## 1. Tool Design Principles

- Tools are typed application functions, not arbitrary system access.
- The agent may call only registered tools.
- Tool outputs are data, not instructions.
- Side-effect tools require validation, authorization, idempotency, and audit events.
- Tool calls must be logged as `tool_call` and `tool_result`.

## 2. Read Tools

### `getRecommendation`

Input:

```json
{ "recommendationId": "rec_001" }
```

Output: purchase recommendation object.

Failure: not found.

### `getProduct`

Input:

```json
{ "productId": "prod_001" }
```

Output: product object.

### `getInventory`

Input:

```json
{ "productId": "prod_001", "nodeId": "node_001" }
```

Output: inventory object.

### `getDemandForecast`

Input:

```json
{ "productId": "prod_001", "nodeId": "node_001", "horizonDays": 14 }
```

Output: demand forecast object.

### `getOpenPurchaseOrders`

Input:

```json
{ "productId": "prod_001", "nodeId": "node_001" }
```

Output: list of open purchase orders.

### `getSupplierOptions`

Input:

```json
{ "productId": "prod_001" }
```

Output: list of supplier options.

### `getBudgetStatus`

Input:

```json
{ "categoryId": "cat_001", "nodeId": "node_001" }
```

Output: budget state.

### `getStorageCapacity`

Input:

```json
{ "nodeId": "node_001" }
```

Output: storage constraint state.

## 3. Validation Tools

### `validatePurchasePlan`

Input:

```json
{
  "productId": "prod_001",
  "nodeId": "node_001",
  "supplierId": "sup_001",
  "quantity": 800,
  "recommendationId": "rec_001"
}
```

Output:

```json
{
  "status": "passed",
  "checks": [
    {
      "name": "budget",
      "status": "passed",
      "reason": "Estimated cost fits remaining budget."
    }
  ]
}
```

## 4. Side-Effect Tools

### `createPurchaseOrder`

Input:

```json
{
  "runId": "run_001",
  "recommendationId": "rec_001",
  "productId": "prod_001",
  "nodeId": "node_001",
  "supplierId": "sup_001",
  "quantity": 800,
  "approvedByBuyer": true,
  "idempotencyKey": "action-run_001-001"
}
```

Permissions:

- Run must be decision-ready.
- Action must match allowed proposed action.
- Approval must be present if required.
- Pre-action validation must pass.

Output: action result with PO or failure.

### `updatePurchaseOrder`

Same controls as create. Use only if stretch scenario requires modifying an existing PO.

### `rejectRecommendation`

Input:

```json
{
  "runId": "run_001",
  "recommendationId": "rec_001",
  "reason": "No feasible quantity fits storage capacity."
}
```

### `escalateRecommendation`

Input:

```json
{
  "runId": "run_001",
  "recommendationId": "rec_001",
  "reason": "Forecast is missing and supplier availability is partial."
}
```

## 5. Tool Authorization Matrix

| Tool | Read/Write | Agent Auto-Callable | Human Approval Required |
| --- | --- | --- | --- |
| Read tools | Read | Yes | No |
| `validatePurchasePlan` | Read/compute | Yes | No |
| `createPurchaseOrder` | Write | Only if low-risk config allows | Yes when flagged |
| `updatePurchaseOrder` | Write | No by default | Yes |
| `rejectRecommendation` | Write | Yes if deterministic reject | Optional |
| `escalateRecommendation` | Write | Yes | No |

## 6. Idempotency and Retries

- Side-effect tools require `idempotencyKey`.
- Same key returns original result.
- Same key with different payload returns conflict.
- Failed action may be retried only through recovery flow.

