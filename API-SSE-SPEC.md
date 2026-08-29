# Agent Workflow API and SSE Specification

## 1. Purpose

The current application simulates agent execution in the browser. This document defines the backend APIs and Server-Sent Events (SSE) stream needed to execute workflows on a server while preserving the current UI behavior.

Recommended base path:

```text
/api/v1
```

All JSON APIs should return `Content-Type: application/json`. The event stream should return `Content-Type: text/event-stream`.

## 2. Core Data Types

### Agent node

```json
{
  "id": "devforce-1724931000000",
  "type": "agentNode",
  "position": { "x": 520, "y": 180 },
  "data": {
    "agentType": "devforce",
    "label": "DevForce",
    "prompt": "Execute the assigned engineering workflow.",
    "description": "Executes a multi-step engineering workflow.",
    "skills": ["skill-file-123"]
  }
}
```

### Start and End boundary nodes

Every executable workflow must contain exactly one Start node and one End node. Boundary nodes define graph entry and exit but are not agents and do not invoke a model.

```json
{
  "id": "workflow-start-1724930800000",
  "type": "boundaryNode",
  "data": {
    "nodeKind": "start",
    "label": "Start"
  }
}
```

```json
{
  "id": "workflow-end-1724931100000",
  "type": "boundaryNode",
  "data": {
    "nodeKind": "end",
    "label": "End"
  }
}
```

### Workflow edge

```json
{
  "id": "edge-business-devforce",
  "source": "business-analyst-1724930900000",
  "target": "devforce-1724931000000",
  "sourceHandle": null,
  "targetHandle": null
}
```

### Standard success envelope

```json
{
  "success": true,
  "data": {}
}
```

### Standard error envelope

```json
{
  "success": false,
  "error": {
    "code": "WORKFLOW_VALIDATION_FAILED",
    "message": "Workflow validation failed.",
    "details": [
      {
        "field": "nodes[0].data.prompt",
        "nodeId": "devforce-1724931000000",
        "message": "Prompt is required."
      }
    ],
    "requestId": "req_01J6F7A9N8"
  }
}
```

## 3. Required APIs

## 3.1 List available agent templates

```http
GET /api/v1/agents
```

Response:

```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "business-analyst",
        "name": "Business Analyst",
        "description": "Collects signals, requirements, and context.",
        "accent": "#67e8f9",
        "defaultPrompt": "Analyze the business context.",
        "stages": []
      },
      {
        "id": "devforce",
        "name": "DevForce",
        "description": "Executes a multi-step engineering workflow.",
        "accent": "#86efac",
        "defaultPrompt": "Execute the assigned engineering workflow.",
        "stages": [
          { "id": "requirements", "name": "Requirements intake and scope validation", "order": 1 },
          { "id": "design", "name": "Design review and dependency mapping", "order": 2 },
          { "id": "skeleton", "name": "Implementation skeleton prepared", "order": 3 },
          { "id": "implementation", "name": "Code and configuration generation", "order": 4 },
          { "id": "quality", "name": "Quality checks and test execution", "order": 5 },
          { "id": "integration", "name": "Integration validation and patching", "order": 6 },
          { "id": "handoff", "name": "Final handoff and output packaging", "order": 7 }
        ]
      }
    ]
  }
}
```

The frontend can continue using local template data initially. This endpoint becomes required when agent definitions are managed by the backend.

## 3.2 Validate a workflow

```http
POST /api/v1/workflows/validate
```

Request:

```json
{
  "nodes": [
    {
      "id": "business-analyst-1",
      "type": "agentNode",
      "data": {
        "agentType": "business-analyst",
        "label": "Business Analyst",
        "prompt": "Analyze requirements."
      }
    },
    {
      "id": "devforce-1",
      "type": "agentNode",
      "data": {
        "agentType": "devforce",
        "label": "DevForce",
        "prompt": "Implement the approved requirements."
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "business-analyst-1",
      "target": "devforce-1"
    }
  ]
}
```

Valid response:

```json
{
  "success": true,
  "data": {
    "valid": true,
    "issues": [],
    "executionOrder": ["business-analyst-1", "devforce-1"]
  }
}
```

Invalid response:

```json
{
  "success": true,
  "data": {
    "valid": false,
    "issues": [
      {
        "severity": "error",
        "code": "CIRCULAR_DEPENDENCY",
        "message": "Circular connections are not supported.",
        "nodeIds": ["business-analyst-1", "devforce-1"]
      }
    ],
    "executionOrder": []
  }
}
```

Validation rules should include:

