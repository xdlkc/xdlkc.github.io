const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { generateNewsDigest } = require('../tools/generate-news-digest');

function readFile(p) {
  return fs.readFileSync(p, 'utf8');
}

test('generateNewsDigest creates source/_posts/news-digest-YYYY-MM-DD.md with key fields', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'news-digest-'));
  const dataDir = path.join(dir, '_data');
  const postsDir = path.join(dir, '_posts');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(postsDir, { recursive: true });

  const newsJsonPath = path.join(dataDir, 'news.json');
  fs.writeFileSync(
    newsJsonPath,
    JSON.stringify(
      [
        {
          id: 'n1',
          title: 'Hello News',
          summary: 'Summary here',
          url: 'https://example.com/n1',
          source: 'Example',
          publishedAt: '2026-03-06T09:30:00+08:00',
          importance: 3,
          region: ['CN']
        }
      ],
      null,
      2
    )
  );

  const res = generateNewsDigest({
    newsJsonPath,
    postsDir,
    date: '2026-03-06',
    now: new Date('2026-03-06T10:00:00+08:00')
  });

  assert.equal(res.status, 'created');
  assert.ok(res.filepath.endsWith('news-digest-2026-03-06.md'));

  const content = readFile(res.filepath);
  assert.match(content, /title:\s*News Digest 2026-03-06/);
  assert.match(content, /tags:\s*\[?news-digest\]?/);
  assert.match(content, /Hello News/);
  assert.match(content, /https:\/\/example\.com\/n1/);
  assert.match(content, /Example/);
  assert.match(content, /2026-03-06/);
});

test('generateNewsDigest is idempotent: second run with same news does not duplicate', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'news-digest-'));
  const dataDir = path.join(dir, '_data');
  const postsDir = path.join(dir, '_posts');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(postsDir, { recursive: true });

  const newsJsonPath = path.join(dataDir, 'news.json');
  fs.writeFileSync(
    newsJsonPath,
    JSON.stringify(
      [
        {
          id: 'n1',
          title: 'Hello News',
          summary: 'Summary here',
          url: 'https://example.com/n1',
          source: 'Example',
          publishedAt: '2026-03-06T09:30:00+08:00'
        }
      ],
      null,
      2
    )
  );

  const first = generateNewsDigest({ newsJsonPath, postsDir, date: '2026-03-06', now: new Date('2026-03-06T10:00:00+08:00') });
  const before = readFile(first.filepath);

  const second = generateNewsDigest({ newsJsonPath, postsDir, date: '2026-03-06', now: new Date('2026-03-06T11:00:00+08:00') });
  const after = readFile(first.filepath);

  assert.equal(second.status, 'skipped');
  assert.equal(after, before);
});
