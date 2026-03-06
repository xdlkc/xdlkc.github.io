function isNoindex404(page = {}) {
  const layout = String(page.layout || '').toLowerCase();
  const path = String(page.path || '').toLowerCase();

  return layout === '404' || path.includes('404');
}

function isPaginated(page = {}) {
  const current = Number(page.current);
  return Number.isFinite(current) && current > 1;
}

function buildRobotsMeta({ page = {} } = {}) {
  if (isNoindex404(page) || isPaginated(page)) {
    return 'noindex,follow';
  }

  return 'index,follow,max-image-preview:large';
}

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.helper) {
  hexo.extend.helper.register('robots_meta', function robotsMeta() {
    return buildRobotsMeta({ page: this.page });
  });
}

module.exports = {
  buildRobotsMeta
};
