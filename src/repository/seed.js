const now = "2026-09-14T00:00:00Z";

export const evaluationScenarios = [
  { scenarioId: "accept_recommendation", recommendationId: "rec_accept", expectedDecision: "accept", expectedValidationStatus: "passed", expectedActionStatus: "success" },
  { scenarioId: "modify_down", recommendationId: "rec_modify_down", expectedDecision: "modify", expectedValidationStatus: "passed", expectedActionStatus: "success" },
  { scenarioId: "modify_up", recommendationId: "rec_modify_up", expectedDecision: "modify", expectedValidationStatus: "passed", expectedActionStatus: "success" },
  { scenarioId: "reject_hard_constraint", recommendationId: "rec_reject_budget", expectedDecision: "reject", expectedValidationStatus: null, expectedActionStatus: "skipped" },
  { scenarioId: "missing_data", recommendationId: "rec_missing_data", expectedDecision: "investigate_further", expectedValidationStatus: null, expectedActionStatus: "skipped" },
  { scenarioId: "action_failure_recovery", recommendationId: "rec_action_failure", expectedDecision: "accept", expectedValidationStatus: "failed", expectedActionStatus: "partial_success" }
];

export function buildSeedData() {
  const products = [
    product("prod_accept", "SKU-ACCEPT", "Everyday Oats", "cat_grocery", 10, 50, 100),
    product("prod_modify_down", "SKU-DOWN", "Sparkling Water 12pk", "cat_beverage", 8, 50, 100),
    product("prod_modify_up", "SKU-UP", "Protein Bars", "cat_health", 12, 50, 100),
    product("prod_reject_budget", "SKU-BUDGET", "Premium Coffee", "cat_limited", 20, 50, 100),
    product("prod_missing_data", "SKU-MISSING", "Chili Crisp", "cat_grocery", 9, 50, 100),
    product("prod_action_failure", "SKU-FAIL", "Rice Noodles", "cat_grocery", 7, 50, 100)
  ];

  const recommendations = [
    rec("rec_accept", "prod_accept", 800),
    rec("rec_modify_down", "prod_modify_down", 800),
    rec("rec_modify_up", "prod_modify_up", 800),
    rec("rec_reject_budget", "prod_reject_budget", 800),
    rec("rec_missing_data", "prod_missing_data", 800),
    rec("rec_action_failure", "prod_action_failure", 800, { forceActionMismatch: true })
  ];

  const inventory = [
    inv("prod_accept", 110),
    inv("prod_modify_down", 0),
    inv("prod_modify_up", 50),
    inv("prod_reject_budget", 100),
    inv("prod_missing_data", 100),
    inv("prod_action_failure", 100)
  ];

  const forecasts = [
    forecast("prod_accept", 70, 0.88),
    forecast("prod_modify_down", 50, 0.86),
    forecast("prod_modify_up", 110, 0.91),
    forecast("prod_reject_budget", 70, 0.84),
    forecast("prod_action_failure", 69, 0.89)
  ];

  const suppliers = [
    supplier("sup_primary", "prod_accept", 1400, 10, 250, 10, 0.94),
    supplier("sup_primary", "prod_modify_down", 1000, 7, 250, 8, 0.91),
    supplier("sup_primary", "prod_modify_up", 1600, 10, 250, 12, 0.9),
    supplier("sup_primary", "prod_reject_budget", 1200, 10, 250, 20, 0.92),
    supplier("sup_primary", "prod_action_failure", 1400, 10, 250, 7, 0.93)
  ];

  const budgets = [
    constraint("cat_grocery", 20000, 20, 2000, 10000),
    constraint("cat_beverage", 16000, 18, 1800, 10000),
    constraint("cat_health", 25000, 24, 2400, 10000),
    constraint("cat_limited", 5000, 5, 500, 3000)
  ];

  return {
    products,
    recommendations,
    inventory,
    forecasts,
    suppliers,
    constraints: budgets,
    purchaseOrders: [
      po("po_open_down", "prod_modify_down", "sup_primary", 350, "open", "2026-09-20")
    ],
    runs: [],
    auditEvents: [],
    evaluationScenarios
  };
}

function product(productId, sku, name, categoryId, unitCost, casePackSize, unitsPerStorageSlot) {
  return { productId, sku, name, categoryId, unitCost, casePackSize, unitsPerStorageSlot };
}

function rec(recommendationId, productId, recommendedQuantity, metadata = {}) {
  return { recommendationId, productId, nodeId: "node_main", recommendedQuantity, source: "mock_replenishment_system", status: "pending", createdAt: now, metadata };
}

function inv(productId, availableUnits) {
  return { productId, nodeId: "node_main", onHandUnits: availableUnits, reservedUnits: 0, availableUnits };
}

function forecast(productId, dailyForecastUnits, confidence) {
  return { productId, nodeId: "node_main", dailyForecastUnits, forecastHorizonDays: 14, confidence, lastUpdatedAt: now };
}

function supplier(supplierId, productId, availableQuantity, leadTimeDays, minimumOrderQuantity, unitCost, reliabilityScore) {
  return { supplierId, productId, availableQuantity, leadTimeDays, minimumOrderQuantity, unitCost, reliabilityScore };
}

function constraint(categoryId, budgetRemaining, storageSlotsAvailable, maxUnitsStorable, approvalThresholdAmount) {
  return { categoryId, nodeId: "node_main", budgetRemaining, storageSlotsAvailable, maxUnitsStorable, approvalThresholdAmount };
}

function po(poId, productId, supplierId, quantity, status, expectedArrivalDate) {
  return { poId, productId, nodeId: "node_main", supplierId, quantity, status, expectedArrivalDate, createdAt: now };
}
