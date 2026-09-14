# Technical Risks: AI Purchasing Agent

Source PRD: `docs/AI_PURCHASING_AGENT_PRD.md`

| ID | Risk | Impact | Likelihood | Blocking | Mitigation |
| --- | --- | --- | --- | --- | --- |
| RISK-001 | LLM output overrides deterministic rules | Invalid PO creation, unsafe demo | Medium | Yes if not mitigated | Make rule engine authoritative; validate all proposed actions before execution |
| RISK-002 | Missing exact safety stock formula creates inconsistent expected decisions | Tests may be ambiguous | Medium | No | Define a configurable demo policy and document it |
| RISK-003 | Scope expands to all four scenarios | Assignment becomes too large for 6-8 hours | High | No | Implement Scenario 1 end-to-end; keep Scenario 2 as stretch |
| RISK-004 | UI consumes too much implementation time | Core agent/validation quality suffers | Medium | No | Build a lean functional UI and use evaluation output for proof |
| RISK-005 | Mock data is too simple | Demo fails to show constraint reasoning | Medium | No | Seed at least six scenarios covering accept, modify, reject, investigate, and failure recovery |
| RISK-006 | Evaluation depends on nondeterministic LLM wording | Tests become flaky | Medium | No | Assert structured decisions and rule outputs; do not evaluate prose only |
| RISK-007 | Action success is assumed without rechecking state | Feedback loop requirement is missed | Medium | Yes | Always run post-action validation and display validation result |
| RISK-008 | Action service partial success treated as success | Invalid operational state | Medium | Yes | Model partial success explicitly and require validation pass before completed status |
| RISK-009 | Prompt injection via mock supplier/recommendation text | Model follows untrusted text | Low | No | Treat external text as data; typed tools and deterministic validation constrain actions |
| RISK-010 | No audit log makes reasoning hard to review | Assignment evaluation suffers | Medium | No | Persist ordered audit events for each run |
| RISK-011 | Framework/LLM setup is hard for evaluator | Demo may not run | Medium | No | Provide deterministic no-LLM fallback or clear `.env.example` |
| RISK-012 | Single-node MVP conflicts with future multi-node fields | Refactor needed for stretch scope | Low | No | Include `nodeId` in all schemas from the start |
| RISK-013 | Budget/storage units are inconsistent | Incorrect constraint checks | Medium | No | Normalize quantities and storage conversion in seeded product data |
| RISK-014 | Documentation incomplete | Submission misses assignment requirements | Medium | No | Track README checklist against PRD section 18 |
| RISK-015 | Git history or secrets mishandled | Submission disqualification risk | Low | No | Avoid secrets, add `.env.example`, keep commits intact |

## Blocking Risks Before Implementation

No PRD ambiguity blocks implementation planning. The only risks that become blocking during implementation are:

- Deterministic hard constraints are not implemented outside the LLM.
- Post-action validation is skipped.
- The app cannot run locally from README instructions.

## Recommended Risk Controls

- Start with seed data and deterministic rules before UI polish.
- Add tests/evaluation immediately after rules.
- Keep LLM optional or isolated behind a stable explanation interface.
- Make audit events visible early.
- Build one excellent end-to-end scenario before adding stretch scenarios.
