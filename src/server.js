import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { executeAction } from "./services/actions.js";
import { runEvaluation } from "./services/evaluation.js";
import { decorateRun, getRecommendationDetail, runAgentReview } from "./services/orchestrator.js";
import { store } from "./repository/store.js";
import { readJson, sendError, sendJson } from "./http/respond.js";
import { validateActionRequest, validateAgentRunRequest, validateEvaluationRequest } from "./domain/schema.js";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const publicDir = join(root, "public");

export function createApp() {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      if (url.pathname.startsWith("/api/")) {
        await handleApi(req, res, url);
      } else {
        await serveStatic(req, res, url);
      }
    } catch (error) {
      sendError(res, error);
    }
  });
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, 200, { status: "ok" });
  }

  if (req.method === "GET" && url.pathname === "/api/recommendations") {
    return sendJson(res, 200, { recommendations: store.listRecommendations() });
  }

  const recMatch = url.pathname.match(/^\/api\/recommendations\/([^/]+)$/);
  if (req.method === "GET" && recMatch) {
    return sendJson(res, 200, getRecommendationDetail(store, decodeURIComponent(recMatch[1])));
  }

  if (req.method === "POST" && url.pathname === "/api/agent-runs") {
    const body = validateAgentRunRequest(await readJson(req));
    return sendJson(res, 201, runAgentReview(store, body));
  }

  const runMatch = url.pathname.match(/^\/api\/agent-runs\/([^/]+)$/);
  if (req.method === "GET" && runMatch) {
    const run = store.getRun(decodeURIComponent(runMatch[1]));
    if (!run) return sendJson(res, 404, { error: { code: "RUN_NOT_FOUND", message: "Run not found.", details: {}, correlationId: `corr_${Date.now()}` } });
    return sendJson(res, 200, decorateRun(store, run));
  }

  const actionMatch = url.pathname.match(/^\/api\/agent-runs\/([^/]+)\/actions$/);
  if (req.method === "POST" && actionMatch) {
    const body = validateActionRequest(await readJson(req));
    return sendJson(res, 200, executeAction(store, decodeURIComponent(actionMatch[1]), body));
  }

  if (req.method === "POST" && url.pathname === "/api/evaluations/run") {
    const body = validateEvaluationRequest(await readJson(req));
    return sendJson(res, 200, runEvaluation(store, body));
  }

  sendJson(res, 404, { error: { code: "NOT_FOUND", message: "Route not found.", details: {}, correlationId: `corr_${Date.now()}` } });
}

async function serveStatic(req, res, url) {
  const path = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = path.replace(/\.\./g, "");
  const filePath = join(publicDir, safePath);
  const data = await readFile(filePath);
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8"
  };
  res.writeHead(200, { "content-type": types[extname(filePath)] || "application/octet-stream" });
  res.end(data);
}

function shouldListen() {
  return process.argv[1] === fileURLToPath(import.meta.url) || process.env.VERCEL === "1";
}

if (shouldListen()) {
  const port = Number(process.env.PORT || 3000);
  createApp().listen(port, () => {
    console.log(`AI Purchasing Agent running at http://localhost:${port}`);
  });
}
