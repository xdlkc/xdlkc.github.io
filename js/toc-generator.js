export function generateTocAndAnchors() {
  const articleContainers = document.querySelectorAll('.article-container');

  articleContainers.forEach(article => {
    const headings = article.querySelectorAll('h2, h3');
    if (headings.length === 0) return; // No headings, no TOC

    const toc = document.createElement('nav');
    toc.id = 'article-toc';
    const ul = document.createElement('ul');

    headings.forEach(heading => {
      let id = heading.id;
      if (!id) {
        // Generate a slug-like ID if not present
        id = heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
        heading.id = id; // Assign generated ID to the heading
      }

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + id;
      a.textContent = heading.textContent;
      li.appendChild(a);

      if (heading.tagName === 'H3') {
        li.classList.add('toc-h3');
      }
      ul.appendChild(li);
    });
    toc.appendChild(ul);
    article.prepend(toc); // Insert TOC at the beginning of the article
  });

  // Add smooth scrolling for anchor links (optional, but good UX)
  document.querySelectorAll('#article-toc a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });
}

// Optionally, initialize the TOC generation when the DOM is ready
document.addEventListener('DOMContentLoaded', generateTocAndAnchors);