- At least one node is required.
- Every node must use a supported agent type.
- Every node must contain a non-empty prompt.
- Edge source and target nodes must exist.
- Duplicate edges should be rejected.
- Self-referencing edges should be rejected.
- Circular dependencies should be rejected.
- Disconnected nodes should produce a warning or error based on product policy.
- Uploaded skill references must belong to the current user or workspace.
- Exactly one Start and one End node are required.
- Start cannot have incoming edges.
- End cannot have outgoing edges.
- Every agent must be reachable from Start and must be able to reach End.
- Only agent nodes appear in `executionOrder`; boundary nodes only mark lifecycle boundaries.

## 3.3 Start a workflow run

```http
POST /api/v1/runs
```

Request:

```json
{
  "clientRunId": "client-run-1724931000000",
  "startNodeId": null,
  "nodes": [
    {
      "id": "business-analyst-1",
      "type": "agentNode",
      "data": {
        "agentType": "business-analyst",
        "label": "Business Analyst",
        "prompt": "Analyze the supplied requirements.",
        "skills": []
      }
    },
    {
      "id": "devforce-1",
      "type": "agentNode",
      "data": {
        "agentType": "devforce",
        "label": "DevForce",
        "prompt": "Implement the approved requirements.",
        "skills": ["skill-file-123"]
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "business-analyst-1",
      "target": "devforce-1"
    }
  ],
  "integrations": ["jira-connection-1", "azure-connection-1"],
  "metadata": {
    "timezone": "Asia/Kolkata",
    "clientVersion": "1.0.0"
  }
}
```

Response: `202 Accepted`

```json
{
  "success": true,
  "data": {
    "runId": "run_01J6F8B5HT",
    "status": "queued",
    "createdAt": "2026-08-29T11:10:00.000Z",
    "executionOrder": ["business-analyst-1", "devforce-1"],
    "eventsUrl": "/api/v1/runs/run_01J6F8B5HT/events",
    "statusUrl": "/api/v1/runs/run_01J6F8B5HT"
  }
}
```

The backend should validate the workflow again before creating the run. Client-side validation is only for user experience and must not be treated as a security boundary.

## 3.4 Get current run state

```http
GET /api/v1/runs/{runId}
```

Response:

```json
{
  "success": true,
  "data": {
    "runId": "run_01J6F8B5HT",
    "status": "running",
    "createdAt": "2026-08-29T11:10:00.000Z",
    "startedAt": "2026-08-29T11:10:01.000Z",
    "completedAt": null,
    "activeNodeId": "devforce-1",
    "nodes": [
      {
        "nodeId": "business-analyst-1",
        "status": "completed",
        "startedAt": "2026-08-29T11:10:01.000Z",
        "completedAt": "2026-08-29T11:10:12.000Z",
        "output": "Requirements analyzed successfully.",
        "error": null
      },
      {
        "nodeId": "devforce-1",
        "status": "running",
        "stageIndex": 3,
        "totalStages": 7,
        "currentStage": "Implementation skeleton prepared",
        "startedAt": "2026-08-29T11:10:12.100Z",
        "completedAt": null,
        "output": null,
        "error": null
      }
    ]
  }
}
```

Use this endpoint when the browser reconnects, the SSE connection is interrupted, or the page is refreshed.

## 3.5 Stop a workflow run

```http
POST /api/v1/runs/{runId}/stop
```

Request:

```json
{
  "reason": "Stopped by user"
}
```

Response: `202 Accepted`

```json
{
  "success": true,
  "data": {
    "runId": "run_01J6F8B5HT",
    "status": "stopping",
    "requestedAt": "2026-08-29T11:11:10.000Z"
  }
}
```

The backend should stop accepting new node work, cancel work where supported, mark unfinished nodes as cancelled, and emit `run.stopped` through SSE.

The endpoint must be idempotent. Calling it for an already stopped or completed run should return the current terminal state rather than an error.

## 3.6 Retry a failed or completed node

```http
POST /api/v1/runs/{runId}/nodes/{nodeId}/retry
```

Request:

```json
{
  "includeDownstream": true,
  "promptOverride": null
}
```

Response: `202 Accepted`

```json
{
  "success": true,
  "data": {
    "runId": "run_01J6F8B5HT",
    "nodeId": "devforce-1",
    "attempt": 2,
    "status": "queued",
    "queuedDownstreamNodeIds": []
  }
}
```

The backend should emit a new `node.queued` event followed by normal execution events. Every event should include the attempt number.

## 3.7 Upload a skill file

```http
POST /api/v1/files
Content-Type: multipart/form-data
```

Form fields:

```text
file: binary file
purpose: agent_skill
nodeId: devforce-1 (optional)
```

