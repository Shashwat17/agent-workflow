export const agentTemplates = [
  {
    id: "business-analyst",
    name: "Business Analyst",
    description:
      "Collects signals, requirements, and context before orchestration begins.",
    accent: "#67e8f9",
    tint: "rgba(103, 232, 249, 0.12)",
    border: "#67e8f9",
    defaultPrompt:
      "Analyze the business context, clarify requirements, and summarize the most relevant signals to support the workflow.",
    output:
      "Business analysis completed: 3 priorities mapped, 2 risk areas identified, and 1 decision checkpoint flagged.",
    phases: [],
  },
  {
    id: "architect",
    name: "Architect",
    description:
      "Transforms findings into an execution-ready architecture and sequencing plan.",
    accent: "#a78bfa",
    tint: "rgba(167, 139, 250, 0.12)",
    border: "#a78bfa",
    defaultPrompt:
      "Convert findings into a structured system design plan with components, dependencies, and approval checkpoints.",
    output:
      "Architecture generated with 4 milestones, 2 dependency gates, and 1 review checkpoint.",
    phases: [],
  },
  {
    id: "devforce",
    name: "DevForce",
    description:
      "Executes a multi-step engineering workflow across planning, implementation, review, and handoff.",
    accent: "#86efac",
    tint: "rgba(134, 239, 172, 0.12)",
    border: "#86efac",
    defaultPrompt:
      "Execute the assigned engineering workflow by coordinating requirements, implementation, validation, and final delivery in a production-ready format.",
    output:
      "DevForce completed: implementation validated, integration checks passed, and the final output prepared for handoff.",
    phases: [
      "phase 1/7: requirements intake and scope validation",
      "phase 2/7: design review and dependency mapping",
      "phase 3/7: implementation skeleton prepared",
      "phase 4/7: code and config generation in progress",
      "phase 5/7: quality checks and test execution",
      "phase 6/7: integration validation and patching",
      "phase 7/7: final handoff and output packaging",
    ],
  },
];

export const defaultSkillOptions = [
  "Policy pack",
  "Knowledge base",
  "Tool schema",
];
