const { highlightSearchTerm, renderNoResult } = require('../src/search-enhancement.js');

describe('Search Enhancement', () => {
  test('should highlight search term in text', () => {
    const text = 'This is a great tutorial for React';
    const keyword = 'react';
    const result = highlightSearchTerm(text, keyword);
    expect(result).toBe('This is a great tutorial for <mark class="search-keyword">React</mark>');
  });

  test('should return original text if keyword not found', () => {
    const text = 'This is a great tutorial for Vue';
    const keyword = 'react';
    const result = highlightSearchTerm(text, keyword);
    expect(result).toBe(text);
  });

  test('should render no result message', () => {
    const query = 'unknown';
    const html = renderNoResult(query);
    expect(html).toContain('<div class="search-no-result">');
    expect(html).toContain('No results found for "unknown". Please try different keywords.');
  });
});
