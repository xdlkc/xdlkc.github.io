---
title: 结构化数据：BreadcrumbList 扩展
date: 2026-03-19 20:24:00
tags:
  - SEO
  - Structured Data
  - BreadcrumbList
  - Hexo Helper
---

# 结构化数据：BreadcrumbList 扩展

## 需求 (Requirement)

扩展现有的 `structured_data` Hexo helper，使其在文章页（`post` layout）中输出符合 [schema.org/BreadcrumbList](https://schema.org/BreadcrumbList) 规范的结构化数据。这有助于搜索引擎理解网站结构，提升 SEO 表现。

## 验收标准 (Acceptance Criteria)

1.  **在文章页输出 BreadcrumbList**：
    *   当 `page.layout` 为 `post` 或 `page.type` 为 `post` 或 `page.date` 存在时，`structured_data` helper 的输出 JSON-LD 中应包含一个 `@type: "BreadcrumbList"` 的对象。
    *   此 `BreadcrumbList` 应作为 `BlogPosting` 的一个属性（例如，可以放在 `mainEntityOfPage` 旁）。

2.  **正确的层级结构**：
    *   **主页 (Home)**：始终作为第一个面包屑。
        *   `name`: `site.title`
        *   `item`: `site.url`
    *   **分类页 (Category)**：如果文章有主分类，则作为第二个面包屑。
        *   `name`: `primaryCategory.name`
        *   `item`: `primaryCategory.url` (通过 `url_for` 生成)
        *   如果文章有多个分类，只取第一个作为主分类。
        *   如果文章没有分类，则不包含此层级。
    *   **文章页 (Post)**：始终作为最后一个面包屑。
        *   `name`: `page.title`
        *   `item`: `canonicalUrl` (文章的规范 URL)

3.  **符合 Schema.org 规范**：
    *   `@context` 应为 `https://schema.org`。
    *   `@type` 应为 `BreadcrumbList`。
    *   `itemListElement` 数组中的每个元素应包含 `@type: "ListItem"`, `position: <number>`, `@id: <item_url>`, `name: <item_name>`.
    *   `position` 字段应从 1 开始递增。

4.  **动态适应性**：
    *   当文章没有分类时，面包屑应为 `Home > Post Title`。
    *   当文章有分类时，面包屑应为 `Home > Category Name > Post Title`。

## 边界 (Boundaries)

*   此功能仅关注文章页的 `BreadcrumbList`。其他页面类型（如分类归档、标签归档、页面）暂不考虑。
*   分类只考虑文章的第一个分类。
*   不需要在 HTML 中渲染可见的面包屑，仅生成 JSON-LD 结构化数据。
*   利用 Hexo 提供的 `this.page`, `this.config`, `this.canonical_url()`, `url_for()` 等方法获取数据。
