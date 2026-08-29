import { agentTemplates } from "@/lib/workflow-data";
import { API_BASE_URL, USE_MOCK_API } from "./config";
import { createMockId, mockStore } from "./mock-store";
import { runEventSchema } from "./schemas";

const EVENT_NAMES = ["stream.ready", "run.queued", "run.started", "node.queued", "node.started", "stage.started", "stage.completed", "log", "node.completed", "node.failed", "run.completed", "run.failed", "run.stopped", "heartbeat"];
const TERMINAL_EVENTS = new Set(["run.completed", "run.failed", "run.stopped"]);

function subscribeToMockRun(runId, onEvent, onError) {
  const run = mockStore.runs.get(runId);
  if (!run) { queueMicrotask(() => onError?.(new Error("Mock run was not found."))); return () => {}; }
  const timers = new Set();
  let closed = false;
  let sequence = 0;

  const emit = (type, payload = {}) => {
    if (closed) return;
    sequence += 1;
    onEvent?.({ type, eventId: createMockId("evt"), runId, sequence, timestamp: new Date().toISOString(), ...payload });
  };
  const wait = (delay) => new Promise((resolve) => {
    const timer = setTimeout(() => { timers.delete(timer); resolve(); }, delay);
    timers.add(timer);
  });

  const execute = async () => {
    emit("stream.ready", { status: "queued" });
    emit("run.started", { status: "running", executionOrder: run.nodes.map((node) => node.id) });
    for (const node of run.nodes) {
      if (closed) return;
      if (run.stopped) { emit("run.stopped", { status: "stopped", reason: "Stopped by user" }); return; }
      emit("node.queued", { nodeId: node.id, status: "queued", attempt: 1 });
      await wait(350);
      emit("node.started", { nodeId: node.id, status: "running", attempt: 1, startedAt: new Date().toISOString() });
      emit("log", { nodeId: node.id, level: "INFO", message: `${node.data?.label || "Agent"} started processing.`, attempt: 1 });
      const template = agentTemplates.find((item) => item.name === node.data?.label);
      const stages = template?.phases || [];
      const work = stages.length ? stages : ["connected to upstream task", "fetching input payload", "validating dependencies", "processing workflow context", "produced structured output"];
      for (let index = 0; index < work.length; index += 1) {
        if (closed) return;
        await wait(1_100);
        if (run.stopped) { emit("run.stopped", { status: "stopped", reason: "Stopped by user" }); return; }
        const stageName = work[index].replace(/^phase \d+\/\d+:\s*/i, "");
        if (stages.length) emit("stage.started", { nodeId: node.id, stageId: `stage-${index + 1}`, stageIndex: index + 1, totalStages: stages.length, stageName, status: "running", attempt: 1 });
        emit("log", { nodeId: node.id, level: "EVENT", message: `${node.data?.label || "Agent"}: ${stageName}`, stageId: stages.length ? `stage-${index + 1}` : null, attempt: 1 });
        if (stages.length) emit("stage.completed", { nodeId: node.id, stageId: `stage-${index + 1}`, stageIndex: index + 1, totalStages: stages.length, stageName, status: "completed", attempt: 1 });
      }
      const output = node.data?.output || `${node.data?.label || "Agent"} completed successfully.`;
      emit("node.completed", { nodeId: node.id, status: "completed", output, attempt: 1, completedAt: new Date().toISOString() });
    }
    run.status = "completed";
    emit("run.completed", { status: "completed", completedAt: new Date().toISOString() });
  };

  execute().catch((error) => onError?.(error));
  return () => { closed = true; timers.forEach(clearTimeout); timers.clear(); };
}

function subscribeToLiveRun(eventsUrl, onEvent, onError) {
  const apiUrl = new URL(API_BASE_URL);
  const url = /^https?:\/\//i.test(eventsUrl)
    ? eventsUrl
    : eventsUrl.startsWith("/api/")
      ? new URL(eventsUrl, apiUrl.origin).toString()
      : `${API_BASE_URL.replace(/\/$/, "")}/${eventsUrl.replace(/^\//, "")}`;
  let source;
  let reconnectTimer;
  let heartbeatTimer;
  let reconnectAttempt = 0;
  let lastEventId = "";
  let closed = false;

  const clearHeartbeat = () => clearTimeout(heartbeatTimer);
  const armHeartbeat = () => {
    clearHeartbeat();
    heartbeatTimer = setTimeout(() => {
      source?.close();
      scheduleReconnect(new Error("Workflow event stream heartbeat timed out."));
    }, 45_000);
  };
  const scheduleReconnect = (error) => {
    if (closed || reconnectTimer) return;
    onError?.(error);
    const delay = Math.min(1_000 * 2 ** reconnectAttempt, 30_000);
    reconnectAttempt += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = undefined;
      connect();
    }, delay);
  };
  const connect = () => {
    if (closed) return;
    const reconnectUrl = new URL(url);
    if (lastEventId) reconnectUrl.searchParams.set("lastEventId", lastEventId);
    source = new EventSource(reconnectUrl.toString(), { withCredentials: true });
    source.onopen = () => { reconnectAttempt = 0; armHeartbeat(); };
    EVENT_NAMES.forEach((type) => source.addEventListener(type, (event) => {
      try {
        lastEventId = event.lastEventId || lastEventId;
        armHeartbeat();
        onEvent?.({ type, ...JSON.parse(event.data) });
        if (TERMINAL_EVENTS.has(type)) { closed = true; clearHeartbeat(); source.close(); }
      } catch (error) { onError?.(error); }
    }));
    source.onerror = () => { source.close(); clearHeartbeat(); scheduleReconnect(new Error("Workflow event stream disconnected.")); };
  };
  connect();
  return () => {
    closed = true;
    clearTimeout(reconnectTimer);
    clearHeartbeat();
    source?.close();
  };
}

export function subscribeToRunEvents({ runId, eventsUrl, onEvent, onError }) {
  const handleValidatedEvent = (event) => {
    const parsed = runEventSchema.safeParse(event);
    if (!parsed.success) {
      const error = new Error("Workflow event did not match the expected contract.");
      error.code = "INVALID_SSE_EVENT";
      error.details = parsed.error.issues;
      onError?.(error);
      return;
    }
    onEvent?.(parsed.data);
  };
  return USE_MOCK_API ? subscribeToMockRun(runId, handleValidatedEvent, onError) : subscribeToLiveRun(eventsUrl, handleValidatedEvent, onError);
}
