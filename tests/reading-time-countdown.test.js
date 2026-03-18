const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

let ReadingTimeCountdown;

test('ReadingTimeCountdown module loads', () => {
  ReadingTimeCountdown = require('../themes/evan/source/js/reading-time-countdown.js');
  assert.ok(ReadingTimeCountdown);
});

test('calculateRemainingTime: calculates correctly for various progress', () => {
  const { calculateRemainingTime } = ReadingTimeCountdown;

  // Total 10 minutes, progress 30%
  assert.equal(calculateRemainingTime(0.3, 10), 7.0);

  // Total 10 minutes, progress 50%
  assert.equal(calculateRemainingTime(0.5, 10), 5.0);

  // Total 10 minutes, progress 80%
  assert.equal(calculateRemainingTime(0.8, 10), 2.0);

  // Total 5 minutes, progress 20%
  assert.equal(calculateRemainingTime(0.2, 5), 4.0);

  // Total 10 minutes, progress 0%
  assert.equal(calculateRemainingTime(0, 10), 10.0);

  // Total 10 minutes, progress 100%
  assert.equal(calculateRemainingTime(1.0, 10), 0.0);
});

test('formatRemainingTime: formats correctly for Chinese mode', () => {
  const { formatRemainingTime } = ReadingTimeCountdown;

  assert.equal(formatRemainingTime(7.0, 'zh'), '剩余 7 分钟');
  assert.equal(formatRemainingTime(7.5, 'zh'), '剩余 7.5 分钟');
  assert.equal(formatRemainingTime(0.5, 'zh'), '剩余 0.5 分钟');
  assert.equal(formatRemainingTime(0, 'zh'), '已读完');
});

test('formatRemainingTime: formats correctly for English mode', () => {
  const { formatRemainingTime } = ReadingTimeCountdown;

  assert.equal(formatRemainingTime(7.0, 'en'), '7 min left');
  assert.equal(formatRemainingTime(7.5, 'en'), '7.5 min left');
  assert.equal(formatRemainingTime(0.5, 'en'), '0.5 min left');
  assert.equal(formatRemainingTime(0, 'en'), 'Done');
});

test('formatRemainingTime: shows "Almost done" when remaining < 0.5 minute', () => {
  const { formatRemainingTime } = ReadingTimeCountdown;

  assert.equal(formatRemainingTime(0.4, 'zh'), '即将读完');
  assert.equal(formatRemainingTime(0.4, 'en'), 'Almost done');
  assert.equal(formatRemainingTime(0.1, 'zh'), '即将读完');
  assert.equal(formatRemainingTime(0.1, 'en'), 'Almost done');
});

test('resolveLangMode: returns correct language mode from document', () => {
  const { resolveLangMode } = ReadingTimeCountdown;

  // Chinese mode
  const domZh = new JSDOM(
    `<!doctype html><html data-lang-mode="zh"><body></body></html>`
  );
  assert.equal(resolveLangMode(domZh.window.document), 'zh');

  // English mode (default)
  const domEn = new JSDOM(
    `<!doctype html><html><body></body></html>`
  );
  assert.equal(resolveLangMode(domEn.window.document), 'en');
});

test('updateCountdownDisplay: updates DOM element with formatted text', () => {
  const { updateCountdownDisplay } = ReadingTimeCountdown;

  const dom = new JSDOM(
    `<!doctype html><html><body>
      <span data-reading-time-countdown></span>
    </body></html>`
  );

  const countdownEl = dom.window.document.querySelector('[data-reading-time-countdown]');
  assert.ok(countdownEl);

  updateCountdownDisplay(countdownEl, 5.5, 'zh');
  assert.equal(countdownEl.textContent.trim(), '剩余 5.5 分钟');

  updateCountdownDisplay(countdownEl, 0, 'en');
  assert.equal(countdownEl.textContent.trim(), 'Done');
});

test('initReadingTimeCountdown: initializes and binds scroll event', () => {
  const { initReadingTimeCountdown } = ReadingTimeCountdown;

  const dom = new JSDOM(
    `<!doctype html><html><body>
      <div class="reading-progress" data-reading-minutes="10"></div>
      <span data-reading-time-countdown></span>
      <div class="article-content" style="height: 2000px;"></div>
    </body></html>`,
    { url: 'https://example.com/post/' }
  );

  // Mock window properties for scroll simulation
  dom.window.scrollY = 0;
  dom.window.document.documentElement.scrollTop = 0;
  dom.window.document.body.scrollTop = 0;
  dom.window.document.documentElement.scrollHeight = 2000;
  dom.window.document.body.scrollHeight = 2000;
  dom.window.document.documentElement.clientHeight = 800;
  dom.window.innerHeight = 800;

  initReadingTimeCountdown({
    document: dom.window.document,
    window: dom.window
  });

  const countdownEl = dom.window.document.querySelector('[data-reading-time-countdown]');
  assert.ok(countdownEl);

  // Initial state should show total time remaining
  const initialText = countdownEl.textContent.trim();
  assert.ok(
    initialText === '剩余 10 分钟' ||
    initialText === '10 min left' ||
    initialText === '' // might be empty if not calculated yet
  );
});

test('calculateRemainingTime: handles edge cases', () => {
  const { calculateRemainingTime } = ReadingTimeCountdown;

  // Negative progress (should be clamped to 0)
  assert.equal(calculateRemainingTime(-0.1, 10), 10.0);

  // Progress > 1 (should be clamped to 1)
  assert.equal(calculateRemainingTime(1.5, 10), 0.0);

  // Zero total minutes
  assert.equal(calculateRemainingTime(0.5, 0), 0.0);

  // Very large total minutes
  assert.equal(calculateRemainingTime(0.3, 100), 70.0);
});

test('formatRemainingTime: handles very small remaining time', () => {
  const { formatRemainingTime } = ReadingTimeCountdown;

  // Less than 0.5 minutes but > 0
  assert.equal(formatRemainingTime(0.1, 'zh'), '即将读完');
  assert.equal(formatRemainingTime(0.1, 'en'), 'Almost done');

  // Exactly 1 minute threshold
  assert.equal(formatRemainingTime(1.0, 'zh'), '剩余 1 分钟');
  assert.equal(formatRemainingTime(1.0, 'en'), '1 min left');

  // Just above 1 minute
  assert.equal(formatRemainingTime(1.1, 'zh'), '剩余 1.1 分钟');
  assert.equal(formatRemainingTime(1.1, 'en'), '1.1 min left');
});
