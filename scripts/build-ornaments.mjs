// Generates the decorative SVG layers used by the ceremony scenes.
// Run: node scripts/build-ornaments.mjs  → public/media/ornaments/*.svg
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'media', 'ornaments');
mkdirSync(OUT, { recursive: true });

const f = (n) => Math.round(n * 10) / 10;
const svg = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
  (defs ? `<defs>${defs}</defs>` : '') +
  body +
  `</svg>`;
const write = (name, content) => writeFileSync(join(OUT, name), content);

// Seeded random so the art is stable between builds.
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const brassDefs = (id = 'brass') => `
  <linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#4a2f0e"/><stop offset=".22" stop-color="#b9893f"/>
    <stop offset=".42" stop-color="#f6e0a8"/><stop offset=".62" stop-color="#c79b51"/>
    <stop offset="1" stop-color="#3d260b"/>
  </linearGradient>`;

/* ------------------------------------------------------------------ lantern */
function lantern() {
  const w = 300, h = 820, cx = 150;
  let chain = '';
  for (let y = 4; y < 330; y += 22) {
    const vertical = (y / 22) % 2 < 1;
    chain += vertical
      ? `<ellipse cx="${cx}" cy="${y + 11}" rx="5" ry="12" fill="none" stroke="url(#brass)" stroke-width="3.2"/>`
      : `<ellipse cx="${cx}" cy="${y + 11}" rx="2.2" ry="12" fill="none" stroke="#8a6327" stroke-width="3.2"/>`;
  }
  const pane = (x, pw, op) => `
    <path d="M${x} 600 V470 Q${x} ${430} ${x + pw / 2} ${418} Q${x + pw} ${430} ${x + pw} 470 V600 Z" fill="url(#glass)" opacity="${op}"/>
    <path d="M${x} 600 V470 Q${x} ${430} ${x + pw / 2} ${418} Q${x + pw} ${430} ${x + pw} 470 V600 Z" fill="none" stroke="#5a3a12" stroke-width="3"/>
    ${[0.25, 0.5, 0.75].map((t) => `<line x1="${x + pw * t}" y1="${440 - Math.abs(t - 0.5) * 24}" x2="${x + pw * t}" y2="600" stroke="#6b4618" stroke-width="1.6" opacity=".75"/>`).join('')}
    ${[488, 530, 572].map((y) => `<path d="M${x + 3} ${y} Q${x + pw / 2} ${y - 14} ${x + pw - 3} ${y}" fill="none" stroke="#6b4618" stroke-width="1.6" opacity=".7"/>`).join('')}`;
  const body = `
    <circle cx="${cx}" cy="520" r="150" fill="url(#halo)"/>
    ${chain}
    <circle cx="${cx}" cy="336" r="10" fill="none" stroke="url(#brass)" stroke-width="5"/>
    <path d="M${cx - 8} 344 h16 l10 26 h-36 z" fill="url(#brass)"/>
    <path d="M${cx - 58} 410 Q${cx - 50} 372 ${cx} 362 Q${cx + 50} 372 ${cx + 58} 410 Z" fill="url(#brass)"/>
    <path d="M${cx - 70} 412 h140 l-6 14 h-128 z" fill="url(#brass)"/>
    ${[-46, -23, 0, 23, 46].map((dx) => `<circle cx="${cx + dx}" cy="392" r="3.4" fill="#f6e0a8" opacity=".85"/>`).join('')}
    ${pane(cx - 62, 30, 0.75)}${pane(cx - 30, 60, 0.95)}${pane(cx + 32, 30, 0.75)}
    <ellipse cx="${cx}" cy="548" rx="14" ry="26" fill="url(#flame)"/>
    <ellipse cx="${cx}" cy="556" rx="5" ry="10" fill="#fffbe8"/>
    <rect x="${cx - 66}" y="426" width="6" height="176" fill="url(#brass)"/>
    <rect x="${cx + 60}" y="426" width="6" height="176" fill="url(#brass)"/>
    <path d="M${cx - 72} 600 h144 l-4 14 h-136 z" fill="url(#brass)"/>
    <path d="M${cx - 62} 614 L${cx} 676 L${cx + 62} 614 Z" fill="url(#brass)"/>
    ${[-36, -12, 12, 36].map((dx) => `<path d="M${cx + dx} 618 q4 14 0 24" stroke="#3d260b" stroke-width="2" fill="none" opacity=".6"/>`).join('')}
    <circle cx="${cx}" cy="684" r="9" fill="url(#brass)"/>
    <path d="M${cx} 690 v28" stroke="url(#brass)" stroke-width="4"/>
    <path d="M${cx - 9} 716 h18 l-3 52 q-6 10 -12 0 z" fill="#7a1022"/>
    ${[-6, -2, 2, 6].map((dx) => `<line x1="${cx + dx}" y1="722" x2="${cx + dx * 1.4}" y2="770" stroke="#a5172f" stroke-width="2"/>`).join('')}
    <rect x="${cx - 10}" y="712" width="20" height="8" rx="3" fill="url(#brass)"/>`;
  const defs = `${brassDefs()}
    <radialGradient id="halo"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset=".4" stop-color="#ffae47" stop-opacity=".2"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>
    <radialGradient id="flame" cx=".5" cy=".65" r=".6"><stop offset="0" stop-color="#fff8e1"/><stop offset=".45" stop-color="#ffd27a"/><stop offset="1" stop-color="#e07b1a" stop-opacity=".9"/></radialGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd98c"/><stop offset=".6" stop-color="#f3a948"/><stop offset="1" stop-color="#c8661e"/></linearGradient>`;
  write('lantern.svg', svg(w, h, body, defs));
}

