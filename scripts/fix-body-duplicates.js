#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const venues = [
  {dir:'arju-lounge',city:'서울',region:'서울',name:'아르쥬라운지'},
  {dir:'busan-asiad',city:'부산',region:'부산',name:'부산아시아드나이트'},
  {dir:'busan-mul',city:'부산',region:'부산',name:'부산물나이트'},
  {dir:'cheonan-stardom',city:'천안',region:'충남',name:'천안스타돔나이트'},
  {dir:'cheongdam-h2o',city:'서울',region:'서울',name:'청담H2O나이트'},
  {dir:'color-lounge',city:'서울',region:'서울',name:'컬러라운지'},
  {dir:'daegu-babamba',city:'대구',region:'대구',name:'대구바밤바나이트'},
  {dir:'doksan-kookbingwan',city:'서울',region:'서울',name:'독산동국빈관나이트'},
  {dir:'gangnam-race',city:'서울',region:'서울',name:'강남레이스클럽'},
  {dir:'gangnam-sound',city:'서울',region:'서울',name:'강남사운드클럽'},
  {dir:'gangseo-hobak',city:'서울',region:'서울',name:'강서호박나이트'},
  {dir:'gildong-chance',city:'서울',region:'서울',name:'길동찬스나이트'},
  {dir:'hype-lounge',city:'서울',region:'서울',name:'하입라운지'},
  {dir:'ilsan-shampoo',city:'고양',region:'경기',name:'일산샴푸나이트'},
  {dir:'incheon-arabian',city:'인천',region:'인천',name:'인천아라비안나이트'},
  {dir:'intro-lounge',city:'서울',region:'서울',name:'인트로라운지'},
  {dir:'itaewon-waikiki',city:'서울',region:'서울',name:'이태원와이키키유토피아클럽'},
  {dir:'nowon-hobak',city:'서울',region:'서울',name:'노원호박나이트'},
  {dir:'nowon-star',city:'서울',region:'서울',name:'노원스타나이트'},
  {dir:'paju-skydome',city:'파주',region:'경기',name:'파주야당스카이돔나이트'},
  {dir:'sangbong-hankookgwan',city:'서울',region:'서울',name:'상봉동한국관나이트'},
  {dir:'seongnam-shampoo',city:'성남',region:'경기',name:'성남샴푸나이트'},
  {dir:'sinlim-grandprix',city:'서울',region:'서울',name:'신림그랑프리나이트'},
  {dir:'suwon-chance-dome',city:'수원',region:'경기',name:'수원찬스돔나이트'},
  {dir:'suwon-korea',city:'수원',region:'경기',name:'수원코리아나이트'},
  {dir:'suyu-shampoo',city:'서울',region:'서울',name:'수유샴푸나이트'},
  {dir:'ulsan-champion',city:'울산',region:'울산',name:'울산챔피언나이트'},
];

const clubDir = path.join(__dirname, '..', 'club');
let totalFixed = 0;

for (const v of venues) {
  // city===region인 경우만 본문 중복 발생
  if (v.city !== v.region) continue;

  const htmlPath = path.join(clubDir, v.dir, 'index.html');
  if (!fs.existsSync(htmlPath)) continue;

  let html = fs.readFileSync(htmlPath, 'utf8');
  const orig = html;
  const c = v.city;

  // 1) React 렌더링 패턴: "부산<!-- --> · <!-- -->부산" → "부산"
  html = html.split(`${c}<!-- --> · <!-- -->${c}`).join(c);

  // 2) React 렌더링: "부산<!-- --> <!-- -->부산에" → "부산에"
  html = html.split(`${c}<!-- --> <!-- -->${c}에`).join(`${c}에`);

  // 3) 일반 텍스트: "부산 부산에 위치한" → "부산에 위치한"
  html = html.split(`${c} ${c}에 위치한`).join(`${c}에 위치한`);

  // 4) 일반 텍스트: "부산 부산 지역의" → "부산 지역의"
  html = html.split(`${c} ${c} 지역의`).join(`${c} 지역의`);

  // 5) JSON 데이터 내 패턴: "부산 부산에" → "부산에" (RSC payload)
  html = html.split(`${c} ${c}에`).join(`${c}에`);

  // 6) "부산 · 부산" (plain text) → "부산"
  html = html.split(`${c} · ${c}`).join(c);

  // 7) React children: "\"children\":\"부산\"},{...\"children\":\" · \"},{...\"children\":\"부산\"}"
  // This is the RSC JSON payload for "{city} · {region}"
  const rscDotPattern = `"children":"${c}"},{"type":"$","ref":null,"key":null,"props":{"children":" · "},"$$typeof":"$1"},{"type":"$","ref":null,"key":null,"props":{"children":"${c}"}`;
  const rscDotReplace = `"children":"${c}"}`;
  if (html.includes(rscDotPattern)) {
    html = html.split(rscDotPattern).join(rscDotReplace);
  }

  // 8) keywords meta: "부산 나이트,부산 클럽,...,부산 나이트클럽,부산 나이트,부산 클럽 추천,부산 나이트"
  // Remove exact duplicate keyword entries - handled by deduping
  // "부산 나이트클럽,부산 클럽 추천,부산 나이트" → keep as is (these are unique keywords)

  // 9) JSON-LD addressLocality/addressRegion: keep both (structured data standard)

  // 10) Breadcrumb JSON-LD: keep (standard structured data)

  if (html !== orig) {
    const diff = orig.length - html.length;
    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log(`[FIXED] ${v.dir}: removed ${diff} chars of duplicates`);
    totalFixed++;
  } else {
    console.log(`[OK] ${v.dir}: no body duplicates found`);
  }
}

// Now verify: check ALL files for any remaining "{city} {city}" patterns
console.log('\n=== Final verification ===');
const allDirs = fs.readdirSync(clubDir).filter(d => fs.existsSync(path.join(clubDir, d, 'index.html')));
let remaining = 0;
for (const d of allDirs) {
  const html = fs.readFileSync(path.join(clubDir, d, 'index.html'), 'utf8');
  const v = venues.find(x => x.dir === d);
  if (!v || v.city !== v.region) continue;
  const c = v.city;
  // Check for visible duplicates (excluding JSON-LD structured data which is ok)
  const visiblePatterns = [
    `${c}<!-- --> · <!-- -->${c}`,
    `${c}<!-- --> <!-- -->${c}에`,
    `${c} ${c}에 위치한`,
    `${c} ${c} 지역의`,
    `${c} · ${c}`,
  ];
  for (const p of visiblePatterns) {
    if (html.includes(p)) {
      console.log(`  [REMAINING] ${d}: "${p}"`);
      remaining++;
    }
  }
}
if (remaining === 0) console.log('  All visible duplicates removed!');
console.log(`\n=== Done: ${totalFixed} files fixed ===`);
