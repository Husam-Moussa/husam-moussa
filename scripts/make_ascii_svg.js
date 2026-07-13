// Generates husam-ascii.svg: a monochrome ASCII portrait of scripts/avatar.png
// that "types in" row by row, framed as a terminal window.
// Usage: node scripts/make_ascii_svg.js
"use strict";
const fs = require("fs");
const path = require("path");
const { decodePNG } = require("./png-decode");

const COLS = 78;
const CHAR_W = 6;
const CHAR_H = 10;
const FONT_SIZE = 9.5;
// dark -> light ramp (dark background, so bright pixels get dense glyphs)
const RAMP = " .'`,:;i!~+xmo*#W&8%B@$";

function escXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const raw = decodePNG(fs.readFileSync(path.join(__dirname, "avatar.png")));

// Portrait photos: crop to upper-center face region so the ASCII reads clearly.
function cropPortrait(img) {
  const { width: w, height: h, rgba } = img;
  if (h <= w * 1.05) return img;
  const side = Math.round(w * 0.92);
  const x0 = Math.round((w - side) / 2);
  const y0 = Math.round(h * 0.02);
  const y1 = Math.min(h, y0 + side);
  const cw = side;
  const ch = y1 - y0;
  const out = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const si = ((y0 + y) * w + (x0 + x)) * 4;
      const di = (y * cw + x) * 4;
      out[di] = rgba[si]; out[di + 1] = rgba[si + 1]; out[di + 2] = rgba[si + 2]; out[di + 3] = rgba[si + 3];
    }
  }
  return { width: cw, height: ch, rgba: out };
}

const src = cropPortrait(raw);
const ROWS = Math.round((src.height / src.width) * COLS * (CHAR_W / CHAR_H));

function sampleLuma(gx, gy) {
  // average the source pixels covered by one character cell
  const x0 = Math.floor((gx / COLS) * src.width);
  const x1 = Math.max(x0 + 1, Math.floor(((gx + 1) / COLS) * src.width));
  const y0 = Math.floor((gy / ROWS) * src.height);
  const y1 = Math.max(y0 + 1, Math.floor(((gy + 1) / ROWS) * src.height));
  let sum = 0, n = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const p = (y * src.width + x) * 4;
      const a = src.rgba[p + 3] / 255;
      const l = (0.2126 * src.rgba[p] + 0.7152 * src.rgba[p + 1] + 0.0722 * src.rgba[p + 2]) * a;
      sum += l; n++;
    }
  }
  return sum / n / 255;
}

// gentle contrast stretch so the portrait pops on a dark background
function tone(l) {
  const v = Math.min(1, Math.max(0, (l - 0.08) / 0.84));
  return Math.pow(v, 1.15);
}

const rows = [];
for (let gy = 0; gy < ROWS; gy++) {
  let line = "";
  for (let gx = 0; gx < COLS; gx++) {
    const l = tone(sampleLuma(gx, gy));
    line += RAMP[Math.min(RAMP.length - 1, Math.floor(l * RAMP.length))];
  }
  rows.push(line);
}

const PAD = 14;
const BAR_H = 28;
const gridW = COLS * CHAR_W;
const gridH = ROWS * CHAR_H;
const W = gridW + PAD * 2;
const H = gridH + PAD * 2 + BAR_H;

const ROW_DUR = 0.55;   // seconds for one row to type in
const ROW_STAGGER = 0.09;

let defs = "";
let body = "";
for (let i = 0; i < rows.length; i++) {
  const begin = (i * ROW_STAGGER).toFixed(2);
  defs += `<clipPath id="r${i}"><rect x="${PAD}" y="${BAR_H + PAD + i * CHAR_H}" width="0" height="${CHAR_H + 1}">` +
    `<animate attributeName="width" from="0" to="${gridW}" begin="${begin}s" dur="${ROW_DUR}s" fill="freeze" calcMode="discrete" ` +
    `values="${Array.from({ length: 21 }, (_, k) => Math.round((gridW * k) / 20)).join(";")}"/>` +
    `</rect></clipPath>\n`;
  body += `<text x="${PAD}" y="${BAR_H + PAD + i * CHAR_H + CHAR_H - 2}" clip-path="url(#r${i})" xml:space="preserve" textLength="${gridW}" lengthAdjust="spacingAndGlyphs">${escXml(rows[i])}</text>\n`;
}

const totalType = (rows.length * ROW_STAGGER + ROW_DUR).toFixed(2);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>
  text { font-family: 'Consolas','SF Mono','DejaVu Sans Mono',monospace; font-size: ${FONT_SIZE}px; fill: #c9d1d9; }
  .title { font-size: 11px; fill: #8b949e; }
  .cursor { fill: #22d3ee; }
</style>
<defs>
${defs}</defs>
<rect width="${W}" height="${H}" rx="10" fill="#0d1117" stroke="#30363d"/>
<rect width="${W}" height="${BAR_H}" rx="10" fill="#161b22"/>
<rect y="${BAR_H - 10}" width="${W}" height="10" fill="#161b22"/>
<circle cx="18" cy="${BAR_H / 2}" r="5" fill="#ff5f56"/>
<circle cx="36" cy="${BAR_H / 2}" r="5" fill="#ffbd2e"/>
<circle cx="54" cy="${BAR_H / 2}" r="5" fill="#27c93f"/>
<text class="title" x="${W / 2}" y="${BAR_H / 2 + 4}" text-anchor="middle">husam@atmosphere: ~/portrait</text>
${body}<rect class="cursor" x="${PAD}" y="${H - PAD - CHAR_H + 1}" width="${CHAR_W}" height="${CHAR_H}" opacity="0">
  <animate attributeName="opacity" values="0;0;1;0;1;0;1;0" keyTimes="0;0.5;0.58;0.66;0.74;0.82;0.9;1" dur="${(parseFloat(totalType) * 2).toFixed(2)}s" repeatCount="indefinite"/>
</rect>
</svg>
`;

fs.writeFileSync(path.join(__dirname, "..", "husam-ascii.svg"), svg);
console.log(`husam-ascii.svg written (${COLS}x${ROWS} chars, ${(svg.length / 1024).toFixed(1)} KB, types in over ~${totalType}s)`);
