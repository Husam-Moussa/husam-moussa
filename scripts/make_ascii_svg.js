// Generates husam-ascii.svg from scripts/photo_ascii_art.txt (types in row by row).
// Usage: node scripts/make_ascii_svg.js
"use strict";
const fs = require("fs");
const path = require("path");

const CHAR_W = 6;
const CHAR_H = 10;
const FONT_SIZE = 9.5;
const TARGET_COLS = 78;
const TARGET_ROWS = 52;

function escXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function loadAsciiArt(filePath) {
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+$/, ""))
    .filter((line) => line.length > 0);
}

// Face-focused crop: upper-center of portrait ASCII art.
function cropArt(lines, cols, rows) {
  const h = lines.length;
  const w = Math.max(...lines.map((l) => l.length));
  const y0 = Math.max(0, Math.round(h * 0.14));
  const x0 = Math.max(0, Math.round((w - cols) / 2));
  const out = [];
  for (let y = y0; y < Math.min(h, y0 + rows); y++) {
    const slice = (lines[y] + " ".repeat(w)).slice(x0, x0 + cols);
    out.push(slice.padEnd(cols, " "));
  }
  while (out.length < rows) out.push(" ".repeat(cols));
  return out;
}

const sourcePath = path.join(__dirname, "photo_ascii_art.txt");
const raw = loadAsciiArt(sourcePath);
const rows = cropArt(raw, TARGET_COLS, TARGET_ROWS);
const COLS = TARGET_COLS;

const PAD = 14;
const BAR_H = 28;
const gridW = COLS * CHAR_W;
const gridH = rows.length * CHAR_H;
const W = gridW + PAD * 2;
const H = gridH + PAD * 2 + BAR_H;

const ROW_DUR = 0.55;
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
console.log(`husam-ascii.svg written (${COLS}x${rows.length} from photo_ascii_art.txt, ${(svg.length / 1024).toFixed(1)} KB)`);
