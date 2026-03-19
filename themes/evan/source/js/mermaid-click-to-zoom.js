/* Mermaid diagram click-to-zoom (lightbox) */

(function initMermaidClickToZoom({ document = globalThis.document } = {}) {
  if (!document?.querySelector) return;

  const MODAL_CLASS = 'mermaid-lightbox';
  const CONTENT_CLASS = 'mermaid-lightbox-content';
  const CLOSE_BUTTON_CLASS = 'mermaid-lightbox-close';
  const MERMAID_SELECTOR = '.mermaid';

  let activeModal = null;
  let originalFocusElement = null;

  function trapFocus(modalElement) {
    const focusableEls = modalElement.querySelectorAll(
      'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), [tabindex]:not([disabled]):not([tabindex="-1"])'
    );
    const firstFocusableEl = focusableEls[0];
    const lastFocusableEl = focusableEls[focusableEls.length - 1];

    modalElement.addEventListener('keydown', (e) => {
      const isTabPressed = e.key === 'Tab' || e.keyCode === 9;

      if (!isTabPressed) {
        return;
      }

      if (e.shiftKey) { // if shift key pressed for shift + tab
        if (document.activeElement === firstFocusableEl) {
          lastFocusableEl.focus(); // add focus to the last focusable element
          e.preventDefault();
        }
      } else { // if tab key is pressed
        if (document.activeElement === lastFocusableEl) {
          firstFocusableEl.focus(); // add focus to the first focusable element
          e.preventDefault();
        }
      }
    });

    firstFocusableEl?.focus();
  }

  function openMermaidLightbox(mermaidElement) {
    if (activeModal) return; // Only one modal at a time

    originalFocusElement = document.activeElement;

    const modal = document.createElement('div');
    modal.className = MODAL_CLASS;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Mermaid diagram zoomed view');

    // Clone SVG content
    const clone = mermaidElement.cloneNode(true);
    clone.id = ''; // Remove ID to prevent duplicate IDs

    const content = document.createElement('div');
    content.className = CONTENT_CLASS;
    content.appendChild(clone);

    const closeBtn = document.createElement('button');
    closeBtn.className = CLOSE_BUTTON_CLASS;
    closeBtn.textContent = '×'; // Unicode multiplication sign
    closeBtn.setAttribute('aria-label', 'Close zoomed view');

    const closeLightbox = () => {
      document.body.removeChild(modal);
      activeModal = null;
      if (originalFocusElement && originalFocusElement.focus) {
        originalFocusElement.focus();
      }
      document.removeEventListener('keydown', handleKeyDown);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      }
    };

    modal.appendChild(content);
    modal.appendChild(closeBtn);
    document.body.appendChild(modal);
    activeModal = modal;

    // Event listeners for closing
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target === content) {
        closeLightbox();
      }
    });
    closeBtn.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', handleKeyDown);

    // Trap focus inside the modal
    trapFocus(modal);
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
})();
