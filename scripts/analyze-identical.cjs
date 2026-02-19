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

// Extract specific repeated phrases from each page
const identicalPhrases = [
  '이 글은 정보성 읽을거리이며, 불법 알선과 무관합니다',
  '나이트라이프 성향 테스트',
  '5가지 질문으로 당신의 나이트라이프 성향을 알아보세요',
  '밤문화 유형 비교',
  '나만의 후기',
  '다녀온 후 느낀 점을 기록해보세요',
  '심층 분석',
  '사전 체크포인트',
  '씬의 발자취',
  '시즌 노트',
  '필수 코스',
  '감성 요약',
  '스토리텔링',
  '타임라인',
  '커스텀 코스',
  '첫방문 체크리스트',
  '뮤직 가이드',
  '위치/교통',
  '자주 묻는 질문',
  '매너/안전/예산 안내',
  '관련 매장',
  '갤러리',
  '관련 검색어',
  '완벽 가이드',
  '밤에 외출할 때 가장 중요한 것은',
  '선호하는 음악 장르는',
  '이상적인 밤 외출 인원은',
  '밤문화 예산은',
  '좋아하는 분위기는',
  '목적과 시간대를 선택하면 맞춤 플랜이 표시됩니다',
  '오늘 밤의 경험을 자유롭게 적어보세요',
  '지금 기분은',
  '네이버지도 검색',
  '구글지도 검색',
  '저장하기',
];

console.log('=== 모든 페이지에 동일하게 들어있는 고정 문구 ===\n');

let nightPages = pages.filter(p => p.type === 'night');
let clubPages = pages.filter(p => p.type === 'club');
let loungePages = pages.filter(p => p.type === 'lounge');

console.log(`나이트 페이지: ${nightPages.length}개`);
console.log(`클럽 페이지: ${clubPages.length}개`);
console.log(`라운지 페이지: ${loungePages.length}개`);
console.log(`총: ${pages.length}개\n`);

// Check each phrase
for (const phrase of identicalPhrases) {
  let count = 0;
  for (const p of pages) {
    const html = fs.readFileSync(p.file, 'utf-8');
    const text = extractText(html);
    if (text.includes(phrase)) count++;
  }
  if (count === pages.length) {
    console.log(`[모든 페이지] "${phrase}"`);
  } else if (count > 0) {
    console.log(`[${count}/${pages.length} 페이지] "${phrase}"`);
  }
}

// Now check the quiz content - exact same quiz questions on all pages
console.log('\n=== 동일 콘텐츠 블록 분석 ===\n');

// Check for identical deep dive default content
const deepDiveDefaults = {
  night: [
    '복장은 단정한 캐주얼이 기본이며 러닝셔츠나 슬리퍼는 피하자',
    '밤문화는 오랜 시간에 걸쳐 단순 유흥에서 사운드·패션·사교가 어우러진 복합 문화로 진화했다',
    '계절마다 분위기가 달라진다. 봄과 가을이 가장 쾌적하며, 연말에는 사전 예약이 필수다',
    '1차로 든든한 저녁 식사 후 입장해 자리를 잡는다. 피크타임에 맞춰 즐기고, 마무리는 해장국으로',
  ],
  club: [
    '복장은 깔끔한 캐주얼이 기본이며 슬리퍼나 반바지는 출입 거부 사유가 된다',
    'EDM 붐과 함께 성장이 시작되었고, 이후 다양한 장르가 뿌리를 내렸다',
    '계절마다 분위기가 달라진다. 봄과 가을이 쾌적하며, 연말에는 사전 예약이 필수다',
    '1차로 인근 맛집에서 식사 후 입장. 피크타임에 즐기고 새벽 해장으로 마무리',
  ],
  lounge: [
    '스마트 캐주얼 이상의 복장이 필수이며, 미리 자리를 확보하는 것이 좋다',
    '라운지 문화는 음악·인테리어·칵테일이 융합된 복합 문화로 진화했다',
    '계절마다 분위기가 달라진다. 봄과 가을이 쾌적하며, 연말에는 사전 예약이 필수다',
    '1차로 레스토랑 식사 후 시그니처 음료와 대화를 즐기고, 야경 산책으로 마무리',
  ],
};

for (const [type, defaults] of Object.entries(deepDiveDefaults)) {
  const typePages = pages.filter(p => p.type === type);
  console.log(`\n[${type} 페이지 - ${typePages.length}개] 심층 분석 기본값 사용 현황:`);
  for (const d of defaults) {
    let count = 0;
    for (const p of typePages) {
      const html = fs.readFileSync(p.file, 'utf-8');
      const text = extractText(html);
      if (text.includes(d)) count++;
    }
    console.log(`  ${count}/${typePages.length} 페이지: "${d.slice(0, 40)}..."`);
  }
}

// Check comparison table - identical on all pages of same type
console.log('\n\n=== 완전히 동일한 고정 섹션 요약 ===\n');
console.log('다음 섹션들이 모든 상세페이지에 100% 동일한 내용으로 반복됩니다:\n');
console.log('1. 퀴즈 (나이트라이프 성향 테스트) - 5개 질문 + 4개 결과 유형 완전 동일');
console.log('2. 밤문화 유형 비교 테이블 - 나이트/클럽/라운지 비교표 동일 (순서만 다름)');
console.log('3. 나만의 후기 (다이어리) - 별점 3개 + 텍스트 입력 구조 동일');
console.log('4. 심층 분석 - deepDive 데이터 없는 페이지는 기본값 동일');
console.log('5. 지금 기분은? (Mood Check) - 동일 타입 내 4개 무드 옵션 + 메시지 동일');
console.log('6. 고정 면책 문구 - "이 글은 정보성 읽을거리이며, 불법 알선과 무관합니다"');
console.log('7. 지도 버튼 - 네이버지도/구글지도 검색 동일');

// Count total fixed vs dynamic words
console.log('\n\n=== 고정 콘텐츠 vs 동적 콘텐츠 비율 추정 ===\n');

// Sample a page and identify fixed words
const sampleNight1 = pages.find(p => p.name.includes('night/gangnam'));
const sampleNight2 = pages.find(p => p.name.includes('night/busan'));
if (sampleNight1 && sampleNight2) {
  const text1 = extractText(fs.readFileSync(sampleNight1.file, 'utf-8'));
  const text2 = extractText(fs.readFileSync(sampleNight2.file, 'utf-8'));

  // Find common substrings (rough estimate)
  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);

  // Count words that appear in both texts exactly
  const set2 = new Set(words2);
  let commonCount = 0;
  for (const w of words1) {
    if (set2.has(w) && w.length > 1) commonCount++;
  }

  console.log(`샘플 비교: ${sampleNight1.name} vs ${sampleNight2.name}`);
  console.log(`페이지1 단어수: ${words1.length}`);
  console.log(`페이지2 단어수: ${words2.length}`);
  console.log(`동일 단어 수: ${commonCount} (${Math.round(commonCount/words1.length*100)}%)`);
}
