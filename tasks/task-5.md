# Task 5 — Implement the RealtimeKit server integration

**Status: Complete**

Verify the current official RealtimeKit packages, API paths, response formats, preset configuration, and SDK initialization. Then create a typed, timeout-protected Worker client and implement `POST /api/call/join`.

Current official integration shape to verify before coding:

1. Create a meeting through the account and RealtimeKit application Meetings API.
2. Add each caller separately through the meeting Participants API.
3. Return that caller's unique participant token to the browser.
4. Initialize the RealtimeKit client using the participant token.

## Acceptance criteria

- Join requires a valid signed PIN session.
- The Durable Object supplies or creates the permanent meeting.
- Each join uses a cryptographically random participant ID and validated display name.
- The configured preset permits publishing and receiving audio and video.
- Every caller receives a separate participant token.
- Only minimum browser-safe participant information is returned.
- Administrative credentials never enter browser code or API responses.
- Safe meeting operations use appropriate retry behavior.
- Participant creation is not blindly retried.
- External calls are mocked in tests and never create paid resources.

## Dependencies

Tasks 2, 3, and 4.
