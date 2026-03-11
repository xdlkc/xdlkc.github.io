# Spec: TOC deep-link hash scroll uses header offset

- Date: 2026-03-12 07:07 (Asia/Shanghai)
- Slug: toc-hash-offset-scroll

## User story
作为读者，当我通过“带 #锚点”的链接打开文章（例如从聊天/搜索结果/目录复制链接），页面应当滚动到对应标题，并且标题不要被顶部固定导航遮挡。

## Problem
当前 TOC 点击已做了 header offset 的 smooth scroll，但当用户“直接打开带 hash 的 URL”或在页面内触发 `hashchange`（例如浏览器前进/后退、正文里普通锚点链接）时，浏览器默认锚点定位会把标题顶到视口顶部，容易被 `.article-nav` 遮住，影响可读性。

## Requirements
1. 当页面加载时，如果 `location.hash` 指向文章内容区内存在的 heading id，则自动以 header offset 重新滚动到该 heading。
2. 当发生 `hashchange` 时，如果新 hash 指向存在的 heading id，同样使用 header offset 重新滚动。
3. 不影响已有 TOC 点击的滚动行为（仍然 smooth + pushState）。
4. 失败/边界：
   - hash 为空或目标元素不存在：不做任何事。
   - 不应抛异常（兼容 JSDOM / 不支持 scrollTo options 的环境）。

## Acceptance criteria
- 在单元测试中：
  - 初始化 `initTocScrollSpy()` 时，如果 URL 带 `#section-a`，会调用 `window.scrollTo({top: computed, ...})`，其中 `computed = targetTop - headerHeight - 12` 并 clamp >= 0。
  - 触发 `hashchange` 事件后同样会调用 `scrollTo`。
- `npm test` 全绿。

## Non-goals
- 不重写浏览器默认的所有锚点行为（例如滚动动画、焦点管理、滚动恢复策略）。
- 不引入新的 UI 元素或样式调整。
