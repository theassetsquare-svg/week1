const fs = require('fs');
const path = require('path');

function extractText(html) {
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  let text = html.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#9733;/g, '').replace(/&nbsp;/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

function countKoreanWords(text) {
  const words = text.match(/[가-힣]{2,}/g) || [];
  const counts = {};
  for (const w of words) {
    counts[w] = (counts[w] || 0) + 1;
  }
  return counts;
}

function getPages(baseDir) {
  const pages = [];
  const types = ['night', 'club', 'lounge'];
  for (const t of types) {
    const tDir = path.join(baseDir, t);
    if (!fs.existsSync(tDir)) continue;
    for (const region of fs.readdirSync(tDir)) {
      const rDir = path.join(tDir, region);
      if (!fs.statSync(rDir).isDirectory()) continue;
      for (const venue of fs.readdirSync(rDir)) {
        const vDir = path.join(rDir, venue);
        if (!fs.statSync(vDir).isDirectory()) continue;
        const idx = path.join(vDir, 'index.html');
        if (fs.existsSync(idx)) {
          pages.push({ name: t + '/' + region + '/' + venue, file: idx, type: t });
        }
      }
    }
  }
  return pages;
}

const pages = getPages('dist');
console.log('총 분석 페이지 수:', pages.length);
console.log('');

const allResults = {};
for (const p of pages) {
  const html = fs.readFileSync(p.file, 'utf-8');
  const text = extractText(html);
  allResults[p.name] = countKoreanWords(text);
}

// Find words common to ALL pages with avg count >= 3
const allWords = new Set();
for (const counts of Object.values(allResults)) {
  for (const w of Object.keys(counts)) allWords.add(w);
}

const pageNames = Object.keys(allResults);
const commonWords = {};

for (const word of allWords) {
  const counts = pageNames.map(p => allResults[p][word] || 0);
  const allPresent = counts.every(c => c > 0);
  if (allPresent) {
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    if (avg >= 3) {
      commonWords[word] = { min, max, avg: Math.round(avg * 10) / 10 };
    }
  }
}

const sorted = Object.entries(commonWords).sort((a, b) => b[1].avg - a[1].avg);

console.log('=== 모든 상세페이지에 공통 3회 이상 등장하는 단어 ===');
console.log('단어'.padEnd(18) + '최소  최대  평균');
console.log('-'.repeat(45));
for (const [word, { min, max, avg }] of sorted.slice(0, 50)) {
  console.log(word.padEnd(18) + String(min).padEnd(6) + String(max).padEnd(6) + avg);
}

// Now analyze per-page: venue name repetition
console.log('\n\n=== 각 페이지별 매장명 반복 횟수 (상위 20개) ===');

// Load venues data to get name_display
const venuesData = JSON.parse(fs.readFileSync('data/venues.json', 'utf-8'));
const venueNameMap = {};
for (const v of venuesData) {
  const key = v.type + '/' + v.regionSlug + '/' + (v.urlSlug || v.venueSlug);
  venueNameMap[key] = v.name_display;
}

const nameRepetitions = [];
for (const p of pages) {
  const venueName = venueNameMap[p.name];
  if (!venueName) continue;
  const html = fs.readFileSync(p.file, 'utf-8');
  const text = extractText(html);

  // Count exact name occurrences
  const nameCount = (text.match(new RegExp(venueName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

  // Also count region name
  const regionMatch = p.name.split('/')[1];
  const venue = venuesData.find(v => v.type + '/' + v.regionSlug + '/' + (v.urlSlug || v.venueSlug) === p.name);
  const regionName = venue ? venue.region : '';
  const regionCount = regionName ? (text.match(new RegExp(regionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length : 0;

  nameRepetitions.push({
    page: p.name,
    venueName,
    nameCount,
    regionName,
    regionCount,
  });
}

nameRepetitions.sort((a, b) => b.nameCount - a.nameCount);

console.log('페이지'.padEnd(35) + '매장명'.padEnd(20) + '매장명횟수  지역명  지역횟수');
console.log('-'.repeat(100));
for (const r of nameRepetitions) {
  console.log(
    r.page.padEnd(35) +
    r.venueName.padEnd(20) +
    String(r.nameCount).padEnd(10) +
    r.regionName.padEnd(8) +
    r.regionCount
  );
}

// Summary stats
const nameCounts = nameRepetitions.map(r => r.nameCount);
const regionCounts = nameRepetitions.map(r => r.regionCount);
console.log('\n--- 요약 ---');
console.log('매장명 반복: 최소', Math.min(...nameCounts), '/ 최대', Math.max(...nameCounts), '/ 평균', Math.round(nameCounts.reduce((a,b)=>a+b,0)/nameCounts.length * 10)/10);
console.log('지역명 반복: 최소', Math.min(...regionCounts), '/ 최대', Math.max(...regionCounts), '/ 평균', Math.round(regionCounts.reduce((a,b)=>a+b,0)/regionCounts.length * 10)/10);
