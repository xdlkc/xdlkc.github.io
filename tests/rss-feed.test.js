const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// Integration-ish test: run Hexo generate and verify rss.xml exists.
// This keeps us honest that the feed plugin is wired correctly.

test('build generates rss.xml with at least one item', async () => {
  const Hexo = require('hexo');

  const repoRoot = process.cwd();
  const outDir = path.join(os.tmpdir(), `hexo-public-${Date.now()}`);

  const hexo = new Hexo(repoRoot, { silent: true });

  try {
    await hexo.init();
    await hexo.load();

    // Redirect output to temp dir to keep repo clean.
    hexo.config.public_dir = outDir;
    hexo.public_dir = outDir + path.sep;

    await hexo.call('generate', { watch: false });

    const rssPath = path.join(outDir, 'rss.xml');
    assert.ok(fs.existsSync(rssPath), `expected ${rssPath} to exist`);

    const content = fs.readFileSync(rssPath, 'utf8');
    assert.match(content, /<rss\b/i);
    assert.match(content, /<item\b/i);
  } finally {
    try {
      await hexo.exit();
    } catch {
      // ignore
    }

    try {
      fs.rmSync(outDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
});
