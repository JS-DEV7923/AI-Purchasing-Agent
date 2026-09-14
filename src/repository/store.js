import { buildSeedData } from "./seed.js";

export class MockStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = buildSeedData();
    this.counters = { run: 1, event: 1, po: 1, eval: 1 };
  }

  listRecommendations() {
    return this.state.recommendations.map((recommendation) => ({
      ...recommendation,
      productName: this.getProduct(recommendation.productId)?.name,
      sku: this.getProduct(recommendation.productId)?.sku
    }));
  }

  getRecommendation(recommendationId) {
    return this.state.recommendations.find((item) => item.recommendationId === recommendationId) || null;
  }

  updateRecommendation(recommendationId, patch) {
    const rec = this.getRecommendation(recommendationId);
    if (rec) Object.assign(rec, patch);
    return rec;
  }

  getProduct(productId) {
    return this.state.products.find((item) => item.productId === productId) || null;
  }

  getInventory(productId, nodeId) {
    return this.state.inventory.find((item) => item.productId === productId && item.nodeId === nodeId) || null;
  }

  getForecast(productId, nodeId) {
    return this.state.forecasts.find((item) => item.productId === productId && item.nodeId === nodeId) || null;
  }

  getSupplierOptions(productId) {
    return this.state.suppliers.filter((item) => item.productId === productId);
  }

  getConstraint(categoryId, nodeId) {
    return this.state.constraints.find((item) => item.categoryId === categoryId && item.nodeId === nodeId) || null;
  }

  getOpenPurchaseOrders(productId, nodeId) {
    return this.state.purchaseOrders.filter((item) => item.productId === productId && item.nodeId === nodeId && ["open", "created", "modified", "validated"].includes(item.status));
  }

  createRun({ recommendationId, idempotencyKey }) {
    const run = {
      runId: `run_${this.counters.run++}`,
      recommendationId,
      status: "running",
      decision: null,
      actionResult: null,
      validationResult: null,
      recovery: null,
      startedAt: new Date().toISOString(),
      completedAt: null,
      durationMs: null,
      idempotencyKey
    };
    this.state.runs.push(run);
    return run;
  }

  findRunByIdempotencyKey(idempotencyKey) {
    return idempotencyKey ? this.state.runs.find((run) => run.idempotencyKey === idempotencyKey) || null : null;
  }

  getRun(runId) {
    return this.state.runs.find((run) => run.runId === runId) || null;
  }

  saveRun(run) {
    const index = this.state.runs.findIndex((item) => item.runId === run.runId);
    if (index >= 0) this.state.runs[index] = run;
    return run;
  }

  addAuditEvent(runId, type, summary, payload = {}) {
    const event = {
      eventId: `evt_${this.counters.event++}`,
      runId,
      sequence: this.state.auditEvents.filter((eventItem) => eventItem.runId === runId).length + 1,
      type,
      timestamp: new Date().toISOString(),
      summary,
      payload
    };
    this.state.auditEvents.push(event);
    return event;
  }

  getAuditEvents(runId) {
    return this.state.auditEvents.filter((event) => event.runId === runId).sort((a, b) => a.sequence - b.sequence);
  }

  createPurchaseOrder(payload) {
    const po = {
      poId: `po_${this.counters.po++}`,
      status: "created",
      createdAt: new Date().toISOString(),
      ...payload
    };
    this.state.purchaseOrders.push(po);
    return po;
  }

  updatePurchaseOrder(poId, patch) {
    const po = this.state.purchaseOrders.find((item) => item.poId === poId);
    if (po) Object.assign(po, patch, { status: patch.status || "modified" });
    return po;
  }

  scenarioById(scenarioId) {
    return this.state.evaluationScenarios.find((scenario) => scenario.scenarioId === scenarioId) || null;
  }
}

export const store = new MockStore();
