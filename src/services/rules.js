import { failCheck, okCheck, warnCheck } from "../domain/schema.js";

const POLICY = {
  safetyStockDays: 3,
  materialExcessRatio: 0.15,
  lowForecastConfidence: 0.6
};

export function buildContext(store, recommendation) {
  const product = recommendation ? store.getProduct(recommendation.productId) : null;
  const inventory = recommendation ? store.getInventory(recommendation.productId, recommendation.nodeId) : null;
  const forecast = recommendation ? store.getForecast(recommendation.productId, recommendation.nodeId) : null;
  const openPurchaseOrders = recommendation ? store.getOpenPurchaseOrders(recommendation.productId, recommendation.nodeId) : [];
  const supplierOptions = recommendation ? store.getSupplierOptions(recommendation.productId) : [];
  const budget = product && recommendation ? store.getConstraint(product.categoryId, recommendation.nodeId) : null;
  return { recommendation, product, inventory, forecast, openPurchaseOrders, supplierOptions, budget, storage: budget };
}

export function evaluatePurchasePlan(context, proposedQuantity = context.recommendation?.recommendedQuantity, supplierId = null) {
  const missing = requiredMissing(context);
  if (missing.length > 0) {
    return {
      missing,
      checks: missing.map((field) => failCheck("missing_data", `Missing required ${field}.`, { field })),
      calculations: {},
      supplier: null,
      proposedQuantity
    };
  }

  const { recommendation, product, inventory, forecast, openPurchaseOrders, supplierOptions, budget } = context;
  const supplier = selectSupplier(supplierOptions, supplierId);
  const incomingUnits = openPurchaseOrders.reduce((sum, po) => sum + po.quantity, 0);
  const expectedDemandDuringLeadTime = Math.ceil(forecast.dailyForecastUnits * supplier.leadTimeDays);
  const safetyStock = Math.ceil(forecast.dailyForecastUnits * POLICY.safetyStockDays);
  const requiredSupply = expectedDemandDuringLeadTime + safetyStock;
  const requiredPurchase = Math.max(0, requiredSupply - inventory.availableUnits - incomingUnits);
  const roundedTargetQuantity = requiredPurchase === 0 ? 0 : roundUp(Math.max(requiredPurchase, supplier.minimumOrderQuantity), product.casePackSize);
  const maxAffordableUnits = Math.floor(budget.budgetRemaining / supplier.unitCost);
  const maxStorableUnits = budget.maxUnitsStorable;
  const feasibleMax = Math.min(supplier.availableQuantity, maxAffordableUnits, maxStorableUnits);
  const projectedAvailableSupply = inventory.availableUnits + incomingUnits + proposedQuantity;
  const proposedCost = proposedQuantity * supplier.unitCost;
  const slotsNeeded = Math.ceil(proposedQuantity / product.unitsPerStorageSlot);
  const excessUnits = projectedAvailableSupply - requiredSupply;
  const materialExcessUnits = Math.ceil(requiredSupply * POLICY.materialExcessRatio);

  const checks = [];
  checks.push(
    forecast.confidence < POLICY.lowForecastConfidence
      ? warnCheck("forecast_confidence", "Forecast confidence is low.", { confidence: forecast.confidence })
      : okCheck("forecast_confidence", "Forecast confidence is usable.", { confidence: forecast.confidence })
  );
  checks.push(
    proposedQuantity >= supplier.minimumOrderQuantity || proposedQuantity === 0
      ? okCheck("supplier_moq", "Supplier MOQ is satisfied.", { proposedQuantity, minimumOrderQuantity: supplier.minimumOrderQuantity })
      : failCheck("supplier_moq", "Proposed quantity is below supplier MOQ.", { proposedQuantity, minimumOrderQuantity: supplier.minimumOrderQuantity })
  );
  checks.push(
    proposedQuantity <= supplier.availableQuantity
      ? okCheck("supplier_availability", "Supplier can fulfill proposed quantity.", { proposedQuantity, availableQuantity: supplier.availableQuantity })
      : failCheck("supplier_availability", "Supplier cannot fulfill proposed quantity.", { proposedQuantity, availableQuantity: supplier.availableQuantity })
  );
  checks.push(
    proposedCost <= budget.budgetRemaining
      ? okCheck("budget", "Budget check passed.", { proposedCost, budgetRemaining: budget.budgetRemaining })
      : failCheck("budget", "Proposed purchase exceeds budget.", { proposedCost, budgetRemaining: budget.budgetRemaining })
  );
  checks.push(
    proposedQuantity <= maxStorableUnits
      ? okCheck("storage", "Storage capacity check passed.", { proposedQuantity, maxUnitsStorable: maxStorableUnits, slotsNeeded, storageSlotsAvailable: budget.storageSlotsAvailable })
      : failCheck("storage", "Proposed purchase exceeds storage capacity.", { proposedQuantity, maxUnitsStorable: maxStorableUnits })
  );
  checks.push(
    projectedAvailableSupply >= requiredSupply
      ? okCheck("demand_coverage", "Projected supply covers demand and safety stock.", { projectedAvailableSupply, requiredSupply })
      : failCheck("demand_coverage", "Projected supply does not cover demand and safety stock.", { projectedAvailableSupply, requiredSupply })
  );
  checks.push(
    excessUnits <= materialExcessUnits
      ? okCheck("overstock", "Projected supply is within overstock tolerance.", { excessUnits, materialExcessUnits })
      : warnCheck("overstock", "Projected supply materially exceeds required supply.", { excessUnits, materialExcessUnits })
  );

  return {
    missing: [],
    supplier,
    checks,
    proposedQuantity,
    calculations: {
      incomingUnits,
      expectedDemandDuringLeadTime,
      safetyStock,
      requiredSupply,
      requiredPurchase,
      roundedTargetQuantity,
      projectedAvailableSupply,
      proposedCost,
      maxAffordableUnits,
      maxStorableUnits,
      feasibleMax,
      recommendationQuantity: recommendation.recommendedQuantity
    }
  };
}

