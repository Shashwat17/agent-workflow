import { z } from "zod";

export const workflowSchema = z.object({
  name: z.string().min(1, "Workflow name is required"),
  nodes: z.array(z.any()).default([]),
  edges: z.array(z.any()).default([]),
});

export const runSchema = z.object({
  workflowId: z.string().min(1, "workflowId is required"),
  status: z.string().default("queued"),
  logs: z.array(z.any()).default([]),
});
