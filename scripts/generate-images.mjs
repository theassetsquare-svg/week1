#!/usr/bin/env node
/**
 * Generate unique SVG thumbnail images for all venues
 * Features Korean female model silhouettes in nightlife settings
 * 0% similarity: every image is unique via seeded randomization
 */
import fs from 'fs';
import path from 'path';

const venues = JSON.parse(fs.readFileSync('./data/venues.json', 'utf8'));

// Seeded random number generator (Mulberry32)
function createRng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Color palettes by venue type - wide variety
const PALETTES = {
  club: [
    { primary: '#8b5cf6', secondary: '#ec4899', accent: '#f472b6', bg1: '#0a0a1a', bg2: '#1a0a2e' },
    { primary: '#6366f1', secondary: '#f43f5e', accent: '#fb7185', bg1: '#0a0a20', bg2: '#1a1040' },
    { primary: '#a855f7', secondary: '#f97316', accent: '#fdba74', bg1: '#0f0520', bg2: '#200a30' },
    { primary: '#d946ef', secondary: '#06b6d4', accent: '#67e8f9', bg1: '#150520', bg2: '#250a35' },
    { primary: '#7c3aed', secondary: '#e11d48', accent: '#fb923c', bg1: '#0a0520', bg2: '#1a0a30' },
    { primary: '#c026d3', secondary: '#3b82f6', accent: '#93c5fd', bg1: '#120520', bg2: '#220a38' },
    { primary: '#9333ea', secondary: '#ef4444', accent: '#fca5a5', bg1: '#0d0520', bg2: '#1d0a32' },
    { primary: '#8b5cf6', secondary: '#14b8a6', accent: '#5eead4', bg1: '#080818', bg2: '#180a28' },
  ],
  night: [
    { primary: '#f59e0b', secondary: '#ef4444', accent: '#fbbf24', bg1: '#0a0a14', bg2: '#1a1020' },
    { primary: '#eab308', secondary: '#f97316', accent: '#fde047', bg1: '#0c0a10', bg2: '#1c1018' },
    { primary: '#d97706', secondary: '#dc2626', accent: '#fcd34d', bg1: '#0a0810', bg2: '#1a0e1a' },
    { primary: '#f59e0b', secondary: '#db2777', accent: '#fbbf24', bg1: '#0e0a12', bg2: '#1e0e1e' },
    { primary: '#ca8a04', secondary: '#e11d48', accent: '#facc15', bg1: '#0a0a0e', bg2: '#1a0e16' },
    { primary: '#fbbf24', secondary: '#b91c1c', accent: '#fef08a', bg1: '#0c080e', bg2: '#1c0c18' },
    { primary: '#f59e0b', secondary: '#c2410c', accent: '#fed7aa', bg1: '#0a080c', bg2: '#1a0c14' },
    { primary: '#eab308', secondary: '#9333ea', accent: '#fde68a', bg1: '#0a0a14', bg2: '#1a0e22' },
  ],
  lounge: [
    { primary: '#06b6d4', secondary: '#8b5cf6', accent: '#67e8f9', bg1: '#0a0a1a', bg2: '#0a1a2a' },
    { primary: '#0891b2', secondary: '#a855f7', accent: '#a5f3fc', bg1: '#080a18', bg2: '#081828' },
    { primary: '#14b8a6', secondary: '#6366f1', accent: '#99f6e4', bg1: '#0a0c18', bg2: '#0a1c28' },
    { primary: '#22d3ee', secondary: '#c026d3', accent: '#cffafe', bg1: '#060a16', bg2: '#061a26' },
    { primary: '#2dd4bf', secondary: '#7c3aed', accent: '#ccfbf1', bg1: '#080c16', bg2: '#081c26' },
    { primary: '#06b6d4', secondary: '#ec4899', accent: '#67e8f9', bg1: '#0a0a18', bg2: '#0a1828' },
    { primary: '#0ea5e9', secondary: '#d946ef', accent: '#7dd3fc', bg1: '#060816', bg2: '#061624' },
    { primary: '#14b8a6', secondary: '#f43f5e', accent: '#5eead4', bg1: '#080a14', bg2: '#081a24' },
  ]
};

