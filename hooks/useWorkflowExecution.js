import { useCallback, useEffect, useRef, useState } from "react";
import { agentTemplates } from "@/lib/workflow-data";

const DEFAULT_RUNTIME_MS = 14_000;

export function useWorkflowExecution(nodes, setNodes, isWorkflowRunning, setIsWorkflowRunning, setSelectedNodeId, appendNodeLog) {
  const [executionIndex, setExecutionIndex] = useState(-1);
  const [nodePhaseProgress, setNodePhaseProgress] = useState({});
  const executionLockRef = useRef(false);
  const nodesRef = useRef(nodes);

  useEffect(() => { executionLockRef.current = isWorkflowRunning; }, [isWorkflowRunning]);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  const getAgentPhaseCount = useCallback((label) => agentTemplates.find((item) => item.name === label)?.phases?.length ?? 0, []);

  const stopWorkflow = useCallback(() => {
    executionLockRef.current = false;
    setIsWorkflowRunning(false);
    setExecutionIndex(-1);
    setNodePhaseProgress({});
    setNodes((current) => current.map((node) => ({
      ...node,
      data: {
        ...node.data,
        status: node.data?.status === "Completed" ? "Completed" : "Idle",
        phaseIndex: node.data?.status === "Completed" ? node.data?.phaseIndex || 0 : 0,
      },
    })));
  }, [setIsWorkflowRunning, setNodes]);

  const startWorkflow = useCallback((startIndex = 0) => {
    if (!nodes.length || executionLockRef.current) return;
    const safeIndex = Math.max(0, Math.min(startIndex, nodes.length - 1));
    executionLockRef.current = true;
    setIsWorkflowRunning(true);
    setExecutionIndex(safeIndex);
    setNodePhaseProgress({});
    setSelectedNodeId(nodes[safeIndex]?.id ?? null);
    setNodes((current) => current.map((node, index) => {
      const totalPhases = getAgentPhaseCount(node.data?.label);
      return {
        ...node,
        data: {
          ...node.data,
          status: index < safeIndex ? "Completed" : index === safeIndex ? "Running" : "Queued",
          phaseIndex: index === safeIndex && totalPhases ? 1 : 0,
          totalPhases,
          startedAt: index === safeIndex ? Date.now() : null,
          completedAt: null,
          error: null,
        },
      };
    }));
  }, [getAgentPhaseCount, nodes, setIsWorkflowRunning, setNodes, setSelectedNodeId]);

  const handleWorkflowToggle = useCallback((nextState, hasNodes, startIndex = 0) => {
    if (nextState && hasNodes) startWorkflow(startIndex);
    if (!nextState) stopWorkflow();
  }, [startWorkflow, stopWorkflow]);

  const retryNode = useCallback((nodeId) => {
    const index = nodes.findIndex((node) => node.id === nodeId);
    if (index < 0) return;
    if (isWorkflowRunning) stopWorkflow();
    setTimeout(() => startWorkflow(index), 0);
  }, [isWorkflowRunning, nodes, startWorkflow, stopWorkflow]);

  useEffect(() => {
    if (!isWorkflowRunning || !nodes.length) return;
    if (executionIndex < 0 || executionIndex >= nodes.length) {
      executionLockRef.current = false;
      setTimeout(() => {
        setIsWorkflowRunning(false);
        setExecutionIndex(-1);
      }, 0);
      return;
    }

    const activeNode = nodesRef.current[executionIndex];
    if (!activeNode) return;
    const activeNodeId = activeNode.id;
    const totalPhases = getAgentPhaseCount(activeNode.data?.label);
    const runtimeMs = totalPhases ? Math.max(totalPhases * 4_500 + 750, DEFAULT_RUNTIME_MS) : DEFAULT_RUNTIME_MS;

    setSelectedNodeId(activeNodeId);
    appendNodeLog(activeNodeId, `${activeNode.data.label} started processing.`);
    setNodes((current) => current.map((node, index) => ({
      ...node,
      data: {
        ...node.data,
        status: index < executionIndex ? "Completed" : index === executionIndex ? "Running" : "Queued",
        startedAt: index === executionIndex ? node.data?.startedAt || Date.now() : node.data?.startedAt,
      },
    })));

    const timer = setTimeout(() => {
      appendNodeLog(activeNodeId, `${activeNode.data.label} completed and produced a structured response.`);
      setNodes((current) => current.map((node, index) => index === executionIndex ? {
        ...node,
        data: {
          ...node.data,
          status: "Completed",
          phaseIndex: totalPhases || node.data?.phaseIndex || 0,
          totalPhases,
          completedAt: Date.now(),
          output: node.data.output || `${node.data.label} completed successfully and produced a result.`,
        },
      } : node));
      setExecutionIndex((current) => current + 1);
    }, runtimeMs);

    return () => clearTimeout(timer);
  }, [appendNodeLog, executionIndex, getAgentPhaseCount, isWorkflowRunning, nodes.length, setIsWorkflowRunning, setNodes, setSelectedNodeId]);

  useEffect(() => {
    if (!isWorkflowRunning) return;
    setNodes((current) => current.map((node) => {
      const livePhase = nodePhaseProgress[node.id];
      return livePhase === undefined ? node : { ...node, data: { ...node.data, phaseIndex: livePhase } };
    }));
  }, [isWorkflowRunning, nodePhaseProgress, setNodes]);

  return { executionIndex, nodePhaseProgress, setNodePhaseProgress, handleWorkflowToggle, retryNode };
}
