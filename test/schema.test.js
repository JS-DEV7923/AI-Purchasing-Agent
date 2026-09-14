import assert from "node:assert/strict";
import test from "node:test";
import { validateActionRequest, validateAgentRunRequest } from "../src/domain/schema.js";

test("validates agent run request shape", () => {
  assert.deepEqual(validateAgentRunRequest({ recommendationId: "rec_1" }), {
    recommendationId: "rec_1",
    mode: "review_only",
    idempotencyKey: null
  });
  assert.throws(() => validateAgentRunRequest({}), /recommendationId is required/);
});

test("validates supported action enum", () => {
  assert.equal(validateActionRequest({ actionType: "create_po", approvedByBuyer: true }).actionType, "create_po");
  assert.throws(() => validateActionRequest({ actionType: "wire_money" }), /actionType must be one of/);
});
