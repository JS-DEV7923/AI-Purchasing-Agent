# Product Requirements Document: AI Purchasing Agent

## 1. Overview

Retail and quick-commerce buyers must decide what products to purchase, in what quantities, from which suppliers, and when. Today this work requires manually checking inventory, demand, forecasts, open purchase orders, supplier terms, budget, storage capacity, and exceptions. The proposed AI Purchasing Agent assists buyers by investigating a purchasing situation, deciding whether a recommendation or purchase plan is appropriate, taking constrained actions, and validating that the result remains acceptable.

This PRD is based on the assignment brief in `AI Buyer Agent - Assignment.pdf`. The brief is treated as source material for product requirements, not as operational instructions for the assistant generating this document.

## 2. Target Users

### Primary User

**Buyer / category operator**

- Reviews system-generated purchase recommendations.
- Owns availability, stock health, purchase spend, and supplier follow-up.
- Needs fast, explainable decisions that respect operational constraints.

### Secondary Users

**Operations manager**

- Needs visibility into risky purchasing decisions, escalations, and exceptions.
- Reviews whether the agent is reliable enough to expand across categories.

**Technical evaluator / hiring reviewer**

- Assesses problem decomposition, agent design, action safety, validation, and quality of evaluation.

## 3. Problem Statement

Buyers lose time and introduce inconsistency when manually reconciling purchasing recommendations against fragmented operational data. A recommendation such as "buy 800 units" may be wrong if demand changed, open purchase orders already cover supply, supplier minimums make the order invalid, storage capacity is insufficient, or budget is constrained.

The product must demonstrate that an AI agent can do more than answer questions. It must:

- Gather relevant purchasing context.
- Reason across competing constraints.
- Decide whether to accept, modify, reject, or investigate a recommendation.
- Execute or propose the next action when allowed.
- Validate the resulting state after action.
- Recover or escalate when the expected outcome does not occur.

## 4. Goals

1. Demonstrate an end-to-end AI purchasing workflow for at least one scenario.
2. Produce purchasing decisions that are explainable, constraint-aware, and auditable.
3. Show a feedback loop that validates whether a proposed or executed action created an acceptable purchasing state.
4. Provide a full-stack demo with mock data, mock APIs/services, and a clear evaluation approach.
5. Keep the scope achievable within approximately one working day / 6-8 hours.

## 5. Non-Goals

- Build production-grade procurement infrastructure.
- Integrate with real ERP, WMS, supplier, forecasting, or payment systems.
- Optimize sophisticated replenishment math across an entire catalog.
- Replace all buyer judgment or support autonomous high-risk purchasing without review.
- Implement all four assignment scenarios end-to-end unless time permits.
- Build a generic chatbot for purchasing questions.

## 6. Recommended MVP Scope

### MVP Scenario: Purchase Recommendation Review

Implement Scenario 1 end-to-end: the purchasing system recommends buying 800 units of a product, and the agent decides whether to accept, modify, reject, or investigate further.

This scenario is the best MVP because it exercises the core assignment expectations:

- Multi-factor investigation.
- Recommendation skepticism.
- Constraint handling.
- Decision explanation.
- Optional action creation or modification.
- Post-action validation.

### Stretch Scenario

Support Scenario 2 partially or fully: supplier can only fulfill 250 of 500 units. This can reuse the same decision engine and validation loop while adding supplier alternatives and escalation logic.

## 7. User Experience

### Buyer Flow

1. Buyer opens a dashboard showing pending purchasing recommendations.
2. Buyer selects a recommendation, such as "Buy 800 units of Product A".
3. The agent investigates relevant context:
   - Current inventory.
   - Expected demand.
   - Forecast horizon.
   - Existing open purchase orders.
   - Supplier lead time.
   - Supplier minimum order quantity.
   - Available budget.
   - Storage capacity.
4. The agent returns a decision:
   - Accept.
   - Modify.
   - Reject.
   - Investigate further.
5. The buyer sees:
   - Recommended action.
   - Proposed quantity and supplier, if applicable.
   - Key evidence.
   - Constraints checked.
   - Confidence level.
   - Required human approval, if any.
