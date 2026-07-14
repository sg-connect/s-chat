# Task 3 — Implement PIN authentication and sessions

Implement `POST /api/auth/pin`, `GET /api/auth/session`, and `POST /api/auth/logout`. Use Web Crypto HMAC-signed cookies and store failed-attempt state in the permanent-room Durable Object. Identify clients using trusted Cloudflare request information only.

## Acceptance criteria

- Only a six-digit numerical PIN is accepted and it is checked only inside the Worker.
- PIN comparison is timing-resistant where practical.
- Five failures within 15 minutes cause a temporary, generic HTTP 429 response.
- Successful authentication resets or reduces the failure record.
- The session cookie is `HttpOnly`, `SameSite=Lax` or stricter, expires in approximately 30 days, and is `Secure` in production.
- Tampered and expired cookies are rejected.
- Logout removes the session cookie.
- The PIN is never logged, returned, or stored in browser storage.

## Dependencies

Tasks 1 and 2.
