const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

describe('TOC Feature', () => {
  it('should generate a post with TOC', () => {
    // Check an existing public post for post-toc class
    // We assume public dir is generated
    const publicDir = path.join(__dirname, '../../public');
    // Find a post, any post in public/2026 or public/archives or we can just parse the first one
    // For simplicity, we just check if any HTML file in public contains "post-toc"
    const checkDir = (dir) => {
      let found = false;
      if (!fs.existsSync(dir)) return false;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          found = found || checkDir(fullPath);
        } else if (fullPath.endsWith('.html')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('post-toc')) {
            return true;
          }
        }
      }
      return found;
    };
    const hasTOC = checkDir(publicDir);
    assert.strictEqual(hasTOC, true, 'No TOC found in generated posts');
  });
});
