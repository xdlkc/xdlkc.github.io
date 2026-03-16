const assert = require('assert');
// Dummy test for OG Image Automation
function getOgImage(postContent, defaultImg) {
    const match = postContent.match(/<img[^>]+src="([^">]+)"/);
    return match ? match[1] : defaultImg;
}

assert.strictEqual(getOgImage('<img src="first.jpg"><img src="second.jpg">', 'default.jpg'), 'first.jpg');
assert.strictEqual(getOgImage('<p>no image here</p>', 'default.jpg'), 'default.jpg');
console.log('✅ OG Image Automation tests passed.');
