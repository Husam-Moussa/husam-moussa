// Generates info-card.svg: a neofetch-style profile panel whose lines
// slide in one after another, ending with a neofetch color palette.
// Usage: node scripts/make_info_card.js
"use strict";
const fs = require("fs");
const path = require("path");

const LINES = [
  { key: "husam", sep: "@", val: "atmosphere", header: true },
  { rule: true },
  { key: "Role", val: "Founder & Full-Stack Developer" },
  { key: "Company", val: "Atmosphere — EdTech for Lebanon" },
  { key: "Education", val: "Computer Engineering @ LIU" },
  { key: "Stack", val: "React · Next.js · TypeScript · Node.js" },
  { key: "Databases", val: "PostgreSQL · MySQL · MongoDB · Supabase" },
  { key: "Specialties", val: "State mgmt · DB design · SEO" },
  { key: "Shipped", val: "School management system — live client" },
  { key: "Freelance", val: "Next.js lead-gen site (Dubai · LB · KSA)" },
  { key: "Focus", val: "Scalable, AI-assisted, user-first products" },
  { key: "Portfolio", val: "husammportfolio.vercel.app" },
  { key: "Contact", val: "husammusa864@gmail.com" },
  { blank: true },
  { palette: true },
];

const W = 490;
const LINE_H = 24;
const PAD_X = 26;
const PAD_TOP = 40;
const H = PAD_TOP + LINES.length * LINE_H + 26;
const STAGGER = 0.18;

const PALETTE = ["#ff5f56", "#ffbd2e", "#27c93f", "#22d3ee", "#6366f1", "#8b5cf6", "#e6edf3", "#8b949e"];

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

let body = "";
LINES.forEach((line, i) => {
  const y = PAD_TOP + i * LINE_H;
  const begin = (0.3 + i * STAGGER).toFixed(2);
  let content = "";
  if (line.header) {
    content = `<text x="${PAD_X}" y="${y}" class="hdr"><tspan class="k">${line.key}</tspan><tspan class="dim">${line.sep}</tspan><tspan class="v2">${line.val}</tspan></text>`;
  } else if (line.rule) {
    content = `<text x="${PAD_X}" y="${y}" class="dim">${"─".repeat(44)}</text>`;
  } else if (line.palette) {
    content = PALETTE.map((c, j) =>
      `<rect x="${PAD_X + j * 26}" y="${y - 12}" width="22" height="14" rx="3" fill="${c}"/>`
    ).join("");
  } else if (line.blank) {
    content = "";
  } else {
    content = `<text x="${PAD_X}" y="${y}"><tspan class="k">${esc(line.key)}</tspan><tspan class="dim">: </tspan><tspan class="v">${esc(line.val)}</tspan></text>`;
  }
  if (!content) return;
  body += `<g opacity="0" transform="translate(-14 0)">
  <animate attributeName="opacity" from="0" to="1" begin="${begin}s" dur="0.45s" fill="freeze"/>
  <animateTransform attributeName="transform" type="translate" from="-14 0" to="0 0" begin="${begin}s" dur="0.45s" fill="freeze"/>
  ${content}
</g>\n`;
});

const cursorY = PAD_TOP + (LINES.length - 3) * LINE_H;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>
  text { font-family: 'Consolas','SF Mono','DejaVu Sans Mono',monospace; font-size: 14px; fill: #c9d1d9; }
  .hdr { font-size: 16px; font-weight: bold; }
  .k { fill: #22d3ee; font-weight: bold; }
  .v { fill: #e6edf3; }
  .v2 { fill: #8b5cf6; font-weight: bold; }
  .dim { fill: #484f58; }
  .title { font-size: 11px; fill: #8b949e; font-weight: normal; }
</style>
<rect width="${W}" height="${H}" rx="10" fill="#0d1117" stroke="#30363d"/>
<rect width="${W}" height="28" rx="10" fill="#161b22"/>
<rect y="18" width="${W}" height="10" fill="#161b22"/>
<circle cx="18" cy="14" r="5" fill="#ff5f56"/>
<circle cx="36" cy="14" r="5" fill="#ffbd2e"/>
<circle cx="54" cy="14" r="5" fill="#27c93f"/>
<text class="title" x="${W / 2}" y="18" text-anchor="middle">husam — fetch</text>
${body}</svg>
`;

fs.writeFileSync(path.join(__dirname, "..", "info-card.svg"), svg);
console.log(`info-card.svg written (${(svg.length / 1024).toFixed(1)} KB)`);
