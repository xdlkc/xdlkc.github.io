# Spec: Article Like Button (Local, per-post)

Date: 2026-03-11 09:19 (Asia/Shanghai)
Slug: article-like-button

## Why (User value)
读者可以“点个赞”来标记喜欢的文章，并立即看到反馈（按钮状态 + 计数）。不依赖后端，适合静态站点。

## Scope
- Post 页面（`themes/evan/layout/post.ejs`）新增一个“Like/赞”按钮。
- 点赞状态与计数使用 `localStorage` 按文章路径持久化。
- 支持再次点击取消点赞（toggle）。
- UI 文案按当前语言模式（`html[data-lang-mode]`）显示中/英。

## Non-goals / Boundaries
- 不做跨设备同步、不做服务器端统计。
- 不做登录/账号体系。
- 不引入第三方点赞服务。

## Data model
- Storage key: `xdlkc:post-likes:v1`
- Value: JSON object `{ [pathname: string]: { liked: boolean, count: number } }`
- 默认：未记录则 `liked=false, count=0`。

## Acceptance criteria
1. Post 模板包含一个按钮：`button[data-post-like]`，并加载脚本 `/js/post-like.js`，且调用 `window.PostLike?.initPostLike()`。
2. 初始渲染：
   - 未点赞时按钮可见，`aria-pressed="false"`，显示 `👍 赞 (0)`（中文）或 `👍 Like (0)`（英文）。
3. 点击按钮：
   - 会在 `localStorage` 写入该 `location.pathname` 的记录。
   - 按钮变为 `aria-pressed="true"`，文本变为 `👍 已赞 (1)`（中文）或 `👍 Liked (1)`（英文）。
4. 再次点击（取消赞）：
   - `aria-pressed` 回到 `false`，文本回到未点赞状态，计数减 1（下限 0）。
5. 重新初始化（刷新页面等）能从 `localStorage` 恢复状态与计数。

## Test plan (TDD)
- 新增 `tests/post-like-button.test.js`：
  - 断言 post 模板包含按钮 + 脚本 + init 调用。
  - JSDOM 下模拟点击，验证 localStorage 写入、`aria-pressed` 与文本变化、以及二次 init 复原。
