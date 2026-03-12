# Spec: Site Search — Ctrl/Cmd+Enter open result in new tab

Date: 2026-03-12 20:16 (Asia/Shanghai)
Slug: site-search-new-tab

## Background / Problem
站内搜索弹窗已经支持：输入搜索、上下键选择结果、Enter 打开（跳转当前标签页）。

在阅读/查资料场景下，用户常希望“在新标签页打开结果”，同时保留当前页面上下文。

## Proposal
在站内搜索弹窗中：
- 当搜索框聚焦时，按 **Ctrl+Enter（Windows/Linux）** 或 **Cmd+Enter（macOS）**：
  - 打开“当前选中结果”（若无选中则打开第一条结果）到 **新标签页**
  - 关闭搜索弹窗（避免键盘焦点留在隐藏层）
  - 记录最近搜索（与普通 Enter 打开一致）

## Acceptance Criteria
1. 弹窗打开且存在搜索结果时：
   - `Ctrl+Enter` 或 `Cmd+Enter` 会调用 `window.open(href, '_blank', 'noopener')`（或等效）打开正确链接
   - 弹窗关闭：`aria-hidden="true"` 且不再包含 `is-open` class
2. 若用户未用上下键选择任何条目：`Ctrl/Cmd+Enter` 打开第一条结果。
3. 不影响原有行为：
   - `Enter` 仍在当前标签页打开
   - `Esc` 行为不变
4. 兼容无 `window.open` 的环境（如测试/极简环境）：不抛异常。

## Non-goals / Out of Scope
- 不做完整的 focus-trap
- 不新增结果预览/分页
- 不改变搜索排序与高亮逻辑

## Edge Cases
- 弹窗未打开时：Ctrl/Cmd+Enter 不触发任何行为。
- 在可编辑输入框之外按键：沿用既有快捷键规则。

## Test Plan (TDD)
- 新增 Node+JSDOM 测试：渲染结果后，ArrowDown 选中第一条，Ctrl+Enter 应调用 window.open 并关闭弹窗。
- 覆盖“无选中时打开第一条”的分支。
