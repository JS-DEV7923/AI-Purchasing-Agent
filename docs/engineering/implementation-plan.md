# Implementation Plan: AI Purchasing Agent

Source PRD: `docs/AI_PURCHASING_AGENT_PRD.md`

## Sequencing Overview

Implement the deterministic domain core first, then API orchestration, then UI, then evaluation and documentation. This keeps the assignment centered on purchasing decisions, action validation, and feedback loops.

## Tasks

### ENG-001: Scaffold Application

- **Objective:** Create the full-stack project structure.
- **Description:** Set up the chosen framework, scripts, lint/test commands, and basic app shell.
- **Dependencies:** None.
- **Affected Components:** Frontend, backend/API, test runner.
- **Expected Behavior:** App starts locally and displays a minimal page.
- **Acceptance Criteria:** README command starts local app; health route or home page loads.
- **Tests Required:** Smoke test or manual local run.
- **Definition of Done:** Project structure, scripts, and baseline page/API are committed.

### ENG-002: Define Domain Schemas

- **Objective:** Create typed domain models for purchasing data.
- **Description:** Define product, inventory, forecast, recommendation, PO, supplier, constraint state, decision, action result, validation result, and audit event schemas.
- **Dependencies:** ENG-001.
- **Affected Components:** Domain layer, API validation, mock data.
- **Expected Behavior:** Invalid payloads are rejected or fail validation in tests.
- **Acceptance Criteria:** Schemas cover all PRD data entities and decision/action enums.
- **Tests Required:** Schema validation tests.
- **Definition of Done:** Domain types are used by services and API contracts.

### ENG-003: Seed Mock Data

- **Objective:** Create deterministic mock data for MVP and evaluation scenarios.
- **Description:** Add seed records for products, inventory, forecasts, open POs, suppliers, budgets, storage, and recommendations.
- **Dependencies:** ENG-002.
- **Affected Components:** Mock repository, evaluation runner.
- **Expected Behavior:** Seed data supports accept, modify down, modify up/investigate, reject/escalate, missing data, and action failure scenarios.
- **Acceptance Criteria:** Each required scenario has named fixture data.
- **Tests Required:** Fixture completeness test.
- **Definition of Done:** Scenario fixtures are documented and loadable.

### ENG-004: Build Mock Repository and Service Interfaces

- **Objective:** Implement typed data access services.
- **Description:** Add services for recommendations, products, inventory, forecasts, POs, suppliers, budget, storage, and validation.
- **Dependencies:** ENG-002, ENG-003.
- **Affected Components:** Backend/services.
- **Expected Behavior:** Services return typed data or typed not-found/missing-data errors.
- **Acceptance Criteria:** All PRD mock tools have corresponding service methods.
- **Tests Required:** Service retrieval tests.
- **Definition of Done:** Agent orchestration can use services without direct fixture access.

### ENG-005: Implement Rule Engine

- **Objective:** Implement deterministic purchasing calculations and constraints.
- **Description:** Add projected supply, required supply, safety stock, MOQ, budget, storage, supplier availability, and duplicate PO checks.
- **Dependencies:** ENG-002, ENG-004.
- **Affected Components:** Rule engine, validation service.
- **Expected Behavior:** Rule engine returns structured pass/fail/warning checks.
- **Acceptance Criteria:** Hard constraints are evaluated outside any LLM prompt.
- **Tests Required:** Unit tests for each calculation and constraint.
- **Definition of Done:** Rule engine can evaluate a proposed plan and explain check outcomes.

### ENG-006: Implement Decision Engine

- **Objective:** Convert rule outputs into accept/modify/reject/investigate decisions.
- **Description:** Add decision selection, quantity adjustment, approval requirement, risks, unknowns, evidence, and confidence.
- **Dependencies:** ENG-005.
- **Affected Components:** Agent core.
- **Expected Behavior:** Decision engine returns supported decision enum and structured explanation fields.
- **Acceptance Criteria:** Required test scenarios produce expected structured decisions.
- **Tests Required:** Scenario-level decision tests.
- **Definition of Done:** Decision engine passes deterministic tests without LLM.

