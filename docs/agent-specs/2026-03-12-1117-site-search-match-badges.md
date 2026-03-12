# Spec: Site Search — match reason badges

- Date: 2026-03-12 11:17 (Asia/Shanghai)
- Slug: site-search-match-badges

## Goal / User value
When users search the site, each result should quickly communicate *why* it matched (title vs tag vs category), so users can choose the right page faster—especially for ambiguous keywords.

## Non-goals
- No changes to the search ranking/scoring algorithm.
- No new data source fields.
- No redesign of the search modal.

## Requirements
1) For each search result item, render a small “match badges” row.
2) Badges indicate up to 3 match reasons, chosen in this priority:
   - Title match
   - Tag match (show as `#<tag>` using the first matched tag)
   - Category match (show as `<category>` using the first matched category)
3) A match is defined as: any query token (case-insensitive) is a substring of the field.
4) For tag-only query mode (`#tag` or `tag:`), do **not** emit “Title” badges.
5) For category-only query mode (`cat:` / `category:`), do **not** emit “Title” or “#tag” badges.
6) Badges must be XSS-safe (escape user/content strings). Tag/category badge text may include highlighted `<mark>` segments consistent with existing highlight logic.

## Acceptance criteria
- Given a query that matches only a tag, the result shows a badge containing `#<tag>`.
- Given a query that matches only the title, the result shows a badge containing `Title` (EN) / `标题` (ZH).
- Given a category-only query, no title/tag badges are shown.
- `npm test` passes.

## Edge cases
- Empty query: no badges.
- Posts without tags/categories: no corresponding badges.
- Multi-keyword queries: any token match triggers the badge.
