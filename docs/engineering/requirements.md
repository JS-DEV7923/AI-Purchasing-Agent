# Engineering Requirements: AI Purchasing Agent

Source PRD: `docs/AI_PURCHASING_AGENT_PRD.md`

## PRD Validation Summary

The PRD is sufficient for implementation planning. The following ambiguities are non-blocking for the assignment demo and are captured as assumptions:

| ID | Ambiguity | Engineering Impact | Status | Working Assumption |
| --- | --- | --- | --- | --- |
| AMB-001 | Exact technology stack is not specified | Affects folder structure, runtime, SDKs, and test tools | Non-blocking | Use any full-stack stack; requirements are framework-agnostic |
| AMB-002 | Auto-action versus buyer approval policy is unresolved | Affects action flow and UI states | Non-blocking | Support approval-required flag; allow demo config to auto-execute low-risk actions |
| AMB-003 | Safety stock formula is not specified | Affects decision outcomes | Non-blocking | Use configurable safety stock days or fixed units in seed policy |
| AMB-004 | Single-node versus multi-node MVP is unresolved | Affects data model cardinality and UI complexity | Non-blocking | Implement single-node MVP with `nodeId` retained in schemas |
| AMB-005 | LLM provider/framework is not specified | Affects integration setup and deterministic test stability | Non-blocking | Keep deterministic rules authoritative; LLM is optional for explanation synthesis |
| AMB-006 | Stretch Scenario 2 scope is optional | Affects supplier fulfillment replanning | Non-blocking | Design interfaces to support it; implement only if time permits |

## Requirement Traceability

| ID | Engineering Requirement | Source PRD Section | Priority | Testable Behavior |
| --- | --- | --- | --- | --- |
| REQ-001 | The system shall load mock purchasing recommendations with product ID, node ID, quantity, source, and timestamp. | 9 Recommendation Intake, 11 Data Requirements | Must | API/UI returns seeded recommendations with required fields |
| REQ-002 | The system shall independently evaluate each recommendation rather than accepting the suggested quantity as correct. | 3 Problem Statement, 8 Core Decision Policy | Must | Test scenarios show accept, modify, reject, and investigate outcomes |
| REQ-003 | The agent workflow shall gather product, inventory, forecast, open PO, supplier, budget, and storage data before deciding. | 7 Buyer Flow, 9 Context Gathering, 10 Inputs | Must | Audit log includes successful or failed retrieval for each required data type |
| REQ-004 | The system shall expose typed data access functions or APIs for recommendation, inventory, forecast, purchase orders, supplier options, budget, and storage. | 10 Tools / APIs | Must | Agent code uses typed interfaces, not ad hoc free-form data access |
| REQ-005 | The system shall calculate projected available supply and required supply using deterministic code. | 8 Suggested Decision Rules | Must | Unit tests verify projected supply and required supply calculations |
| REQ-006 | The system shall validate supplier minimum order quantity before any PO creation or update. | 8 Suggested Decision Rules, 9 Validation Feedback Loop | Must | Invalid MOQ scenario is blocked or modified |
| REQ-007 | The system shall validate available purchasing budget before any PO creation or update. | 8 Suggested Decision Rules, 9 Validation Feedback Loop | Must | Over-budget scenario cannot silently create a PO |
| REQ-008 | The system shall validate storage capacity before any PO creation or update. | 8 Suggested Decision Rules, 9 Validation Feedback Loop | Must | Over-capacity scenario cannot silently create a PO |
| REQ-009 | The system shall check existing open POs before decisioning and after action execution. | 9 Context Gathering, 9 Validation Feedback Loop | Must | Duplicate or excessive open PO scenario is detected |
| REQ-010 | The agent shall classify each recommendation as `accept`, `modify`, `reject`, or `investigate_further`. | 7 Buyer Flow, 9 Decisioning | Must | Decision API response uses only supported enum values |
| REQ-011 | Each decision shall include final quantity, supplier where applicable, key evidence, constraints checked, risks, unknowns, and confidence. | 7 Buyer Flow, 9 Decisioning | Must | Decision response schema validates required explanation fields |
| REQ-012 | The system shall support at least one executable mock action: create PO, modify before PO creation, reject recommendation, or escalate. | 9 Action Execution | Must | At least one happy-path PO action is executable from UI/API |
| REQ-013 | High-risk or constraint-breaching actions shall require buyer approval or escalation. | 9 Action Execution, 14 Guardrails | Must | Approval-required flag is returned and enforced before action |
| REQ-014 | The action service shall return success, failure, or partial success. | 9 Action Execution | Must | Mock action failure scenario returns a machine-readable failure state |
| REQ-015 | The system shall validate resulting purchasing state after every executed action. | 3 Problem Statement, 9 Validation Feedback Loop, 13 Evaluation Plan | Must | Every action event is followed by a validation event |
| REQ-016 | Failed validation shall trigger a recovery path: retry, rollback/invalid marking, or escalation. | 9 Validation Feedback Loop, 15 Failure Modes | Must | Action failure recovery scenario produces recovery recommendation |
| REQ-017 | The system shall persist or expose an audit log of recommendation input, tool calls, data returned, decision, action, validation, and errors. | 9 Auditability | Must | Run detail shows ordered audit events |
| REQ-018 | The UI shall provide recommendation list, recommendation detail, action result, and evaluation output. | 7 Expected Screens | Should | Demo can be completed without direct database inspection |
| REQ-019 | The system shall include deterministic test scenarios for accept, modify down, modify up/investigate, reject/escalate, missing data, and action failure recovery. | 13 Evaluation Plan | Must | Evaluation runner or tests report pass/fail for scenarios |
| REQ-020 | Hard constraints shall be enforced in 100% of test scenarios. | 13 Suggested Acceptance Threshold | Must | Tests fail if invalid PO is accepted |
| REQ-021 | At least 4 of 5 core scenarios shall produce expected decisions. | 13 Suggested Acceptance Threshold | Should | Evaluation summary includes scenario pass rate |
| REQ-022 | Recommendation review shall complete within 10 seconds in the demo environment. | 12 Quality Requirements | Should | Instrumented duration is recorded per run |
| REQ-023 | Business rules shall be readable and testable outside the LLM prompt. | 12 Quality Requirements | Must | Rule functions have unit tests independent of LLM |
| REQ-024 | The implementation shall provide `.env.example` and avoid committing secrets. | 12 Quality Requirements, 18 MVP Acceptance Criteria | Must | Repository contains `.env.example` and no secret literals |
| REQ-025 | Documentation shall include setup/run instructions, architecture diagram, approach, test scenarios, evaluation approach, mock data, and validation explanation. | 18 MVP Acceptance Criteria | Must | README and docs contain required submission materials |

## Out of Scope Requirements

- Real ERP, WMS, supplier, forecasting, payment, or procurement integrations.
- Production-grade infrastructure, deployment, authentication, or compliance controls.
- Multi-category optimization across the entire catalog.
- Autonomous high-risk purchasing without human approval.
