# Task 9 — Complete automated tests

**Status: Complete for the initial production release (11 Worker/runtime tests).**

Add Worker integration tests, Durable Object tests, and focused React tests for the critical family-call journey. Mock every RealtimeKit administrative request.

## Acceptance criteria

- Tests cover correct and incorrect PINs, rate limiting, signed-cookie creation, tampering, expiration, and logout.
- Tests cover unauthenticated joins and invalid display names.
- Tests cover successful participant creation and RealtimeKit failures.
- Tests cover meeting reuse and simultaneous creation protection.
- Tests verify safe errors and that secret values never appear in responses.
- Frontend tests cover access checking, setup, joining, and failure states.
- Tests make no real RealtimeKit API requests.

## Dependencies

Tasks 3 through 8.
