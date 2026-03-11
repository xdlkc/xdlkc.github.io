# Spec: Image lightbox keyboard navigation (Prev/Next)

Date: 2026-03-12 03:12 (Asia/Shanghai)
Slug: image-lightbox-keyboard-nav

## User story
As a reader viewing images in an article lightbox, I want to use the keyboard arrow keys to move to the previous/next image, so I can browse an image set without closing the overlay.

## Scope / Requirements
1) When the lightbox overlay is open:
   - Pressing **ArrowRight** shows the **next** image in the same article.
   - Pressing **ArrowLeft** shows the **previous** image in the same article.
2) Navigation order is the DOM order of `.article-content img`.
3) Navigation wraps around:
   - Next on the last image goes to the first.
   - Prev on the first image goes to the last.
4) The displayed image `src` and caption (from `alt`) update accordingly.
5) When the overlay is closed, ArrowLeft/ArrowRight do nothing.

## Non-goals (this iteration)
- Focus trap / full dialog accessibility.
- Touch swipe navigation.
- Navigating across multiple article containers.
- Supporting images that are wrapped by links (those are not lightbox-enabled today).

## Edge cases / Boundaries
- If there are 0 or 1 eligible images, arrow navigation should be a no-op.
- Only handle keyboard navigation when the overlay `is-open`.
- Do not interfere with modifiers (Alt/Meta etc.).

## Acceptance criteria
- Given an article with 3 images, clicking the 2nd opens the lightbox showing image2.
- Press ArrowRight → shows image3; press ArrowRight again → wraps to image1.
- Press ArrowLeft from image1 → wraps to image3.
- Closing the overlay then pressing ArrowRight does not change the overlay state or image.

## Test plan
- jsdom integration test:
  - Setup DOM with `.article-content` containing multiple images.
  - Init `ImageLightbox.initImageLightbox`.
  - Click an image to open overlay.
  - Dispatch keydown ArrowRight/ArrowLeft and assert overlay image `src` updates with wrapping.
  - Close overlay and verify Arrow keys no-op.
