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

// ─── Guide illustration SVGs ───
function generateGuideSVGs() {
  const dir = join(PUBLIC, 'guides');
  mkdirSync(dir, { recursive: true });

  const guideConfigs = {
    'first-visit': { title: '첫 방문', primary: '#8b5cf6', accent: '#ec4899' },
    'dress-code': { title: '드레스코드', primary: '#ec4899', accent: '#f59e0b' },
    'budget-guide': { title: '예산', primary: '#f59e0b', accent: '#06b6d4' },
    'safety-tips': { title: '안전', primary: '#3b82f6', accent: '#06b6d4' },
    'music-genres': { title: '음악', primary: '#8b5cf6', accent: '#ec4899' },
    'solo-nightlife': { title: '솔로', primary: '#06b6d4', accent: '#8b5cf6' },
    'group-party': { title: '단체', primary: '#ec4899', accent: '#f59e0b' },
    'regional-nightlife': { title: '지역별', primary: '#f59e0b', accent: '#ef4444' },
  };

  // first-visit: 문/입구 + 환영 인물
  function guideFirstVisit(p, a) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 260" width="500" height="260">
  <defs>
    <linearGradient id="gfv" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a1a"/><stop offset="100%" style="stop-color:#1a1a3e"/>
    </linearGradient>
  </defs>
  <rect width="500" height="260" fill="url(#gfv)"/>
  <rect x="180" y="40" width="140" height="180" rx="6" fill="#1a1a2e" stroke="${p}" stroke-width="2"/>
  <rect x="200" y="50" width="100" height="160" rx="4" fill="#12121f"/>
  <rect x="290" y="110" width="8" height="8" rx="4" fill="${a}"/>
  <ellipse cx="250" cy="245" rx="80" ry="6" fill="${p}" opacity="0.15"/>
  <g transform="translate(250,140)">
    <ellipse cx="0" cy="-35" rx="10" ry="12" fill="#2d2d44"/>
    <rect x="-12" y="-23" width="24" height="40" rx="5" fill="#2d2d44"/>
    <line x1="-8" y1="17" x2="-15" y2="45" stroke="#2d2d44" stroke-width="4" stroke-linecap="round"/>
    <line x1="8" y1="17" x2="15" y2="45" stroke="#2d2d44" stroke-width="4" stroke-linecap="round"/>
    <line x1="-12" y1="-5" x2="-25" y2="10" stroke="#2d2d44" stroke-width="3" stroke-linecap="round"/>
    <line x1="12" y1="-5" x2="25" y2="-15" stroke="#2d2d44" stroke-width="3" stroke-linecap="round"/>
  </g>
  <text x="250" y="30" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="${p}" opacity="0.6">WELCOME</text>
  <line x1="150" y1="220" x2="350" y2="220" stroke="${p}" stroke-width="2" opacity="0.3"/>
  <circle cx="80" cy="50" r="2" fill="#fff" opacity="0.5"/>
  <circle cx="420" cy="80" r="1.5" fill="#fff" opacity="0.4"/>
  <circle cx="60" cy="180" r="1" fill="#fff" opacity="0.6"/>
  <circle cx="440" cy="200" r="1.5" fill="#fff" opacity="0.3"/>
</svg>`;
  }

  // dress-code: 옷걸이 + 패션 아이콘
  function guideDressCode(p, a) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 260" width="500" height="260">
  <rect width="500" height="260" fill="#0f0f1f"/>
  <g transform="translate(250,20)">
    <path d="M-2,0 L-40,25 L-30,30 L-10,18 L-10,80 L10,80 L10,18 L30,30 L40,25 L2,0 Z" fill="none" stroke="${p}" stroke-width="2.5"/>
    <circle cx="0" cy="-5" r="8" fill="none" stroke="${p}" stroke-width="2"/>
  </g>
  <rect x="60" y="120" width="80" height="110" rx="8" fill="#1a1a2e" stroke="${p}" stroke-width="1.5"/>
  <rect x="70" y="130" width="60" height="40" rx="4" fill="${p}" opacity="0.15"/>
  <line x1="80" y1="185" x2="130" y2="185" stroke="${a}" stroke-width="2" opacity="0.4"/>
  <line x1="80" y1="195" x2="120" y2="195" stroke="${a}" stroke-width="2" opacity="0.3"/>
  <rect x="210" y="120" width="80" height="110" rx="8" fill="#1a1a2e" stroke="${a}" stroke-width="1.5"/>
  <rect x="220" y="130" width="60" height="40" rx="4" fill="${a}" opacity="0.15"/>
  <line x1="230" y1="185" x2="280" y2="185" stroke="${p}" stroke-width="2" opacity="0.4"/>
  <line x1="230" y1="195" x2="270" y2="195" stroke="${p}" stroke-width="2" opacity="0.3"/>
  <rect x="360" y="120" width="80" height="110" rx="8" fill="#1a1a2e" stroke="${p}" stroke-width="1.5"/>
  <rect x="370" y="130" width="60" height="40" rx="4" fill="${p}" opacity="0.15"/>
  <line x1="380" y1="185" x2="430" y2="185" stroke="${a}" stroke-width="2" opacity="0.4"/>
  <line x1="380" y1="195" x2="420" y2="195" stroke="${a}" stroke-width="2" opacity="0.3"/>
  <circle cx="100" y="155" r="3" fill="${p}" opacity="0.3"/>
  <circle cx="250" y="155" r="3" fill="${a}" opacity="0.3"/>
  <circle cx="400" y="155" r="3" fill="${p}" opacity="0.3"/>
</svg>`;
  }

  // budget-guide: 동전/지갑
  function guideBudget(p, a) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 260" width="500" height="260">
  <rect width="500" height="260" fill="#0a0a1a"/>
  <defs>
    <radialGradient id="gbg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:${p};stop-opacity:0.1"/>
      <stop offset="100%" style="stop-color:#0a0a1a;stop-opacity:0"/>
    </radialGradient>
  </defs>
  <rect width="500" height="260" fill="url(#gbg)"/>
  <rect x="150" y="80" width="200" height="120" rx="16" fill="#1a1a2e" stroke="${p}" stroke-width="2"/>
  <rect x="150" y="80" width="200" height="35" rx="16" fill="${p}" opacity="0.2"/>
  <rect x="300" y="125" width="30" height="20" rx="4" fill="${a}" opacity="0.3"/>
  <circle cx="120" cy="70" r="25" fill="#1a1a2e" stroke="${p}" stroke-width="2"/>
  <text x="120" y="76" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="700" fill="${p}">₩</text>
  <circle cx="90" cy="100" r="20" fill="#1a1a2e" stroke="${a}" stroke-width="1.5"/>
  <text x="90" y="106" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="700" fill="${a}">₩</text>
  <circle cx="400" cy="90" r="22" fill="#1a1a2e" stroke="${p}" stroke-width="2"/>
  <text x="400" y="96" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="${p}">₩</text>
  <rect x="180" y="140" width="50" height="8" rx="4" fill="${p}" opacity="0.3"/>
  <rect x="180" y="155" width="80" height="6" rx="3" fill="${a}" opacity="0.2"/>
  <rect x="180" y="168" width="60" height="6" rx="3" fill="${p}" opacity="0.2"/>
  <circle cx="60" cy="200" r="1.5" fill="#fff" opacity="0.4"/>
  <circle cx="450" cy="180" r="1" fill="#fff" opacity="0.5"/>
