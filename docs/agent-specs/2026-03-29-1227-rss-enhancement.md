# Spec: RSS Output Enhancement
- Requirements: Add full-text support and author tags to RSS XML generation.
- Acceptance Criteria: `generateRss` function outputs XML containing `<content:encoded>` and `<author>`.
- Edge Cases: Empty content should return empty `<content:encoded>`.