/* ------------------------------------------------------------------ arcade */
// Multifoil (cusped) Mughal arch outline, from bottom-left round to bottom-right.
function archPath(x, base, width, spring, rise, lobes = 8) {
  const cx = x + width / 2;
  const top = spring - rise;
  // Pointed arch profile: quadratic-ish ogee sampled at lobe joints.
  const pts = [];
  for (let i = 0; i <= lobes; i++) {
    const t = i / lobes; // 0 at left spring, 1 at right spring
    const ang = Math.PI * (1 - t);
    const px = cx + Math.cos(ang) * (width / 2);
    const py = spring - Math.sin(ang) ** 0.8 * rise;
    // Lift the crown slightly so the arch reads as pointed rather than round.
    pts.push([px, i === lobes / 2 ? top - rise * 0.08 : py]);
  }
  let d = `M${f(x)} ${f(base)} L${f(x)} ${f(spring)}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i];
    const [qx, qy] = pts[i - 1];
    const seg = Math.hypot(px - qx, py - qy);
    d += ` A${f(seg * 0.56)} ${f(seg * 0.56)} 0 0 1 ${f(px)} ${f(py)}`;
  }
  d += ` L${f(x + width)} ${f(base)} Z`;
  return d;
}

function arcade(name, c) {
  const w = 1800, h = 1100;
  const arches = [
    { x: 90, width: 420 },
    { x: 640, width: 520 },
    { x: 1290, width: 420 },
  ];
  const base = 1010;
  const openings = arches
    .map((a) => archPath(a.x, base, a.width, a.width === 520 ? 470 : 520, a.width === 520 ? 300 : 250))
    .join(' ');
  const wall = `M0 0 H${w} V${h} H0 Z ${openings}`;
  const trims = arches
    .map((a) => {
      const big = a.width === 520;
      const inset = 26;
      return `<path d="${archPath(a.x - inset, base, a.width + inset * 2, big ? 470 : 520, (big ? 300 : 250) + inset)}" fill="none" stroke="${c.trim}" stroke-width="5" opacity=".9"/>
              <path d="${archPath(a.x, base, a.width, big ? 470 : 520, big ? 300 : 250)}" fill="none" stroke="${c.shadow}" stroke-width="16" opacity=".45"/>`;
    })
    .join('');
  // Pillars between arches with capitals and fluting.
  const pillars = [40, 560, 1210, 1730]
    .map((px) => {
      const pw = px === 40 || px === 1730 ? 46 : 64;
      const flutes = [0.3, 0.5, 0.7].map((t) => `<line x1="${px - pw / 2 + pw * t}" y1="430" x2="${px - pw / 2 + pw * t}" y2="${base - 40}" stroke="${c.shadow}" stroke-width="3" opacity=".35"/>`).join('');
      return `<rect x="${px - pw / 2}" y="420" width="${pw}" height="${base - 420}" fill="url(#pillar)"/>${flutes}
        <path d="M${px - pw / 2 - 16} 420 h${pw + 32} l-10 -26 h${-(pw + 12)} z" fill="${c.trim}" opacity=".85"/>
        <path d="M${px - pw / 2 - 12} ${base - 40} h${pw + 24} v40 h${-(pw + 24)} z" fill="${c.trim}" opacity=".7"/>`;
    })
    .join('');
  // Cornice with a row of small cusped niches and hanging bells.
  let cornice = `<rect x="0" y="96" width="${w}" height="16" fill="${c.trim}" opacity=".85"/><rect x="0" y="146" width="${w}" height="8" fill="${c.trim}" opacity=".7"/>`;
  for (let x = 20; x < w; x += 60) {
    cornice += `<path d="M${x} 146 v-22 q15 -18 30 0 v22" fill="${c.shadow}" opacity=".35"/>`;
  }
  for (let x = 50; x < w; x += 120) {
    cornice += `<path d="M${x} 154 v10" stroke="${c.trim}" stroke-width="2"/><path d="M${x - 6} 174 q6 -14 12 0 z" fill="${c.trim}"/>`;
  }
  const jaliBand = `<rect x="0" y="0" width="${w}" height="96" fill="url(#jali)" opacity=".45"/>`;
  const defs = `
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.wallTop}"/><stop offset="1" stop-color="${c.wallBottom}"/>
    </linearGradient>
    <linearGradient id="pillar" x1="0" x2="1">
      <stop offset="0" stop-color="${c.shadow}"/><stop offset=".35" stop-color="${c.wallTop}"/>
      <stop offset=".6" stop-color="${c.light}"/><stop offset="1" stop-color="${c.shadow}"/>
    </linearGradient>
    <pattern id="jali" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M16 2 L30 16 L16 30 L2 16 Z" fill="none" stroke="${c.trim}" stroke-width="1.6"/>
      <circle cx="16" cy="16" r="3" fill="${c.trim}"/>
    </pattern>
    <radialGradient id="vignette" cx=".5" cy=".55" r=".75">
      <stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/>
    </radialGradient>`;
  const body = `<path d="${wall}" fill="url(#wall)" fill-rule="evenodd"/>${jaliBand}${cornice}${pillars}${trims}
    <rect x="0" y="${base}" width="${w}" height="${h - base}" fill="${c.shadow}" opacity=".8"/>
    <rect x="0" y="${base}" width="${w}" height="6" fill="${c.trim}" opacity=".9"/>
    <path d="${wall}" fill="url(#vignette)" fill-rule="evenodd"/>`;
  write(`arcade-${name}.svg`, svg(w, h, body, defs));
}

/* ------------------------------------------------------------------ string lights */
function stringLights() {
  const w = 1800, h = 360;
  let body = '';
  const strands = [
    { y0: 20, sag: 170, n: 22 },
    { y0: 70, sag: 120, n: 18 },
  ];
  strands.forEach(({ y0, sag, n }, si) => {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      pts.push([t * w, y0 + sag * 4 * t * (1 - t)]);
    }
    body += `<path d="M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L')}" fill="none" stroke="#2b1d0e" stroke-width="2.4" opacity=".8"/>`;
    for (let i = 1; i < n; i++) {
      const t = (i + (si ? 0.5 : 0)) / n;
      const x = t * w, y = y0 + sag * 4 * t * (1 - t);
      body += `<circle cx="${f(x)}" cy="${f(y + 14)}" r="34" fill="url(#bulbGlow)"/>
        <path d="M${f(x)} ${f(y)} v6" stroke="#2b1d0e" stroke-width="2"/>
        <ellipse cx="${f(x)}" cy="${f(y + 14)}" rx="5.5" ry="8" fill="url(#bulb)"/>`;
    }
  });
  const defs = `
    <radialGradient id="bulbGlow"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".75"/><stop offset=".3" stop-color="#ffc061" stop-opacity=".28"/><stop offset="1" stop-color="#ffa53c" stop-opacity="0"/></radialGradient>
    <radialGradient id="bulb" cy=".4"><stop offset="0" stop-color="#fffdf2"/><stop offset=".6" stop-color="#ffe09a"/><stop offset="1" stop-color="#f0a443"/></radialGradient>`;
  write('string-lights.svg', svg(w, h, body, defs));
}

/* ------------------------------------------------------------------ marigolds */
function marigold(x, y, r, hue) {
  // Ruffled pom-pom: concentric rings of small petals.
  const col = hue === 'yellow' ? ['#f9c02b', '#e8a312', '#b8760a'] : ['#f58a1f', '#df6a0f', '#a8460a'];
  let g = `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${col[2]}"/>`;
  const rings = [1, 0.78, 0.52];
  rings.forEach((k, ri) => {
    const n = Math.round(12 * k + 4);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ri * 0.4 + rand() * 0.2;
      const px = x + Math.cos(a) * r * k * 0.72;
      const py = y + Math.sin(a) * r * k * 0.72;
      g += `<circle cx="${f(px)}" cy="${f(py)}" r="${f(r * 0.34 * (1.1 - ri * 0.15))}" fill="${col[ri === 0 ? 1 : 0]}"/>`;
    }
  });
  g += `<circle cx="${f(x - r * 0.25)}" cy="${f(y - r * 0.3)}" r="${f(r * 0.35)}" fill="#fff3c4" opacity=".28"/>`;
  return g;
}

