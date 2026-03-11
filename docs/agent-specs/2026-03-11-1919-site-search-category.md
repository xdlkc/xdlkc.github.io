# Spec: 站内搜索支持「分类」检索 + 分类 chips（SDD）

## 背景 / 问题
当前站内搜索主要覆盖 **标题 + 标签**。但很多文章被清晰地按“分类（category/categories）”组织，用户记得分类名时需要绕到归档/分类页，搜索体验不完整。

## 目标
在现有站内搜索能力上新增对 **分类** 的检索与展示，让用户可以：
- 直接用关键词命中分类名（与标题/标签一起参与综合匹配）
- 使用 `cat:` / `category:` 前缀进行“仅分类”检索
- 在结果列表中看到分类 chips，并可点击 chips 直接触发分类搜索

## 非目标 / 边界
- 不引入第三方搜索库（保持轻量）
- 不要求对 Hexo warehouse 的 `db.json` 做关系解析（只在数据源本身含有 categories 字段时生效）
- 不改动生成 search index 的构建流程（若后续要补全 categories 输出，另起 feature）

## 需求（行为）
1. **数据模型**：SiteSearch 规范化 post 时支持 `categories` 字段（字符串数组；兼容 `category`/`categories` 为字符串或数组）。
2. **搜索综合模式（默认）**：当 query tokens 命中分类名时，搜索结果应被召回，并给予合理权重（低于标题、高于/接近标签均可，但必须可用且稳定）。
3. **分类专用模式**：
   - 支持 `cat:xxx`、`cats:xxx`、`category:xxx`、`categories:xxx`（大小写不敏感）
   - 该模式下只按分类匹配（不因标题/标签命中而召回）
4. **结果展示**：每条结果在 tags 下方/附近渲染分类 chips（当存在 categories 时）。
   - chip 具备 `data-site-search-keyword`
   - 并设置 `data-site-search-keyword-mode="category"`
5. **交互**：点击分类 chip 会把输入框设置为 `cat:<分类名>` 并触发搜索（与 tag chip 类似）。

## 验收标准
- `SiteSearch.searchPosts`：
  - query 为普通关键词时，可通过分类命中结果
  - query 为 `cat:` 前缀时，仅分类命中生效
- `SiteSearch.renderResults`：
  - 当 results 中 post 包含 categories 时，能渲染出 `.site-search-category`（或同等标识）
- `initSiteSearch`：点击分类 chip 会将输入框更新为 `cat:<name>` 且触发 `input` 事件

## 测试计划（TDD）
- 新增单测：
  1) `site-search-category-query.test.js`：覆盖 searchPosts 的默认模式 + cat 前缀模式
  2) `site-search-category-chips.test.js`：覆盖 renderResults 输出 + 点击 chip 行为
