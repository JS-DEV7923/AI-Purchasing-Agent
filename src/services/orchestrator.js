import { DomainError } from "../domain/schema.js";
import { makeDecision } from "./decision.js";
import { synthesizeExplanation } from "./explanation.js";
import { buildContext } from "./rules.js";

export function getRecommendationDetail(store, recommendationId) {
  const recommendation = store.getRecommendation(recommendationId);
  if (!recommendation) throw new DomainError("RECOMMENDATION_NOT_FOUND", "Recommendation not found.", 404);
  return { recommendation, context: buildContext(store, recommendation) };
}

export function runAgentReview(store, request) {
  const existing = store.findRunByIdempotencyKey(request.idempotencyKey);
  if (existing) {
    if (existing.recommendationId !== request.recommendationId) {
      throw new DomainError("IDEMPOTENCY_CONFLICT", "Idempotency key was already used for another recommendation.", 409);
    }
    return decorateRun(store, existing);
  }

  const recommendation = store.getRecommendation(request.recommendationId);
  if (!recommendation) throw new DomainError("RECOMMENDATION_NOT_FOUND", "Recommendation not found.", 404);

  const started = Date.now();
  const run = store.createRun(request);
  store.updateRecommendation(recommendation.recommendationId, { status: "under_review" });
  store.addAuditEvent(run.runId, "input", "Received purchase recommendation.", { recommendation });

  const context = buildContext(store, recommendation);
  logTool(store, run.runId, "getRecommendation", recommendation);
  logTool(store, run.runId, "getProduct", context.product);
  logTool(store, run.runId, "getInventory", context.inventory);
  logTool(store, run.runId, "getDemandForecast", context.forecast);
  logTool(store, run.runId, "getOpenPurchaseOrders", context.openPurchaseOrders);
  logTool(store, run.runId, "getSupplierOptions", context.supplierOptions);
  logTool(store, run.runId, "getBudgetStatus", context.budget);
  logTool(store, run.runId, "getStorageCapacity", context.storage);

  const decision = makeDecision(context);
  decision.explanation = synthesizeExplanation(decision);
  for (const check of decision.constraintsChecked) {
    store.addAuditEvent(run.runId, "rule_check", check.summary, check);
  }
  store.addAuditEvent(run.runId, "decision", decision.summary, decision);

  run.decision = decision;
  run.status = "decision_ready";
  run.completedAt = new Date().toISOString();
  run.durationMs = Date.now() - started;
  store.saveRun(run);
  return decorateRun(store, run);
}

export function decorateRun(store, run) {
  return { ...run, auditEvents: store.getAuditEvents(run.runId) };
}

function logTool(store, runId, toolName, result) {
  store.addAuditEvent(runId, "tool_call", `Called ${toolName}.`, { toolName });
  store.addAuditEvent(runId, "tool_result", `${toolName} returned ${result ? "data" : "no data"}.`, { toolName, result });
}
