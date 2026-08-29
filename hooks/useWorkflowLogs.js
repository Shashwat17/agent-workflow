import { useCallback, useState } from "react";

export function useWorkflowLogs() {
  const [liveLogsByNode, setLiveLogsByNode] = useState({});
  const [selectedLogFilter, setSelectedLogFilter] = useState("ALL");

  const appendNodeLog = useCallback((nodeId, message) => {
    if (!nodeId || !message) {
      return;
    }

    const level = /error|failed|issue|warning|warn/i.test(message)
      ? "ERROR"
      : /warn|warning/i.test(message)
        ? "WARN"
        : /start|connected|completed|success|produced|processed/i.test(message)
          ? "INFO"
          : "EVENT";

    const nextEntry = {
      id: `${nodeId}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      level,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
      message,
    };

    setLiveLogsByNode((current) => ({
      ...current,
      [nodeId]: [...(current[nodeId] || []), nextEntry].slice(-40),
    }));
  }, []);

  const clearLogs = useCallback(() => {
    setLiveLogsByNode({});
  }, []);

  const clearNodeLogs = useCallback((nodeId) => {
    setLiveLogsByNode((current) => {
      const next = { ...current };
      delete next[nodeId];
      return next;
    });
  }, []);

  return {
    liveLogsByNode,
    setLiveLogsByNode,
    appendNodeLog,
    clearLogs,
    clearNodeLogs,
    selectedLogFilter,
    setSelectedLogFilter,
  };
}
