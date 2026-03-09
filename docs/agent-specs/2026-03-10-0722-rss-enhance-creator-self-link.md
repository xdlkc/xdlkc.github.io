# Spec: RSS 输出增强（creator + self link）

时间：2026-03-10 07:22 (Asia/Shanghai)

## 背景 / 问题
当前 RSS（`/rss.xml`）对部分阅读器/聚合器不够“自描述”：
- 缺少 `atom:link rel="self"`，部分客户端无法可靠识别 feed 自身地址
- 缺少作者字段（`dc:creator`），在多端/多作者场景下展示不完整

本次迭代目标：在不改变现有站点样式/页面的前提下，增强 RSS 的兼容性与可读性（用户可感知：RSS 阅读器里能看到作者、并更稳定识别订阅源）。

## 需求
1. 构建后（`hexo generate`）的 `public/rss.xml`：
   - `<rss ...>` 根节点应包含命名空间：
     - `xmlns:atom="http://www.w3.org/2005/Atom"`
     - `xmlns:dc="http://purl.org/dc/elements/1.1/"`
2. `<channel>` 下应包含一个 `atom:link`：
   - `rel="self"`，`type="application/rss+xml"`
   - `href` 为站点绝对地址（`config.url` + `config.root` + `feed.path`），默认 `https://xdlkc.github.io/rss.xml`
   - 若已存在则不重复插入（幂等）
3. 每个 `<item>`：
   - 若缺少 `<dc:creator>`，则补充 `<dc:creator>{author}</dc:creator>`
   - author 取 `config.author`，缺省值允许为空（为空则不注入）
   - 若已存在则不覆盖（幂等）

## 验收标准
- `npm test` 通过
- 单元测试覆盖：
  - 能插入 atom/dc 命名空间
  - 能插入 channel 的 atom:link self
  - 能给缺失 creator 的 item 注入 dc:creator，且已存在时不重复
  - 多次运行增强函数结果一致（幂等）

## 边界 / 非目标
- 不重写 feed 生成逻辑，仅做生成后的轻量后处理
- 不保证对任意非标准 XML 变体都完美处理；仅面向 hexo-generator-feed 的常见输出
- 不引入重依赖（保持脚本轻量，避免 XML 大解析器）
