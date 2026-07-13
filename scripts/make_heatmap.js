// Generates contrib-heatmap.svg: an animated GitHub contribution graph built
// from real data (scripts/contrib.json), cells revealing one by one.
// Usage: node scripts/make_heatmap.js
// Refresh data: https://github-contributions-api.jogruber.de/v4/husam-moussa?y=last
"use strict";
const fs = require("fs");
const path = require("path");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "contrib.json"), "utf8"));
const days = data.contributions;
const total = data.total.lastYear ?? Object.values(data.total)[0];

const CELL = 12;
const GAP = 3;
const STEP = CELL + GAP;
const LEFT = 34;   // room for day labels
const TOP = 48;    // room for title + month labels
const COLORS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// arrange into week columns starting on Sunday
const firstDow = new Date(days[0].date + "T00:00:00Z").getUTCDay();
const weeks = [];
let week = new Array(firstDow).fill(null);
for (const d of days) {
  week.push(d);
  if (week.length === 7) { weeks.push(week); week = []; }
}
if (week.length) weeks.push(week);

const W = LEFT + weeks.length * STEP + 12;
const H = TOP + 7 * STEP + 34;

let cells = "";
let monthLabels = "";
let lastMonth = -1;
weeks.forEach((wk, wx) => {
  const firstDay = wk.find(Boolean);
  if (firstDay) {
    const m = new Date(firstDay.date + "T00:00:00Z").getUTCMonth();
    if (m !== lastMonth && wx < weeks.length - 1) {
      monthLabels += `<text class="lbl" x="${LEFT + wx * STEP}" y="${TOP - 10}">${MONTHS[m]}</text>`;
      lastMonth = m;
    }
  }
  wk.forEach((d, dy) => {
    if (!d) return;
    const idx = wx * 7 + dy;
    const delay = (idx * 0.006).toFixed(3);
    const x = LEFT + wx * STEP;
    const y = TOP + dy * STEP;
    cells += `<rect class="c" x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2.5" fill="${COLORS[d.level]}" style="animation-delay:${delay}s"><title>${d.date}: ${d.count} contribution${d.count === 1 ? "" : "s"}</title></rect>\n`;
  });
});

const legendX = W - 12 - 5 * (CELL + 4) - 62;
const legend = `<text class="lbl" x="${legendX - 6}" y="${H - 14}" text-anchor="end">Less</text>` +
  COLORS.map((c, i) => `<rect x="${legendX + i * (CELL + 4)}" y="${H - 24}" width="${CELL}" height="${CELL}" rx="2.5" fill="${c}"/>`).join("") +
  `<text class="lbl" x="${legendX + 5 * (CELL + 4) + 6}" y="${H - 14}">More</text>`;

const dayLabels = [["Mon", 1], ["Wed", 3], ["Fri", 5]]
  .map(([n, r]) => `<text class="lbl" x="${LEFT - 8}" y="${TOP + r * STEP + CELL - 3}" text-anchor="end">${n}</text>`)
  .join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>
  .lbl { font-family: 'Segoe UI',Helvetica,Arial,sans-serif; font-size: 10px; fill: #8b949e; }
  .title { font-family: 'Segoe UI',Helvetica,Arial,sans-serif; font-size: 13px; font-weight: 600; fill: #e6edf3; }
  .accent { fill: #39d353; }
  .c { opacity: 0; transform-origin: center; transform-box: fill-box; animation: pop 0.5s ease-out forwards; }
  @keyframes pop {
    0% { opacity: 0; transform: scale(0); }
    70% { opacity: 1; transform: scale(1.25); }
    100% { opacity: 1; transform: scale(1); }
  }
</style>
<rect width="${W}" height="${H}" rx="10" fill="#0d1117" stroke="#30363d"/>
<text class="title" x="${LEFT}" y="24"><tspan class="accent">${total}</tspan> contributions in the last year</text>
${monthLabels}
${dayLabels}
${cells}${legend}
</svg>
`;

fs.writeFileSync(path.join(__dirname, "..", "contrib-heatmap.svg"), svg);
console.log(`contrib-heatmap.svg written (${weeks.length} weeks, ${total} contributions, ${(svg.length / 1024).toFixed(1)} KB)`);
