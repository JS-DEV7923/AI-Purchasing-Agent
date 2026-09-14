import assert from "node:assert/strict";
import test from "node:test";
import { MockStore } from "../src/repository/store.js";
import { makeDecision } from "../src/services/decision.js";
import { buildContext, evaluatePurchasePlan } from "../src/services/rules.js";

function decisionFor(recommendationId) {
  const store = new MockStore();
  const rec = store.getRecommendation(recommendationId);
  return makeDecision(buildContext(store, rec));
}

test("accept scenario keeps original quantity when all constraints pass", () => {
  const decision = decisionFor("rec_accept");
  assert.equal(decision.type, "accept");
  assert.equal(decision.recommendedQuantity, 800);
  assert.equal(decision.constraintsChecked.some((check) => check.code === "budget" && check.status === "passed"), true);
});

test("modify-down scenario accounts for existing open purchase orders", () => {
  const decision = decisionFor("rec_modify_down");
  assert.equal(decision.type, "modify");
  assert.equal(decision.recommendedQuantity, 250);
  assert.equal(decision.recommendedQuantity < 800, true);
});

test("modify-up scenario reacts to higher demand", () => {
  const decision = decisionFor("rec_modify_up");
  assert.equal(decision.type, "modify");
  assert.equal(decision.recommendedQuantity, 1400);
});

test("hard budget and storage constraint rejects infeasible plan", () => {
  const decision = decisionFor("rec_reject_budget");
  assert.equal(decision.type, "reject");
});

test("missing supplier or forecast data produces investigate decision", () => {
  const decision = decisionFor("rec_missing_data");
  assert.equal(decision.type, "investigate_further");
  assert.deepEqual(decision.unknowns.sort(), ["forecast", "supplierOptions"].sort());
});

test("rule engine exposes deterministic calculations", () => {
  const store = new MockStore();
  const rec = store.getRecommendation("rec_accept");
  const output = evaluatePurchasePlan(buildContext(store, rec), 800);
  assert.equal(output.calculations.requiredSupply, 910);
  assert.equal(output.checks.every((check) => ["passed", "warning"].includes(check.status)), true);
});
