#!/usr/bin/env node
/**
 * generate-venue-svgs.mjs
 * Generates:
 * 1) /public/assets/partner-kakao-besta12.svg (footer badge)
 * 2) 3 unique model-fun SVGs per venue
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VENUES_PATH = join(ROOT, 'data', 'venues.json');
const PUBLIC = join(ROOT, 'public');

// Seeded PRNG
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ─── Footer badge SVG ───
function generateFooterBadge() {
  const dir = join(PUBLIC, 'assets');
  mkdirSync(dir, { recursive: true });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 120" width="480" height="120">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFE812;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#FFC107;stop-opacity:1"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="480" height="120" rx="20" fill="url(#bg)" filter="url(#shadow)"/>
  <g transform="translate(30,25)">
    <rect width="70" height="70" rx="16" fill="#3C1E1E"/>
    <path d="M15,52 C15,30 55,30 55,52 L55,55 C55,58 50,62 35,62 C20,62 15,58 15,55Z" fill="#FFE812"/>
    <circle cx="28" cy="40" r="5" fill="#3C1E1E"/>
    <circle cx="42" cy="40" r="5" fill="#3C1E1E"/>
  </g>
  <text x="120" y="50" font-family="'Noto Sans KR',sans-serif" font-size="22" font-weight="700" fill="#3C1E1E">제휴문의 카톡</text>
  <text x="120" y="85" font-family="'Noto Sans KR',monospace" font-size="30" font-weight="900" fill="#3C1E1E">besta12</text>
  <rect x="350" y="35" width="110" height="50" rx="12" fill="#3C1E1E"/>
  <text x="405" y="67" font-family="'Noto Sans KR',sans-serif" font-size="16" font-weight="700" fill="#FFE812" text-anchor="middle">ID 복사</text>
</svg>`;
  writeFileSync(join(dir, 'partner-kakao-besta12.svg'), svg, 'utf8');
  console.log('✅ Footer badge SVG generated');
}

// ─── Venue illustration SVGs ───
// Scene 1: Entrance/street vibe - silhouettes approaching venue
function generateScene1(seed, typeColor, accentColor) {
  const rng = mulberry32(seed);
  const r = () => rng();

  // Vary building heights and positions
  const buildings = Array.from({ length: 5 }, (_, i) => {
    const x = 20 + i * 80 + r() * 30;
    const h = 100 + r() * 160;
    const w = 50 + r() * 40;
    return `<rect x="${x}" y="${320 - h}" width="${w}" height="${h}" fill="#1a1a2e" opacity="${0.4 + r() * 0.3}" rx="2"/>`;
  }).join('');

  // Silhouette figures (3-5)
  const figCount = 3 + Math.floor(r() * 3);
  const figures = Array.from({ length: figCount }, (_, i) => {
    const x = 60 + i * 75 + r() * 30;
    const h = 55 + r() * 20;
    const legSpread = 5 + r() * 8;
    return `<g transform="translate(${x},${310 - h})">
      <ellipse cx="0" cy="0" rx="7" ry="8" fill="#2d2d44"/>
      <line x1="0" y1="8" x2="0" y2="${h * 0.5}" stroke="#2d2d44" stroke-width="4" stroke-linecap="round"/>
      <line x1="0" y1="${h * 0.5}" x2="-${legSpread}" y2="${h * 0.75}" stroke="#2d2d44" stroke-width="3" stroke-linecap="round"/>
      <line x1="0" y1="${h * 0.5}" x2="${legSpread}" y2="${h * 0.75}" stroke="#2d2d44" stroke-width="3" stroke-linecap="round"/>
      <line x1="0" y1="15" x2="-${8 + r() * 6}" y2="${20 + r() * 15}" stroke="#2d2d44" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="0" y1="15" x2="${8 + r() * 6}" y2="${20 + r() * 15}" stroke="#2d2d44" stroke-width="2.5" stroke-linecap="round"/>
    </g>`;
  }).join('');

  // Neon glow effects
  const neonLines = Array.from({ length: 3 }, (_, i) => {
    const x1 = 50 + r() * 400;
    const y1 = 80 + r() * 80;
    return `<line x1="${x1}" y1="${y1}" x2="${x1 + 40 + r() * 60}" y2="${y1 + r() * 10 - 5}" stroke="${i % 2 === 0 ? typeColor : accentColor}" stroke-width="3" opacity="0.6" stroke-linecap="round"/>`;
  }).join('');

  // Light puddles on ground
  const puddles = Array.from({ length: 4 }, () => {
    const cx = 50 + r() * 400;
    return `<ellipse cx="${cx}" cy="315" rx="${20 + r() * 30}" ry="4" fill="${typeColor}" opacity="${0.15 + r() * 0.1}"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 340" width="500" height="340">
  <defs>
    <linearGradient id="sky1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a1a"/>
      <stop offset="100%" style="stop-color:#1a1a3e"/>
    </linearGradient>
  </defs>
  <rect width="500" height="340" fill="url(#sky1)"/>
  ${buildings}
  <rect x="0" y="310" width="500" height="30" fill="#121225"/>
  ${puddles}
  ${neonLines}
  ${figures}
  <circle cx="${50 + r() * 400}" cy="${30 + r() * 40}" r="1.5" fill="#fff" opacity="0.7"/>
  <circle cx="${50 + r() * 400}" cy="${20 + r() * 50}" r="1" fill="#fff" opacity="0.5"/>
  <circle cx="${50 + r() * 400}" cy="${30 + r() * 40}" r="1.5" fill="#fff" opacity="0.6"/>
</svg>`;
}

// Scene 2: Table/conversation vibe
function generateScene2(seed, typeColor, accentColor) {
  const rng = mulberry32(seed + 1000);
  const r = () => rng();

  // Table
  const tableX = 120 + r() * 50;
  const tableW = 200 + r() * 60;

  // Seated silhouettes
  const seated = Array.from({ length: 3 + Math.floor(r() * 2) }, (_, i) => {
    const x = tableX + 30 + i * (tableW / 4);
    const lean = r() > 0.5 ? -3 : 3;
    return `<g transform="translate(${x}, 180)">
      <ellipse cx="0" cy="-25" rx="8" ry="9" fill="#2d2d44"/>
      <rect x="-8" y="-16" width="16" height="30" rx="4" fill="#2d2d44"/>
      <line x1="-5" y1="14" x2="-12" y2="35" stroke="#2d2d44" stroke-width="3" stroke-linecap="round"/>
      <line x1="5" y1="14" x2="12" y2="35" stroke="#2d2d44" stroke-width="3" stroke-linecap="round"/>
      <line x1="${lean}" y1="-5" x2="${lean * 3}" y2="8" stroke="#2d2d44" stroke-width="2.5" stroke-linecap="round"/>
    </g>`;
  }).join('');

  // Drinks on table
  const drinks = Array.from({ length: 4 }, (_, i) => {
    const x = tableX + 50 + i * 50 + r() * 20;
    const h = 12 + r() * 8;
    return `<rect x="${x}" y="${198 - h}" width="8" height="${h}" rx="2" fill="${r() > 0.5 ? typeColor : accentColor}" opacity="0.7"/>`;
  }).join('');

  // Ambient lights
  const ambients = Array.from({ length: 6 }, () => {
    return `<circle cx="${30 + r() * 440}" cy="${30 + r() * 100}" r="${3 + r() * 8}" fill="${r() > 0.5 ? typeColor : accentColor}" opacity="${0.1 + r() * 0.15}"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 340" width="500" height="340">
  <defs>
    <radialGradient id="glow2" cx="50%" cy="40%" r="60%">
      <stop offset="0%" style="stop-color:${typeColor};stop-opacity:0.15"/>
      <stop offset="100%" style="stop-color:#0a0a1a;stop-opacity:0"/>
    </radialGradient>
  </defs>
  <rect width="500" height="340" fill="#0f0f1f"/>
  <rect width="500" height="340" fill="url(#glow2)"/>
  ${ambients}
  <rect x="${tableX}" y="200" width="${tableW}" height="8" rx="3" fill="#2a2a40"/>
  <rect x="${tableX + 10}" y="208" width="6" height="50" fill="#1a1a30"/>
  <rect x="${tableX + tableW - 16}" y="208" width="6" height="50" fill="#1a1a30"/>
  ${drinks}
  ${seated}
  <rect x="0" y="258" width="500" height="82" fill="#0d0d1a" opacity="0.5"/>
</svg>`;
}

// Scene 3: Dance floor / energy vibe
function generateScene3(seed, typeColor, accentColor) {
  const rng = mulberry32(seed + 2000);
  const r = () => rng();

  // Dancing silhouettes
  const dancers = Array.from({ length: 7 + Math.floor(r() * 4) }, (_, i) => {
    const x = 30 + i * 42 + r() * 20;
    const y = 200 + r() * 40;
    const armAngle1 = -30 + r() * 120;
    const armAngle2 = -30 + r() * 120;
    const legSpread = 8 + r() * 12;
    const scale = 0.7 + r() * 0.4;

    return `<g transform="translate(${x},${y}) scale(${scale})">
      <ellipse cx="0" cy="-40" rx="7" ry="8" fill="#2d2d44"/>
      <line x1="0" y1="-32" x2="0" y2="0" stroke="#2d2d44" stroke-width="4" stroke-linecap="round"/>
      <line x1="0" y1="0" x2="-${legSpread}" y2="30" stroke="#2d2d44" stroke-width="3" stroke-linecap="round"/>
      <line x1="0" y1="0" x2="${legSpread}" y2="30" stroke="#2d2d44" stroke-width="3" stroke-linecap="round"/>
      <line x1="0" y1="-25" x2="${-15 + r() * 30}" y2="${-35 + r() * 20}" stroke="#2d2d44" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="0" y1="-25" x2="${-15 + r() * 30}" y2="${-35 + r() * 20}" stroke="#2d2d44" stroke-width="2.5" stroke-linecap="round"/>
    </g>`;
  }).join('');

  // Light beams
  const beams = Array.from({ length: 5 }, (_, i) => {
    const x = 50 + i * 100 + r() * 40;
    const color = [typeColor, accentColor, '#ff00ff', '#00ffff', '#ffff00'][i % 5];
    return `<polygon points="${x},0 ${x - 30},340 ${x + 30},340" fill="${color}" opacity="${0.05 + r() * 0.08}"/>`;
  }).join('');

  // Sparkle effects
  const sparkles = Array.from({ length: 12 }, () => {
    return `<circle cx="${r() * 500}" cy="${r() * 250}" r="${1 + r() * 2}" fill="#fff" opacity="${0.3 + r() * 0.5}"/>`;
  }).join('');

  // DJ booth (top center)
  const djBooth = `<rect x="190" y="60" width="120" height="50" rx="6" fill="#1a1a30" stroke="${typeColor}" stroke-width="1.5" opacity="0.8"/>
  <rect x="210" y="70" width="30" height="30" rx="15" fill="#2d2d44"/>
  <rect x="255" y="70" width="30" height="30" rx="15" fill="#2d2d44"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 340" width="500" height="340">
  <rect width="500" height="340" fill="#0a0a18"/>
  ${beams}
  ${djBooth}
  <rect x="0" y="280" width="500" height="60" fill="#0f0f20" opacity="0.7"/>
  ${dancers}
  ${sparkles}
</svg>`;
}

function generateVenueSVGs() {
  const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf8'));

  const TYPE_COLORS = {
    club: { primary: '#8b5cf6', accent: '#ec4899' },
    night: { primary: '#f59e0b', accent: '#ef4444' },
    lounge: { primary: '#06b6d4', accent: '#8b5cf6' },
  };

  let count = 0;
  for (const venue of venues) {
    const dir = join(PUBLIC, 'venues', venue.venueSlug);
    mkdirSync(dir, { recursive: true });

    const seed = hashStr(venue.name_input);
    const colors = TYPE_COLORS[venue.type];

    const svg1 = generateScene1(seed, colors.primary, colors.accent);
    const svg2 = generateScene2(seed, colors.primary, colors.accent);
    const svg3 = generateScene3(seed, colors.primary, colors.accent);

    writeFileSync(join(dir, 'model-fun-1.svg'), svg1, 'utf8');
    writeFileSync(join(dir, 'model-fun-2.svg'), svg2, 'utf8');
    writeFileSync(join(dir, 'model-fun-3.svg'), svg3, 'utf8');
    count++;
  }
  console.log(`✅ Generated SVGs for ${count} venues (3 each = ${count * 3} total)`);
}

// Run
generateFooterBadge();
generateVenueSVGs();
