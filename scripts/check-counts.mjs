import fs from 'fs';
const data = JSON.parse(fs.readFileSync('/home/user/week1/data/venues.json', 'utf-8'));
const v = data.find(x => x.regionSlug === 'sangbong' && x.venueSlug.includes('한국관'));
if (!v) {
  console.log('Not found');
  process.exit();
}
const json = JSON.stringify(v, null, 2);
console.log('한국관 in JSON:', (json.match(/한국관/g)||[]).length);
console.log('상봉동 in JSON:', (json.match(/상봉동/g)||[]).length);
console.log('나이트 in JSON:', (json.match(/나이트/g)||[]).length);

const fields = {
  seoTitle: v.seoTitle||'',
  seoDescription: v.seoDescription||'',
  hookIntro: v.hookIntro||'',
  teaser: v.teaser||'',
  story: JSON.stringify(v.story),
  atmosphere: v.bodySections?.atmosphere||'',
  music: v.bodySections?.music||'',
  safety: v.bodySections?.safety||'',
  deepDive: JSON.stringify(v.bodySections?.deepDive||{}),
  timeline: JSON.stringify(v.timeline),
  checklist: JSON.stringify(v.checklist),
  faq: JSON.stringify(v.faq),
  keywords: JSON.stringify(v.keywords),
  images: JSON.stringify(v.images),
};
console.log('\nPer-field:');
for (const [k, val] of Object.entries(fields)) {
  const c = ((val||'').match(/한국관/g)||[]).length;
  const r = ((val||'').match(/상봉동/g)||[]).length;
  const n = ((val||'').match(/나이트/g)||[]).length;
  if (c+r+n > 0) console.log(`  ${k}: 한국관=${c} 상봉동=${r} 나이트=${n}`);
}
