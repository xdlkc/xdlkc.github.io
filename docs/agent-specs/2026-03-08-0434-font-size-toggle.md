# Spec: 字号调节（文章阅读字号）+ 记忆

- Slug: font-size-toggle
- Date: 2026-03-08 04:34 (Asia/Shanghai)

## 背景 / 问题
当前站点提供了深浅色主题切换与记忆，但正文阅读字号只能依赖浏览器缩放；这会影响整体布局（尤其是导航与代码块）。希望提供「仅调整文章正文」的字号切换，并记住用户偏好。

## 需求
在站点导航区域新增「字号」按钮，允许用户在 3 档字号间循环切换，并将偏好持久化到 localStorage。

### 交互
- 按钮位置：与“主题”按钮同一导航区域（nav-links 内），全站页面可见（post/page/index/archive/news）。
- 点击按钮循环：标准 -> 大 -> 小 -> 标准。
- 持久化：刷新页面后保持上次选择。

### 展示
- 使用 `document.documentElement.dataset.fontSize` 存储当前档位（`normal|lg|sm`）。
- CSS 使用变量缩放正文（`.article-content`）字号，不影响导航与页面框架。
- 按钮文字为用户可感知标签：`字号：标准/大/小`。

## 验收标准
1. 所有页面模板（post/page/index/archive/news）都包含 `[data-font-size-toggle]` 按钮。
2. layout.ejs 加载 `/js/font-size-toggle.js`，并在 DOMContentLoaded 初始化。
3. 运行 `npm test` 全绿。
4. 字号切换只影响 `.article-content` 字体大小（通过 CSS 变量实现）。
5. localStorage key 固定为 `xdlkc:font-size`。

## 边界 / 不做
- 不提供更细粒度滑杆；只提供 3 档。
- 不改变标题（h1-h6）字号；只缩放正文基准字号。
- 不做“跟随系统字号”之类的复杂模式。
