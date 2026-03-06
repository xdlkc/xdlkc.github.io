# Spec: 阅读进度条（文章页）

## 需求 / 背景
在文章阅读时，用户希望快速感知当前阅读进度。为文章页增加一个固定在顶部的阅读进度条，随滚动实时更新。

## 验收标准
- 仅在文章页（post）展示阅读进度条。
- 进度条固定在视口顶部，不影响正文布局（高度很小）。
- 初始加载时：在页面顶部进度为 0%。
- 向下滚动时：进度随滚动增加，最大为 100%。
- 进度计算基于可滚动高度（documentHeight - windowHeight），在极短页面（不可滚动）时显示为 100%。
- 不依赖外部库；性能可接受（使用 requestAnimationFrame 节流或等价机制）。

## 边界 / 非目标
- 不做章节高亮 / TOC 同步。
- 不在首页、归档、关于页面显示。
- 不引入构建工具或额外依赖。

## 实现概要
- 新增浏览器端脚本 `themes/evan/source/js/reading-progress.js`：
  - 导出纯函数 `computeReadingProgressPercent({scrollY, docHeight, winHeight})` 便于单测。
  - 提供 `initReadingProgress()` 负责 DOM 查找、事件监听与更新宽度。
  - UMD 方式：Node 测试可 `require()`，浏览器侧挂到 `window.ReadingProgress`。
- 在 `themes/evan/layout/post.ejs` 注入进度条 DOM 与脚本引用。
- 在 `themes/evan/source/css/style.css` 添加样式。

