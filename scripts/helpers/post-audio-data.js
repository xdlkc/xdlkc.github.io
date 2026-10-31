const fs = require('node:fs');
const path = require('node:path');

function parseDurationToSeconds(durationStr) {
  if (!durationStr) return 0;
  const parts = String(durationStr).trim().split(':').map(Number);
  if (parts.some((n) => !Number.isFinite(n) || n < 0)) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

function formatSeconds(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  if (hrs > 0) return `${hrs}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

function deriveHighlightsFromParagraphs(paragraphs) {
  if (!Array.isArray(paragraphs) || paragraphs.length === 0) return [];
  const candidates = [];
  for (const p of paragraphs) {
    const firstSentence = String(p.text || '')
      .split(/(?<=[。！？!?])/)[0]
      .trim();
    if (firstSentence.length >= 18 && firstSentence.length <= 110) {
      candidates.push(firstSentence);
    }
  }
  if (candidates.length <= 4) return candidates;
  const step = (candidates.length - 1) / 3;
  return [
    candidates[0],
    candidates[Math.round(step)],
    candidates[Math.round(step * 2)],
    candidates[candidates.length - 1]
  ];
}

function resolvePostAudioData(page, { rootDir = path.join(__dirname, '..', '..') } = {}) {
  if (!page || !page.audio) return null;

  const audioUrl = String(page.audio).trim();
  const relDir = path.posix.dirname(audioUrl.replace(/^\//, ''));
  const uploadsDir = path.join(rootDir, 'source', relDir);
  const scriptPath = path.join(uploadsDir, 'audio-script.txt');
  const metaPath = path.join(uploadsDir, 'audio-meta.json');

  let rawScript = '';
  if (fs.existsSync(scriptPath)) {
    try {
      rawScript = fs.readFileSync(scriptPath, 'utf8').trim();
    } catch {
      rawScript = '';
    }
  }

  let meta = {};
  if (fs.existsSync(metaPath)) {
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    } catch {
      meta = {};
    }
  }

  const totalSeconds = meta.duration_ms
    ? Math.round(Number(meta.duration_ms) / 1000)
    : parseDurationToSeconds(page.audio_duration || meta.duration);

  const rawParagraphs = rawScript
    ? rawScript.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
    : [];

  const totalChars = rawParagraphs.reduce((sum, p) => sum + p.length, 0) || 1;
  let cumulativeChars = 0;

  const paragraphs = rawParagraphs.map((text, index) => {
    const startRatio = cumulativeChars / totalChars;
    cumulativeChars += text.length;
    const endRatio = cumulativeChars / totalChars;
    const startSec = totalSeconds > 0 ? Math.floor(startRatio * totalSeconds) : 0;
    return {
      index,
      text,
      startRatio: Number(startRatio.toFixed(4)),
      endRatio: Number(endRatio.toFixed(4)),
      startSec,
      startTime: formatSeconds(startSec)
    };
  });

  const highlights = Array.isArray(meta.highlights) && meta.highlights.length > 0
    ? meta.highlights
    : deriveHighlightsFromParagraphs(paragraphs);

  return {
    mode: page.audio_mode || meta.mode || 'podcast',
    duration: page.audio_duration || meta.duration || '00:00',
    totalSeconds,
    voiceId: meta.voice_id || 'presenter_male',
    ttsModel: meta.tts_model || 'speech-2.8-hd',
    paragraphs,
    highlights
  };
}

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.helper) {
  hexo.extend.helper.register('post_audio_data', function postAudioData(page) {
    return resolvePostAudioData(page);
  });
}

module.exports = {
  parseDurationToSeconds,
  formatSeconds,
  deriveHighlightsFromParagraphs,
  resolvePostAudioData
};
