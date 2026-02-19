const fs = require('fs');
const path = require('path');

function countWordsInFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const words = html.match(/[가-힣]{2,}/g) || [];
  const freq = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  return freq;
}

// Check a sample of pages from each type
const samples = [
  { path: '/home/user/week1/dist/night/sangbong/한국관/index.html', name: 'night/상봉동/한국관' },
  { path: '/home/user/week1/dist/night/gangnam/뉴게이트/index.html', name: 'night/강남/뉴게이트' },
  { path: '/home/user/week1/dist/club/gangnam/아레나/index.html', name: 'club/강남/아레나' },
  { path: '/home/user/week1/dist/club/hongdae/NB/index.html', name: 'club/홍대/NB' },
];

// Find actual files
const types = ['night', 'club', 'lounge'];
const distBase = '/home/user/week1/dist';
const tested = [];

types.forEach(type => {
  const typeDir = path.join(distBase, type);
  if (!fs.existsSync(typeDir)) return;
  const regions = fs.readdirSync(typeDir).slice(0, 2);
  regions.forEach(region => {
    const regionDir = path.join(typeDir, region);
    if (!fs.statSync(regionDir).isDirectory()) return;
    const venues = fs.readdirSync(regionDir).slice(0, 1);
    venues.forEach(venue => {
      const file = path.join(regionDir, venue, 'index.html');
      if (fs.existsSync(file)) {
        tested.push({ path: file, name: `${type}/${region}/${venue}` });
      }
    });
  });
});

let allPassed = true;
tested.forEach(sample => {
  const freq = countWordsInFile(sample.path);
  const over3 = Object.entries(freq).filter(([, c]) => c > 3);
  if (over3.length > 0) {
    console.log(`FAIL: ${sample.name}`);
    over3.forEach(([w, c]) => console.log(`  ${w}: ${c}`));
    allPassed = false;
  } else {
    const max = Math.max(...Object.values(freq));
    const at3 = Object.entries(freq).filter(([, c]) => c === 3).length;
    console.log(`PASS: ${sample.name} (max=${max}, words@3=${at3})`);
  }
});

console.log(`\nTested ${tested.length} pages. ${allPassed ? 'ALL PASSED' : 'SOME FAILED'}`);
