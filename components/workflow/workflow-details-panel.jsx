import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { nodeFormSchema } from "@/lib/validation-schemas";
import { agentTemplates } from "@/lib/workflow-data";

export function WorkflowDetailsPanel({
  selectedNode,
  selectedLogFilter = "ALL",
  onLogFilterChange,
  onFieldChange,
  uploadedFiles,
  onFileUpload,
  fileInputRef,
  onDeleteNode,
  onClose,
  isWorkflowRunning = false,
  onClearLogs,
  onRetry,
}) {
  const [stagesOpen, setStagesOpen] = useState(false);
  const nodeData = selectedNode?.data || {};

  const statusText = String(nodeData.status || "Idle").toUpperCase();
  const isRunning = nodeData.status === "Running";
  const logs = useMemo(() => Array.isArray(nodeData.logs) ? nodeData.logs : [], [nodeData.logs]);
  const filteredLogs = useMemo(() => {
    return selectedLogFilter === "ALL"
      ? logs
      : logs.filter((log) => log.level === selectedLogFilter);
  }, [logs, selectedLogFilter]);
  const phases = agentTemplates.find((item) => item.name === nodeData.label)?.phases || [];

  const form = useForm({
    resolver: zodResolver(nodeFormSchema),
    defaultValues: {
      prompt: nodeData.prompt || "",
      output: nodeData.output || "",
    },
    mode: "onChange",
  });

  const handlePromptChange = (value) => {
    onFieldChange?.("prompt", value);
    form.setValue("prompt", value);
  };

  const handleOutputChange = (value) => {
    onFieldChange?.("output", value);
    form.setValue("output", value);
  };

  if (!selectedNode) return null;

  const downloadLogs = () => {
    const blob = new Blob([logs.map((log) => `${log.time} ${log.level} ${log.message}`).join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${nodeData.label || "agent"}-logs.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (isRunning) {
    return (
      <aside className="h-full min-h-full w-full bg-[#0f172a] text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-700 bg-[#111827] px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-sm border border-slate-500 bg-slate-700 text-[8px] text-slate-200">
              ▣
            </span>
            <span>Live Logs</span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-lg text-slate-200 transition hover:bg-slate-700"
              aria-label="Close drawer"
            >
              ×
            </button>
          )}
        </div>

        <div className="border-b border-slate-700 bg-[#111827] px-3 py-2">
          <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">
            {["ALL", "INFO", "WARN", "ERROR", "EVENT"].map((tag) => {
              const isActive = selectedLogFilter === tag;

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onLogFilterChange?.(tag)}
                  className={
                    isActive
                      ? "rounded-md bg-orange-500 px-2 py-1 text-white"
                      : "rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-slate-300 transition hover:bg-slate-700"
                  }
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {phases.length > 0 && (
          <div className="border-b border-slate-700 bg-slate-900 px-4 py-3">
            <button
              type="button"
              onClick={() => setStagesOpen((current) => !current)}
              className="flex w-full items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 transition hover:text-slate-200"
              aria-expanded={stagesOpen}
            >
              <span className="flex items-center gap-2">
                <span className={`text-xs transition-transform ${stagesOpen ? "rotate-90" : ""}`}>›</span>
                Execution stages
              </span>
              <span>{nodeData.phaseIndex || 0}/{phases.length}</span>
            </button>

            {stagesOpen && (
              <div className="mt-3 space-y-1.5 border-t border-slate-800 pt-3">
                {phases.map((phase, index) => {
                  const number = index + 1;
                  const complete = number < (nodeData.phaseIndex || 0);
                  const active = number === (nodeData.phaseIndex || 0);
                  return <div key={phase} className={`flex items-start gap-2 text-[11px] ${active ? "text-cyan-300" : complete ? "text-emerald-300" : "text-slate-500"}`}>
                    <span className="mt-0.5">{complete ? "✓" : active ? "●" : "○"}</span>
                    <span>{phase.replace(/^phase \d+\/\d+:\s*/i, "")}</span>
                  </div>;
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 border-b border-slate-700 bg-[#111827] px-3 py-2">
          <button type="button" onClick={() => navigator.clipboard?.writeText(logs.map((log) => `${log.time} ${log.level} ${log.message}`).join("\n"))} className="text-[10px] text-slate-300">Copy</button>
          <button type="button" onClick={downloadLogs} className="text-[10px] text-slate-300">Download</button>
          <button type="button" onClick={onClearLogs} className="text-[10px] text-rose-300">Clear</button>
        </div>

        <div className={`${stagesOpen ? "max-h-[48%]" : "h-[calc(100%-190px)]"} overflow-y-auto bg-[#0f172a] px-3 pb-4 pt-2 font-mono text-[11px] leading-6`}>
          {filteredLogs.length > 0 ? (
            <ul className="space-y-1">
              {filteredLogs.map((log) => {
                const levelClass =
                  log.level === "ERROR"
                    ? "text-[#ff6b6b]"
                    : log.level === "WARN"
                      ? "text-[#fbbf24]"
                      : log.level === "INFO"
                        ? "text-[#7dd3fc]"
                        : "text-[#cbd5e1]";

                return (
                  <li key={log.id} className="flex gap-3 text-slate-200">
                    <span className="w-[68px] shrink-0 text-slate-400">
                      {log.time}
                    </span>
                    <span
                      className={`w-[52px] shrink-0 font-semibold ${levelClass}`}
                    >
                      {log.level}
                    </span>
                    <span className="flex-1 break-words text-slate-200">
                      {log.message}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Waiting for logs...
            </div>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className="h-full min-h-full w-full rounded-none bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
            Selected agent
          </p>
          <h2 className="mt-1 text-[24px] font-semibold leading-tight tracking-[-0.04em] text-slate-900">
            {selectedNode.data.label}
          </h2>
        </div>

        <div className="flex items-center gap-2 pt-0.5">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.18em] text-emerald-700">
            {statusText}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-lg text-slate-600 transition hover:bg-slate-100"
              aria-label="Close drawer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="mb-5">
        <Button
          type="button"
          onClick={onDeleteNode}
          variant="destructive"
          className="w-full border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
          disabled={isWorkflowRunning}
        >
          Delete node
        </Button>
      </div>

      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt input</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter agent prompt..."
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handlePromptChange(e.target.value);
                    }}
                    rows={6}
                    className="resize-none"
                    disabled={isWorkflowRunning}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="output"
            render={({ field }) => (
              <FormItem>
                <FormLabel>AI response</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Agent output will appear here..."
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleOutputChange(e.target.value);
                    }}
                    rows={6}
                    className="resize-none"
                    disabled={isWorkflowRunning}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.24em] text-slate-500">
              Skill file
            </label>

            <div
              className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-sm text-slate-600 transition hover:border-cyan-400 hover:text-cyan-700"
              onClick={() => fileInputRef.current?.click()}
              aria-disabled={isWorkflowRunning}
            >
              {uploadedFiles.length > 0
                ? `${uploadedFiles.length} file(s) selected`
                : "Upload skill file"}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf,.json,.yaml,.yml"
              className="hidden"
              multiple
              onChange={onFileUpload}
              disabled={isWorkflowRunning}
            />

            {uploadedFiles.length > 0 && (
              <ul className="mt-3 space-y-2">
                {uploadedFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-600"
                  >
                    {file.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(nodeData.status === "Failed" || nodeData.status === "Completed") && (
            <Button type="button" variant="outline" onClick={onRetry} disabled={isWorkflowRunning} className="w-full">Retry from this node</Button>
          )}
        </div>
      </Form>
    </aside>
  );
}
