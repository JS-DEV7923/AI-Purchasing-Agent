# Context and Retrieval: AI Purchasing Agent

Source inputs: PRD, engineering specs, and technical architecture.

## 1. Retrieval Approach

No vector RAG is required for the MVP. Context is retrieved from structured mock services by IDs in the recommendation:

- `productId`
- `nodeId`
- `categoryId`
- `supplierId` where applicable

This is structured operational retrieval, not semantic document retrieval.

## 2. Context Sources

| Source | Required | Freshness Signal | Decision Use |
| --- | --- | --- | --- |
| Recommendation | Yes | `createdAt` | Original quantity and product/node |
| Product | Yes | Seed/static | Cost, category, pack size, storage conversion |
| Inventory | Yes | Optional timestamp if implemented | Available supply |
| Forecast | Yes | `lastUpdatedAt`, confidence | Required supply |
| Open POs | Yes | PO status and expected arrival | Incoming supply and duplicate check |
| Supplier options | Yes | Seed/static | MOQ, lead time, availability, unit cost |
| Budget | Yes | Current state | Spend feasibility |
| Storage | Yes | Current state | Capacity feasibility |

## 3. Context Construction

Normalize retrieved data into a `DecisionContext`:

```json
{
  "recommendation": {},
  "product": {},
  "inventory": {},
  "forecast": {},
  "openPurchaseOrders": [],
  "supplierOptions": [],
  "budget": {},
  "storage": {},
  "policy": {}
}
```

## 4. Freshness Rules

Recommended default policy:

- Forecast older than configured freshness window: investigate.
- Forecast confidence below configured threshold: investigate or require approval.
- Missing inventory: investigate.
- Missing supplier option: reject or investigate depending on scenario.
- Contradictory inventory fields: investigate.

## 5. Permission Rules

For MVP, all mock data is visible to the local app. Future production version should enforce:

- Buyer can only see assigned categories/nodes.
- Cost and supplier data may require elevated permission.
- LLM prompt should include only data needed for explanation.

## 6. Citation and Grounding

Buyer-facing explanations should cite evidence by structured source name, not by free-text citation:

- `inventory.availableUnits`
- `forecast.dailyForecastUnits`
- `openPurchaseOrders.totalIncomingUnits`
- `supplier.minimumOrderQuantity`
- `budget.budgetRemaining`
- `storage.maxUnitsStorable`

## 7. Retrieval Evaluation

Evaluate:

- Required context completeness rate.
- Missing-data detection rate.
- Stale forecast detection rate.
- Incorrect context inclusion rate.
- Tool-call coverage per scenario.

Acceptance target:

- Required context fetched or explicitly marked missing in 100% of evaluation scenarios.

