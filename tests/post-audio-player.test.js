/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');
const PostAudioPlayer = require('../themes/evan/source/js/post-audio-player');
const PostAudioData = require('../scripts/helpers/post-audio-data');

describe('PostAudioPlayer & PostAudioData', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <section class="post-audio-player" data-post-audio-player data-audio-mode="podcast" data-audio-total-seconds="200">
        <audio class="post-audio-element" data-audio-el src="/uploads/demo/audio.mp3"></audio>
        <div class="post-audio-console">
          <button type="button" class="post-audio-play-btn" data-audio-play aria-pressed="false">
            <svg class="post-audio-icon-play"></svg>
            <svg class="post-audio-icon-pause" hidden></svg>
          </button>
          <div class="post-audio-center">
            <div class="post-audio-header">
              <div class="post-audio-title-group">
                <span class="post-audio-badge"><span data-i18n-key="post.audio.podcast">AI Audio Guide</span></span>
                <span class="post-audio-live-caption" data-audio-live-caption>Hint</span>
              </div>
              <div class="post-audio-time">
                <span data-audio-current>00:00</span> / <span data-audio-duration>03:20</span>
              </div>
            </div>
            <div class="post-audio-progress-wrap" data-audio-progress-wrap style="--audio-progress: 0%;">
              <input type="range" class="post-audio-seek" data-audio-seek min="0" max="100" step="0.1" value="0" />
            </div>
          </div>
          <div class="post-audio-controls">
            <button type="button" data-audio-skip="-15">-15s</button>
            <button type="button" data-audio-skip="15">+15s</button>
            <button type="button" data-audio-speed>1x</button>
            <button type="button" data-audio-drawer-toggle aria-expanded="true">字幕 / 摘要</button>
          </div>
        </div>
        <div class="post-audio-drawer" data-audio-drawer>
          <div class="post-audio-tabs">
            <button type="button" class="post-audio-tab is-active" data-audio-tab="transcript" aria-selected="true">实时字幕文稿</button>
            <button type="button" class="post-audio-tab" data-audio-tab="summary" aria-selected="false">核心要点速览</button>
          </div>
          <div class="post-audio-panel post-audio-transcript" data-audio-panel="transcript">
            <div class="post-audio-cue" data-audio-cue data-cue-index="0" data-start-ratio="0" data-end-ratio="0.5" data-start-sec="0">
              <span class="post-audio-cue-time" data-cue-time>00:00</span>
              <p class="post-audio-cue-text">第一段导读内容</p>
            </div>
            <div class="post-audio-cue" data-audio-cue data-cue-index="1" data-start-ratio="0.5" data-end-ratio="1" data-start-sec="100">
              <span class="post-audio-cue-time" data-cue-time>01:40</span>
              <p class="post-audio-cue-text">第二段导读内容</p>
            </div>
          </div>
          <div class="post-audio-panel post-audio-summary" data-audio-panel="summary" hidden>
            <ol class="post-audio-summary-list">
              <li class="post-audio-summary-item"><span class="post-audio-summary-idx">01</span><p class="post-audio-summary-text">核心要点一</p></li>
            </ol>
          </div>
        </div>
      </section>
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

  test('clicking a transcript cue jumps audio time and highlights the cue', () => {
    const audio = document.querySelector('[data-audio-el]');
    Object.defineProperty(audio, 'duration', { value: 200, configurable: true });
    audio.play = jest.fn(() => Promise.resolve());

    PostAudioPlayer.initPostAudioPlayer({ document, storage: localStorage });

    const cues = document.querySelectorAll('[data-audio-cue]');
    const liveCaption = document.querySelector('[data-audio-live-caption]');
    const currentEl = document.querySelector('[data-audio-current]');

    cues[1].click();
    expect(audio.currentTime).toBe(100);
    expect(currentEl.textContent).toBe('01:40');
    expect(cues[1].classList.contains('is-active')).toBe(true);
    expect(liveCaption.textContent).toBe('第二段导读内容');
  });

  test('switches between transcript and summary tabs and toggles drawer', () => {
    PostAudioPlayer.initPostAudioPlayer({ document, storage: localStorage });

    const summaryTab = document.querySelector('[data-audio-tab="summary"]');
    const transcriptPanel = document.querySelector('[data-audio-panel="transcript"]');
    const summaryPanel = document.querySelector('[data-audio-panel="summary"]');
    const drawerToggle = document.querySelector('[data-audio-drawer-toggle]');
    const drawer = document.querySelector('[data-audio-drawer]');

    summaryTab.click();
    expect(transcriptPanel.hidden).toBe(true);
    expect(summaryPanel.hidden).toBe(false);

    drawerToggle.click();
    expect(drawer.hidden).toBe(true);
    expect(drawerToggle.getAttribute('aria-expanded')).toBe('false');
  });

  test('resolvePostAudioData loads super-agent script paragraphs and highlights', () => {
    const data = PostAudioData.resolvePostAudioData({
      audio: '/uploads/super-agent-design-exploration/audio.mp3',
      audio_mode: 'podcast',
      audio_duration: '07:42'
    });
    expect(data).not.toBeNull();
    expect(data.paragraphs.length).toBeGreaterThan(10);
    expect(data.highlights.length).toBeGreaterThan(3);
    expect(data.paragraphs[0].startTime).toBe('00:00');
  });
});
