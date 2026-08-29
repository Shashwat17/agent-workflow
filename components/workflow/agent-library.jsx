import { agentTemplates, boundaryTemplates } from "@/lib/workflow-data";

export function AgentLibrary({ isWorkflowRunning = false }) {
  return (
    <aside className="rounded-[28px] border border-slate-200 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">
          Agent pool
        </h2>
        <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-700">
          {agentTemplates.length} agents
        </span>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Workflow nodes
        </p>
        <div className="grid grid-cols-2 gap-2">
          {boundaryTemplates.map((node) => (
            <div
              key={node.id}
              draggable={!isWorkflowRunning}
              aria-disabled={isWorkflowRunning}
              onDragStart={(event) => {
                if (isWorkflowRunning) {
                  event.preventDefault();
                  return;
                }
                event.dataTransfer.setData("application/reactflow", node.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              className={`rounded-xl border p-3 transition ${isWorkflowRunning ? "cursor-not-allowed opacity-55" : "cursor-grab hover:-translate-y-0.5 hover:shadow-sm active:cursor-grabbing"}`}
              style={{ borderColor: node.border, background: node.tint }}
            >
              <span className="mb-2 block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: node.accent }} />
              <span className="text-sm font-semibold text-slate-800">{node.name}</span>
            </div>
          ))}
        </div>
        <p className="pt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
          Agents
        </p>
        {agentTemplates.map((agent) => (
          <div
            key={agent.id}
            draggable={!isWorkflowRunning}
            aria-disabled={isWorkflowRunning}
            onDragStart={(event) => {
              if (isWorkflowRunning) {
                event.preventDefault();
                return;
              }

              event.dataTransfer.setData("application/reactflow", agent.id);
              event.dataTransfer.effectAllowed = "move";
            }}
            className={`rounded-2xl border border-slate-200 bg-slate-50 p-3 transition duration-200 ${
              isWorkflowRunning
                ? "cursor-not-allowed opacity-55"
                : "cursor-grab hover:border-sky-300 hover:bg-sky-50 active:cursor-grabbing"
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: agent.accent }}
              />
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                {agent.id}
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              {agent.name}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {agent.description}
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}
