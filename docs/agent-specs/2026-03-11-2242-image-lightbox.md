# Spec: Article image lightbox (click-to-zoom)

- Date: 2026-03-11 22:42 (Asia/Shanghai)
- Slug: image-lightbox

## User story
As a reader, when I view images inside an article, I want to click an image to see it larger in a focused overlay, so I can read details without leaving the page.

## Scope / requirements
1. Only enhance images inside `.article-content`.
2. Clicking an image opens a full-screen overlay (lightbox) showing the same image (src) and alt text.
3. Overlay can be closed by:
   - Clicking the dimmed backdrop
   - Pressing `Escape`
   - Clicking an explicit close button
4. Must be idempotent: calling init multiple times must not create duplicated overlays or double-bind handlers.
5. Accessibility:
   - Overlay has `role="dialog"` and `aria-modal="true"`.
   - Close button has an aria-label.
6. Progressive enhancement: if JS fails, normal images remain unchanged.

## Non-goals / boundaries
- No gallery navigation (prev/next) in this iteration.
- No pinch-zoom or deep gesture support.
- Do not rewrite image URLs or add lazy-loading behavior.
- Do not affect images outside `.article-content` (e.g., header/logo).

## Acceptance criteria
- Given an article page with an image inside `.article-content`, clicking it opens a visible overlay containing an `<img>` whose `src` equals the clicked image’s `src`.
- Pressing `Escape` closes the overlay.
- Clicking the backdrop closes the overlay.
- Re-running `initImageLightbox()` does not duplicate the overlay element and does not bind multiple click handlers (a single click opens a single overlay).

## Test plan (TDD)
- Unit/integration tests with JSDOM:
  - `initImageLightbox` injects one overlay.
  - Clicking an image opens overlay and sets image src.
  - `Escape` closes overlay.
  - Calling init twice keeps a single overlay.
