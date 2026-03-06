# Spec: 文章代码块复制按钮与复制成功提示

- Date: 2026-03-06 22:34 (Asia/Shanghai)
- Slug: code-copy-button

## 背景 / 问题
当前文章页（theme: `evan`）已有 `themes/evan/source/js/code-copy.js` 与对应 CSS，但在页面模板中未加载该脚本，导致用户在文章里的代码块无法一键复制。

## 目标（用户可感知）
在文章页与独立页面（post/page）中的代码块右上角展示「复制代码」按钮，点击后复制代码内容，并给出「复制成功」提示（toast + 按钮文案短暂变更）。

## 验收标准（Acceptance Criteria）
1. 文章内容区 `.article-content` 内：
   - 对 `<pre>` 代码块注入 `.code-copy-button` 按钮。
   - 对 `figure.highlight` 代码块注入 `.code-copy-button` 按钮。
2. 重复初始化不会插入重复按钮（幂等）。
3. 点击按钮：
   - 优先使用 `navigator.clipboard.writeText`；不可用时 fallback 到 `document.execCommand('copy')`。
   - 成功时：
     - 页面存在 `.code-copy-toast` 且短暂展示“复制成功”。
     - 按钮文案从“复制代码”变为“已复制”，约 1.2s 后恢复。
   - 失败时：toast 展示“复制失败，请手动复制”。
4. 站点生成产物 `public/` 中的 post/page 页面能实际加载 `/js/code-copy.js`。

## 边界 / Non-goals
- 不做 Prism/Highlight 样式重构。
- 不改动代码块渲染方式（仅注入按钮与 toast）。
- 不处理站外嵌入（例如 iframe）里的代码块。

## 风险与回滚
- 风险：若模板未正确引入脚本，功能不可见；回滚只需移除模板中的 script 引用。
