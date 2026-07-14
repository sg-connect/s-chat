# Task 2 — Build API and security foundations

**Status: Complete**

Create shared validation schemas, safe JSON parsing, request-body size limits, browser-safe errors, same-origin enforcement, CSRF protection, production security headers, and development-only safe logging.

Investigate the domains required by the current RealtimeKit SDK before defining the Content Security Policy.

## Acceptance criteria

- API mutations accept only the expected JSON content type.
- Request bodies are size-limited and strictly validated.
- Display names are trimmed and contain 1–40 visible characters.
- User-controlled content is never rendered as HTML.
- Responses never expose stack traces, secrets, meeting IDs, Durable Object IDs, or administrative errors.
- CSP, Permissions Policy, `X-Content-Type-Options`, and Referrer Policy are configured correctly.
- No wildcard CORS is used.

## Dependencies

Task 1.
