# Data Model: AI Purchasing Agent

Source inputs: PRD and engineering specs under `docs/`.

## 1. Storage Strategy

Use a mock repository owned by the application. Acceptable implementations:

1. In-memory store for the fastest demo.
2. JSON file-backed store for state inspection and persistence across reloads.
3. SQLite for more realistic relational storage.

Recommended MVP: in-memory store with deterministic seed/reset functions. This best fits the 6-8 hour assignment and avoids migration overhead.

## 2. Ownership

| Entity | Owner | Mutable During Demo | Notes |
| --- | --- | --- | --- |
| Product | Mock repository | No | Seed data |
| Inventory | Mock repository | Usually no | May remain static for demo |
| DemandForecast | Mock repository | No | Includes confidence and freshness |
| PurchaseRecommendation | Mock repository | Yes | Status changes after review/action |
| PurchaseOrder | Mock repository | Yes | Created/updated/invalidated by action service |
| SupplierOption | Mock repository | No | Seed data |
| ConstraintState | Mock repository | Optional | Can remain static or be updated after PO |
| AgentRun | Mock repository | Yes | Created per review |
| AuditEvent | Mock repository | Append-only | Ordered by timestamp/sequence |
| EvaluationScenario | Evaluation runner | No | Seeded expected outcomes |
| EvaluationResult | Mock repository or runner output | Yes | Created by evaluation run |

## 3. Entities

### Product

Fields:

- `productId` string, primary key.
- `sku` string, unique.
- `name` string.
- `categoryId` string.
- `unitCost` number.
- `casePackSize` positive integer.
- `unitsPerStorageSlot` positive integer.

Access patterns:

- Lookup by `productId`.
- Display by recommendation list/detail.

### Inventory

Fields:

- `productId` string.
- `nodeId` string.
- `onHandUnits` non-negative integer.
- `reservedUnits` non-negative integer.
- `availableUnits` non-negative integer.

Key:

- Composite key: `productId + nodeId`.

Validation:

- `reservedUnits` should not exceed `onHandUnits`.
- If `availableUnits` contradicts `onHandUnits - reservedUnits`, return an investigation warning.

### DemandForecast

Fields:

- `productId` string.
- `nodeId` string.
- `dailyForecastUnits` non-negative number.
- `forecastHorizonDays` positive integer.
- `confidence` number between 0 and 1.
- `lastUpdatedAt` ISO timestamp.

Key:

- Composite key: `productId + nodeId`.

Decision impact:

- Missing, stale, or low-confidence forecast can produce `investigate_further`.

### PurchaseRecommendation

Fields:

- `recommendationId` string, primary key.
- `productId` string.
- `nodeId` string.
- `recommendedQuantity` positive integer.
- `source` string.
- `status` enum: `pending`, `under_review`, `accepted`, `modified`, `rejected`, `investigation_required`, `escalated`.
- `createdAt` ISO timestamp.

Access patterns:

- List by status.
- Lookup by `recommendationId`.

### PurchaseOrder

Fields:

- `poId` string, primary key.
- `productId` string.
- `nodeId` string.
- `supplierId` string.
- `quantity` positive integer.
- `status` enum: `open`, `created`, `modified`, `validated`, `invalid`, `cancelled`.
- `expectedArrivalDate` date.
- `createdAt` ISO timestamp.
- `sourceRunId` optional string.

Access patterns:

- Lookup by `poId`.
- List open POs by `productId + nodeId`.
- Validate POs created by `sourceRunId`.

### SupplierOption

Fields:

- `supplierId` string.
- `productId` string.
- `availableQuantity` non-negative integer.
- `leadTimeDays` positive integer.
- `minimumOrderQuantity` positive integer.
- `unitCost` number.
- `reliabilityScore` number between 0 and 1.

Key:

- Composite key: `supplierId + productId`.

### ConstraintState

Fields:

- `categoryId` string.
- `nodeId` string.
- `budgetRemaining` non-negative number.
- `storageSlotsAvailable` non-negative integer.
- `maxUnitsStorable` non-negative integer.
- `approvalThresholdAmount` non-negative number.

Key:

- Composite key: `categoryId + nodeId`.

### AgentRun

Fields:

- `runId` string, primary key.
- `recommendationId` string.
- `status` enum: `created`, `running`, `decision_ready`, `action_pending`, `validating`, `completed`, `failed`, `recovery_required`.
- `decision` optional object.
- `actionResult` optional object.
- `validationResult` optional object.
- `startedAt` ISO timestamp.
- `completedAt` optional ISO timestamp.
- `durationMs` optional integer.
- `idempotencyKey` optional string.

Access patterns:

- Lookup by `runId`.
- Optional lookup by `idempotencyKey`.
- List latest runs for debugging.

### AuditEvent

Fields:

- `eventId` string, primary key.
- `runId` string.
- `sequence` integer.
- `type` enum.
- `timestamp` ISO timestamp.
- `summary` string.
- `payload` object.

Key/index:

- `runId + sequence`.

Lifecycle:

- Append-only during a run.

### EvaluationScenario

Fields:

- `scenarioId` string.
- `name` string.
- `fixtureSetId` string.
- `expectedDecision` enum.
- `expectedValidationStatus` enum or null.
- `expectedActionStatus` enum or null.

### EvaluationResult

Fields:

- `evaluationRunId` string.
- `scenarioId` string.
- `runId` string.
- `expectedDecision` enum.
- `actualDecision` enum.
- `expectedValidationStatus` enum or null.
- `actualValidationStatus` enum or null.
- `passed` boolean.
- `failureReason` string or null.

## 4. Relationships

- Product has many inventory records.
- Product has many forecasts.
- Product has many supplier options.
- Product has many purchase recommendations.
- Product has many purchase orders.
- PurchaseRecommendation has many agent runs.
- AgentRun has many audit events.
- AgentRun may produce one action result.
- AgentRun may produce one validation result.
- PurchaseOrder may be associated with an agent run through `sourceRunId`.

## 5. Consistency Model

MVP can use synchronous, strongly consistent in-process writes. The action service writes a PO and immediately invokes post-action validation against the same repository state.

Future real integrations would require eventual consistency handling, but that is out of scope for the assignment.

## 6. Lifecycle and Reset

- Seed data loads on app startup or evaluation reset.
- Evaluation runner should reset mutable state before each scenario or scenario group.
- Audit events remain available for the duration of the app session.
- README should state whether run state persists across reloads.

## 7. Migration Notes

No migrations are required for in-memory/JSON MVP. If SQLite is selected, define schema initialization in code and keep a reset script for evaluation fixtures.

