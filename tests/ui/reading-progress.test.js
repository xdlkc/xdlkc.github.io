const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('Reading Progress Bar presence', async () => {
    const layoutPath = path.join(__dirname, '../../themes/evan/layout/layout.ejs');
    if (!fs.existsSync(layoutPath)) {
        assert.fail('layout.ejs not found');
    }
    const layout = fs.readFileSync(layoutPath, 'utf8');
    assert.ok(layout.includes('id="reading-progress-bar"'), 'Should contain reading progress bar element');
});
