# Spec: Site search supports Hexo db.json (models.Post)

## 背景/动机
当前站内搜索依赖 `/db.json`。在 Hexo 生态中，`db.json` 常见结构为 `{ meta, models: { Post: [...] } }`。如果解析逻辑只支持 `posts`/`data`/array，会导致线上搜索始终无结果（用户可感知）。

## 需求
- SiteSearch 能从 `db.json` 的 `models.Post` 中提取文章列表用于搜索。

## 验收标准
- 当 `fetch('/db.json')` 返回形如：`{ models: { Post: [{ title, path, tags }] } }` 时：
  - 输入关键词后能渲染结果列表（`.site-search-list`）
  - 结果标题中匹配关键词会用 `<mark>` 高亮

## 边界/不做
- 不在本次改动中改变搜索排序算法与 UI 样式。
- 不额外引入新依赖。
