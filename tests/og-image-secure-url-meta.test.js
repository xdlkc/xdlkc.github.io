const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { buildSocialMeta } = require('../scripts/helpers/social-meta');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

test('buildSocialMeta exposes imageSecureUrl only for https images', () => {
  const meta = buildSocialMeta({
    page: { title: 'Hello', content: '<p>hi</p>', image: '/images/avatar.jpg' },
    site: { title: 'Site', description: 'd', url: 'https://xdlkc.github.io', language: 'zh-CN' },
    canonicalUrl: 'https://xdlkc.github.io/2026/03/12/hello/',
    rootDir: path.join(__dirname, '..')
  });

  assert.equal(meta.image, 'https://xdlkc.github.io/images/avatar.jpg');
  assert.equal(meta.imageSecureUrl, meta.image);
});

test('buildSocialMeta keeps imageSecureUrl empty for non-https images', () => {
  const meta = buildSocialMeta({
    page: { title: 'Hello', content: '<p>hi</p>', og_image: 'http://example.com/a.png' },
    site: { title: 'Site', description: 'd', url: 'https://xdlkc.github.io', language: 'zh-CN' },
    canonicalUrl: 'https://xdlkc.github.io/2026/03/12/hello/',
    rootDir: path.join(__dirname, '..')
  });

  assert.equal(meta.image, 'http://example.com/a.png');
  assert.equal(meta.imageSecureUrl, '');
});

test('layout template conditionally renders og:image:secure_url meta tag', () => {
  const template = read('themes/evan/layout/layout.ejs');

  assert.match(template, /og:image:secure_url/);
  assert.match(template, /if \(social\.imageSecureUrl\)/);
});
