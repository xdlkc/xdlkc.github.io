// og-image-automation.js
function getOgImage(postContent, defaultImg) {
    const match = postContent.match(/<img[^>]+src="([^">]+)"/);
    return match ? match[1] : defaultImg;
}
module.exports = { getOgImage };
