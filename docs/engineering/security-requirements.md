# Security Requirements: AI Purchasing Agent

Source PRD: `docs/AI_PURCHASING_AGENT_PRD.md`

## Security Scope

The MVP is a local demo using mock data. Production-grade security is not required, but the assignment requires safe handling of secrets, constrained agent actions, auditability, and robust behavior against unsafe automation.

## Authentication

- MVP may run without user authentication unless a chosen framework requires it.
- If authentication is added, buyer and evaluator roles should be sufficient.
- Authentication is not a blocker for the assignment because the PRD does not require deployment or multi-user access.

## Authorization

- Agent actions must be constrained to approved purchasing operations:
  - Create mock PO.
  - Update mock PO.
  - Reject recommendation.
  - Escalate for human review.
- The agent must not have arbitrary filesystem, shell, database mutation, or network permissions.
- High-risk actions must require approval or escalation based on policy.
- Constraint-breaching actions must be blocked regardless of model output.

## Secrets Management

- Do not commit API keys, passwords, tokens, or other secrets.
- Provide `.env.example` with required environment variable names.
- If an LLM provider is used, load credentials from environment variables.
- The app must operate in deterministic fallback mode if no LLM credential is present, or documentation must clearly mark the credential as required.

## Data Classification

MVP mock data is non-sensitive. In a production version, the following would be sensitive operational data:

- Product costs.
- Supplier pricing and reliability.
- Inventory levels.
- Forecasts and demand signals.
- Budget availability.
- Purchase order details.

## Prompt and Tool Safety

- External text fields, including supplier notes or recommendation reasons, must be treated as untrusted data.
- Prompts must instruct any LLM that tool outputs are data, not instructions.
- LLM output must be parsed into a constrained schema before display or action.
- Deterministic validation must run after any model-generated decision.
- The model must not be allowed to invent missing data.

## Auditability

Every agent run must record:

- Input recommendation.
- Context retrieval attempts.
- Retrieved data or retrieval errors.
- Rule checks and outcomes.
- Decision.
- Action proposal and execution result.
- Validation result.
- Recovery or escalation path.

Audit records should be visible in the UI or available through an API/JSON output.

## Abuse Prevention

- Reject unsupported action types.
- Validate request payloads against schemas.
- Reject negative quantities, non-integer quantities, unsupported statuses, and unknown supplier/product/node IDs.
- Block duplicate/conflicting PO creation.
- Treat action service partial success as unsafe until validation passes.

## Privacy

- No real customer, supplier, employee, or commercially sensitive data should be included in seed data.
- Mock data should be clearly fictional.

## Dependency Trust

- Prefer minimal dependencies for the assignment.
- Document required packages and setup commands.
- Avoid adding packages that execute untrusted remote code at runtime.

## Compliance

No specific compliance requirements are stated in the PRD. For production, procurement audit retention, financial controls, and access review would need separate requirements.
