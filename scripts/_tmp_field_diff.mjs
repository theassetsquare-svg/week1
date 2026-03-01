#!/usr/bin/env node
import { readFileSync } from 'fs';
const venues = JSON.parse(readFileSync('data/venues.json', 'utf8'));
const v = venues[0];

function getProtected(v) {
  const s = new Set();
  [v.name_display, v.name_input, v.name_seo].filter(Boolean).forEach(n => {
    (n.match(/[\uAC00-\uD7AF]{2,}/g) || []).forEach(p => s.add(p));
  });
  if (v.region) (v.region.match(/[\uAC00-\uD7AF]{2,}/g) || []).forEach(p => s.add(p));
  return s;
}

// Audit getAllText - walks ALL fields
function auditGetAllText(v) {
  const t = [];
  const SKIP = ['id','type','typePath','regionSlug','venueSlug','urlSlug','geo','images','imagePrompts','relatedVenueIds','map_url'];
  function walk(obj) {
    if (typeof obj === 'string') t.push(obj);
    else if (Array.isArray(obj)) obj.forEach(walk);
    else if (typeof obj === 'object' && obj !== null) {
      for (const [k, val] of Object.entries(obj)) {
        if (SKIP.includes(k)) continue;
        walk(val);
      }
    }
  }
  walk(v);
  return t.join(' ');
}

const prot = getProtected(v);
const allText = auditGetAllText(v);
const tokens = (allText.match(/[\uAC00-\uD7AF]{2,}/g) || []);
const freq = {};
tokens.forEach(w => { if (!prot.has(w)) freq[w] = (freq[w] || 0) + 1; });
const over = Object.entries(freq).filter(([,c]) => c >= 3).sort((a,b) => b[1]-a[1]);

console.log(`[${v.name_display}] 3회+ 단어: ${over.length}개`);
over.slice(0, 20).forEach(([w,c]) => console.log(`  "${w}" x${c}`));

// Now check which fields contribute
console.log('\n--- Tracing top word locations ---');
const topWord = over[0]?.[0];
if (topWord) {
  const SKIP = ['id','type','typePath','regionSlug','venueSlug','urlSlug','geo','images','imagePrompts','relatedVenueIds','map_url'];
  function trace(obj, path) {
    if (typeof obj === 'string') {
      const toks = (obj.match(/[\uAC00-\uD7AF]{2,}/g) || []);
      const cnt = toks.filter(t => t === topWord).length;
      if (cnt > 0) console.log(`  ${path}: "${topWord}" x${cnt}`);
    } else if (Array.isArray(obj)) {
      obj.forEach((item, i) => trace(item, `${path}[${i}]`));
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [k, val] of Object.entries(obj)) {
        if (SKIP.includes(k)) continue;
        trace(val, `${path}.${k}`);
      }
    }
  }
  console.log(`Tracing "${topWord}":`);
  trace(v, 'root');
}
