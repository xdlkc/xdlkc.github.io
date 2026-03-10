# Spec: 页面（Page）也显示阅读进度条（Reading Progress）

## 背景 / 现状
当前主题 `themes/evan` 仅在文章页 `post.ejs` 注入阅读进度条与 `reading-progress.js` 启动逻辑；普通页面（如 `/about/`，使用 `page.ejs`）没有阅读进度条。

这会导致：
- 长页面（关于页/项目页/索引型页面）缺少一致的阅读反馈；
- 功能不一致，用户在文章页有进度条，在页面页没有。

## 目标（用户可感知）
在 `page.ejs` 渲染的页面上也显示阅读进度条，并支持现有的：
- 顶部进度条随滚动更新
- 键盘可访问（role=progressbar，tabindex=0）
- 进度条脚本 `reading-progress.js` 正常启动

## 验收标准
1. `themes/evan/layout/page.ejs` 中包含与 `post.ejs` 一致的阅读进度条 DOM：`.reading-progress` + `.reading-progress-bar`。
2. `page.ejs` 引入 `/js/reading-progress.js`，并在 `DOMContentLoaded` 时调用 `window.ReadingProgress?.initReadingProgress?.()`。
3. `npm test` 通过（新增测试覆盖 page 模板注入）。

## 非目标 / 边界
- 不改动 `reading-progress.js` 的计算逻辑与交互（本次只扩展到 Page 模板）。
- 不为首页/归档页/列表页新增进度条（避免影响信息架构）。
- 不调整样式（已有 `.reading-progress` 样式应可复用）。
