# Family Call task plan

Target URL: `https://s-chat.<your-workers-subdomain>.workers.dev/family`

Only the owner needs a Cloudflare account. Family members open the link, enter the six-digit PIN and their display name, and join through a supported browser.

## Feasibility and cost

- A free `workers.dev` URL means no custom domain is required.
- Workers Free currently includes limited Worker and SQLite Durable Object usage suitable for a small family application.
- RealtimeKit is currently free during beta, but Cloudflare has announced usage-based pricing after general availability. A permanently free video service therefore cannot be guaranteed.
- Check the current [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) and [RealtimeKit pricing](https://developers.cloudflare.com/realtime/realtimekit/pricing/) before deployment.

## Simplicity decision

The first version should favor the smallest maintainable implementation:

- Use plain React components and ordinary CSS.
- Use no state-management library, CSS framework, component framework, or frontend router unless a real need appears.
- Handle the small `/family` flow with local React state.
- Use RealtimeKit's ready-made meeting component for video, audio, participant layout, and call controls.
- Do not build custom WebRTC signaling or a custom video interface.
- Optimize for a reliable family call rather than visual complexity.

## Execution order

1. [Task 1 — Project scaffold](task-1.md)
2. [Task 2 — API and security foundations](task-2.md)
3. [Task 3 — PIN authentication](task-3.md)
4. [Task 4 — Permanent-room Durable Object](task-4.md)
5. [Task 5 — RealtimeKit server integration](task-5.md)
6. [Task 6 — PIN and entry screens](task-6.md)
7. [Task 7 — Device setup](task-7.md)
8. [Task 8 — In-call UI](task-8.md)
9. [Task 9 — Automated tests](task-9.md)
10. [Task 10 — Documentation and deployment](task-10.md)

## Configuration ownership

Normal server-side configuration:

- `REALTIMEKIT_PRESET_NAME`

Secrets or sensitive server-side deployment input:

- `FAMILY_PIN`
- `SESSION_SECRET`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `REALTIMEKIT_APP_ID`

None of these values belong in Vite `VITE_*` variables.

## Owner-only setup

The owner must create the Cloudflare account, enable RealtimeKit, create an application and participant preset, create a restricted API token, choose the family PIN, generate the session secret, authorize Wrangler, and deploy. Brothers need no account, installation, email, or technical configuration.
