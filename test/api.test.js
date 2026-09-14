import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/server.js";

test("http api exposes recommendations, reviews, actions, and evaluations", async (t) => {
  const server = createApp();
  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
  } catch (error) {
    if (error.code === "EPERM") {
      t.skip("Sandbox does not permit opening a local HTTP socket.");
      return;
    }
    throw error;
  }
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;

  const recommendations = await getJson(`${base}/api/recommendations`);
  assert.equal(recommendations.recommendations.length >= 6, true);

  const run = await postJson(`${base}/api/agent-runs`, {
    recommendationId: "rec_accept",
    mode: "review_only",
    idempotencyKey: "api-review"
  });
  assert.equal(run.decision.type, "accept");

  const action = await postJson(`${base}/api/agent-runs/${run.runId}/actions`, {
    actionType: "create_po",
    approvedByBuyer: true,
    idempotencyKey: "api-action"
  });
  assert.equal(action.validationResult.status, "passed");

  const report = await postJson(`${base}/api/evaluations/run`, { resetState: true });
  assert.equal(report.summary.failed, 0);
});

async function getJson(url) {
  const response = await fetch(url);
  assert.equal(response.ok, true);
  return response.json();
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  assert.equal(response.ok, true);
  return response.json();
}
