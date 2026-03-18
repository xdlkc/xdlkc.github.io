const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('RSS XML feed should include XSLT stylesheet for better browser UX', () => {
    const rssTemplatePath = path.join(__dirname, '../../themes/evan/layout/rss2.xml');
    if (fs.existsSync(rssTemplatePath)) {
        const content = fs.readFileSync(rssTemplatePath, 'utf8');
        assert.ok(content.includes('<?xml-stylesheet type="text/xsl" href="/rss.xsl"?>'), 'RSS Template must include XSLT stylesheet reference');
    } else {
        assert.ok(false, 'Custom RSS template is missing in themes/evan/layout/rss2.xml');
    }

    const xslPath = path.join(__dirname, '../../source/rss.xsl');
    assert.ok(fs.existsSync(xslPath), 'rss.xsl stylesheet file must exist in source/');
});
