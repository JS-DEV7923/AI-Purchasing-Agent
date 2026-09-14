import { executeAction } from "./actions.js";
import { runAgentReview } from "./orchestrator.js";

export function runEvaluation(store, request) {
  const started = Date.now();
  const scenarioIds = request.scenarioIds || store.state.evaluationScenarios.map((scenario) => scenario.scenarioId);
  const results = [];

  for (const scenarioId of scenarioIds) {
    if (request.resetState) store.reset();
    const scenario = store.scenarioById(scenarioId);
    if (!scenario) {
      results.push({ scenarioId, passed: false, failureReason: "Unknown scenario." });
      continue;
    }

    const review = runAgentReview(store, {
      recommendationId: scenario.recommendationId,
      mode: "review_only",
      idempotencyKey: `eval-review-${scenario.scenarioId}`
    });
    let actionRun = review;

    if (["accept", "modify"].includes(review.decision.type)) {
      actionRun = executeAction(store, review.runId, {
        actionType: "create_po",
        approvedByBuyer: true,
        idempotencyKey: `eval-action-${scenario.scenarioId}`
      });
    }

    const actualDecision = review.decision.type;
    const actualValidationStatus = actionRun.validationResult?.status || null;
    const actualActionStatus = actionRun.actionResult?.status || "skipped";
    const passed = actualDecision === scenario.expectedDecision
      && actualValidationStatus === scenario.expectedValidationStatus
      && actualActionStatus === scenario.expectedActionStatus;

    results.push({
      scenarioId: scenario.scenarioId,
      expectedDecision: scenario.expectedDecision,
      actualDecision,
      expectedValidationStatus: scenario.expectedValidationStatus,
      actualValidationStatus,
      expectedActionStatus: scenario.expectedActionStatus,
      actualActionStatus,
      runId: review.runId,
      passed,
      failureReason: passed ? null : "Actual result did not match expected decision, action, or validation status."
    });
  }

  return {
    summary: {
      total: results.length,
      passed: results.filter((result) => result.passed).length,
      failed: results.filter((result) => !result.passed).length,
      durationMs: Date.now() - started
    },
    results
  };
}
