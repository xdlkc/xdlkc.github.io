/**
 * @jest-environment jsdom
 */

describe('Reward Toggle', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="reward-container">
        <button id="reward-toggle" data-reward-toggle aria-expanded="false">赏</button>
        <div id="reward-qr" class="reward-qr-codes" aria-hidden="true" style="display: none;">QR</div>
      </div>
    `;
    jest.resetModules();
    const { initRewardToggle } = require('../themes/evan/source/js/reward-toggle.js');
    initRewardToggle();
  });

  it('toggles QR codes visibility on click', () => {
    const btn = document.getElementById('reward-toggle');
    const qr = document.getElementById('reward-qr');

    btn.click();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(qr.getAttribute('aria-hidden')).toBe('false');
    expect(qr.classList.contains('is-expanded')).toBe(true);

    btn.click();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(qr.getAttribute('aria-hidden')).toBe('true');
    expect(qr.classList.contains('is-expanded')).toBe(false);
  });

  it('does nothing if container is missing', () => {
    document.body.innerHTML = '<div>No reward here</div>';
    expect(() => {
      const { initRewardToggle } = require('../themes/evan/source/js/reward-toggle.js');
      initRewardToggle();
    }).not.toThrow();
  });
});