function leaf(x, y, len, angle, color = '#2f6b2a') {
  const rad = (angle * Math.PI) / 180;
  const ex = x + Math.cos(rad) * len, ey = y + Math.sin(rad) * len;
  const nx = -Math.sin(rad) * len * 0.28, ny = Math.cos(rad) * len * 0.28;
  const mx = (x + ex) / 2, my = (y + ey) / 2;
  return `<path d="M${f(x)} ${f(y)} Q${f(mx + nx)} ${f(my + ny)} ${f(ex)} ${f(ey)} Q${f(mx - nx)} ${f(my - ny)} ${f(x)} ${f(y)} Z" fill="${color}"/>
    <path d="M${f(x)} ${f(y)} L${f(ex)} ${f(ey)}" stroke="#1d4419" stroke-width="1.4" opacity=".6"/>`;
}

function marigoldToran() {
  const w = 1800, h = 760;
  let body = '';
  // Swag garland across the top.
  for (let i = 0; i <= 90; i++) {
    const t = i / 90;
    const x = t * w;
    const y = 30 + 120 * Math.abs(Math.sin(t * Math.PI * 3));
    body += marigold(x, 140 - y + 30, 22, i % 3 === 0 ? 'yellow' : 'orange');
  }
  // Hanging strands with leaves and a bell.
  const strands = 11;
  for (let s = 0; s < strands; s++) {
    const x = 70 + (s * (w - 140)) / (strands - 1);
    const len = 260 + ((s * 137) % 5) * 70;
    for (let y = 150; y < 150 + len; y += 30) {
      body += marigold(x + Math.sin(y / 40) * 3, y, 17, (y / 30 + s) % 4 === 0 ? 'yellow' : 'orange');
      if ((y / 30) % 5 === 2) body += leaf(x, y, 34, 200 + (s % 2) * 140);
    }
    const by = 150 + len;
    body += `<path d="M${x} ${by} v12" stroke="#b9893f" stroke-width="3"/>
      <path d="M${x - 14} ${by + 40} Q${x - 14} ${by + 10} ${x} ${by + 10} Q${x + 14} ${by + 10} ${x + 14} ${by + 40} Z" fill="url(#brass)"/>
      <circle cx="${x}" cy="${by + 44}" r="4" fill="#7a5016"/>`;
  }
  write('marigold-toran.svg', svg(w, h, body, brassDefs()));
}

