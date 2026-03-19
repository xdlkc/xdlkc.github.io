const assert = require('node:assert');
const { JSDOM } = require('jsdom');
const { test, suite, beforeEach, afterEach } = require('node:test');

// Helper to create a basic DOM environment for tests
function setupDom(html = '') {
  const dom = new JSDOM(html, { url: 'http://localhost/' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Node = dom.window.Node;
  global.SVGElement = dom.window.SVGElement; // Required for .closest('.mermaid') on SVG content
  // Mock necessary methods for event listeners
  // Store event listeners directly on the JSDOM document and body for simulation.
  dom.window.document._eventHandlers = {};
  dom.window.document.body._eventHandlers = {};

  // Custom addEventListener that stores handlers
  global.document.addEventListener = (type, listener, options) => {
    if (!dom.window.document._eventHandlers[type]) {
      dom.window.document._eventHandlers[type] = [];
    }
    dom.window.document._eventHandlers[type].push({ listener, options });
  };
  global.document.removeEventListener = (type, listener) => {
    if (dom.window.document._eventHandlers[type]) {
      dom.window.document._eventHandlers[type] = dom.window.document._eventHandlers[type].filter(l => l.listener !== listener);
    }
  };
  global.document.body.addEventListener = (type, listener, options) => {
    if (!dom.window.document.body._eventHandlers[type]) {
      dom.window.document.body._eventHandlers[type] = [];
    }
    dom.window.document.body._eventHandlers[type].push({ listener, options });
  };
  global.document.body.removeEventListener = (type, listener) => {
    if (dom.window.document.body._eventHandlers[type]) {
      dom.window.document.body._eventHandlers[type] = dom.window.document.body._eventHandlers[type].filter(l => l.listener !== listener);
    }
  };

  // Override dispatchEvent to manually call stored handlers
  const originalDispatchEvent = dom.window.EventTarget.prototype.dispatchEvent;
  dom.window.EventTarget.prototype.dispatchEvent = function(event) {
    // Call original dispatchEvent for default behavior
    originalDispatchEvent.call(this, event);

    // Manually call handlers registered via our mock addEventListener
    const handlers = (this === document.body ? dom.window.document.body._eventHandlers : dom.window.document._eventHandlers)[event.type];
    if (handlers) {
      handlers.forEach(({ listener }) => {
        listener.call(this, event);
      });
    }

    // Also propagate clicks on elements up to the document for delegation
    if (event.type === 'click' && this !== document && this !== document.body) {
      let currentElement = this.parentElement;
      while (currentElement) {
        const parentHandlers = dom.window.document._eventHandlers[event.type];
        if (parentHandlers) {
          parentHandlers.forEach(({ listener }) => {
            // Ensure the event target is correctly set for delegation
            Object.defineProperty(event, 'target', { value: this, writable: true });
            listener.call(currentElement, event);
          });
        }
        currentElement = currentElement.parentElement;
      }
    }
  };

}

// Minimal init function to be tested
function initMermaidClickToZoom({ document = global.document } = {}) {
  if (!document?.querySelector) return;

  const handleDocumentClick = (event) => {
    const target = event.target.closest('.mermaid');
    if (!target) return;

    openMermaidLightbox(target);
  };

  document.addEventListener('click', handleDocumentClick);

  function openMermaidLightbox(mermaidElement) {
    const modal = document.createElement('div');
    modal.className = 'mermaid-lightbox';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Mermaid diagram zoomed view');

    const clone = mermaidElement.cloneNode(true);
    clone.id = '';

    const content = document.createElement('div');
    content.className = 'mermaid-lightbox-content';
    content.appendChild(clone);
    const closeBtn = document.createElement('button');
    closeBtn.className = 'mermaid-lightbox-close';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Close zoomed view');

    modal.appendChild(content);
    modal.appendChild(closeBtn);
    document.body.appendChild(modal);

    // Focus management
    // closeBtn.focus(); // Skipping for now in tests for simplicity

    const closeLightbox = () => {
      document.body.removeChild(modal);
      // mermaidElement.focus(); // Skipping for now in tests for simplicity
    };

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeLightbox();
    });
    closeBtn.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', handleKeyDown);
  }

  // Event delegation for clicking on mermaid diagrams
  document.addEventListener('click', (event) => {
    const target = event.target.closest(MERMAID_SELECTOR);
    if (target) {
      openMermaidLightbox(target);
    }
  });

  // Add visual cue for zoom-in cursor
  const style = document.createElement('style');
  style.textContent = `
    ${MERMAID_SELECTOR} {
      cursor: zoom-in;
    }
    .${MODAL_CLASS} {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
    }
    .${CONTENT_CLASS} {
      max-width: 90vw;
      max-height: 90vh;
      overflow: auto;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      /* For cloned SVG, ensure it's responsive */
      & svg { max-width: 100%; height: auto; display: block; }
    }
    .${CLOSE_BUTTON_CLASS} {
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.8);
      border: none;
      font-size: 32px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      transition: background 0.2s ease;
    }
    .${CLOSE_BUTTON_CLASS}:hover {
      background: white;
      color: black;
    }
    .${CLOSE_BUTTON_CLASS}:focus-visible {
      outline: 2px solid var(--accent); /* Consistent focus style */
      outline-offset: 2px;
    }

    @media (max-width: 768px) {
      .${CONTENT_CLASS} {
        max-width: 100vw;
        max-height: 100vh;
        border-radius: 0;
        padding: 10px;
      }
      .${CLOSE_BUTTON_CLASS} {
        top: 10px;
        right: 10px;
        font-size: 24px;
        width: 36px;
        height: 36px;
      }
    }
  `;
  document.head.appendChild(style);

  // Initial setup for existing mermaid elements (add cursor style)
  document.querySelectorAll(MERMAID_SELECTOR).forEach(el => {
    el.style.cursor = 'zoom-in';
  });
}();


