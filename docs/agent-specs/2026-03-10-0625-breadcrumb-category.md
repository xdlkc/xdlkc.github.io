# Spec: Post breadcrumb includes primary category (UI + JSON-LD)

## 背景 / 问题
当前文章页的面包屑导航仅显示 `Home → Archives → 当前文章`；JSON-LD 的 `BreadcrumbList` 也同样缺少分类层级。
这会让用户在阅读文章时缺少“我现在在哪个分类下”的上下文，也降低了面包屑在搜索引擎中的语义表达。

## 目标（用户可感知）
- 在文章页顶部的可见面包屑中，若文章存在分类，则显示：
  - `Home → Archives → <Category> → <Post Title>`
  - 且 `<Category>` 可点击跳转到分类页。
- 在页面 head 中输出的 JSON-LD `BreadcrumbList` 同步包含分类层级（若存在）。

## 验收标准
1) 对于有分类的 post：
   - UI breadcrumb 渲染出 4 段（含分隔符），第三段为分类链接，最后一段为当前文章（aria-current=page）。
   - JSON-LD `itemListElement` 长度为 4，position 连续从 1 开始；第 3 项为分类，`item` 为分类页 URL。
2) 对于无分类的 post：
   - UI breadcrumb 维持 3 段（Home / Archives / Post）。
   - JSON-LD 维持原有 3 项（Home / Archives / Post）。
3) 对于非 post 页面：
   - JSON-LD 仍保持原行为（Home / Page）。
4) 兼容 Hexo 页面对象中分类数据的不同形态：
   - `page.categories.data[0]`（常见）
   - `page.categories[0]`（数组形态）
   - 优先使用分类对象的 `path` 字段构造 URL；否则回退到 `/categories/<name>/`。

## 边界 / 非目标
- 仅取“主分类”（第一个分类）。不做多级分类树。
- 不改变站点的分类生成规则；只读取已有 `path/name`。
- 不新增额外依赖。

## 实现提示
- 结构化数据：扩展 `scripts/helpers/breadcrumb-structured-data.js`，在 Archives 与 Post 之间插入 Category。
- UI：扩展 `themes/evan/source/js/breadcrumb.js`，从容器 data-* 读取分类信息并渲染。
- 模板：在 `themes/evan/layout/post.ejs` 的 `[data-breadcrumb]` 节点上注入分类名与 URL。
