import { DomainError } from "../domain/schema.js";
import { buildContext, validatePostAction } from "./rules.js";
import { decorateRun } from "./orchestrator.js";

export function executeAction(store, runId, request) {
  const run = store.getRun(runId);
  if (!run) throw new DomainError("RUN_NOT_FOUND", "Run not found.", 404);
  if (!run.decision) throw new DomainError("RUN_NOT_ACTIONABLE", "Run does not have a decision yet.", 409);

  if (run.actionResult?.idempotencyKey && request.idempotencyKey === run.actionResult.idempotencyKey) {
    return decorateRun(store, run);
  }
  if (run.actionResult?.idempotencyKey && request.idempotencyKey && request.idempotencyKey !== run.actionResult.idempotencyKey) {
    throw new DomainError("IDEMPOTENCY_CONFLICT", "Action idempotency key conflicts with a previous action.", 409);
  }

  const decision = run.decision;
  if (decision.requiresApproval && !request.approvedByBuyer) {
    throw new DomainError("APPROVAL_REQUIRED", "Buyer approval is required before executing this action.", 403);
  }

  const recommendation = store.getRecommendation(run.recommendationId);
  if (!recommendation) throw new DomainError("RECOMMENDATION_NOT_FOUND", "Recommendation not found.", 404);

  const context = buildContext(store, recommendation);
  const actionResult = performAction(store, run, recommendation, request);
  store.addAuditEvent(run.runId, "action", `Action ${request.actionType} returned ${actionResult.status}.`, actionResult);

  const validationResult = validatePostAction(context, decision, actionResult);
  store.addAuditEvent(run.runId, "validation", `Post-action validation ${validationResult.status}.`, validationResult);

  run.actionResult = actionResult;
  run.validationResult = validationResult;
  run.recovery = validationResult.recovery;
  run.status = validationResult.status === "passed" ? "completed" : validationResult.status === "failed" ? "recovery_required" : "completed";
  if (validationResult.recovery) {
    store.addAuditEvent(run.runId, "recovery", validationResult.recovery, validationResult);
  }
  store.saveRun(run);
  return decorateRun(store, run);
}

function performAction(store, run, recommendation, request) {
  const decision = run.decision;
  if (decision.type === "investigate_further" && request.actionType !== "escalate") {
    throw new DomainError("RUN_NOT_ACTIONABLE", "Investigation decisions can only be escalated.", 409);
  }
  if (decision.type === "reject" && !["reject_recommendation", "escalate"].includes(request.actionType)) {
    throw new DomainError("RUN_NOT_ACTIONABLE", "Rejected recommendations cannot create purchase orders.", 409);
  }

  if (request.actionType === "escalate") {
    store.updateRecommendation(recommendation.recommendationId, { status: "escalated" });
    return { status: "success", actionType: "escalate", idempotencyKey: request.idempotencyKey, details: "Escalated for buyer review." };
  }

  if (request.actionType === "reject_recommendation") {
    store.updateRecommendation(recommendation.recommendationId, { status: "rejected" });
    return { status: "success", actionType: "reject_recommendation", idempotencyKey: request.idempotencyKey, details: decision.summary };
  }

  if (!["create_po", "update_po"].includes(request.actionType)) {
    throw new DomainError("VALIDATION_ERROR", "Unsupported action type.", 400, { actionType: request.actionType });
  }

  const quantity = recommendation.metadata?.forceActionMismatch
    ? Math.max(1, decision.recommendedQuantity - 100)
    : decision.recommendedQuantity;
  const status = recommendation.metadata?.forceActionMismatch ? "partial_success" : "success";
  const purchaseOrder = store.createPurchaseOrder({
    productId: recommendation.productId,
    nodeId: recommendation.nodeId,
    supplierId: decision.supplierId,
    quantity,
    expectedArrivalDate: expectedArrivalDate(10),
    sourceRunId: run.runId
  });

  if (status === "success") {
    store.updateRecommendation(recommendation.recommendationId, { status: decision.type === "accept" ? "accepted" : "modified" });
  }

  return { status, actionType: request.actionType, idempotencyKey: request.idempotencyKey, purchaseOrder };
}

function expectedArrivalDate(days) {
  const date = new Date("2026-09-14T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
