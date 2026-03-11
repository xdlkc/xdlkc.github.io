const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('post template renders a reason badge for each related post (tags/keywords/recent)', () => {
  const file = path.join(__dirname, '..', 'themes', 'evan', 'layout', 'post.ejs');
  const template = fs.readFileSync(file, 'utf8');

  // Ensure template uses row.reason to decide which badge to show.
  assert.match(template, /row\.reason/);

  // Ensure i18n keys exist so LangToggle can translate.
  assert.match(template, /data-i18n-key=\"post\.relatedReason\.tags\"/);
  assert.match(template, /data-i18n-key=\"post\.relatedReason\.keywords\"/);
  assert.match(template, /data-i18n-key=\"post\.relatedReason\.recent\"/);
});