</svg>`;
  }

  // safety-tips: 방패
  function guideSafety(p, a) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 260" width="500" height="260">
  <rect width="500" height="260" fill="#0a0a1a"/>
  <defs>
    <radialGradient id="gsg" cx="50%" cy="40%" r="50%">
      <stop offset="0%" style="stop-color:${p};stop-opacity:0.12"/>
      <stop offset="100%" style="stop-color:#0a0a1a;stop-opacity:0"/>
    </radialGradient>
  </defs>
  <rect width="500" height="260" fill="url(#gsg)"/>
  <path d="M250,30 L310,55 L310,130 C310,180 250,220 250,220 C250,220 190,180 190,130 L190,55 Z" fill="#1a1a2e" stroke="${p}" stroke-width="2.5"/>
  <path d="M250,50 L295,70 L295,128 C295,168 250,200 250,200 C250,200 205,168 205,128 L205,70 Z" fill="${p}" opacity="0.1"/>
  <path d="M232,120 L245,135 L272,100" fill="none" stroke="${a}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="100" cy="80" r="30" fill="#1a1a2e" stroke="${a}" stroke-width="1.5" opacity="0.5"/>
  <line x1="90" y1="80" x2="110" y2="80" stroke="${a}" stroke-width="2" opacity="0.5"/>
  <line x1="100" y1="70" x2="100" y2="90" stroke="${a}" stroke-width="2" opacity="0.5"/>
  <circle cx="400" cy="180" r="25" fill="#1a1a2e" stroke="${p}" stroke-width="1.5" opacity="0.5"/>
  <text x="400" y="186" text-anchor="middle" font-family="sans-serif" font-size="18" fill="${p}" opacity="0.5">!</text>
  <circle cx="70" cy="200" r="1.5" fill="#fff" opacity="0.4"/>
  <circle cx="430" cy="60" r="1" fill="#fff" opacity="0.5"/>
  <circle cx="450" cy="40" r="1.5" fill="#fff" opacity="0.3"/>
</svg>`;
  }

  // music-genres: DJ 턴테이블 + 음표
  function guideMusic(p, a) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 260" width="500" height="260">
  <rect width="500" height="260" fill="#0a0a18"/>
  <rect x="150" y="60" width="200" height="140" rx="12" fill="#1a1a2e" stroke="${p}" stroke-width="2"/>
  <circle cx="220" cy="130" r="40" fill="#12121f" stroke="${p}" stroke-width="1.5"/>
  <circle cx="220" cy="130" r="15" fill="${p}" opacity="0.2"/>
  <circle cx="220" cy="130" r="3" fill="${p}"/>
  <circle cx="330" cy="130" r="40" fill="#12121f" stroke="${a}" stroke-width="1.5"/>
  <circle cx="330" cy="130" r="15" fill="${a}" opacity="0.2"/>
  <circle cx="330" cy="130" r="3" fill="${a}"/>
  <line x1="220" y1="90" x2="235" y2="95" stroke="${p}" stroke-width="1" opacity="0.5"/>
  <line x1="330" y1="90" x2="345" y2="95" stroke="${a}" stroke-width="1" opacity="0.5"/>
  <g transform="translate(80,70)">
    <line x1="0" y1="0" x2="0" y2="50" stroke="${a}" stroke-width="2.5"/>
    <circle cx="0" cy="50" r="8" fill="${a}" opacity="0.6"/>
    <path d="M0,0 Q15,-10 12,15" fill="${a}" opacity="0.4"/>
  </g>
  <g transform="translate(420,50)">
    <line x1="0" y1="0" x2="0" y2="45" stroke="${p}" stroke-width="2.5"/>
    <circle cx="0" cy="45" r="7" fill="${p}" opacity="0.6"/>
    <path d="M0,0 Q12,-8 10,12" fill="${p}" opacity="0.4"/>
  </g>
  <g transform="translate(60,170)">
    <line x1="0" y1="0" x2="0" y2="35" stroke="${p}" stroke-width="2"/>
    <circle cx="0" cy="35" r="6" fill="${p}" opacity="0.5"/>
    <path d="M0,0 Q10,-6 8,10" fill="${p}" opacity="0.3"/>
  </g>
  <g transform="translate(450,150)">
    <line x1="0" y1="0" x2="0" y2="40" stroke="${a}" stroke-width="2"/>
    <circle cx="0" cy="40" r="7" fill="${a}" opacity="0.5"/>
    <path d="M0,0 Q12,-8 10,12" fill="${a}" opacity="0.3"/>
  </g>
  <rect x="260" y="205" width="30" height="15" rx="3" fill="${p}" opacity="0.3"/>
  <rect x="220" y="205" width="30" height="15" rx="3" fill="${a}" opacity="0.3"/>
