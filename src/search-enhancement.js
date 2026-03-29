function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightSearchTerm(text, keyword) {
  if (!text || !keyword) return text;
  const escapedKeyword = escapeRegex(keyword);
  const regex = new RegExp(`(${escapedKeyword})`, 'gi');
  return text.replace(regex, '<mark class="search-keyword">$1</mark>');
}

function renderNoResult(query) {
  if (!query) return '';
  return `<div class="search-no-result">No results found for "${query}". Please try different keywords.</div>`;
}

module.exports = { highlightSearchTerm, renderNoResult };
