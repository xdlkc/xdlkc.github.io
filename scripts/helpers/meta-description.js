function cleanText(input) {
  return String(input || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(input, maxLength = 160) {
  if (input.length <= maxLength) return input;
  return input.slice(0, maxLength).trim();
}

function buildMetaDescription({
  pageDescription,
  excerpt,
  content,
  siteDescription,
  maxLength = 160
} = {}) {
  const explicit = cleanText(pageDescription);
  if (explicit) return explicit;

  const generated = cleanText(excerpt) || cleanText(content);
  if (!generated) return cleanText(siteDescription);

  return truncate(generated, maxLength);
}

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.helper) {
  hexo.extend.helper.register('meta_description', function metaDescription() {
    return buildMetaDescription({
      pageDescription: this.page && this.page.description,
      excerpt: this.page && this.page.excerpt,
      content: this.page && this.page.content,
      siteDescription: this.config && this.config.description
    });
  });
}

module.exports = {
  buildMetaDescription
};
