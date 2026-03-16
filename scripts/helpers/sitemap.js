/**
 * Sitemap XML generator helper
 *
 * Generates XML sitemap according to the Sitemap protocol:
 * https://www.sitemaps.org/protocol.html
 */

/**
 * Format a Date object to ISO 8601 string for sitemap
 * @param {Date} date - Date object
 * @returns {string} - ISO 8601 formatted date string
 */
function formatDateForSitemap(date) {
  if (!date) return new Date().toISOString();
  const d = new Date(date);
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Escape XML special characters
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Clamp a value to a range
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - Clamped value
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Validate and normalize sitemap URL entry
 * @param {Object} entry - URL entry
 * @returns {Object} - Normalized entry
 */
function normalizeUrlEntry(entry) {
  if (!entry || !entry.url) {
    throw new Error('URL entry must have a url property');
  }

  return {
    url: escapeXml(entry.url),
    lastmod: formatDateForSitemap(entry.lastmod),
    changefreq: entry.changefreq || 'monthly',
    priority: clamp(Number(entry.priority) || 0.5, 0, 1).toFixed(1)
  };
}

/**
 * Generate sitemap XML from URL entries
 * @param {Array<Object>} urls - Array of URL entries
 * @returns {string} - XML sitemap string
 */
function generateSitemapXml(urls) {
  const urlEntries = Array.isArray(urls) ? urls : [];

  const urlElements = urlEntries
    .map(entry => {
      try {
        const normalized = normalizeUrlEntry(entry);
        return `  <url>
    <loc>${normalized.url}</loc>
    <lastmod>${normalized.lastmod}</lastmod>
    <changefreq>${normalized.changefreq}</changefreq>
    <priority>${normalized.priority}</priority>
  </url>`;
      } catch (err) {
        // Skip invalid entries
        console.warn(`Skipping invalid sitemap entry: ${err.message}`);
        return null;
      }
    })
    .filter(Boolean)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>
`;
}

module.exports = {
  generateSitemapXml,
  formatDateForSitemap,
  escapeXml,
  normalizeUrlEntry
};