</svg>`;
  }

  // solo-nightlife: 바 카운터 + 1인
  function guideSolo(p, a) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 260" width="500" height="260">
  <rect width="500" height="260" fill="#0f0f1f"/>
  <defs>
    <radialGradient id="gsl" cx="50%" cy="30%" r="60%">
      <stop offset="0%" style="stop-color:${p};stop-opacity:0.12"/>
      <stop offset="100%" style="stop-color:#0f0f1f;stop-opacity:0"/>
    </radialGradient>
  </defs>
  <rect width="500" height="260" fill="url(#gsl)"/>
  <rect x="50" y="160" width="400" height="12" rx="4" fill="#1a1a2e"/>
  <rect x="80" y="172" width="8" height="60" fill="#151528"/>
  <rect x="410" y="172" width="8" height="60" fill="#151528"/>
  <rect x="60" y="35" width="380" height="80" rx="6" fill="#1a1a2e" opacity="0.5"/>
  <rect x="80" y="45" width="40" height="60" rx="4" fill="${p}" opacity="0.15"/>
  <rect x="140" y="50" width="35" height="55" rx="4" fill="${a}" opacity="0.15"/>
  <rect x="195" y="45" width="40" height="60" rx="4" fill="${p}" opacity="0.12"/>
  <rect x="255" y="50" width="35" height="55" rx="4" fill="${a}" opacity="0.12"/>
  <rect x="310" y="45" width="40" height="60" rx="4" fill="${p}" opacity="0.15"/>
  <rect x="370" y="50" width="35" height="55" rx="4" fill="${a}" opacity="0.15"/>
  <g transform="translate(250,110)">
    <ellipse cx="0" cy="-30" rx="9" ry="11" fill="#2d2d44"/>
    <rect x="-11" y="-19" width="22" height="35" rx="5" fill="#2d2d44"/>
    <line x1="-7" y1="16" x2="-12" y2="40" stroke="#2d2d44" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="7" y1="16" x2="12" y2="40" stroke="#2d2d44" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="-11" y1="0" x2="-22" y2="15" stroke="#2d2d44" stroke-width="3" stroke-linecap="round"/>
    <line x1="11" y1="0" x2="22" y2="-5" stroke="#2d2d44" stroke-width="3" stroke-linecap="round"/>
  </g>
  <rect x="270" y="140" width="8" height="18" rx="2" fill="${p}" opacity="0.6"/>
  <rect x="283" y="145" width="6" height="13" rx="2" fill="${a}" opacity="0.5"/>
  <circle cx="250" cy="25" r="15" fill="${p}" opacity="0.08"/>
</svg>`;
  }

  // group-party: 여러 명 축하
  function guideGroup(p, a) {
    const figures = [
      { x: 120, h: 65 }, { x: 190, h: 70 }, { x: 250, h: 60 },
      { x: 310, h: 68 }, { x: 380, h: 62 },
    ];
    const figs = figures.map(f => `
    <g transform="translate(${f.x},${200 - f.h})">
      <ellipse cx="0" cy="0" rx="8" ry="10" fill="#2d2d44"/>
      <rect x="-10" y="10" width="20" height="32" rx="5" fill="#2d2d44"/>
      <line x1="-6" y1="42" x2="-12" y2="65" stroke="#2d2d44" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="6" y1="42" x2="12" y2="65" stroke="#2d2d44" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="-10" y1="20" x2="-22" y2="5" stroke="#2d2d44" stroke-width="3" stroke-linecap="round"/>
      <line x1="10" y1="20" x2="22" y2="5" stroke="#2d2d44" stroke-width="3" stroke-linecap="round"/>
    </g>`).join('');

    const confetti = Array.from({ length: 20 }, (_, i) => {
      const cx = 60 + (i * 23) % 400;
      const cy = 20 + (i * 17) % 100;
      const color = i % 2 === 0 ? p : a;
      const size = 3 + (i % 4);
      return i % 3 === 0
        ? `<rect x="${cx}" y="${cy}" width="${size}" height="${size * 1.5}" rx="1" fill="${color}" opacity="0.5" transform="rotate(${i * 25},${cx},${cy})"/>`
        : `<circle cx="${cx}" cy="${cy}" r="${size / 2}" fill="${color}" opacity="0.4"/>`;
    }).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 260" width="500" height="260">
  <rect width="500" height="260" fill="#0a0a1a"/>
  <defs>
    <radialGradient id="ggp" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:${p};stop-opacity:0.1"/>
      <stop offset="100%" style="stop-color:#0a0a1a;stop-opacity:0"/>
    </radialGradient>
  </defs>
  <rect width="500" height="260" fill="url(#ggp)"/>
  ${confetti}
  ${figs}
  <ellipse cx="250" cy="240" rx="150" ry="8" fill="${p}" opacity="0.1"/>
</svg>`;
  }

  // regional-nightlife: 한국 지도 + 빛나는 점
  function guideRegional(p, a) {
    const cities = [
      { x: 250, y: 60, label: '서울', r: 8 },
      { x: 245, y: 80, label: '강남', r: 6 },
      { x: 280, y: 190, label: '부산', r: 7 },
      { x: 260, y: 160, label: '대구', r: 6 },
      { x: 210, y: 80, label: '인천', r: 5 },
      { x: 230, y: 100, label: '수원', r: 5 },
      { x: 240, y: 120, label: '천안', r: 4 },
    ];

    const dots = cities.map(c => `
    <circle cx="${c.x}" cy="${c.y}" r="${c.r}" fill="${p}" opacity="0.6"/>
    <circle cx="${c.x}" cy="${c.y}" r="${c.r + 4}" fill="${p}" opacity="0.15"/>
    <text x="${c.x + c.r + 8}" y="${c.y + 4}" font-family="sans-serif" font-size="10" fill="${a}" opacity="0.7">${c.label}</text>
    `).join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 260" width="500" height="260">
  <rect width="500" height="260" fill="#0a0a1a"/>
  <path d="M220,30 C200,40 180,60 175,90 C170,120 185,140 190,160 C195,180 200,200 230,220 C250,230 270,225 280,210 C290,195 295,175 290,150 C285,125 280,100 275,80 C270,60 260,40 240,30 Z"
    fill="#1a1a2e" stroke="${p}" stroke-width="1.5" opacity="0.6"/>
  ${dots}
  <line x1="250" y1="60" x2="280" y2="190" stroke="${p}" stroke-width="0.5" opacity="0.2" stroke-dasharray="4,4"/>
  <line x1="210" y1="80" x2="260" y2="160" stroke="${a}" stroke-width="0.5" opacity="0.2" stroke-dasharray="4,4"/>
  <circle cx="80" cy="40" r="1.5" fill="#fff" opacity="0.4"/>
  <circle cx="420" cy="60" r="1" fill="#fff" opacity="0.5"/>
  <circle cx="440" cy="200" r="1.5" fill="#fff" opacity="0.3"/>
  <circle cx="70" cy="220" r="1" fill="#fff" opacity="0.4"/>
</svg>`;
  }

  const generators = {
    'first-visit': guideFirstVisit,
    'dress-code': guideDressCode,
    'budget-guide': guideBudget,
    'safety-tips': guideSafety,
    'music-genres': guideMusic,
    'solo-nightlife': guideSolo,
    'group-party': guideGroup,
    'regional-nightlife': guideRegional,
  };

  for (const [slug, config] of Object.entries(guideConfigs)) {
    const svg = generators[slug](config.primary, config.accent);
    writeFileSync(join(dir, `${slug}.svg`), svg, 'utf8');
  }
  console.log(`✅ Generated SVGs for ${Object.keys(guideConfigs).length} guides`);
}