/* ------------------------------------------------------------------ banana leaf */
function bananaLeaf() {
  const w = 700, h = 1300;
  // Leaf rising from bottom-left, arching to the upper right.
  const spine = [[110, 1290], [170, 1000], [260, 720], [380, 450], [520, 220], [640, 60]];
  const path = (pts) => `M${pts.map(([x, y]) => `${x} ${y}`).join(' L')}`;
  // Build outline by offsetting the spine.
  const widths = [10, 120, 175, 185, 150, 10];
  const left = [], right = [];
  spine.forEach(([x, y], i) => {
    const [nx, ny] = i < spine.length - 1 ? spine[i + 1] : spine[i];
    const [px, py] = i > 0 ? spine[i - 1] : spine[i];
    const dx = nx - px, dy = ny - py, len = Math.hypot(dx, dy) || 1;
    const ox = (-dy / len) * widths[i], oy = (dx / len) * widths[i];
    left.push([x + ox, y + oy]);
    right.push([x - ox * 0.85, y - oy * 0.85]);
  });
  const smooth = (pts) => {
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i];
      const [nx, ny] = pts[i + 1];
      d += ` Q${f(x)} ${f(y)} ${f((x + nx) / 2)} ${f((y + ny) / 2)}`;
    }
    const last = pts[pts.length - 1];
    return d + ` L${f(last[0])} ${f(last[1])}`;
  };
  const outline = smooth(left) + ' ' + smooth([...right].reverse()).replace('M', 'L') + ' Z';
  let veins = '';
  for (let i = 0; i < 46; i++) {
    const t = 0.06 + (i / 46) * 0.88;
    const idx = Math.min(Math.floor(t * (spine.length - 1)), spine.length - 2);
    const lt = t * (spine.length - 1) - idx;
    const [ax, ay] = spine[idx], [bx, by] = spine[idx + 1];
    const x = ax + (bx - ax) * lt, y = ay + (by - ay) * lt;
    const wdt = widths[idx] + (widths[idx + 1] - widths[idx]) * lt;
    veins += `<path d="M${f(x)} ${f(y)} q${f(-wdt * 0.6)} ${f(-wdt * 0.05)} ${f(-wdt * 0.98)} ${f(wdt * 0.2)}" stroke="#2c5e22" stroke-width="1.6" fill="none" opacity=".5"/>`;
    veins += `<path d="M${f(x)} ${f(y)} q${f(wdt * 0.5)} ${f(wdt * 0.02)} ${f(wdt * 0.82)} ${f(-wdt * 0.25)}" stroke="#2c5e22" stroke-width="1.6" fill="none" opacity=".45"/>`;
  }
  // Natural tears in the blade.
  const tears = [0.32, 0.5, 0.66]
    .map((t) => {
      const idx = Math.floor(t * (spine.length - 1));
      const [x, y] = spine[idx];
      return `<path d="M${x - 30} ${y + 8} l-150 26" stroke="#000" stroke-width="5" opacity=".9"/>`;
    })
    .join('');
  const defs = `<linearGradient id="leafG" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#2d5a1e"/><stop offset=".5" stop-color="#5a9a3a"/><stop offset="1" stop-color="#8cc061"/></linearGradient>
    <mask id="tears"><rect width="${w}" height="${h}" fill="#fff"/>${tears}</mask>`;
  const body = `<g mask="url(#tears)"><path d="${outline}" fill="url(#leafG)"/>${veins}</g>
    <path d="${path(spine)}" stroke="#d8e7a6" stroke-width="7" fill="none" stroke-linecap="round" opacity=".85"/>`;
  write('banana-leaf.svg', svg(w, h, body, defs));
}

