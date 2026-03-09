# Spec: Related Posts keyword fallback

- Time: 2026-03-10 00:17 Asia/Shanghai
- Slug: related-posts-keyword-fallback

## Requirement

Improve the existing post-page Related Posts module so it can still recommend relevant articles when shared tags are missing or sparse.

## User value

Readers should continue seeing useful related reading on article pages even if some posts do not share explicit tags.

## Acceptance criteria

1. `related_posts_detailed` keeps existing shared-tag ranking behavior unchanged when tag overlaps exist.
2. When a candidate has no shared tags, the helper may still include it if it shares meaningful title keywords with the current post.
3. Keyword matching ignores short/common filler words and treats case differences as equal.
4. Detailed rows expose `sharedKeywords` so the template can render visible keyword chips for fallback matches.
5. The post template renders keyword chips when a related post is matched by keywords.
6. Existing related-post tests continue to pass.

## Boundaries

- Do not redesign the whole article layout.
- Do not introduce external search/index dependencies.
- Do not replace tag-based ranking; keyword matching is fallback/secondary relevance only.
- Limit visible chips to a small count for compact UI.
