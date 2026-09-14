# User Stories: AI Purchasing Agent

Source PRD: `docs/AI_PURCHASING_AGENT_PRD.md`

## Epic E1: Recommendation Review

### US-001: View Pending Recommendations

- **Actor:** Buyer
- **Goal:** See pending purchase recommendations requiring review
- **Value:** Quickly identify which products need action
- **Priority:** Must
- **Source:** PRD sections 7, 9
- **Dependencies:** Mock recommendation data, recommendation API

**Story:** As a buyer, I want to view pending purchase recommendations so that I can choose which purchasing decision to review first.

### US-002: Inspect Recommendation Context

- **Actor:** Buyer
- **Goal:** See inventory, demand, open PO, supplier, budget, and storage context for a selected recommendation
- **Value:** Understand why the agent made its decision
- **Priority:** Must
- **Source:** PRD sections 7, 9, 10
- **Dependencies:** Context retrieval services

**Story:** As a buyer, I want the system to retrieve and display the relevant operational facts so that I can trust the recommendation review.

### US-003: Receive Decision Classification

- **Actor:** Buyer
- **Goal:** Get an accept, modify, reject, or investigate decision
- **Value:** Turn a raw recommendation into a concrete next step
- **Priority:** Must
- **Source:** PRD sections 7, 8, 9
- **Dependencies:** Decision engine, validation rules

**Story:** As a buyer, I want the agent to classify the recommendation so that I can act without manually reconciling every constraint.

### US-004: Review Decision Explanation

- **Actor:** Buyer
- **Goal:** See the facts, constraints, confidence, risks, and unknowns behind the decision
- **Value:** Verify that the agent used the right information
- **Priority:** Must
- **Source:** PRD sections 7, 9, 12
- **Dependencies:** Decision response schema, audit log

**Story:** As a buyer, I want an explanation grounded in retrieved data so that I can understand and override the decision if needed.

## Epic E2: Safe Purchasing Actions

### US-005: Create Purchase Order After Valid Decision

- **Actor:** Buyer
- **Goal:** Create a mock purchase order after the system validates the plan
- **Value:** Demonstrate an end-to-end purchasing workflow
- **Priority:** Must
- **Source:** PRD sections 3, 9, 18
- **Dependencies:** Purchase order action service, validation engine

**Story:** As a buyer, I want the system to create a purchase order when the purchasing plan is valid so that the decision leads to operational action.

### US-006: Modify Quantity Before Action

- **Actor:** Buyer
- **Goal:** Act on a corrected quantity when the original recommendation is too high or too low
- **Value:** Avoid overstock, stockouts, and invalid orders
- **Priority:** Must
- **Source:** PRD sections 6, 8, 13
- **Dependencies:** Decision rules, PO action service

**Story:** As a buyer, I want the agent to propose a modified quantity when the original recommendation is wrong so that the resulting purchase plan fits reality.

### US-007: Escalate High-Risk or Ambiguous Cases

- **Actor:** Buyer
- **Goal:** Send risky or uncertain decisions to human review
- **Value:** Prevent unsafe automation
- **Priority:** Must
- **Source:** PRD sections 9, 14, 15
- **Dependencies:** Approval policy, escalation action state

**Story:** As a buyer, I want the system to escalate when facts are missing or constraints are breached so that invalid purchase orders are not created.

### US-008: Reject Invalid Recommendation

- **Actor:** Buyer
- **Goal:** Reject a recommendation with a reason when purchasing is not appropriate
- **Value:** Close the loop on invalid recommendations
- **Priority:** Should
- **Source:** PRD sections 9, 10
- **Dependencies:** Recommendation state model

**Story:** As a buyer, I want the system to reject a bad purchase recommendation with an auditable reason so that the recommendation queue stays clean.

## Epic E3: Validation Feedback Loop

### US-009: Validate Post-Action State

- **Actor:** Buyer
- **Goal:** Confirm that the created or modified PO actually satisfies constraints
- **Value:** Catch mismatches between intended and actual action outcomes
- **Priority:** Must
- **Source:** PRD sections 3, 9, 13, 18
- **Dependencies:** Validation service, audit log

**Story:** As a buyer, I want the system to validate the result after an action so that failures are detected immediately.

### US-010: Recover From Action Failure

- **Actor:** Buyer
- **Goal:** See retry, invalidation, or escalation when action execution fails
- **Value:** Avoid silent operational failure
- **Priority:** Must
- **Source:** PRD sections 9, 13, 15
- **Dependencies:** Mock failure scenario, recovery policy

**Story:** As a buyer, I want the system to propose a recovery path when a PO action fails so that I know what to do next.

## Epic E4: Evaluation and Auditability

### US-011: Run Evaluation Scenarios

- **Actor:** Technical evaluator
- **Goal:** Execute deterministic scenarios and compare actual outcomes to expected outcomes
- **Value:** Demonstrate correctness and reliability
- **Priority:** Must
- **Source:** PRD section 13
- **Dependencies:** Seed data, evaluation runner

**Story:** As a technical evaluator, I want a small deterministic scenario suite so that I can assess whether the agent behaves appropriately.

### US-012: Inspect Audit Log

- **Actor:** Operations manager
- **Goal:** Review tool calls, decisions, actions, validations, and errors
- **Value:** Understand system behavior and investigate failures
- **Priority:** Must
- **Source:** PRD sections 9, 12, 16
- **Dependencies:** Audit event persistence or in-memory run records

**Story:** As an operations manager, I want each agent run to produce an audit log so that decisions are traceable and debuggable.

### US-013: Review Submission Documentation

- **Actor:** Technical evaluator
- **Goal:** Read setup, architecture, approach, tests, and validation documentation
- **Value:** Evaluate the solution quickly and fairly
- **Priority:** Must
- **Source:** PRD section 18
- **Dependencies:** README, architecture diagram, `.env.example`

**Story:** As a technical evaluator, I want complete documentation so that I can run and understand the assignment without reverse engineering the codebase.