/* ------------------------------------------------------------------ jasmine strings */
function jasmineFlower(x, y, r, rot = 0) {
  let g = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})">`;
  for (let i = 0; i < 5; i++) {
    g += `<ellipse cx="0" cy="${f(-r * 0.62)}" rx="${f(r * 0.36)}" ry="${f(r * 0.62)}" fill="url(#petalW)" transform="rotate(${i * 72})"/>`;
  }
  return g + `<circle r="${f(r * 0.2)}" fill="#e9d27a"/></g>`;
}

function jasmineStrands() {
  const w = 900, h = 900;
  let body = '';
  const xs = [80, 230, 380, 520, 660, 820];
  xs.forEach((x, s) => {
    const len = 380 + ((s * 211) % 4) * 110;
    body += `<path d="M${x} 0 V${len}" stroke="#6b5a3a" stroke-width="1.5" opacity=".6"/>`;
    for (let y = 16; y < len; y += 26) {
      body += jasmineFlower(x + (rand() - 0.5) * 8, y, 12 + rand() * 3, rand() * 72);
      if (rand() > 0.6) body += `<ellipse cx="${x + 10}" cy="${y + 12}" rx="4" ry="8" fill="#f5f0de" transform="rotate(30 ${x + 10} ${y + 12})"/>`;
    }
    body += `<circle cx="${x}" cy="${len + 14}" r="11" fill="url(#brass)"/><path d="M${x - 7} ${len + 24} h14 l-3 36 h-8 z" fill="#c79b51"/>`;
  });
  const defs = `${brassDefs()}<radialGradient id="petalW" cy=".8"><stop offset="0" stop-color="#fff"/><stop offset=".75" stop-color="#f8f4e6"/><stop offset="1" stop-color="#d9d1b4"/></radialGradient>`;
  write('jasmine-strands.svg', svg(w, h, body, defs));
}

