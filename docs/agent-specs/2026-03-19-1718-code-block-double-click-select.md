# Spec: Code Block Double-Click to Select

**Date:** 2026-03-19
**Feature ID:** code-block-double-click-select
**Priority:** P0 (User Experience)
**Type:** Feature Enhancement

## Overview

Enable users to quickly select all code in a code block by double-clicking anywhere on the code block. This improves the user experience when copying code manually or using the copy button.

## Requirements

### User Interface
- When user double-clicks on any code block (`.article-content figure.highlight` or `.article-content pre > code`):
  - The entire code content within that block should be selected
  - Selection should include the actual code text, not line numbers or gutter elements
  - No visual indicator needed (browser's selection highlighting is sufficient)

### Behavior
- Selection works on both:
  - Hexo-rendered code blocks (`figure.highlight`)
  - Direct `<pre><code>` blocks
- Double-click selects ONLY the code content, excluding:
  - Line numbers (`.gutter`)
  - Copy buttons (`.code-copy-button`)
  - Collapse buttons (`.code-collapse-button`)
- Selection is transient (user can deselect by clicking elsewhere)
- Works in both light and dark themes

### Accessibility
- Feature enhances accessibility by making code selection easier for keyboard/mouse users
- No new ARIA labels needed (native browser selection)

### Edge Cases
- If code block has no content (empty), double-click should do nothing gracefully
- If code block contains only whitespace, selection should still work
- Multiple code blocks on page should be independent
- Nested code blocks (if any) - select only the clicked block's content

## Acceptance Criteria

1. Double-clicking a code block selects all code text (excluding line numbers and buttons)
2. Double-clicking the gutter/line numbers does NOT trigger selection
3. Selection works for both Hexo-rendered and direct code blocks
4. Multiple double-clicks toggle selection (no duplicate selections)
5. Works on all code blocks on the page independently
6. No console errors on empty or whitespace-only code blocks

## Technical Implementation

### DOM Structure

```html
<!-- Hexo-rendered block -->
<figure class="highlight language-javascript">
  <div class="gutter">...</div>  <!-- Exclude from selection -->
  <pre>
    <code class="hljs">const x = 1;</code>  <!-- Select this -->
  </pre>
  <button class="code-copy-button"></button>  <!-- Exclude from selection -->
</figure>

<!-- Direct code block -->
<pre><code class="language-javascript">const x = 1;</code></pre>  <!-- Select this -->
```

### JavaScript Module

File: `themes/evan/source/js/code-block-double-click-select.js`

```javascript
// Exported functions:
// - initCodeBlockDoubleClickSelect({ document, window })
// - selectCodeContent(codeElement) - helper for tests
```

### Integration

Add script to post.ejs:
```html
<script src="<%- url_for('/js/code-block-double-click-select.js') %>" defer></script>
<script>
  window.CodeBlockDoubleClickSelect?.initCodeBlockDoubleClickSelect?.();
</script>
```

## Testing Strategy

### Unit Tests (tests/code-block-double-click-select.test.js)

1. `selectCodeContent` selects all text within code element
2. `selectCodeContent` ignores gutter elements
3. `initCodeBlockDoubleClickSelect` adds dblclick listeners to all code blocks
4. Double-clicking Hexo code block selects content
5. Double-clicking direct code block selects content
6. Double-clicking gutter does not select content
7. Multiple code blocks work independently
8. Empty code blocks handle gracefully

## Files to Modify

- `themes/evan/source/js/code-block-double-click-select.js` (new)
- `tests/code-block-double-click-select.test.js` (new)
- `themes/evan/layout/post.ejs` (add script reference)

## Success Metrics

- User can quickly select all code with double-click
- No selection of line numbers or buttons
- Works across all code block types
- No performance impact on page load
