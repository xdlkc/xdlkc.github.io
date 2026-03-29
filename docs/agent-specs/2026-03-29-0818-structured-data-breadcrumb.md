# Structured Data Breadcrumb

## Requirement
Add BreadcrumbList structured data (JSON-LD) to article pages to enhance SEO and search engine result display.

## Acceptance Criteria
- A function `generateBreadcrumbData(url, title, category)` is provided.
- Returns a valid JSON-LD string representing the BreadcrumbList.
- The BreadcrumbList must include "Home", the category, and the article title as items.