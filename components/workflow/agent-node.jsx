import { Handle, Position } from "@xyflow/react";

export function AgentNode({ data, selected }) {
  const status = data?.status || "Idle";
  const isSelected = Boolean(selected);
  const isRunning = status === "Running";

  const statusStyles = {
    Idle: {
      container: "border-slate-200 bg-white/90",
      dot: data.accent || "#67e8f9",
      badge: "border-slate-200 bg-slate-50 text-slate-600",
      glow: "shadow-[0_12px_30px_rgba(15,23,42,0.08)]",
    },
    Running: {
      container: "border-cyan-400 bg-cyan-50/80",
      dot: "#0ea5e9",
      badge: "border-cyan-200 bg-cyan-100 text-cyan-700",
      glow: "shadow-[0_0_0_3px_rgba(14,165,233,0.14),0_20px_40px_rgba(14,165,233,0.18)]",
    },
    Completed: {
      container: "border-emerald-300 bg-emerald-50/80",
      dot: "#10b981",
      badge: "border-emerald-200 bg-emerald-100 text-emerald-700",
      glow: "shadow-[0_0_0_3px_rgba(16,185,129,0.12),0_18px_35px_rgba(16,185,129,0.12)]",
    },
    Queued: {
      container: "border-slate-200 bg-slate-50/90",
      dot: "#94a3b8",
      badge: "border-slate-200 bg-white text-slate-500",
      glow: "shadow-[0_10px_24px_rgba(15,23,42,0.05)]",
    },
    Failed: {
      container: "border-rose-300 bg-rose-50/80",
      dot: "#f43f5e",
      badge: "border-rose-200 bg-rose-100 text-rose-700",
      glow: "shadow-[0_0_0_3px_rgba(244,63,94,0.1)]",
    },
  };

  const currentStyle = statusStyles[status] || statusStyles.Idle;

  return (
    <div
      className={`min-w-[210px] rounded-[18px] border px-3 py-3 transition-all duration-200 ${currentStyle.container} ${currentStyle.glow} ${
        isSelected
          ? "ring-2 ring-cyan-400/80 ring-offset-2 ring-offset-white"
          : ""
      }`}
      style={{
        background:
          status === "Running"
            ? "rgba(224, 242, 254, 0.9)"
            : data.tint || "rgba(255,255,255,0.9)",
        borderColor: isSelected
          ? "#38bdf8"
          : status === "Completed"
            ? "#86efac"
            : status === "Running"
              ? "#38bdf8"
              : data.border || "#cbd5e1",
        boxShadow: isSelected
          ? "0 0 0 4px rgba(56, 189, 248, 0.16), 0 20px 45px rgba(14, 165, 233, 0.15)"
          : undefined,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-slate-900 !bg-white"
      />

      <div className="mb-2 flex items-center justify-end gap-2">
        <span
          className={`rounded-full border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.18em] ${currentStyle.badge}`}
        >
          {status === "Running"
            ? "Processing"
            : status === "Completed"
              ? "Done"
              : status}
        </span>
      </div>

      <div className="flex items-start gap-2.5">
        <span
          className="mt-1.5 h-2.5 w-2.5 rounded-full"
          style={{ background: data.accent || "#67e8f9" }}
        />
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-5 text-slate-900">
            {data.label}
          </div>
          {data.description ? (
            <div className="mt-1 text-[11px] leading-4 text-slate-600">
              {data.description}
            </div>
          ) : null}
        </div>
      </div>

      {isRunning && (
        <div className="mt-2 border-t border-cyan-200/70 pt-2 text-cyan-700">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em]">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-500" />
              Processing
            </div>
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-slate-900 !bg-white"
      />
    </div>
  );
}
