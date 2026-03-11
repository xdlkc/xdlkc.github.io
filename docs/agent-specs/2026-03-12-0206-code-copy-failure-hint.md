# Spec: Code copy failure fallback should select code + show actionable hint

Date: 2026-03-12 02:06 (Asia/Shanghai)
Slug: code-copy-failure-hint

## Motivation / User value
在某些浏览器/权限场景（如 Safari、无权限剪贴板、隐私模式）里，点击“复制代码”会失败。现在虽然会提示“复制失败”，但用户接下来该怎么做不够明确，且双击复制失败时不会自动选中代码。

目标：当复制失败时，**自动选中代码内容**并给出**可执行提示**（Ctrl/Cmd+C），让用户仍能快速完成复制。

## Requirements
1. 当代码复制动作失败（按钮点击 / 双击 / 长按 / 键盘快捷键）时：
   - 自动选中对应代码块的内容（不包含按钮文字）。
   - Toast 文案包含明确的手动复制提示：
     - 中文：包含“按 Ctrl/Cmd+C”
     - 英文：包含“Press Ctrl/Cmd+C”
2. 当复制成功时，保持现有行为不变（toast、行数反馈、视觉闪烁等）。
3. 仅在失败分支追加行为；不得引入额外依赖。

## Acceptance criteria
- 单元/集成测试覆盖：
  - 按钮点击复制失败时：toast 含提示 + selection 非空且包含代码。
  - 双击复制失败时：toast 含提示 + selection 非空。
- `npm test` / `node --test` 全部通过。

## Out of scope / Boundaries
- 不处理“复制成功”的文案/样式调整。
- 不新增 UI 组件（继续复用现有 toast）。
- 不改变复制策略（仍优先使用 `navigator.clipboard.writeText`，必要时 fallback）。
