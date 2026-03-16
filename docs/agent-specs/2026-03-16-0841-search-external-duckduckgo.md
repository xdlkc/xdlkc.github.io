# Spec: Search no-result external links add DuckDuckGo

- Date: 2026-03-16 08:41 (Asia/Shanghai)
- Slug: search-external-duckduckgo

## 背景 / 问题
站内搜索（SiteSearch 弹窗）与旧版 local-search 在“无结果”状态下，会建议用户使用外部搜索引擎并自动拼接 `site:<host> <query>`。

目前只提供 Google / Bing。对部分用户来说 DuckDuckGo 更常用或更可访问（更少地区限制），增加一个选项能更快得到结果。

## 需求
在“无结果”面板的外部搜索区域，新增 DuckDuckGo 链接。

覆盖两套搜索实现：
1) `themes/evan/source/js/site-search.js`（站点当前默认使用）
2) `js/local-search.js`（旧实现/兼容）

## 验收标准
- 当查询不为空且无结果时：
  - SiteSearch 无结果面板中，存在 3 个外部搜索链接：Google / Bing / DuckDuckGo。
  - local-search 无结果面板中，存在 3 个外部搜索链接：Google / Bing / DuckDuckGo。
- 链接格式：
  - Google: `https://www.google.com/search?q=<encoded>`
  - Bing: `https://www.bing.com/search?q=<encoded>`
  - DuckDuckGo: `https://duckduckgo.com/?q=<encoded>`
  - `<encoded>` 必须包含 `site:<hostname> <query>`（hostname 来自 `window.location.hostname`）。
- 三个链接均应包含：`target="_blank"` 且 `rel` 含 `noopener`（可带 `noreferrer`）。

## 边界 / 不做什么
- 当无法获取 hostname（空字符串）时：保持现有行为（site: 前缀为空时，外部搜索 query 退化为原 query）。
- 不改动搜索结果排序、高亮、标签建议等其他逻辑。
- 不引入新的第三方依赖。

## 测试策略（TDD）
- 更新/新增单测：
  - `tests/site-search-no-result-external-links.test.js`：断言新增 ddg 链接及 href 编码。
  - `tests/local-search-no-result-external-links.test.js`：断言外链数量从 2→3，并校验 ddg。
