# Spec: TOC 锚点与标题 ID 同步（toc anchor sync）

- 时间：2026-03-11 23:56 (Asia/Shanghai)
- Feature slug：toc-anchor-sync

## 背景 / 问题
当前文章/页面的 TOC（由 Hexo `toc()` helper 生成）会输出一组 `a[href="#..."]` 锚点链接。但正文标题的 `id` 由前端脚本生成（或由渲染器生成），两者的 slug 规则可能不同，导致：

- 点击 TOC 条目不滚动/跳转（找不到对应 `id`）
- scrollspy 无法正确高亮
- 用户复制 TOC 链接后打开不定位

这是一个“用户可感知”的问题：目录看起来存在，但点了没反应。

## 需求
当页面上存在 `.toc-nav a[href^="#"]` 时：

1. 初始化 TOC 功能时，应尽量保证这些 TOC 链接指向的 `id` 在正文标题中真实存在。
2. 若正文标题缺少 `id` 或 `id` 与 TOC 不一致，应以 TOC 的 `href` 为准，把对应标题的 `id` 同步成 TOC 的 id。
3. 若 TOC 内出现重复的 `href` id（或将导致重复 id），需要自动去重：
   - 第一次使用原 id
   - 之后生成 `id-2`, `id-3` …
   - 同时更新对应 TOC 链接 `href` 到新的唯一 id

## 验收标准
- 给定一个包含现成 TOC anchors 的 DOM，正文标题没有 id：执行 `TocScrollSpy.initTocScrollSpy()` 后，标题应获得与 TOC 对应的 id，点击/scrollspy 可用。
- 给定 TOC 中重复 id 的 DOM：执行初始化后，页面中不存在重复 id；TOC 中的重复项 `href` 会被改写为唯一 id。
- 不影响现有“空 TOC 时自动生成目录”的逻辑。

## 边界 / 不做
- 不做复杂的模糊匹配（只按 TOC link 顺序 + 文字精确匹配进行同步；无法匹配则保持现状，交给 `ensureHeadingIds` 兜底）。
- 不改 TOC 结构/样式。
- 不引入新依赖。

## 测试计划（TDD）
新增单元/集成测试（jsdom）：
1. `syncs heading ids to existing TOC anchors`
2. `dedupes duplicate toc ids by rewriting href`
