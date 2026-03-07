# Spec: RSS 输出增强（全文 + 绝对链接）

- Date: 2026-03-07 16:34 (Asia/Shanghai)
- Slug: rss-full-content-absolute-links

## 背景 / 动机
当前 `rss.xml` 主要用于订阅阅读。若内容是摘要或包含站内相对链接（如 `/images/...`、`href="/2026/..."`），在多数 RSS 阅读器里会出现：
- 只能看到截断内容，阅读体验差
- 图片/链接打不开（因为阅读器不在站点域名上下文）

## 需求
1) RSS 输出包含文章全文（而非仅摘要）。
2) RSS 中文章内容里的站内相对 URL（`href`/`src` 以 `/` 开头）在生成后被转换为绝对 URL（基于 `config.url`）。
3) 改动应当是“小而完整、用户可感知”，且不影响正常 `hexo generate`。

## 验收标准
- `_config.yml` 的 `feed` 配置开启全文输出。
- 新增一个纯函数 `absolutizeRssXml(xml, siteUrl)`：
  - 输入一段 RSS XML 字符串与站点 URL，输出替换后的 XML。
  - 能将 `href="/path"`、`src="/path"` 转为 `href="https://example.com/path"`、`src="https://example.com/path"`。
  - 不修改已经是绝对 URL（`http://`/`https://`）或其他协议（`mailto:`、`data:` 等）。
- 新增 Hexo `after_generate` filter：
  - 在 `public/rss.xml` 存在时执行替换并写回。
  - 文件不存在时不报错。
- `npm test` 通过。

## 边界 / 不做
- 不解析/重写 Atom/JSON Feed（仅处理 `rss.xml`）。
- 不做 HTML 清洗、也不重排 XML 格式。
- 不处理 `url(...)` CSS 之类场景。

## 测试策略（TDD）
- 单元测试覆盖：
  - 绝对化 `href`/`src`
  - 忽略绝对 URL 与非 http(s) 协议
  - 保持其他内容不变
