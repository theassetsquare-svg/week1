const fs = require('fs');
const path = require('path');

function extractVisibleText(html) {
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  let text = html.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&[^;]+;/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

function countAllKoreanWords(html) {
  const words = html.match(/[가-힣]{2,}/g) || [];
  const counts = {};
  for (const w of words) counts[w] = (counts[w] || 0) + 1;
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
        if (fs.existsSync(idx)) pages.push({ name: t + '/' + region + '/' + venue, file: idx, type: t });
      }
    }
  }
  return pages;
}

const pages = getPages('dist');
console.log(`총 ${pages.length}개 페이지 검증\n`);

// Check sangbong/한국관 specifically
const sangbong = pages.find(p => p.name.includes('sangbong/한국관'));
if (sangbong) {
  const html = fs.readFileSync(sangbong.file, 'utf-8');
  const allCounts = countAllKoreanWords(html);
  const visText = extractVisibleText(html);
  const visCounts = countAllKoreanWords(visText);

  console.log('=== 상봉동 한국관 - 수정 후 ===');
  console.log('\n전체 HTML (4회 이상):');
  const sortedAll = Object.entries(allCounts).sort((a, b) => b[1] - a[1]);
  for (const [w, c] of sortedAll) {
    if (c >= 4) console.log(`  ${w}: ${c}`);
  }
  console.log('\n보이는 텍스트 (4회 이상):');
  const sortedVis = Object.entries(visCounts).sort((a, b) => b[1] - a[1]);
  for (const [w, c] of sortedVis) {
    if (c >= 4) console.log(`  ${w}: ${c}`);
  }
}

// Summary across all pages
console.log('\n\n=== 전체 130 페이지 최종 검증 ===\n');

let totalPages = 0;
let pagesWithOver3 = 0;
let totalExcess = 0;
const worstPages = [];

for (const p of pages) {
  totalPages++;
  const html = fs.readFileSync(p.file, 'utf-8');
  const visCounts = countAllKoreanWords(extractVisibleText(html));

  let pageExcess = 0;
  let over3Words = 0;
  const overList = [];

  for (const [w, c] of Object.entries(visCounts)) {
    if (c > 3) {
      over3Words++;
      pageExcess += (c - 3);
      overList.push(`${w}(${c})`);
    }
  }

  if (over3Words > 0) {
    pagesWithOver3++;
    totalExcess += pageExcess;
    worstPages.push({ name: p.name, over3Words, pageExcess, words: overList.join(', ') });
  }
}

worstPages.sort((a, b) => b.pageExcess - a.pageExcess);

console.log(`검증 페이지: ${totalPages}개`);
console.log(`3회 초과 단어가 있는 페이지: ${pagesWithOver3}개`);
console.log(`총 초과 단어: ${totalExcess}개`);

if (worstPages.length > 0) {
  console.log('\n상위 10 문제 페이지:');
  for (const w of worstPages.slice(0, 10)) {
    console.log(`  ${w.name}: ${w.over3Words}개 단어, 초과${w.pageExcess}회 [${w.words}]`);
  }
}

// Compare with before
console.log('\n\n=== 수정 전후 비교 ===');
console.log('수정 전: 평균 17개 단어 4회+, 평균 초과 53회, 총 6,902 초과');
console.log(`수정 후: 평균 ${Math.round((worstPages.reduce((a,b) => a + b.over3Words, 0)) / totalPages)}개 단어 4회+, 평균 초과 ${Math.round(totalExcess / totalPages)}회, 총 ${totalExcess} 초과`);
