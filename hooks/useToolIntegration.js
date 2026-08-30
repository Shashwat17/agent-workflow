import { useCallback, useEffect, useMemo } from "react";
import {
  useGetConnectionsQuery,
  useRemoveConnectionMutation,
  useSaveConnectionMutation,
} from "@/lib/store/api-slice";

export function useToolIntegration(onError) {
  const { data, error } = useGetConnectionsQuery();
  const [saveConnection] = useSaveConnectionMutation();
  const [removeConnection] = useRemoveConnectionMutation();
  const connectedTools = useMemo(
    () => data?.connections || [],
    [data?.connections],
  );

  useEffect(() => {
    if (error) onError?.(error.message || "Could not load integrations.");
  }, [error, onError]);

  const saveTool = useCallback(
    (tool) => saveConnection(tool).unwrap(),
    [saveConnection],
  );
  const removeTool = useCallback(
    (toolId) => removeConnection(toolId).unwrap(),
    [removeConnection],
  );
  const getTool = useCallback(
    (toolId) => connectedTools.find((tool) => tool.id === toolId),
    [connectedTools],
  );

  return { connectedTools, saveTool, removeTool, getTool };
}
