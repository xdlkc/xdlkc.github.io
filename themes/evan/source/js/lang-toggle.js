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
      en: 'Declarative multi-benchmark tracker across dialogue, software engineering, agent execution, science, and competitive coding.',
      zh: '可扩展的多维度 AI 模型评测看板，覆盖综合对话、代码工程、Agent 执行、科学推理与竞赛编程。'
    },
    'models.stats.benchmarks': { en: 'Benchmarks', zh: '个评测集' },
    'models.stats.models': { en: 'Models', zh: '个模型' },
    'models.stats.updated': { en: 'Updated', zh: '更新于' },
    'models.tab.overview': { en: 'Overview', zh: '综合总览' },
    'models.overview.desc': {
      en: 'Normalized composite index (0–100, relative to top score per benchmark) aggregated automatically from all registered benchmark JSON files.',
      zh: '综合归一化指数（0–100，按各评测集最高分归一化后取均值），由 source/_data/benchmarks/ 下所有 JSON 自动汇总。'
    },
    'models.filter.all': { en: 'All', zh: '全部' },
    'models.filter.open': { en: 'Open Weights', zh: '开源权重' },
    'models.filter.closed': { en: 'Closed API', zh: '闭源商用' },
    'models.filter.reasoning': { en: 'Reasoning', zh: '推理模型' },
    'models.filter.providerAll': { en: 'All Providers', zh: '全部厂商' },
    'models.filter.searchPlaceholder': { en: 'Search model, provider, or notes…', zh: '搜索模型、厂商或备注…' },
    'models.filter.reset': { en: 'Reset filters', zh: '重置筛选' },
    'models.col.rank': { en: '#', zh: '#' },
    'models.col.model': { en: 'Model', zh: '模型' },
    'models.col.provider': { en: 'Provider', zh: '厂商' },
    'models.col.composite': { en: 'Composite', zh: '综合均分' },
    'models.col.score': { en: 'Score', zh: '得分' },
    'models.col.release': { en: 'Release', zh: '发布日期' },
    'models.badge.open': { en: 'Open', zh: '开源' },
    'models.badge.closed': { en: 'API', zh: '闭源' },
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
      en: 'This leaderboard automatically discovers every *.json file under source/_data/benchmarks/ at build time — zero template or code changes required.',
      zh: '本看板在构建时自动扫描 source/_data/benchmarks/ 目录下的全部 *.json 文件，无需修改任何模板或代码。'
    }
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
