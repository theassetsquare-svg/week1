const fs = require('fs');
const path = require('path');
const venues = JSON.parse(fs.readFileSync('/home/user/week1/data/venues.json', 'utf8'));

function getVenueUrl(v) {
  const slug = v.urlSlug || v.venueSlug;
  return `/${v.type}/${v.regionSlug}/${slug}/`;
}

let titleUnique = new Set();
let results = { pass: 0, fail: 0, issues: [] };

// Check similarity between pages
const pageContents = [];

venues.forEach((v, idx) => {
  const url = getVenueUrl(v);
  const htmlPath = path.join('/home/user/week1/dist', url, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    results.issues.push(`${url}: FILE NOT FOUND`);
    results.fail++;
    return;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  // 1. Title check
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] || '';
  titleUnique.add(title);

  // 2. H1 check (should have venue name)
  const h1 = html.match(/<h1[^>]*>([^<]*)<\/h1>/)?.[1] || '';
  const hasNameInH1 = h1.includes(v.name_display) || h1.includes(v.venueSlug);

  // 3. hookIntro length
  const hookLen = (v.hookIntro || '').length;

  // 4. Body length
  const bodyLen = (v.bodySections?.atmosphere || '').length +
    (v.story?.scene1 || '').length + (v.story?.scene2 || '').length +
    (v.story?.scene3 || '').length + (v.story?.scene4 || '').length +
    (v.story?.scene5 || '').length + (v.story?.scene6 || '').length +
    (v.story?.scene7 || '').length + (v.story?.scene8 || '').length +
    (v.bodySections?.music || '').length + (v.bodySections?.safety || '').length +
    (v.faq || []).reduce((s, f) => s + f.q.length + f.a.length, 0) +
    (v.timeline || []).reduce((s, t) => s + t.label.length + t.desc.length, 0) +
    (v.checklist || []).reduce((s, c) => s + c.length, 0);

  // 5. Name count in content
  const nameRegex = new RegExp(v.name_display.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const nameCount = (text.match(nameRegex) || []).length;

  let pagePass = true;
  let pageIssues = [];

  if (hookLen < 300) { pageIssues.push(`hookIntro=${hookLen}<300`); pagePass = false; }
  if (bodyLen < 3000) { pageIssues.push(`body=${bodyLen}<3000`); pagePass = false; }
  if (nameCount < 3) { pageIssues.push(`name=${nameCount}<3`); pagePass = false; }
  if (nameCount > 10) { pageIssues.push(`name=${nameCount}>10`); pagePass = false; }

  if (pagePass) results.pass++;
  else {
    results.fail++;
    results.issues.push(`${url}: ${pageIssues.join(', ')}`);
  }

  // Store for similarity check
  pageContents.push({ url, hookIntro: v.hookIntro.substring(0, 50), title });
});

console.log('=== VERIFICATION RESULTS ===');
console.log(`Pages: ${venues.length}`);
console.log(`Pass: ${results.pass}`);
console.log(`Fail: ${results.fail}`);
console.log(`Unique titles: ${titleUnique.size}/${venues.length}`);

if (results.issues.length > 0) {
  console.log('\nIssues:');
  results.issues.slice(0, 10).forEach(i => console.log('  ' + i));
  if (results.issues.length > 10) console.log(`  ... and ${results.issues.length - 10} more`);
}

// Check title similarity
console.log('\n=== SAMPLE TITLES (first 10) ===');
pageContents.slice(0, 10).forEach(p => console.log(`  ${p.url}: ${p.title}`));

// Check hookIntro similarity (first chars should differ)
console.log('\n=== HOOKINTRO STARTS (first 10) ===');
pageContents.slice(0, 10).forEach(p => console.log(`  ${p.url}: ${p.hookIntro}...`));
