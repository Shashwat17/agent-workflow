import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { agentTemplates } from "@/lib/workflow-data";
import { subscribeToRunEvents } from "@/lib/api";
import {
  useRetryNodeMutation,
  useStartRunMutation,
  useStopRunMutation,
  useValidateWorkflowMutation,
} from "@/lib/store/api-slice";
import { eventReceived, executionReset, runAccepted, runRequested, selectExecution, streamDisconnected } from "@/lib/store/slices/execution-slice";

export function useWorkflowExecution(nodes, edges, integrations, setNodes, isWorkflowRunning, setIsWorkflowRunning, setSelectedNodeId, appendNodeLog, onError) {
  const dispatch = useDispatch();
  const execution = useSelector(selectExecution);
  const executionLockRef = useRef(false);
  const nodesRef = useRef(nodes);
  const lastSequenceRef = useRef(0);
  const eventIdsRef = useRef(new Set());
  const [validateWorkflowRequest] = useValidateWorkflowMutation();
  const [startRunRequest] = useStartRunMutation();
  const [stopRunRequest] = useStopRunMutation();
  const [retryNodeRequest] = useRetryNodeMutation();

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { executionLockRef.current = isWorkflowRunning; }, [isWorkflowRunning]);

  const getPhaseCount = useCallback((label) => agentTemplates.find((item) => item.name === label)?.phases?.length ?? 0, []);

  const resetUnfinishedNodes = useCallback(() => {
    setNodes((current) => current.map((node) => ({
      ...node,
      data: {
        ...node.data,
        status: node.data?.status === "Completed" ? "Completed" : "Idle",
        phaseIndex: node.data?.status === "Completed" ? node.data?.phaseIndex || 0 : 0,
      },
    })));
  }, [setNodes]);

  const startWorkflow = useCallback(async (startIndex = 0) => {
    if (!nodes.length || executionLockRef.current) return;
    executionLockRef.current = true;
    dispatch(runRequested());
    const runNodes = nodes;
    try {
      const validation = await validateWorkflowRequest({ nodes: runNodes, edges }).unwrap();
      if (!validation.valid) throw new Error(validation.issues?.[0]?.message || "Workflow validation failed.");
      const run = await startRunRequest({
        clientRunId: `client-run-${Date.now()}`,
        startNodeId: startIndex > 0 ? nodes[startIndex]?.id : null,
        nodes: runNodes,
        edges,
        integrations: integrations.map((item) => item.id),
        metadata: { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, clientVersion: "1.0.0" },
      }).unwrap();
      lastSequenceRef.current = 0;
      eventIdsRef.current.clear();
      dispatch(runAccepted(run));
      setIsWorkflowRunning(true);
      setNodes((current) => current.map((node, index) => ({
        ...node,
        data: {
          ...node.data,
          status: index < startIndex ? "Completed" : "Queued",
          phaseIndex: 0,
          totalPhases: getPhaseCount(node.data?.label),
          error: null,
        },
      })));
    } catch (error) {
      executionLockRef.current = false;
      dispatch(executionReset());
      onError?.(error?.message || "Could not start workflow.");
    }
  }, [dispatch, edges, getPhaseCount, integrations, nodes, onError, setIsWorkflowRunning, setNodes, startRunRequest, validateWorkflowRequest]);

  const stopWorkflow = useCallback(async () => {
    if (execution.runId) {
      try { await stopRunRequest({ runId: execution.runId }).unwrap(); } catch (error) { onError?.(error?.message || "Could not stop workflow."); }
    }
    executionLockRef.current = false;
    setIsWorkflowRunning(false);
    dispatch(executionReset());
    resetUnfinishedNodes();
  }, [dispatch, execution.runId, onError, resetUnfinishedNodes, setIsWorkflowRunning, stopRunRequest]);

  const handleWorkflowToggle = useCallback((nextState, hasNodes, startIndex = 0) => {
    if (nextState && hasNodes) void startWorkflow(startIndex);
    if (!nextState) void stopWorkflow();
  }, [startWorkflow, stopWorkflow]);

  const handleRunEvent = useCallback((event) => {
    if (event.eventId && eventIdsRef.current.has(event.eventId)) return;
    if (event.sequence && event.sequence <= lastSequenceRef.current) return;
    if (event.eventId) {
      eventIdsRef.current.add(event.eventId);
      if (eventIdsRef.current.size > 250) eventIdsRef.current.delete(eventIdsRef.current.values().next().value);
    }
    if (event.sequence) lastSequenceRef.current = event.sequence;
    dispatch(eventReceived(event));
    const nodeIndex = event.nodeId ? nodesRef.current.findIndex((node) => node.id === event.nodeId) : -1;
    if (event.type === "node.started" && nodeIndex >= 0) {
      const nodeKind = nodesRef.current[nodeIndex]?.data?.nodeKind;
      if (!["start", "end"].includes(nodeKind)) setSelectedNodeId(event.nodeId);
      setNodes((current) => current.map((node) => node.id === event.nodeId ? { ...node, data: { ...node.data, status: "Running", startedAt: event.startedAt } } : node));
    }
    if (event.type === "node.queued" && nodeIndex >= 0) {
      setNodes((current) => current.map((node) => node.id === event.nodeId && node.data?.status !== "Running" ? { ...node, data: { ...node.data, status: "Queued" } } : node));
    }
    if ((event.type === "stage.started" || event.type === "stage.completed") && nodeIndex >= 0) {
      setNodes((current) => current.map((node) => node.id === event.nodeId ? { ...node, data: { ...node.data, phaseIndex: event.stageIndex, totalPhases: event.totalStages } } : node));
    }
    if (event.type === "log") appendNodeLog(event.nodeId, event.message, event.level, event.timestamp);
    if (event.type === "node.completed" && nodeIndex >= 0) {
      setNodes((current) => current.map((node) => node.id === event.nodeId ? { ...node, data: { ...node.data, status: "Completed", output: event.output, completedAt: event.completedAt, phaseIndex: node.data?.totalPhases || node.data?.phaseIndex || 0 } } : node));
    }
    if (event.type === "node.failed" && nodeIndex >= 0) {
      setNodes((current) => current.map((node) => node.id === event.nodeId ? { ...node, data: { ...node.data, status: "Failed", error: event.error } } : node));
      appendNodeLog(event.nodeId, event.error?.message || "Agent execution failed.", "ERROR", event.timestamp);
    }
    if (["run.completed", "run.failed", "run.stopped"].includes(event.type)) {
      executionLockRef.current = false;
      setIsWorkflowRunning(false);
      if (event.type === "run.stopped") resetUnfinishedNodes();
    }
  }, [appendNodeLog, dispatch, resetUnfinishedNodes, setIsWorkflowRunning, setNodes, setSelectedNodeId]);

  useEffect(() => {
    if (!execution.runId || !execution.eventsUrl) return;
    return subscribeToRunEvents({
      runId: execution.runId,
      eventsUrl: execution.eventsUrl,
      onEvent: handleRunEvent,
      onError: (error) => {
        const message = error?.message || "Workflow event stream disconnected.";
        dispatch(streamDisconnected({ message }));
        onError?.(message);
      },
    });
  }, [dispatch, execution.eventsUrl, execution.runId, handleRunEvent, onError]);

  const retryNode = useCallback(async (nodeId) => {
    const index = nodes.findIndex((node) => node.id === nodeId);
    if (index < 0) return;
    try {
      if (execution.runId) await retryNodeRequest({ runId: execution.runId, nodeId }).unwrap();
      if (isWorkflowRunning) await stopWorkflow();
      await startWorkflow(index);
    } catch (error) {
      onError?.(error?.message || "Could not retry node.");
    }
  }, [execution.runId, isWorkflowRunning, nodes, onError, retryNodeRequest, startWorkflow, stopWorkflow]);

  const executionIndex = execution.activeNodeId ? nodes.findIndex((node) => node.id === execution.activeNodeId) : -1;
  return { executionIndex, nodePhaseProgress: execution.phaseProgress, handleWorkflowToggle, retryNode, activeRun: execution.runId ? { runId: execution.runId, eventsUrl: execution.eventsUrl, status: execution.status } : null };
}