// ─── Hero banner SVGs ───
function generateHeroBanners() {
  const dir = join(PUBLIC, 'assets');
  mkdirSync(dir, { recursive: true });

  function heroBanner(id, p, a, elements) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300" width="1200" height="300">
  <defs>
    <linearGradient id="${id}bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a1a"/>
      <stop offset="50%" style="stop-color:#12121f"/>
      <stop offset="100%" style="stop-color:#0a0a1a"/>
    </linearGradient>
    <radialGradient id="${id}g1" cx="30%" cy="50%" r="40%">
      <stop offset="0%" style="stop-color:${p};stop-opacity:0.15"/>
      <stop offset="100%" style="stop-color:${p};stop-opacity:0"/>
    </radialGradient>
    <radialGradient id="${id}g2" cx="70%" cy="50%" r="40%">
      <stop offset="0%" style="stop-color:${a};stop-opacity:0.1"/>
      <stop offset="100%" style="stop-color:${a};stop-opacity:0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="300" fill="url(#${id}bg)"/>
  <rect width="1200" height="300" fill="url(#${id}g1)"/>
  <rect width="1200" height="300" fill="url(#${id}g2)"/>
  ${elements}
</svg>`;
  }

  // Clubs hero
  const clubElements = Array.from({ length: 8 }, (_, i) => {
    const x = 80 + i * 140;
    return `<polygon points="${x},0 ${x - 25},300 ${x + 25},300" fill="${i % 2 === 0 ? '#8b5cf6' : '#ec4899'}" opacity="0.06"/>`;
  }).join('') + Array.from({ length: 15 }, (_, i) => {
    const x = 50 + i * 80;
    const y = 30 + (i * 37) % 240;
    return `<circle cx="${x}" cy="${y}" r="${1 + i % 3}" fill="#fff" opacity="${0.2 + (i % 5) * 0.1}"/>`;
  }).join('');

  // Nights hero
  const nightElements = Array.from({ length: 6 }, (_, i) => {
    const x = 100 + i * 180;
    const h = 80 + (i * 40) % 150;
    return `<rect x="${x}" y="${280 - h}" width="${60 + i * 10}" height="${h}" fill="#1a1a2e" opacity="0.4" rx="2"/>`;
  }).join('') + `<ellipse cx="600" cy="290" rx="500" ry="15" fill="#f59e0b" opacity="0.08"/>`;

  // Lounges hero
  const loungeElements = Array.from({ length: 10 }, (_, i) => {
    const cx = 60 + i * 120;
    const cy = 80 + (i * 50) % 140;
    return `<circle cx="${cx}" cy="${cy}" r="${8 + i * 3}" fill="${i % 2 === 0 ? '#06b6d4' : '#8b5cf6'}" opacity="0.08"/>`;
  }).join('');

  // Guides hero
  const guidesElements = Array.from({ length: 4 }, (_, i) => {
    const x = 150 + i * 250;
    return `<rect x="${x}" y="80" width="160" height="140" rx="12" fill="#1a1a2e" stroke="${i % 2 === 0 ? '#8b5cf6' : '#ec4899'}" stroke-width="1" opacity="0.5"/>
    <rect x="${x + 15}" y="100" width="80" height="8" rx="4" fill="${i % 2 === 0 ? '#8b5cf6' : '#ec4899'}" opacity="0.3"/>
    <rect x="${x + 15}" y="118" width="130" height="5" rx="2.5" fill="#2d2d44" opacity="0.4"/>
    <rect x="${x + 15}" y="130" width="100" height="5" rx="2.5" fill="#2d2d44" opacity="0.3"/>`;
  }).join('');

  // 404 hero
  const hero404 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300" width="500" height="300">
  <defs>
    <radialGradient id="h404g" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:0.1"/>
      <stop offset="100%" style="stop-color:#0a0a1a;stop-opacity:0"/>
    </radialGradient>
  </defs>
  <rect width="500" height="300" fill="#0a0a1a"/>
  <rect width="500" height="300" fill="url(#h404g)"/>
  <g transform="translate(250,100)">
    <ellipse cx="0" cy="-30" rx="12" ry="14" fill="#2d2d44"/>
    <rect x="-14" y="-16" width="28" height="45" rx="6" fill="#2d2d44"/>
    <line x1="-9" y1="29" x2="-18" y2="65" stroke="#2d2d44" stroke-width="4" stroke-linecap="round"/>
    <line x1="9" y1="29" x2="18" y2="65" stroke="#2d2d44" stroke-width="4" stroke-linecap="round"/>
    <line x1="-14" y1="5" x2="-28" y2="-10" stroke="#2d2d44" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="14" y1="5" x2="28" y2="20" stroke="#2d2d44" stroke-width="3.5" stroke-linecap="round"/>
    <text x="0" y="-55" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#8b5cf6" opacity="0.7">?</text>
  </g>
  <path d="M150,230 L170,180 L190,230 Z" fill="none" stroke="#8b5cf6" stroke-width="1.5" opacity="0.3"/>
  <path d="M310,220 L340,170 L370,220 Z" fill="none" stroke="#ec4899" stroke-width="1.5" opacity="0.3"/>
  <circle cx="130" cy="80" r="2" fill="#fff" opacity="0.4"/>
  <circle cx="370" cy="60" r="1.5" fill="#fff" opacity="0.5"/>
  <circle cx="400" cy="250" r="1" fill="#fff" opacity="0.3"/>
  <circle cx="100" cy="200" r="1.5" fill="#fff" opacity="0.4"/>
  <line x1="100" y1="270" x2="400" y2="270" stroke="#8b5cf6" stroke-width="1" opacity="0.2" stroke-dasharray="8,8"/>
</svg>`;

  writeFileSync(join(dir, 'hero-clubs.svg'), heroBanner('hc', '#8b5cf6', '#ec4899', clubElements), 'utf8');
  writeFileSync(join(dir, 'hero-nights.svg'), heroBanner('hn', '#f59e0b', '#ef4444', nightElements), 'utf8');
  writeFileSync(join(dir, 'hero-lounges.svg'), heroBanner('hl', '#06b6d4', '#8b5cf6', loungeElements), 'utf8');
  writeFileSync(join(dir, 'hero-guides.svg'), heroBanner('hg', '#8b5cf6', '#ec4899', guidesElements), 'utf8');
  writeFileSync(join(dir, 'hero-404.svg'), hero404, 'utf8');
  console.log('✅ Generated 5 hero banner SVGs');
}

// Run
generateFooterBadge();
generateVenueSVGs();
generateGuideSVGs();
generateHeroBanners();
