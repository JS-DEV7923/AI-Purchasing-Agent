export const DecisionTypes = ["accept", "modify", "reject", "investigate_further"];
export const ActionTypes = ["create_po", "update_po", "reject_recommendation", "escalate"];
export const ActionStatuses = ["pending_approval", "success", "failure", "partial_success", "skipped"];
export const ValidationStatuses = ["passed", "failed", "warning"];
export const AuditEventTypes = ["input", "tool_call", "tool_result", "rule_check", "decision", "action", "validation", "recovery", "error"];

export class DomainError extends Error {
  constructor(code, message, status = 400, details = {}) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function assertRequired(value, field) {
  if (value === undefined || value === null || value === "") {
    throw new DomainError("VALIDATION_ERROR", `${field} is required.`, 400, { field });
  }
}

export function assertEnum(value, allowed, field) {
  assertRequired(value, field);
  if (!allowed.includes(value)) {
    throw new DomainError("VALIDATION_ERROR", `${field} must be one of: ${allowed.join(", ")}.`, 400, { field });
  }
}

export function assertPositiveInteger(value, field) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new DomainError("VALIDATION_ERROR", `${field} must be a positive integer.`, 400, { field });
  }
}

export function validateAgentRunRequest(body = {}) {
  assertRequired(body.recommendationId, "recommendationId");
  if (body.mode !== undefined) {
    assertEnum(body.mode, ["review_only"], "mode");
  }
  return {
    recommendationId: String(body.recommendationId),
    mode: body.mode || "review_only",
    idempotencyKey: body.idempotencyKey ? String(body.idempotencyKey) : null
  };
}

export function validateActionRequest(body = {}) {
  assertEnum(body.actionType, ActionTypes, "actionType");
  if (body.approvedByBuyer !== undefined && typeof body.approvedByBuyer !== "boolean") {
    throw new DomainError("VALIDATION_ERROR", "approvedByBuyer must be a boolean.", 400, { field: "approvedByBuyer" });
  }
  return {
    actionType: body.actionType,
    approvedByBuyer: body.approvedByBuyer === true,
    idempotencyKey: body.idempotencyKey ? String(body.idempotencyKey) : null
  };
}

export function validateEvaluationRequest(body = {}) {
  if (body.scenarioIds !== undefined && !Array.isArray(body.scenarioIds)) {
    throw new DomainError("VALIDATION_ERROR", "scenarioIds must be an array.", 400, { field: "scenarioIds" });
  }
  return {
    scenarioIds: body.scenarioIds?.map(String) || null,
    resetState: body.resetState !== false
  };
}

export function validateRecommendation(rec) {
  assertRequired(rec.recommendationId, "recommendationId");
  assertRequired(rec.productId, "productId");
  assertRequired(rec.nodeId, "nodeId");
  assertPositiveInteger(rec.recommendedQuantity, "recommendedQuantity");
  return rec;
}

export function okCheck(code, summary, payload = {}) {
  return { code, status: "passed", summary, payload };
}

export function warnCheck(code, summary, payload = {}) {
  return { code, status: "warning", summary, payload };
}

export function failCheck(code, summary, payload = {}) {
  return { code, status: "failed", summary, payload };
}
