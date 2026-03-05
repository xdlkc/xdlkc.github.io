# Spec: Post JSON-LD Structured Data

- **Time:** 2026-03-06 07:21 (Asia/Shanghai)
- **Slug:** article-structured-data

## Background
Current pages already output canonical URL and Open Graph/Twitter meta tags, but post pages do not expose JSON-LD structured data for search engines.

## Goal
Add a small, complete SEO enhancement: output `application/ld+json` for blog post pages.

## Requirements
1. For post pages, generate valid JSON-LD with `@context` = `https://schema.org` and `@type` = `BlogPosting`.
2. JSON-LD should include:
   - `headline`
   - `description`
   - `url`
   - `image` (array with one absolute URL when available)
   - `datePublished` (ISO-8601 when available)
   - `dateModified` (ISO-8601 when available)
   - `wordCount` (when a positive number is available)
   - `mainEntityOfPage` (canonical URL)
   - `author` (site title fallback)
3. For non-post pages, do not output JSON-LD.
4. Output must be safely serializable as JSON and injected into `<script type="application/ld+json">` in the main layout.

## Acceptance Criteria
- Unit tests cover:
  1) post page returns expected BlogPosting fields;
  2) non-post page returns empty output;
  3) optional fields are omitted when source data is missing.
- `npm test` passes.
- Single commit includes spec + failing tests + implementation.

## Boundaries
- No redesign of templates/styles.
- No change to existing Open Graph/Twitter/canonical behavior.
- No external dependencies added.