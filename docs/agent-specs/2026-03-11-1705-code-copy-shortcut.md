# Spec: Code block keyboard shortcut copy (Ctrl/Cmd+Shift+C)

Date: 2026-03-11 17:05 (Asia/Shanghai)
Slug: code-copy-shortcut

## User story
As a reader, when I’m viewing a code block, I want a keyboard shortcut to copy the entire code block, so I can copy quickly without moving the mouse.

## Scope / Feature
Add a keyboard shortcut for code blocks:
- When a code block container is focused (or the key event originates inside it), pressing **Ctrl/Cmd + Shift + C** copies the whole block.
- Show the same success/failure toast feedback as the copy button.

## Acceptance criteria
1) For both supported block types:
   - `<pre><code>...</code></pre>`
   - `figure.highlight ...` (Hexo highlight)

   pressing Ctrl/Cmd+Shift+C while focus is on the container triggers a copy of the extracted code text.

2) On success:
   - Uses the existing toast system.
   - Message includes copied line count (same format as button click).
   - The block gets the visual flash (`is-copied`) consistent with other copy interactions.

3) On failure (clipboard denied/unsupported):
   - Selects the code content (existing fallback behavior).
   - Shows the existing failure toast.

4) Accessibility:
   - Code block containers become keyboard-focusable (tabbable) without breaking existing layout.

## Non-goals / Boundaries
- No global shortcut (should not trigger when focus is outside code blocks).
- Do not change the existing click / double-click / long-press behaviors.
- Do not add new dependencies.

## Notes
- Shortcut choice avoids clobbering default Ctrl/Cmd+C (copy selection).
- Shortcut should work on macOS (metaKey) and Windows/Linux (ctrlKey).
