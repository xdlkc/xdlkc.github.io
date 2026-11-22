const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const ReadingProgress = require('../themes/evan/source/js/reading-progress.js');

function setupPage({ url, title, bodyHtml, scrollHeight = 800, innerHeight = 1000, scrollY = 0 }) {
  const dom = new JSDOM(`<!doctype html><html><head><title>${title}</title></head><body>${bodyHtml}</body></html>`, { url });
  global.window = dom.window;
  global.document = dom.window.document;
  dom.window.requestAnimationFrame = (fn) => fn();

  Object.defineProperty(dom.window.document.documentElement, 'scrollHeight', { value: scrollHeight, configurable: true });
  Object.defineProperty(dom.window, 'innerHeight', { value: innerHeight, configurable: true });
  Object.defineProperty(dom.window, 'scrollY', { value: scrollY, configurable: true });

  return dom;
}

function teardown() {
  delete global.window;
  delete global.document;
}

test('ReadingProgress is disabled on /about/ static page (hidden bar, no [100%] title prefix)', () => {
  const dom = setupPage({
    url: 'https://example.com/about/',
    title: 'About | xdlkc',
    bodyHtml: `
      <div id="reading-progress-bar"></div>
      <article class="article-shell container">
        <div class="reading-progress" data-reading-minutes="1" role="progressbar" aria-valuenow="0">
          <div class="reading-progress-bar"></div>
        </div>
        <header class="article-hero">
          <p class="tag">PAGE</p>
          <h1>About</h1>
        </header>
        <article class="article-content"><p>Short about page.</p></article>
      </article>
    `
  });

  try {
    assert.equal(ReadingProgress.shouldEnableReadingProgress({ document: dom.window.document, window: dom.window }), false);
    ReadingProgress.initReadingProgress();

    const container = dom.window.document.querySelector('.reading-progress');
    assert.equal(container.hidden, true);
    assert.equal(container.style.display, 'none');
    assert.equal(dom.window.document.title, 'About | xdlkc');
  } finally {
    teardown();
  }
});

test('ReadingProgress is disabled on /archives/ and /news/ pages', () => {
  for (const route of ['/archives/', '/news/']) {
    const dom = setupPage({
      url: `https://example.com${route}`,
      title: 'Static | xdlkc',
      bodyHtml: `
        <div class="reading-progress"><div class="reading-progress-bar"></div></div>
        <div class="archive-shell container"><h1>Static</h1></div>
      `
    });
    try {
      assert.equal(ReadingProgress.shouldEnableReadingProgress({ document: dom.window.document, window: dom.window }), false);
      ReadingProgress.initReadingProgress();
      assert.equal(dom.window.document.title, 'Static | xdlkc');
      assert.equal(dom.window.document.querySelector('.reading-progress').hidden, true);
    } finally {
      teardown();
    }
  }
});

test('ReadingProgress stays active on article/post pages', () => {
  const dom = setupPage({
    url: 'https://example.com/2026/03/19/agent-skill-design-patterns/',
    title: 'Agent Skill Design Patterns | xdlkc',
    scrollHeight: 2000,
    innerHeight: 1000,
    scrollY: 500,
    bodyHtml: `
      <article class="article-shell container">
        <div class="reading-progress" data-reading-minutes="8" role="progressbar" aria-valuenow="0">
          <div class="reading-progress-bar"></div>
        </div>
        <header class="article-hero">
          <p class="tag">AI</p>
          <h1>Agent Skill Design Patterns</h1>
          <p class="article-meta">
            <time class="article-meta-date">2026-03-19</time>
          </p>
        </header>
        <article class="article-content"><p>Long article content...</p></article>
      </article>
    `
  });

  try {
    assert.equal(ReadingProgress.shouldEnableReadingProgress({ document: dom.window.document, window: dom.window }), true);
    ReadingProgress.initReadingProgress();

    const container = dom.window.document.querySelector('.reading-progress');
    assert.equal(container.hidden, false);
    assert.equal(dom.window.document.title, '[50%] Agent Skill Design Patterns | xdlkc');
  } finally {
    teardown();
  }
});
