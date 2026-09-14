# Technical Constraints: AI Purchasing Agent

Source PRD: `docs/AI_PURCHASING_AGENT_PRD.md`

## Scope Constraints

- Implement at least one scenario end-to-end, with Scenario 1 as MVP.
- Keep implementation achievable within approximately 6-8 hours.
- Mock APIs, databases, datasets, and services are acceptable.
- Production-grade infrastructure is not required.
- Breadth is less important than the quality of the core workflow.
- Real ERP, WMS, supplier, forecasting, budget, storage, or payment integrations are out of scope.

## Architecture Constraints

- The solution must be full-stack: frontend, backend/API, mock data, and evaluation path.
- The agent must use typed tools/services or APIs for operational data access.
- Hard constraints must be enforced outside the LLM.
- Business rules must be readable and testable independent of model prompts.
- The system must preserve auditability for each agent run.
- The system must validate action outcomes after execution.

## Data Constraints

- Seed data must cover all implemented scenarios.
- Required entities: product, inventory, forecast, recommendation, purchase order, supplier, budget, and storage/constraint state.
- Data must include timestamps or freshness metadata where freshness affects decisions.
- Missing or stale required data must produce `investigate_further` or escalation.
- Schemas should retain `nodeId` even if the MVP uses one node.

## Performance Constraints

- A single recommendation review should complete within 10 seconds in the demo environment.
- Deterministic calculations should not require LLM calls.
- Repeated or unnecessary model calls should be avoided.

## UI Constraints

- Required screens or views: recommendation list, recommendation detail, action result, and evaluation output or README-visible equivalent.
- The buyer must be able to see evidence, constraints checked, decision, confidence, risks, unknowns, and validation result.
- The UI must not present invalid purchase orders as successful.

## Reliability Constraints

- Every executed action must be followed by validation.
- Invalid actions must be blocked or escalated before PO creation.
- Action service responses may be success, failure, or partial success.
- Partial success must not be treated as success unless validation confirms acceptability.

## Security Constraints

- Secrets must not be committed.
- `.env.example` must document required environment variables.
- External supplier notes, mock data comments, or other untrusted text must be treated as data, not instructions.
- The agent must not have unconstrained access to filesystem, shell, or arbitrary network actions.

## Documentation Constraints

- Repository must include complete source code.
- Repository must include README setup/run instructions.
- Repository must include architecture diagram.
- Repository must describe approach, test scenarios, evaluation method, and validation loop.
- Repository must keep git history intact.

## Not Specified in PRD

- Required programming language.
- Required frontend/backend framework.
- Required LLM provider.
- Hosting target.
- Authentication model.
- Data retention period.
- Accessibility standard.
- Browser compatibility matrix.
- Production observability stack.
