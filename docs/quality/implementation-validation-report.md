# Implementation Validation Report

Date: 2026-09-14  
Scope: Validate the implemented AI Purchasing Agent against the PRD, engineering requirements, architecture/API contracts, acceptance criteria, and AI evaluation plan under `docs/`.

## Release Recommendation

**CONDITIONAL / DO NOT CLAIM FULL SPEC COMPLIANCE YET**

The deterministic decisioning demo is functional, the seeded evaluation suite passes, and the core buyer flow is implemented. However, two must-have action-safety requirements are not fully satisfied: invalid action state is validated only after PO creation, and duplicate/open-PO constraints are not implemented as explicit blocking checks. These should be fixed before treating the implementation as complete against the approved specs.

## Evidence Reviewed

- PRD: `docs/AI_PURCHASING_AGENT_PRD.md`
- Acceptance criteria: `docs/engineering/acceptance-criteria.md`
- Engineering requirements: `docs/engineering/requirements.md`
- API contract: `docs/architecture/api-contract.md`
- AI evaluation plan: `docs/ai/ai-evaluation-plan.md`
- Implementation: `src/`, `public/`, `scripts/`
- Automated tests: `test/`
- README and config: `README.md`, `.env.example`

## Verification Commands

```bash
/Users/js/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test
```

Result: 12 passed, 0 failed, 1 skipped. The skipped test is the HTTP socket integration test because this sandbox returns `EPERM` when opening a local socket.

```bash
/Users/js/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/run-evaluation.js
```

Result: 6/6 evaluation scenarios passed.

Focused probes:

- Reduced `cat_grocery` budget after review and before action. The action created a PO, then marked the run `recovery_required` with failed `budget` validation.
- Submitted two review requests for the same recommendation with different idempotency keys. The system created two runs instead of returning `RECOMMENDATION_ALREADY_UNDER_REVIEW`.

## Requirement Traceability Summary

| Requirement / AC | Source | Verification | Actual Result | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Load mock recommendations | REQ-001, AC-015 | Static review, tests, UI code | Seeded recommendations include product, node, quantity, source, timestamp, status | PASS | `src/repository/seed.js`, `public/app.js` |
| Evaluate rather than blindly accept | REQ-002, AC-003 | Tests, evaluation | Evaluation covers accept, modify down, modify up, reject, investigate | PASS | 6/6 eval scenarios pass |
| Gather context before deciding | REQ-003 | Static review, audit tests | Orchestrator calls recommendation, product, inventory, forecast, POs, supplier, budget, storage and audits calls/results | PASS | `src/services/orchestrator.js` |
| Typed service/data boundaries | REQ-004 | Static review | Mock repository exposes typed methods; API validates request bodies | PASS | Runtime schemas are lightweight but present |
| Deterministic supply calculations | REQ-005, AC-020 | Unit tests | Required supply, projected supply, MOQ, budget, storage, overstock are tested | PASS | Duplicate-specific test is missing |
| Validate MOQ/budget/storage before PO creation | REQ-006, REQ-007, REQ-008, AC-004 | Static review, focused probe | Decision validates before action, but action path creates PO before final validation if state changes | FAIL | See DEF-001 |
| Check existing/duplicate open POs | REQ-009, AC-004, AC-020 | Static review, search | Open PO quantity affects decisions, but duplicate/conflicting PO is not an explicit check and no test covers it | PARTIAL | See DEF-002 |
| Decision enum and structured fields | REQ-010, REQ-011 | Tests, static review | Decisions include type, quantity, supplier, confidence, summary, evidence, checks, risks, unknowns | PASS | Template explanation added |
| Executable mock action | REQ-012, AC-002 | Tests, evaluation | Create PO works for accept/modify scenarios | PASS | Reject/escalate service paths exist but have less test coverage |
| Approval enforcement | REQ-013 | Static review | `requiresApproval` is enforced before action | PASS | Could use an explicit negative test |
| Failure/partial action result | REQ-014, AC-014 | Tests, evaluation | Partial success scenario marks recovery required | PASS | Recovery does not invalidate created PO |
| Validate after every executed action | REQ-015, AC-005 | Tests, static review | Every action path records validation | PASS | Validation should re-fetch resulting state for stronger compliance |
| Failed validation recovery path | REQ-016, AC-006 | Tests, focused probe | Run becomes `recovery_required`, recovery text is returned | PARTIAL | Invalid PO remains `created`; no rollback/invalidation |
| Audit log | REQ-017, AC-007 | Tests, UI static review | Ordered audit events are exposed and rendered | PASS | Error event coverage is not tested |
| UI screens | REQ-018, AC-015..AC-018 | Static review | Recommendation list, detail, decision/action, audit, evaluation output exist | PARTIAL | Live browser exercise was environment-constrained |
| Deterministic scenarios | REQ-019, REQ-021 | Evaluation runner | 6 scenarios implemented and pass | PASS | Prompt injection and LLM failure scenarios from AI eval plan are not implemented |
| Hard constraints enforced in all scenarios | REQ-020 | Tests, focused probe | Seeded hard-constraint scenario passes; stale-state action can create invalid PO before failure | PARTIAL | See DEF-001 |
| Review latency under 10 seconds | REQ-022, AC-019 | Evaluation output, run duration | Evaluation runs in milliseconds; run duration recorded | PASS | Not load-tested |
| LLM-independent rules | REQ-023 | Static review, tests | No LLM dependency; deterministic rules tested | PASS | Explanation is template fallback |
| Env/secrets | REQ-024, AC-008 | Secret scan | No secret-like committed values found; `.env.example` exists | PASS | Scan was regex-based |
| Documentation completeness | REQ-025, AC-021 | Static review | README plus design docs cover setup, architecture, scenarios, evaluation, mock data, validation | PASS | README could link directly to quality report after fixes |
| API action response shape | API contract | Static review | Server returns full decorated run with nested `actionResult`, not top-level `actionStatus`/`purchaseOrder` | FAIL | See DEF-003 |
| Under-review conflict | API contract | Focused probe | Same recommendation can create multiple concurrent runs with different idempotency keys | FAIL | See DEF-004 |

