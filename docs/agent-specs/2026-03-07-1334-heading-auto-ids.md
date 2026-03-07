# Spec: Auto-generate heading ids for better TOC & anchor links

- Date: 2026-03-07 13:34 (Asia/Shanghai)
- Slug: heading-auto-ids

## Motivation / Problem
Some rendered article pages may contain headings (h2/h3/...) without an `id` attribute. When that happens:
- TOC generation may miss those headings (or TOC links won’t work)
- “copy section link”/anchor navigation becomes inconsistent

## User-visible change
On article pages, headings without ids will automatically receive stable, URL-friendly ids, enabling:
- TOC anchors that always work
- Consistent section-link sharing

## Requirements
1. For rendered HTML content, add an `id` to headings `h1`-`h6` that do not already have one.
2. Do **not** change headings that already have an `id`.
3. Generated ids must be URL-friendly:
   - Trim whitespace
   - Lowercase latin letters
   - Replace whitespace with `-`
   - Remove common punctuation
   - Keep CJK characters (so Chinese titles remain meaningful)
4. Ensure uniqueness within the same HTML document:
   - If an id already exists, append `-2`, `-3`, ...
5. Apply to both posts and pages via Hexo filters.

## Acceptance Criteria
- Given HTML with headings missing ids, the output contains ids matching the derived slugs.
- Existing ids are preserved.
- Duplicate headings get unique ids with numeric suffixes.
- `npm test` passes.

## Non-goals / Boundaries
- Do not change the TOC renderer logic.
- Do not attempt deep i18n slug rules; only a simple deterministic slugify is required.
- Do not alter heading text content.
