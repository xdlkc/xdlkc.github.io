const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('RSS feed should contain enhanced fields', async () => {
    const rssPath = path.join(__dirname, '../public/rss2.xml');
    if (fs.existsSync(rssPath)) {
        const content = fs.readFileSync(rssPath, 'utf8');
        assert.ok(content.includes('<lastBuildDate>'), 'lastBuildDate not found in RSS feed');
        assert.ok(content.includes('<dc:creator>'), 'dc:creator not found in RSS feed');
    }
});
