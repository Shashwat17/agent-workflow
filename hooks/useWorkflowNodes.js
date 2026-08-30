import { useCallback, useMemo } from "react";
import { addEdge, useEdgesState, useNodesState } from "@xyflow/react";
import { agentTemplates, boundaryTemplates } from "@/lib/workflow-data";

export function useWorkflowNodes(isWorkflowRunning) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const hasNodes = nodes.length > 0;

  const getAutoPosition = useCallback(
    (flowPosition) => {
      if (flowPosition) {
        return flowPosition;
      }

      if (!nodes.length) {
        return { x: 180, y: 120 };
      }

      const bounds = nodes.reduce(
        (acc, node) => {
          const x = node.position?.x ?? 0;
          const y = node.position?.y ?? 0;
          const width = 240;
          const height = 120;

          return {
            minX: Math.min(acc.minX, x),
            minY: Math.min(acc.minY, y),
            maxX: Math.max(acc.maxX, x + width),
            maxY: Math.max(acc.maxY, y + height),
          };
        },
        {
          minX: Number.POSITIVE_INFINITY,
          minY: Number.POSITIVE_INFINITY,
          maxX: Number.NEGATIVE_INFINITY,
          maxY: Number.NEGATIVE_INFINITY,
        },
      );

      const nextX = bounds.maxX + 220;
      const nextY = Math.max(120, bounds.minY + 60);

      return {
        x: nextX,
        y: nextY,
      };
    },
    [nodes],
  );

  const handleDrop = useCallback(
    (event, selectedNodeId, setSelectedNodeId, flowPosition) => {
      event.preventDefault();

      if (isWorkflowRunning) {
        return;
      }

      const type = event.dataTransfer.getData("application/reactflow");
      const template = [...boundaryTemplates, ...agentTemplates].find(
        (item) => item.id === type,
      );

      if (!template) {
        return;
      }

      const alreadyExists = nodes.some(
        (node) => node.data?.label === template.name,
      );
      if (alreadyExists) {
        return;
      }

      const position = getAutoPosition(flowPosition);

      const newNode = {
        id: `${template.id}-${Date.now()}`,
        type: template.nodeKind ? "boundaryNode" : "agentNode",
        position,
        data: {
          label: template.name,
          nodeKind: template.nodeKind || "agent",
          agentType: template.nodeKind ? null : template.id,
          description: template.description,
          prompt: template.defaultPrompt || "",
          output: template.output || "",
          status: isWorkflowRunning ? "Running" : "Idle",
          phaseIndex: 0,
          totalPhases: template.phases?.length ?? 0,
          accent: template.accent,
          border: template.border,
          tint: template.tint,
        },
      };

      setNodes((current) => current.concat(newNode));
      setSelectedNodeId(template.nodeKind ? null : newNode.id);
    },
    [nodes, isWorkflowRunning, getAutoPosition, setNodes],
  );

  const handleConnect = useCallback(
    (params) => {
      if (isWorkflowRunning || !params.source || !params.target) {
        return;
      }

      const sourceNode = nodes.find((node) => node.id === params.source);
      const targetNode = nodes.find((node) => node.id === params.target);
      const invalidBoundary =
        sourceNode?.data?.nodeKind === "end" ||
        targetNode?.data?.nodeKind === "start";
      const duplicate = edges.some(
        (edge) =>
          edge.source === params.source && edge.target === params.target,
      );
      if (invalidBoundary || duplicate || params.source === params.target) {
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
    [edges, isWorkflowRunning, nodes, setEdges],
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
        const targetKind = targetNode?.data?.nodeKind;
        const hasNextAgent = !targetKind || targetKind !== "end";
        const isCurrentActiveEdge =
          sourceStatus === "Running" &&
          hasNextAgent &&
          targetStatus !== "Completed" &&
          targetStatus !== "Failed";
        const isCompleted =
          sourceStatus === "Completed" && targetStatus === "Completed";
        const isFailed = sourceStatus === "Failed" || targetStatus === "Failed";

        return {
          ...edge,
          animated: false,
          type: "processingEdge",
          data: {
            ...edge.data,
            state: isFailed
              ? "failed"
              : isCurrentActiveEdge
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
