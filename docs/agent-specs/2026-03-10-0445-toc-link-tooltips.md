# Spec: TOC 条目 hover 显示完整标题（tooltip）

时间：2026-03-10 04:45 (Asia/Shanghai)

## 背景 / 问题
文章目录（TOC）里遇到长标题时，视觉上容易被截断或换行，用户很难快速确认条目完整内容。

## 需求
为文章页 TOC 的每个锚点链接（`.toc-nav a[href^="#"]`）补充 tooltip：当鼠标 hover 时能看到完整标题。

## 验收标准
- 当 TOC 由脚本自动生成时：生成的每个 `.toc-nav-link` 都带有 `title` 属性，值为该条目的完整文本。
- 当 TOC 已经存在（模板/Hexo helper 生成）时：初始化后若链接缺少 `title`，则自动补上；若已存在 `title`，不得覆盖。
- 不改变现有 TOC 的结构、排序、滚动/scrollspy 行为。

## 边界 / 非目标
- 不做多行省略/截断的样式改动（本轮只做 tooltip，避免影响布局）。
- 不对非 TOC 的站内锚点（如正文里的链接）做处理。

## 实现草案
- 在 `themes/evan/source/js/toc-scrollspy.js` 中新增 `enhanceTocLinkTitles(toc)`：
  - 遍历 `toc.querySelectorAll('a[href^="#"]')`
  - 若 `title` 为空且 `textContent` 非空，则 `setAttribute('title', text)`
- 在 `initTocScrollSpy()` 中，TOC 构建/保留后调用该增强函数。

## 测试策略（TDD）
- JSDOM 集成测试：
  - 场景 A：空 `.toc-nav` 自动生成两条链接，断言它们都有 `title` 且等于对应文本。
  - 场景 B：`.toc-nav` 预置一条链接无 `title`，init 后应补上；若预置 `title`，init 后保持不变。
