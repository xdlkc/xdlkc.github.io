const generateRss = require('./rss-enhancement-p1');
const assert = require('assert');

try {
  const item = { title: "Test", content: "<p>Hello</p>", author: "Admin" };
  const rss = generateRss([item]);
  assert(rss.includes('<content:encoded><![CDATA[<p>Hello</p>]]></content:encoded>'), 'Missing content');
  assert(rss.includes('<author>Admin</author>'), 'Missing author');
  console.log('PASS');
} catch (e) {
  console.error('FAIL:', e.message);
  process.exit(1);
}
