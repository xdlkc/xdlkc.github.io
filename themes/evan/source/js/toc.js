// themes/evan/source/js/toc.js

(() => {
  const tocContainer = document.getElementById('toc-container');
  if (!tocContainer) {
    return; // No TOC container, do nothing
  }

  const tocLinks = tocContainer.querySelectorAll('nav ul li a');
  if (tocLinks.length === 0) {
    tocContainer.style.display = 'none'; // Hide TOC if no links
    return;
  }

  const headings = Array.from(tocLinks).map(link => {
    const id = link.getAttribute('href').substring(1);
    return document.getElementById(id);
  }).filter(Boolean); // Filter out nulls if heading not found

  // Smooth scroll for TOC links
  tocContainer.addEventListener('click', (event) => {
    const target = event.target;
    if (target.tagName === 'A' && target.hash) {
      const heading = document.getElementById(target.hash.substring(1));
      if (heading) {
        event.preventDefault();
        window.scrollTo({
          top: heading.offsetTop,
          behavior: 'smooth'
        });
      }
    }
  });

  // Highlight active TOC item on scroll
  // rootMargin adjusted to make highlight occur when heading is closer to the top of the viewport
  const observerOptions = {
    root: null, // viewport
    rootMargin: '-10% 0px -80% 0px', // top 10% and bottom 80% are 'intersecting'
    threshold: 0,
  };

  let activeTocLink = null;
  let headingToLinkMap = new Map();
  headings.forEach(heading => {
    if (heading) {
      const correspondingTocLink = tocContainer.querySelector(`a[href="#${heading.id}"]`);
      if (correspondingTocLink) {
        headingToLinkMap.set(heading, correspondingTocLink.closest('li'));
      }
    }
  });

  const observerCallback = (entries, observer) => {
    entries.forEach(entry => {
      const listItem = headingToLinkMap.get(entry.target);
      if (!listItem) return;

      if (entry.isIntersecting) {
        if (activeTocLink) {
          activeTocLink.classList.remove('active');
        }
        listItem.classList.add('active');
        activeTocLink = listItem;
      } else {
        if (listItem.classList.contains('active') && activeTocLink === listItem) {
          listItem.classList.remove('active');
          activeTocLink = null;
        }
      }
    });
  };

  const observer = new IntersectionObserver(observerCallback, observerOptions);

  headings.forEach(heading => {
    if (heading) {
      observer.observe(heading);
    }
  });

})();