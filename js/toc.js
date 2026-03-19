(function() {
  function slugify(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with -
      .replace(/[^\w-]+/g, '')       // Remove all non-word chars
      .replace(/--+/g, '-')         // Replace multiple - with single -
      .replace(/^-+/, '')           // Trim - from start of text
      .replace(/-+$/, '');          // Trim - from end of text
  }

  function generateHeadingIDs() {
    const articleContent = document.getElementById('article-content');
    if (!articleContent) return;

    const headings = articleContent.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const usedIds = new Set();

    headings.forEach((heading) => {
      let id = slugify(heading.textContent);
      let originalId = id;
      let counter = 1;

      // Ensure uniqueness
      while (usedIds.has(id)) {
        id = `${originalId}-${counter}`;
        counter++;
      }
      heading.id = id;
      usedIds.add(id);
    });
  }

  // Run on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', generateHeadingIDs);
})();