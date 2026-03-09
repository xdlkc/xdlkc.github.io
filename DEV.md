# DEV Notes

## Code block styling lessons

- Hexo highlight renders code as `figure.highlight > table > td > pre`, so styling both `figure` and `pre` creates a visible "double container".
- Use a single visible container:
  - Keep `figure.highlight` transparent (`background: transparent; border: 0; padding: 0;`).
  - Apply background/border only to the inner `pre`.
- If you want Markdown-like rendering, strip all decorations on `pre` and `figure` and keep only minimal typography (line-height/font-size).
- Line numbers/gutter live in `.gutter`. Hide it with `.article-content figure.highlight .gutter { display: none; }` when you want a clean code block.
- Copy button wiring:
  - `themes/evan/source/js/code-copy.js` injects `.code-copy-button` and toast.
  - Hiding `.code-copy-button` or `.code-copy-toast` in CSS disables the UX.
  - Keep copy enabled by showing those classes; hide only `.code-collapse-button` if collapse is not desired.

## Table width notes

- The previous table styling used `display: block` + `overflow-x: auto`, which makes tables feel like a separate container.
- For tables that should align with body width, keep:
  - `width: 100%`
  - remove `display: block` and `overflow-x: auto`.
- If horizontal overflow is needed later, prefer wrapping tables in a dedicated scroll container rather than changing table display.

