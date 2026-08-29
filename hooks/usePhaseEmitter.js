import { useEffect } from "react";
import { agentTemplates } from "@/lib/workflow-data";

export function usePhaseEmitter(
  isWorkflowRunning,
  activeNodeId,
  activeNodeLabel,
  appendNodeLog,
  setNodePhaseProgress,
) {
  useEffect(() => {
    if (!isWorkflowRunning || !activeNodeId) {
      return;
    }

    const label = activeNodeLabel ?? "Agent";
    const template = agentTemplates.find((t) => t.name === label);

    const agentPhases = template?.phases || [];
    const hasPhases = agentPhases.length > 0;

    const sequence = hasPhases
      ? agentPhases.map((phase) => `${label} ${phase}`)
      : [
          `${label} connected to upstream task.`,
          `${label} fetching input payload from the workspace.`,
          `${label} validating schema and dependencies.`,
          `${label} processing workflow context.`,
          `${label} finished a downstream validation step.`,
          `${label} produced structured output for the next node.`,
        ];

    let step = 0;

    const emitNextLog = () => {
      if (step >= sequence.length) {
        return;
      }

      const nextPhaseIndex = step;
      appendNodeLog(activeNodeId, sequence[step]);
      setNodePhaseProgress((current) => ({
        ...current,
        [activeNodeId]: hasPhases ? nextPhaseIndex + 1 : 0,
      }));
      step += 1;
    };

    emitNextLog();

    const interval = setInterval(() => {
      emitNextLog();

      if (step >= sequence.length) {
        clearInterval(interval);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [activeNodeId, activeNodeLabel, appendNodeLog, isWorkflowRunning, setNodePhaseProgress]);
}
