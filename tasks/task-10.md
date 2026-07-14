# Task 10 — Verify, document, and deploy

Write a README for a nonexpert owner, run all quality checks, inspect the production output for leaked secrets, and deploy to the owner's free `workers.dev` subdomain.

## Acceptance criteria

- Type checking, linting, tests, and the production build all pass for real.
- The README covers Node.js, Cloudflare account setup, RealtimeKit application and preset creation, restricted API tokens, account/application IDs, local variables, local HTTPS testing, production secrets, deployment, rotation, troubleshooting, safe logs, and deletion.
- Production secrets are configured with `wrangler secret put` and are not plain Wrangler variables.
- `/api/health` and `/family` work over production HTTPS.
- A second phone can open the permanent link and join the same call using only a PIN and display name.
- The README links to current Workers and RealtimeKit pricing instead of promising permanently free service.

## Owner-only dashboard work

- Enable RealtimeKit and create its application.
- Select or create a preset that permits publishing and receiving audio/video.
- Create a restricted RealtimeKit API token.
- Supply the account ID, application ID, PIN, and session secret.
- Authorize the final deployment.

## Dependencies

Tasks 1 through 9 and owner-supplied Cloudflare configuration.
