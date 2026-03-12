# Spec: Theme Toggle Keyboard Shortcut (D)

Date: 2026-03-12 16:52 (Asia/Shanghai)
Slug: theme-toggle-shortcut

## User Story
As a reader, I want to quickly switch theme mode (System/Light/Dark) via a keyboard shortcut, so I can adjust the page appearance without moving my hands to the mouse.

## Scope
Add a global keyboard shortcut:
- Pressing **`d`** cycles theme mode in the same order as the existing button: **system → light → dark → system**.
- Behavior should be equivalent to clicking the existing `[data-theme-toggle]` button (updates DOM dataset + persists to localStorage).

## Acceptance Criteria
1. When the page is not focused in an input field, pressing `d` triggers exactly one theme-mode change and persists it to `localStorage` (`xdlkc:theme`).
2. Shortcut does **not** trigger while the user is typing in:
   - `input`, `textarea`, `select`
   - any element with `isContentEditable=true`
3. Works even if the theme toggle button exists but is offscreen.
4. Idempotent: calling `initThemeToggle()` multiple times must not bind duplicate key listeners (one key press causes one toggle).

## Out of Scope / Non-Goals
- No new UI elements.
- No new URL params.
- No remapping of existing shortcuts.
- No mobile-specific changes.

## Edge Cases
- If `[data-theme-toggle]` button is missing, shortcut does nothing (safe no-op).
- When `?theme=...` URL override is present, shortcut still toggles and persists (URL override affects initial state only).