Response: `201 Created`

```json
{
  "success": true,
  "data": {
    "fileId": "skill-file-123",
    "name": "engineering-policy.md",
    "mimeType": "text/markdown",
    "size": 18420,
    "status": "ready",
    "createdAt": "2026-08-29T11:08:00.000Z"
  }
}
```

Upload constraints should include:

- Accepted extensions: `.txt`, `.md`, `.pdf`, `.json`, `.yaml`, `.yml`.
- Maximum file size should be explicitly configured, for example 10 MB.
- Verify MIME type and file content; do not trust only the extension.
- Scan uploaded files before making them available to an agent.
- Store an ownership or workspace identifier with every file.

## 3.8 Delete an uploaded file

```http
DELETE /api/v1/files/{fileId}
```

Response:

```json
{
  "success": true,
  "data": {
    "fileId": "skill-file-123",
    "deleted": true
  }
}
```

## 3.9 List available integrations

```http
GET /api/v1/integrations
```

Response:

```json
{
  "success": true,
  "data": {
    "integrations": [
      {
        "id": "jira",
        "name": "Jira",
        "status": "available",
        "authenticationType": "oauth2"
      },
      {
        "id": "azure",
        "name": "Azure DevOps",
        "status": "available",
        "authenticationType": "oauth2"
      }
    ]
  }
}
```

## 3.10 List connected tools

```http
GET /api/v1/connections
```

Response:

```json
{
  "success": true,
  "data": {
    "connections": [
      {
        "id": "jira-connection-1",
        "integrationId": "jira",
        "label": "Jira Production",
        "status": "connected",
        "createdAt": "2026-08-28T10:00:00.000Z"
      }
    ]
  }
}
```

OAuth integrations will also need provider-specific authorization and callback endpoints, such as:

```http
GET /api/v1/integrations/{integrationId}/authorize
GET /api/v1/integrations/{integrationId}/callback
DELETE /api/v1/connections/{connectionId}
```

OAuth tokens must remain on the server and must never be returned to the browser.

## 4. SSE Endpoint

## 4.1 Subscribe to run events

```http
GET /api/v1/runs/{runId}/events
Accept: text/event-stream
```

Required response headers:

```http
Content-Type: text/event-stream
Cache-Control: no-cache, no-transform
Connection: keep-alive
X-Accel-Buffering: no
```

If authentication uses cookies, the browser can open the stream with:

```js
const source = new EventSource(`/api/v1/runs/${runId}/events`, {
  withCredentials: true,
});
```

Do not place long-lived access tokens in the SSE URL. Prefer secure, HTTP-only cookies or create a short-lived, single-run stream ticket.

## 4.2 Common SSE event structure

Every SSE message should contain an event ID, event name, and JSON data:

```text
id: evt_000123
event: node.started
data: {"eventId":"evt_000123","runId":"run_01J6F8B5HT","sequence":123,"timestamp":"2026-08-29T11:10:12.100Z","nodeId":"devforce-1","attempt":1}

```

Common JSON fields:

```json
{
  "eventId": "evt_000123",
  "runId": "run_01J6F8B5HT",
  "sequence": 123,
  "timestamp": "2026-08-29T11:10:12.100Z",
  "nodeId": "devforce-1",
  "attempt": 1
}
```

The `sequence` number must increase within a run. The frontend should ignore events it has already processed.

## 4.3 Required SSE event types

### Connection ready

```text
event: stream.ready
data: {"runId":"run_01J6F8B5HT","status":"queued","lastSequence":0,"timestamp":"2026-08-29T11:10:00.100Z"}

```

### Run queued

```text
event: run.queued
data: {"eventId":"evt_000001","runId":"run_01J6F8B5HT","sequence":1,"status":"queued","timestamp":"2026-08-29T11:10:00.000Z"}

```

### Run started

```text
event: run.started
data: {"eventId":"evt_000002","runId":"run_01J6F8B5HT","sequence":2,"status":"running","executionOrder":["business-analyst-1","devforce-1"],"timestamp":"2026-08-29T11:10:01.000Z"}

```

### Node queued

```text
event: node.queued
data: {"eventId":"evt_000003","runId":"run_01J6F8B5HT","sequence":3,"nodeId":"devforce-1","status":"queued","attempt":1,"timestamp":"2026-08-29T11:10:01.010Z"}

```

### Node started

```text
event: node.started
data: {"eventId":"evt_000010","runId":"run_01J6F8B5HT","sequence":10,"nodeId":"devforce-1","status":"running","attempt":1,"startedAt":"2026-08-29T11:10:12.100Z","timestamp":"2026-08-29T11:10:12.100Z"}

```

