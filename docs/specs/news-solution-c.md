# Spec: 博客新闻展示方案 C（实时聚合 + 每日沉淀）

> 目标：在 Hexo 站点内实现“新闻聚合展示 + 每日新闻日报沉淀（SEO/RSS 友好）”，不依赖外网 API，仅从本地数据文件读取。

## 1. 术语

- **News Item**：一条新闻数据。
- **news.json**：新闻数据文件（站点可读）。
- **News Page**：`/news/` 页面，按时间倒序展示新闻。
- **News Digest Post**：每日生成 1 篇新闻日报文章（Markdown），用于 SEO/RSS。

## 2. 数据结构

### 2.1 位置

- `source/_data/news.json`
  - Hexo 会将其加载到 `site.data.news`。

### 2.2 Schema（JSON Array）

每条记录字段：

- `id` (string, required)
- `title` (string, required)
- `summary` (string, optional)
- `url` (string, required)
- `source` (string, optional)
- `publishedAt` (string, required) — ISO8601（推荐带时区），如 `2026-03-06T09:30:00+08:00`
- `importance` (number, optional) — 1~5
- `region` (string[] | string, optional) — tags/region

约束：
- `publishedAt` 必须可被 `new Date(publishedAt)` 正确解析。

## 3. 页面展示

### 3.1 /news/ 页面

- 路径：`/news/`
- 数据来源：`site.data.news`
- 排序：按 `publishedAt` 倒序（最新在前）
- 展示字段：
  - 标题（链接到 `url`）
  - `publishedAt`（展示日期/时间）
  - `source`（可选）
  - `summary`（可选）
  - tags/region（可选）

### 3.2 首页“最新新闻”模块

- 在首页新增模块“最新新闻”
- 默认显示最近 5 条
- 可配置：在站点 `_config.yml` 中新增：

```yml
news:
  home_limit: 5
```

- 若未配置或配置非法（<=0/非数字），回退到 5。

## 4. 每日沉淀：新闻日报生成脚本

### 4.1 命令

- 新增 npm script：`news:digest`
- 行为：读取 `source/_data/news.json`，生成当日日报 markdown：

`source/_posts/news-digest-YYYY-MM-DD.md`

### 4.2 生成规则

- Front-matter：
  - `title`: `News Digest YYYY-MM-DD`
  - `date`: 当日 00:00:00 +08:00（或脚本执行时刻）
  - `tags`: `news-digest`
- 正文：包含当日新闻列表（按 `publishedAt` 倒序）
- 幂等：
  - 若当日文件不存在：创建并写入当日新闻（或写入“无更新”）
  - 若当日文件已存在：
    - 若已有同一 `id` 或 `url` 的新闻条目，则不重复写入
    - 若存在新增条目，则在文件末尾追加一个“更新分节”（带时间戳）并写入新增条目
    - 若无新增条目：退出并提示（不修改文件）

### 4.3 输入/输出不依赖外网

- 所有数据来自本地 `news.json`
- 不访问任何 HTTP API

## 5. 可测试模块（用于 TDD）

抽取纯函数以便测试：

- `loadAndSortNews(newsJsonPath)`：读取并校验 news.json，返回按时间倒序数组。
- `pickLatestNews(newsItems, limit)`：返回首页展示的前 N 条。
- `generateNewsDigest({ newsJsonPath, postsDir, date, now })`：生成/追加日报并返回结果（created/appended/skipped + filepath）。

## 6. 验收标准

- `/news/` 页面可正常渲染（无数据时也能正常显示空态）
- 首页可展示最新 N 条（可配置）
- 运行 `npm run news:digest`：
  - 生成正确文件名
  - 文件包含关键字段（title、date、至少一条新闻的 title/url/source/publishedAt/summary）
  - 重复运行不会重复写入相同条目（幂等）

## 7. 非目标

- 不做 RSS 聚合抓取
- 不做外部 API 拉取/定时任务
- 不做 UI 大改，尽量兼容当前主题