/* ------------------------------------------------------------------ drape */
function drape() {
  const w = 600, h = 1500;
  // Velvet curtain gathered by a gold rope at ~45% height.
  const tieY = 760;
  const folds = 7;
  let body = '';
  for (let i = 0; i < folds; i++) {
    const x0 = (i / folds) * w * 0.98;
    const x1 = ((i + 1) / folds) * w * 0.98;
    const tx0 = 40 + (i / folds) * 140;
    const tx1 = 40 + ((i + 1) / folds) * 140;
    const bx0 = (i / folds) * w * 0.7, bx1 = ((i + 1) / folds) * w * 0.7;
    body += `<path d="M${f(x0)} 0 L${f(x1)} 0 Q${f(x1 * 0.6)} ${tieY * 0.6} ${f(tx1)} ${tieY} Q${f(tx1 + 30)} ${tieY + 300} ${f(bx1)} ${h} L${f(bx0)} ${h} Q${f(tx0 + 30)} ${tieY + 300} ${f(tx0)} ${tieY} Q${f(x0 * 0.6)} ${tieY * 0.6} ${f(x0)} 0 Z" fill="url(#fold${i % 2})"/>`;
  }
  body += `<path d="M${w * 0.98} 0 Q${w * 0.6} ${tieY * 0.6} 180 ${tieY} Q210 ${tieY + 300} ${w * 0.7} ${h}" stroke="url(#brass)" stroke-width="10" fill="none"/>`;
  body += `<path d="M20 ${tieY - 20} Q110 ${tieY + 20} 210 ${tieY - 14}" stroke="url(#brass)" stroke-width="16" fill="none" stroke-linecap="round"/>
    <path d="M200 ${tieY - 10} q20 60 -6 150" stroke="url(#brass)" stroke-width="7" fill="none"/>
    <path d="M178 ${tieY + 140} h40 l-8 90 h-24 z" fill="#c79b51"/>
    ${[0, 1, 2, 3, 4].map((k) => `<line x1="${184 + k * 6}" y1="${tieY + 160}" x2="${182 + k * 7}" y2="${tieY + 240}" stroke="#8a6327" stroke-width="2"/>`).join('')}`;
  const defs = `${brassDefs()}
    <linearGradient id="fold0" x1="0" x2="1"><stop offset="0" stop-color="#3a0712"/><stop offset=".5" stop-color="#7d1428"/><stop offset="1" stop-color="#4a0918"/></linearGradient>
    <linearGradient id="fold1" x1="0" x2="1"><stop offset="0" stop-color="#4a0918"/><stop offset=".55" stop-color="#94203a"/><stop offset="1" stop-color="#3a0712"/></linearGradient>`;
  write('drape.svg', svg(w, h, body, defs));
}