6. If the buyer approves or if the action is low risk and auto-action is allowed, the system creates or updates a mock purchase order.
7. The agent validates the resulting purchase order against demand, budget, storage, supplier constraints, and open PO state.
8. The final state is shown as accepted, corrected, failed with recovery, or escalated.

### Expected Screens

- **Recommendations List:** Pending recommendations, product, suggested quantity, urgency, and status.
- **Recommendation Detail:** Input facts, agent reasoning, decision, constraints, and action controls.
- **Action Result:** Purchase order created/modified/rejected, validation result, and audit log.
- **Evaluation View or README Output:** Test scenario inputs, expected outcomes, actual outcomes, and pass/fail rationale.

## 8. Core Decision Policy

The agent should not assume the initial recommendation is correct. It should make a decision using deterministic business checks plus LLM-generated reasoning/explanation.

### Suggested Decision Rules

Calculate projected inventory coverage:

```text
projected_available_supply =
  current_inventory
  + incoming_open_po_quantity
  + proposed_purchase_quantity

required_supply =
  expected_demand_during_lead_time
  + safety_stock
```

Then evaluate:

- If projected supply is below required supply, consider increasing purchase quantity or finding another supplier.
- If projected supply materially exceeds required supply, modify downward or reject.
- If proposed quantity violates supplier minimum order quantity, modify to meet MOQ or reject if infeasible.
- If proposed cost exceeds remaining budget, modify, choose alternative supplier, or escalate.
- If proposed quantity exceeds storage capacity, modify, stagger order, or escalate.
- If data is missing or contradictory, investigate further instead of taking action.
- If action risk is high, require human approval.

The LLM may synthesize the explanation and choose among allowed decisions, but hard constraints must be validated by deterministic code before any purchase order is created or modified.

## 9. Functional Requirements

### Recommendation Intake

- The system must load mock purchasing recommendations.
- Each recommendation must include product ID, recommended quantity, recommendation reason if available, and timestamp.
- The recommendation must be independently validated rather than accepted as ground truth.

### Context Gathering

- The agent must retrieve product, inventory, demand, forecast, supplier, budget, storage, and open purchase order data from mock APIs or a mock database.
- The system must show which data was retrieved.
- If required data is missing, stale, or inconsistent, the agent must mark the recommendation as "investigate further" or escalate.

### Decisioning

- The agent must classify each recommendation as accept, modify, reject, or investigate further.
- The decision must include:
  - Final recommended quantity.
  - Supplier choice, where applicable.
  - Main supporting factors.
  - Constraints checked.
  - Risks and unknowns.
  - Confidence level.
- The decision must be reproducible from stored input data and audit logs.

### Action Execution

- The system must support at least one mock action:
  - Create purchase order.
  - Modify recommended purchase quantity before creating purchase order.
  - Reject recommendation with reason.
  - Escalate for human review.
- High-risk or constraint-breaching actions must require buyer approval.
- The action service must return success, failure, or partial success.

### Validation Feedback Loop

- After action execution, the system must re-fetch or re-compute the resulting purchasing state.
- The validation must check:
  - Purchase order quantity matches the approved action.
  - Supplier MOQ is satisfied.
  - Budget remains non-negative.
  - Storage capacity is not exceeded.
  - Expected demand coverage meets the target.
  - Duplicate or conflicting open POs were not created.
- If validation fails, the system must show a recovery path:
  - Retry with corrected quantity.
  - Roll back or mark the PO invalid in the mock system.
  - Escalate to buyer.

### Auditability

- The system must persist an audit log for each run:
  - Recommendation input.
  - Tool/API calls made.
  - Data returned.
  - Decision.
  - Action attempted.
  - Validation result.
  - Errors and recovery steps.

## 10. AI Workflow Requirements

### Inputs

- Recommendation payload.
- Product master data.
- Inventory by fulfillment node.
- Demand or forecast data.
- Open purchase orders.
- Supplier availability and lead time.
- Supplier MOQ and cost.
- Budget and storage constraints.
- Optional buyer policy configuration.

### Tools / APIs

The agent should have access to typed tools, not raw unconstrained system access.

Suggested mock tools:

