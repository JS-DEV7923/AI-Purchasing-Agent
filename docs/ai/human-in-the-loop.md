# Human-in-the-Loop Design: AI Purchasing Agent

Source inputs: PRD, engineering specs, and technical architecture.

## 1. Human Review Purpose

Human review prevents unsafe purchasing automation when the agent is uncertain, action impact is material, or constraints make the decision risky.

## 2. Review Gates

Buyer approval is required when:

- The action creates or updates a PO and `requiresApproval = true`.
- Proposed quantity materially differs from original recommendation.
- Estimated cost exceeds approval threshold.
- Storage capacity is near or over limit.
- Forecast confidence is below threshold.
- Supplier availability is partial.
- Post-action validation failed and retry is proposed.
- Data is missing or contradictory but business action is still requested.

## 3. Reviewer UX

The buyer should see:

- Original recommendation.
- Agent decision.
- Proposed action.
- Quantity and supplier.
- Evidence.
- Constraints checked.
- Risks and unknowns.
- Confidence.
- Validation status if action already occurred.
- Approve, reject, or escalate controls.

## 4. Override Rules

Allowed buyer overrides:

- Approve action that is policy-allowed.
- Reject recommendation.
- Escalate for manual investigation.

Disallowed buyer overrides in MVP:

- Force-create PO that fails hard constraints.
- Bypass validation.
- Execute unsupported action.

## 5. Feedback Loop

Capture reviewer feedback:

- Approved as-is.
- Rejected because decision was wrong.
- Escalated due to missing context.
- Quantity manually adjusted.
- Explanation unclear.

Use feedback for future evaluation scenarios, not automatic model learning in MVP.

## 6. Auditability

Audit each human decision:

- Reviewer action.
- Timestamp.
- Prior agent decision.
- Approval/rejection/escalation reason.
- Final action and validation status.

## 7. Decision Ownership

- Deterministic validation owns hard safety and feasibility.
- Buyer owns approval for high-risk or uncertain actions.
- Agent owns evidence gathering, recommendation classification, and explanation.

