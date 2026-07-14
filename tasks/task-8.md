# Task 8 — Integrate the ready-made call UI

Use the current RealtimeKit React SDK and UI Kit rather than custom WebRTC signaling. The currently documented React package is `@cloudflare/realtimekit-react-ui` and the primary ready-made component is `RtkMeeting`; verify these against current documentation and installed types before implementation.

## Acceptance criteria

- The UI displays a responsive participant grid, names, camera-off placeholders, muted status where supported, and connection state.
- Callers can mute/unmute, enable/disable video, and leave individually.
- One caller leaving does not end the meeting for everyone.
- Chat, recording, transcription, screen sharing, and other excluded controls are hidden.
- Loading, connected, reconnecting, unable-to-join, and call-left states are understandable.
- Network disconnection and reconnection are handled.
- Participant tokens never appear in URLs or persistent browser storage.
- The token is removed from React state and memory after leaving where practical.

## Dependencies

Tasks 5 and 7.
