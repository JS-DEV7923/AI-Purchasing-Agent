import { evaluatePurchasePlan } from "./rules.js";

export function makeDecision(context) {
  const initial = evaluatePurchasePlan(context);
  const evidence = [];
  const risks = [];
  const unknowns = [];

  if (initial.missing.length > 0) {
    return decision("investigate_further", 0, null, 0.35, true, "Investigate further because required operational data is missing.", initial, evidence, risks, initial.missing);
  }

  const { recommendation } = context;
  const { supplier, calculations } = initial;

  evidence.push(`Available inventory: ${context.inventory.availableUnits} units.`);
  evidence.push(`Incoming open PO quantity: ${calculations.incomingUnits} units.`);
  evidence.push(`Required supply through lead time plus safety stock: ${calculations.requiredSupply} units.`);
  evidence.push(`Selected supplier ${supplier.supplierId} has ${supplier.availableQuantity} units available.`);

  if (context.forecast.confidence < 0.6) {
    risks.push("Forecast confidence is below policy threshold.");
    return decision("investigate_further", 0, supplier.supplierId, 0.42, true, "Investigate further because forecast confidence is too low for a purchase action.", initial, evidence, risks, ["low forecast confidence"]);
  }

  if (calculations.roundedTargetQuantity === 0) {
    return decision("reject", 0, supplier.supplierId, 0.82, false, "Reject the recommendation because current inventory and incoming POs already cover demand.", initial, evidence, ["Purchase would create avoidable overstock."], []);
  }

  if (calculations.feasibleMax < supplier.minimumOrderQuantity || calculations.feasibleMax < calculations.requiredPurchase) {
    risks.push("No valid purchase quantity can satisfy demand while respecting hard constraints.");
    return decision("reject", 0, supplier.supplierId, 0.78, true, "Reject or escalate because budget, storage, or supplier availability prevents a valid purchase.", initial, evidence, risks, []);
  }

  const finalQuantity = Math.min(calculations.roundedTargetQuantity, calculations.feasibleMax);
  const finalPlan = evaluatePurchasePlan(context, finalQuantity, supplier.supplierId);
  const hasHardFailure = finalPlan.checks.some((check) => check.status === "failed");

  if (hasHardFailure) {
    risks.push("The adjusted plan still fails deterministic validation.");
    return decision("reject", 0, supplier.supplierId, 0.74, true, "Reject or escalate because deterministic validation blocks the purchase.", finalPlan, evidence, risks, []);
  }

  const type = finalQuantity === recommendation.recommendedQuantity ? "accept" : "modify";
  const amount = finalQuantity * supplier.unitCost;
  const requiresApproval = type !== "accept" || amount >= context.budget.approvalThresholdAmount;
  const summary = type === "accept"
    ? `Accept ${finalQuantity} units because it covers expected demand and passes supplier, budget, and storage checks.`
    : `Modify to ${finalQuantity} units because the original ${recommendation.recommendedQuantity} unit recommendation does not best match current demand coverage.`;

  return decision(type, finalQuantity, supplier.supplierId, type === "accept" ? 0.9 : 0.86, requiresApproval, summary, finalPlan, evidence, risks, unknowns);
}

function decision(type, recommendedQuantity, supplierId, confidence, requiresApproval, summary, evaluation, evidence, risks, unknowns) {
  return {
    type,
    recommendedQuantity,
    supplierId,
    confidence,
    requiresApproval,
    summary,
    evidence,
    constraintsChecked: evaluation.checks,
    risks,
    unknowns,
    calculations: evaluation.calculations
  };
}