### ENG-007: Add Optional Explanation Synthesizer

- **Objective:** Generate buyer-readable explanations from structured facts.
- **Description:** Implement either template explanations or an optional LLM adapter with deterministic fallback.
- **Dependencies:** ENG-006.
- **Affected Components:** Agent core, configuration.
- **Expected Behavior:** Explanation never changes deterministic decision or constraints.
- **Acceptance Criteria:** LLM failure falls back to template explanation.
- **Tests Required:** Fallback test; schema parsing test if LLM is used.
- **Definition of Done:** Explanations include evidence, constraints checked, risks, unknowns, and confidence.

### ENG-008: Implement Agent Run Orchestrator

- **Objective:** Coordinate context gathering, decisioning, and audit logging.
- **Description:** Create agent run lifecycle, ordered tool calls, rule checks, decision persistence, and run status updates.
- **Dependencies:** ENG-004, ENG-005, ENG-006, ENG-007.
- **Affected Components:** Agent orchestrator, audit logger.
- **Expected Behavior:** A run returns decision and audit events for a recommendation.
- **Acceptance Criteria:** Audit includes input, tool calls/results, rule checks, decision, and errors.
- **Tests Required:** Orchestrator integration tests.
- **Definition of Done:** `POST /api/agent-runs` can be backed by orchestrator behavior.

### ENG-009: Implement Action Service

- **Objective:** Execute allowed mock purchasing actions.
- **Description:** Support create PO, update PO if needed, reject recommendation, and escalate. Include configurable failure/partial success fixtures.
- **Dependencies:** ENG-004, ENG-006.
- **Affected Components:** PO service, recommendation service, action layer.
- **Expected Behavior:** Action service returns success, failure, or partial success with structured details.
- **Acceptance Criteria:** Unsupported or unapproved actions are rejected.
- **Tests Required:** Action success, failure, partial success, and unsupported action tests.
- **Definition of Done:** Actions can be invoked through API or orchestrator and recorded in audit.

### ENG-010: Implement Validation Feedback Loop

- **Objective:** Validate resulting state after every action.
- **Description:** Re-fetch/recompute state and verify PO quantity, supplier, budget, storage, demand coverage, and duplicates.
- **Dependencies:** ENG-005, ENG-009.
- **Affected Components:** Validation service, agent run lifecycle.
- **Expected Behavior:** Every executed action has a validation result and possible recovery.
- **Acceptance Criteria:** Partial/failure action scenario produces recovery/escalation, not success.
- **Tests Required:** Post-action validation tests and action failure recovery scenario.
- **Definition of Done:** No action path can complete without validation.

### ENG-011: Expose API Endpoints

- **Objective:** Provide frontend and evaluator access to recommendations, runs, actions, and evaluations.
- **Description:** Implement endpoints specified in `engineering-spec.md`.
- **Dependencies:** ENG-008, ENG-009, ENG-010.
- **Affected Components:** API layer.
- **Expected Behavior:** APIs return typed JSON with proper error statuses.
- **Acceptance Criteria:** Endpoint responses match documented contracts.
- **Tests Required:** API integration tests.
- **Definition of Done:** Frontend can complete MVP flow using API only.

### ENG-012: Build Recommendation List UI

- **Objective:** Display pending recommendations.
- **Description:** Build list/table with product, node, recommended quantity, status, and navigation to detail.
- **Dependencies:** ENG-011.
- **Affected Components:** Frontend.
- **Expected Behavior:** Buyer can select a recommendation for review.
- **Acceptance Criteria:** Seeded recommendations render in the UI.
- **Tests Required:** Component/render smoke test or manual verification.
- **Definition of Done:** Recommendation list is functional and connected to API.

