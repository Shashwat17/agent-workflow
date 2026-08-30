import { createRunRecord, listRunRecords, getRunRecord } from "./mock-db";

export function getAllRuns() {
  return listRunRecords();
}

export function getRun(id) {
  return getRunRecord(id);
}

export function createRun(payload) {
  return createRunRecord(payload);
}
