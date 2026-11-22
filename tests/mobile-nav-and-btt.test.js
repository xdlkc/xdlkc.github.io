const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const MobileNav = require('../themes/evan/source/js/mobile-nav.js');
const BackToTop = require('../themes/evan/source/js/back-to-top.js');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

function buildNavDom() {
  return new JSDOM(`<!doctype html>
  <html>
    <body>
      <nav class="article-nav" aria-label="Primary" data-mobile-nav>
        <a class="brand" href="/">Evan Zhang</a>
        <div class="nav-mobile-actions">
          <button class="site-search-trigger nav-mobile-search" type="button" data-site-search-trigger aria-label="Search">Search</button>
          <button class="nav-menu-toggle" type="button" data-mobile-nav-toggle aria-expanded="false" aria-controls="primary-nav-menu" aria-label="Toggle navigation menu">
            <span class="nav-menu-toggle-icon" aria-hidden="true"><span></span><span></span><span></span></span>
          </button>
        </div>
        <div id="primary-nav-menu" class="nav-links" data-mobile-nav-menu>
          <a href="/archives/" data-i18n-key="nav.archives">Archives</a>
          <a href="/news/" data-i18n-key="nav.news">News</a>
          <a href="/about/" data-i18n-key="nav.about">About</a>
          <a href="/rss.xml" aria-label="RSS">RSS</a>
          <button class="site-search-trigger nav-desktop-search" type="button" data-site-search-trigger aria-label="Search">Search</button>
          <button class="theme-toggle" type="button" data-theme-toggle aria-pressed="false" aria-label="Theme">Theme</button>
          <button class="shortcut-help-trigger" type="button" data-shortcut-help-trigger aria-label="Shortcuts">?</button>
          <button class="lang-toggle" type="button" data-lang-toggle aria-label="切换为中文">中文</button>
        </div>
      </nav>
      <main id="main-content"><p>Outside content</p></main>
    </body>
  </html>`, { url: 'https://example.com/' });
}

test('P2-1: header.ejs includes accessible mobile actions, drawer markup, and preserves all hooks', () => {
  const header = read('themes/evan/layout/_partial/header.ejs');
  const layout = read('themes/evan/layout/layout.ejs');

  assert.match(header, /data-mobile-nav/);
  assert.match(header, /class="nav-mobile-actions"/);
  assert.match(header, /data-mobile-nav-toggle/);
  assert.match(header, /aria-expanded="false"/);
  assert.match(header, /aria-controls="primary-nav-menu"/);
  assert.match(header, /id="primary-nav-menu"[^>]*data-mobile-nav-menu/);

  // Existing selectors & i18n hooks preserved
  assert.match(header, /data-i18n-key="nav\.archives"/);
  assert.match(header, /data-i18n-key="nav\.news"/);
  assert.match(header, /data-i18n-key="nav\.about"/);
  assert.match(header, /aria-label="RSS"/);
  assert.match(header, /data-site-search-trigger/);
  assert.match(header, /data-theme-toggle/);
  assert.match(header, /data-shortcut-help-trigger/);
  assert.match(header, /data-lang-toggle/);

  // layout.ejs loads and initializes mobile-nav.js
  assert.match(layout, /\/js\/mobile-nav\.js/);
  assert.match(layout, /window\.MobileNav\s*&&\s*window\.MobileNav\.initMobileNav/);
});

