/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');
const PostAudioPlayer = require('../themes/evan/source/js/post-audio-player');

describe('PostAudioPlayer', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="post-audio-player" data-post-audio-player data-audio-mode="podcast">
        <audio class="post-audio-element" data-audio-el src="/uploads/demo/audio.mp3"></audio>
        <div class="post-audio-main">
          <button type="button" class="post-audio-play-btn" data-audio-play aria-pressed="false">
            <span class="post-audio-icon-play">▶</span>
            <span class="post-audio-icon-pause" hidden>❚❚</span>
          </button>
          <div class="post-audio-body">
            <div class="post-audio-header">
              <span class="post-audio-badge"><span data-i18n-key="post.audio.podcast">AI Audio Guide</span></span>
              <span class="post-audio-time">
                <span data-audio-current>00:00</span> / <span data-audio-duration>04:30</span>
              </span>
            </div>
            <input type="range" class="post-audio-seek" data-audio-seek min="0" max="100" step="0.1" value="0" />
          </div>
          <div class="post-audio-controls">
            <button type="button" data-audio-skip="-15">-15s</button>
            <button type="button" data-audio-skip="15">+15s</button>
            <button type="button" data-audio-speed>1x</button>
          </div>
        </div>
      </div>
    `;
    localStorage.clear();
  });

  test('formatTime formats seconds into MM:SS or H:MM:SS', () => {
    expect(PostAudioPlayer.formatTime(0)).toBe('00:00');
    expect(PostAudioPlayer.formatTime(65)).toBe('01:05');
    expect(PostAudioPlayer.formatTime(3661)).toBe('1:01:01');
  });

  test('cycles playback speeds and persists to localStorage', () => {
    const audio = document.querySelector('[data-audio-el]');
    const speedBtn = document.querySelector('[data-audio-speed]');
    audio.playbackRate = 1;

    PostAudioPlayer.initPostAudioPlayer({ document, storage: localStorage });

    speedBtn.click();
    expect(audio.playbackRate).toBe(1.25);
    expect(speedBtn.textContent).toBe('1.25x');
    expect(localStorage.getItem(PostAudioPlayer.SPEED_STORAGE_KEY)).toBe('1.25');

    speedBtn.click();
    expect(audio.playbackRate).toBe(1.5);
    expect(speedBtn.textContent).toBe('1.5x');

    speedBtn.click();
    expect(audio.playbackRate).toBe(2);
    expect(speedBtn.textContent).toBe('2x');

    speedBtn.click();
    expect(audio.playbackRate).toBe(1);
    expect(speedBtn.textContent).toBe('1x');
  });

  test('skip buttons adjust currentTime within bounds', () => {
    const audio = document.querySelector('[data-audio-el]');
    Object.defineProperty(audio, 'duration', { value: 100, configurable: true });
    audio.currentTime = 10;

    PostAudioPlayer.initPostAudioPlayer({ document, storage: localStorage });

    const forwardBtn = document.querySelector('[data-audio-skip="15"]');
    const rewindBtn = document.querySelector('[data-audio-skip="-15"]');
    const currentEl = document.querySelector('[data-audio-current]');

    forwardBtn.click();
    expect(audio.currentTime).toBe(25);
    expect(currentEl.textContent).toBe('00:25');

    rewindBtn.click();
    expect(audio.currentTime).toBe(10);
    expect(currentEl.textContent).toBe('00:10');

    rewindBtn.click();
    expect(audio.currentTime).toBe(0);
    expect(currentEl.textContent).toBe('00:00');
  });

  test('post.ejs and partial template include audio player wiring', () => {
    const postEjs = fs.readFileSync(
      path.join(__dirname, '../themes/evan/layout/post.ejs'),
      'utf8'
    );
    const partialEjs = fs.readFileSync(
      path.join(__dirname, '../themes/evan/layout/_partial/post-audio-player.ejs'),
      'utf8'
    );
    expect(postEjs).toContain("_partial/post-audio-player");
    expect(postEjs).toContain("/js/post-audio-player.js");
    expect(partialEjs).toContain("data-post-audio-player");
  });
});
