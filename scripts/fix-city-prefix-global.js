#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// 모든 city+name 패턴 (교차 참조까지 커버)
const replacements = [
  { from: "서울 아르쥬라운지", to: "아르쥬라운지" },
  { from: "부산 부산아시아드나이트", to: "부산아시아드나이트" },
  { from: "부산 부산물나이트", to: "부산물나이트" },
  { from: "천안 천안스타돔나이트", to: "천안스타돔나이트" },
  { from: "서울 청담H2O나이트", to: "청담H2O나이트" },
  { from: "서울 컬러라운지", to: "컬러라운지" },
  { from: "대구 대구바밤바나이트", to: "대구바밤바나이트" },
  { from: "서울 독산동국빈관나이트", to: "독산동국빈관나이트" },
  { from: "서울 강남레이스클럽", to: "강남레이스클럽" },
  { from: "서울 강남사운드클럽", to: "강남사운드클럽" },
  { from: "서울 강서호박나이트", to: "강서호박나이트" },
  { from: "서울 길동찬스나이트", to: "길동찬스나이트" },
  { from: "서울 하입라운지", to: "하입라운지" },
  { from: "고양 일산샴푸나이트", to: "일산샴푸나이트" },
  { from: "인천 인천아라비안나이트", to: "인천아라비안나이트" },
  { from: "서울 인트로라운지", to: "인트로라운지" },
  { from: "서울 이태원와이키키유토피아클럽", to: "이태원와이키키유토피아클럽" },
  { from: "서울 노원호박나이트", to: "노원호박나이트" },
  { from: "서울 노원스타나이트", to: "노원스타나이트" },
  { from: "파주 파주야당스카이돔나이트", to: "파주야당스카이돔나이트" },
  { from: "서울 상봉동한국관나이트", to: "상봉동한국관나이트" },
  { from: "성남 성남샴푸나이트", to: "성남샴푸나이트" },
  { from: "서울 신림그랑프리나이트", to: "신림그랑프리나이트" },
  { from: "수원 수원찬스돔나이트", to: "수원찬스돔나이트" },
  { from: "수원 수원코리아나이트", to: "수원코리아나이트" },
  { from: "서울 수유샴푸나이트", to: "수유샴푸나이트" },
  { from: "울산 울산챔피언나이트", to: "울산챔피언나이트" },
];

const clubDir = path.join(__dirname, '..', 'club');
const dirs = fs.readdirSync(clubDir).filter(d => {
  const p = path.join(clubDir, d, 'index.html');
  return fs.existsSync(p);
});

let totalFixed = 0;

for (const dir of dirs) {
  const htmlPath = path.join(clubDir, dir, 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  let pageFixed = 0;

  for (const r of replacements) {
    const escaped = r.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    const matches = html.match(regex);
    if (matches) {
      html = html.replace(regex, r.to);
      pageFixed += matches.length;
    }
  }

  if (pageFixed > 0) {
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`[FIXED] ${dir}: ${pageFixed} replacements`);
    totalFixed += pageFixed;
  }
}

console.log(`\n=== Total: ${totalFixed} global replacements ===`);
