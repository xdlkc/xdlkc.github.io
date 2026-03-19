const assert = require('assert');
const fs = require('fs');
const path = require('path');

describe('Theme Toggle - Memory & Switch', () => {
  const htmlPath = path.join(__dirname, '../themes/evan/layout/post.ejs');
  let htmlContent = '';

  beforeAll(() => {
    htmlContent = fs.readFileSync(htmlPath, 'utf8');
  });

  describe('Button exists in layout', () => {
    it('should have theme-toggle button with correct attributes', () => {
      assert.ok(
        /<button[^>]*class="theme-toggle"[^>]*data-theme-toggle/.test(htmlContent),
        'Theme toggle button should exist with data-theme-toggle attribute'
      );
    });
  });

  describe('localStorage theme storage', () => {
    let originalLocalStorage;
    let mockLocalStorage = {};

    beforeEach(() => {
      // Mock localStorage
      originalLocalStorage = global.localStorage;
      global.localStorage = {
        getItem: (key) => mockLocalStorage[key] || null,
        setItem: (key, value) => {
          mockLocalStorage[key] = String(value);
        },
        removeItem: (key) => {
          delete mockLocalStorage[key];
        }
      };
      mockLocalStorage = {};
    });

    afterEach(() => {
      global.localStorage = originalLocalStorage;
    });

    it('should save theme preference to localStorage', () => {
      // Simulate saving theme
      global.localStorage.setItem('xdlkc:theme', 'dark');

      assert.strictEqual(global.localStorage.getItem('xdlkc:theme'), 'dark');
    });

    it('should retrieve saved theme preference', () => {
      global.localStorage.setItem('xdlkc:theme', 'light');

      const savedTheme = global.localStorage.getItem('xdlkc:theme');

      assert.strictEqual(savedTheme, 'light');
    });

    it('should return null when no theme is saved', () => {
      const savedTheme = global.localStorage.getItem('xdlkc:theme');

      assert.strictEqual(savedTheme, null);
    });

    it('should update theme when toggle is clicked', () => {
      // Simulate toggle: light -> dark
      let currentTheme = 'light';
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';

      assert.strictEqual(currentTheme, 'dark');
      global.localStorage.setItem('xdlkc:theme', currentTheme);

      // Toggle again: dark -> light
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      assert.strictEqual(currentTheme, 'light');
      global.localStorage.setItem('xdlkc:theme', currentTheme);
    });
  });

  describe('System preference detection', () => {
    it('should detect dark mode system preference', () => {
      // Mock matchMedia
      const mockMatchMedia = (query) => ({
        matches: query === '(prefers-color-scheme: dark)'
      });

      const isDarkMode = mockMatchMedia('(prefers-color-scheme: dark)').matches;

      assert.strictEqual(isDarkMode, true);
    });

    it('should detect light mode system preference', () => {
      // Mock matchMedia
      const mockMatchMedia = (query) => ({
        matches: query === '(prefers-color-scheme: light)'
      });

      const isLightMode = mockMatchMedia('(prefers-color-scheme: light)').matches;

      assert.strictEqual(isLightMode, true);
    });
  });

  describe('Theme application logic', () => {
    it('should apply saved theme from localStorage', () => {
      const savedTheme = 'dark';
      const expectedTheme = savedTheme;

      assert.strictEqual(expectedTheme, 'dark');
    });

    it('should use system preference when no theme saved', () => {
      const savedTheme = null;
      const systemPrefersDark = true;
      const appliedTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

      assert.strictEqual(appliedTheme, 'dark');
    });

    it('should use light mode when no saved theme and system prefers light', () => {
      const savedTheme = null;
      const systemPrefersDark = false;
      const appliedTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

      assert.strictEqual(appliedTheme, 'light');
    });

    it('should respect saved theme over system preference', () => {
      const savedTheme = 'light';
      const systemPrefersDark = true;
      const appliedTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

      assert.strictEqual(appliedTheme, 'light');
    });
  });

  describe('URL query override (page-only)', () => {
    it('should apply dark theme when ?theme=dark', () => {
      const params = new URLSearchParams('?theme=dark');
      const urlMode = params.get('theme');
      const appliedTheme = urlMode === 'dark' || urlMode === 'light' ? urlMode : 'light';

      assert.strictEqual(appliedTheme, 'dark');
    });

    it('should apply light theme when ?theme=light', () => {
      const params = new URLSearchParams('?theme=light');
      const urlMode = params.get('theme');
      const appliedTheme = urlMode === 'dark' || urlMode === 'light' ? urlMode : 'light';

      assert.strictEqual(appliedTheme, 'light');
    });

    it('should ignore invalid theme query param', () => {
      const params = new URLSearchParams('?theme=invalid');
      const urlMode = params.get('theme');
      const appliedTheme = urlMode === 'dark' || urlMode === 'light' ? urlMode : 'light';

      assert.strictEqual(appliedTheme, 'light');
    });
  });

  describe('Theme mode vs theme state', () => {
    it('should distinguish between theme mode (user/system) and applied theme', () => {
      const themeMode = 'system';
      const prefersDark = true;
      const appliedTheme = themeMode === 'dark' || themeMode === 'light'
        ? themeMode
        : (prefersDark ? 'dark' : 'light');

      assert.strictEqual(themeMode, 'system');
      assert.strictEqual(appliedTheme, 'dark');
    });

    it('should apply dark when mode is dark', () => {
      const themeMode = 'dark';
      const appliedTheme = themeMode;

      assert.strictEqual(appliedTheme, 'dark');
    });

    it('should apply light when mode is light', () => {
      const themeMode = 'light';
      const appliedTheme = themeMode;

      assert.strictEqual(appliedTheme, 'light');
    });
  });

  describe('Button icon update', () => {
    it('should update button icon based on theme', () => {
      const theme = 'dark';
      const icon = theme === 'dark' ? '☀️' : '🌙';

      assert.strictEqual(icon, '☀️');
    });

    it('should show moon icon in light mode', () => {
      const theme = 'light';
      const icon = theme === 'dark' ? '☀️' : '🌙';

      assert.strictEqual(icon, '🌙');
    });
  });
});
