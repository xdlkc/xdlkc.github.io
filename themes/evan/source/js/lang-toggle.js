/* UI language toggle (en/zh) with persistence.
 *
 * This toggles site chrome copy only, not post body content.
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LangToggle = factory();
    root.LangToggle?.initLangToggle?.();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  const STORAGE_KEY = 'xdlkc:lang';

  const DICT = {
    'nav.archives': { en: 'Archives', zh: '文章' },
    'nav.news': { en: 'News', zh: '新闻' },
    'nav.models': { en: 'Models', zh: '模型榜' },
    'nav.about': { en: 'About', zh: '关于' },
    'nav.search': { en: 'Search', zh: '搜索' },
    'nav.font': { en: 'Font', zh: '字号' },
    'nav.theme': { en: 'Theme', zh: '主题' },
    'nav.lang': { en: '中文', zh: 'English' },
    'skip.main': { en: 'Skip to content', zh: '跳转到正文' },
    'index.hero.tag': { en: 'HELLO', zh: '你好' },
    'index.hero.titleLine1': { en: "Hi, I'm Evan Zhang.", zh: '你好，我是 Evan Zhang。' },
    'index.hero.titleLine2': { en: 'AI Infra & Agent Engineer.', zh: 'AI Infra 与 Agent 工程师。' },
    'index.hero.subtitle': {
      en: 'Working on AI Agent infrastructure and crafting local-first developer tools.',
      zh: '专注 AI Agent 基础设施研发，业余打磨本地优先的开发工具与原生应用。'
    },
    'index.profile.eyebrow': { en: 'PROFILE', zh: '个人名片' },
    'index.profile.focusLabel': { en: 'Focus', zh: '方向' },
    'index.profile.focusValue': { en: 'AI Infra · Agent', zh: 'AI 基础设施 · Agent' },
    'index.profile.stackLabel': { en: 'Stack', zh: '技术栈' },
    'index.profile.stackValue': { en: 'Rust · Python · Go · TS · Swift', zh: '全栈 · Rust · Python · Go · Swift' },
    'index.profile.baseLabel': { en: 'Base', zh: '坐标' },
    'index.profile.baseValue': { en: 'Beijing', zh: '北京' },
    'index.profile.latestLabel': { en: 'Latest', zh: '最新文章' },
    'index.project.nexus': {
      en: 'Event-driven, dual-engine Super-Agent control plane and polymorphic worker runtime built in Rust and TypeScript.',
      zh: '基于 Rust 与 TypeScript 的事件驱动双引擎 Super-Agent 控制面与多态 Worker 运行时。'
    },
    'index.project.loom': {
      en: 'Local-only unified Rust model gateway (OpenAI & Anthropic APIs) with a loopback observability console.',
      zh: '纯本地运行的 Rust 统一模型网关（兼容 OpenAI / Anthropic API）与可观测控制台。'
    },
    'index.project.verba': {
      en: 'Local-first macOS live bilingual subtitles and structured meeting notes with pinyin search and Obsidian sync.',
      zh: '本地优先的 macOS 实时双语字幕与结构化会议笔记工具，支持拼音检索与 Obsidian 同步。'
    },
    'index.project.scribeleaf': {
      en: 'Native macOS Markdown editor built with AppKit, WKWebView & CodeMirror 6 for live preview and multi-format export.',
      zh: '基于 AppKit、WKWebView 与 CodeMirror 6 打造的原生 macOS Markdown 编辑器，支持实时预览与多格式导出。'
    },
    'index.project.lstack': {
      en: 'Personal Agent Skills stack for engineering and productivity across Antigravity, Claude Code, Codex, Gemini CLI, and Cursor.',
      zh: '面向工程与效率场景的个人 Agent Skills 套件，适配 Antigravity、Claude Code、Codex、Gemini CLI 与 Cursor。'
    },
    'index.project.agentForge': {
      en: 'Agent Skills package implementing Spec-Driven Development (SDD) with a six-phase workflow, EARS templates, and validation scripts.',
      zh: '实现规格驱动开发（SDD）的 Agent Skills 工具包，提供六阶段工作流、EARS 模板与校验脚本。'
    },
    'index.project.shuttle': {
      en: 'Local-first Rust daemon dispatching GitHub Issues and PRs to coding agents through a recoverable queue and draft PRs.',
      zh: '本机优先的 Rust 后台服务，通过可恢复队列将 GitHub Issue / PR 派发给本地编程 Agent 并发布草稿 PR。'
    },
    'index.project.harnessSwarm': {
      en: 'CLI and Codex plugin dispatching 9 coding harnesses into isolated Git worktrees with unified session history and rules/skills sync.',
      zh: 'CLI 与 Codex 插件，将 9 款编程 Harness 调度至独立 Git worktree，支持统一会话检索与全局规则/Skill 同步。'
    },
    'index.project.sillage': {
      en: 'Zero-dependency Python CLI for text-only model fingerprinting and SHA-256 committed blind model-family identification across LLM gateways.',
      zh: '零第三方依赖的 Python CLI，面向统一大模型网关提供纯文本输出指纹与带 SHA-256 承诺的模型家族盲测识别。'
    },
    'index.project.stillpin': {
      en: 'Native local macOS region capture, irreversible flattened annotation, and floating image pins built with Swift, AppKit, and ScreenCaptureKit.',
      zh: '基于 Swift、AppKit 与 ScreenCaptureKit 的本地优先原生 macOS 区域截图、不可逆打码标注与悬浮贴图工具。'
    },
    'index.aboutCard.role': { en: 'AI Infra & Agent Engineer', zh: 'AI Infra 与 Agent 工程师' },
    'index.aboutCard.bio': {
      en: 'Software engineer based in Beijing working on AI infrastructure and Agent platforms. Outside work, I enjoy exploring AI-native workflows and building local-first developer tools and native macOS apps.',
      zh: '现居北京，从事 AI 基础设施与 Agent 平台研发。业余喜欢探索 AI-Native 研发工作流，在 GitHub 持续打磨本地优先的效率工具与原生 macOS 小应用。'
    },
    'index.contactCard.title': { en: 'Find Me', zh: '找到我' },
    'index.contactCard.emailLabel': { en: 'Email', zh: '邮箱' },
    'index.news.latest': { en: 'Latest News', zh: '最新新闻' },
    'index.news.all': { en: 'View all news →', zh: '查看全部新闻 →' },
    'index.projects': { en: 'Projects', zh: '项目' },
    'index.projects.all': { en: 'View all repos →', zh: '查看全部项目 →' },
    'index.latestWriting': { en: 'Latest Writing', zh: '最新文章' },
    'index.writing.all': { en: 'View all articles →', zh: '查看全部文章 →' },
    'index.currentFocus': { en: 'Current Focus', zh: '当前关注' },
    'index.about': { en: 'About', zh: '关于' },
    'index.contact': { en: 'Contact', zh: '联系' },
    'index.viewRepo': { en: 'View Repository', zh: '查看仓库' },
    'index.readArticle': { en: 'Read Article', zh: '阅读文章' },
    'footer.copyright': { en: 'All rights reserved.', zh: '保留所有权利。' },
    'archive.totalPrefix': { en: 'Total', zh: '目前共计' },
    'archive.totalSuffix': { en: 'posts.', zh: '篇文章。' },
    'post.published': { en: 'Published', zh: '发布于' },
    'post.reading': { en: 'Reading', zh: '阅读约' },
    'post.min': { en: 'min', zh: '分钟' },
    'post.minRead': { en: 'min read', zh: '分钟阅读' },
    'post.words': { en: 'Words', zh: '字数' },
    'post.updated': { en: 'Updated', zh: '更新于' },
    'post.audio.podcast': { en: 'AI 语音精讲', zh: 'AI 语音精讲' },
    'post.audio.full': { en: '全文朗读', zh: '全文朗读' },
    'post.audio.captionHint': { en: '点击播放 · 支持字幕同步与段落点按跳转', zh: '点击播放 · 支持字幕同步与段落点按跳转' },
    'post.audio.scriptBtn': { en: '文稿', zh: '文稿' },
    'post.audio.tabTranscript': { en: '实时字幕文稿', zh: '实时字幕文稿' },
    'post.audio.tabSummary': { en: '核心要点速览', zh: '核心要点速览' },
    'post.audio.clickSeekHint': { en: '点击任意字幕段落可直接跳转播放', zh: '点击任意字幕段落可直接跳转播放' },
    'post.copyLink': { en: 'Copy Link', zh: '复制链接' },
    'post.toc': { en: 'Outline', zh: '查看大纲' },
    'post.outline': { en: 'Outline', zh: '大纲' },
    'post.comments': { en: 'Comments', zh: '评论' },
    'post.commentsNoscript': { en: 'Enable JavaScript to view comments.', zh: '请启用 JavaScript 后查看评论。' },
    'post.previous': { en: '← Previous', zh: '← 上一篇' },
    'post.next': { en: 'Next →', zh: '下一篇 →' },
    'post.related': { en: 'Related Posts', zh: '相关阅读' },
    'post.relatedReason.tags': { en: 'Shared tags', zh: '共享标签' },
    'post.relatedReason.keywords': { en: 'Shared keywords', zh: '共享关键词' },
    'post.relatedReason.recent': { en: 'Recent', zh: '最新文章' },
    'news.flash': { en: 'Flash', zh: '快讯' },
    'news.board': { en: 'News Board', zh: '新闻看板' },
    'news.empty': { en: 'No news data yet. Add items to source/_data/news.json.', zh: '暂无新闻数据。请在 source/_data/news.json 中添加条目。' },
    'news.context': { en: 'Context:', zh: '背景：' },
    'models.tag': { en: 'BENCHMARKS', zh: '模型评测' },
    'models.title': { en: 'Models Leaderboard', zh: 'AI 模型评测榜' },
    'models.subtitle': {
      en: 'Cross-benchmark calibrated leaderboard with 5-domain weighting, live API pricing, and Pareto cost-performance frontier.',
      zh: '跨榜难度校准的 AI 模型综合榜单，支持五大领域加权、实时 API 价格与上下文对比及帕累托性价比斩杀线。'
    },
    'models.stats.benchmarks': { en: 'Benchmarks', zh: '项评测' },
    'models.stats.models': { en: 'Models', zh: '个模型' },
    'models.stats.ranked': { en: 'Ranked', zh: '个入榜模型' },
    'models.stats.updated': { en: 'Updated', zh: '更新于' },
    'models.view.leaderboard': { en: 'Leaderboard', zh: '榜单' },
    'models.view.pricing': { en: 'Pricing & Context', zh: '价格' },
    'models.view.frontier': { en: 'Value Frontier', zh: '斩杀线' },
    'models.currency.label': { en: 'Currency', zh: '计价' },
    'models.tab.overview': { en: 'Composite', zh: '综合' },
    'models.benchmarks.single': { en: 'Single Benchmark:', zh: '单项评测：' },
    'models.overview.desc': {
      en: 'Difficulty-calibrated composite index (mean 50, SD 15) weighted across Coding (38%), Reasoning (19%), Professional (19%), Knowledge (14%), and Arena (10%).',
      zh: '跨榜难度校准综合评分（均分 50 / 标准差 15），按编程 38%、科研 19%、专业办公 19%、知识问答 14%、真人盲选 10% 加权汇总。'
    },
    'models.pricing.desc': {
      en: 'API pricing & context window comparison. 7:2:1 blended cost reflects typical agent workloads (70% cached input, 20% uncached input, 10% output).',
      zh: 'API 定价与上下文窗口对比。7:2:1 综合价按 70% 缓存输入 + 20% 常规输入 + 10% 输出估算典型 Agent 场景成本。'
    },
    'models.frontier.title': { en: 'Pareto Cost-Performance Frontier', zh: '性价比斩杀线（帕累托前沿）' },
    'models.frontier.desc': {
      en: 'Log-scale blended API cost vs. calibrated composite score. All ranked models are colored by provider; the dotted line connects the Pareto-optimal frontier.',
      zh: '横轴为对数坐标综合用量价格，纵轴为校准综合评分。全部入榜模型按厂商配色标注，虚线串联帕累托最优斩杀线，点击上方厂商图例可单独高亮。'
    },
    'models.frontier.presetAgent': { en: '7:2:1 Agent', zh: '7:2:1 Agent' },
    'models.frontier.presetChat': { en: '3:1 Chat', zh: '3:1 对话' },
    'models.frontier.presetLong': { en: '100:1:1 Long', zh: '100:1:1 长上下文' },
    'models.frontier.metaDesc': {
      en: 'Pareto value frontier plotting log-scale 7:2:1 blended cost against calibrated composite score.',
      zh: '按对数坐标 7:2:1 综合价与综合评分绘制性价比帕累托前沿，点击节点可查看模型详情。'
    },
    'models.frontier.stepsTitle': { en: 'Optimal Frontier Progression', zh: '斩杀线阶梯路径' },
    'models.calibrationNote': {
      en: 'Note: Score differences under 3 points are within cross-benchmark variance. Models with insufficient benchmark coverage are listed below under Unranked.',
      zh: '提示：综合分差不到 3 分时属于跨榜正常波动范围；评测覆盖不足的模型自动归入下方「暂不排名」。'
    },
    'models.unranked.title': { en: 'Unranked Models (Insufficient Coverage)', zh: '暂不排名（评测覆盖不足）' },
    'models.unranked.reason': { en: 'Reason', zh: '未入榜原因' },
    'models.filter.all': { en: 'All', zh: '全部' },
    'models.filter.open': { en: 'Open Weights', zh: '开源模型' },
    'models.filter.closed': { en: 'Closed API', zh: '闭源 API' },
    'models.filter.domestic': { en: 'Domestic (CN)', zh: '国产模型' },
    'models.filter.reasoning': { en: 'Reasoning', zh: '推理模型' },
    'models.filter.providerAll': { en: 'All Providers', zh: '全部厂商' },
    'models.filter.searchPlaceholder': { en: 'Search model or provider…', zh: '搜索模型或厂商…' },
    'models.filter.reset': { en: 'Reset filters', zh: '重置筛选' },
    'models.col.rank': { en: '#', zh: '名次' },
    'models.col.model': { en: 'Model', zh: '模型' },
    'models.col.provider': { en: 'Provider', zh: '厂商' },
    'models.col.composite': { en: 'Score', zh: '综合评分' },
    'models.col.score': { en: 'Score', zh: '得分' },
    'models.col.release': { en: 'Release', zh: '上线日期' },
    'models.col.coverage': { en: 'Coverage', zh: '评测覆盖' },
    'models.col.cachePrice': { en: 'Cache', zh: '缓存价格' },
    'models.col.inputPrice': { en: 'Input', zh: '输入价格' },
    'models.col.outputPrice': { en: 'Output', zh: '输出价格' },
    'models.col.blended': { en: '7:2:1 Blended', zh: '7:2:1 综合价' },
    'models.col.context': { en: 'Context', zh: '上下文' },
    'models.badge.open': { en: 'Open', zh: '开源权重' },
    'models.badge.closed': { en: 'API', zh: '闭源' },
    'models.badge.domestic': { en: 'CN', zh: '国产' },
    'models.badge.reasoning': { en: 'Reasoning', zh: '推理' },
    'models.meta.source': { en: 'Source', zh: '数据来源' },
    'models.meta.updated': { en: 'Updated', zh: '更新日期' },
    'models.meta.higherBetter': { en: 'Higher is better', zh: '越高越好' },
    'models.meta.lowerBetter': { en: 'Lower is better', zh: '越低越好' },
    'models.empty': { en: 'No models match the current filters.', zh: '当前筛选条件下暂无匹配的模型。' },
    'models.noData': {
      en: 'No benchmarks found. Drop a JSON file into source/_data/benchmarks/ to get started.',
      zh: '暂无评测数据。请将 JSON 文件放入 source/_data/benchmarks/ 目录。'
    },
    'models.guide.summary': {
      en: 'How to add a new benchmark (1 file / 1 command)',
      zh: '如何新增一个评测榜（1 个文件 / 1 条命令）'
    },
    'models.guide.lead': {
      en: 'This leaderboard automatically discovers every *.json file under source/_data/benchmarks/ at build time and syncs live API pricing from OpenRouter.',
      zh: '本看板在构建时自动扫描 source/_data/benchmarks/ 目录下的全部 *.json 文件，并自动同步 OpenRouter 实时 API 价格。'
    },
    'models.detail.back': { en: 'Back to Leaderboard', zh: '返回模型榜' },
    'models.detail.rank': { en: 'Overall Rank', zh: '综合排名' },
    'models.detail.pricingTitle': { en: 'API Pricing Breakdown', zh: 'API 定价明细' },
    'models.detail.domainsTitle': { en: 'Domain Performance', zh: '五大领域表现' },
    'models.detail.benchmarksTitle': { en: 'Evaluated Benchmarks', zh: '逐项评测明细' },
    'models.detail.colBench': { en: 'Benchmark', zh: '评测项' },
    'models.detail.colDomain': { en: 'Category', zh: '领域' },
    'models.detail.colRaw': { en: 'Raw Score', zh: '原始分' },
    'models.detail.colCalibrated': { en: 'Calibrated', zh: '校准分' },
    'models.detail.colSource': { en: 'Source', zh: '来源' },
    'models.detail.newsTitle': { en: 'Related News', zh: '相关动态' }
  };

  function normalizeMode(value) {
    return value === 'zh' || value === 'en' ? value : null;
  }

  function getMode(document = globalThis.document, storage = globalThis.localStorage) {
    const docMode = normalizeMode(document?.documentElement?.dataset?.langMode);
    if (docMode) return docMode;
    try {
      const saved = normalizeMode(storage?.getItem?.(STORAGE_KEY));
      if (saved) return saved;
    } catch {
      // ignore
    }
    return 'en';
  }

  function t(key, mode = 'en') {
    const row = DICT[key];
    if (!row) return key;
    return mode === 'zh' ? row.zh : row.en;
  }

  function applyCopy(document, mode) {
    if (!document?.querySelectorAll) return;

    document.querySelectorAll('[data-i18n-key]').forEach((el) => {
      const key = el.getAttribute('data-i18n-key');
      if (!key) return;
      const value = t(key, mode);
      el.textContent = value;
    });

    document.querySelectorAll('[data-i18n-aria-label-key]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria-label-key');
      if (!key) return;
      el.setAttribute('aria-label', t(key, mode));
    });

    document.querySelectorAll('[data-i18n-placeholder-key]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder-key');
      if (!key) return;
      el.setAttribute('placeholder', t(key, mode));
    });
  }

  function applyLanguageToDocument({ document = globalThis.document, storage = globalThis.localStorage, mode }) {
    if (!document?.documentElement) return;
    const m = normalizeMode(mode) || 'en';
    document.documentElement.dataset.langMode = m;
    document.documentElement.lang = m === 'zh' ? 'zh-CN' : 'en';
    applyCopy(document, m);

    try {
      storage?.setItem?.(STORAGE_KEY, m);
    } catch {
      // ignore
    }

    const toggle = document.querySelector('[data-lang-toggle]');
    if (toggle) {
      toggle.textContent = t('nav.lang', m);
      toggle.setAttribute('aria-label', m === 'zh' ? 'Switch to English' : '切换为中文');
      toggle.setAttribute('type', 'button');
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('xdlkc:lang-change', { detail: { mode: m } }));
    }
  }

  function initLangToggle({ document = globalThis.document, storage = globalThis.localStorage } = {}) {
    if (!document?.querySelector) return;
    const initial = getMode(document, storage);
    applyLanguageToDocument({ document, storage, mode: initial });

    const toggle = document.querySelector('[data-lang-toggle]');
    if (!toggle) return;
    if (toggle.dataset?.langBound === '1') return;
    if (toggle.dataset) toggle.dataset.langBound = '1';

    toggle.addEventListener('click', () => {
      const current = getMode(document, storage);
      const next = current === 'en' ? 'zh' : 'en';
      applyLanguageToDocument({ document, storage, mode: next });
    });
  }

  return {
    STORAGE_KEY,
    DICT,
    t,
    getMode,
    applyLanguageToDocument,
    initLangToggle
  };
});
