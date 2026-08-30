# Backend Architecture in Next.js

This project keeps the backend inside the Next.js app using App Router route handlers, so the API is separate from the UI structure without needing a second runtime like Express.

## Folder layout

```text
app/
  api/
    health/route.js
    workflows/route.js
    workflows/[id]/route.js
    runs/route.js
    runs/[id]/route.js

lib/
  server/
    mock-db.js
```

## Why this is scalable

- API routes are isolated under `app/api`
- Business logic is separated into `lib/server`
- Frontend UI stays in `app` and `components`
- Route handlers can later be replaced with real database calls without changing the route structure
- This pattern works well for mock/testing APIs before connecting a real backend

## Example use

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/workflows
curl -X POST http://localhost:3000/api/workflows \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo workflow"}'
```

## Later migration path

When you are ready for a real backend, you can keep the same route contract and swap `mock-db.js` with a DB layer or an API client layer without changing the UI code.
