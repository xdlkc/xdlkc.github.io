---
title: BreadcrumbList 结构化数据集成
date: 2026-03-19 22:26:00
tags:
  - SEO
  - Structured Data
  - BreadcrumbList
  - TDD
---

# BreadcrumbList 结构化数据集成

## 需求 (Requirement)

将现有的 `breadcrumb_structured_data` helper 集成到 `structured_data` helper 中，使得文章页的 BlogPosting 结构化数据包含 BreadcrumbList 属性，以提升 SEO 表现。

## 验收标准 (Acceptance Criteria)

1. **修改 `structured_data.js` helper**：
   - 在 `buildStructuredData` 函数中，导入并使用 `buildBreadcrumbStructuredData` 函数
   - 当页面是文章页时，生成 BreadcrumbList 并添加到返回的对象中
   - BreadcrumbList 应作为 `breadcrumbList` 属性添加到 BlogPosting 对象中

2. **正确的数据结构**：
   - BlogPosting 对象应包含 `breadcrumbList` 属性
   - `breadcrumbList` 的值应是完整的 BreadcrumbList 对象（包含 `@context`, `@type`, `itemListElement`）
   - 对于有分类的文章：breadcrumbList 应包含 3 个元素（Home, Category, Post）
   - 对于无分类的文章：breadcrumbList 应包含 2 个元素（Home, Post）

3. **向后兼容性**：
   - 非文章页仍返回 null
   - BlogPosting 的其他属性（headline, url, author 等）不受影响
   - mainEntityOfPage 保持为字符串 URL（不改变）

## 边界 (Boundaries)

- 此任务仅修改 `scripts/helpers/structured_data.js`
- 不修改 `scripts/helpers/breadcrumb-structured-data.js`（它已经正确）
- 不需要修改 HTML 模板（breadcrumb 结构化数据已存在但未集成）
- 确保 helper 仍然通过现有的测试

## 技术实现要点

1. 在 `structured_data.js` 顶部导入 `buildBreadcrumbStructuredData`:
   ```javascript
   const { buildBreadcrumbStructuredData } = require('./breadcrumb-structured-data');
   ```

2. 在 `buildStructuredData` 函数中，生成 breadcrumb:
   ```javascript
   const breadcrumbList = buildBreadcrumbStructuredData({
     page,
     site,
     canonicalUrl
   });
   ```

3. 将 breadcrumbList 添加到结果对象（如果存在）:
   ```javascript
   if (breadcrumbList) {
     result.breadcrumbList = breadcrumbList;
   }
   ```

## 测试要点

1. 验证文章页返回的结构化数据包含 `breadcrumbList` 属性
2. 验证 `breadcrumbList` 的 `@type` 是 "BreadcrumbList"
3. 验证 `breadcrumbList.itemListElement` 的数量正确（有分类: 3, 无分类: 2）
4. 验证非文章页不包含 `breadcrumbList`
5. 验证 `mainEntityOfPage` 仍然是字符串 URL
