# Spec: Code Block Language Label (代码块语言标识显示)

## Description
在代码块（`<figure class="highlight [lang]">`）的右上角显示该代码块的编程语言名称（如 `javascript`、`python`）。这有助于读者快速了解代码片段的语言，提升阅读体验。

## Requirements
1. **DOM Structure**: Find `.article-content figure.highlight`.
2. **Language Extraction**: 提取 `figure.highlight` 的第二个 class（即语言名称，例如 `javascript`, `bash`, `html` 等）。
3. **Element Creation**: 在 `figure` 内动态插入一个 `<span class="code-lang-label">` 元素显示语言名称。
4. **CSS Styling**:
   - `position: absolute` 定位于代码块右上角或左上角。
   - 样式需要与现有的 `code-copy-button` 和 `code-collapse-button` 兼容（通常是绝对定位）。考虑到 `code-copy-button` 在右上角，语言标识可以放在右上角的复制按钮左侧，或者放置在左上角。本需求决定放在左上角 (`top: 0`, `left: 0`) 或右上角的按钮旁。为了最简洁，放在左上角，或者内联在右上角。决定将其放在右上角，位置比复制按钮稍左。或者左上角。我们将采用左上角（`top: 0`, `left: 0.8rem`），小字号，淡色。
5. **No Interference**: 如果语言不存在，则不显示。

## Acceptance Criteria
- Given an article with `<figure class="highlight python">`, a label showing "python" (or capitalized "Python") is displayed.
- The label does not interfere with code copying or collapsing.
