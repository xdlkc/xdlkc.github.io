# xdlkc.github.io

English | [简体中文](./README.zh-CN.md)

Source repository for Evan Zhang's technical blog, live at **[https://xdlkc.github.io](https://xdlkc.github.io)**, built with **Hexo 7.3** and the custom **`evan`** theme.

---

## Theme & Site Features (`themes/evan`)

- **Theme & Multi-Palette System** (`theme-toggle.js`): Supports `system`, `light` (`Emerald`, `Sepia`, `Ocean`), and `dark` (`Dark`, `Midnight`) presets persisted in `localStorage` and pre-applied in `<head>` to minimize flash of unstyled content.
- **UI Language Toggle** (`lang-toggle.js`): Switches site navigation, section headers, and UI metadata between English and Simplified Chinese while preserving each article's original prose.
- **Post Audio Player & Companion Drawer** (`_partial/post-audio-player.ejs`, `post-audio-player.js`): Supports `podcast` (AI audio guide) and `full` (full-text read-aloud) modes with play/pause, `-15s`/`+15s` seek, playback speed control, live caption marquee, and an expandable drawer for synced transcript paragraphs and key highlights.
- **Sticky Active Outline & Reading Aids** (`post.ejs`, `toc-scrollspy.js`, `reading-progress.js`, `reading-time-countdown.js`): Sticky `280px` desktop outline sidebar (collapsing into a mobile `<details>` outline below `1100px` width) with active-heading scrollspy, reading progress bar, and remaining-time countdown.
- **Developer Reading UX**: Mermaid v11 diagram rendering synced with light/dark theme plus click-to-zoom, code block language labels, copy buttons, collapse toggles, line-number toggles, client-side search (`site-search.js`), keyboard shortcut cheatsheet (`shortcut-help.js`), print styles, RSS 2.0 feed with custom XSL styling (`rss.xsl`), and theme-synced Utterances comments.
- **Homepage & News Board** (`index.ejs`, `news.ejs`): Highlights featured engineering repositories, latest articles, and curated news digest entries (`news.home_limit: 5`).

---

## Quick Start

### Prerequisites

- Node.js `20+` and `npm`
- Python `3.10+` (optional, for `tools/publish_article.py` and `tools/generate_audio.py`)

### Install, Preview & Build

```bash
npm install

# Local preview server at http://localhost:4000/
npx hexo server        # or: npm run server

# Generate static site output into public/
npx hexo generate      # or: npm run build

# Clean Hexo cache and generated files
npx hexo clean         # or: npm run clean
```

---

## Publishing & Content Workflows

### Obsidian-to-Hexo Article Publishing

Sync a Markdown draft (and its relative local images) into `source/_posts/`:

```bash
./tools/publish_article.py "<path-to-markdown>" --date 2026-03-01 --slug your-slug
```

For example:

```bash
./tools/publish_article.py "~/Library/Mobile Documents/iCloud~md~obsidian/Documents/lkc/Openclaws/openclaw-templates-comparison-tech-memo.md" \
  --date 2026-03-01 \
  --slug openclaw-agent-architecture-tech-memo
```

`tools/publish_article.py` handles:

1. Extracting the top-level `# Title` (or `--title` override) and stripping existing front-matter.
2. Writing `source/_posts/<slug>.md` with normalized Hexo front-matter while preserving heading structure.
3. Copying relative local images into `source/uploads/<slug>/` and rewriting Markdown image paths to `/uploads/<slug>/<filename>`.
4. Optionally generating MiniMax audio narration (`--with-audio`, `--audio-mode podcast|full`, `--voice-id ...`) and optionally committing/pushing (`--commit`, `--push`).

After syncing, regenerate the static site with `npx hexo generate`.

### Audio Narration Generation (`tools/generate_audio.py`)

Generate `audio.mp3`, `audio-script.txt`, and `audio-meta.json` under `source/uploads/<slug>/` using MiniMax APIs (`MINIMAX_API_KEY` or `MINIMAX_TOKEN` in environment or `.env`):

```bash
npm run audio:generate -- source/_posts/your-slug.md
```

Supports `--mode podcast|full`, `--voice-id`, `--tts-model`, `--llm-model`, `--speed`, `--regenerate-script`, and `--force`.

### News Digest Automation

