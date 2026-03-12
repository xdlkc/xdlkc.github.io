# Spec: RSS item 自动补全 `<guid>`（permalink）

- Slug: rss-guid-permalink
- Date: 2026-03-12 15:43 (Asia/Shanghai)

## 背景 / 问题
部分 RSS 阅读器会依赖 `<guid>` 来判断条目唯一性与去重。如果 feed 中缺失 `<guid>` 或 `<guid>` 不稳定，可能导致：
- 已读条目重复出现
- 同一篇文章更新后被识别为“新文章”

当前站点 RSS 的后处理脚本 `scripts/rss-enhance.js` 会补齐 namespace、`atom:link rel=self`、以及 `<dc:creator>`，但没有确保每个 `<item>` 具备稳定的 `<guid>`。

## 需求
为生成后的 `rss.xml` 做后处理增强：
1) 若某个 `<item>` 缺少 `<guid>`：自动插入 `<guid isPermaLink="true">${itemLink}</guid>`
2) 若 `<item>` 已有 `<guid>`：不改动（保持幂等）

## 验收标准
- `enhanceRssXml()` 对缺少 guid 的 item：会在 `<link>` 附近插入 `<guid isPermaLink="true">...</guid>`，且值与 `<link>` 完全一致。
- 对已有 guid 的 item：输出不改变该 item 的 guid 内容。
- 多次执行 `enhanceRssXml()` 输出完全一致（幂等）。
- 通过新增/更新的单元测试（`npm test`）。

## 边界 / 非目标
- 不解析/规范化 URL（以 RSS 内 `<link>` 原样为准）。
- 不处理 Atom feed，仅针对 RSS 2.0 XML 字符串后处理。
- 不尝试“修复错误 XML”；输入如果不是标准 RSS 结构，允许保持原样。
