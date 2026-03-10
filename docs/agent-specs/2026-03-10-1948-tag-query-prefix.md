# Spec: Site Search 支持 `tag:` 前缀（SDD + TDD）

- 时间: 2026-03-10 19:48 (Asia/Shanghai)
- 功能名: 站内搜索 `tag:` 前缀过滤
- 目标: 在站内搜索框中，除了现有的 `#tag` 语法外，新增支持 `tag:xxx` / `tags:xxx` 的“仅按标签搜索”模式，方便用户显式按标签检索。

## 需求

1. 当用户输入以 `tag:` 或 `tags:`（大小写不敏感）开头的查询时：
   - 进入 tag-only 模式（与 `#tag` 一致）
   - 仅匹配文章 tags，不匹配标题/摘要
   - `tag:` 后面的内容支持空格分词（与普通查询一致）
2. 保持现有行为不变：
   - `#tag` 仍然是 tag-only 模式
   - 普通查询仍可匹配标题 + 标签

## 验收标准

- `SiteSearch.searchPosts(posts, 'tag:foo')`：只返回 tags 中包含 `foo`（contains + case-insensitive）的文章，不因为标题包含 `foo` 而命中。
- `SiteSearch.searchPosts(posts, 'tags:foo')` 同上。
- `tag:` 后只有空白/为空时，返回空数组且不抛异常。
- 原有 `#tag` 与普通查询相关测试全部继续通过。

## 边界/不做

- 不新增复杂语法（如 `title:`、布尔逻辑）。
- 不改 UI 文案/提示（除非测试需要）。
- 不改变现有排序/评分逻辑，只复用当前 tag-only 逻辑。
