const fs = require('fs');
const path = require('path');

// Full HTML word count (including scripts, JSON-LD, meta, everything)
function countAllKoreanWords(html) {
  const words = html.match(/[가-힣]{2,}/g) || [];
  const counts = {};
  for (const w of words) {
    counts[w] = (counts[w] || 0) + 1;
  }
  return counts;
}

// Visible text only
function extractVisibleText(html) {
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  let text = html.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&[^;]+;/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

function countVisibleKoreanWords(html) {
  const text = extractVisibleText(html);
  const words = text.match(/[가-힣]{2,}/g) || [];
  const counts = {};
  for (const w of words) {
    counts[w] = (counts[w] || 0) + 1;
  }
  return counts;
}

// Analyze sangbong/한국관 in detail
const targetFile = 'dist/night/sangbong/한국관/index.html';
if (fs.existsSync(targetFile)) {
  const html = fs.readFileSync(targetFile, 'utf-8');

  console.log('=== 상봉동 한국관 나이트 - 전체 HTML 단어 빈도 (4회 이상) ===\n');
  const allCounts = countAllKoreanWords(html);
  const sortedAll = Object.entries(allCounts).sort((a, b) => b[1] - a[1]);
  console.log('단어'.padEnd(20) + '전체HTML횟수');
  console.log('-'.repeat(35));
  for (const [w, c] of sortedAll) {
    if (c >= 4) console.log(w.padEnd(20) + c);
  }

  console.log('\n\n=== 상봉동 한국관 나이트 - 보이는 텍스트만 단어 빈도 (4회 이상) ===\n');
  const visCounts = countVisibleKoreanWords(html);
  const sortedVis = Object.entries(visCounts).sort((a, b) => b[1] - a[1]);
  console.log('단어'.padEnd(20) + '보이는텍스트횟수');
  console.log('-'.repeat(40));
  for (const [w, c] of sortedVis) {
    if (c >= 4) console.log(w.padEnd(20) + c);
  }
}

// Analyze ALL pages to find worst offenders
console.log('\n\n=== 전체 130페이지 - 4회 이상 반복 단어 통계 ===\n');

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
const pageStats = [];

for (const p of pages) {
  const html = fs.readFileSync(p.file, 'utf-8');
  const visCounts = countVisibleKoreanWords(html);

  // Count how many words appear 4+ times
  let wordsOver3 = 0;
  let totalExcess = 0;
  const overWords = [];
  for (const [w, c] of Object.entries(visCounts)) {
    if (c > 3) {
      wordsOver3++;
      totalExcess += (c - 3);
      overWords.push({ word: w, count: c });
    }
  }
  overWords.sort((a, b) => b.count - a.count);
  pageStats.push({ name: p.name, wordsOver3, totalExcess, top5: overWords.slice(0, 5) });
}

pageStats.sort((a, b) => b.totalExcess - a.totalExcess);

console.log('페이지'.padEnd(40) + '4회+단어수  초과총횟수  상위반복단어');
console.log('-'.repeat(120));
for (const s of pageStats.slice(0, 20)) {
  const top = s.top5.map(w => `${w.word}(${w.count})`).join(', ');
  console.log(s.name.padEnd(40) + String(s.wordsOver3).padEnd(12) + String(s.totalExcess).padEnd(12) + top);
}

// Summary
const allExcess = pageStats.map(s => s.totalExcess);
const allOver3 = pageStats.map(s => s.wordsOver3);
console.log('\n--- 전체 요약 ---');
console.log('4회 이상 반복 단어 수: 평균', Math.round(allOver3.reduce((a,b)=>a+b,0)/allOver3.length), '/ 최대', Math.max(...allOver3));
console.log('초과 횟수 합계: 평균', Math.round(allExcess.reduce((a,b)=>a+b,0)/allExcess.length), '/ 최대', Math.max(...allExcess));
console.log('전체 페이지에서 삭제해야 할 총 초과 단어수:', allExcess.reduce((a,b)=>a+b,0));