## Defects

### DEF-001 — BLOCKING — PO is created before final hard-constraint validation

Impacted requirements: AC-004, REQ-006, REQ-007, REQ-008, REQ-020.

Evidence:

- `src/services/actions.js` builds context, then calls `performAction`, which creates the PO, then calls `validatePostAction`.
- Focused probe changed budget after review and before action. Result: validation failed, run became `recovery_required`, but the new PO remained stored with status `created`.

Expected: hard constraints should block or modify the action before PO creation. If an action fails validation after creation, the PO should be invalidated or rolled back.

Actual: invalid state can be written first, then reported as failed.

Recommended fix: add pre-action validation immediately before `performAction`; block with `PRE_ACTION_VALIDATION_FAILED` when hard checks fail. For post-action failure, mark the created PO `invalid` or remove it according to the recovery policy.

### DEF-002 — HIGH — Duplicate/conflicting PO constraint is not implemented explicitly

Impacted requirements: AC-004, AC-006, AC-020, REQ-009.

Evidence:

- `src/services/rules.js` sums open PO quantities but has no duplicate/conflicting PO check code.
- `rg` finds no duplicate-specific implementation or test outside the documentation.

Expected: duplicate or conflicting open POs should be detected before action and after action.

Actual: open POs influence demand coverage, but duplicate PO creation is not explicitly blocked or validated.

Recommended fix: add a deterministic duplicate check keyed by product, node, supplier, expected arrival window, and source/run state; include scenario and unit tests.

### DEF-003 — MEDIUM — Action API response does not match documented contract

Impacted requirements: API contract, frontend/API stability.

Evidence:

- `docs/architecture/api-contract.md` specifies `POST /api/agent-runs/{runId}/actions` returns top-level `actionStatus`, `purchaseOrder`, `validationResult`, `recovery`, and `auditEvents`.
- `src/server.js` returns `executeAction(...)`, which is a decorated run with nested `actionResult.status` and `actionResult.purchaseOrder`.

Expected: stable documented response shape.

Actual: UI works against implementation shape, but external API clients following the contract will fail.

Recommended fix: either adjust the endpoint response to the contract or update the contract and README if the decorated-run response is intentional.

### DEF-004 — MEDIUM — `RECOMMENDATION_ALREADY_UNDER_REVIEW` is not enforced

Impacted requirements: API contract, reliability/idempotency.

Evidence:

- Focused probe submitted `rec_accept` twice with different idempotency keys and received `run_1` and `run_2`.
- API contract lists `409 RECOMMENDATION_ALREADY_UNDER_REVIEW`.

Expected: a recommendation already under review should reject or return the active run.

Actual: multiple runs can exist for the same recommendation.

Recommended fix: before creating a new run, check recommendation status or active runs for the same recommendation and return the documented 409 unless the existing idempotency key is reused.

### DEF-005 — LOW — HTTP integration test is skipped in the current sandbox

Impacted requirements: AC-001, API endpoint confidence.

Evidence:

- `node --test` reports the HTTP API test skipped because local socket binding returns `EPERM`.

Expected: endpoint tests should run in CI or a normal local environment.

Actual: service-level tests and evaluation pass here, but HTTP routes were not exercised in this sandbox.

Recommended fix: run the HTTP test in an environment that permits localhost sockets, or add route-handler tests that do not require listening on a socket.

## AI Evaluation Summary

The implemented AI behavior is deterministic and template-based; no external model is called. This satisfies the current fallback expectation and avoids hallucination or secret-dependency risk. The seeded evaluation runner validates six core deterministic scenarios. The AI evaluation plan also names prompt-injection-note and LLM-failure scenarios; those are not currently represented because the implementation does not include supplier notes or an LLM adapter.

## Security Summary

- `.env.example` exists.
- Regex secret scan found no committed API keys, tokens, passwords, or private-key material.
- Authentication is intentionally out of scope for the local MVP.
- UI rendering uses `innerHTML` with mock data. Current seed data is controlled, but this should be revisited before accepting external product/supplier/recommendation text.

## Performance Summary

- Evaluation completed in 3 ms in this environment.
- Agent run duration is recorded in run results.
- No concurrency, load, or browser-performance testing was performed.

## Final Gate

The implementation is a solid demo baseline and passes its current tests/evaluations, but validation finds important action-safety and API-contract gaps. Fix DEF-001 and DEF-002 before considering the core purchasing safety requirements complete. Fix DEF-003 and DEF-004 before relying on the API contract for external clients or repeated buyer actions.
