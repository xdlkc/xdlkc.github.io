/* Post audio player controller (play/pause, seek, skip, playback speed).
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
    const seekInput = container.querySelector('[data-audio-seek]');
    const speedBtn = container.querySelector('[data-audio-speed]');
    const skipBtns = Array.from(container.querySelectorAll('[data-audio-skip]'));

    if (!audio || !playBtn) return;

    function syncPlayState(isPlaying) {
      playBtn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
      playBtn.setAttribute('aria-label', isPlaying ? 'Pause audio' : 'Play audio');
      container.classList.toggle('is-playing', Boolean(isPlaying));
      if (iconPlay && iconPause) {
        iconPlay.hidden = Boolean(isPlaying);
        iconPause.hidden = !isPlaying;
      }
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

    playBtn.addEventListener('click', () => {
      if (audio.paused) {
        const playPromise = audio.play?.();
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise.then(() => syncPlayState(true)).catch(() => syncPlayState(false));
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
      if (seekInput) seekInput.value = '0';
      if (currentEl) currentEl.textContent = '00:00';
    });

    audio.addEventListener('loadedmetadata', () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0 && durationEl) {
        durationEl.textContent = formatTime(audio.duration);
      }
    });

    audio.addEventListener('timeupdate', () => {
      if (currentEl) {
        currentEl.textContent = formatTime(audio.currentTime || 0);
      }
      if (seekInput && Number.isFinite(audio.duration) && audio.duration > 0) {
        const pct = Math.min(100, Math.max(0, (audio.currentTime / audio.duration) * 100));
        seekInput.value = String(pct.toFixed(1));
      }
    });

    if (seekInput) {
      seekInput.addEventListener('input', () => {
        if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
        const pct = Number(seekInput.value) || 0;
        const targetTime = (pct / 100) * audio.duration;
        audio.currentTime = targetTime;
        if (currentEl) {
          currentEl.textContent = formatTime(targetTime);
        }
      });
    }

    skipBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const delta = Number(btn.getAttribute('data-audio-skip')) || 0;
        const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : Infinity;
        const nextTime = Math.min(duration, Math.max(0, (audio.currentTime || 0) + delta));
        audio.currentTime = nextTime;
        if (currentEl) {
          currentEl.textContent = formatTime(nextTime);
        }
      });
    });

    if (speedBtn) {
      speedBtn.addEventListener('click', () => {
        const next = nextSpeed(audio.playbackRate || 1);
        applySpeed(next);
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
