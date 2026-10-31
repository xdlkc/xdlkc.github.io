const { JSDOM } = require('jsdom');

function isImageOnlyParagraph(paragraph) {
  const children = Array.from(paragraph.childNodes).filter((node) => (
    node.nodeType !== 3 || node.textContent.trim()
  ));
  if (children.length !== 1 || children[0].nodeType !== 1) return false;

  const child = children[0];
  if (child.tagName === 'IMG') return true;
  if (child.tagName !== 'A') return false;

  const linkChildren = Array.from(child.childNodes).filter((node) => (
    node.nodeType !== 3 || node.textContent.trim()
  ));
  return linkChildren.length === 1
    && linkChildren[0].nodeType === 1
    && linkChildren[0].tagName === 'IMG';
}

function enhanceResponsiveContent(html) {
  const input = String(html || '');
  if (!input.trim() || (!/<table[\s>]/i.test(input) && !/<img[\s>]/i.test(input))) {
    return input;
  }

  const dom = new JSDOM(`<!doctype html><body>${input}</body>`);
  const { document } = dom.window;

  document.querySelectorAll('table').forEach((table) => {
    if (table.closest('figure.highlight') || table.closest('.table-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', 'Scrollable table');
    wrapper.setAttribute('tabindex', '0');
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });

  document.querySelectorAll('p').forEach((paragraph) => {
    if (isImageOnlyParagraph(paragraph)) paragraph.classList.add('article-image');
  });

  return document.body.innerHTML;
}

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.filter) {
  function applyFilter(data) {
    if (!data || typeof data.content !== 'string') return data;
    data.content = enhanceResponsiveContent(data.content);
    return data;
  }

  hexo.extend.filter.register('after_post_render', applyFilter);
  hexo.extend.filter.register('after_page_render', applyFilter);
}

module.exports = {
  enhanceResponsiveContent,
  isImageOnlyParagraph,
};
