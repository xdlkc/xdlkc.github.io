/**
 * @jest-environment jsdom
 */
const { initCodeLangLabel, getLanguageName } = require('../themes/evan/source/js/code-lang-label.js');

describe('Code Language Label', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="article-content">
        <figure class="highlight javascript">
          <table><tr><td class="code"><pre><span class="line">console.log();</span></pre></td></tr></table>
        </figure>
        <figure class="highlight plain">
          <table><tr><td class="code"><pre><span class="line">no lang</span></pre></td></tr></table>
        </figure>
      </div>
    `;
  });

  test('extracts language correctly', () => {
    const figure = document.querySelector('.highlight.javascript');
    expect(getLanguageName(figure)).toBe('javascript');
  });

  test('skips injecting label for plain text', () => {
    initCodeLangLabel({ document });
    const plainFigure = document.querySelector('.highlight.plain');
    expect(plainFigure.querySelector('.code-lang-label')).toBeNull();
  });

  test('injects label element into javascript figure', () => {
    initCodeLangLabel({ document });
    const jsFigure = document.querySelector('.highlight.javascript');
    const label = jsFigure.querySelector('.code-lang-label');
    expect(label).toBeTruthy();
    expect(label.textContent).toBe('javascript');
    
    // Test idempotency
    initCodeLangLabel({ document });
    expect(jsFigure.querySelectorAll('.code-lang-label').length).toBe(1);
  });
});
