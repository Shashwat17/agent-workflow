export function validateWorkflow(nodes, edges) {
  const issues = [];
  if (!nodes.length) return [{ type: "error", message: "Add at least one agent." }];

  nodes.forEach((node) => {
    if (!String(node.data?.prompt || "").trim()) {
      issues.push({ type: "error", nodeId: node.id, message: `${node.data?.label || "Agent"} needs a prompt.` });
    }
  });

  if (nodes.length > 1) {
    const connectedIds = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
    nodes.forEach((node) => {
      if (!connectedIds.has(node.id)) issues.push({ type: "warning", nodeId: node.id, message: `${node.data?.label || "Agent"} is not connected.` });
    });
  }

  const adjacency = new Map(nodes.map((node) => [node.id, []]));
  edges.forEach((edge) => adjacency.get(edge.source)?.push(edge.target));
  const visiting = new Set();
  const visited = new Set();
  const hasCycle = (nodeId) => {
    if (visiting.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visiting.add(nodeId);
    const cyclic = (adjacency.get(nodeId) || []).some(hasCycle);
    visiting.delete(nodeId);
    visited.add(nodeId);
    return cyclic;
  };
  if (nodes.some((node) => hasCycle(node.id))) issues.push({ type: "error", message: "Circular connections are not supported." });
  return issues;
}