/* ------------------------------------------------------------------ dandiya */
function dandiya() {
  const w = 620, h = 620;
  const stick = (angle) => {
    let bands = '';
    for (let i = 0; i < 14; i++) {
      const col = ['#c0182f', '#e9c889', '#1f6b3a', '#e9c889', '#2a3f9a', '#e9c889'][i % 6];
      bands += `<rect x="${-260 + i * 37}" y="-11" width="${i % 2 ? 10 : 27}" height="22" fill="${col}"/>`;
    }
    return `<g transform="translate(310 310) rotate(${angle})">
      <rect x="-262" y="-11" width="524" height="22" rx="11" fill="#e9c889"/>${bands}
      <rect x="-262" y="-11" width="524" height="22" rx="11" fill="url(#sheen)"/>
      <circle cx="268" cy="0" r="14" fill="url(#brass)"/><circle cx="-268" cy="0" r="14" fill="url(#brass)"/>
      <path d="M-268 12 q-4 40 6 70" stroke="#c0182f" stroke-width="5" fill="none"/>
      <circle cx="-262" cy="86" r="9" fill="url(#brass)"/>
    </g>`;
  };
  const defs = `${brassDefs()}<linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>`;
  write('dandiya.svg', svg(w, h, stick(-38) + stick(38), defs));
}

/* ------------------------------------------------------------------ diyas */
function diyaRow() {
  const w = 1800, h = 300;
  let body = '';
  const xs = [140, 470, 900, 1330, 1660];
  xs.forEach((x, i) => {
    const s = i === 2 ? 1.25 : i % 2 ? 1 : 0.9;
    body += `<g transform="translate(${x} 250) scale(${s})">
      <circle cx="0" cy="-70" r="120" fill="url(#halo)"/>
      <path d="M-70 -18 Q0 40 70 -18 Q60 -40 0 -36 Q-60 -40 -70 -18 Z" fill="url(#clay)"/>
      <path d="M-70 -18 Q0 -48 70 -18" fill="none" stroke="#f0c070" stroke-width="3" opacity=".7"/>
      ${[-40, -20, 0, 20, 40].map((dx) => `<circle cx="${dx}" cy="${-4 + Math.abs(dx) * 0.2}" r="3.5" fill="#f0c070" opacity=".8"/>`).join('')}
      <path d="M0 -38 C-14 -60 -6 -90 0 -112 C6 -90 14 -60 0 -38 Z" fill="url(#flame)"/>
      <ellipse cx="0" cy="-54" rx="4" ry="9" fill="#fffbe8"/>
    </g>`;
  });
  const defs = `
    <radialGradient id="halo"><stop offset="0" stop-color="#ffd27a" stop-opacity=".6"/><stop offset=".35" stop-color="#ffae47" stop-opacity=".2"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>
    <radialGradient id="flame" cx=".5" cy=".8" r=".7"><stop offset="0" stop-color="#fffbe8"/><stop offset=".4" stop-color="#ffd27a"/><stop offset="1" stop-color="#e46a12"/></radialGradient>
    <linearGradient id="clay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8682b"/><stop offset="1" stop-color="#5d2a0c"/></linearGradient>`;
  write('diya-row.svg', svg(w, h, body, defs));
}

