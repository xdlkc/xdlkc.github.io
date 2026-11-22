/* Mobile Navigation Drawer Controller
 *
 * - Manages accessible hamburger toggle (aria-expanded, aria-controls) on <= 768px viewports.
 * - Closes on Escape key, outside click, nav link click, mobile search click, or resize > 768px.
 * - Exposes window.MobileNav in browser; exports for Node tests.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MobileNav = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const MOBILE_BREAKPOINT = 768;

  function setDrawerState(nav, toggleBtn, menu, isOpen) {
    const open = Boolean(isOpen);
    nav.classList?.toggle('is-open', open);
    menu.classList?.toggle('is-open', open);
    if (nav.dataset) {
      nav.dataset.mobileNavOpen = open ? 'true' : 'false';
    }
    toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function isDrawerOpen(nav, toggleBtn) {
    if (toggleBtn?.getAttribute) {
      return toggleBtn.getAttribute('aria-expanded') === 'true';
    }
    return Boolean(nav?.classList?.contains('is-open'));
  }

  function initMobileNav({ root = document, breakpoint = MOBILE_BREAKPOINT } = {}) {
    if (!root?.querySelectorAll) return [];

    const win = root.defaultView || globalThis;
    const navs = Array.from(root.querySelectorAll('[data-mobile-nav]'));
    const controllers = [];

    navs.forEach((nav) => {
      const toggleBtn = nav.querySelector('[data-mobile-nav-toggle]');
      const menu = nav.querySelector('[data-mobile-nav-menu]');
      if (!toggleBtn || !menu) return;

      if (nav.getAttribute('data-mobile-nav-bound') === '1') {
        return;
      }
      nav.setAttribute('data-mobile-nav-bound', '1');

      const open = () => setDrawerState(nav, toggleBtn, menu, true);
      const close = ({ restoreFocus = false } = {}) => {
        if (!isDrawerOpen(nav, toggleBtn)) return;
        setDrawerState(nav, toggleBtn, menu, false);
        if (restoreFocus && typeof toggleBtn.focus === 'function') {
          toggleBtn.focus();
        }
      };
      const toggle = () => {
        if (isDrawerOpen(nav, toggleBtn)) {
          close();
        } else {
          open();
        }
      };

      // Initialize closed state explicitly.
      setDrawerState(nav, toggleBtn, menu, false);

      toggleBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        toggle();
      });

      // Close drawer when clicking a navigation link inside the menu.
      menu.addEventListener('click', (event) => {
        const target = event.target;
        const link = target && typeof target.closest === 'function'
          ? target.closest('a[href]')
          : null;
        if (link && menu.contains(link)) {
          close();
        }
      });

      // Close drawer if mobile search trigger is clicked.
      const mobileSearch = nav.querySelector('.nav-mobile-search[data-site-search-trigger]');
      if (mobileSearch) {
        mobileSearch.addEventListener('click', () => {
          close();
        });
      }

      // Close drawer on Escape key.
      root.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isDrawerOpen(nav, toggleBtn)) {
          close({ restoreFocus: true });
        }
      });

      // Close drawer when clicking outside the nav element.
      root.addEventListener('click', (event) => {
        if (!isDrawerOpen(nav, toggleBtn)) return;
        if (event.target && !nav.contains(event.target)) {
          close();
        }
      });

      // Close drawer if viewport expands past mobile breakpoint.
      win.addEventListener?.('resize', () => {
        const width = Number(win.innerWidth || 0);
        if (width > breakpoint && isDrawerOpen(nav, toggleBtn)) {
          close();
        }
      }, { passive: true });

      controllers.push({ nav, toggleBtn, menu, open, close, toggle, isOpen: () => isDrawerOpen(nav, toggleBtn) });
    });

    return controllers;
  }

  return {
    MOBILE_BREAKPOINT,
    setDrawerState,
    isDrawerOpen,
    initMobileNav
  };
});