// Female model silhouette with various hair and dress styles
function getModelSVG(poseIndex, hairIdx, dressIdx, color1, color2, scale, tx, ty) {
  const cx = 0;

  // Hair styles
  const hairs = [
    `<path d="M${cx-3},-63 Q${cx-16},-50 ${cx-12},-10 Q${cx-14},5 ${cx-10},15" stroke="${color1}" stroke-width="3" fill="none" stroke-linecap="round"/>
     <path d="M${cx+2},-63 Q${cx+10},-48 ${cx+8},-5 Q${cx+10},10 ${cx+8},20" stroke="${color1}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    `<path d="M${cx-3},-63 Q${cx-18},-45 ${cx-8},-25 Q${cx-16},-5 ${cx-10},15" stroke="${color1}" stroke-width="3" fill="none" stroke-linecap="round"/>
     <path d="M${cx+2},-63 Q${cx+14},-42 ${cx+6},-22 Q${cx+12},-2 ${cx+8},18" stroke="${color1}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    `<path d="M${cx-3},-63 Q${cx-14},-52 ${cx-10},-38 L${cx-12},-30" stroke="${color1}" stroke-width="4" fill="none" stroke-linecap="round"/>
     <path d="M${cx+2},-63 Q${cx+12},-50 ${cx+10},-36 L${cx+11},-28" stroke="${color1}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    `<path d="M${cx-3},-63 Q${cx-12},-55 ${cx-8},-45" stroke="${color1}" stroke-width="3" fill="none" stroke-linecap="round"/>
     <path d="M${cx+2},-63 Q${cx+8},-60 ${cx+14},-55 Q${cx+20},-40 ${cx+16},-15 Q${cx+14},0 ${cx+12},10" stroke="${color1}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    `<path d="M${cx-3},-63 Q${cx-10},-58 ${cx-6},-50" stroke="${color1}" stroke-width="3" fill="none" stroke-linecap="round"/>
     <circle cx="${cx+2}" cy="-68" r="6" fill="${color1}" opacity="0.8"/>
     <path d="M${cx+2},-63 Q${cx+8},-60 ${cx+5},-52" stroke="${color1}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    `<path d="M${cx-3},-63 Q${cx-18},-48 ${cx-14},-20 Q${cx-16},0 ${cx-12},20" stroke="${color1}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
     <path d="M${cx+2},-63 Q${cx+6},-55 ${cx+4},-42" stroke="${color1}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  ];

  // Dress styles
  const dresses = [
    `<path d="M${cx-8},-41 Q${cx-10},-20 ${cx-6},0 Q${cx-8},12 ${cx-14},30 L${cx+14},30 Q${cx+8},12 ${cx+6},0 Q${cx+10},-20 ${cx+8},-41 Z" fill="${color2}"/>
     <path d="M${cx-6},0 L${cx-14},30 L${cx},30 Z" fill="${color1}" opacity="0.2"/>`,
    `<path d="M${cx-8},-41 Q${cx-10},-20 ${cx-6},0 Q${cx-4},10 ${cx-2},20 L${cx+2},20 Q${cx+4},10 ${cx+6},0 Q${cx+10},-20 ${cx+8},-41 Z" fill="${color2}"/>
     <rect x="${cx-9}" y="-42" width="18" height="4" rx="1" fill="${color1}" opacity="0.5"/>`,
    `<path d="M${cx-8},-41 Q${cx-10},-20 ${cx-6},0 Q${cx-10},20 ${cx-16},55 L${cx+16},55 Q${cx+10},20 ${cx+6},0 Q${cx+10},-20 ${cx+8},-41 Z" fill="${color2}"/>
     <path d="M${cx},0 Q${cx-6},25 ${cx-16},55 L${cx},50 Z" fill="${color1}" opacity="0.15"/>`,
    `<path d="M${cx-7},-41 Q${cx-9},-25 ${cx-7},-15 L${cx+7},-15 Q${cx+9},-25 ${cx+7},-41 Z" fill="${color2}"/>
     <path d="M${cx-8},-12 Q${cx-10},5 ${cx-14},28 L${cx+14},28 Q${cx+10},5 ${cx+8},-12 Z" fill="${color1}" opacity="0.8"/>`,
    `<path d="M${cx-7},-41 Q${cx-9},-20 ${cx-8},0 Q${cx-7},12 ${cx-6},25 L${cx+6},25 Q${cx+7},12 ${cx+8},0 Q${cx+9},-20 ${cx+7},-41 Z" fill="${color2}"/>
     <line x1="${cx-7}" y1="-15" x2="${cx+7}" y2="-15" stroke="${color1}" stroke-width="1.5" opacity="0.4"/>`,
  ];

  // Leg position patterns (x offsets for left and right legs)
  const legPatterns = [
    { l: [-8, -8], r: [8, 8] },       // standing straight
    { l: [-10, -10], r: [6, 6] },      // stance
    { l: [-12, -14], r: [10, 12] },    // wide
    { l: [-14, -16], r: [14, 16] },    // walking
    { l: [-6, -6], r: [10, 10] },      // shifted
  ];

  // Arm position patterns
  const armPatterns = [
    { l: [-22, -10], r: [18, -5] },    // relaxed
    { l: [-16, -8], r: [24, -20] },    // hand on hip R
    { l: [-20, -58], r: [22, -55] },   // arms up dance
    { l: [-24, -15], r: [20, -8] },    // walking
    { l: [-22, -15], r: [22, -38] },   // holding drink R
    { l: [-20, -5], r: [28, -25] },    // leaning
    { l: [-24, -45], r: [24, -48] },   // DJ arms
    { l: [-18, -20], r: [25, -10] },   // casual
  ];

  const hair = hairs[hairIdx % hairs.length];
  const dress = dresses[dressIdx % dresses.length];
  const leg = legPatterns[poseIndex % legPatterns.length];
  const arm = armPatterns[poseIndex % armPatterns.length];

  // Accessories based on pose
  let accessory = '';
  if (poseIndex === 4) {
    // cocktail glass
    accessory = `<polygon points="${cx+arm.r[0]},-42 ${cx+arm.r[0]-4},-34 ${cx+arm.r[0]+4},-34" fill="${color2}" opacity="0.6" stroke="${color2}" stroke-width="0.5"/>
    <line x1="${cx+arm.r[0]}" y1="-34" x2="${cx+arm.r[0]}" y2="-28" stroke="${color2}" stroke-width="1"/>
    <line x1="${cx+arm.r[0]-3}" y1="-28" x2="${cx+arm.r[0]+3}" y2="-28" stroke="${color2}" stroke-width="1"/>`;
  } else if (poseIndex === 6) {
    // headphones
    accessory = `<path d="M${cx-10},-56 Q${cx-12},-66 ${cx},-68 Q${cx+12},-66 ${cx+10},-56" stroke="${color2}" stroke-width="2" fill="none"/>`;
  }

  return `<g transform="translate(${tx},${ty}) scale(${scale})">
    <ellipse cx="${cx}" cy="-52" rx="9" ry="11" fill="${color1}"/>
    ${hair}
    ${dress}
    <line x1="${cx-2}" y1="25" x2="${cx+leg.l[0]}" y2="60" stroke="${color1}" stroke-width="3" stroke-linecap="round"/>
    <line x1="${cx+2}" y1="25" x2="${cx+leg.r[0]}" y2="60" stroke="${color1}" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="${cx+leg.l[1]}" cy="62" rx="6" ry="2.5" fill="${color2}" opacity="0.7"/>
    <ellipse cx="${cx+leg.r[1]}" cy="62" rx="6" ry="2.5" fill="${color2}" opacity="0.7"/>
    <line x1="${cx-8}" y1="-30" x2="${cx+arm.l[0]}" y2="${arm.l[1]}" stroke="${color1}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="${cx+8}" y1="-30" x2="${cx+arm.r[0]}" y2="${arm.r[1]}" stroke="${color1}" stroke-width="2.5" stroke-linecap="round"/>
    ${accessory}
  </g>`;
}

// Background generators
function generateBackground(type, palette, rng, w, h) {
  const parts = [];
  const gradId = `bg_${Math.floor(rng() * 99999)}`;
  parts.push(`<defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="${rng() > 0.5 ? '100' : '0'}%" y2="100%">
      <stop offset="0%" style="stop-color:${palette.bg1}"/>
      <stop offset="100%" style="stop-color:${palette.bg2}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#${gradId})"/>`);

  const bgType = Math.floor(rng() * 8);
  if (bgType === 0) {
    // Cityscape
    for (let i = 0; i < 6 + Math.floor(rng() * 6); i++) {
      const bx = (w / 8) * i + rng() * 30;
      const bw = 30 + rng() * 60;
      const bh = 80 + rng() * 160;
      parts.push(`<rect x="${bx}" y="${h-bh-20}" width="${bw}" height="${bh}" fill="${palette.bg2}" opacity="${0.3+rng()*0.3}" rx="2"/>`);
      for (let wy = h-bh-10; wy < h-30; wy += 15+rng()*10) {
        for (let wx = bx+5; wx < bx+bw-5; wx += 12) {
          if (rng() > 0.4) parts.push(`<rect x="${wx}" y="${wy}" width="4" height="5" fill="${palette.primary}" opacity="${0.1+rng()*0.2}"/>`);
        }
      }
    }
  } else if (bgType === 1) {
    // Abstract shapes
    for (let i = 0; i < 10+Math.floor(rng()*8); i++) {
      const sx = rng()*w, sy = rng()*h, sz = 20+rng()*80;
      const col = rng()>0.5 ? palette.primary : palette.secondary;
      parts.push(rng()>0.5
        ? `<circle cx="${sx}" cy="${sy}" r="${sz}" fill="${col}" opacity="${0.05+rng()*0.1}"/>`
        : `<rect x="${sx}" y="${sy}" width="${sz}" height="${sz}" fill="${col}" opacity="${0.05+rng()*0.1}" transform="rotate(${rng()*45},${sx},${sy})"/>`);
    }
  } else if (bgType === 2) {
    // Neon lines
    for (let i = 0; i < 6+Math.floor(rng()*6); i++) {
      const col = [palette.primary, palette.secondary, palette.accent][Math.floor(rng()*3)];
      parts.push(`<line x1="${rng()*w}" y1="${rng()*h}" x2="${rng()*w}" y2="${rng()*h}" stroke="${col}" stroke-width="${1+rng()*2}" opacity="${0.1+rng()*0.15}"/>`);
    }
  } else if (bgType === 3) {
    // Dance floor grid
    const gs = 30+Math.floor(rng()*20);
    for (let gx=0; gx<w; gx+=gs) for (let gy=h*0.6; gy<h; gy+=gs) {
      parts.push(`<rect x="${gx}" y="${gy}" width="${gs-2}" height="${gs-2}" fill="${rng()>0.5?palette.primary:palette.secondary}" opacity="${0.03+rng()*0.08}"/>`);
    }
  } else if (bgType === 4) {
    // Bokeh
    for (let i = 0; i < 15+Math.floor(rng()*12); i++) {
      const col = [palette.primary, palette.secondary, palette.accent, '#fff'][Math.floor(rng()*4)];
      parts.push(`<circle cx="${rng()*w}" cy="${rng()*h}" r="${8+rng()*40}" fill="${col}" opacity="${0.03+rng()*0.08}"/>`);
    }
  } else if (bgType === 5) {
    // Light bars
    for (let i = 0; i < 4+Math.floor(rng()*6); i++) {
      parts.push(`<rect x="0" y="${rng()*h}" width="${w}" height="${2+rng()*8}" fill="${[palette.primary,palette.secondary,palette.accent][Math.floor(rng()*3)]}" opacity="${0.05+rng()*0.1}"/>`);
    }
  } else if (bgType === 6) {
    // Radial spotlight
    const sid = `sp_${Math.floor(rng()*99999)}`;
    parts.push(`<defs><radialGradient id="${sid}" cx="50%" cy="40%" r="50%"><stop offset="0%" style="stop-color:${palette.primary};stop-opacity:0.15"/><stop offset="100%" style="stop-color:${palette.bg1};stop-opacity:0"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#${sid})"/>`);
  } else {
    // Diamond pattern
    for (let i = 0; i < 8+Math.floor(rng()*6); i++) {
      const dx = rng()*w, dy = rng()*h, ds = 15+rng()*40;
      parts.push(`<polygon points="${dx},${dy-ds} ${dx+ds},${dy} ${dx},${dy+ds} ${dx-ds},${dy}" fill="${rng()>0.5?palette.primary:palette.secondary}" opacity="${0.04+rng()*0.08}"/>`);
    }
  }

  // Type-specific decorations
  if (type === 'club' && rng() > 0.3) {
    for (let i = 0; i < 3+Math.floor(rng()*3); i++) {
      parts.push(`<line x1="${w*0.3+rng()*w*0.4}" y1="0" x2="${rng()*w}" y2="${h}" stroke="${[palette.primary,palette.secondary][Math.floor(rng()*2)]}" stroke-width="1" opacity="${0.08+rng()*0.1}"/>`);
    }
  } else if (type === 'night' && rng() > 0.3) {
    for (let i = 0; i < 3; i++) {
      const sx = (w/4)*(i+1);
      parts.push(`<line x1="${sx}" y1="0" x2="${sx+(rng()-0.5)*60}" y2="${h*0.6}" stroke="${palette.primary}" stroke-width="20" opacity="0.04"/>`);
    }
  } else if (type === 'lounge' && rng() > 0.3) {
    for (let i = 0; i < 3; i++) {
      parts.push(`<circle cx="${rng()*w}" cy="${h*0.5+rng()*h*0.3}" r="${20+rng()*30}" fill="${palette.accent}" opacity="0.05"/>`);
    }
  }

  // Sparkles
  for (let i = 0; i < 8+Math.floor(rng()*8); i++) {
    parts.push(`<circle cx="${rng()*w}" cy="${rng()*h*0.7}" r="${0.5+rng()*2}" fill="#fff" opacity="${0.2+rng()*0.5}"/>`);
  }

  return parts.join('\n  ');
}

function generateFloor(palette, rng, w, h) {
  const fh = 25 + Math.floor(rng() * 15);
  const fy = h - fh;
  let f = `<rect x="0" y="${fy}" width="${w}" height="${fh}" fill="#0a0a14"/>`;
  for (let i = 0; i < 3+Math.floor(rng()*3); i++) {
    const col = rng()>0.5 ? palette.primary : palette.secondary;
    f += `\n  <ellipse cx="${rng()*w}" cy="${fy+5}" rx="${20+rng()*50}" ry="4" fill="${col}" opacity="${0.1+rng()*0.12}"/>`;
  }
  return f;
}

// Generate one venue image
function generateSVG(venue, imgIndex, w = 500, h = 340) {
  const seed = hashStr(venue.regionSlug + '_' + venue.venueSlug + '_img' + imgIndex);
  const rng = createRng(seed);

  const palettes = PALETTES[venue.type] || PALETTES.club;
  const palette = palettes[(seed + imgIndex) % palettes.length];

  const bg = generateBackground(venue.type, palette, rng, w, h);
  const floor = generateFloor(palette, rng, w, h);

  // Models
  const modelCount = imgIndex === 1 ? (1 + Math.floor(rng()*2)) : (2 + Math.floor(rng()*2));
  let models = '';
  const usedPoses = new Set();
  for (let m = 0; m < modelCount; m++) {
    let pi; do { pi = Math.floor(rng()*8); } while (usedPoses.has(pi) && usedPoses.size < 8);
    usedPoses.add(pi);
    const hi = Math.floor(rng() * 6);
    const di = Math.floor(rng() * 5);
    const c1 = m%2===0 ? palette.primary : palette.secondary;
    const c2 = m%2===0 ? palette.secondary : palette.primary;
    const sc = 0.8 + rng()*0.4;
    const spacing = w / (modelCount + 1);
    const ttx = spacing*(m+1) + (rng()-0.5)*30;
    const tty = h - 45 - rng()*30;
    models += getModelSVG(pi, hi, di, c1, c2, sc, ttx, tty);
  }

  // Type badge
  const typeLabels = { club: 'CLUB', night: 'NIGHT', lounge: 'LOUNGE' };
  const badge = `<rect x="${w-70}" y="12" width="58" height="22" rx="4" fill="${palette.primary}" opacity="0.8"/>
  <text x="${w-41}" y="28" text-anchor="middle" font-family="sans-serif" font-size="10" font-weight="700" fill="#fff">${typeLabels[venue.type]}</text>`;

  // Venue name label
  const fs = venue.name_display.length > 10 ? 14 : 16;
  const textY = 30 + Math.floor(rng()*15);
  const label = `<rect x="${w*0.15}" y="${textY-16}" width="${w*0.7}" height="30" rx="6" fill="${palette.bg1}" opacity="0.7" stroke="${palette.primary}" stroke-width="1.5"/>
  <text x="${w/2}" y="${textY+4}" text-anchor="middle" font-family="sans-serif" font-size="${fs}" font-weight="700" fill="${palette.primary}" opacity="0.9">${venue.name_display}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  ${bg}
  ${floor}
  ${models}
  ${badge}
  ${label}
</svg>`;
}

// OG thumbnail
function generateOGThumbnail(venue) {
  const w = 1200, h = 630;
  const seed = hashStr(venue.regionSlug + '_' + venue.venueSlug + '_og');
  const rng = createRng(seed);
  const palettes = PALETTES[venue.type] || PALETTES.club;
  const palette = palettes[seed % palettes.length];
  const gid = `og_${Math.floor(rng()*99999)}`;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs><linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:${palette.bg1}"/><stop offset="100%" style="stop-color:${palette.bg2}"/>
  </linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#${gid})"/>`;

  for (let i = 0; i < 15+Math.floor(rng()*10); i++) {
    const col = [palette.primary, palette.secondary, palette.accent][Math.floor(rng()*3)];
    svg += `\n  <circle cx="${rng()*w}" cy="${rng()*h}" r="${15+rng()*60}" fill="${col}" opacity="${0.03+rng()*0.07}"/>`;
  }

  // Two model silhouettes
  for (let m = 0; m < 2; m++) {
    const c1 = m===0 ? palette.primary : palette.secondary;
    const c2 = m===0 ? palette.secondary : palette.primary;
    svg += getModelSVG(Math.floor(rng()*8), Math.floor(rng()*6), Math.floor(rng()*5), c1, c2, 1.8+rng()*0.4, m===0?w*0.2:w*0.8, h*0.75);
  }

  const fs2 = venue.name_display.length > 12 ? 42 : 52;
  svg += `\n  <rect x="${w*0.15}" y="${h*0.3}" width="${w*0.7}" height="${h*0.35}" rx="12" fill="${palette.bg1}" opacity="0.75" stroke="${palette.primary}" stroke-width="2"/>
  <text x="${w/2}" y="${h*0.45}" text-anchor="middle" font-family="sans-serif" font-size="${fs2}" font-weight="800" fill="${palette.primary}">${venue.name_display}</text>
  <text x="${w/2}" y="${h*0.55}" text-anchor="middle" font-family="sans-serif" font-size="24" fill="${palette.accent}" opacity="0.8">${venue.region} · ${venue.typeLabel}</text>`;
  svg += '\n</svg>';
  return svg;
}

// Main
const outDir = './public/venues';
let generated = 0;

for (const venue of venues) {
  const venueDir = path.join(outDir, venue.regionSlug, venue.venueSlug);
  if (!fs.existsSync(venueDir)) fs.mkdirSync(venueDir, { recursive: true });

  for (let i = 1; i <= 3; i++) {
    fs.writeFileSync(path.join(venueDir, `model-fun-${i}.svg`), generateSVG(venue, i));
    generated++;
  }
  fs.writeFileSync(path.join(venueDir, 'og-thumbnail.svg'), generateOGThumbnail(venue));
  generated++;
}

console.log(`Generated ${generated} images for ${venues.length} venues`);

// Uniqueness check
const allFiles = [];
for (const venue of venues) {
  const p = path.join(outDir, venue.regionSlug, venue.venueSlug, 'model-fun-1.svg');
  if (fs.existsSync(p)) allFiles.push({ name: `${venue.regionSlug}/${venue.venueSlug}`, content: fs.readFileSync(p, 'utf8') });
}
let dupes = 0;
for (let i = 0; i < allFiles.length; i++)
  for (let j = i+1; j < allFiles.length; j++)
    if (allFiles[i].content === allFiles[j].content) { console.log(`DUPE: ${allFiles[i].name} = ${allFiles[j].name}`); dupes++; }
console.log(`Uniqueness: ${allFiles.length} files, ${dupes} duplicates`);
