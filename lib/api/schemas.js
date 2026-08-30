import { z } from "zod";

const identifier = z.string().min(1);
const timestamp = z.string().optional();

export const agentsResponseSchema = z.object({
  agents: z.array(
    z.object({ id: identifier, name: z.string().min(1) }).passthrough(),
  ),
});

export const validationResponseSchema = z.object({
  valid: z.boolean(),
  issues: z.array(z.object({ message: z.string() }).passthrough()),
  executionOrder: z.array(identifier),
});

export const startRunResponseSchema = z.object({
  runId: identifier,
  status: z.string(),
  createdAt: timestamp,
  executionOrder: z.array(identifier),
  eventsUrl: z.string().min(1),
  statusUrl: z.string().min(1),
});

export const runResponseSchema = z
  .object({ runId: identifier, status: z.string() })
  .passthrough();
export const stopRunResponseSchema = z.object({
  runId: identifier,
  status: z.string(),
  requestedAt: timestamp,
});
export const retryNodeResponseSchema = z
  .object({
    runId: identifier,
    nodeId: identifier,
    attempt: z.number(),
    status: z.string(),
  })
  .passthrough();
export const fileResponseSchema = z
  .object({ fileId: identifier, name: z.string(), status: z.string() })
  .passthrough();
export const deleteFileResponseSchema = z.object({
  fileId: identifier,
  deleted: z.boolean(),
});
export const integrationsResponseSchema = z.object({
  integrations: z.array(
    z.object({ id: identifier, name: z.string() }).passthrough(),
  ),
});
export const connectionsResponseSchema = z.object({
  connections: z.array(
    z.object({ id: identifier, status: z.string() }).passthrough(),
  ),
});
export const connectionResponseSchema = z
  .object({ id: identifier, status: z.string() })
  .passthrough();
export const deleteConnectionResponseSchema = z.object({
  connectionId: identifier,
  deleted: z.boolean(),
});

export const runEventSchema = z
  .object({
    type: z.enum([
      "stream.ready",
      "run.queued",
      "run.started",
      "node.queued",
      "node.started",
      "stage.started",
      "stage.completed",
      "log",
      "node.completed",
      "node.failed",
      "run.completed",
      "run.failed",
      "run.stopped",
      "heartbeat",
    ]),
    runId: identifier,
    sequence: z.number().int().nonnegative().optional(),
    eventId: z.string().optional(),
    timestamp,
    nodeId: z.string().optional(),
  })
  .passthrough();

export function parseResponse(schema, value) {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const error = new Error(
    "Backend response did not match the expected contract.",
  );
  error.code = "INVALID_API_RESPONSE";
  error.details = result.error.issues;
  throw error;
}
