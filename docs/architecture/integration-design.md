# Integration Design: AI Purchasing Agent

Source inputs: PRD and engineering specs under `docs/`.

## 1. Integration Philosophy

The assignment should use local mock integrations while preserving clean boundaries for future real systems. The architecture treats each operational data domain as a typed service, even when backed by the same mock repository.

## 2. Internal Mock Integrations

| Service | Protocol | Backing Store | Retry Needed | Fallback |
| --- | --- | --- | --- | --- |
| Recommendation service | In-process function or local API | Mock repository | No | 404 or typed missing data |
| Product service | In-process function or local API | Mock repository | No | `investigate_further` |
| Inventory service | In-process function or local API | Mock repository | No | `investigate_further` |
| Forecast service | In-process function or local API | Mock repository | No | `investigate_further` |
| PO service | In-process function or local API | Mock repository | No | action failure |
| Supplier service | In-process function or local API | Mock repository | No | reject, modify, or escalate |
| Budget service | In-process function or local API | Mock repository | No | `investigate_further` |
| Storage service | In-process function or local API | Mock repository | No | `investigate_further` |
| Validation service | In-process function | Rule engine and repository | No | validation failure |

## 3. Optional LLM Provider

### Purpose

Generate buyer-readable explanation text from structured facts, rule checks, and the deterministic decision.

### Required for MVP

No. The architecture requires a deterministic/template fallback so the demo can run without API keys.

### Credential Handling

- Read provider API key from environment variable.
- Document variable in `.env.example`.
- Never commit secrets.

### Request Shape

The LLM adapter should receive only sanitized structured context:

```json
{
  "decision": {},
  "facts": {},
  "ruleChecks": [],
  "risks": [],
  "unknowns": []
}
```

### Response Shape

The adapter must parse to a constrained schema:

```json
{
  "summary": "string",
  "keyFactors": ["string"],
  "risks": ["string"],
  "unknowns": ["string"]
}
```

### Timeout and Retry

- Timeout: 3 seconds recommended for local demo.
- Retry: one retry maximum, only for transient provider/network failure.
- Fallback: template explanation.

### Safety

- LLM cannot execute actions.
- LLM cannot change decision type, final quantity, supplier, rule checks, or validation result.
- Supplier notes and recommendation reasons must be framed as untrusted data.

## 4. Future Production Integrations

These are out of scope but inform boundary design:

| Future System | Replacement Boundary | Notes |
| --- | --- | --- |
| ERP/procurement | Purchase order service | Add idempotent command IDs and reconciliation |
| WMS/inventory | Inventory service | Add freshness, caching, and partial outage behavior |
| Forecasting | Forecast service | Add model/version metadata and confidence semantics |
| Supplier API/EDI | Supplier service | Add rate limits, supplier-specific failures, and partial fulfillments |
| Budget/finance | Budget service | Add authorization and audit controls |
| Approval workflow | Action service approval check | Add asynchronous approval state |

## 5. Webhooks and Async Events

Not required for MVP. All workflows can be synchronous. If a future real supplier or ERP integration is added, create async events for:

- `PurchaseOrderRequested`
- `PurchaseOrderCreated`
- `PurchaseOrderFailed`
- `SupplierPartialFulfillment`
- `ValidationFailed`

## 6. Sandbox and Testing Needs

- Seed data must represent integration edge cases:
  - Missing forecast.
  - Low forecast confidence.
  - Supplier availability shortage.
  - MOQ violation.
  - Budget exceeded.
  - Storage exceeded.
  - Action partial success.
- Evaluation must use the same service boundaries as the UI and API.

