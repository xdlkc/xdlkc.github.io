# Spec: 文章页自动 TOC (目录) 与锚点导航 (Feature Already Implemented)

*   **Feature Name:** 文章页自动 TOC (目录) 与锚点导航 (Automatic Table of Contents and Anchor Navigation for Article Pages)
*   **Feature ID:** feat-article-toc-anchor
*   **Date:** 2026-03-20 2009 (YYYY-MM-DD HHMM)

**1. 需求 (Requirements)**
    *   在文章页面侧边栏或内容顶部生成一个可交互的目录 (Table of Contents, TOC)。
    *   TOC 应自动提取文章内容中的 H1, H2, H3 标题，并生成对应的列表。
    *   TOC 中的每一项都应是可点击的链接，点击后平滑滚动到文章中对应的标题位置 (锚点)。
    *   当用户滚动页面时，TOC 中当前可视区域的标题应高亮显示。
    *   生成的锚点链接应具有可读性，例如将标题文本转换为 slug。
    *   TOC 应该只在文章页面 (即 `post.ejs` 渲染的页面) 显示。

**2. 验收标准 (Acceptance Criteria)**
    *   **AC1: TOC生成** - 访问任何文章页面，TOC 区域可见并包含文章中的所有 H1, H2, H3 标题。
    *   **AC2: 链接有效性** - TOC 中的每个链接都正确指向文章中的对应标题，点击后页面滚动到该标题。
    *   **AC3: 平滑滚动** - 点击 TOC 链接时，页面滚动效果应平滑。
    *   **AC4: 实时高亮** - 滚动文章内容时，TOC 中对应的标题项会被高亮（例如，添加 `active` 类）。
    *   **AC5: 唯一锚点** - 即使文章中存在相同标题，也能生成唯一的锚点ID。
    *   **AC6: 样式一致性** - TOC 的外观应与现有主题样式保持一致，或提供基础样式以确保可读性。
    *   **AC7: 仅在文章页显示** - TOC 不应在首页、分类页、标签页或关于页面等非文章页显示。

**3. 边界 (Boundaries)**
    *   **范围:** 仅限于 Hexo 博客的 `evan` 主题下的文章页面 (`post.ejs`)。
    *   **标题层级:** 仅支持 H1, H2, H3 标题层级。
    *   **生成方式:** 通过客户端 JavaScript 或 Hexo 渲染时的服务器端逻辑生成。优先考虑 Hexo 渲染时的服务器端逻辑以优化 SEO 和性能，若实现复杂则退而求其次使用客户端 JS。
    *   **CSS/JS 引入:** 尽可能复用现有资源，避免引入大量外部库。若必须引入，则应考虑性能。
    *   **本地化:** 标题的 slug 化应能正确处理中文。

**4. 发现 (Discovery)**
    *   在检查 `/Users/lkc/Code/xdlkc.github.io/public/2026/03/20/test-toc-post/index.html` 的生成内容时，发现该功能已在当前 `evan` 主题中实现。
    *   HTML 中存在 `<div class="toc-sidebar-mobile">` 和 `<aside class="toc-card toc-sidebar">` 结构，包含自动生成的 H1, H2, H3 标题链接和锚点。
    *   相关的 JavaScript 文件 `/js/toc-scrollspy.js` 和 `/js/toc-toggle.js` 已被加载并初始化，提供了平滑滚动、实时高亮和目录折叠等交互功能。
    *   文章内容中的 H1, H2, H3 标签也已自动添加 `id` 属性和 `headerlink` 锚点链接。
    *   因此，此功能无需重复开发。
