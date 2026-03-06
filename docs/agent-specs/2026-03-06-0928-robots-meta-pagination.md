# Spec: Robots Meta for Paginated and Error Pages

- **Time**: 2026-03-06 09:28 (Asia/Shanghai)
- **Slug**: robots-meta-pagination

## 背景 / 目标
分页列表页（如 `/page/2/`）和 404 页通常不应参与主索引竞争。为博客新增一个统一的 robots meta 规则，减少薄内容页被索引的概率，并保持文章详情页可索引。

## 需求
1. 提供一个 helper（`robots_meta`）输出 robots 指令字符串。
2. 在页面 `<head>` 中输出 `<meta name="robots" ...>`。
3. 默认页面（首页第一页、文章页、普通内容页）输出：`index,follow,max-image-preview:large`。
4. 分页页（`page.current > 1`）输出：`noindex,follow`。
5. 404 页（`layout === '404'` 或 path 含 `404`）输出：`noindex,follow`。

## 验收标准
- [ ] helper 能根据 page 上下文返回正确 robots 指令。
- [ ] 对字符串数字分页值（如 `"2"`）也能识别为分页页。
- [ ] layout 模板中新增 robots meta 输出。
- [ ] 自动化测试覆盖默认页、分页页、404 页场景并通过。

## 边界与非目标
- 本次不引入 `x-robots-tag` header。
- 本次不改变 sitemap/站点结构。
- 本次不对分类/标签页做额外 noindex 策略（避免一次改动过大）。
