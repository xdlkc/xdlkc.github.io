/**
 * Image Lazy Loading Plugin for Hexo
 *
 * This plugin adds loading="lazy" attribute to all <img> tags
 * to enable native browser lazy loading for better performance.
 *
 * Reference: https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading
 */

module.exports = function(hexo) {
  hexo.extend.filter.register('after_render:html', function(html) {
    if (!html || typeof html !== 'string') {
      return html;
    }

    // Use regex to match img tags and add loading="lazy" attribute
    // This regex matches img tags with or without attributes, and preserves existing attributes
    const imgRegex = /<img\s+([^>]*?)>/gi;

    return html.replace(imgRegex, (match, attributes) => {
      // Check if the img tag already has a loading attribute
      if (attributes.includes('loading=')) {
        // Keep the existing loading attribute
        return match;
      }

      // Add loading="lazy" to the attributes
      // Insert it right after the opening <img tag for cleanliness
      return `<img loading="lazy" ${attributes}>`;
    });
  });
};
