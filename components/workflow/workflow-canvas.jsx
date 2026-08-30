import { useEffect, useRef } from "react";
import {
  Background,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { AgentNode } from "@/components/workflow/agent-node";
import { BoundaryNode } from "@/components/workflow/boundary-node";
import { ProcessingEdge } from "@/components/workflow/processing-edge";

const nodeTypes = {
  agentNode: AgentNode,
  boundaryNode: BoundaryNode,
};

const edgeTypes = {
  processingEdge: ProcessingEdge,
};

function WorkflowFlow({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onDrop,
  onDragOver,
  isWorkflowRunning,
}) {
  const { fitView, screenToFlowPosition } = useReactFlow();
  const hasInitializedView = useRef(false);

  useEffect(() => {
    if (nodes.length > 0 && !hasInitializedView.current) {
      fitView({ padding: 0.22, duration: 220 });
      hasInitializedView.current = true;
    }
  }, [fitView, nodes.length]);

  return (
    <div
      className="h-[760px] w-full"
      onWheel={(event) => {
        if (event.ctrlKey || event.metaKey) {
          return;
        }
        event.preventDefault();
      }}
      onDragOver={(event) => {
        if (isWorkflowRunning) {
          event.dataTransfer.dropEffect = "none";
          return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragOver?.(event);
      }}
      onDrop={(event) => {
        event.preventDefault();
        if (isWorkflowRunning) {
          return;
        }

        const flowPosition = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        onDrop?.(event, flowPosition);
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.22 }}
        zoomOnScroll={true}
        panOnScroll={true}
        panOnDrag={true}
        zoomOnPinch={true}
        minZoom={0.7}
        maxZoom={1.6}
        nodesDraggable={!isWorkflowRunning}
        nodesConnectable={!isWorkflowRunning}
        elementsSelectable={true}
        defaultEdgeOptions={{
          type: "processingEdge",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#7dd3fc",
          },
          style: {
            stroke: isWorkflowRunning ? "#7dd3fc" : "#cbd5e1",
            strokeWidth: isWorkflowRunning ? 2.5 : 1.5,
            strokeDasharray: "0",
          },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#cbd5e1" gap={22} size={1.1} />
      </ReactFlow>
    </div>
  );
}

export function WorkflowCanvas(props) {
  return (
    <ReactFlowProvider>
      <WorkflowFlow {...props} />
    </ReactFlowProvider>
  );
}