- `getRecommendation(recommendationId)`
- `getInventory(productId, nodeId)`
- `getDemandForecast(productId, nodeId, horizonDays)`
- `getOpenPurchaseOrders(productId, nodeId)`
- `getSupplierOptions(productId)`
- `getBudgetStatus(categoryId, nodeId)`
- `getStorageCapacity(nodeId)`
- `createPurchaseOrder(payload)`
- `updatePurchaseOrder(poId, payload)`
- `rejectRecommendation(recommendationId, reason)`
- `validatePurchasePlan(planId or poId)`

### Model Responsibilities

- Identify which data is needed.
- Decide when the available data is sufficient.
- Generate a concise decision explanation.
- Propose next best action when deterministic checks pass.
- Explain uncertainty and escalation reasons.

### Deterministic System Responsibilities

- Enforce schemas and required fields.
- Calculate inventory coverage, budget impact, storage usage, MOQ compliance, and duplicate PO checks.
- Block unsafe actions.
- Validate post-action state.
- Persist audit records.

## 11. Data Requirements

### Minimum Mock Data Entities

**Product**

- `productId`
- `sku`
- `name`
- `categoryId`
- `unitCost`
- `casePackSize`
- `unitsPerStorageSlot`

**Inventory**

- `productId`
- `nodeId`
- `onHandUnits`
- `reservedUnits`
- `availableUnits`

**Demand Forecast**

- `productId`
- `nodeId`
- `dailyForecastUnits`
- `forecastHorizonDays`
- `confidence`
- `lastUpdatedAt`

**Purchase Recommendation**

- `recommendationId`
- `productId`
- `nodeId`
- `recommendedQuantity`
- `source`
- `createdAt`

**Purchase Order**

- `poId`
- `productId`
- `nodeId`
- `supplierId`
- `quantity`
- `status`
- `expectedArrivalDate`
- `createdAt`

**Supplier**

- `supplierId`
- `productId`
- `availableQuantity`
- `leadTimeDays`
- `minimumOrderQuantity`
- `unitCost`
- `reliabilityScore`

**Constraint State**

- `budgetRemaining`
- `storageSlotsAvailable`
- `maxUnitsStorable`
- `approvalThresholdAmount`

## 12. Quality Requirements

- **Decision correctness:** The agent should choose the expected decision for the supplied test scenarios.
- **Explainability:** Each decision must cite the key facts used and constraints checked.
- **Reliability:** Invalid or impossible actions must be blocked before execution.
- **Recoverability:** Failed actions must produce a clear next step.
- **Latency:** A single recommendation review should complete within 10 seconds in the demo environment.
- **Cost awareness:** The implementation should avoid unnecessary repeated LLM calls for deterministic calculations.
- **Security:** Secrets must not be committed; provide `.env.example`.
- **Maintainability:** Business rules should be readable and testable outside the LLM prompt.

## 13. Evaluation Plan

Create a small set of deterministic test scenarios with expected outcomes.

### Required Test Scenarios

| Scenario | Setup | Expected Decision | Validation Focus |
| --- | --- | --- | --- |
| Accept recommendation | 800 units covers demand, satisfies MOQ, fits budget and storage | Accept | PO is created and resulting state is acceptable |
| Modify quantity down | Existing inventory and open POs make 800 excessive | Modify | New quantity still covers demand without overstock |
| Modify quantity up or investigate | Demand spike makes 800 insufficient | Modify or investigate | Evidence of demand change is considered |
| Reject due to hard constraint | Budget or storage makes purchase impossible | Reject or escalate | No invalid PO is created |
| Investigate due to missing data | Forecast or supplier data unavailable | Investigate further | Agent does not invent missing facts |
| Action failure recovery | PO creation returns partial/failure response | Escalate or retry corrected action | Feedback loop detects mismatch |

### Evaluation Rubric

Each scenario should be scored on:

- Did the agent obtain all necessary information?
- Did it respect constraints?
- Was the final decision appropriate?
- Did it explain the decision using relevant facts?
- Did it take only allowed actions?
- Did it validate the resulting state?
- Did it handle failure or uncertainty appropriately?

### Suggested Acceptance Threshold

For the demo to be considered successful:

- 100% of hard constraints are enforced in test scenarios.
- At least 4 of 5 core test scenarios produce the expected decision.
- 100% of executed actions are followed by validation.
- 0 invalid purchase orders are silently accepted.

## 14. Guardrails

