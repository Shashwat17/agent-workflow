export const mockStore = {
  runs: new Map(),
  files: new Map(),
  connections: [
    { id: "jira", integrationId: "jira", label: "Jira", shortLabel: "JIRA", status: "Connected", workspace: "Workflow Ops" },
    { id: "azure", integrationId: "azure", label: "Azure DevOps", shortLabel: "AZURE", status: "Connected", workspace: "contoso" },
  ],
};

export function createMockId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}
