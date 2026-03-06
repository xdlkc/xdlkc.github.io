# Spec: BreadcrumbList JSON-LD (P1)

## 背景 / 目标
为文章页与普通页面补充 `BreadcrumbList` 结构化数据（JSON-LD），让搜索引擎更容易理解页面层级，并在 SERP 中更稳定地产生面包屑展示。

## 用户可感知价值
- 在页面源码中可看到新增的 `BreadcrumbList` JSON-LD。
- 对 SEO/分享预览更友好（搜索结果面包屑潜在展示）。

## 需求
1. 在页面 `<head>` 注入第二段 JSON-LD：`BreadcrumbList`。
2. 规则：
   - **文章页（post）**：`Home -> Archives -> 当前文章`。
   - **普通页（page/其他）**：`Home -> 当前页面`。
3. `item` URL 必须为绝对 URL（基于 `site.url` + `root` / 或直接使用 `canonicalUrl`）。
4. 当 `canonicalUrl` 缺失时，不输出面包屑结构化数据（返回 `null`）。

## 验收标准
- 新增单元测试覆盖：
  - post 页输出 3 个 ListItem，位置与 URL 正确。
  - page 页输出 2 个 ListItem。
  - 缺失 canonicalUrl 返回 null。
  - `themes/evan/layout/layout.ejs` 中确实渲染 `breadcrumb_structured_data()` 的 JSON-LD。
- `npm test` 全绿。

## 边界 / 非目标
- 不做多级目录（year/month/category/tag）细粒度拆分。
- 不改动现有 `BlogPosting` JSON-LD。
- 不引入新依赖。
