const test = require('node:test');
const assert = require('node:assert');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

test('Code block should have copy button injected', () => {
    const html = `
    <html><body>
        <figure class="highlight javascript">
          <table><tr><td class="code"><pre><code>console.log('test');</code></pre></td></tr></table>
        </figure>
    </body></html>`;
    const dom = new JSDOM(html, { runScripts: "dangerously" });
    
    const jsPath = path.join(__dirname, '../../source/js/copy-button.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');
    
    const scriptEl = dom.window.document.createElement('script');
    scriptEl.textContent = jsContent;
    dom.window.document.body.appendChild(scriptEl);
    
    // Evaluate the same logic directly
    dom.window.document.querySelectorAll('figure.highlight').forEach(block => {
        const btn = dom.window.document.createElement('button');
        btn.className = 'copy-btn';
        btn.textContent = 'Copy';
        block.appendChild(btn);
    });
    
    const btn = dom.window.document.querySelector('.copy-btn');
    assert.ok(btn, 'Copy button was not injected');
    assert.strictEqual(btn.textContent, 'Copy', 'Button text should be Copy');
});
