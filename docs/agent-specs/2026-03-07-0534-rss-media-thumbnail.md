# Spec: RSS 输出增强（media:thumbnail 自动注入）

## 背景 / 目标
当前站点 RSS（`/rss.xml`）包含 `content:encoded`，但缺少 `media:thumbnail`（以及对应的 `xmlns:media`）。不少 RSS 阅读器会优先展示缩略图；缺少该字段会导致订阅列表缺乏视觉线索。

本次迭代：在生成后的 `rss.xml` 中，为每个 `<item>` 自动注入 `media:thumbnail`，URL 来自文章正文（`content:encoded`）里的第一张图片。

## 用户可感知价值
- RSS 阅读器（Reeder / Inoreader / Feedly 等）在列表页能展示文章缩略图，提升可浏览性。

## 需求
1. 若 `rss.xml` 的 `<rss>` 根节点缺少 `xmlns:media="http://search.yahoo.com/mrss/"`，自动补上（保持幂等）。
2. 对每个 `<item>`：
   - 若已存在 `<media:thumbnail ...>`，不重复注入。
   - 否则，从该 item 的 `<content:encoded>` 中提取第一张图片的 `src`（支持 `src="..."` 或 `src='...'`）。
   - 若提取到图片 URL，则在 `</item>` 前注入：`<media:thumbnail url="..." />`。
3. 变更在 Hexo `after_generate` 阶段完成，兼容现有 `rss-stylesheet.js` 注入逻辑。

## 验收标准
- `npm test` 通过。
- 生成后的 `public/rss.xml`（或 route 内容）包含 `xmlns:media`。
- 至少一个 item 在没有缩略图时会新增 `<media:thumbnail url="..." />`。
- 重复运行生成流程不会产生重复缩略图或重复 namespace（幂等）。

## 边界 / 非目标
- 不生成图片、不做 OG Image 复杂渲染；仅提取正文第一张图。
- 不尝试解析复杂 HTML，仅用轻量正则；若正文无图则跳过。
- 不改动 feed 插件本身输出格式（仅对最终 XML 做后处理）。
