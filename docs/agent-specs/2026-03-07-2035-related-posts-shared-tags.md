# Spec: Related Posts 展示「共享标签」提示

- 时间：2026-03-07 20:35 (Asia/Shanghai)
- Slug: related-posts-shared-tags

## 需求 / 用户故事

作为读者，在文章页的「相关阅读」区域里，我希望能一眼看出推荐文章与当前文章的关联点（哪些标签相同），从而更快判断要不要点开。

## 验收标准 (Acceptance Criteria)

1. 文章页存在相关阅读列表时：
   - 每条相关阅读项在标题/日期之外，额外展示最多 **3 个**「与当前文章共享的标签」。
   - 标签以小号 pill/chip 的形式展示，文本为标签名。
2. 共享标签只显示“交集”，不显示对方独有的标签。
3. 若某条相关阅读与当前文章共享标签数 > 3，则仅展示前 3 个（按标签名排序，保证稳定）。
4. 当当前文章没有标签或无相关阅读时：
   - 行为保持不变（不渲染相关阅读区块或不增加标签行），不报错。
5. 相关逻辑在 Node 测试环境可单测。

## 边界 / 非目标

- 不引入新的构建依赖或外部服务。
- 不改变相关阅读的排序规则（仍然：共享标签数 desc，其次日期 desc）。
- 不新增新的页面入口；仅增强文章页现有模块。

## 实现要点

- 在 `scripts/helpers/related-posts.js` 中新增 `computeRelatedPostsDetailed()`：
  - 返回形如 `{ post, sharedTags }` 的结构（post 为原 post 对象引用）。
  - `sharedTags` 为与当前文章标签交集后的数组（去重、稳定排序），并在 helper 层截断为最多 3 个用于渲染。
- 新增 Hexo helper：`related_posts_detailed(page, site, { limit })`，供模板使用。
- `themes/evan/layout/post.ejs` 改用 `related_posts_detailed`，渲染共享标签 chips。
- 添加必要 CSS（轻量、与现有风格一致）。

