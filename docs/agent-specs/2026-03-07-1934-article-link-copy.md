# Spec: 文章页“一键复制链接”按钮

- Feature Slug: article-link-copy
- Date: 2026-03-07 19:34 (Asia/Shanghai)

## 背景 / 需求
读者在手机或桌面端阅读文章时，经常需要把当前文章链接分享给别人。相比手动复制地址栏，一个在文章标题区就能点到的「复制链接」按钮更直观。

## 目标
在文章页（post）标题区提供一个“复制链接”按钮：
- 点击后将当前文章的 canonical URL（即当前页面 URL，不含 hash）复制到剪贴板
- 显示短暂 toast 提示“链接已复制”（或失败提示）

## 验收标准
1. 文章页标题区出现一个按钮（文本：`复制链接`），不会影响现有布局（按钮可用 CSS 轻量排版）。
2. 点击按钮：
   - 优先使用 `navigator.clipboard.writeText` 复制
   - 若不可用则 fallback 到 `document.execCommand('copy')`
3. 复制成功：
   - toast（复用 `.code-copy-toast` 样式/容器）显示 `链接已复制`
   - 按钮文案短暂变为 `已复制`，约 1.2s 后恢复 `复制链接`
4. 复制失败：toast 显示 `复制失败，请手动复制`
5. 具备 Node/jsdom 可测试性：模块导出 `initArticleLinkCopy`，测试可注入 document/navigator/location/window。

## 边界 / 非目标
- 不做分享面板（微信/微博等）
- 不生成短链
- 不在非文章页（index/archive/tag）注入按钮
- 不处理带 hash 的“复制某一节链接”（已有 heading-anchor-copy 功能覆盖）
