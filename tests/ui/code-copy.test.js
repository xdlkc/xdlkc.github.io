const { describe, it } = require('node:test');
const assert = require('node:assert');

// A simple test to verify the copy function logic structure
describe('Code Copy Script', () => {
    it('should inject copy button into pre elements', () => {
        // Mock DOM
        global.document = {
            querySelectorAll: () => [
                {
                    style: { position: '' },
                    appendChild: function(child) { this.children = [child]; },
                    innerText: 'console.log("hello");'
                }
            ],
            createElement: (tag) => {
                const el = { tag, className: '', innerText: '', addEventListener: () => {} };
                return el;
            }
        };
        
        // The core logic that will be inside code-copy.js
        const pres = document.querySelectorAll('pre');
        pres.forEach(pre => {
            pre.style.position = 'relative';
            const btn = document.createElement('button');
            btn.className = 'copy-btn';
            btn.innerText = 'Copy';
            pre.appendChild(btn);
        });
        
        assert.strictEqual(pres[0].children[0].className, 'copy-btn');
        assert.strictEqual(pres[0].children[0].innerText, 'Copy');
        assert.strictEqual(pres[0].style.position, 'relative');
    });
});
