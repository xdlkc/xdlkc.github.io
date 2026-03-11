const fs = require('node:fs');
const path = require('node:path');

function inferMimeTypeFromPath(inputPath = '') {
  const ext = path.extname(String(inputPath || '')).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.svg') return 'image/svg+xml';
  return '';
}

function readPngSize(buf) {
  // PNG signature (8) + IHDR length/type (8) + IHDR data starts at offset 16.
  // width: 4 bytes, height: 4 bytes big-endian.
  if (!buf || buf.length < 24) return null;

  const signature = buf.subarray(0, 8);
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!signature.equals(pngSig)) return null;

  // IHDR chunk type is at 12..15
  const type = buf.subarray(12, 16).toString('ascii');
  if (type !== 'IHDR') return null;

  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (!width || !height) return null;

  return { width, height, type: 'image/png' };
}

function readJpegSize(buf) {
  // Minimal JPEG SOI marker
  if (!buf || buf.length < 4) return null;
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;

  // Walk segments until SOF0/SOF2 etc.
  let offset = 2;
  while (offset < buf.length) {
    // Find 0xFF marker prefix
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    // Skip fill bytes 0xFF
    while (offset < buf.length && buf[offset] === 0xff) offset += 1;
    if (offset >= buf.length) break;

    const marker = buf[offset];
    offset += 1;

    // Standalone markers without length.
    if (marker === 0xd9 || marker === 0xda) {
      // EOI or SOS
      break;
    }

    if (offset + 2 > buf.length) break;
    const segmentLen = buf.readUInt16BE(offset);
    if (segmentLen < 2) return null;

    const segmentStart = offset + 2;

    // SOF markers we care about: C0..C3, C5..C7, C9..CB, CD..CF
    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isSof) {
      if (segmentStart + 7 > buf.length) return null;
      // [precision:1][height:2][width:2]
      const height = buf.readUInt16BE(segmentStart + 1);
      const width = buf.readUInt16BE(segmentStart + 3);
      if (!width || !height) return null;
      return { width, height, type: 'image/jpeg' };
    }

    offset = offset + segmentLen;
  }

  return null;
}

function readImageSizeFromFile(filepath, { fsImpl = fs } = {}) {
  const p = String(filepath || '');
  if (!p) return { width: 0, height: 0, type: '' };

  let buf;
  try {
    buf = fsImpl.readFileSync(p);
  } catch (_) {
    return { width: 0, height: 0, type: inferMimeTypeFromPath(p) };
  }

  const png = readPngSize(buf);
  if (png) return png;

  const jpg = readJpegSize(buf);
  if (jpg) return jpg;

  // Unknown/unsupported: at least provide inferred type.
  return { width: 0, height: 0, type: inferMimeTypeFromPath(p) };
}

module.exports = {
  inferMimeTypeFromPath,
  readImageSizeFromFile,
};
