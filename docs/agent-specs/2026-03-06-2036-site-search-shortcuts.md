# Spec: Site Search Keyboard Shortcuts

- Date: 2026-03-06 20:36 (Asia/Shanghai)
- Feature slug: site-search-shortcuts

## Goal / User value

Allow readers to open the site search quickly via common keyboard shortcuts:

- Press `/` to open search (when not typing in an input)
- Press `Ctrl+K` (Windows/Linux) or `Cmd+K` (macOS) to open search

This makes search discoverable and faster than hunting for the “搜索” button.

## Requirements

1. When the user presses `/`:
   - If focus is **not** in an editable element (input/textarea/select/contenteditable), open the site search dialog.
   - Prevent the default browser behavior for `/` only when we open the dialog.
2. When the user presses `Ctrl+K` or `Cmd+K`:
   - Open the site search dialog (same conditions as above).
   - Prevent default behavior only when we open the dialog.
3. When the dialog opens via shortcut:
   - Dialog becomes visible (`aria-hidden="false"` and `.is-open` applied)
   - Search input receives focus
4. Do not break existing behavior:
   - Existing click triggers still work
   - Esc still closes

## Acceptance criteria

- On any page with the site search script loaded, pressing `/` opens search (unless typing in an editable field).
- Pressing `Cmd+K` / `Ctrl+K` opens search (unless typing in an editable field).
- Unit test coverage exists for:
  - `/` opens dialog
  - `/` does not open dialog when focus is inside an input

## Non-goals / Boundaries

- No UI redesign of the search modal.
- No new search ranking logic.
- No analytics/tracking.
