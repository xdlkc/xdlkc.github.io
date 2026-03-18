# Spec: RSS Output Enhancement

## Feature Description
Enhance the RSS feed output (`rss2.xml`) to include author information (`dc:creator`) and `lastBuildDate` for better feed reader compatibility and SEO.

## Acceptance Criteria
- `rss2.xml` includes `<dc:creator>` for items if config/post author exists.
- `rss2.xml` includes `<lastBuildDate>` at the channel level.
- Integration test confirms `dc:creator` or `lastBuildDate` exists in the generated RSS feed.
