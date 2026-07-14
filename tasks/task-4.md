# Task 4 — Implement the permanent-room Durable Object

Create the SQLite-backed `FamilyRoom` Durable Object. It stores the current RealtimeKit meeting ID and coordinates meeting creation for the permanent family room.

## Acceptance criteria

- An existing usable meeting is reused for future callers.
- Concurrent first joins result in only one meeting creation.
- An invalid or unusable remote meeting is replaced atomically.
- Failed PIN attempts and lockout expiration are tracked safely.
- No audio, video, or participant authentication token is stored.
- Tests cover meeting reuse, invalid meeting replacement, and simultaneous creation.

## Dependencies

Tasks 1 and 2.
