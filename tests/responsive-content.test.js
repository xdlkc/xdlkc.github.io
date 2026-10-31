const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const { enhanceResponsiveContent } = require('../scripts/responsive-content');

function body(html) {
  return new JSDOM(`<!doctype html><body>${html}</body>`).window.document.body;
}

test('responsive content wraps article tables in an accessible scroll container', () => {
  const result = body(enhanceResponsiveContent('<h2>Data</h2><table><thead><tr><th>Name</th></tr></thead></table>'));
  const wrapper = result.querySelector('.table-wrapper');

  assert.ok(wrapper);
  assert.equal(wrapper.getAttribute('role'), 'region');
  assert.equal(wrapper.getAttribute('tabindex'), '0');
  assert.equal(wrapper.querySelectorAll('table').length, 1);
  assert.equal(wrapper.querySelector('th').textContent, 'Name');
});

test('responsive content table wrapping is idempotent and ignores code tables', () => {
  const input = '<figure class="highlight"><table><tbody><tr><td>code</td></tr></tbody></table></figure><table></table>';
  const once = enhanceResponsiveContent(input);
  const twice = enhanceResponsiveContent(once);
  const result = body(twice);

  assert.equal(result.querySelectorAll('.table-wrapper').length, 1);
  assert.equal(result.querySelector('figure.highlight').closest('.table-wrapper'), null);
});

test('responsive content identifies standalone images without widening text paragraphs', () => {
  const result = body(enhanceResponsiveContent(`
    <p><img src="one.png" alt="One"></p>
    <p><a href="two.png"><img src="two.png" alt="Two"></a></p>
    <p>Diagram <img src="inline.png" alt="Inline"></p>
  `));
  const paragraphs = result.querySelectorAll('p');

  assert.ok(paragraphs[0].classList.contains('article-image'));
  assert.ok(paragraphs[1].classList.contains('article-image'));
  assert.ok(!paragraphs[2].classList.contains('article-image'));
});

test('responsive content preserves unrelated markup', () => {
  const input = '<p>Plain <strong>text</strong></p>';
  assert.equal(enhanceResponsiveContent(input), input);
  assert.equal(enhanceResponsiveContent(''), '');
});