test('P2-1: MobileNav toggles open/closed and closes on Escape, outside click, nav link, search, and resize', () => {
  const dom = buildNavDom();
  const doc = dom.window.document;
  dom.window.innerWidth = 390;

  const controllers = MobileNav.initMobileNav({ root: doc });
  assert.equal(controllers.length, 1);

  // Idempotent re-init does not double-bind
  const secondInit = MobileNav.initMobileNav({ root: doc });
  assert.equal(secondInit.length, 0);

  const nav = doc.querySelector('[data-mobile-nav]');
  const toggleBtn = doc.querySelector('[data-mobile-nav-toggle]');
  const menu = doc.querySelector('[data-mobile-nav-menu]');
  const archivesLink = menu.querySelector('a[href="/archives/"]');
  const themeBtn = menu.querySelector('[data-theme-toggle]');
  const mobileSearch = nav.querySelector('.nav-mobile-search');
  const main = doc.querySelector('#main-content');

  // Starts closed
  assert.equal(toggleBtn.getAttribute('aria-expanded'), 'false');
  assert.equal(nav.classList.contains('is-open'), false);
  assert.equal(menu.classList.contains('is-open'), false);

  // Click hamburger opens drawer
  toggleBtn.click();
  assert.equal(toggleBtn.getAttribute('aria-expanded'), 'true');
  assert.equal(nav.classList.contains('is-open'), true);
  assert.equal(menu.classList.contains('is-open'), true);

  // Clicking non-link control inside drawer keeps it open
  themeBtn.click();
  assert.equal(toggleBtn.getAttribute('aria-expanded'), 'true');

  // Escape closes drawer and restores focus to toggle button
  doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(toggleBtn.getAttribute('aria-expanded'), 'false');
  assert.equal(nav.classList.contains('is-open'), false);
  assert.equal(doc.activeElement, toggleBtn);

  // Open again and click outside closes drawer
  toggleBtn.click();
  assert.equal(toggleBtn.getAttribute('aria-expanded'), 'true');
  main.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(toggleBtn.getAttribute('aria-expanded'), 'false');

  // Open again and click nav link closes drawer
  toggleBtn.click();
  assert.equal(toggleBtn.getAttribute('aria-expanded'), 'true');
  archivesLink.addEventListener('click', (e) => e.preventDefault());
  archivesLink.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  assert.equal(toggleBtn.getAttribute('aria-expanded'), 'false');

  // Open again and click mobile search closes drawer
  toggleBtn.click();
  assert.equal(toggleBtn.getAttribute('aria-expanded'), 'true');
  mobileSearch.click();
  assert.equal(toggleBtn.getAttribute('aria-expanded'), 'false');

  // Open again and resize above 768px closes drawer
  toggleBtn.click();
  assert.equal(toggleBtn.getAttribute('aria-expanded'), 'true');
  dom.window.innerWidth = 1024;
  dom.window.dispatchEvent(new dom.window.Event('resize'));
  assert.equal(toggleBtn.getAttribute('aria-expanded'), 'false');
});

test('P2-1 & P2-2: responsive-fixes.css defines desktop-safe mobile nav, TOC bottom clearance, and circular mobile back-to-top', () => {
  const css = read('themes/evan/source/css/responsive-fixes.css');

  // Desktop hides mobile actions
  assert.match(css, /\.nav-mobile-actions\s*\{\s*display:\s*none;/);

  // Mobile breakpoint styles drawer and hides desktop search
  assert.match(css, /@media\s*\(max-width:\s*768px\)/);
  assert.match(css, /\.nav-links\[data-mobile-nav-menu\]/);
  assert.match(css, /\.nav-desktop-search\s*\{\s*display:\s*none;/);

  // P2-2 Desktop sticky outline bottom clearance
  assert.match(css, /\.toc-sidebar\s*\{[^}]*max-height:\s*calc\(100vh - 5\.5rem\);[^}]*padding-bottom:\s*3\.5rem;/s);

  // P2-2 Mobile circular compact back-to-top
  assert.match(css, /\.back-to-top\s*\{[^}]*right:\s*16px;[^}]*bottom:\s*16px;[^}]*width:\s*40px;[^}]*height:\s*40px;[^}]*border-radius:\s*50%;[^}]*opacity:\s*0\.75;/s);
  assert.match(css, /\.back-to-top:hover,\s*\.back-to-top:focus-visible\s*\{\s*opacity:\s*1;/);
  assert.match(css, /\.back-to-top\s+\.back-to-top-percent\s*\{\s*display:\s*none;/);
});

test('P2-2: BackToTop renders separate icon and percent spans for compact mobile display', () => {
  const dom = new JSDOM('<!doctype html><html><body><main>content</main></body></html>', {
    url: 'https://example.com/'
  });
  const doc = dom.window.document;
  dom.window.scrollY = 0;

  BackToTop.initBackToTop({ threshold: 420, root: doc });

  const btn = doc.querySelector('[data-back-to-top]');
  assert.ok(btn);

  const icon = btn.querySelector('.back-to-top-icon');
  const percentEl = btn.querySelector('.back-to-top-percent');
  assert.ok(icon, 'should render .back-to-top-icon span');
  assert.ok(percentEl, 'should render .back-to-top-percent span');
  assert.equal(icon.textContent, '↑');
  assert.equal(percentEl.textContent, '');

  BackToTop.applyBackToTopProgressLabel(btn, 64);
  assert.equal(percentEl.textContent, ' 64%');
  assert.equal(btn.textContent, '↑ 64%');
  assert.equal(btn.getAttribute('data-progress'), '64');
  assert.equal(btn.getAttribute('title'), '返回顶部 (64%)');
});
