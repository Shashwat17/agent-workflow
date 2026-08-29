import { useCallback, useState } from "react";

export function useToolIntegration() {
  const [connectedTools, setConnectedTools] = useState([
    {
      id: "jira",
      label: "Jira",
      shortLabel: "JIRA",
      status: "Connected",
      workspace: "Workflow Ops",
      url: "https://company.atlassian.net",
      email: "ops@company.com",
      project: "OPS",
    },
    {
      id: "azure",
      label: "Azure DevOps",
      shortLabel: "AZURE",
      status: "Connected",
      workspace: "contoso",
      url: "https://dev.azure.com/contoso",
      project: "Platform",
    },
  ]);

  const saveTool = useCallback((tool) => {
    setConnectedTools((current) => {
      const isExisting = current.some((item) => item.id === tool.id);

      if (isExisting) {
        return current.map((item) => (item.id === tool.id ? tool : item));
      }

      return [...current, tool];
    });
  }, []);

  const removeTool = useCallback((toolId) => {
    setConnectedTools((current) =>
      current.filter((tool) => tool.id !== toolId),
    );
  }, []);

  const getTool = useCallback(
    (toolId) => {
      return connectedTools.find((tool) => tool.id === toolId);
    },
    [connectedTools],
  );

  return {
    connectedTools,
    setConnectedTools,
    saveTool,
    removeTool,
    getTool,
  };
}
