function generateBreadcrumbData(url, title, category) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://xdlkc.github.io/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": category || "Blog",
        "item": `https://xdlkc.github.io/categories/${(category || '').toLowerCase()}/`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": title,
        "item": url
      }
    ]
  };
  return JSON.stringify(data);
}

module.exports = { generateBreadcrumbData };