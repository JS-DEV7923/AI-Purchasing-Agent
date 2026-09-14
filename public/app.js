let selectedRecommendationId = null;
let currentRun = null;

const els = {
  recommendations: document.querySelector("#recommendations"),
  count: document.querySelector("#count"),
  detail: document.querySelector("#detail"),
  decision: document.querySelector("#decision"),
  evaluation: document.querySelector("#evaluation"),
  runReview: document.querySelector("#runReview"),
  executeAction: document.querySelector("#executeAction"),
  runEvaluation: document.querySelector("#runEvaluation")
};

await loadRecommendations();

els.runReview.addEventListener("click", async () => {
  currentRun = await api("/api/agent-runs", {
    method: "POST",
    body: {
      recommendationId: selectedRecommendationId,
      mode: "review_only",
      idempotencyKey: `ui-review-${selectedRecommendationId}-${Date.now()}`
    }
  });
  renderDecision(currentRun);
});

els.executeAction.addEventListener("click", async () => {
  const result = await api(`/api/agent-runs/${currentRun.runId}/actions`, {
    method: "POST",
    body: {
      actionType: "create_po",
      approvedByBuyer: true,
      idempotencyKey: `ui-action-${currentRun.runId}-${Date.now()}`
    }
  });
  currentRun = result;
  renderDecision(result);
});

els.runEvaluation.addEventListener("click", async () => {
  const report = await api("/api/evaluations/run", { method: "POST", body: { resetState: true } });
  renderEvaluation(report);
  await loadRecommendations();
});

async function loadRecommendations() {
  const data = await api("/api/recommendations");
  els.count.textContent = `${data.recommendations.length} seeded`;
  els.recommendations.innerHTML = data.recommendations.map((rec) => `
    <button class="rec ${rec.recommendationId === selectedRecommendationId ? "active" : ""}" data-id="${rec.recommendationId}">
      <strong>${rec.productName}</strong>
      <span>${rec.sku} · ${rec.nodeId} · ${rec.recommendedQuantity} units · ${rec.status}</span>
    </button>
  `).join("");
  els.recommendations.querySelectorAll(".rec").forEach((button) => {
    button.addEventListener("click", () => selectRecommendation(button.dataset.id));
  });
}

async function selectRecommendation(recommendationId) {
  selectedRecommendationId = recommendationId;
  currentRun = null;
  const data = await api(`/api/recommendations/${recommendationId}`);
  renderDetail(data);
  els.runReview.disabled = false;
  els.executeAction.disabled = true;
  els.decision.innerHTML = `<div class="empty">Run the agent review for this recommendation.</div>`;
  await loadRecommendations();
}

function renderDetail({ recommendation, context }) {
  els.detail.className = "content";
  els.detail.innerHTML = `
    <div class="stack">
      <div>
        <h3>${context.product?.name || recommendation.productId}</h3>
        <span class="badge">${recommendation.status}</span>
      </div>
      <div class="grid">
        ${metric("Recommended", `${recommendation.recommendedQuantity} units`)}
        ${metric("Inventory", `${context.inventory?.availableUnits ?? "missing"} available`)}
        ${metric("Forecast", `${context.forecast?.dailyForecastUnits ?? "missing"} / day`)}
        ${metric("Open POs", `${context.openPurchaseOrders.length} orders`)}
        ${metric("Supplier MOQ", `${context.supplierOptions[0]?.minimumOrderQuantity ?? "missing"} units`)}
        ${metric("Budget", currency(context.budget?.budgetRemaining))}
        ${metric("Storage", `${context.storage?.maxUnitsStorable ?? "missing"} units`)}
        ${metric("Created", recommendation.createdAt)}
      </div>
    </div>
  `;
}

function renderDecision(run) {
  const decision = run.decision;
  const actionable = ["accept", "modify"].includes(decision.type);
  els.executeAction.disabled = !actionable || run.actionResult;
  els.decision.className = "content";
  els.decision.innerHTML = `
    <div class="stack">
      <div>
        <span class="badge ${decision.type}">${decision.type}</span>
        <span class="badge">${Math.round(decision.confidence * 100)}% confidence</span>
        ${decision.requiresApproval ? `<span class="badge warning">approval required</span>` : ""}
      </div>
      <p>${decision.explanation || decision.summary}</p>
      <div class="grid">
        ${metric("Final quantity", `${decision.recommendedQuantity} units`)}
        ${metric("Supplier", decision.supplierId || "none")}
        ${metric("Run status", run.status)}
        ${metric("Duration", `${run.durationMs || 0} ms`)}
      </div>
      ${renderChecks(decision.constraintsChecked)}
      ${renderAction(run)}
      ${renderAudit(run.auditEvents)}
    </div>
  `;
}

function renderChecks(checks) {
  return `
    <div>
      <h3>Constraint Checks</h3>
      <table class="checks">
        <tbody>
          ${checks.map((check) => `<tr><td><span class="badge ${check.status}">${check.status}</span></td><td>${check.code}</td><td>${check.summary}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderAction(run) {
  if (!run.actionResult) return "";
  const po = run.actionResult.purchaseOrder;
  return `
    <div>
      <h3>Action Result</h3>
      <p><span class="badge ${run.actionResult.status}">${run.actionResult.status}</span> ${po ? `PO ${po.poId} for ${po.quantity} units` : run.actionResult.details}</p>
      ${run.validationResult ? `<p><span class="badge ${run.validationResult.status}">${run.validationResult.status}</span> validation ${run.recovery ? `· ${run.recovery}` : ""}</p>` : ""}
    </div>
  `;
}

function renderAudit(events) {
  return `
    <div>
      <h3>Audit Trail</h3>
      <table class="audit">
        <tbody>
          ${events.map((event) => `<tr><td>${event.sequence}</td><td>${event.type}</td><td>${event.summary}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderEvaluation(report) {
  els.evaluation.className = "content";
  els.evaluation.innerHTML = `
    <div class="stack">
      <p><strong>${report.summary.passed}/${report.summary.total}</strong> scenarios passed in ${report.summary.durationMs} ms.</p>
      <table class="eval-table">
        <thead><tr><th>Scenario</th><th>Decision</th><th>Action</th><th>Validation</th><th>Status</th></tr></thead>
        <tbody>
          ${report.results.map((row) => `
            <tr>
              <td>${row.scenarioId}</td>
              <td>${row.expectedDecision} → ${row.actualDecision}</td>
              <td>${row.expectedActionStatus} → ${row.actualActionStatus}</td>
              <td>${row.expectedValidationStatus ?? "none"} → ${row.actualValidationStatus ?? "none"}</td>
              <td><span class="badge ${row.passed ? "passed" : "failed"}">${row.passed ? "passed" : "failed"}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function metric(label, value) {
  return `<div class="metric"><span>${label}</span><strong>${value ?? "missing"}</strong></div>`;
}

function currency(value) {
  return value === undefined || value === null ? "missing" : `$${Number(value).toLocaleString()}`;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || "GET",
    headers: options.body ? { "content-type": "application/json" } : {},
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Request failed");
  return data;
}
