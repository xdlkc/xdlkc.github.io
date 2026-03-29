# Search Enhancement Spec

## Requirements
- Enhance the local search component to support highlighting of keywords in titles and tags.
- Provide a clear "No results found for {query}. Please try different keywords." suggestion when no results match.

## Acceptance Criteria
1. When search results contain the query, the query in the title and tag text should be wrapped with `<mark class="search-keyword">` tags.
2. When a search returns no results, the result container must contain an element with class `search-no-result` and the text `No results found`.
