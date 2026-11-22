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
    'nav.about': { en: 'About', zh: '关于' },
    'nav.search': { en: 'Search', zh: '搜索' },
    'nav.font': { en: 'Font', zh: '字号' },
    'nav.theme': { en: 'Theme', zh: '主题' },
    'nav.lang': { en: '中文', zh: 'English' },
    'skip.main': { en: 'Skip to content', zh: '跳转到正文' },
    'index.hero.tag': { en: 'HELLO', zh: '你好' },
    'index.hero.titleLine1': { en: 'I am Evan Zhang,', zh: '我是 Evan Zhang，' },
    'index.hero.titleLine2': { en: 'an Agent Application Engineer (Full Stack)', zh: '一名 Agent 应用工程师（全栈）' },
    'index.hero.subtitle': {
      en: 'Previously a Java backend engineer, now focused on Agent application development and full stack engineering at Alibaba Group (Beijing).',
      zh: '曾任 Java 后端工程师，现就职于阿里巴巴集团（北京），专注于 Agent 应用开发与全栈工程实践。'
    },
    'index.profile.eyebrow': { en: 'PROFILE', zh: '个人简介' },
    'index.profile.focusLabel': { en: 'Focus', zh: '方向' },
    'index.profile.focusValue': { en: 'Agent Apps', zh: 'Agent 应用' },
    'index.profile.stackLabel': { en: 'Stack', zh: '技术栈' },
    'index.profile.stackValue': { en: 'Full Stack + Engineering', zh: '全栈 + 工程实践' },
    'index.profile.baseLabel': { en: 'Base', zh: '坐标' },
    'index.profile.baseValue': { en: 'Beijing', zh: '北京' },
    'index.profile.latestLabel': { en: 'Latest', zh: '最新文章' },
    'index.project.loom': {
      en: 'A local-only model quota dashboard with usage curves, browser sync, and a unified model gateway.',
      zh: '一款纯本地运行的模型配额看板，支持用量曲线统计、浏览器同步与统一模型网关。'
    },
    'index.project.llmTexasHoldem': {
      en: "A Royal Hold'em AI arena for one human and multiple LLM/Agent opponents, supporting OpenAI and Anthropic protocols.",
      zh: '支持单人与多个 LLM/Agent 对战的皇家德州扑克 AI 竞技场，兼容 OpenAI 与 Anthropic 协议。'
    },
    'index.project.scribeleaf': {
      en: 'A native macOS Markdown editor with live preview.',
      zh: '一款原生 macOS Markdown 编辑器，支持实时预览。'
    },
    'index.project.stillpin': {
      en: 'A native macOS tool for region capture, annotation, and floating image pins, built with Swift and AppKit.',
      zh: '基于 Swift 与 AppKit 打造的原生 macOS 区域截图标注与桌面贴图工具。'
    },
    'index.project.agentForge': {
      en: 'An engineering-focused project for Agent applications, covering end-to-end practices from backend capability encapsulation to frontend interaction delivery.',
      zh: '面向 Agent 应用的工程化实践项目，涵盖从后端能力封装到前端交互交付的完整链路。'
    },
    'index.project.skillsManager': {
      en: 'A tool for managing Agent skill configurations and version evolution, improving consistency and delivery efficiency in multi-skill collaboration.',
      zh: '用于管理 Agent 技能配置与版本演进的工具，提升多技能协作下的一致性与交付效率。'
    },
    'index.aboutCard.role': { en: 'Agent Application Engineer', zh: 'Agent 应用工程师' },
    'index.aboutCard.bio': {
      en: "I studied at Xidian University from 2014 to 2018 for my bachelor's degree and currently work at Alibaba Group (Beijing). I started as a Java backend engineer and now focus on Agent application development and full stack engineering, with an emphasis on engineering quality and delivery efficiency.",
      zh: '2014 至 2018 年本科就读于西安电子科技大学，现就职于阿里巴巴集团（北京）。早年从事 Java 后端开发，目前专注于 Agent 应用研发与全栈工程，注重工程质量与交付效率。'
    },
    'index.contactCard.title': { en: 'Find Me', zh: '联系方式' },
    'index.contactCard.emailLabel': { en: 'Email:', zh: '邮箱：' },
    'index.news.latest': { en: 'Latest News', zh: '最新新闻' },
    'index.news.all': { en: 'View all news ->', zh: '查看全部新闻 ->' },
    'index.projects': { en: 'Projects', zh: '项目' },
    'index.latestWriting': { en: 'Latest Writing', zh: '最新文章' },
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
    'news.context': { en: 'Context:', zh: '背景：' }
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
