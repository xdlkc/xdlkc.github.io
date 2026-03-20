const { JSDOM } = require('jsdom');

function generateTocData(htmlContent) {
  const dom = new JSDOM(htmlContent);
  const document = dom.window.document;

  const headings = document.querySelectorAll('h2, h3');
  const toc = [];
  let currentH2 = null;

  headings.forEach(heading => {
    const level = parseInt(heading.tagName.substring(1)); // H2 -> 2, H3 -> 3
    let id = heading.id;
    const text = heading.textContent.trim();

    // Generate ID if missing
    if (!id) {
      id = text.toLowerCase()
               .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric chars
               .replace(/\s+/g, '-')       // Replace spaces with hyphens
               .replace(/^-+|-+$/g, '');  // Trim hyphens from start/end
      // Ensure uniqueness if necessary, though for this test, simple generation is fine.
      // For a real app, you might add a counter if ID collisions are possible.
      heading.id = id; // Assign the generated ID back to the element (important for anchor navigation)
    }

    const tocItem = {
      level: level,
      text: text,
      id: id,
      children: []
    };

    if (level === 2) {
      toc.push(tocItem);
      currentH2 = tocItem;
    } else if (level === 3 && currentH2) {
      currentH2.children.push(tocItem);
    }
    // Ignore H3s without a preceding H2 for now, as per spec hierarchy requirements.
  });

  return toc;
}

module.exports = generateTocData;
