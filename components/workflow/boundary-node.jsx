import { Handle, Position } from "@xyflow/react";

export function BoundaryNode({ data, selected }) {
  const isStart = data?.nodeKind === "start";
  const status = data?.status || "Idle";
  const isActive = status === "Running" || status === "Completed";

  return (
    <div
      className={`min-w-[150px] rounded-2xl border px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition ${selected ? "ring-2 ring-cyan-400 ring-offset-2" : ""}`}
      style={{ background: data?.tint, borderColor: isActive ? data?.accent : data?.border }}
    >
      {!isStart && (
        <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-slate-900 !bg-white" />
      )}
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: data?.accent }}>
          {isStart ? "▶" : "■"}
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{data?.label}</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
            {isActive ? status : isStart ? "Entry point" : "Exit point"}
          </p>
        </div>
      </div>
      {isStart && (
        <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-slate-900 !bg-white" />
      )}
    </div>
  );
}
