# Spec: Site Search 关闭后恢复焦点（Focus Restore）

## 背景 / 问题
站内搜索（`themes/evan/source/js/site-search.js`）会把焦点移到搜索框，便于立即输入。
但关闭弹窗（点击关闭按钮 / 点击遮罩 / 按 `Escape`）后，目前不会把焦点恢复到触发打开弹窗的元素。

这会影响键盘用户与可访问性体验：用户关闭后需要重新 Tab 寻找原位置。

## 需求
当站内搜索弹窗打开时，记录“打开前的焦点元素”（trigger button 或触发快捷键时的当前焦点）。
当弹窗关闭时：
- 若记录的元素仍在 DOM 中且可聚焦，则将焦点恢复到该元素。
- 若无法恢复（元素已不存在 / 不可聚焦），则不抛错，保持当前行为。

适用关闭路径：
1. 点击弹窗内的“关闭”按钮（`[data-site-search-close]`）
2. 点击遮罩（overlay，即 `event.target === dialog`）
3. 按 `Escape`

## 验收标准
- 打开弹窗后，`document.activeElement` 为搜索输入框。
- 关闭弹窗后，焦点恢复到打开前的按钮（`[data-site-search-trigger]`）。
- 关闭流程不应抛异常。

## 边界 / 非目标
- 不实现完整 focus trap（Tab 循环）
- 不变更现有 UI 样式与搜索逻辑
- 若没有可恢复焦点的元素（例如页面初始焦点在 body），不强行设置到某个默认元素
