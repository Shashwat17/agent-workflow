import { useCallback, useState } from "react";

export function useWorkflowHistory() {
  const [history, setHistory] = useState([]);

  const pushHistory = useCallback((nextNodes, nextEdges) => {
    setHistory((current) =>
      [
        ...current,
        {
          nodes: JSON.parse(JSON.stringify(nextNodes)),
          edges: JSON.parse(JSON.stringify(nextEdges)),
        },
      ].slice(-30),
    );
  }, []);

  const popHistory = useCallback(() => {
    if (history.length === 0) {
      return null;
    }

    const previousState = history[history.length - 1];
    setHistory((current) => current.slice(0, -1));
    return previousState;
  }, [history]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const hasHistory = history.length > 0;

  return {
    history,
    setHistory,
    pushHistory,
    popHistory,
    clearHistory,
    hasHistory,
  };
}