### ENG-013: Build Recommendation Detail and Decision UI

- **Objective:** Show context, decision, explanation, and actions.
- **Description:** Display retrieved facts, constraints checked, decision, final quantity, confidence, risks, unknowns, and action controls.
- **Dependencies:** ENG-011, ENG-012.
- **Affected Components:** Frontend.
- **Expected Behavior:** Buyer can run agent review and inspect decision.
- **Acceptance Criteria:** UI shows all required decision fields from PRD.
- **Tests Required:** UI smoke test or manual verification with seeded scenario.
- **Definition of Done:** End-to-end review is visible in browser.

### ENG-014: Build Action Result and Validation UI

- **Objective:** Show action execution and validation outcome.
- **Description:** Display PO details, action status, validation checks, recovery, and audit trail.
- **Dependencies:** ENG-010, ENG-011, ENG-013.
- **Affected Components:** Frontend.
- **Expected Behavior:** Buyer sees whether the action succeeded and whether validation passed.
- **Acceptance Criteria:** Validation failure is visually and textually distinguishable from success.
- **Tests Required:** Manual or automated UI scenario for success and failure.
- **Definition of Done:** Action feedback loop is demoable from UI.

### ENG-015: Implement Evaluation Runner

- **Objective:** Demonstrate scenario correctness.
- **Description:** Add command or UI/API path to run seeded scenarios and compare expected vs actual decisions and validation outcomes.
- **Dependencies:** ENG-003, ENG-006, ENG-010, ENG-011.
- **Affected Components:** Evaluation tooling, API/UI.
- **Expected Behavior:** Evaluation reports total, passed, failed, and per-scenario details.
- **Acceptance Criteria:** Required scenarios from PRD section 13 are represented.
- **Tests Required:** Evaluation runner self-test.
- **Definition of Done:** Evaluator can run scenarios and inspect pass/fail output.

### ENG-016: Add Observability and Audit Display

- **Objective:** Make agent behavior inspectable.
- **Description:** Add run duration, audit event display, rule check output, and failure reasons.
- **Dependencies:** ENG-008, ENG-013, ENG-014.
- **Affected Components:** Audit logger, frontend, API.
- **Expected Behavior:** Every run exposes ordered audit events.
- **Acceptance Criteria:** Audit log includes required event types from observability requirements.
- **Tests Required:** Audit event integration test.
- **Definition of Done:** Buyer/evaluator can inspect why a decision happened.

### ENG-017: Create Documentation and Submission Materials

- **Objective:** Satisfy assignment submission requirements.
- **Description:** Add README, architecture diagram, approach, setup/run instructions, evaluation explanation, validation loop explanation, mock data description, and `.env.example`.
- **Dependencies:** ENG-001 through ENG-016.
- **Affected Components:** Documentation.
- **Expected Behavior:** Evaluator can run and understand the project.
- **Acceptance Criteria:** README checklist maps to PRD section 18.
- **Tests Required:** Follow README locally.
- **Definition of Done:** Docs are complete, accurate, and no secrets are present.

### ENG-018: Final Quality Gate

- **Objective:** Verify implementation against PRD and engineering specs.
- **Description:** Run tests/evaluation, inspect UI, verify docs, check no secrets, and record known limitations.
- **Dependencies:** ENG-017.
- **Affected Components:** Entire repo.
- **Expected Behavior:** Project is ready for assignment submission.
- **Acceptance Criteria:** MVP acceptance criteria pass; known gaps are documented.
- **Tests Required:** Full test suite, evaluation runner, manual demo walkthrough.
- **Definition of Done:** Final status summary documents pass/fail and residual risks.

## Recommended Build Order

1. ENG-001 through ENG-006 for deterministic core.
2. ENG-008 through ENG-011 for backend/API loop.
3. ENG-012 through ENG-014 for UI demo.
4. ENG-015 through ENG-018 for evaluation and submission readiness.
