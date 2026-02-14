#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// 모든 27개 가게: city + nameKo 매핑
const venues = [
  { dir: "arju-lounge", city: "서울", name: "아르쥬라운지" },
  { dir: "busan-asiad", city: "부산", name: "부산아시아드나이트" },
  { dir: "busan-mul", city: "부산", name: "부산물나이트" },
  { dir: "cheonan-stardom", city: "천안", name: "천안스타돔나이트" },
  { dir: "cheongdam-h2o", city: "서울", name: "청담H2O나이트" },
  { dir: "color-lounge", city: "서울", name: "컬러라운지" },
  { dir: "daegu-babamba", city: "대구", name: "대구바밤바나이트" },
  { dir: "doksan-kookbingwan", city: "서울", name: "독산동국빈관나이트" },
  { dir: "gangnam-race", city: "서울", name: "강남레이스클럽" },
  { dir: "gangnam-sound", city: "서울", name: "강남사운드클럽" },
  { dir: "gangseo-hobak", city: "서울", name: "강서호박나이트" },
  { dir: "gildong-chance", city: "서울", name: "길동찬스나이트" },
  { dir: "hype-lounge", city: "서울", name: "하입라운지" },
  { dir: "ilsan-shampoo", city: "고양", name: "일산샴푸나이트" },
  { dir: "incheon-arabian", city: "인천", name: "인천아라비안나이트" },
  { dir: "intro-lounge", city: "서울", name: "인트로라운지" },
  { dir: "itaewon-waikiki", city: "서울", name: "이태원와이키키유토피아클럽" },
  { dir: "nowon-hobak", city: "서울", name: "노원호박나이트" },
  { dir: "nowon-star", city: "서울", name: "노원스타나이트" },
  { dir: "paju-skydome", city: "파주", name: "파주야당스카이돔나이트" },
  { dir: "sangbong-hankookgwan", city: "서울", name: "상봉동한국관나이트" },
  { dir: "seongnam-shampoo", city: "성남", name: "성남샴푸나이트" },
  { dir: "sinlim-grandprix", city: "서울", name: "신림그랑프리나이트" },
  { dir: "suwon-chance-dome", city: "수원", name: "수원찬스돔나이트" },
  { dir: "suwon-korea", city: "수원", name: "수원코리아나이트" },
  { dir: "suyu-shampoo", city: "서울", name: "수유샴푸나이트" },
  { dir: "ulsan-champion", city: "울산", name: "울산챔피언나이트" },
];

const clubDir = path.join(__dirname, '..', 'club');

let totalFixed = 0;

for (const v of venues) {
  const htmlPath = path.join(clubDir, v.dir, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    console.error(`[SKIP] ${v.dir} not found`);
    continue;
  }

  let html = fs.readFileSync(htmlPath, 'utf8');
  const pattern = `${v.city} ${v.name}`;
  const count = (html.match(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

  if (count > 0) {
    html = html.split(pattern).join(v.name);
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`[FIXED] ${v.dir}: "${pattern}" → "${v.name}" (${count} occurrences)`);
    totalFixed += count;
  } else {
    console.log(`[OK] ${v.dir}: no "${pattern}" found`);
  }
}

console.log(`\n=== Total: ${totalFixed} occurrences fixed across all pages ===`);
