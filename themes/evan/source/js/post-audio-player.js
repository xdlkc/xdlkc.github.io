/* Post audio player controller (play/pause, seek, skip, playback speed,
 * interactive transcript cues & key-takeaways summary tabs).
 *
 * Supports UMD (browser global `window.PostAudioPlayer` + CommonJS for Jest).
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PostAudioPlayer = factory();
    root.PostAudioPlayer?.initPostAudioPlayer?.();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  const SPEED_STORAGE_KEY = 'xdlkc:audio-speed';
  const SPEEDS = [1, 1.25, 1.5, 2];

  function formatTime(seconds) {
    const s = Number(seconds);
    if (!Number.isFinite(s) || s < 0) return '00:00';
    const total = Math.floor(s);
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    if (hrs > 0) {
      return `${hrs}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
  }

  function nextSpeed(currentSpeed) {
    const current = Number(currentSpeed) || 1;
    const idx = SPEEDS.findIndex((spd) => Math.abs(spd - current) < 0.01);
    if (idx === -1) return SPEEDS[0];
    return SPEEDS[(idx + 1) % SPEEDS.length];
  }

  function formatSpeedLabel(speed) {
    const num = Number(speed) || 1;
    return `${num}x`;
  }

  function bindPlayer(container, { storage = globalThis.localStorage } = {}) {
    if (!container || container.dataset?.audioBound === '1') return;
    if (container.dataset) container.dataset.audioBound = '1';

    const audio = container.querySelector('[data-audio-el]');
    const playBtn = container.querySelector('[data-audio-play]');
    const iconPlay = container.querySelector('.post-audio-icon-play');
    const iconPause = container.querySelector('.post-audio-icon-pause');
    const currentEl = container.querySelector('[data-audio-current]');
    const durationEl = container.querySelector('[data-audio-duration]');
    const progressWrap = container.querySelector('[data-audio-progress-wrap]');
    const seekInput = container.querySelector('[data-audio-seek]');
    const speedBtn = container.querySelector('[data-audio-speed]');
    const skipBtns = Array.from(container.querySelectorAll('[data-audio-skip]'));
    const liveCaptionEl = container.querySelector('[data-audio-live-caption]');
    const liveCaptionTrackEl = container.querySelector('[data-audio-live-caption-track]');
    const drawerToggleBtn = container.querySelector('[data-audio-drawer-toggle]');
    const drawerEl = container.querySelector('[data-audio-drawer]');
    const tabBtns = Array.from(container.querySelectorAll('[data-audio-tab]'));
    const tabPanels = Array.from(container.querySelectorAll('[data-audio-panel]'));
    const cueEls = Array.from(container.querySelectorAll('[data-audio-cue]'));
    const transcriptPanel = container.querySelector('[data-audio-panel="transcript"]');

    if (!audio || !playBtn) return;

    let activeCueIdx = -1;
    let lastKnownTime = Number(audio.currentTime) || 0;
    let pendingSeekTime = null;

    function getEffectiveDuration() {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        return audio.duration;
      }
      const preset = Number(container.getAttribute('data-audio-total-seconds'));
      return Number.isFinite(preset) && preset > 0 ? preset : 0;
    }

    function setVisualProgress(pct) {
      const clamped = Math.min(100, Math.max(0, Number(pct) || 0));
      if (progressWrap && progressWrap.style) {
        progressWrap.style.setProperty('--audio-progress', `${clamped.toFixed(2)}%`);
      }
      if (seekInput) {
        seekInput.value = String(clamped.toFixed(1));
      }
    }

    function syncPlayState(isPlaying) {
      const playing = Boolean(isPlaying);
      playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
      playBtn.setAttribute('aria-label', playing ? 'Pause audio' : 'Play audio');
      container.classList.toggle('is-playing', playing);
      if (iconPlay) {
        iconPlay.removeAttribute('hidden');
        iconPlay.style.display = playing ? 'none' : 'block';
      }
      if (iconPause) {
        iconPause.removeAttribute('hidden');
        iconPause.style.display = playing ? 'block' : 'none';
      }
    }

    function updateLiveCaptionScroll(cueStartR, cueEndR, ratio, cueChanged) {
      if (!liveCaptionEl) return;
      const track = liveCaptionTrackEl || liveCaptionEl;
      const hostWidth = Number(liveCaptionEl.clientWidth) || 0;
      const trackWidth = Number(track.scrollWidth) || 0;
      const overflowPx = hostWidth > 0 && trackWidth > hostWidth + 4
        ? (trackWidth - hostWidth + 24)
        : 0;

      if (overflowPx > 0) {
        const durationSec = Math.max(7, Math.min(16, Math.round(overflowPx / 45)));
        if (liveCaptionEl.style) {
          liveCaptionEl.style.setProperty('--caption-scroll-distance', `-${overflowPx}px`);
          liveCaptionEl.style.setProperty('--caption-scroll-duration', `${durationSec}s`);
        }
        if (cueChanged || !liveCaptionEl.classList.contains('is-scrolling')) {
          liveCaptionEl.classList.remove('is-scrolling');
          void liveCaptionEl.offsetWidth;
          liveCaptionEl.classList.add('is-scrolling');
        }
      } else {
        liveCaptionEl.classList.remove('is-scrolling');
        if (liveCaptionEl.style) {
          liveCaptionEl.style.setProperty('--caption-scroll-distance', '0px');
        }
      }
    }

    function syncActiveCue(currentTime) {
      if (cueEls.length === 0) return;
      const total = getEffectiveDuration();
      if (total <= 0) return;

      const ratio = Math.min(0.9999, Math.max(0, (Number(currentTime) || 0) / total));
      let matchedIndex = -1;
      let matchedStartR = 0;
      let matchedEndR = 1;

      for (let i = 0; i < cueEls.length; i++) {
        const startR = Number(cueEls[i].getAttribute('data-start-ratio')) || 0;
        const endR = Number(cueEls[i].getAttribute('data-end-ratio')) || 1;
        if (ratio >= startR && ratio < endR) {
          matchedIndex = i;
          matchedStartR = startR;
          matchedEndR = endR;
          break;
        }
      }
      if (matchedIndex === -1 && ratio > 0) {
        matchedIndex = cueEls.length - 1;
        matchedStartR = Number(cueEls[matchedIndex].getAttribute('data-start-ratio')) || 0;
        matchedEndR = Number(cueEls[matchedIndex].getAttribute('data-end-ratio')) || 1;
      }

      const cueChanged = matchedIndex !== activeCueIdx;
      activeCueIdx = matchedIndex;

      if (cueChanged) {
        cueEls.forEach((el, idx) => {
          const isCurrent = idx === matchedIndex;
          el.classList.toggle('is-active', isCurrent);
          if (isCurrent) {
            const textEl = el.querySelector('.post-audio-cue-text');
            const snippet = textEl ? String(textEl.textContent || '').trim() : '';
            if (snippet) {
              if (liveCaptionTrackEl) {
                liveCaptionTrackEl.textContent = snippet;
              } else if (liveCaptionEl) {
                liveCaptionEl.textContent = snippet;
              }
            }
            // Smooth scroll inside the transcript container without scrolling the whole page
            if (transcriptPanel && !transcriptPanel.hidden && typeof transcriptPanel.scrollTo === 'function') {
              const top = el.offsetTop - transcriptPanel.offsetTop - (transcriptPanel.clientHeight / 2) + (el.clientHeight / 2);
              transcriptPanel.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
            }
          }
        });
      }

      if (matchedIndex >= 0) {
        updateLiveCaptionScroll(matchedStartR, matchedEndR, ratio, cueChanged);
      }
    }

    function seekToTime(targetSec) {
      const total = getEffectiveDuration();
      const maxTime = total > 0 ? total : Infinity;
      const nextTime = Math.min(maxTime, Math.max(0, Number(targetSec) || 0));
      lastKnownTime = nextTime;
      pendingSeekTime = nextTime;

      try {
        audio.currentTime = nextTime;
        if (Math.abs((Number(audio.currentTime) || 0) - nextTime) <= 1.0) {
          pendingSeekTime = null;
        }
      } catch {
        // Keep pendingSeekTime so loadedmetadata / canplay applies it
      }

      if (currentEl) {
        currentEl.textContent = formatTime(nextTime);
      }
      if (total > 0) {
        setVisualProgress((nextTime / total) * 100);
      }
      syncActiveCue(nextTime);
      return nextTime;
    }

    function applySpeed(spd) {
      const valid = SPEEDS.includes(Number(spd)) ? Number(spd) : 1;
      try {
        audio.playbackRate = valid;
      } catch {
        // ignore
      }
      if (speedBtn) {
        speedBtn.textContent = formatSpeedLabel(valid);
      }
      try {
        storage?.setItem?.(SPEED_STORAGE_KEY, String(valid));
      } catch {
        // ignore
      }
    }

    // Restore saved speed
    try {
      const saved = Number(storage?.getItem?.(SPEED_STORAGE_KEY));
      if (SPEEDS.includes(saved)) {
        applySpeed(saved);
      }
    } catch {
      // ignore
    }

    syncPlayState(false);

    playBtn.addEventListener('click', () => {
      if (audio.paused) {
        flushPendingSeek();
        syncActiveCue(Number(audio.currentTime) || lastKnownTime || 0);
        const playPromise = audio.play?.();
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise.then(() => {
            flushPendingSeek();
            syncPlayState(true);
            syncActiveCue(Number(audio.currentTime) || lastKnownTime || 0);
          }).catch(() => syncPlayState(false));
        } else {
          syncPlayState(true);
        }
      } else {
        audio.pause?.();
        syncPlayState(false);
      }
    });

    audio.addEventListener('play', () => syncPlayState(true));
    audio.addEventListener('pause', () => syncPlayState(false));
    audio.addEventListener('ended', () => {
      syncPlayState(false);
      setVisualProgress(0);
      lastKnownTime = 0;
      pendingSeekTime = null;
      if (currentEl) currentEl.textContent = '00:00';
      activeCueIdx = -1;
      cueEls.forEach((el) => el.classList.remove('is-active'));
    });

    function flushPendingSeek() {
      if (pendingSeekTime === null) return;
      try {
        audio.currentTime = pendingSeekTime;
        if (Math.abs((Number(audio.currentTime) || 0) - pendingSeekTime) <= 1.0) {
          pendingSeekTime = null;
        }
      } catch {
        // ignore
      }
    }

    audio.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        if (durationEl) {
          durationEl.textContent = formatTime(audio.duration);
        }
        cueEls.forEach((el) => {
          const startR = Number(el.getAttribute('data-start-ratio')) || 0;
          const sec = Math.floor(startR * audio.duration);
          el.setAttribute('data-start-sec', String(sec));
          const timeBadge = el.querySelector('[data-cue-time]');
          if (timeBadge) {
            timeBadge.textContent = formatTime(sec);
          }
        });
      }
      flushPendingSeek();
    });

    audio.addEventListener?.('canplay', flushPendingSeek);

    audio.addEventListener('timeupdate', () => {
      if (audio.seeking) return;
      const cur = Number(audio.currentTime) || 0;
      lastKnownTime = cur;
      if (currentEl) {
        currentEl.textContent = formatTime(cur);
      }
      const total = getEffectiveDuration();
      if (total > 0) {
        const pct = Math.min(100, Math.max(0, (cur / total) * 100));
        setVisualProgress(pct);
      }
      syncActiveCue(cur);
    });

    if (seekInput) {
      seekInput.addEventListener('input', () => {
        const total = getEffectiveDuration();
        const pct = Number(seekInput.value) || 0;
        setVisualProgress(pct);
        if (total <= 0) return;
        const targetTime = (pct / 100) * total;
        seekToTime(targetTime);
      });
    }

    skipBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const delta = Number(btn.getAttribute('data-audio-skip')) || 0;
        const baseTime = Math.max(Number(audio.currentTime) || 0, lastKnownTime);
        seekToTime(baseTime + delta);
      });
    });

    if (speedBtn) {
      speedBtn.addEventListener('click', () => {
        const next = nextSpeed(audio.playbackRate || 1);
        applySpeed(next);
      });
    }

    // Interactive cue click / keyboard seek
    cueEls.forEach((cueEl) => {
      function activateCue() {
        const total = getEffectiveDuration();
        const startRatio = Number(cueEl.getAttribute('data-start-ratio')) || 0;
        const fallbackSec = Number(cueEl.getAttribute('data-start-sec')) || 0;
        const targetTime = total > 0 ? startRatio * total : fallbackSec;

        seekToTime(targetTime);

        if (audio.paused) {
          const playPromise = audio.play?.();
          if (playPromise && typeof playPromise.then === 'function') {
            playPromise.then(() => syncPlayState(true)).catch(() => {});
          } else {
            syncPlayState(true);
          }
        }
      }

      cueEl.addEventListener('click', activateCue);
      cueEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activateCue();
        }
      });
    });

    // Drawer toggle
    if (drawerToggleBtn && drawerEl) {
      drawerToggleBtn.addEventListener('click', () => {
        const isExpanded = drawerToggleBtn.getAttribute('aria-expanded') !== 'false';
        const nextExpanded = !isExpanded;
        drawerToggleBtn.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false');
        drawerEl.hidden = !nextExpanded;
        container.classList.toggle('is-drawer-collapsed', !nextExpanded);
      });
    }

    // Tab switching (Transcript vs Summary)
    if (tabBtns.length > 0 && tabPanels.length > 0) {
      tabBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const targetTab = btn.getAttribute('data-audio-tab');
          tabBtns.forEach((b) => {
            const active = b.getAttribute('data-audio-tab') === targetTab;
            b.classList.toggle('is-active', active);
            b.setAttribute('aria-selected', active ? 'true' : 'false');
          });
          tabPanels.forEach((panel) => {
            const match = panel.getAttribute('data-audio-panel') === targetTab;
            panel.hidden = !match;
          });
        });
      });
    }
  }

  function initPostAudioPlayer({
    document = globalThis.document,
    storage = globalThis.localStorage
  } = {}) {
    if (!document?.querySelectorAll) return;
    const players = Array.from(document.querySelectorAll('[data-post-audio-player]'));
    players.forEach((container) => bindPlayer(container, { storage }));
  }

  return {
    SPEED_STORAGE_KEY,
    SPEEDS,
    formatTime,
    nextSpeed,
    formatSpeedLabel,
    bindPlayer,
    initPostAudioPlayer
  };
});
