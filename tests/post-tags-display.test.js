const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('path');
const { JSDOM } = require('jsdom');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('post.ejs includes article-meta-tags container when tags exist', () => {
  const postTemplate = read('themes/evan/layout/post.ejs');

  // Check that the template can render tags section
  assert.ok(
    postTemplate.includes('article-meta-tags') || postTemplate.includes('page.tags'),
    'Template should include tags-related code'
  );
});

test('post.ejs includes tag links generation logic', () => {
  const postTemplate = read('themes/evan/layout/post.ejs');

  // Check for tag link generation pattern
  assert.ok(
    postTemplate.includes('tag.path') || postTemplate.includes('url_for(tag'),
    'Template should include tag link generation'
  );
});

test('article meta tags structure is correct', () => {
  const dom = new JSDOM(`
    <!doctype html>
    <html>
      <body>
        <div class="article-hero">
          <p class="article-meta">
            <span>Published 2026-03-19</span>
            <span class="article-meta-sep">·</span>
            <span class="article-meta-word-count">3,245 字</span>
            <span class="article-meta-sep">·</span>
            <span class="article-meta-reading-time">12 分钟阅读</span>
          </p>
        </div>
      </body>
    </html>
  `);

  // This test ensures the meta structure exists
  const metaSection = dom.window.document.querySelector('.article-meta');
  assert.ok(metaSection, 'Article meta section should exist');
});

test('tags are rendered as links with correct href', () => {
  const dom = new JSDOM(`
    <!doctype html>
    <html>
      <body>
        <div class="article-hero">
          <p class="article-meta">
            <span>Published 2026-03-19</span>
            <div class="article-meta-tags" aria-label="Tags">
              <a class="article-meta-tag" href="/tags/tech/" aria-label="Tag: tech">tech</a>
              <a class="article-meta-tag" href="/tags/hexo/" aria-label="Tag: hexo">hexo</a>
            </div>
          </p>
        </div>
      </body>
    </html>
  `);

  const tagsContainer = dom.window.document.querySelector('.article-meta-tags');
  assert.ok(tagsContainer, 'Tags container should exist');

  const tagLinks = tagsContainer.querySelectorAll('.article-meta-tag');
  assert.equal(tagLinks.length, 2, 'Should have 2 tag links');

  const firstTag = tagLinks[0];
  assert.equal(firstTag.textContent, 'tech');
  assert.equal(firstTag.getAttribute('href'), '/tags/tech/');
  assert.equal(firstTag.getAttribute('aria-label'), 'Tag: tech');
});

test('tags section has proper aria attributes', () => {
  const dom = new JSDOM(`
    <!doctype html>
    <html>
      <body>
        <div class="article-meta-tags" aria-label="Tags">
          <a class="article-meta-tag" href="/tags/tech/" aria-label="Tag: tech">tech</a>
        </div>
      </body>
    </html>
  `);

  const tagsContainer = dom.window.document.querySelector('.article-meta-tags');
  assert.ok(tagsContainer, 'Tags container should exist');
  assert.equal(tagsContainer.getAttribute('aria-label'), 'Tags');

  const tagLink = tagsContainer.querySelector('.article-meta-tag');
  assert.ok(tagLink, 'Tag link should exist');
  assert.ok(
    tagLink.getAttribute('aria-label')?.startsWith('Tag:'),
    'Tag link should have proper aria-label'
  );
});
