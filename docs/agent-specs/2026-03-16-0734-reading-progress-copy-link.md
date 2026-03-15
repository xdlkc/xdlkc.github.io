# Spec: Reading progress bar — copy current reading link (with active heading)

Date: 2026-03-16 07:34 (Asia/Shanghai)
Slug: reading-progress-copy-link

## Problem / Motivation
The reading progress bar is always visible and already supports seeking + showing active heading text. When users want to share where they are in a long article, they still need to scroll to a heading or manually copy a `#hash` link.

## User Story
As a reader, I can copy a shareable link for my current reading position directly from the reading progress bar, so I can share the exact section I’m reading.

## Requirements
1. The reading progress bar provides a small, visible “copy link” control.
2. Clicking it copies the current page URL.
3. If there is an active heading (h2/h3 in `.article-content`) with an `id`, the copied URL **includes** that `#id`.
4. If no active heading id is available, copy the URL **without** a hash.
5. Show a short toast confirming the copy action (localized based on `html[data-lang-mode]` / `documentElement.dataset.langMode`):
   - zh: `已复制链接`
   - en: `Link copied`

## Acceptance Criteria
- On a page with headings, after scrolling into a section, clicking the copy button copies `https://…/post/#<activeHeadingId>`.
- On a page with no headings (or no active heading id), clicking the copy button copies `https://…/post/` (no hash).
- The feature does not break existing reading-progress behavior (drag seek, collapse toggle, keyboard seek).

## Non-goals / Boundaries
- No permalink canonicalization work (keep simple: use `window.location.href` as base).
- Do not add new dependencies.
- Do not change TOC behavior.

## Test Plan (TDD)
- Unit/integration test with JSDOM:
  - Mock `navigator.clipboard.writeText`.
  - Initialize reading-progress.
  - Simulate scroll + click copy button.
  - Assert copied text equals expected URL (with/without hash).
  - Assert toast element is created and becomes visible.
