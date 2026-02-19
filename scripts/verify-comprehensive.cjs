const fs = require('fs');
const path = require('path');

function countWordsInFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const words = html.match(/[가-힣]{2,}/g) || [];
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  return freq;
}

function findAllPages(baseDir) {
  const pages = [];
  const types = ['night', 'club', 'lounge'];
  types.forEach(type => {
    const typeDir = path.join(baseDir, type);
    if (!fs.existsSync(typeDir)) return;
    fs.readdirSync(typeDir).forEach(region => {
      const regionDir = path.join(typeDir, region);
      if (!fs.statSync(regionDir).isDirectory()) return;
      fs.readdirSync(regionDir).forEach(venue => {
        const file = path.join(regionDir, venue, 'index.html');
        if (fs.existsSync(file)) {
          pages.push({ path: file, name: `${type}/${region}/${venue}` });
        }
      });
    });
  });
  return pages;
}

const pages = findAllPages('/home/user/week1/dist');
let passed = 0, failed = 0;
const failures = [];

pages.forEach(page => {
  const freq = countWordsInFile(page.path);
  const over3 = Object.entries(freq).filter(([, c]) => c > 3);
  if (over3.length > 0) {
    failed++;
    failures.push({ name: page.name, words: over3 });
  } else {
    passed++;
  }
});

console.log(`Total pages: ${pages.length}`);
console.log(`Passed (all words <= 3): ${passed}`);
console.log(`Failed (some words > 3): ${failed}`);

if (failures.length > 0) {
  console.log('\nFailed pages:');
  failures.forEach(f => {
    console.log(`  ${f.name}: ${f.words.map(([w,c]) => `${w}(${c})`).join(', ')}`);
  });
}
