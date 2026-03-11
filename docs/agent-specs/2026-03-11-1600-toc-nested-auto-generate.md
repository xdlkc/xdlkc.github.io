# Spec: Auto-generated TOC should preserve heading hierarchy (nested lists)

- Date: 2026-03-11 16:00 (Asia/Shanghai)
- Slug: toc-nested-auto-generate

## 背景 / 问题
目前 `TocScrollSpy` 在页面缺少模板生成的 TOC 时，会自动根据文章内的 `h2/h3/h4` 生成 `.toc-nav` 内容。
但现有实现是“扁平列表”，导致：
- 目录层级关系不直观（H3/H4 看起来只是缩进，而不是结构性的子级）
- `enhanceCollapsibleToc()` 依赖 `li > ol/ul` 的嵌套结构来折叠子标题；自动生成的扁平 TOC 无法折叠

## 目标（用户可感知）
当 `.toc-nav` 为空且触发自动生成时：
- TOC 生成应按 heading level 构建嵌套的 `ol` 结构（H3 嵌套在最近的 H2 下，H4 嵌套在最近的 H3 下）
- 保持现有的视觉 class：`toc-nav-level-2/3/4` 和 `a.toc-nav-link`
- 使“目录折叠”功能对自动生成的 TOC 同样可用（`li > ol` 出现）

## 验收标准
1) 对于文章内容 `h2 -> h3`：
   - `.toc-nav > ol` 下有 1 个 `li.toc-nav-level-2`
   - 该 `li` 下包含 1 个子 `ol`，其下包含 `li.toc-nav-level-3`
2) 对于 `h2 -> h3 -> h4`：
   - `h4` 的 `li.toc-nav-level-4` 嵌套在最近的 `h3` 对应 `li` 的子 `ol` 中
3) 若 heading 顺序异常（例如 h3 先于 h2）或 level 超出范围：
   - 仍然生成可用 TOC（不抛异常），并把无法归类的 heading 当作顶层（按 h2 处理）
4) 不影响“已有 TOC 链接”的页面：若 `.toc-nav` 里已存在 `a[href^="#"]`，不覆盖

## 非目标 / 边界
- 不实现更复杂的 TOC（如自动编号、深度超过 h4、或基于 DOM 真实嵌套章节）
- 不修改现有 CSS（现有缩进/折叠样式应继续工作）
- 不改变 scrollspy、copy link、tooltip 等现有行为
