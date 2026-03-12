# Spec: Code copy button shows keyboard shortcut tooltip

## Background / Motivation
The blog already provides a “复制代码 / Copy code” button on code blocks. Power users may miss the existing keyboard shortcut (Shift + Ctrl/Cmd + C) because it’s currently hidden. Adding a tooltip makes the shortcut discoverable without adding UI clutter.

## User Story
As a reader, when I hover (desktop) or long-press (mobile) the code copy button, I want to see the keyboard shortcut hint so I can copy code faster next time.

## Requirements
- For each injected `.code-copy-button`, set a `title` tooltip that includes the shortcut hint.
- Tooltip text should follow current language mode:
  - zh: includes “快捷键” and `Shift+Ctrl/Cmd+C`
  - en: includes “Shortcut” and `Shift+Ctrl/Cmd+C`
- When language toggles (dispatches `xdlkc:lang-change`), existing copy buttons update their tooltip text accordingly.

## Acceptance Criteria
- On a page with at least one code block, after `CodeCopy.initCodeCopy()` runs:
  - `.code-copy-button` exists and has a non-empty `title` containing `Shift+Ctrl/Cmd+C`.
- In `data-lang-mode="zh"`, tooltip contains `快捷键`.
- After switching to `data-lang-mode="en"` and dispatching `xdlkc:lang-change`, tooltip contains `Shortcut`.
- Existing behavior (copy success toast, button label updates, etc.) remains unchanged.

## Non-goals / Boundaries
- Do not change the shortcut itself (still Shift+Ctrl/Cmd+C on focused code block).
- Do not add new UI elements beyond the `title` attribute.
- No CSS changes required unless tests indicate a missing style regression.
