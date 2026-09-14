# AI Failure Modes: AI Purchasing Agent

Source inputs: PRD, engineering specs, and technical architecture.

| ID | Failure Mode | Detection | Impact | Mitigation | Fallback / Owner-Visible Behavior |
| --- | --- | --- | --- | --- | --- |
| AI-FM-001 | Model hallucinates inventory, demand, or supplier facts | Grounding check against structured context | Wrong explanation or user distrust | Model explanation-only; template fallback | Show deterministic facts and audit warning |
| AI-FM-002 | Model contradicts deterministic decision | Output validation | Confusing buyer guidance | Ignore contradiction; preserve deterministic decision | Template explanation |
| AI-FM-003 | Prompt injection in supplier/recommendation text | Prompt tests, suspicious text patterns | Unsafe instruction following | Treat text as untrusted data | Ignore injected instruction |
| AI-FM-004 | Missing required context | Required-context validation | Unsafe decision | Return `investigate_further` | Show missing facts |
| AI-FM-005 | Stale/low-confidence forecast | Freshness/confidence checks | Underbuy/overbuy risk | Investigate or approval gate | Show forecast freshness warning |
| AI-FM-006 | Rule engine bug | Unit/evaluation tests | Invalid decision | Test deterministic rules thoroughly | Block action if validation disagrees |
| AI-FM-007 | Unsupported tool/action selected | Enum/schema validation | Unsafe execution | Reject unsupported action | 400 or escalation |
| AI-FM-008 | Duplicate PO creation on retry | Idempotency conflict | Overstock/budget waste | Idempotency key and duplicate PO check | Return original action result or conflict |
| AI-FM-009 | Action partial success treated as success | Action status and post-validation | Silent invalid state | Explicit partial status | Mark recovery required |
| AI-FM-010 | Post-action validation skipped | Audit/evaluation check | Assignment core failure | Enforce validation in action service | Fail tests/evaluation |
| AI-FM-011 | LLM provider timeout | Adapter timeout | Slow review | 3 second timeout | Template explanation |
| AI-FM-012 | Evaluation flakiness from prose | Eval result variance | Unreliable tests | Evaluate structured fields | Ignore prose in core eval |
| AI-FM-013 | Overconfident output with unknowns | Unknowns/risk field checks | Buyer over-trust | Require unknowns in decision schema | Show confidence and unknown facts |
| AI-FM-014 | Sensitive data in prompt/log | Secret scan, prompt construction review | Privacy/security issue | Minimize prompt context; no secrets | Redact and audit |

## Recovery Principles

- Prefer investigation over action when facts are incomplete.
- Prefer escalation over unsafe automated correction.
- Preserve audit trail for every failure.
- Make failed validation visible to the buyer/evaluator.

