import {
  createWorkflowRecord,
  listWorkflowRecords,
  getWorkflowRecord,
} from "./mock-db";

export function getAllWorkflows() {
  return listWorkflowRecords();
}

export function getWorkflow(id) {
  return getWorkflowRecord(id);
}

export function createWorkflow(payload) {
  return createWorkflowRecord(payload);
}
