# Spec: Code block copy button + success toast

- Date: 2026-03-06 17:33 (Asia/Shanghai)
- Slug: copy-code-button

## Background / Problem
Reading technical posts on the blog often involves copying code snippets. Currently the theme `evan` renders code blocks but provides no one-click copy affordance, forcing manual selection.

## Goal
Add a visible “Copy” button to each code block on the site. Clicking copies the code to clipboard and gives immediate feedback (success/failure) without navigating away.

## User-visible behavior
- On any page, every code block gets a small copy button at the top-right.
- When user clicks:
  - Copy the *plain text* of the code block (no line numbers, no prompts).
  - Show a short inline toast on the button:
    - success: `已复制`
    - failure: `复制失败`
  - Toast auto-resets back to `复制` after ~1.2s.

## Supported code block shapes
- Standard Markdown renderer: `<pre><code>...</code></pre>`
- Hexo highlight renderer: `<figure class="highlight ..."> ... .line ... </figure>`

## Accessibility
- Button must be keyboard focusable.
- Button must have `aria-label="复制代码"`.
- Result text update should not cause layout shift.

## Non-goals / Boundaries
- No dependency on external CDN libraries.
- No per-language features (e.g., copy with formatting).
- No changes to Hexo renderer pipeline.

## Acceptance criteria
1. A copy button is rendered for each supported code block shape.
2. Clicking the button copies the expected plain text.
3. Success/failure feedback appears and auto-resets.
4. Automated tests cover:
   - text extraction for both code block shapes
   - button injection logic (dedupe)
   - click handler calls clipboard API (mocked)

