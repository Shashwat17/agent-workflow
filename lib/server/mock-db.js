const workflows = [];
const runs = [];

export function listWorkflowRecords() {
  return workflows;
}

export function getWorkflowRecord(id) {
  return workflows.find((workflow) => workflow.id === id) || null;
}

export function createWorkflowRecord(payload = {}) {
  const workflow = {
    id: `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: payload.name || "New workflow",
    nodes: Array.isArray(payload.nodes) ? payload.nodes : [],
    edges: Array.isArray(payload.edges) ? payload.edges : [],
    createdAt: new Date().toISOString(),
  };

  workflows.push(workflow);
  return workflow;
}

export function listRunRecords() {
  return runs;
}

export function getRunRecord(id) {
  return runs.find((run) => run.id === id) || null;
}

export function createRunRecord(payload = {}) {
  const run = {
    id: `run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    workflowId: payload.workflowId || null,
    status: payload.status || "queued",
    createdAt: new Date().toISOString(),
    logs: Array.isArray(payload.logs) ? payload.logs : [],
  };

  runs.push(run);
  return run;
}
