import { DomainError } from "../domain/schema.js";

export function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  res.end(body);
}

export async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new DomainError("VALIDATION_ERROR", "Request body must be valid JSON.", 400);
  }
}

export function sendError(res, error) {
  const status = error.status || 500;
  const code = error.code || "INTERNAL_ERROR";
  const message = status === 500 ? "Unexpected server error." : error.message;
  sendJson(res, status, {
    error: {
      code,
      message,
      details: error.details || {},
      correlationId: `corr_${Date.now()}`
    }
  });
}
