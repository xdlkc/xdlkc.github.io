# Spec: Enhance TOC scrollspy to support BOTH mobile + desktop TOCs

- Date: 2026-03-12 10:09 (Asia/Shanghai)
- Slug: toc-dual-enhance

## Background / Problem
Post pages render **two** TOC containers:
- Mobile: `<details class="toc-mobile"> ... <nav class="toc-nav"> ...` (drawer)
- Desktop: `<aside class="toc-card"> ... <nav class="toc-nav"> ...` (sidebar)

Current `toc-scrollspy.js` only runs `document.querySelector('.toc-nav')`, so it enhances **only the first TOC** in DOM order (typically the mobile one). This causes desktop-only features to not work reliably:
- Desktop “Hide/Show TOC” button may not bind
- Desktop TOC may miss scrollspy active highlighting, collapsible sections, link copy buttons, etc.

## Goals (user-visible)
1) On post pages with both mobile+desktop TOCs, both TOCs get the same enhancements:
   - heading id sync / auto-id
   - auto-generated TOC when empty
   - scrollspy active state
   - smooth scroll with header offset
   - link-copy buttons
   - collapsible nested sections
2) Desktop TOC visibility toggle button (`[data-toc-visibility-toggle]`) works even when the mobile TOC appears earlier in the DOM.
3) Behavior remains idempotent: calling `initTocScrollSpy()` multiple times must not double-bind global handlers.

## Non-goals / Boundaries
- Do not change TOC HTML templates in this iteration.
- Do not change CSS styling.
- Do not implement new TOC UI features beyond enabling parity between the two existing TOCs.

## Acceptance Criteria
- With both TOCs present, clicking the desktop toggle button hides/unhides **desktop** `.toc-card .toc-nav` and updates `aria-hidden/hidden`.
- Mobile TOC remains functional and unaffected by desktop toggle.
- All tests pass: `npm test`.

## Edge cases
- Pages with only one TOC container should keep working.
- Short articles (heading count < 2) should still hide desktop TOC (existing rule), but not forcibly hide the mobile details drawer.