### Stage started

```text
event: stage.started
data: {"eventId":"evt_000011","runId":"run_01J6F8B5HT","sequence":11,"nodeId":"devforce-1","stageId":"requirements","stageIndex":1,"totalStages":7,"stageName":"Requirements intake and scope validation","status":"running","attempt":1,"timestamp":"2026-08-29T11:10:12.200Z"}

```

### Stage completed

```text
event: stage.completed
data: {"eventId":"evt_000012","runId":"run_01J6F8B5HT","sequence":12,"nodeId":"devforce-1","stageId":"requirements","stageIndex":1,"totalStages":7,"stageName":"Requirements intake and scope validation","status":"completed","durationMs":4300,"attempt":1,"timestamp":"2026-08-29T11:10:16.500Z"}

```

### Log entry

```text
event: log
data: {"eventId":"evt_000013","runId":"run_01J6F8B5HT","sequence":13,"nodeId":"devforce-1","level":"INFO","message":"Validated 12 requirements.","stageId":"requirements","attempt":1,"timestamp":"2026-08-29T11:10:15.000Z"}

```

Valid log levels:

```text
DEBUG, INFO, WARN, ERROR, EVENT
```

### Node output update

Use this only if the backend streams partial output:

```text
event: node.output.delta
data: {"eventId":"evt_000020","runId":"run_01J6F8B5HT","sequence":20,"nodeId":"devforce-1","delta":"Generated application configuration...","attempt":1,"timestamp":"2026-08-29T11:10:25.000Z"}

```

### Node completed

```text
event: node.completed
data: {"eventId":"evt_000030","runId":"run_01J6F8B5HT","sequence":30,"nodeId":"devforce-1","status":"completed","output":"Implementation validated and prepared for handoff.","durationMs":32000,"attempt":1,"completedAt":"2026-08-29T11:10:44.100Z","timestamp":"2026-08-29T11:10:44.100Z"}

```

### Node failed

```text
event: node.failed
data: {"eventId":"evt_000030","runId":"run_01J6F8B5HT","sequence":30,"nodeId":"devforce-1","status":"failed","attempt":1,"error":{"code":"AGENT_EXECUTION_FAILED","message":"Test execution failed.","retryable":true},"timestamp":"2026-08-29T11:10:44.100Z"}

```

### Run completed

```text
event: run.completed
data: {"eventId":"evt_000040","runId":"run_01J6F8B5HT","sequence":40,"status":"completed","durationMs":45000,"completedAt":"2026-08-29T11:10:46.000Z","timestamp":"2026-08-29T11:10:46.000Z"}

```

### Run failed

```text
event: run.failed
data: {"eventId":"evt_000040","runId":"run_01J6F8B5HT","sequence":40,"status":"failed","error":{"code":"WORKFLOW_EXECUTION_FAILED","message":"DevForce failed after all retry attempts."},"timestamp":"2026-08-29T11:10:46.000Z"}

```

### Run stopped

```text
event: run.stopped
data: {"eventId":"evt_000040","runId":"run_01J6F8B5HT","sequence":40,"status":"stopped","reason":"Stopped by user","timestamp":"2026-08-29T11:10:46.000Z"}

```

### Heartbeat

Send a heartbeat every 15 to 30 seconds so proxies do not close an idle stream:

```text
event: heartbeat
data: {"runId":"run_01J6F8B5HT","timestamp":"2026-08-29T11:10:30.000Z"}

```

Alternatively, send an SSE comment:

```text
: heartbeat

```

## 4.4 Reconnection and missed events

The browser automatically reconnects to an interrupted `EventSource`. It sends the most recently received SSE `id` in the `Last-Event-ID` header.

The backend should:

1. Store run events for at least the lifetime of the run plus a short retention period.
2. Read the `Last-Event-ID` header on reconnect.
3. Replay events after that ID in sequence order.
4. Continue streaming new events after replay completes.
5. Return `404` when the run does not exist.
6. Return `410 Gone` when the event replay window has expired.

If replay is unavailable, the frontend should call `GET /api/v1/runs/{runId}` to obtain the authoritative current state.

## 5. Frontend Execution Flow

Recommended browser flow:

```text
User clicks Start workflow
        |
        v
POST /workflows/validate
        |
        +-- invalid --> show validation issues
        |
        v
POST /runs
        |
        v
Receive runId and eventsUrl
        |
        v
Open EventSource(eventsUrl)
        |
        v
Update nodes, edges, stages, logs and output from SSE
        |
        +-- connection lost --> automatic reconnect
        |                       or GET /runs/{runId}
        |
        +-- user stops --> POST /runs/{runId}/stop
        |
        v
run.completed / run.failed / run.stopped
        |
        v
Close EventSource and unlock canvas editing
```

