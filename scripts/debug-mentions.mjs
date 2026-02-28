import { readFileSync } from 'fs';
const d = JSON.parse(readFileSync('data/venues.json', 'utf-8'));
const v = d.find(v => v.name_display === '강남 아르떼 클럽');
const n = v.name_display;
const text = [v.hookIntro||'', v.teaser||'', v.description_short||'',
  v.conclusionText||'', v.bodySections?.atmosphere||'', v.bodySections?.music||'',
  v.intro?.hook||'', v.intro?.valuePromise||'',
  Object.values(v.story||{}).join(' '),
  (v.faq||[]).map(f=>f.q+' '+f.a).join(' '),
  v.quickPlan?.costNote||'',
  (v.quickPlan?.scenarios||[]).map(s=>s.desc).join(' '),
].join(' ');
const re = new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g');
const m = (text.match(re)||[]).length;
console.log('Total mentions:', m);
console.log('faq:', (v.faq||[]).filter(f=>(f.q+f.a).includes(n)).map(f=>f.q.slice(0,30)));
console.log('hookIntro includes name:', (v.hookIntro||'').includes(n));
console.log('conclusionText:', v.conclusionText.slice(0,80));
console.log('scenarios:', (v.quickPlan?.scenarios||[]).filter(s=>s.desc.includes(n)).length);
