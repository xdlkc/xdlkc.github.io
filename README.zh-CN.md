# xdlkc.github.io

[English](./README.md) | 简体中文

Evan Zhang 的个人技术博客源码仓库，线上站点位于 **[https://xdlkc.github.io](https://xdlkc.github.io)**，基于 **Hexo 7.3** 与自定义 **`evan`** 主题构建。

---

## 主题与站点特性（`themes/evan`）

- **多套主题与调色板**（`theme-toggle.js`）：支持 `system`（跟随系统）、`light`（松石青 Emerald / 羊皮卷 Sepia / 极地蓝 Ocean）与 `dark`（极夜黑 Dark / 星云紫 Midnight），状态持久化在 `localStorage` 并在 `<head>` 中提前注入以减少首屏闪烁。
- **界面语言切换**（`lang-toggle.js`）：支持将导航栏、模块标题与页面提示在中文与英文之间切换，同时保留文章正文原始内容。
- **文章音频播放器与同步文稿抽屉**（`_partial/post-audio-player.ejs`、`post-audio-player.js`）：支持 `podcast`（AI 语音精讲）与 `full`（全文朗读）模式，提供播放/暂停、`-15s`/`+15s` 快退快进、倍速切换、滚动实时字幕条，以及可展开的同步字幕段落与核心要点速览抽屉。
- **吸顶活跃大纲与阅读辅助**（`post.ejs`、`toc-scrollspy.js`、`reading-progress.js`、`reading-time-countdown.js`）：桌面端 `280px` 吸顶侧边大纲（窗口宽度低于 `1100px` 时自动切换为移动端折叠 `<details>` 大纲），支持滚动高亮定位、顶部阅读进度条与剩余阅读时间倒计时。
- **工程化阅读体验**：Mermaid v11 图表主题联动与点击放大、代码块语言标签/一键复制/折叠/行号切换、全站本地搜索（`site-search.js`）、快捷键帮助弹窗（`shortcut-help.js`）、打印友好样式、带 `rss.xsl` 样式表的 RSS 2.0 订阅以及随深浅主题同步的 Utterances 评论区。
- **首页与新闻看板**（`index.ejs`、`news.ejs`）：展示近期开源项目、最新文章与结构化新闻摘要（`news.home_limit: 5`）。

---

## 快速开始

### 环境要求

- Node.js `20+` 与 `npm`
- Python `3.10+`（可选，用于 `tools/publish_article.py` 与 `tools/generate_audio.py`）

### 安装依赖、预览与构建

```bash
npm install

# 本地预览（默认 http://localhost:4000/）
npx hexo server        # 或：npm run server

# 生成静态站点至 public/
npx hexo generate      # 或：npm run build

# 清理 Hexo 缓存与构建产物
npx hexo clean         # 或：npm run clean
```

---

## 内容发布与自动化工作流

### 从 Obsidian 同步发布文章

使用发布脚本将 Obsidian Markdown 草稿及其中引用的本地图片同步到 `source/_posts/`：

```bash
./tools/publish_article.py "<你的 Markdown 路径>" --date 2026-03-01 --slug your-slug
```

示例：

```bash
./tools/publish_article.py "~/Library/Mobile Documents/iCloud~md~obsidian/Documents/lkc/Openclaws/openclaw-templates-comparison-tech-memo.md" \
  --date 2026-03-01 \
  --slug openclaw-agent-architecture-tech-memo
```

`tools/publish_article.py` 会自动完成：

1. 提取首行 `# 标题`（或通过 `--title` 覆盖）并剥离旧 front-matter。
2. 写入规范化 Hexo front-matter 至 `source/_posts/<slug>.md`，保留正文原始标题层级。
3. 复制 Markdown 中引用的本地相对路径图片到 `source/uploads/<slug>/`，并改写为 `/uploads/<slug>/<文件名>`。
4. 可选生成 MiniMax 音频导读（`--with-audio`、`--audio-mode podcast|full`、`--voice-id ...`）以及可选提交推送（`--commit`、`--push`）。

同步完成后执行 `npx hexo generate` 重新生成站点即可。

### 本地生成文章音频（`tools/generate_audio.py`）

通过环境变量或根目录 `.env` 中的 `MINIMAX_API_KEY`（或 `MINIMAX_TOKEN`，可选 `MINIMAX_API_HOST`），生成 `source/uploads/<slug>/` 下的 `audio.mp3`、`audio-script.txt` 与 `audio-meta.json` 并回写文章 front-matter：

```bash
npm run audio:generate -- source/_posts/your-slug.md
```

支持 `--mode podcast|full`、`--voice-id`、`--tts-model`、`--llm-model`、`--speed`、`--regenerate-script` 与 `--force`。

### 新闻摘要自动化

- `node tools/aihot-sync.js`（由 [.github/workflows/sync-aihot-news.yml](.github/workflows/sync-aihot-news.yml) 定时触发）：从 [source/_data/aihot-sources.json](source/_data/aihot-sources.json) 抓取 18 个精选 AI RSS/Atom 信源，结合 AIHOT 的分级入选门槛（`T1 >= 60`、`T2 >= 76`）与答案前置中文摘要提示词调用 OpenAI 兼容模型（默认使用 GLM 国内版 Token Plan：`https://open.bigmodel.cn/api/coding/paas/v4` 与 `glm-5.3-flash`，配置 `AIHOT_LLM_API_KEY` 或 `GLM_API_KEY`，可选 `AIHOT_LLM_BASE_URL` 与 `AIHOT_LLM_MODEL`），去重后写入 `source/_data/news.json`。支持 `--dry-run`、`--no-llm`、`--hours=72` 与 `--max-new=15`。
- `npm run news:digest`（`tools/generate-news-digest.js`）：基于 `source/_data/news.json` 生成每日新闻摘要文章。
- `tools/update-news-hourly.js`：抓取国内外公开资讯源并按 URL 与标题时间去重写入 `source/_data/news.json`。

---

## 测试

`tests/` 目录（共 `200` 个测试文件）覆盖文章布局、TOC 滚动定位、音频播放器控制、主题/语言切换、RSS 生成与交互行为，包含 Jest 用例与基于 Node 原生 `node:test` 的用例：

```bash
# 运行 package.json 配置的 Jest 测试套件
npm test

# 运行基于 Node 原生 node:test 的布局与 UI 回归测试
node --test tests/article-layout.test.js tests/ui/*.test.js
```

---

## 目录结构

- [\_config.yml](_config.yml)：Hexo 主配置文件（站点 URL、`evan` 主题、Utterances 评论、RSS）
- [DEV.md](DEV.md)：主题样式踩坑记录（代码块双容器问题与表格宽度规范）
- `source/_posts/`：已发布文章 Markdown 源码
- `source/uploads/`：文章图片与音频资源
- `source/_data/`：站点结构化数据（含 `news.json` 与 `aihot-sources.json`）
- `themes/evan/`：自定义 Hexo 主题（`layout/`、`source/css/`、`source/js/`、[themes/evan/\_config.yml](themes/evan/_config.yml)）
- `scripts/`：Hexo 辅助脚本、过滤器、RSS 增强、搜索索引与站点地图生成器
- `tools/`：发布、音频生成与新闻采集脚本（[publish\_article.py](tools/publish_article.py)、[generate\_audio.py](tools/generate_audio.py)、[auto\_generate\_audio.py](tools/auto_generate_audio.py)、[aihot-sync.js](tools/aihot-sync.js)、[generate-news-digest.js](tools/generate-news-digest.js)、[update-news-hourly.js](tools/update-news-hourly.js)）
- `tests/`：布局、UI、RSS 与交互回归测试集合
- `video/`：配套 Remotion 视频工程（[video/README.md](video/README.md)）
- [.github/workflows/deploy.yml](.github/workflows/deploy.yml) 与 [.github/workflows/sync-aihot-news.yml](.github/workflows/sync-aihot-news.yml)：GitHub Pages 自动构建部署与 AIHOT 定时精选新闻同步工作流

---

## 部署

推送到 `master` 或 `main` 分支（或手动触发 `workflow_dispatch`）后，[.github/workflows/deploy.yml](.github/workflows/deploy.yml) 会依次执行：

1. 若仓库 Actions Secrets 中配置了 `MINIMAX_API_KEY`，[tools/auto\_generate\_audio.py](tools/auto_generate_audio.py) 会自动检查本次新增或修改的 `source/_posts/` 文章（自动跳过 `test-*`、`news-midday-summary-*`、已有 `audio` 字段或设置 `skip_audio: true` 的文章），生成播客导读音频并自动提交回当前分支；也支持通过 `workflow_dispatch` 的 `post` 与 `force_audio` 参数手动指定单篇文章补生成或重生成。
2. 在 Node.js 20 环境安装依赖、执行 `npx hexo generate` 构建 `./public`，并自动发布至 GitHub Pages。