Suggested event-to-UI mapping:

| SSE event | UI update |
|---|---|
| `run.started` | Set workflow status to Running and lock editing |
| `node.queued` | Set node status to Queued |
| `node.started` | Set node to Running and animate related edge |
| `stage.started` | Update stage accordion active item |
| `stage.completed` | Mark stage complete |
| `log` | Append entry to the selected node's log collection |
| `node.output.delta` | Append partial agent output |
| `node.completed` | Set node to Completed and store final output |
| `node.failed` | Set node and edge to Failed; enable Retry |
| `run.completed` | Mark run complete, close stream and unlock editing |
| `run.failed` | Show workflow failure and unlock appropriate actions |
| `run.stopped` | Reset unfinished nodes and unlock editing |

## 6. HTTP Status Codes

| Status | Meaning |
|---|---|
| `200 OK` | Successful read, validation or idempotent action |
| `201 Created` | File or other resource created |
| `202 Accepted` | Run, retry or stop request accepted asynchronously |
| `400 Bad Request` | Malformed JSON or invalid parameter |
| `401 Unauthorized` | User is not authenticated |
| `403 Forbidden` | User cannot access the requested run, file or connection |
| `404 Not Found` | Resource does not exist |
| `409 Conflict` | Invalid state transition, duplicate run request or active conflict |
| `410 Gone` | SSE replay window has expired |
| `413 Payload Too Large` | Uploaded file is too large |
| `415 Unsupported Media Type` | Unsupported file or request format |
| `422 Unprocessable Content` | Workflow structure failed validation |
| `429 Too Many Requests` | Rate limit or concurrency limit reached |
| `500 Internal Server Error` | Unexpected server failure |
| `503 Service Unavailable` | Agent runtime or required provider is unavailable |

## 7. Idempotency

Starting, stopping and retrying work can be repeated accidentally due to browser retries. Accept an idempotency key on mutation requests:

```http
Idempotency-Key: 1c763ffc-4766-4c02-9577-d65f36f77031
```

The backend should return the original response when the same authenticated user repeats a request with the same key and equivalent payload.

## 8. Authentication and Authorization

Recommended approach for the browser application:

- Authenticate the user with a secure server session.
- Store the session identifier in a `Secure`, `HttpOnly`, `SameSite=Lax` cookie.
- Check ownership or workspace membership for every run, file and integration connection.
- Do not expose provider tokens, API keys or agent-runtime credentials to the client.
- Protect mutation requests against cross-site request forgery when required by the session architecture.
- Restrict SSE streams to users authorized to read the associated run.

For a first local-only prototype, authentication can be omitted, but resource IDs must still be treated as untrusted input.

## 9. Operational Requirements

- Store timestamps in UTC using ISO 8601.
- Generate a request ID for every API response and include it in server logs.
- Limit concurrent runs per user or workspace.
- Limit log message size and total stored events per run.
- Redact secrets from prompts, logs, outputs and errors.
- Make stop operations idempotent.
- Use a durable queue for workflow execution if runs must survive server restarts.
- Persist SSE events or publish them through a replay-capable event store.
- Do not perform long-running agent execution inside the SSE request handler.
- Run execution should continue even when no browser is connected.
- Close the SSE connection after a terminal run event has been delivered.

## 10. Minimum Backend for the Current UI

The smallest useful backend requires only these endpoints:

```text
POST /api/v1/workflows/validate
POST /api/v1/runs
GET  /api/v1/runs/{runId}
GET  /api/v1/runs/{runId}/events
POST /api/v1/runs/{runId}/stop
POST /api/v1/runs/{runId}/nodes/{nodeId}/retry
POST /api/v1/files
DELETE /api/v1/files/{fileId}
```

Integration endpoints are needed when Jira, Azure DevOps or other connected tools perform real operations. The agent-template endpoint is optional while templates remain defined in `lib/workflow-data.js`.

## 11. Suggested Implementation Order

1. Implement workflow validation.
2. Implement run creation with an in-memory execution service.
3. Implement the SSE event stream and heartbeat.
4. Replace the frontend simulation timers with SSE event handlers.
5. Implement stop and retry operations.
6. Implement run-state recovery after stream reconnection.
7. Implement secure skill-file uploads.
8. Add authentication and authorization.
9. Move execution to a durable queue and persist run events.
10. Add real Jira and Azure DevOps integration connections.
