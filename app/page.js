"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AgentLibrary } from "@/components/workflow/agent-library";
import { WorkflowCanvas } from "@/components/workflow/workflow-canvas";
import { WorkflowDetailsPanel } from "@/components/workflow/workflow-details-panel";
import { WorkflowHeader } from "@/components/workflow/workflow-header";
import { validateWorkflow } from "@/lib/workflow-validation";
import {
  useKeyboardShortcuts,
  usePhaseEmitter,
  useToolIntegration,
  useWorkflowExecution,
  useWorkflowHistory,
  useWorkflowLogs,
  useWorkflowNodes,
} from "@/hooks";

export default function Home() {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);
  const [notice, setNotice] = useState("");
  const fileInputRef = useRef(null);

  const { nodes, setNodes, onNodesChange, edges, setEdges, onEdgesChange, hasNodes, handleDrop: hookHandleDrop, handleConnect: hookHandleConnect, updateSelectedNodeField, deleteNode, workflowEdges } = useWorkflowNodes(isWorkflowRunning);
  const { liveLogsByNode, appendNodeLog, clearNodeLogs, selectedLogFilter, setSelectedLogFilter } = useWorkflowLogs();
  const { connectedTools, saveTool } = useToolIntegration();
  const { history, pushHistory, popHistory } = useWorkflowHistory();

  const {
    executionIndex,
    setNodePhaseProgress,
    handleWorkflowToggle: hookHandleWorkflowToggle,
    retryNode,
  } = useWorkflowExecution(nodes, setNodes, isWorkflowRunning, setIsWorkflowRunning, setSelectedNodeId, appendNodeLog);

  const selectedNode = useMemo(() => nodes.find((node) => node.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);
  const activeNode = executionIndex >= 0 ? nodes[executionIndex] : null;
  const validationIssues = useMemo(() => validateWorkflow(nodes, edges), [edges, nodes]);
  const blockingIssues = validationIssues.filter((issue) => issue.type === "error");
  const executionSummary = useMemo(() => nodes.findLast((node) => node.data?.status === "Completed")?.data?.output || selectedNode?.data?.output || "", [nodes, selectedNode]);

  usePhaseEmitter(isWorkflowRunning, activeNode?.id, activeNode?.data?.label, appendNodeLog, setNodePhaseProgress);

  const handleUndo = useCallback(() => {
    if (isWorkflowRunning || !history.length) return;
    const previousState = popHistory();
    if (previousState) {
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
      setSelectedNodeId(null);
    }
  }, [history.length, isWorkflowRunning, popHistory, setEdges, setNodes]);

  const handleDeleteSelectedNode = useCallback(() => {
    if (isWorkflowRunning || !selectedNodeId) return;
    pushHistory(nodes, edges);
    deleteNode(selectedNodeId);
    setSelectedNodeId(null);
  }, [deleteNode, edges, isWorkflowRunning, nodes, pushHistory, selectedNodeId]);

  useKeyboardShortcuts(selectedNodeId, handleUndo, handleDeleteSelectedNode);

  const handleDrop = useCallback((event) => hookHandleDrop(event, selectedNodeId, setSelectedNodeId), [hookHandleDrop, selectedNodeId]);
  const handleConnect = useCallback((params) => {
    if (isWorkflowRunning) return;
    pushHistory(nodes, edges);
    hookHandleConnect(params);
  }, [edges, hookHandleConnect, isWorkflowRunning, nodes, pushHistory]);
  const handleFieldChange = useCallback((field, value) => {
    if (!isWorkflowRunning) updateSelectedNodeField(selectedNodeId, field, value);
  }, [isWorkflowRunning, selectedNodeId, updateSelectedNodeField]);

  const handleWorkflowToggle = useCallback((nextState, startIndex = 0) => {
    if (nextState && blockingIssues.length) {
      setNotice(blockingIssues[0].message);
      return;
    }
    setNotice("");
    hookHandleWorkflowToggle(nextState, hasNodes, startIndex);
  }, [blockingIssues, hasNodes, hookHandleWorkflowToggle]);

  return (
    <main className="h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="mx-auto flex h-full max-w-[1800px] flex-col gap-3 px-3 py-3 lg:px-4">
        <WorkflowHeader
          isWorkflowRunning={isWorkflowRunning}
          onWorkflowToggle={handleWorkflowToggle}
          onClearCanvas={() => { if (!isWorkflowRunning) { setNodes([]); setEdges([]); } }}
          hasNodes={hasNodes}
          connectedTools={connectedTools}
          onSaveTool={saveTool}
          validationIssues={validationIssues}
        />

        {(notice || validationIssues.length > 0) && (
          <div className="flex flex-wrap gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {notice && <span>{notice}</span>}
            {!notice && validationIssues.slice(0, 3).map((issue, index) => <button type="button" key={`${issue.message}-${index}`} onClick={() => issue.nodeId && setSelectedNodeId(issue.nodeId)}>{issue.message}</button>)}
          </div>
        )}

        <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[300px_minmax(0,1fr)]">
          <div className="min-h-0 overflow-y-auto">
            <AgentLibrary isWorkflowRunning={isWorkflowRunning} />
          </div>

          <div className="relative h-full overflow-hidden rounded-[28px] border border-slate-200 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <section className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Live workflow</p>
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700">
                  <span className={`h-2 w-2 rounded-full ${isWorkflowRunning ? "animate-pulse bg-emerald-500" : "bg-slate-400"}`} />
                  {isWorkflowRunning ? "Running" : "Idle"}
                </div>
              </div>
              <div className="h-[calc(100vh-260px)]">
                <WorkflowCanvas nodes={nodes} edges={workflowEdges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={handleConnect} onNodeClick={(_, node) => setSelectedNodeId(node.id)} onDrop={handleDrop} onDragOver={() => {}} isWorkflowRunning={isWorkflowRunning} />
              </div>
            </section>

            {selectedNode && (
              <div className="absolute inset-y-3 right-3 z-20 w-[380px] overflow-hidden border border-slate-200 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-md">
                <div className="h-full overflow-y-auto overscroll-contain">
                  <WorkflowDetailsPanel
                    selectedNode={{ ...selectedNode, data: { ...selectedNode.data, output: executionSummary || selectedNode.data?.output || "", logs: liveLogsByNode[selectedNode.id] || [] } }}
                    selectedLogFilter={selectedLogFilter}
                    onLogFilterChange={setSelectedLogFilter}
                    onFieldChange={handleFieldChange}
                    uploadedFiles={uploadedFiles}
                    onFileUpload={(event) => setUploadedFiles(Array.from(event.target.files || []))}
                    fileInputRef={fileInputRef}
                    onDeleteNode={handleDeleteSelectedNode}
                    onClose={() => setSelectedNodeId(null)}
                    isWorkflowRunning={isWorkflowRunning}
                    onClearLogs={() => clearNodeLogs(selectedNode.id)}
                    onRetry={() => retryNode(selectedNode.id)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
