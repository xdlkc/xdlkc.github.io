const { JSDOM } = require('jsdom');

function slugifyHeading(text) {
  const raw = String(text || '').trim();
  if (!raw) return 'section';

  // Keep CJK, numbers, letters. Remove common punctuation.
  const withoutPunct = raw
    .replace(/[\u0000-\u001F]/g, ' ')
    .replace(/[~`!@#$%^&*()=+\[\]{}\\|;:'",.<>/?，。？！；：、【】（）《》“”‘’]/g, ' ');

  const normalized = withoutPunct
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || 'section';
}

function addHeadingIds(html) {
  const input = String(html || '');
  if (!input.trim()) return input;

  const dom = new JSDOM(`<!doctype html><body>${input}</body>`);
  const { document } = dom.window;

  const used = new Set();
  Array.from(document.querySelectorAll('[id]')).forEach((el) => {
    const id = el.getAttribute('id');
    if (id) used.add(String(id));
  });

  const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'));

  headings.forEach((h) => {
    if (h.hasAttribute('id')) return;

    const base = slugifyHeading(h.textContent);
    let id = base;
    let i = 2;
    while (used.has(id)) {
      id = `${base}-${i}`;
      i += 1;
    }

    h.setAttribute('id', id);
    used.add(id);
  });

  return document.body.innerHTML;
}

// Hexo integration: add ids after HTML is rendered for both posts and pages.
if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.filter) {
  function applyFilter(data) {
    if (!data || typeof data.content !== 'string') return data;
    data.content = addHeadingIds(data.content);
    return data;
  }

  hexo.extend.filter.register('after_post_render', applyFilter);
  hexo.extend.filter.register('after_page_render', applyFilter);
}

module.exports = {
  slugifyHeading,
  addHeadingIds,
};
