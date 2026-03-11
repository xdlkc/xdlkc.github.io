# Spec: Related Posts 显示摘要（excerpt）

- Date: 2026-03-12 06:03 (Asia/Shanghai)
- Slug: related-posts-excerpt

## 需求（User Story）
在文章页的「Related Posts」区域里，每条推荐文章除标题/日期/标签理由外，额外展示一行（最多两行）摘要文本，帮助读者更快判断是否值得点击。

## 验收标准（Acceptance Criteria）
1. 在 `themes/evan/layout/post.ejs` 的 Related Posts 列表中：
   - 每个 related post 条目在标题下方渲染一个摘要元素，class 为 `.related-posts-excerpt`。
   - 摘要来自推荐文章的 `excerpt`（优先），若无则回退到 `content`。
   - 摘要为纯文本（去掉 HTML 标签），并进行长度截断（默认最多 120 字符）。
2. 摘要为空（`excerpt/content` 都为空或清洗后为空）时：不渲染 `.related-posts-excerpt` 节点。
3. 样式上摘要为弱化文本，最多显示两行（超出显示省略），不破坏现有布局。

## 边界/不做什么（Non-goals）
- 不改动 related posts 的排序逻辑/匹配逻辑。
- 不引入新依赖。

## 技术方案（Implementation Notes）
- 新增 Hexo helper：`related_posts_excerpt(post, { maxLength })`，内部实现 `buildRelatedPostsExcerpt` 便于单测。
- 模板中调用 helper，并仅在返回非空时渲染。
- CSS：新增 `.related-posts-excerpt`。
