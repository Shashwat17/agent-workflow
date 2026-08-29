# Backend Integration Handoff

The application uses Redux Toolkit Query for REST API state and calls. RTK Query uses one shared Axios client underneath, and SSE uses one shared event-stream client.

## Current mock configuration

Create `.env.local` from `.env.example`:

```env
NEXT_PUBLIC_USE_MOCK_API=true
NEXT_PUBLIC_API_BASE_URL=https://api.example.test/api/v1
```

Mock mode uses the documented request and response shapes without making network requests. It also emits dummy SSE events that drive the real workflow UI.

## Switch to the backend

When the backend team provides its URL, update `.env.local`:

```env
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_BASE_URL=https://backend.company.com/api/v1
```

Restart the Next.js development server after changing environment variables.

No component URL replacements should be necessary. Endpoint implementations are split by domain under `lib/store/api/`; `lib/store/api-slice.js` is a compatibility export. SSE connection behavior is centralized in `lib/api/run-events.js`.

## Shared files

| File | Responsibility |
|---|---|
| `lib/api/config.js` | Base URL, timeout and mock-mode configuration |
| `lib/api/client.js` | Shared Axios instance and error normalization |
| `lib/store/api/base-api.js` | Shared RTK Query cache and tag configuration |
| `lib/store/api/*-endpoints.js` | Domain endpoint definitions and generated hooks |
| `lib/store/api-slice.js` | Compatibility exports for existing imports |
| `lib/store/axios-base-query.js` | Axios transport adapter for RTK Query |
| `lib/store/store.js` | Redux store and RTK Query middleware |
| `app/providers.jsx` | React Redux provider |
| `lib/store/slices/execution-slice.js` | Run, stream and event-sequence state |
| `lib/api/schemas.js` | Runtime validation for REST and SSE contracts |
| `lib/api/run-events.js` | Native EventSource connection and mock SSE stream |
| `lib/api/mock-adapter.js` | Dummy Axios responses |
| `lib/api/mock-store.js` | In-memory mock runs, files and connections |

RTK Query manages normal HTTP APIs and uses Axios through a custom base query. Native `EventSource` is used for SSE because request/response caches are not the correct abstraction for a persistent browser event stream.

## Integrated operations

- Workflow validation
- Start workflow run
- Get run state service
- Stop workflow run
- Retry node
- Upload and delete skill file services
- List agent templates service
- List integrations
- Load tool connections
- Save tool connection
- Delete tool connection service
- Subscribe to workflow SSE events

The complete backend payload contract remains in `API-SSE-SPEC.md`.