export function validatePostAction(context, decision, actionResult) {
  if (!actionResult || actionResult.status === "skipped") {
    return { status: "warning", checks: [warnCheck("action_skipped", "No purchasing action was executed.")], recovery: null };
  }

  if (actionResult.status !== "success") {
    return {
      status: "failed",
      checks: [failCheck("action_status", "Action did not complete successfully.", { actionStatus: actionResult.status })],
      recovery: "Escalate to buyer and invalidate any mismatched PO before retry."
    };
  }

  const po = actionResult.purchaseOrder;
  const checks = [];
  checks.push(po.quantity === decision.recommendedQuantity ? okCheck("po_quantity", "PO quantity matches approved decision.", { quantity: po.quantity }) : failCheck("po_quantity", "PO quantity does not match approved decision.", { expected: decision.recommendedQuantity, actual: po.quantity }));
  checks.push(po.supplierId === decision.supplierId ? okCheck("po_supplier", "PO supplier matches approved decision.", { supplierId: po.supplierId }) : failCheck("po_supplier", "PO supplier does not match approved decision.", { expected: decision.supplierId, actual: po.supplierId }));
  const planChecks = evaluatePurchasePlan(context, po.quantity, po.supplierId).checks.filter((check) => check.status === "failed" || check.code !== "overstock");
  checks.push(...planChecks);
  const failed = checks.some((check) => check.status === "failed");
  return {
    status: failed ? "failed" : "passed",
    checks,
    recovery: failed ? "Mark the PO invalid and escalate for buyer review." : null
  };
}

export function requiredMissing(context) {
  const missing = [];
  for (const key of ["recommendation", "product", "inventory", "forecast", "budget", "storage"]) {
    if (!context[key]) missing.push(key);
  }
  if (!context.supplierOptions || context.supplierOptions.length === 0) missing.push("supplierOptions");
  return missing;
}

function selectSupplier(supplierOptions, supplierId) {
  if (supplierId) {
    return supplierOptions.find((supplier) => supplier.supplierId === supplierId) || supplierOptions[0];
  }
  return [...supplierOptions].sort((a, b) => b.reliabilityScore - a.reliabilityScore || a.leadTimeDays - b.leadTimeDays)[0] || null;
}

function roundUp(value, increment) {
  return Math.ceil(value / increment) * increment;
}
