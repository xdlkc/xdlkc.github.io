# Spec: TOC 自动展开当前章节（Active entry auto-expand）

- Date: 2026-03-08 21:34 (Asia/Shanghai)
- Slug: toc-auto-expand-active

## 需求 / Motivation
文章页 TOC 已支持“折叠子标题”。但当用户折叠了某一大章节后，滚动到该章节的子标题时：
- TOC 的 active 高亮可能发生在被折叠的子项上，导致用户在 TOC 中“看不到当前章节在哪里”。

希望：当 TOC active 变化时，自动把 active link 的所有父级 TOC 节点展开，使当前章节始终可见。

## 验收标准 / Acceptance Criteria
1. 当某个 TOC 链接被设为 active（`a.is-active` / `aria-current=true`）时：
   - 若该链接位于某个 `li.is-collapsed` 的后代中，需自动移除这些祖先 `li` 的 `is-collapsed`，使其展开。
2. 展开行为不应写入持久化折叠状态（localStorage），避免覆盖用户的长期偏好；仅对当前页面 DOM 生效。
3. 行为应对重复调用保持安全（idempotent）。

## 边界 / Non-goals
- 不新增新的 UI 元素与样式。
- 不改变用户点击折叠按钮后的持久化逻辑（仍由现有 `enhanceCollapsibleToc` 负责）。

## 实现要点
- 在 `themes/evan/source/js/toc-scrollspy.js` 增加一个可测试的 helper：
  - `expandTocAncestorsForLink(link)`：向上查找最近的祖先 `li`，移除其 `is-collapsed`。
- 在 `setActive(id)` 中设置 active 后调用该 helper。

## 测试计划
- 新增单测：构造一个含折叠父 `li.is-collapsed` 的 TOC DOM，调用 helper 后断言父级已展开。
