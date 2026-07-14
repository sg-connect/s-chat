# Task 1 — Scaffold the full-stack project

Create the TypeScript, React, Vite, Cloudflare Worker, Vitest, and ESLint project structure. Add `wrangler.jsonc`, static asset serving, the SQLite Durable Object binding and migration, `.gitignore`, `.dev.vars.example`, and npm scripts.

Keep the frontend minimal: plain React and CSS, local component state, and no router, state-management library, CSS framework, or component framework.

## Acceptance criteria

- The Worker and React frontend build as one deployment.
- `/` redirects to `/family`.
- Unknown frontend routes display a friendly not-found page.
- Scripts exist for `dev`, `build`, `deploy`, `typecheck`, `lint`, and `test`.
- No real PINs or credentials are committed.

## Dependencies

None.
