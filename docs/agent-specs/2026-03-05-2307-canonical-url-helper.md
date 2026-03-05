# Spec: Canonical URL Helper for SEO

## Background
Current pages only output title/description meta tags and do not emit a canonical URL. This can hurt SEO when the same content is accessible through multiple URL variants (e.g., with query/hash fragments).

## Requirement
Add canonical URL support in the shared layout so every page renders:

```html
<link rel="canonical" href="..." />
```

## Acceptance Criteria
1. Layout outputs a canonical link tag in `<head>`.
2. Canonical URL is absolute and based on site root + current page path.
3. Query string and hash fragment are removed from canonical URL.
4. If current path is already an absolute URL, preserve it (still remove query/hash).
5. Existing title/description rendering remains unchanged.

## Non-goals / Boundaries
- No sitemap generation changes.
- No redirects or routing changes.
- No visual UI changes.

## Test Plan
- Unit test a URL builder helper with cases:
  - relative path + site root
  - relative path containing query/hash
  - already absolute URL
  - missing path fallback to root
