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
    'nav.archives': { en: 'Archives', zh: '归档' },
    'nav.news': { en: 'News', zh: '新闻' },
    'nav.about': { en: 'About', zh: '关于' },
    'nav.search': { en: 'Search', zh: '搜索' },
    'nav.font': { en: 'Font', zh: '字号' },
    'nav.theme': { en: 'Theme', zh: '主题' },
    'nav.lang': { en: '中文', zh: 'English' },
    'skip.main': { en: 'Skip to content', zh: '跳转到正文' },
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
    'archive.totalSuffix': { en: 'posts.', zh: '篇日志。' },
    'post.published': { en: 'Published', zh: '发布于' },
    'post.reading': { en: 'Reading', zh: '预计阅读' },
    'post.min': { en: 'min', zh: '分钟' },
    'post.words': { en: 'Words', zh: '字数' },
    'post.copyLink': { en: 'Copy Link', zh: '复制链接' },
    'post.toc': { en: 'Outline', zh: '查看大纲' },
    'post.outline': { en: 'Outline', zh: '大纲' },
    'post.comments': { en: 'Comments', zh: '评论' },
    'post.commentsNoscript': { en: 'Enable JavaScript to view comments.', zh: '请启用 JavaScript 后查看评论。' },
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