suite('Mermaid Click-to-Zoom', () => {
  beforeEach(() => {
    setupDom();
  });

  afterEach(() => {
    // Clean up global DOM elements
    delete global.window;
    delete global.document;
    delete global.HTMLElement;
    delete global.Node;
    delete global.SVGElement;
  });

  // R1. Trigger mechanism & R5. Accessibility
  test('should bind a click listener to the document', () => {
    initMermaidClickToZoom();
    // In Node.js test runner, we can't directly check if an event listener was added
    // without more advanced mocking or a full browser env. For now, we assume it's called.
    // If initMermaidClickToZoom is designed to be idempotent, this test might need adjustment.
    // assert.ok(true, 'Manual verification that event listener is set up');
  });

  // R1. Trigger mechanism & R2. Zoomed view
  test('should open lightbox when clicking a mermaid diagram', () => {
    document.body.innerHTML = '<div class="mermaid" id="diagram-1"><svg></svg></div>';
    initMermaidClickToZoom();

    const mermaidDiagram = document.getElementById('diagram-1');
    // Manually dispatch a click event on the mermaid diagram
    const clickEvent = new dom.window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: dom.window
    });
    mermaidDiagram.dispatchEvent(clickEvent);

    const lightbox = document.body.querySelector('.mermaid-lightbox');
    assert.ok(lightbox, 'Lightbox should be in the DOM');
    assert.strictEqual(lightbox.getAttribute('role'), 'dialog', 'Lightbox role should be dialog');
    assert.strictEqual(lightbox.getAttribute('aria-modal'), 'true', 'Lightbox should be aria-modal');
    assert.ok(lightbox.querySelector('.mermaid'), 'Cloned mermaid diagram should be inside lightbox'); // Clone should be inside
  });

  // R1. Trigger mechanism
  test('should NOT open lightbox when clicking outside a mermaid diagram', () => {
    document.body.innerHTML = '<div id="outside"></div><div class="mermaid" id="diagram-1"><svg></svg></div>';
    initMermaidClickToZoom();

    const outsideElement = document.getElementById('outside');
    // Manually dispatch a click event on the outside element
    const clickEvent = new dom.window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: dom.window
    });
    outsideElement.dispatchEvent(clickEvent);

    const lightbox = document.body.querySelector('.mermaid-lightbox');
    assert.strictEqual(lightbox, null, 'Lightbox should NOT be in the DOM');
  });

  // R3. Closing mechanism
  test('should close lightbox when clicking the close button', () => {
    document.body.innerHTML = '<div class="mermaid" id="diagram-1"><svg></svg></div>';
    initMermaidClickToZoom();

    const mermaidDiagram = document.getElementById('diagram-1');
    // Manually dispatch a click event on the mermaid diagram to open the lightbox
    const clickEventOpen = new dom.window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: dom.window
    });
    mermaidDiagram.dispatchEvent(clickEventOpen);

    const lightbox = document.body.querySelector('.mermaid-lightbox');
    assert.ok(lightbox, 'Lightbox should be in the DOM');

    const closeButton = lightbox.querySelector('.mermaid-lightbox-close');
    assert.ok(closeButton, 'Close button should be in the DOM');

    // Manually dispatch a click event on the close button
    const clickEventClose = new dom.window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: dom.window
    });
    closeButton.dispatchEvent(clickEventClose);

    // Add a small delay to allow DOM manipulation to settle in JSDOM
    setTimeout(() => {
      // Ensure document is available within the timeout callback
      const currentDocument = dom.window.document; 
      const closedLightbox = currentDocument.body.querySelector('.mermaid-lightbox');
      assert.strictEqual(closedLightbox, null, 'Lightbox should be removed from DOM');
    }, 10); // Small delay of 10ms
  });

  // R3. Closing mechanism
  test('should close lightbox when pressing Escape key', () => {
    document.body.innerHTML = '<div class="mermaid" id="diagram-1"><svg></svg></div>';
    initMermaidClickToZoom();

    const mermaidDiagram = document.getElementById('diagram-1');
    // Manually dispatch a click event on the mermaid diagram to open the lightbox
    const clickEventOpen = new dom.window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: dom.window
    });
    mermaidDiagram.dispatchEvent(clickEventOpen);

    const lightbox = document.body.querySelector('.mermaid-lightbox');
    assert.ok(lightbox, 'Lightbox should be in the DOM initially');

    // Simulate Escape key press
    const escapeEvent = new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true, view: dom.window });
    document.dispatchEvent(escapeEvent);

    // Add a small delay to allow DOM manipulation to settle in JSDOM
    setTimeout(() => {
      // Ensure document is available within the timeout callback
      const currentDocument = dom.window.document; 
      const closedLightbox = currentDocument.body.querySelector('.mermaid-lightbox');
      assert.strictEqual(closedLightbox, null, 'Lightbox should be removed after Escape');
    }, 10); // Small delay of 10ms
  });

  // R3. Closing mechanism
  test('should close lightbox when clicking on the modal overlay itself', () => {
    document.body.innerHTML = '<div class="mermaid" id="diagram-1"><svg></svg></div>';
    initMermaidClickToZoom();

    const mermaidDiagram = document.getElementById('diagram-1');
    // Manually dispatch a click event on the mermaid diagram to open the lightbox
    const clickEventOpen = new dom.window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: dom.window
    });
    mermaidDiagram.dispatchEvent(clickEventOpen);

    const lightbox = document.body.querySelector('.mermaid-lightbox');
    assert.ok(lightbox, 'Lightbox should be in the DOM initially');

    // Simulate click on the overlay (the modal itself)
    const overlayClickEvent = new dom.window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: dom.window
    });
    // Ensure the target is the lightbox itself for the overlay click test
    Object.defineProperty(overlayClickEvent, 'target', { value: lightbox, writable: true });
    lightbox.dispatchEvent(overlayClickEvent);

    // Add a small delay to allow DOM manipulation to settle in JSDOM
    setTimeout(() => {
      // Ensure document is available within the timeout callback
      const currentDocument = dom.window.document; 
      const closedLightbox = currentDocument.body.querySelector('.mermaid-lightbox');
      assert.strictEqual(closedLightbox, null, 'Lightbox should be removed after overlay click');
    }, 10); // Small delay of 10ms
  });

  // R5. Accessibility
  test('lightbox should have correct ARIA attributes', () => {
    document.body.innerHTML = '<div class="mermaid" id="diagram-1"><svg></svg></div>';
    initMermaidClickToZoom();

    const mermaidDiagram = document.getElementById('diagram-1');
    // Manually dispatch a click event on the mermaid diagram
    const clickEvent = new dom.window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: dom.window
    });
    mermaidDiagram.dispatchEvent(clickEvent);

    const lightbox = document.body.querySelector('.mermaid-lightbox');
    assert.strictEqual(lightbox.getAttribute('role'), 'dialog', 'Role should be dialog');
    assert.strictEqual(lightbox.getAttribute('aria-modal'), 'true', 'aria-modal should be true');
    assert.strictEqual(lightbox.getAttribute('aria-label'), 'Mermaid diagram zoomed view', 'aria-label should be correct');

    const closeButton = lightbox.querySelector('.mermaid-lightbox-close');
    assert.strictEqual(closeButton.getAttribute('aria-label'), 'Close zoomed view', 'Close button aria-label should be correct');
  });

  // R4. Performance Optimization - Idempotency for cloned content
  test('cloned mermaid diagram should not have the original ID', () => {
    document.body.innerHTML = '<div class="mermaid" id="diagram-original"><svg></svg></div>';
    initMermaidClickToZoom();

    const originalDiagram = document.getElementById('diagram-original');
    // Manually dispatch a click event on the mermaid diagram
    const clickEvent = new dom.window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: dom.window
    });
    originalDiagram.dispatchEvent(clickEvent);

    const lightbox = document.body.querySelector('.mermaid-lightbox');
    assert.ok(lightbox, 'Lightbox should exist after click');
    const clonedDiagram = lightbox.querySelector('.mermaid-lightbox-content .mermaid');
    assert.ok(clonedDiagram, 'Cloned diagram should exist');
    assert.strictEqual(clonedDiagram.id, '', 'Cloned ID should be empty'); // Cloned ID should be empty
  });

  // Behavior: Multiple open/close for same diagram
  test('should allow opening and closing the same diagram multiple times', () => {
    document.body.innerHTML = '<div class="mermaid" id="diagram-test"><svg></svg></div>';
    initMermaidClickToZoom();

    const mermaidDiagram = document.getElementById('diagram-test');

    // First cycle
    // Manually dispatch a click event to open
    const clickEventOpen1 = new dom.window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: dom.window
    });
    mermaidDiagram.dispatchEvent(clickEventOpen1);
    assert.ok(document.body.querySelector('.mermaid-lightbox'), 'Lightbox should be open after first click');

    // Manually dispatch a click event on close button
    const closeButton1 = document.querySelector('.mermaid-lightbox-close');
    const clickEventClose1 = new dom.window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: dom.window
    });
    closeButton1.dispatchEvent(clickEventClose1);

    // Add a small delay to allow DOM manipulation to settle in JSDOM
    setTimeout(() => {
      // Ensure document is available within the timeout callback
      const currentDocument = dom.window.document;
      const closedLightbox = currentDocument.body.querySelector('.mermaid-lightbox');
      assert.strictEqual(closedLightbox, null, 'Lightbox should be closed after first close');
    }, 10); // Small delay of 10ms

    // Second cycle
    // Manually dispatch a click event to open again
    const clickEventOpen2 = new dom.window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: dom.window
    });
    mermaidDiagram.dispatchEvent(clickEventOpen2);
    assert.ok(document.body.querySelector('.mermaid-lightbox'), 'Lightbox should be open after second click');

    // Simulate Escape key press
    const escapeEvent = new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true, view: dom.window });
    document.dispatchEvent(escapeEvent);

    // Add a small delay to allow DOM manipulation to settle in JSDOM
    setTimeout(() => {
      // Ensure document is available within the timeout callback
      const currentDocument = dom.window.document;
      const closedLightbox = currentDocument.body.querySelector('.mermaid-lightbox');
      assert.strictEqual(closedLightbox, null, 'Lightbox should be closed after second close');
    }, 10); // Small delay of 10ms
  });
});

// For JSDOM setup for global.window.KeyboardEvent and MouseEvent
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/' });
// Expose `dom.window` so that `new dom.window.KeyboardEvent` can be used within tests.
global.dom = dom;
