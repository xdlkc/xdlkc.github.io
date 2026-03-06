# Spec: TOC 点击滚动时考虑顶部导航高度（避免标题被遮挡）

- Date: 2026-03-07 07:36 (Asia/Shanghai)
- Slug: toc-offset-scroll
- Type: UX / article page
- Priority pool mapping: P0「文章页自动 TOC 与锚点导航」补强

## 背景/问题
文章页顶部有固定/粘性导航（`.article-nav`）。当前 TOC 点击后使用 `scrollIntoView({block:'start'})`，在部分视口/样式下会导致目标标题被顶部导航遮挡，用户需要再手动滚动一点才能看到标题。

## 需求
当用户点击文章页 TOC（目录）里的锚点链接时：
1) 页面应滚动到目标标题的“可见位置”，即标题上方预留一段空间，避免被顶部导航遮挡。
2) 保持平滑滚动体验（支持则 smooth，不支持则退化）。
3) 不改变 TOC 当前的 scroll-spy 高亮逻辑。

## 验收标准
- 点击 TOC 任意 `a[href^="#"]`：最终滚动位置应为 `headingTop - headerHeight - margin`（最小为 0）。
- `headerHeight` 来自 `.article-nav` 的高度（若不存在则视为 0）。
- `margin` 默认 12px（可在代码里常量化）。
- 仍然会更新 URL hash（`#heading-id`）。
- 单元测试覆盖 `computeScrollTop` 计算逻辑。

## 边界/非目标
- 不处理非 TOC 的普通锚点链接。
- 不新增/调整 CSS 布局（本次只改 JS 行为）。
- 不引入第三方库。
