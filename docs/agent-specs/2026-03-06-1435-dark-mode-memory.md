# Spec: Dark mode toggle with memory (localStorage)

- Date: 2026-03-06 14:35 (Asia/Shanghai)
- Feature slug: dark-mode-memory

## Goal / User value
Visitors can switch between light/dark themes and the site remembers the preference across pages and visits.

## Requirements
1. A theme toggle control is visible in the top navigation on:
   - Home page
   - Post page
   - Archive page
   - Standalone page (e.g. About)
2. Clicking the toggle switches between `light` and `dark`.
3. Selected theme is persisted in `localStorage` under a stable key.
4. On page load, theme is applied as early as possible to minimize flash.
5. Accessibility:
   - Toggle is a `<button>`
   - Has an `aria-label`
   - Maintains `aria-pressed` reflecting current theme.

## Acceptance criteria
- When user selects dark mode and refreshes, the page loads in dark mode.
- When user selects light mode and refreshes, the page loads in light mode.
- If there is no saved preference, default is based on `prefers-color-scheme: dark` (dark) otherwise light.
- CSS variables update so text/background have sufficient contrast in dark mode.

## Non-goals / boundaries
- No system-wide theme sync beyond `prefers-color-scheme`.
- No per-section theming; only site-wide.
- No changes to content generation pipeline.

## Implementation sketch
- Add `themes/evan/source/js/theme-toggle.js` exporting pure helpers (for tests) + browser init.
- Add an inline head script in `layout.ejs` to set `document.documentElement.dataset.theme` early from localStorage.
- Add a deferred script include for `/js/theme-toggle.js` to wire up the button.
- Add dark theme CSS via `html[data-theme="dark"] { ... }` and `html[data-theme="dark"] body { ... }`.
