function graphMaps(nodes, edges) {
  const adjacency = new Map(nodes.map((node) => [node.id, []]));
  const reverse = new Map(nodes.map((node) => [node.id, []]));
  edges.forEach((edge) => {
    if (adjacency.has(edge.source) && reverse.has(edge.target)) {
      adjacency.get(edge.source).push(edge.target);
      reverse.get(edge.target).push(edge.source);
    }
  });
  return { adjacency, reverse };
}

function reachableFrom(startId, graph) {
  const visited = new Set();
  const queue = startId ? [startId] : [];
  while (queue.length) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    queue.push(...(graph.get(id) || []));
  }
  return visited;
}

export function getExecutionOrder(nodes, edges) {
  const { adjacency } = graphMaps(nodes, edges);
  const indegree = new Map(nodes.map((node) => [node.id, 0]));
  edges.forEach((edge) => {
    if (indegree.has(edge.target) && indegree.has(edge.source)) {
      indegree.set(edge.target, indegree.get(edge.target) + 1);
    }
  });
  const queue = nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);
  const orderedIds = [];
  while (queue.length) {
    const id = queue.shift();
    orderedIds.push(id);
    (adjacency.get(id) || []).forEach((targetId) => {
      indegree.set(targetId, indegree.get(targetId) - 1);
      if (indegree.get(targetId) === 0) queue.push(targetId);
    });
  }
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return orderedIds
    .map((id) => byId.get(id))
    .filter((node) => node && !["start", "end"].includes(node.data?.nodeKind));
}

export function validateWorkflow(nodes, edges) {
  const issues = [];
  const starts = nodes.filter((node) => node.data?.nodeKind === "start");
  const ends = nodes.filter((node) => node.data?.nodeKind === "end");
  const agents = nodes.filter((node) => node.data?.nodeKind !== "start" && node.data?.nodeKind !== "end");

  if (starts.length !== 1) issues.push({ type: "error", message: starts.length ? "Only one Start node is allowed." : "Add a Start node." });
  if (ends.length !== 1) issues.push({ type: "error", message: ends.length ? "Only one End node is allowed." : "Add an End node." });
  if (!agents.length) issues.push({ type: "error", message: "Add at least one agent between Start and End." });

  agents.forEach((node) => {
    if (!String(node.data?.prompt || "").trim()) issues.push({ type: "error", nodeId: node.id, message: `${node.data?.label || "Agent"} needs a prompt.` });
  });

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edgeKeys = new Set();
  edges.forEach((edge) => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) issues.push({ type: "error", message: "A connection references a missing node." });
    if (edge.source === edge.target) issues.push({ type: "error", nodeId: edge.source, message: "A node cannot connect to itself." });
    const key = `${edge.source}->${edge.target}`;
    if (edgeKeys.has(key)) issues.push({ type: "error", message: "Duplicate connections are not allowed." });
    edgeKeys.add(key);
  });

  const { adjacency, reverse } = graphMaps(nodes, edges);
  const start = starts[0];
  const end = ends[0];
  if (start && (reverse.get(start.id) || []).length) issues.push({ type: "error", nodeId: start.id, message: "Start cannot have incoming connections." });
  if (start && !(adjacency.get(start.id) || []).length) issues.push({ type: "error", nodeId: start.id, message: "Start must connect to an agent." });
  if (end && (adjacency.get(end.id) || []).length) issues.push({ type: "error", nodeId: end.id, message: "End cannot have outgoing connections." });
  if (end && !(reverse.get(end.id) || []).length) issues.push({ type: "error", nodeId: end.id, message: "An agent must connect to End." });

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

  if (start && end) {
    const fromStart = reachableFrom(start.id, adjacency);
    const toEnd = reachableFrom(end.id, reverse);
    agents.forEach((node) => {
      if (!fromStart.has(node.id) || !toEnd.has(node.id)) issues.push({ type: "error", nodeId: node.id, message: `${node.data?.label || "Agent"} must be on a path from Start to End.` });
    });
    if (!fromStart.has(end.id)) issues.push({ type: "error", message: "Start must have a complete path to End." });
  }

  return issues;
}
