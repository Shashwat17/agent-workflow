# Production Architecture

## Dependency flow

```text
UI components
  -> feature hooks
    -> RTK Query domain endpoints
      -> Axios base query
        -> shared Axios client
          -> mock adapter or backend

Backend SSE
  -> validated event-stream client
    -> execution hook
      -> execution Redux slice + React Flow projection
```

Dependencies should point inward through these boundaries. Components must not import Axios, backend URLs, the mock store, or individual transport details.

## Directory responsibilities

```text
app/
  providers.jsx                 Redux provider boundary

lib/api/
  client.js                     Axios instance, request IDs, idempotency and errors
  config.js                     Environment-based API configuration
  schemas.js                    Runtime API and SSE contracts
  run-events.js                 SSE lifecycle, validation and reconnection
  mock-adapter.js               Development REST responses
  mock-store.js                 Development-only in-memory backend state

lib/store/
  store.js                      Redux store and middleware
  axios-base-query.js           RTK Query transport adapter
  api/base-api.js               Shared RTK Query cache configuration
  api/*-endpoints.js            Domain-specific endpoint injection
  slices/execution-slice.js     Authoritative run and stream metadata

hooks/
  useWorkflowExecution.js       Projects backend events onto React Flow nodes
  useToolIntegration.js         Integration-domain UI adapter
```

## State ownership

| State | Owner |
|---|---|
| API loading, errors and cached server responses | RTK Query |
| Active run, stream status, active node and event sequence | Execution slice |
| Canvas positions, prompts and edges | React Flow state |
| Drawer selection and temporary uploaded-file display | Page UI state |
| Mock runs, files and connections | Mock adapter only |

React Flow nodes currently receive a projection of execution state so existing UI behavior remains unchanged. Future canvas components should read execution metadata through selectors rather than expanding `node.data` further.

## Workflow graph contract

- Every workflow contains exactly one Start boundary and one End boundary.
- Boundary nodes are draggable canvas elements but never execute agent logic.
- All agents must exist on a directed path from Start to End.
- Execution order is calculated with a topological sort of the edge graph, not array or drop order.
- Cycles, isolated agents, duplicate edges and invalid boundary directions are rejected before execution.

## Backend switching

Mock mode and live mode use the same RTK Query hooks and runtime schemas. Only environment configuration changes:

```env
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=https://backend.company.com/api/v1
```

## Reliability controls

- Every mutation receives an idempotency key.
- Every REST request receives a request ID.
- API failures are normalized into `ApiError` values.
- REST and SSE payloads are checked at runtime with Zod.
- SSE events are deduplicated by event ID and sequence.
- Event ID memory is bounded.
- Live SSE reconnects with exponential backoff.
- Heartbeat timeouts detect stale streams.
- Terminal events close the stream and unlock the UI.
- Mock responses follow the same contracts as the live backend.

## Scaling endpoint domains

Add a new backend domain by injecting endpoints into `baseApi`:

```text
lib/store/api/<domain>-endpoints.js
```

Do not grow the compatibility barrel with endpoint implementation logic. It exists only to avoid breaking current imports.

## Recommended backend requirements

- Support idempotency keys for mutations.
- Echo or log `X-Request-ID`.
- Use secure HTTP-only session cookies.
- Support SSE event replay from `Last-Event-ID` or the documented `lastEventId` reconnect parameter.
- Keep run execution independent from browser connections.
- Emit heartbeat events at least every 30 seconds.
- Preserve monotonically increasing event sequence numbers per run.
