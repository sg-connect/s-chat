# Task 7 — Build privacy-first device setup

**Status: Complete — RealtimeKit's setup screen provides preview, permissions, retry, and device selection.**

Create the camera and microphone setup screen. Do not request device access before the participant intentionally reaches setup and interacts with it. Start microphone and camera disabled.

## Acceptance criteria

- The screen contains a display-name field, local preview, microphone toggle, camera toggle, permission guidance, retry action, and join button.
- Microphone and camera default to off.
- Joining works with both devices enabled, muted, camera disabled, or audio-only.
- A missing or denied camera does not prevent audio-only joining.
- A missing or denied microphone displays helpful guidance.
- Available device selection is offered where supported by the SDK and browser.
- Permission changes while the page is open are handled.
- Mobile safe areas and current supported browsers are considered.

## Dependencies

Tasks 5 and 6.
