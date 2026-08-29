import { BaseEdge, getBezierPath } from "@xyflow/react";

export function ProcessingEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.32,
  });
  const state = data?.state || "idle";
  const isProcessing = state === "processing";
  const isCompleted = state === "completed";
  const isFailed = state === "failed";
  const color = isFailed ? "#f43f5e" : isCompleted ? "#10b981" : isProcessing ? "#0ea5e9" : "#94a3b8";

  return (
    <g className={`workflow-edge workflow-edge--${state}`}>
      {isProcessing && (
        <path
          d={edgePath}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.14"
          className="workflow-edge__glow"
        />
      )}

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: isProcessing ? 2.5 : isCompleted ? 2 : 1.5,
          opacity: state === "idle" ? 0.72 : 1,
        }}
      />

      {isProcessing && (
        <>
          <text x={labelX} y={labelY - 10} textAnchor="middle" className="fill-sky-700 text-[9px] font-semibold uppercase tracking-wider">
            Transferring context
          </text>
          <circle r="4.5" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2">
            <animateMotion dur="1.8s" repeatCount="indefinite" path={edgePath} />
          </circle>
          <circle r="2.5" fill="#38bdf8" opacity="0.65">
            <animateMotion
              dur="1.8s"
              begin="-0.6s"
              repeatCount="indefinite"
              path={edgePath}
            />
          </circle>
        </>
      )}
    </g>
  );
}
