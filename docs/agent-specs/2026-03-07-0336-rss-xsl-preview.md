# Spec: RSS 增加浏览器可读预览（XSL）

- 时间：2026-03-07 03:36 (Asia/Shanghai)
- Slug：rss-xsl-preview

## 背景 / 问题
`rss.xml` 在 RSS 阅读器里体验很好，但直接用浏览器打开时是“纯 XML”，可读性差。

## 需求
为站点 RSS 增加一个可读预览：
- 在生成的 `rss.xml` 顶部注入 `<?xml-stylesheet ...?>` 处理指令，指向 `/rss.xsl`。
- 新增 `source/rss.xsl`，提供简洁 HTML 预览（标题 + 最近条目列表）。

## 验收标准
1. `hexo generate` 后输出目录存在：
   - `rss.xml`，且包含 `xml-stylesheet`，`href="/rss.xsl"`。
   - `rss.xsl` 文件存在。
2. 注入逻辑幂等：重复 generate 不会重复插入多条 `xml-stylesheet`。
3. `npm test` 通过。

## 边界 / 非目标
- 不更改 RSS 内容结构（items / content:encoded 等保持由插件生成）。
- 不引入外部 CDN 资源；XSL 自包含。
