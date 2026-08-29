import { agentTemplates } from "@/lib/workflow-data";
import { validateWorkflow } from "@/lib/workflow-validation";
import { createMockId, mockStore } from "./mock-store";

const ok = (config, data, status = 200) => ({ data: { success: true, data }, status, statusText: "OK", headers: {}, config });
const fail = (config, code, message, status = 400) => ({ data: { success: false, error: { code, message, requestId: createMockId("req") } }, status, statusText: "Error", headers: {}, config });

function requestBody(config) {
  if (!config.data || typeof config.data !== "string") return config.data || {};
  try { return JSON.parse(config.data); } catch { return {}; }
}

export async function mockAdapter(config) {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const url = new URL(config.url || "", "https://api.example.test");
  const path = url.pathname.replace(/^\/api\/v1/, "");
  const method = String(config.method || "get").toLowerCase();
  const body = requestBody(config);

  if (method === "get" && path === "/agents") return ok(config, { agents: agentTemplates });
  if (method === "post" && path === "/workflows/validate") {
    const issues = validateWorkflow(body.nodes || [], body.edges || []);
    return ok(config, { valid: !issues.some((issue) => issue.type === "error"), issues, executionOrder: (body.nodes || []).map((node) => node.id) });
  }
  if (method === "post" && path === "/runs") {
    const runId = createMockId("run");
    mockStore.runs.set(runId, { runId, status: "queued", createdAt: new Date().toISOString(), nodes: body.nodes || [], edges: body.edges || [], stopped: false });
    return ok(config, { runId, status: "queued", createdAt: new Date().toISOString(), executionOrder: (body.nodes || []).map((node) => node.id), eventsUrl: `/runs/${runId}/events`, statusUrl: `/runs/${runId}` }, 202);
  }
  const runMatch = path.match(/^\/runs\/([^/]+)$/);
  if (method === "get" && runMatch) {
    const run = mockStore.runs.get(runMatch[1]);
    return run ? ok(config, run) : fail(config, "RUN_NOT_FOUND", "Run was not found.", 404);
  }
  const stopMatch = path.match(/^\/runs\/([^/]+)\/stop$/);
  if (method === "post" && stopMatch) {
    const run = mockStore.runs.get(stopMatch[1]);
    if (!run) return fail(config, "RUN_NOT_FOUND", "Run was not found.", 404);
    run.stopped = true;
    run.status = "stopping";
    return ok(config, { runId: run.runId, status: "stopping", requestedAt: new Date().toISOString() }, 202);
  }
  const retryMatch = path.match(/^\/runs\/([^/]+)\/nodes\/([^/]+)\/retry$/);
  if (method === "post" && retryMatch) return ok(config, { runId: retryMatch[1], nodeId: retryMatch[2], attempt: 2, status: "queued", queuedDownstreamNodeIds: [] }, 202);
  if (method === "post" && path === "/files") {
    const fileId = createMockId("file");
    const file = body instanceof FormData ? body.get("file") : null;
    const result = { fileId, name: file?.name || "skill-file.md", mimeType: file?.type || "text/markdown", size: file?.size || 0, status: "ready", createdAt: new Date().toISOString() };
    mockStore.files.set(fileId, result);
    return ok(config, result, 201);
  }
  const fileMatch = path.match(/^\/files\/([^/]+)$/);
  if (method === "delete" && fileMatch) { mockStore.files.delete(fileMatch[1]); return ok(config, { fileId: fileMatch[1], deleted: true }); }
  if (method === "get" && path === "/integrations") return ok(config, { integrations: [{ id: "jira", name: "Jira", status: "available", authenticationType: "token" }, { id: "azure", name: "Azure DevOps", status: "available", authenticationType: "token" }] });
  if (method === "get" && path === "/connections") return ok(config, { connections: mockStore.connections });
  if (method === "post" && path === "/connections") {
    const { token: _token, ...safeBody } = body;
    void _token;
    const connection = { ...safeBody, id: body.id || createMockId("connection"), status: "Connected" };
    mockStore.connections = [...mockStore.connections.filter((item) => item.id !== connection.id), connection];
    return ok(config, connection, 201);
  }
  const connectionMatch = path.match(/^\/connections\/([^/]+)$/);
  if (method === "delete" && connectionMatch) { mockStore.connections = mockStore.connections.filter((item) => item.id !== connectionMatch[1]); return ok(config, { connectionId: connectionMatch[1], deleted: true }); }
  return fail(config, "MOCK_ROUTE_NOT_FOUND", `No mock response for ${method.toUpperCase()} ${path}.`, 404);
}
