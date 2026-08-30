import { useState } from "react";

import { Button } from "@/components/ui/button";
import { WorkflowToolIntegrationModal } from "@/components/workflow/workflow-tool-integration-modal";

export function WorkflowHeader({
  isWorkflowRunning,
  onWorkflowToggle,
  onClearCanvas,
  hasNodes,
  connectedTools = [],
  onSaveTool,
  onTestConnection,
  validationIssues = [],
}) {
  const [integrationOpen, setIntegrationOpen] = useState(false);
  const canStart = hasNodes && !isWorkflowRunning;
  const canStop = hasNodes && isWorkflowRunning;

  return (
    <>
      <header className="flex flex-col gap-4 rounded-[26px] border border-slate-200 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-cyan-700">
            AI Ops Console
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl">
            Workflow orchestration canvas
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5">
            {connectedTools.length > 0 ? (
              connectedTools.slice(0, 2).map((tool) => (
                <span
                  key={tool.id}
                  className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] font-medium uppercase tracking-[0.18em] text-slate-700"
                >
                  {tool.shortLabel || tool.label}
                </span>
              ))
            ) : (
              <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-slate-500">
                No tools
              </span>
            )}
          </div>

          <Button
            variant="outline"
            className="border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={() => setIntegrationOpen(true)}
            disabled={isWorkflowRunning}
          >
            Integrate tools
          </Button>

          <Button
            variant="outline"
            className="border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={onClearCanvas}
            disabled={isWorkflowRunning}
          >
            Clear canvas
          </Button>

          <Button
            className="bg-emerald-500 text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-200"
            onClick={() => onWorkflowToggle(true)}
            disabled={!canStart}
          >
            {isWorkflowRunning ? "Workflow running" : "Start workflow"}
          </Button>

          <Button
            variant="secondary"
            className="bg-slate-100 text-slate-800 hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            onClick={() => onWorkflowToggle(false)}
            disabled={!canStop}
          >
            Stop workflow
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 px-1">
        <span
          className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${validationIssues.some((issue) => issue.type === "error") ? "bg-rose-50 text-rose-700" : validationIssues.length ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
        >
          {validationIssues.length
            ? `${validationIssues.length} validation issue${validationIssues.length === 1 ? "" : "s"}`
            : "Workflow valid"}
        </span>
      </div>

      <WorkflowToolIntegrationModal
        open={integrationOpen}
        onOpenChange={setIntegrationOpen}
        existingTools={connectedTools}
        onSaveTool={onSaveTool}
        onTestConnection={onTestConnection}
      />
    </>
  );
}
