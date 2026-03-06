const test = require('node:test');
const assert = require('node:assert/strict');

const { buildRobotsMeta } = require('../scripts/helpers/robots-meta');

test('buildRobotsMeta: defaults to index/follow for normal pages', () => {
  const result = buildRobotsMeta({
    page: {
      layout: 'post',
      path: '2026/03/06/demo/'
    }
  });

  assert.equal(result, 'index,follow,max-image-preview:large');
});

test('buildRobotsMeta: marks paginated pages as noindex/follow', () => {
  const result = buildRobotsMeta({
    page: {
      layout: 'index',
      path: 'page/2/',
      current: '2'
    }
  });

  assert.equal(result, 'noindex,follow');
});

test('buildRobotsMeta: marks 404 pages as noindex/follow', () => {
  const byLayout = buildRobotsMeta({
    page: {
      layout: '404',
      path: '404.html'
    }
  });

  const byPath = buildRobotsMeta({
    page: {
      layout: 'page',
      path: '/foo/404/'
    }
  });

  assert.equal(byLayout, 'noindex,follow');
  assert.equal(byPath, 'noindex,follow');
});
