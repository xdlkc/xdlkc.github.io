
describe('Article TOC Generation', () => {
  test('should correctly parse H2 and H3 headings and generate a hierarchical TOC data structure', () => {
    // Mock HTML content
    const htmlContent = `
      <h1 id="intro">Introduction</h1>
      <h2 id="section-1">Section 1: Overview</h2>
      <p>Some text for section 1.</p>
      <h3 id="subsection-1-1">1.1 Sub-section A</h3>
      <p>More text.</p>
      <h3 id="subsection-1-2">1.2 Sub-section B</h3>
      <h2 id="section-2">Section 2: Details</h2>
      <p>More details.</p>
      <h3 id="subsection-2-1">2.1 Sub-section C</h3>
      <h2 id="section-3">Section 3: Conclusion</h2>
    `;

    // Expected TOC structure
    const expectedToc = [
      { level: 2, text: 'Section 1: Overview', id: 'section-1', children: [
        { level: 3, text: '1.1 Sub-section A', id: 'subsection-1-1', children: [] },
        { level: 3, text: '1.2 Sub-section B', id: 'subsection-1-2', children: [] },
      ]},
      { level: 2, text: 'Section 2: Details', id: 'section-2', children: [
        { level: 3, text: '2.1 Sub-section C', id: 'subsection-2-1', children: [] },
      ]},
      { level: 2, text: 'Section 3: Conclusion', id: 'section-3', children: [] },
    ];

    // This function will be implemented later
    // For now, it's expected to fail because generateTocData is not defined or incorrect
    const generateTocData = require('../scripts/utils/toc-generator'); // Assuming this path

    const actualToc = generateTocData(htmlContent);
    expect(actualToc).toEqual(expectedToc);
  });
});
