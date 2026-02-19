const fs = require('fs');
const path = require('path');
const venues = JSON.parse(fs.readFileSync('/home/user/week1/data/venues.json', 'utf8'));

function getVenueUrl(v) {
  const slug = v.urlSlug || v.venueSlug;
  return `/${v.type}/${v.regionSlug}/${slug}/`;
}

let passed = 0;
let failed = 0;
const failures = [];
const details = [];

venues.forEach(v => {
  const url = getVenueUrl(v);
  const htmlPath = path.join('/home/user/week1/dist', url, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    failures.push(`${url}: FILE NOT FOUND`);
    failed++;
    return;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const text = html.replace(/<[^>]+>/g, ' ');

  // Count name_display occurrences in visible text
  const name = v.name_display;
  const nameRegex = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const nameCount = (text.match(nameRegex) || []).length;

  // Also count individual parts
  const parts = name.split(/\s+/);
  const partCounts = {};
  parts.forEach(p => {
    if (p.length >= 2) {
      const r = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      partCounts[p] = (text.match(r) || []).length;
    }
  });

  const info = `${url}: name_display="${name}" count=${nameCount}, parts=${JSON.stringify(partCounts)}`;
  details.push(info);

  if (nameCount < 2) {
    failures.push(`${url}: name_display appears only ${nameCount} times (TOO FEW)`);
    failed++;
  } else if (nameCount > 10) {
    failures.push(`${url}: name_display appears ${nameCount} times (TOO MANY)`);
    failed++;
  } else {
    passed++;
  }
});

console.log(`Total pages: ${venues.length}`);
console.log(`Passed (name 2-10 times): ${passed}`);
console.log(`Failed: ${failed}`);

if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log('  ' + f));
}

// Show a few samples
console.log('\nSamples:');
details.slice(0, 5).forEach(d => console.log('  ' + d));
console.log('  ...');
details.slice(-3).forEach(d => console.log('  ' + d));
