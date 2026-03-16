const { JSDOM } = require('jsdom');
const assert = require('assert');

describe('Reading Progress Bar', () => {
    it('should calculate scroll percentage correctly', () => {
        // Mock DOM
        const dom = new JSDOM(`<!DOCTYPE html><div id="reading-progress"></div><div id="content" style="height: 1000px"></div>`);
        const document = dom.window.document;
        const bar = document.getElementById('reading-progress');
        
        // Mock function
        function updateProgress(scrollTop, scrollHeight, clientHeight) {
            const percent = (scrollTop / (scrollHeight - clientHeight)) * 100;
            bar.style.width = percent + '%';
        }
        
        updateProgress(500, 1000, 0);
        assert.strictEqual(bar.style.width, '50%');
    });
});
