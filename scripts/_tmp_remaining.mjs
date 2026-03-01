#!/usr/bin/env node
import { readFileSync } from 'fs';
const venues = JSON.parse(readFileSync('data/venues.json', 'utf8'));
const SKIP = new Set(['id','type','typePath','typeLabel','regionSlug','venueSlug','urlSlug','geo','images','imagePrompts','relatedVenueIds','map_url','name_display','name_input','name_seo','region','card_tags','sourcePath']);

function getProtected(v) {
  const s = new Set();
  [v.name_display, v.name_input, v.name_seo].filter(Boolean).forEach(n => {
    (n.match(/[\uAC00-\uD7AF]{2,}/g) || []).forEach(p => s.add(p));
  });
  if (v.region) (v.region.match(/[\uAC00-\uD7AF]{2,}/g) || []).forEach(p => s.add(p));
  return s;
}

function getAllText(v) {
  const t = [];
  function walk(obj) {
    if (typeof obj === 'string') t.push(obj);
    else if (Array.isArray(obj)) obj.forEach(walk);
    else if (typeof obj === 'object' && obj !== null) {
      for (const [k, val] of Object.entries(obj)) {
        if (SKIP.has(k)) continue;
        walk(val);
      }
    }
  }
  walk(v);
  return t.join(' ');
}

// Find all words still over 3
let shown = 0;
venues.forEach(v => {
  const prot = getProtected(v);
  const tokens = (getAllText(v).match(/[\uAC00-\uD7AF]{2,}/g) || []);
  const freq = {};
  tokens.forEach(w => { if (!prot.has(w)) freq[w] = (freq[w] || 0) + 1; });
  const over = Object.entries(freq).filter(([,c]) => c >= 3).sort((a,b) => b[1]-a[1]);
  if (over.length > 0 && shown < 5) {
    shown++;
    console.log(`[${v.name_display}]`);
    over.forEach(([w,c]) => {
      // Trace locations
      const locs = [];
      function trace(obj, path) {
        if (typeof obj === 'string') {
          const toks = (obj.match(/[\uAC00-\uD7AF]{2,}/g) || []);
          const cnt = toks.filter(t => t === w).length;
          if (cnt > 0) locs.push(`${path}:${cnt}`);
        } else if (Array.isArray(obj)) {
          obj.forEach((item, i) => trace(item, `${path}[${i}]`));
        } else if (typeof obj === 'object' && obj !== null) {
          for (const [k, val] of Object.entries(obj)) {
            if (SKIP.has(k)) continue;
            trace(val, `${path}.${k}`);
          }
        }
      }
      trace(v, 'v');
      console.log(`  "${w}" x${c}: ${locs.join(', ')}`);
    });
  }
});
