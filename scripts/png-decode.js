// Minimal PNG decoder (8-bit depth, non-interlaced) using only Node builtins.
// Supports color types: 0 (gray), 2 (RGB), 3 (palette), 4 (gray+alpha), 6 (RGBA).
"use strict";
const zlib = require("zlib");

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG file");
  let pos = 8;
  let ihdr = null;
  let plte = null;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      ihdr = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        depth: data[8],
        colorType: data[9],
        interlace: data[12],
      };
    } else if (type === "PLTE") plte = Buffer.from(data);
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  if (!ihdr) throw new Error("missing IHDR");
  if (ihdr.depth !== 8 || ihdr.interlace !== 0)
    throw new Error(`unsupported PNG (depth=${ihdr.depth}, interlace=${ihdr.interlace})`);
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ihdr.colorType];
  if (!channels) throw new Error(`unsupported color type ${ihdr.colorType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const { width: w, height: h } = ihdr;
  const stride = w * channels;
  const out = Buffer.alloc(h * stride);

  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const prevRow = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? cur[i - channels] : 0;
      const b = prevRow ? prevRow[i] : 0;
      const c = prevRow && i >= channels ? prevRow[i - channels] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) v += paeth(a, b, c);
      cur[i] = v & 0xff;
    }
  }

  const rgba = Buffer.alloc(w * h * 4);
  for (let p = 0; p < w * h; p++) {
    const o = p * channels;
    let r, g, b, a = 255;
    switch (ihdr.colorType) {
      case 0: r = g = b = out[o]; break;
      case 2: r = out[o]; g = out[o + 1]; b = out[o + 2]; break;
      case 3: { const i3 = out[o] * 3; r = plte[i3]; g = plte[i3 + 1]; b = plte[i3 + 2]; break; }
      case 4: r = g = b = out[o]; a = out[o + 1]; break;
      default: r = out[o]; g = out[o + 1]; b = out[o + 2]; a = out[o + 3];
    }
    const q = p * 4;
    rgba[q] = r; rgba[q + 1] = g; rgba[q + 2] = b; rgba[q + 3] = a;
  }
  return { width: w, height: h, rgba };
}

module.exports = { decodePNG };
