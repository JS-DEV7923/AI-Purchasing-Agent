# API Contract: AI Purchasing Agent

Source inputs: PRD and engineering specs under `docs/`.

## 1. API Principles

- JSON over HTTP.
- All request payloads are schema-validated.
- Response shapes are stable for UI and evaluation runner.
- Domain errors use typed error codes.
- Actions are idempotency-aware.
- No authentication required for local MVP unless the chosen framework adds it.

## 2. Common Types

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Quantity must be a positive integer.",
    "details": {
      "field": "quantity"
    },
    "correlationId": "corr_001"
  }
}
```

### Audit Event

```json
{
  "eventId": "evt_001",
  "runId": "run_001",
  "type": "rule_check",
  "timestamp": "2026-09-14T00:00:00Z",
  "summary": "Budget check passed.",
  "payload": {}
}
```

### Decision

```json
{
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
}
```

## 3. Endpoints

### `GET /api/recommendations`

Returns pending recommendations.

Response 200:

```json
{
  "recommendations": [
    {
      "recommendationId": "rec_001",
      "productId": "prod_001",
      "productName": "Example Product",
      "sku": "SKU-001",
      "nodeId": "node_001",
      "recommendedQuantity": 800,
      "status": "pending",
      "createdAt": "2026-09-14T00:00:00Z"
    }
  ]
}
```

### `GET /api/recommendations/{recommendationId}`

Returns a recommendation and any currently available context.

Response 200:

```json
{
  "recommendation": {},
  "context": {
    "product": {},
    "inventory": {},
    "forecast": {},
    "openPurchaseOrders": [],
    "supplierOptions": [],
    "budget": {},
    "storage": {}
  }
}
```

Errors:

- 404 `RECOMMENDATION_NOT_FOUND`

### `POST /api/agent-runs`

Starts a recommendation review.

Request:

```json
{
  "recommendationId": "rec_001",
  "mode": "review_only",
  "idempotencyKey": "review-rec_001-001"
}
```

Response 201:

```json
{
  "runId": "run_001",
  "status": "decision_ready",
  "decision": {},
  "auditEvents": [],
  "durationMs": 250
}
```

Idempotency:

- If the same `idempotencyKey` and `recommendationId` are submitted again, return the existing run result.
- If the same key is reused for a different recommendation, return 409 `IDEMPOTENCY_CONFLICT`.

Errors:

- 400 `VALIDATION_ERROR`
- 404 `RECOMMENDATION_NOT_FOUND`
- 409 `RECOMMENDATION_ALREADY_UNDER_REVIEW`
- 500 `AGENT_RUN_FAILED`

### `GET /api/agent-runs/{runId}`

Returns run details.

Response 200:

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
  "completedAt": "2026-09-14T00:00:05Z",
  "durationMs": 5000
}
```

Errors:

- 404 `RUN_NOT_FOUND`

### `POST /api/agent-runs/{runId}/actions`

Executes an allowed action from a run decision.

Request:

```json
{
  "actionType": "create_po",
  "approvedByBuyer": true,
  "idempotencyKey": "action-run_001-001"
}
```

Response 200:

```json
{
  "runId": "run_001",
  "actionStatus": "success",
  "purchaseOrder": {},
  "validationResult": {
    "status": "passed",
    "checks": []
  },
  "recovery": null,
  "auditEvents": []
}
```

Idempotency:

- `idempotencyKey` prevents duplicate PO creation on retries.
- If the action already succeeded, return the original action result.
- If a previous action is in `recovery_required`, return 409 unless retry is explicitly supported.

Errors:

- 400 `VALIDATION_ERROR`
- 403 `APPROVAL_REQUIRED`
- 404 `RUN_NOT_FOUND`
- 409 `RUN_NOT_ACTIONABLE`
- 409 `IDEMPOTENCY_CONFLICT`
- 422 `PRE_ACTION_VALIDATION_FAILED`

### `POST /api/evaluations/run`

Runs deterministic evaluation scenarios.

Request:

```json
{
  "scenarioIds": ["accept_recommendation", "modify_down"],
  "resetState": true
}
```

Response 200:

```json
{
  "summary": {
    "total": 6,
    "passed": 6,
    "failed": 0,
    "durationMs": 1000
  },
  "results": [
    {
      "scenarioId": "accept_recommendation",
      "expectedDecision": "accept",
      "actualDecision": "accept",
      "expectedValidationStatus": "passed",
      "actualValidationStatus": "passed",
      "passed": true,
      "failureReason": null
    }
  ]
}
```

Errors:

- 400 `UNKNOWN_SCENARIO`
- 500 `EVALUATION_FAILED`

## 4. Versioning

MVP can expose unversioned `/api/*` routes. If the app evolves, introduce `/api/v1/*` before changing response shapes.

## 5. Compatibility Rules

- Do not rename enum values without updating tests and docs.
- Additive response fields are compatible.
- Removing fields from `Decision`, `ValidationResult`, or `AuditEvent` is breaking.

## 6. Commands and Events

This architecture does not require asynchronous event infrastructure. Internally, audit events are append-only records emitted synchronously during the request flow.

Required audit event types:

- `input`
- `tool_call`
- `tool_result`
- `rule_check`
- `decision`
- `action`
- `validation`
- `recovery`
- `error`

