import { useCallback, useMemo } from "react";
import { addEdge, useEdgesState, useNodesState } from "@xyflow/react";
import { agentTemplates } from "@/lib/workflow-data";

export function useWorkflowNodes(isWorkflowRunning) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const hasNodes = nodes.length > 0;

  const getAutoPosition = useCallback((nodeIndex) => {
    const column = nodeIndex % 3;
    const row = Math.floor(nodeIndex / 3);

    return {
      x: 180 + column * 340,
      y: 120 + row * 220,
    };
  }, []);

  const handleDrop = useCallback(
    (event, selectedNodeId, setSelectedNodeId) => {
      event.preventDefault();

      if (isWorkflowRunning) {
        return;
      }

      const type = event.dataTransfer.getData("application/reactflow");
      const template = agentTemplates.find((item) => item.id === type);

      if (!template) {
        return;
      }

      const alreadyExists = nodes.some(
        (node) => node.data?.label === template.name,
      );
      if (alreadyExists) {
        return;
      }

      const nodeIndex = nodes.length;
      const position = getAutoPosition(nodeIndex);

      const newNode = {
        id: `${template.id}-${Date.now()}`,
        type: "agentNode",
        position,
        data: {
          label: template.name,
          description: template.description,
          prompt: template.defaultPrompt,
          output: template.output,
          status: isWorkflowRunning ? "Running" : "Idle",
          phaseIndex: 0,
          totalPhases: template.phases?.length ?? 0,
          accent: template.accent,
          border: template.border,
          tint: template.tint,
        },
      };

      setNodes((current) => current.concat(newNode));
      setSelectedNodeId(newNode.id);
    },
    [nodes, isWorkflowRunning, getAutoPosition, setNodes],
  );

  const handleConnect = useCallback(
    (params) => {
      if (isWorkflowRunning || !params.source || !params.target) {
        return;
      }

      setEdges((current) =>
        addEdge(
          {
            ...params,
            animated: false,
            type: "processingEdge",
            markerEnd: {
              type: "arrowclosed",
              color: "#7dd3fc",
            },
            style: {
              stroke: isWorkflowRunning ? "#7dd3fc" : "#cbd5e1",
              strokeWidth: isWorkflowRunning ? 2.5 : 1.5,
              strokeDasharray: "0",
            },
          },
          current,
        ),
      );
    },
    [isWorkflowRunning, setEdges],
  );

  const updateSelectedNodeField = useCallback(
    (nodeId, field, value) => {
      if (!nodeId) {
        return;
      }

      setNodes((current) =>
        current.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  [field]: value,
                },
              }
            : node,
        ),
      );
    },
    [setNodes],
  );

  const deleteNode = useCallback(
    (nodeId) => {
      setNodes((current) => current.filter((node) => node.id !== nodeId));
      setEdges((current) =>
        current.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId,
        ),
      );
    },
    [setNodes, setEdges],
  );

  const workflowEdges = useMemo(
    () =>
      edges.map((edge) => {
        const sourceNode = nodes.find((node) => node.id === edge.source);
        const targetNode = nodes.find((node) => node.id === edge.target);
        const sourceStatus = sourceNode?.data?.status;
        const targetStatus = targetNode?.data?.status;
        const isProcessing =
          sourceStatus === "Running" || targetStatus === "Running";
        const isCompleted =
          sourceStatus === "Completed" || targetStatus === "Completed";
        const isFailed = sourceStatus === "Failed" || targetStatus === "Failed";

        return {
          ...edge,
          animated: false,
          type: "processingEdge",
          data: {
            ...edge.data,
            state: isFailed
              ? "failed"
              : isProcessing
              ? "processing"
              : isCompleted
                ? "completed"
                : "idle",
          },
          markerEnd: {
            type: "arrowclosed",
            color: isFailed ? "#f43f5e" : isCompleted ? "#34d399" : "#7dd3fc",
          },
        };
      }),
    [edges, nodes],
  );

  return {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    hasNodes,
    handleDrop,
    handleConnect,
    updateSelectedNodeField,
    deleteNode,
    workflowEdges,
  };
}
