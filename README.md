# Agent Workflow

A Next.js-based workflow orchestration dashboard for designing, validating, and running agent-driven processes. The app lets users build workflows visually, connect external integrations, upload skill files, validate graph structure, and track execution through real-time event streams.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- @xyflow/react for workflow canvas and node/edge interactions
- Redux Toolkit + RTK Query for state and API access
- Zod for request/response validation
- Tailwind CSS + shadcn-inspired UI primitives
- Mock API layer for local development and backend contract validation

## Product Highlights

- Drag-and-drop workflow canvas
- Agent library and stage-based workflow composition
- Workflow validation before execution
- Tool/connector integration modal
- Save and test connection flows for Jira / Azure / MCP
- File upload for skill artifacts
- Workflow execution with event streaming
- Error and success notifications via centralized toast system

## Project Structure

```text
app/
  api/
    health/
    runs/
    workflows/
  globals.css
  layout.js
  page.js
  providers.jsx

components/
  ui/
  workflow/

hooks/
  index.js
  useKeyboardShortcuts.js
  useToolIntegration.js
  useWorkflowExecution.js
  useWorkflowHistory.js
  useWorkflowLogs.js
  useWorkflowNodes.js

lib/
  api/
  store/
  workflow-data.js
  workflow-validation.js
  validation-schemas.js
  toast.js

BACKEND-API-CONTRACT.txt
```

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

The app supports a mock backend by default. To switch to a real backend, define:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com/api/v1
NEXT_PUBLIC_USE_MOCK_API=false
```

The default config in the app is:

```js
NEXT_PUBLIC_API_BASE_URL = "https://api.example.test/api/v1";
NEXT_PUBLIC_USE_MOCK_API = true;
```

## Backend Architecture Approach

This app uses the Next.js App Router as the backend boundary, without introducing Express.

Recommended backend structure:

```text
app/api/
  workflows/
  runs/
  files/
  integrations/
  connections/
```

This keeps the project monolithic but scalable for future backend responsibilities while preserving a single Next.js deployment model.

## API Contract

The frontend expects a structured contract for JSON APIs and SSE event streams.

Important endpoints include:

- `GET /api/v1/agents`
- `POST /api/v1/workflows/validate`
- `POST /api/v1/runs`
- `GET /api/v1/runs/:runId`
- `POST /api/v1/runs/:runId/stop`
- `POST /api/v1/runs/:runId/nodes/:nodeId/retry`
- `POST /api/v1/files`
- `DELETE /api/v1/files/:fileId`
- `GET /api/v1/integrations`
- `GET /api/v1/connections`
- `POST /api/v1/connections/test`
- `POST /api/v1/connections`
- `DELETE /api/v1/connections/:connectionId`

For the full request/response and SSE specification, see:

- [BACKEND-API-CONTRACT.txt](BACKEND-API-CONTRACT.txt)

## SSE Event Stream

Workflow execution events are consumed through an SSE stream. The frontend listens for events such as:

- `stream.ready`
- `run.started`
- `node.started`
- `stage.started`
- `log`
- `node.completed`
- `run.completed`
- `run.failed`
- `run.stopped`

The app expects the following pattern:

```text
GET /runs/:runId/events
Content-Type: text/event-stream
```

## Workflow Validation Rules

The app validates workflow execution before start. Validation covers:

- node existence and structure
- supported agent types
- prompt completeness
- edge integrity
- no circular dependency
- start/end boundary rules
- reachability from start to end

## Mock API

The app includes a mock adapter that allows the UI to behave like a real backend during development. This helps validate the frontend contract and test flows before connecting the production backend.

## Notes

- Tokens are not exposed in mock responses for connection test/save calls.
- The project is intentionally set up to be backend-ready without forcing Express into the stack.
- App Router route handlers are the recommended place for real backend endpoints when the application is ready to scale.

## Scripts

```bash
npm run dev     # start development server
npm run build   # production build
npm run start   # start production server
npm run lint    # lint project
```

## Future Scalability

This project is structured to support:

- backend route handlers under `app/api`
- real workflow orchestration services
- external integrations with Jira, Azure DevOps, MCP, and other tools
- file storage and agent skill management
- real-time event processing for long-running tasks

## License

This project is for internal workflow orchestration and experimentation. Update the license section according to your team or organization policy before production use.