- `node tools/aihot-sync.js` (scheduled via [.github/workflows/sync-aihot-news.yml](.github/workflows/sync-aihot-news.yml), Node.js `24+`): Reuses vendored DB-free AIHOT modules in [vendor/aihot/](vendor/aihot/) (`content/sanitize.ts`, `lib/page-content.ts`, `industry/selection.ts`, `industry/prompts/`) with `@mozilla/readability` + `linkedom` + `cheerio` + `sanitize-html` to fetch multi-kind sources (`rss`/`atom`/`json`/`web`) across configurable industries (`AI`, `工程与开源`, `金融与政策`), extract full webpage article bodies, apply tiered selection thresholds (`T1 >= 60`, `T2 >= 76`), cluster hot events (`source/_data/news-hot.json`), generate answer-first Chinese summaries and optional full-body Chinese translations via an OpenAI-compatible LLM (default: GLM domestic token plan `https://open.bigmodel.cn/api/coding/paas/v4` with `glm-5.3-flash`; configure `AIHOT_LLM_API_KEY` or `GLM_API_KEY`, optional `AIHOT_LLM_BASE_URL` and `AIHOT_LLM_MODEL`), and merge into `source/_data/news.json`. Supports `--dry-run`, `--no-llm`, `--backfill-content`, `--rebuild-hot`, `--industry=...`, `--kind=...`, `--hours=72`, and `--max-new=15`.
- `node tools/add-benchmark.js --id=<slug> --name="<Title>" --category="<Category>" --unit="%"`: Scaffolds a declarative benchmark JSON file under `source/_data/benchmarks/` that [scripts/models.js](scripts/models.js) automatically discovers and aggregates into `/models/` (5-domain difficulty-calibrated leaderboard, Pricing & Context view, Pareto Value Frontier chart, `¥ / $` currency toggle, and static `/models/<slug>/` detail pages linked to `/news/`).
- `node tools/sync-benchmarks.js` (scheduled daily via [.github/workflows/sync-benchmarks.yml](.github/workflows/sync-benchmarks.yml)): Syncs live public feeds (`SWE-bench Verified`, `LiveCodeBench`) and OpenRouter live API pricing & context windows into `source/_data/models-catalog.json`. Supports `--dry-run` and `--bench=swe-bench-verified,livecodebench,openrouter-catalog`.
- `npm run news:digest` (`tools/generate-news-digest.js`): Generates daily digest posts from `source/_data/news.json`.
- `tools/update-news-hourly.js`: Fetches domestic and international feeds into `source/_data/news.json` with URL/title deduplication.

---

## Testing

The `tests/` directory (`200` test files) covers layout invariants, TOC scrollspy, audio player controls, theme/language toggles, RSS generation, and UI interactions using both Jest and Node's built-in `node:test` runner:

```bash
# Run Jest suite (configured in package.json)
npm test

# Run Node built-in test runner suites (e.g. layout and UI checks)
node --test tests/article-layout.test.js tests/ui/*.test.js
```

---

## Directory Layout

- [\_config.yml](_config.yml): Primary Hexo site configuration (`url`, `theme: evan`, Utterances comments, RSS feed)
- [DEV.md](DEV.md): Theme CSS notes (code block container styling and responsive table rules)
- `source/_posts/`: Published Markdown posts
- `source/uploads/`: Post image and audio assets
- `source/_data/`: Structured site data (including `news.json` and `aihot-sources.json`)
- `themes/evan/`: Custom Hexo theme (`layout/`, `source/css/`, `source/js/`, [themes/evan/\_config.yml](themes/evan/_config.yml))
- `scripts/`: Hexo build helpers, filters, RSS enhancers, search index, and sitemap generators
- `tools/`: Publishing, audio narration, and news automation scripts ([publish\_article.py](tools/publish_article.py), [generate\_audio.py](tools/generate_audio.py), [auto\_generate\_audio.py](tools/auto_generate_audio.py), [aihot-sync.js](tools/aihot-sync.js), [generate-news-digest.js](tools/generate-news-digest.js), [update-news-hourly.js](tools/update-news-hourly.js))
- `tests/`: Automated layout, UI, RSS, and regression test suites
- `video/`: Companion Remotion project ([video/README.md](video/README.md))
- [.github/workflows/deploy.yml](.github/workflows/deploy.yml) & [.github/workflows/sync-aihot-news.yml](.github/workflows/sync-aihot-news.yml): GitHub Pages build/deploy and scheduled AIHOT news curation workflows

---

## Deployment

Pushing to `master` or `main` (or triggering `workflow_dispatch`) runs [.github/workflows/deploy.yml](.github/workflows/deploy.yml):

1. When `MINIMAX_API_KEY` is configured in GitHub Actions Secrets, [tools/auto\_generate\_audio.py](tools/auto_generate_audio.py) inspects newly added or modified posts under `source/_posts/` (skipping `test-*`, `news-midday-summary-*`, posts that already define `audio`, or posts with `skip_audio: true`), generates podcast narration assets, and commits them back to the branch. You can also target a single post manually via `workflow_dispatch` inputs (`post` and `force_audio`).
2. Installs npm dependencies on Node.js 20, builds `./public` via `npx hexo generate`, and deploys directly to GitHub Pages.
