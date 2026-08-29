import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  runId: null,
  eventsUrl: null,
  status: "idle",
  streamStatus: "disconnected",
  activeNodeId: null,
  phaseProgress: {},
  lastSequence: 0,
  recentEventIds: [],
  error: null,
};

const executionSlice = createSlice({
  name: "execution",
  initialState,
  reducers: {
    runRequested(state) {
      state.status = "starting";
      state.error = null;
    },
    runAccepted(state, action) {
      state.runId = action.payload.runId;
      state.eventsUrl = action.payload.eventsUrl;
      state.status = action.payload.status || "queued";
      state.streamStatus = "connecting";
      state.activeNodeId = null;
      state.phaseProgress = {};
      state.lastSequence = 0;
      state.recentEventIds = [];
      state.error = null;
    },
    streamConnected(state) {
      state.streamStatus = "connected";
    },
    streamDisconnected(state, action) {
      state.streamStatus = "disconnected";
      if (action.payload) state.error = action.payload;
    },
    eventReceived(state, action) {
      const event = action.payload;
      if (event.eventId && state.recentEventIds.includes(event.eventId)) return;
      if (event.sequence && event.sequence <= state.lastSequence) return;
      if (event.eventId) state.recentEventIds = [...state.recentEventIds, event.eventId].slice(-250);
      if (event.sequence) state.lastSequence = event.sequence;
      if (event.type === "stream.ready") state.streamStatus = "connected";
      if (event.type === "run.started") state.status = "running";
      if (event.type === "node.started") state.activeNodeId = event.nodeId;
      if (event.type === "stage.started" || event.type === "stage.completed") state.phaseProgress[event.nodeId] = event.stageIndex;
      if (event.type === "node.failed") state.error = event.error || { message: "Node execution failed." };
      if (event.type === "run.completed") state.status = "completed";
      if (event.type === "run.failed") { state.status = "failed"; state.error = event.error || { message: "Workflow failed." }; }
      if (event.type === "run.stopped") state.status = "stopped";
      if (["run.completed", "run.failed", "run.stopped"].includes(event.type)) {
        state.activeNodeId = null;
        state.streamStatus = "disconnected";
      }
    },
    executionReset() {
      return initialState;
    },
  },
});

export const { runRequested, runAccepted, streamConnected, streamDisconnected, eventReceived, executionReset } = executionSlice.actions;
export const executionReducer = executionSlice.reducer;
export const selectExecution = (state) => state.execution;
