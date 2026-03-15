# Spec: SiteSearch 无结果时提供站外搜索链接

- 时间：2026-03-16 03:12 (Asia/Shanghai)
- Slug：site-search-no-result-external-links

## 背景 / 动机
站内搜索在「无结果」时，用户往往需要继续去站外（Google/Bing）用 `site:` 限定域名检索。当前无结果页只给了重试/归档提示，没有可直接点击的站外搜索入口，导致下一步操作不够顺滑。

## 需求
当 SiteSearch（站内搜索弹窗）查询无结果时：

1. 展示「站外搜索」区块，包含至少 2 个外链：Google、Bing。
2. 外链应使用 `site:<当前站点 host> <query>` 作为搜索关键词，并正确 URL encode。
3. 外链打开新标签页：`target="_blank"`，并带 `rel="noopener noreferrer"`。
4. 仅在 **query 非空** 且 **results.length === 0** 时出现；有结果时不展示。

## 验收标准
- 在 JSDOM 环境（url = `https://example.com/`）输入 `foo bar` 且无结果：
  - 页面存在 `[data-site-search-external-link="google"]` 与 `[data-site-search-external-link="bing"]`。
  - 两者 `href` 分别以 `https://www.google.com/search?q=` / `https://www.bing.com/search?q=` 开头。
  - `href` 的 query 参数中包含 encode 后的 `site:example.com foo bar`。
  - `target` 为 `_blank`，`rel` 包含 `noopener`。

## 边界 / 不做
- 不引入第三方 SDK（如 Algolia/Google CSE）。
- 不做 Baidu/其他引擎的适配（后续可扩展）。
- 不改变现有无结果 chips / similar tags / top tags 的逻辑与布局层级（只新增一个区块）。

## 设计备注
- 复用现有的 chip 样式：外链可使用 `.site-search-suggest-chip` 类，保证视觉一致。
