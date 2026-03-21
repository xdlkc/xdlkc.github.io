// tests/code-copy-button.test.js

const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

let dom;
let document;
let window;
let navigator;
let CodeCopy; // Declare CodeCopy here

function setupDom() {
    dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
        <body>
            <div class="article-content"> <!-- Added article-content wrapper -->
                <div id="test-container">
                    <pre><code class="language-javascript">console.log('Hello World 1');</code></pre>
                    <pre><code class="language-python">print('Hello World 2')</code></pre>
                    <pre><code>Plain code block</code></pre>
                    <div>
                        <pre><code>Another code block in a div</code></pre>
                    </div>
                    <p>Some other content</p>
                </div>
            </div>
        </body>
        </html>
    `, { url: "http://localhost", runScripts: "dangerously", resources: "usable" }); // Enable script execution

    window = dom.window;
    document = window.document;
    navigator = window.navigator;

    // Load code-copy.js into the JSDOM window context
    const codeCopyScript = fs.readFileSync(path.resolve(__dirname, '../js/code-copy.js'), 'utf8');
    window.eval(codeCopyScript);
    CodeCopy = window.CodeCopy; // Get the exported CodeCopy from the JSDOM window

    // Mock Clipboard API for JSDOM
    window.clipboardHistory = []; // Expose on window
    Object.defineProperty(navigator, 'clipboard', {
        value: {
            writeText: (text) => {
                window.clipboardHistory.push(text); // Use window.clipboardHistory
                return Promise.resolve();
            },
            readText: () => Promise.resolve(window.clipboardHistory[window.clipboardHistory.length - 1] || ''), // Use window.clipboardHistory
        },
        writable: true
    });

    // Mock setTimeout and clearTimeout within the JSDOM window for testing
    // JSDOM has its own timers, but the module might be capturing Node.js globals.
    // By assigning them to window, the module (once evaluated within JSDOM context)
    // should use these.
    window.setTimeout = (...args) => global.setTimeout(...args);
    window.clearTimeout = (...args) => global.clearTimeout(...args);
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function test(name, fn) {
    try {
        // Run async tests
        const result = fn();
        if (result && typeof result.then === 'function') {
            result.then(() => console.log(`✅ ${name}`)).catch((error) => {
                console.error(`❌ ${name}`);
                console.error(error);
                process.exit(1);
            });
        } else {
            console.log(`✅ ${name}`);
        }
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(error);
        process.exit(1); // 失败时退出
    }
}

test('should add a copy button to each code block', () => {
    setupDom();
    CodeCopy.initCodeCopy({ root: document }); // Call the actual feature init function

    const codeBlocks = document.querySelectorAll('pre code');
    assert(codeBlocks.length > 0, 'Should have code blocks to test');

    codeBlocks.forEach((codeBlock, index) => {
        const parentPre = codeBlock.parentElement;
        const copyButton = parentPre.querySelector('.code-copy-button');
        assert(copyButton !== null, `Code block ${index} should have a copy button`);
        assert(copyButton.textContent === '复制代码', `Button text for block ${index} should be '复制代码'`); // Assuming default lang is 'zh'
    });
});

test('should copy code block content to clipboard on click', async () => {
    setupDom();
    CodeCopy.initCodeCopy({ root: document }); // Call the actual feature init function

    const codeBlocks = document.querySelectorAll('pre code');
    assert(codeBlocks.length > 0, 'Should have code blocks to test');

    for (let i = 0; i < codeBlocks.length; i++) {
        const codeBlock = codeBlocks[i];
        const parentPre = codeBlock.parentElement;
        const copyButton = parentPre.querySelector('.code-copy-button');

        console.log(`Test Block ${i}: `);
        console.log(`  Expected text: '${codeBlock.textContent}'`);

        assert(copyButton !== null, `Copy button for block ${i} should exist before click simulation`);

        copyButton.click(); // Simulate click
        await new Promise(resolve => setTimeout(resolve, 5)); // Small delay

        const expectedText = codeBlock.textContent;
        const copiedText = await navigator.clipboard.readText();
        console.log(`  Copied text: '${copiedText}'`);
        assert(copiedText === expectedText, `Copied text for block ${i} should be '${expectedText}' but got '${copiedText}'`);
    }
});

test('should show "Copied!" message after successful copy', async () => {
    setupDom();
    CodeCopy.initCodeCopy({ root: document });

    const codeBlock = document.querySelector('pre code');
    const parentPre = codeBlock.parentElement;
    const copyButton = parentPre.querySelector('.code-copy-button');

    assert(copyButton !== null, 'Copy button should exist before click simulation');
    assert(copyButton.textContent === '复制代码', 'Initial button text should be "复制代码"');

    copyButton.click(); // Simulate click

    // The button text changes after copy. This is a direct user-perceivable change.
    // The flashCopiedClass primarily adds a visual effect (class).
    // We expect the button text to change to '已复制（X 行）' temporarily.
    // The setTimeout for reverting the button text to '复制代码' happens after 1200ms.
    // For this test, we check the immediate change after click.
    await new Promise(resolve => setTimeout(resolve, 0)); // Yield to allow promises to resolve
    assert(copyButton.textContent.startsWith('已复制'), 'Button text should temporarily show "已复制" message');
});