/* ------------------------------------------------------------------ particles */
function particles() {
  write(
    'petal-marigold.svg',
    svg(60, 60, `<path d="M30 6 C46 14 52 32 40 50 C34 56 26 56 20 50 C8 32 14 14 30 6 Z" fill="url(#g)"/><path d="M30 10 V48" stroke="#b5520c" stroke-width="1.2" opacity=".4"/>`,
      `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc23a"/><stop offset="1" stop-color="#ef7a12"/></linearGradient>`),
  );
  seed = 3;
  write(
    'petal-jasmine.svg',
    svg(80, 80, jasmineFlower(40, 40, 26, 10), `<radialGradient id="petalW" cy=".8"><stop offset="0" stop-color="#fff"/><stop offset=".75" stop-color="#f8f4e6"/><stop offset="1" stop-color="#d9d1b4"/></radialGradient>`),
  );
  write(
    'sparkle.svg',
    svg(80, 80, `<circle cx="40" cy="40" r="38" fill="url(#s)"/><circle cx="40" cy="40" r="4" fill="#fff7dc"/>`,
      `<radialGradient id="s"><stop offset="0" stop-color="#ffe7a8" stop-opacity=".9"/><stop offset=".25" stop-color="#f3c26a" stop-opacity=".35"/><stop offset="1" stop-color="#e9a13c" stop-opacity="0"/></radialGradient>`),
  );
}

/* ------------------------------------------------------------------ portrait frame */
// Gold-matted frame that sits behind a 563:1000 portrait panel (22-unit margin on every side).
function portraitFrame() {
  const w = 607, h = 1044;
  const corner = (x, y) => `<g transform="translate(${x} ${y})"><path d="M0 -9 L9 0 L0 9 L-9 0 Z" fill="#e9c889"/><circle r="3" fill="#7a1022"/></g>`;
  const body = `
    <rect x="12" y="16" width="${w - 24}" height="${h - 24}" fill="#000" opacity=".55" filter="url(#sh)"/>
    <rect x="3" y="3" width="${w - 6}" height="${h - 6}" fill="url(#velvet)" stroke="#c79b51" stroke-width="2.4"/>
    <rect x="11" y="11" width="${w - 22}" height="${h - 22}" fill="none" stroke="#e9c889" stroke-width="1" opacity=".75"/>
    ${corner(11, 11)}${corner(w - 11, 11)}${corner(11, h - 11)}${corner(w - 11, h - 11)}`;
  const defs = `<filter id="sh" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="9"/></filter>
    <linearGradient id="velvet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a0f22"/><stop offset="1" stop-color="#2c0510"/></linearGradient>`;
  write('frame-portrait.svg', svg(w, h, body, defs));
}

lantern();
portraitFrame();
// Walls stay deep so ivory text beside the artwork keeps strong contrast; arch openings glow.
arcade('engagement', { wallTop: '#6e1838', wallBottom: '#3c0a1f', trim: '#c79b51', shadow: '#22040f', light: '#a4365c' });
arcade('mandap', { wallTop: '#1b4a35', wallBottom: '#0a2419', trim: '#c79b51', shadow: '#04130c', light: '#2f6a4e' });
arcade('haldi', { wallTop: '#9a4f10', wallBottom: '#5a2a05', trim: '#f2d27c', shadow: '#2e1402', light: '#c9741e' });
arcade('garba', { wallTop: '#132a4a', wallBottom: '#071b31', trim: '#c79b51', shadow: '#020a14', light: '#24406a' });
arcade('wedding', { wallTop: '#5e1222', wallBottom: '#2e0610', trim: '#c79b51', shadow: '#16020a', light: '#8a2a3c' });
stringLights();
marigoldToran();
bananaLeaf();
jasmineStrands();
drape();
dandiya();
diyaRow();
particles();
console.log('ornaments written to', OUT);