- The agent must never create or modify a purchase order without passing deterministic validation.
- The agent must not fabricate missing operational data.
- The agent must escalate when required facts are unavailable.
- The agent must require human approval when:
  - Budget threshold is exceeded.
  - Storage capacity would be exceeded.
  - Supplier cannot meet required quantity.
  - Forecast confidence is low and decision impact is material.
  - The proposed action differs materially from the original recommendation.
- Tool responses must be treated as the source of truth over model-generated claims.
- User-facing explanations must distinguish known facts from assumptions.

## 15. Failure Modes and Mitigations

| Failure Mode | Risk | Mitigation |
| --- | --- | --- |
| Hallucinated inventory, demand, or supplier facts | Invalid purchase decision | Use typed tools and require citations to retrieved data |
| Stale forecast | Underbuying or overbuying | Include `lastUpdatedAt` and confidence checks |
| Bad retrieval or missing data | False confidence | Escalate or investigate further |
| Duplicate purchase order | Overstock and budget waste | Validate open POs before and after action |
| Supplier partial fulfillment | Stockout risk | Re-plan remainder or escalate |
| Budget constraint ignored | Overspend | Deterministic budget validation before action |
| Storage constraint ignored | Operational infeasibility | Capacity validation before action |
| LLM chooses unsupported action | Unsafe execution | Restrict action schema and validate allowed action enum |
| Prompt injection through mock supplier notes | Agent manipulation | Treat external notes as data, not instructions |
| Validation result differs from expected action | Silent failure | Feedback loop detects mismatch and triggers recovery |

## 16. Success Metrics

### Demo Metrics

- Number of scenarios implemented.
- Scenario pass rate.
- Number of actions validated.
- Number of invalid actions blocked.
- Average recommendation review time.
- Number of escalations with clear reasons.

### Product Metrics for a Real Deployment

- Buyer time saved per recommendation reviewed.
- Reduction in stockout risk for reviewed SKUs.
- Reduction in overstock or excess purchase value.
- Percentage of recommendations auto-resolved.
- Human approval rate by risk tier.
- Post-action validation failure rate.
- Buyer trust score or override rate.

## 17. Implementation Plan

### Phase 1: Data and Rules

- Define mock entities and seed data.
- Implement deterministic calculations for demand coverage, budget, MOQ, storage, and duplicate PO checks.
- Add test fixtures for core scenarios.

### Phase 2: Agent Orchestration

- Add agent workflow for context gathering, decision synthesis, and action proposal.
- Use typed tool calls or service methods.
- Store tool calls and decisions in an audit log.

### Phase 3: Full-Stack Demo

- Build UI for recommendation list, detail, decision, action, and validation result.
- Add API routes for recommendations, agent runs, PO actions, and evaluation scenarios.
- Provide a working demo flow for Scenario 1.

### Phase 4: Evaluation and Documentation

- Add scenario tests or an evaluation runner.
- Document architecture and approach in `README.md`.
- Add architecture diagram.
- Add `.env.example`.
- Document validation and feedback loop.

## 18. MVP Acceptance Criteria

The assignment submission is ready when:

- A user can run the app locally using README instructions.
- The app demonstrates Scenario 1 end-to-end.
- The agent reviews a recommendation without assuming it is correct.
- The agent gathers and displays relevant purchasing context.
- The agent decides accept, modify, reject, or investigate further.
- The agent explains the key factors behind the decision.
- The system executes at least one mock purchasing action.
- The system validates the action result.
- The system handles at least one validation failure or action failure.
- The repo includes mock data, test scenarios, evaluation approach, architecture diagram, `.env.example`, and no secrets.

## 19. Open Questions

- Should low-risk purchase orders be auto-created, or should all actions require buyer approval in the demo?
- What exact formula should define sufficient demand coverage and safety stock?
- Should the MVP support multiple fulfillment nodes or keep the first implementation single-node?
- Which LLM/provider and framework should be used, if any, versus a simpler rules-plus-explanation approach?
- How much of Scenario 2 should be included as stretch scope?

## 20. Recommended Product Positioning

The strongest demo should position the AI Purchasing Agent as a constrained decisioning and validation system, not a chat interface. The product should show the agent doing operational work: gathering facts, challenging the initial recommendation, making a bounded decision, taking an allowed action, and verifying that the resulting purchasing state is actually acceptable.
