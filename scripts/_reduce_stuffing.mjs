#!/usr/bin/env node
/**
 * Reduce keyword stuffing in venues.json
 * - Protect full brand name occurrences (for qa_brand_count 4-8)
 * - Replace excess coreName mentions with "이곳" + particle
 * - Replace excess region mentions with "이 지역" + particle
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const venuesPath = join(ROOT, 'data', 'venues.json');
const venues = JSON.parse(readFileSync(venuesPath, 'utf-8'));

function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Korean particles (longest first)
const P = '에서는|에서의|에서도|에서|에게서|에게는|에게|에는|에도|에|은|는|이라는|이란|이라면|이라고|이라|이며|이자|이고|이든|이요|이니|이지만|이지|이|가|을|를|의|와|과|도|만의|만은|만을|만이|만|으로는|으로의|으로|로는|로|부터|까지|처럼|같은|같이|보다|마다';

const PH_FULL = '__XFULLBRAND__';
const PH_RC = '__XREGIONCORE__';

// Per-field limits: how many coreName/region to KEEP
const LIMITS = {
  teaser:     { c: 1, r: 1 },
  atmosphere: { c: 1, r: 1 },
  music:      { c: 0, r: 0 },
  safety:     { c: 0, r: 0 },
  scene1:     { c: 1, r: 0 },
  scene:      { c: 0, r: 0 },
  faq_q:      { c: 99, r: 99 },
  faq_a:      { c: 0, r: 0 },
  timeline:   { c: 0, r: 0 },
  checklist:  { c: 0, r: 0 },
};

let totalCore = 0, totalReg = 0;

function proc(text, cn, reg, full, typeName, ft) {
  if (!text || typeof text !== 'string') return text;
  const lim = LIMITS[ft] || { c: 0, r: 0 };
  let r = text;

  // Protect full brand name
  r = r.replaceAll(full, PH_FULL);

  // Protect region+core combo (without type)
  if (reg && cn && cn.length >= 2) {
    r = r.replaceAll(reg + ' ' + cn, PH_RC);
  }

  // Replace excess coreName (+optional type +optional particle)
  if (cn && cn.length >= 2) {
    let cc = 0;
    const typeOpt = typeName ? '(?:\\s*' + esc(typeName) + ')?' : '';
    const rx = new RegExp(esc(cn) + typeOpt + '(' + P + ')?', 'g');
    r = r.replace(rx, (m, p) => {
      cc++;
      if (cc <= lim.c) return m;
      totalCore++;
      return '이곳' + (p || '');
    });
  }

  // Replace excess region (+optional particle)
  if (reg && reg.length >= 2) {
    let rc = 0;
    const rx = new RegExp(esc(reg) + '(' + P + ')?', 'g');
    r = r.replace(rx, (m, p) => {
      rc++;
      if (rc <= lim.r) return m;
      totalReg++;
      return p ? '이 지역' + p : '이 지역';
    });
  }

  // Restore placeholders
  if (reg && cn && cn.length >= 2) {
    r = r.replaceAll(PH_RC, reg + ' ' + cn);
  }
  r = r.replaceAll(PH_FULL, full);
  return r;
}

let modified = 0;
for (const v of venues) {
  const reg = v.region;
  const full = v.name_display;
  const typeName = v.typeLabel;

  // Extract coreName
  let cn = full;
  if (reg) cn = cn.replace(new RegExp('^' + esc(reg) + '\\s*'), '');
  let cnNoType = cn;
  for (const t of ['클럽', '나이트', '라운지']) {
    cnNoType = cnNoType.replace(new RegExp('\\s*' + esc(t) + '$'), '');
  }
  cnNoType = cnNoType.trim();
  cn = cnNoType.length >= 2 ? cnNoType : cn.trim();
  if (cn === typeName) cn = '';

  const before = JSON.stringify(v);

  if (v.teaser) v.teaser = proc(v.teaser, cn, reg, full, typeName, 'teaser');
  if (v.bodySections) {
    for (const k of ['atmosphere', 'music', 'safety']) {
      if (v.bodySections[k]) v.bodySections[k] = proc(v.bodySections[k], cn, reg, full, typeName, k);
    }
  }
  if (v.story) {
    for (let i = 1; i <= 5; i++) {
      const k = 'scene' + i;
      if (v.story[k]) v.story[k] = proc(v.story[k], cn, reg, full, typeName, i === 1 ? 'scene1' : 'scene');
    }
  }
  if (v.faq) {
    for (const f of v.faq) {
      if (f.q) f.q = proc(f.q, cn, reg, full, typeName, 'faq_q');
      if (f.a) f.a = proc(f.a, cn, reg, full, typeName, 'faq_a');
    }
  }
  if (v.timeline) {
    for (const t2 of v.timeline) {
      if (t2.desc) t2.desc = proc(t2.desc, cn, reg, full, typeName, 'timeline');
    }
  }
  if (v.checklist) {
    for (const c of v.checklist) {
      if (c.label) c.label = proc(c.label, cn, reg, full, typeName, 'checklist');
    }
  }

  if (JSON.stringify(v) !== before) modified++;
}

writeFileSync(venuesPath, JSON.stringify(venues, null, 2), 'utf-8');
console.log(`Modified: ${modified}/${venues.length} venues`);
console.log(`Replacements: coreName=${totalCore}, region=${totalReg}, total=${totalCore + totalReg}`);
