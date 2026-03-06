# Spec: Local Search — No-result suggestions

## Goal
When a user searches on the site and there are **zero matches**, show actionable suggestions instead of only an icon.

## User Story
As a reader using the popup local search, when my query returns no results, I want to see tips and quick actions (one-click keyword chips) so I can adjust my query quickly.

## Requirements
1. When search input is non-empty and **no results** are found, the result area MUST render:
   - A clear message that no results were found.
   - A short list of tips (e.g., reduce keywords / check spelling / try searching a single word).
   - "keyword chips" for each token split by whitespace/dash from the query.
2. Clicking a keyword chip MUST:
   - Set the search input to that keyword.
   - Trigger a new search immediately.
3. When the search input becomes empty, the existing default empty-state behavior MUST remain unchanged.

## Acceptance Criteria
- Given `datas` has entries that do not match the query, typing a query like `foo bar` shows:
  - Text "No results" message (Chinese copy is acceptable).
  - Two keyword chips: `foo` and `bar`.
- Clicking the `foo` chip sets the input value to `foo`.

## Non-goals / Boundaries
- Do not change indexing, ranking, or highlighting logic.
- Do not add network requests.
- Do not introduce new dependencies.

## Notes
- Implementation is expected in `js/local-search.js` only.
- Tests should be JSDOM-based integration tests using Node's built-in test runner.
