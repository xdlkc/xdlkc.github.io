# Spec: Article Title Double-Click Copy

## Title
文章标题双击复制功能

## Date
2026-03-19-1219

## Summary
允许用户通过双击文章标题快速复制标题到剪贴板，提升分享效率。

## Requirements

### 功能需求
1. 用户可以双击文章标题（`.article-hero h1`）复制标题文本
2. 复制成功后显示 toast 提示消息
3. 复制失败时显示错误提示
4. 标题鼠标悬停时显示提示文本"双击复制标题"
5. 标题光标样式改为 pointer 表示可点击

### 验收标准
- [ ] 双击标题后，标题文本被复制到剪贴板
- [ ] 复制成功后显示 toast 提示，包含复制的内容
- [ ] toast 在 3 秒后自动消失，有淡出动画
- [ ] 支持现代浏览器（使用 `navigator.clipboard.writeText`）
- [ ] 提供降级方案，支持旧版浏览器（使用 `document.execCommand('copy')`）
- [ ] 标题悬停时显示工具提示"双击复制标题"
- [ ] 标题光标样式为 pointer

### 边界条件
- 仅在文章页面（`.article-hero h1`）启用，不影响其他页面
- 空标题不触发复制
- 快速连续多次双击只触发一次复制
- toast 消息在屏幕中央显示，z-index 高于其他元素
- 不影响文章标题的其他交互（如右键菜单）

### 用户价值
- 快速复制文章标题用于分享（社交媒体、邮件等）
- 无需手动选择文本和右键复制，提升效率
- 小而实用的交互优化

### 技术实现
- JavaScript 实现，使用 DOMContentLoaded 或 DOM ready 初始化
- 双击检测使用 click 事件计数和时间窗口（300ms）
- 复制优先使用现代 Clipboard API，降级使用 execCommand
- Toast 使用固定定位和 CSS 动画
- 添加 `window.ArticleTitleDoubleClickCopy` 全局对象供外部调用

### 文件变更
- 新建 `themes/evan/source/js/article-title-double-click-copy.js`
- 在 `themes/evan/layout/post.ejs` 中引入脚本
- 添加 CSS 样式（内联在 JS 中或单独文件）

### 测试要点
- 双击触发复制功能
- 复制成功提示正确显示
- 复制失败时降级方案工作
- Toast 自动消失
- 多次双击无重复触发
- 标题悬停提示显示
- 不在文章页面时不触发

## Non-Requirements
- 不需要存储复制历史
- 不需要统计复制次数
- 不需要自定义 toast 样式（使用默认黑底白字）
- 不需要键盘快捷键
