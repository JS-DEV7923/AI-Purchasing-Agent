import assert from "node:assert/strict";
import test from "node:test";
import { MockStore } from "../src/repository/store.js";
import { executeAction } from "../src/services/actions.js";
import { runEvaluation } from "../src/services/evaluation.js";
import { runAgentReview } from "../src/services/orchestrator.js";

test("agent run records decision and required audit event types", () => {
  const store = new MockStore();
  const run = runAgentReview(store, { recommendationId: "rec_accept", mode: "review_only", idempotencyKey: "review-1" });
  assert.equal(run.status, "decision_ready");
  assert.equal(run.decision.type, "accept");
  const eventTypes = new Set(run.auditEvents.map((event) => event.type));
  for (const type of ["input", "tool_call", "tool_result", "rule_check", "decision"]) {
    assert.equal(eventTypes.has(type), true);
  }
});

test("actions always produce post-action validation", () => {
  const store = new MockStore();
  const run = runAgentReview(store, { recommendationId: "rec_accept", mode: "review_only", idempotencyKey: "review-2" });
  const result = executeAction(store, run.runId, { actionType: "create_po", approvedByBuyer: true, idempotencyKey: "action-2" });
  assert.equal(result.actionResult.status, "success");
  assert.equal(result.validationResult.status, "passed");
  assert.equal(result.auditEvents.some((event) => event.type === "validation"), true);
});

test("action mismatch produces recovery-required run", () => {
  const store = new MockStore();
  const run = runAgentReview(store, { recommendationId: "rec_action_failure", mode: "review_only", idempotencyKey: "review-3" });
  const result = executeAction(store, run.runId, { actionType: "create_po", approvedByBuyer: true, idempotencyKey: "action-3" });
  assert.equal(result.actionResult.status, "partial_success");
  assert.equal(result.validationResult.status, "failed");
  assert.equal(result.status, "recovery_required");
  assert.match(result.recovery, /Escalate/);
});

test("evaluation runner covers required seeded scenarios", () => {
  const store = new MockStore();
  const report = runEvaluation(store, { scenarioIds: null, resetState: true });
  assert.equal(report.summary.total, 6);
  assert.equal(report.summary.failed, 0);
});
