/**
 * Theme Toggle - Memory & Switch
 *
 * Features:
 * - Toggle between light and dark themes
 * - Remember user's theme preference in localStorage
 * - Respect system color scheme preference
 * - Support URL query override (?theme=dark|light|system)
 * - Update button icon based on current theme
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'xdlkc:theme';

  // Theme icons
  const ICONS = {
    light: '🌙',  // Moon icon (switch to dark)
    dark: '☀️'    // Sun icon (switch to light)
  };

  /**
   * Get saved theme preference from localStorage
   * @returns {string|null} 'light', 'dark', 'system', or null
   */
  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Get theme override from URL query parameter
   * @returns {string|null} 'dark', 'light', 'system', or null
   */
  function getUrlThemeOverride() {
    try {
      const params = new URLSearchParams(window.location && window.location.search ? window.location.search : '');
      const raw = params.get('theme');
      if (raw === 'dark' || raw === 'light' || raw === 'system') {
        return raw;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Check if system prefers dark mode
   * @returns {boolean}
   */
  function prefersDarkMode() {
    try {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      return false;
    }
  }

  /**
   * Determine the actual theme to apply
   * @param {string} mode - 'light', 'dark', or 'system'
   * @returns {string} 'light' or 'dark'
   */
  function resolveTheme(mode) {
    if (mode === 'dark' || mode === 'light') {
      return mode;
    }
    // mode === 'system' or fallback
    return prefersDarkMode() ? 'dark' : 'light';
  }

  /**
   * Apply theme to document
   * @param {string} theme - 'light' or 'dark'
   */
  function applyTheme(theme) {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.dataset.theme = theme;
    }
  }

  /**
   * Update button icon based on theme
   * @param {string} theme - 'light' or 'dark'
   */
  function updateButtonIcon(theme) {
    const button = document.querySelector('[data-theme-toggle]');
    if (button) {
      button.textContent = ICONS[theme] || ICONS.light;
    }
  }

  /**
   * Initialize theme on page load
   */
  function initTheme() {
    const urlOverride = getUrlThemeOverride();
    const savedMode = getSavedTheme();

    // URL override takes precedence (page-only, doesn't persist)
    const mode = urlOverride || savedMode || 'system';
    const theme = resolveTheme(mode);

    // Apply theme
    applyTheme(theme);

    // Update button icon
    updateButtonIcon(theme);

    // Update aria-pressed state
    const button = document.querySelector('[data-theme-toggle]');
    if (button) {
      button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
  }

  /**
   * Toggle theme between light and dark
   * @param {Event} event
   */
  function toggleTheme(event) {
    event.preventDefault();

    // Get current theme
    const currentTheme = document.documentElement.dataset.theme || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    // Apply new theme
    applyTheme(newTheme);

    // Update button icon
    updateButtonIcon(newTheme);

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (e) {
      // Silently fail if localStorage is not available
    }

    // Update aria-pressed state
    const button = document.querySelector('[data-theme-toggle]');
    if (button) {
      button.setAttribute('aria-pressed', newTheme === 'dark' ? 'true' : 'false');
    }
  }

  /**
   * Listen for system theme changes (only in system mode)
   */
  function initSystemThemeListener() {
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        const savedMode = getSavedTheme();
        if (savedMode === 'system' || !savedMode) {
          const newTheme = e.matches ? 'dark' : 'light';
          applyTheme(newTheme);
          updateButtonIcon(newTheme);
        }
      };

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      }
      // Fallback for older browsers
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
      }
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * Initialize theme toggle functionality
   */
  function initThemeToggle() {
    // Apply saved theme on page load
    initTheme();

    // Listen for system theme changes
    initSystemThemeListener();

    // Listen for button clicks
    const button = document.querySelector('[data-theme-toggle]');
    if (button) {
      button.addEventListener('click', toggleTheme);
    }
  }

  // Expose to global scope for testing
  window.ThemeToggle = {
    initThemeToggle,
    getSavedTheme,
    getUrlThemeOverride,
    prefersDarkMode,
    resolveTheme,
    applyTheme,
    updateButtonIcon,
    ICONS
  };

  // Auto-initialize when DOM is ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initThemeToggle);
    } else {
      initThemeToggle();
    }
  }
})();
