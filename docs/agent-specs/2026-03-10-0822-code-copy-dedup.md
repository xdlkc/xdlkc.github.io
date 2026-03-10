# Spec: 代码块复制按钮去重（避免 Highlight 块出现两个按钮）

- 日期：2026-03-10 08:22 (Asia/Shanghai)
- Slug：code-copy-dedup

## 背景 / 问题
当前站点为文章页代码块注入「复制代码」按钮。Hexo 的 `figure.highlight` 结构里通常会包含一个 `pre`，而现有逻辑会同时：
1) 匹配 `.article-content pre`
2) 匹配 `.article-content figure.highlight`

导致同一段 highlight 代码可能被识别为两个 block，从而出现 **重复的复制按钮**（用户可见、影响阅读）。

## 需求
- 对 Hexo highlight 代码块（`figure.highlight`）只注入 **一个** `.code-copy-button`。
- 普通 `pre` 代码块仍然正常注入按钮。

## 验收标准
- 给定 DOM：`.article-content figure.highlight` 内含 `pre > code` 时，调用 `initCodeCopy()` 后：
  - `figure.highlight` 内 `.code-copy-button` 数量为 `1`
  - 不会因为内部 `pre` 再额外注入一个按钮
- 给定 DOM：`.article-content > pre`（不在 `figure.highlight` 内）时，调用 `initCodeCopy()` 后：
  - `pre` 内 `.code-copy-button` 数量为 `1`

## 边界 / 不做什么
- 不改变复制逻辑、toast 文案、样式。
- 不重构 `code-copy.js` 的整体结构，只做最小修复。

## 实现思路（最小改动）
- 在扫描 `pre` 时排除位于 `figure.highlight` 内的 `pre`：
  - `pre.closest('figure.highlight')` 为真则跳过
