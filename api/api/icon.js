const zlib = require('zlib');

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

function sdRoundedBox(px, py, cx, cy, bx, by, r) {
  const qx = Math.abs(px - cx) - bx + r;
  const qy = Math.abs(py - cy) - by + r;
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    r
  );
}

function sdSegment(px, py, ax, ay, bx, by) {
  const pax = px - ax;
  const pay = py - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const h = clamp((pax * bax + pay * bay) / (bax * bax + bay * bay), 0, 1);
  return Math.hypot(pax - bax * h, pay - bay * h);
}

function blend(dst, idx, r, g, b, alpha) {
  const a = clamp(alpha, 0, 1);
  if (a <= 0) return;
  const inv = 1 - a;
  dst[idx] = Math.round(dst[idx] * inv + r * a);
  dst[idx + 1] = Math.round(dst[idx + 1] * inv + g * a);
  dst[idx + 2] = Math.round(dst[idx + 2] * inv + b * a);
}

function generateIconPng(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const aa = 100 / size;

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    const py = ((y + 0.5) / size) * 100;

    for (let x = 0; x < size; x++) {
      const idx = rowStart + 1 + x * 4;
      const px = ((x + 0.5) / size) * 100;

      // Dark radial background
      const distC = Math.hypot(px - 50, py - 50) / 70;
      const bgT = clamp(distC, 0, 1);
      raw[idx] = Math.round(20 * (1 - bgT) + 7 * bgT);
      raw[idx + 1] = Math.round(28 * (1 - bgT) + 10 * bgT);
      raw[idx + 2] = Math.round(61 * (1 - bgT) + 24 * bgT);
      raw[idx + 3] = 255;

      // Horizontal cyan -> magenta neon color
      const nt = clamp((px - 8) / 84, 0, 1);
      const nr = 255 * nt;
      const ng = 240 * (1 - nt);
      const nb = 255 - 26 * nt;

      // Subtle outer neon border frame
      const dFrame = Math.abs(sdRoundedBox(px, py, 50, 50, 46, 46, 18)) - 1.05;
      if (dFrame < aa) {
        blend(raw, idx, nr, ng, nb, clamp(0.5 - dFrame / (2 * aa), 0, 1) * 0.65);
      }

      // Car local coordinates (centered in safe zone for Android & iOS)
      const lx = (px - 50) / 0.78 + 50;
      const ly = (py - 50) / 0.78 + 38;

      // Neon gradient inside car space
      const ct = clamp((lx - 8) / 84, 0, 1);
      const cr = 255 * ct;
      const cg = 240 * (1 - ct);
      const cb = 255 - 26 * ct;

      // Wheels
      const dWheelL = sdRoundedBox(lx, ly, 21.5, 57.5, 7.5, 3.6, 1.8);
      if (dWheelL < aa) {
        blend(raw, idx, 9, 13, 26, clamp(0.5 - dWheelL / (2 * aa), 0, 1));
      }
      const dWheelLS = Math.abs(dWheelL) - 1.15;
      if (dWheelLS < aa) {
        blend(raw, idx, 0, 240, 255, clamp(0.5 - dWheelLS / (2 * aa), 0, 1));
      }

      const dWheelR = sdRoundedBox(lx, ly, 78.5, 57.5, 7.5, 3.6, 1.8);
      if (dWheelR < aa) {
        blend(raw, idx, 9, 13, 26, clamp(0.5 - dWheelR / (2 * aa), 0, 1));
      }
      const dWheelRS = Math.abs(dWheelR) - 1.15;
      if (dWheelRS < aa) {
        blend(raw, idx, 255, 0, 229, clamp(0.5 - dWheelRS / (2 * aa), 0, 1));
      }

      // Roof fill (trapezoid)
      if (ly >= 12.5 && ly <= 30.5) {
        const roofFrac = (ly - 13) / 17;
        const leftEdge = 28 - 10 * roofFrac;
        const rightEdge = 72 + 10 * roofFrac;
        if (lx >= leftEdge && lx <= rightEdge) {
          blend(raw, idx, 15, 27, 51, 1);
        }
      }

      // Roof neon stroke
      const dRoof = Math.min(
        sdSegment(lx, ly, 18, 30, 28, 14),
        sdSegment(lx, ly, 28, 14, 50, 11.8),
        sdSegment(lx, ly, 50, 11.8, 72, 14),
        sdSegment(lx, ly, 72, 14, 82, 30)
      ) - 1.45;
      if (dRoof < aa) {
        blend(raw, idx, cr, cg, cb, clamp(0.5 - dRoof / (2 * aa), 0, 1));
      }

      // Car body rounded box
      const dBody = sdRoundedBox(lx, ly, 50, 42, 42, 12, 6);
      if (dBody < aa) {
        blend(raw, idx, 12, 20, 40, clamp(0.5 - dBody / (2 * aa), 0, 1));
      }
      const dBodyS = Math.abs(dBody) - 1.55;
      if (dBodyS < aa) {
        blend(raw, idx, cr, cg, cb, clamp(0.5 - dBodyS / (2 * aa), 0, 1));
      }

      // Left glowing cyan headlight
      const dHlL = sdRoundedBox(lx, ly, 21, 41.5, 7.6, 2.5, 1.2);
      if (dHlL < 5) {
        blend(raw, idx, 0, 240, 255, clamp((5 - dHlL) / 5, 0, 1) * 0.25);
      }
      if (dHlL < aa) {
        blend(raw, idx, 0, 240, 255, clamp(0.5 - dHlL / (2 * aa), 0, 1));
      }

      // Right glowing magenta headlight
      const dHlR = sdRoundedBox(lx, ly, 79, 41.5, 7.6, 2.5, 1.2);
      if (dHlR < 5) {
        blend(raw, idx, 255, 0, 229, clamp((5 - dHlR) / 5, 0, 1) * 0.25);
      }
      if (dHlR < aa) {
        blend(raw, idx, 255, 0, 229, clamp(0.5 - dHlR / (2 * aa), 0, 1));
      }

      // Center plate / grille
      const dGrilleS = Math.abs(sdRoundedBox(lx, ly, 50, 45.5, 15, 3.5, 1.6)) - 1.05;
      if (dGrilleS < aa) {
        blend(raw, idx, cr, cg, cb, clamp(0.5 - dGrilleS / (2 * aa), 0, 1));
      }
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const compressed = zlib.deflateSync(raw, { level: 6 });
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

module.exports = function handler(req, res) {
  const reqSize = parseInt(req.query?.size || '192', 10);
  const size = [180, 192, 512].includes(reqSize) ? reqSize : 192;
  const png = generateIconPng(size);

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.status(200).send(png);
};
