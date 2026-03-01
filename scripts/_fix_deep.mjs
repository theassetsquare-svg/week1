#!/usr/bin/env node
/**
 * Deep content quality fixes:
 * 1. Re-pair FAQ Q&A (answers are shuffled from their questions)
 * 2. Fix garbled verb forms
 * 3. Fix wrong 공간→분위기 substitutions (e.g., "주차 분위기이")
 * 4. Fix truncated sentences ("할 수." → "할 수 있다.")
 * 5. Fix missing subjects before particles in story scenes
 */
import { readFileSync, writeFileSync } from 'fs';

const venues = JSON.parse(readFileSync('data/venues.json', 'utf8'));

// ═══════════════════════════════════════════════════════════════
// FIX 1: Re-pair FAQ Q&A
// Strategy: Match answers to questions by keyword overlap
// ═══════════════════════════════════════════════════════════════

// Define which FAQ topics match which answer patterns
const FAQ_PATTERNS = [
  // [question keywords, answer keywords]
  { qMatch: ['혼자', '괜찮'], aMatch: ['분위기', '어색', '혼자', '바 카운터', '카운터', '자리', '눈치'] },
  { qMatch: ['신분증', '필요'], aMatch: ['19세', '신분증', '주민등록증', '여권', '면허증', '미지참'] },
  { qMatch: ['드레스코드', '복장', '조건'], aMatch: ['슬리퍼', '반바지', '운동복', '캐주얼', '복장'] },
  { qMatch: ['게스트', '등록', '사전'], aMatch: ['채널', 'SNS', '인스타', 'DM', '게스트', '리스트'] },
  { qMatch: ['피크타임', '몇 시'], aMatch: ['11시', '12시', '1시', '피크', '북적', '활기'] },
  { qMatch: ['입장료', '얼마', '가격'], aMatch: ['요일', '가격', '이벤트', '별도', '주말', '평일', '만 원', '만원'] },
  { qMatch: ['대중교통', '가기'], aMatch: ['지하철', '도보', '택시', '버스', '정류장'] },
  { qMatch: ['주차', '곳'], aMatch: ['주차', '발렛', '코인', '유료', '무료', '주차장', '주변'] },
  { qMatch: ['예약', '방문', '없이'], aMatch: ['예약', '워크인', '자리', '테이블', '줄', '대기'] },
  { qMatch: ['시그니처', '메뉴', '칵테일', '추천'], aMatch: ['칵테일', '메뉴', '시그니처', '음료', '맥주', '와인'] },
  { qMatch: ['데이트', '기념일', '커플'], aMatch: ['데이트', '커플', '기념일', '분위기', '둘이', '조용'] },
  { qMatch: ['테이블', '차지', '최소', '주문'], aMatch: ['테이블', '최소', '미니멈', '보틀', '주문', '금액'] },
  { qMatch: ['단체', '그룹', '파티'], aMatch: ['단체', '그룹', '파티', '테이블', '대관', '예약'] },
  { qMatch: ['나이', '제한'], aMatch: ['19세', '나이', '신분증', '미성년', '제한'] },
  { qMatch: ['운영', '시간', '몇시'], aMatch: ['5시', '6시', '운영', '영업', '마감', '오픈'] },
  { qMatch: ['안주', '음식', '먹을'], aMatch: ['안주', '음식', '간단', '스낵', '과일'] },
  { qMatch: ['라이브', '공연', '밴드'], aMatch: ['라이브', '공연', '밴드', '노래', '연주'] },
  { qMatch: ['댄스', '파트너', '함께'], aMatch: ['댄스', '파트너', '혼자', '같이', '춤'] },
  { qMatch: ['음악', '장르', 'DJ'], aMatch: ['DJ', 'EDM', '힙합', '하우스', '장르', '선곡'] },
  { qMatch: ['소개팅', '만남', '미팅'], aMatch: ['만남', '자연스럽', '분위기', '어울리'] },
];

let faqFixes = 0;
venues.forEach(v => {
  if (!v.faq || v.faq.length < 2) return;

  const questions = v.faq.map(f => f.q);
  const answers = v.faq.map(f => f.a);

  // Try to match each question to the best answer
  const usedAnswers = new Set();
  const newFaq = [];

  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi];
    let bestScore = -1;
    let bestAi = -1;

    for (let ai = 0; ai < answers.length; ai++) {
      if (usedAnswers.has(ai)) continue;
      const a = answers[ai];

      let score = 0;
      for (const pattern of FAQ_PATTERNS) {
        const qMatches = pattern.qMatch.some(kw => q.includes(kw));
        const aMatches = pattern.aMatch.some(kw => a.includes(kw));
        if (qMatches && aMatches) score += 10;
        if (qMatches && !aMatches) score -= 5;
      }

      // Bonus for shared words between Q and A
      const qWords = new Set(q.match(/[\uAC00-\uD7AF]{2,}/g) || []);
      const aWords = new Set(a.match(/[\uAC00-\uD7AF]{2,}/g) || []);
      for (const w of qWords) {
        if (aWords.has(w)) score += 2;
      }

      if (score > bestScore) {
        bestScore = score;
        bestAi = ai;
      }
    }

    if (bestAi >= 0) {
      usedAnswers.add(bestAi);
      newFaq.push({ q: questions[qi], a: answers[bestAi] });
    } else {
      // Fallback: just use original
      newFaq.push(v.faq[qi]);
    }
  }

  // Check if we actually changed anything
  const changed = newFaq.some((f, i) => f.a !== v.faq[i].a);
  if (changed) {
    v.faq = newFaq;
    faqFixes++;
  }
});
console.log(`[1] FAQ re-paired: ${faqFixes} venues fixed`);

// ═══════════════════════════════════════════════════════════════
// FIX 2: Garbled verb forms
// ═══════════════════════════════════════════════════════════════

let verbFixes = 0;
function fixVerbs(obj) {
  if (typeof obj === 'string') {
    let fixed = obj;
    // 하합니다 → 합니다 (doubled syllable)
    fixed = fixed.replace(/하합니다/g, '합니다');
    // 고려하드립니다 → 권해드립니다
    fixed = fixed.replace(/고려하드립니다/g, '권해드립니다');
    // 안내하한다 → 안내한다
    fixed = fixed.replace(/안내하한다/g, '안내한다');
    // 권하하는 → 권하는
    fixed = fixed.replace(/권하하는/g, '권하는');
    // 살펴보합니다 → 권합니다
    fixed = fixed.replace(/살펴보합니다/g, '권합니다');
    // 살펴보을 → 조언을
    fixed = fixed.replace(/살펴보을/g, '조언을');
    // 제안하을 → 제안을
    fixed = fixed.replace(/제안하을/g, '제안을');
    // 독자적인한 → 특별한
    fixed = fixed.replace(/독자적인한/g, '특별한');
    if (fixed !== obj) verbFixes++;
    return fixed;
  }
  if (Array.isArray(obj)) return obj.map(fixVerbs);
  if (typeof obj === 'object' && obj !== null) {
    const r = {};
    for (const [k, val] of Object.entries(obj)) r[k] = fixVerbs(val);
    return r;
  }
  return obj;
}

venues.forEach(v => {
  for (const [k, val] of Object.entries(v)) v[k] = fixVerbs(val);
});
console.log(`[2] Garbled verbs fixed: ${verbFixes} instances`);

// ═══════════════════════════════════════════════════════════════
// FIX 3: Wrong 공간→분위기 substitutions
// "주차 분위기" → "주차 자리", etc.
// ═══════════════════════════════════════════════════════════════

let contextFixes = 0;
function fixContext(obj) {
  if (typeof obj === 'string') {
    let fixed = obj;
    // Fix bad 공간→분위기 substitutions
    fixed = fixed.replace(/주차\s*분위기/g, () => { contextFixes++; return '주차 자리'; });
    fixed = fixed.replace(/야외\s*분위기/g, () => { contextFixes++; return '야외 테라스'; });
    fixed = fixed.replace(/VIP\s*분위기/g, () => { contextFixes++; return 'VIP 룸'; });
    fixed = fixed.replace(/개인\s*분위기/g, () => { contextFixes++; return '개인 자리'; });
    fixed = fixed.replace(/별도\s*분위기/g, () => { contextFixes++; return '별도 자리'; });
    fixed = fixed.replace(/흡연\s*분위기/g, () => { contextFixes++; return '흡연 구역'; });
    // "분위기이" (wrong particle from 공간이) → "자리가"
    fixed = fixed.replace(/분위기이\s/g, () => { contextFixes++; return '자리가 '; });
    fixed = fixed.replace(/분위기이$/g, () => { contextFixes++; return '자리가'; });
    return fixed;
  }
  if (Array.isArray(obj)) return obj.map(fixContext);
  if (typeof obj === 'object' && obj !== null) {
    const r = {};
    for (const [k, val] of Object.entries(obj)) r[k] = fixContext(val);
    return r;
  }
  return obj;
}

venues.forEach(v => {
  for (const [k, val] of Object.entries(v)) v[k] = fixContext(val);
});
console.log(`[3] Context-wrong substitutions fixed: ${contextFixes} instances`);

// ═══════════════════════════════════════════════════════════════
// FIX 4: Truncated sentences
// "할 수." → "할 수 있다."
// "되어." → "되어 있다."
// ═══════════════════════════════════════════════════════════════

let truncFixes = 0;
function fixTruncated(obj) {
  if (typeof obj === 'string') {
    let fixed = obj;
    // "수." at end or before space → "수 있다."
    fixed = fixed.replace(/\s수\.(\s|$)/g, (m, after) => { truncFixes++; return ' 수 있다.' + after; });
    // "에." truncated → "에 있다."
    fixed = fixed.replace(/\s에\.(\s|$)/g, (m, after) => { truncFixes++; return ' 에 있다.' + after; });
    // "되어." → "되어 있다."
    fixed = fixed.replace(/되어\.(\s|$)/g, (m, after) => { truncFixes++; return '되어 있다.' + after; });
    // "지나." → "지나간다."
    fixed = fixed.replace(/지나\.(\s|$)/g, (m, after) => { truncFixes++; return '지나간다.' + after; });
    // "계속되고." → "계속되고 있다."
    fixed = fixed.replace(/계속되고\.(\s|$)/g, (m, after) => { truncFixes++; return '계속되고 있다.' + after; });
    // "정중히 거절." → "정중히 거절해도 됩니다."
    fixed = fixed.replace(/정중히 거절\./g, () => { truncFixes++; return '정중히 거절해도 됩니다.'; });
    // "설계되어." → "설계되어 있다."
    fixed = fixed.replace(/설계되어\.(\s|$)/g, (m, after) => { truncFixes++; return '설계되어 있다.' + after; });
    // "준비되어." → "준비되어 있다."
    fixed = fixed.replace(/준비되어\.(\s|$)/g, (m, after) => { truncFixes++; return '준비되어 있다.' + after; });
    return fixed;
  }
  if (Array.isArray(obj)) return obj.map(fixTruncated);
  if (typeof obj === 'object' && obj !== null) {
    const r = {};
    for (const [k, val] of Object.entries(obj)) r[k] = fixTruncated(val);
    return r;
  }
  return obj;
}

venues.forEach(v => {
  for (const [k, val] of Object.entries(v)) v[k] = fixTruncated(val);
});
console.log(`[4] Truncated sentences fixed: ${truncFixes} instances`);

// ═══════════════════════════════════════════════════════════════
// FIX 5: Fix missing subjects before particles in story scenes
// Pattern: "모여 으로 향한다" → "모여 클럽으로 향한다"
// Pattern: "에서의 핵심 시간" → "{name}에서의 핵심 시간"
// ═══════════════════════════════════════════════════════════════

let subjectFixes = 0;
venues.forEach(v => {
  const name = v.name_display;
  const coreName = name.replace(v.region + ' ', '').replace(/\s+(클럽|나이트|라운지)\s*$/, '').trim();

  function fixSubject(obj) {
    if (typeof obj === 'string') {
      let fixed = obj;
      // Fix bare particles at sentence start or after period/space
      // "으로 향한다" → "{coreName}으로 향한다"
      fixed = fixed.replace(/(^|\.\s+)으로 향한다/g, (m, pre) => { subjectFixes++; return pre + coreName + '으로 향한다'; });
      // "에 대한 이야기" → "{coreName}에 대한 이야기"
      fixed = fixed.replace(/(^|\.\s+)에 대한 이야기/g, (m, pre) => { subjectFixes++; return pre + coreName + '에 대한 이야기'; });
      // "에서의 핵심 시간" → "{coreName}에서의 핵심 시간"
      fixed = fixed.replace(/(^|\.\s+)에서의\s/g, (m, pre) => { subjectFixes++; return pre + coreName + '에서의 '; });
      // "을 떠나기" → "{coreName}을 떠나기"
      fixed = fixed.replace(/(^|\.\s+)을 떠나기/g, (m, pre) => { subjectFixes++; return pre + coreName + '을 떠나기'; });
      // "이 남긴" → "{coreName}이 남긴"
      fixed = fixed.replace(/(^|\.\s+)이 남긴/g, (m, pre) => { subjectFixes++; return pre + coreName + '이 남긴'; });
      // "에서 모르는" → "{coreName}에서 모르는"
      fixed = fixed.replace(/(^|\.\s+)에서 모르는/g, (m, pre) => { subjectFixes++; return pre + coreName + '에서 모르는'; });
      // "에서 후회" → "{coreName}에서 후회"
      fixed = fixed.replace(/(^|\.\s+)에서 후회/g, (m, pre) => { subjectFixes++; return pre + coreName + '에서 후회'; });
      // "에 입장하며" → "{coreName}에 입장하며"
      fixed = fixed.replace(/(^|\.\s+)에 입장하며/g, (m, pre) => { subjectFixes++; return pre + coreName + '에 입장하며'; });
      // "에 사람들이" → "{coreName}에 사람들이"
      fixed = fixed.replace(/(^|\.\s+)에 사람들이/g, (m, pre) => { subjectFixes++; return pre + coreName + '에 사람들이'; });
      // "에서의 정리한다" → "{coreName}에서의 밤을 정리한다"
      fixed = fixed.replace(/에서의 정리한다/g, () => { subjectFixes++; return coreName + '에서의 밤을 정리한다'; });
      // "에서의 경험이" → "{coreName}에서의 경험이"
      fixed = fixed.replace(/(^|\.\s+)에서의 경험이/g, (m, pre) => { subjectFixes++; return pre + coreName + '에서의 경험이'; });
      // ". 에서" → ". {coreName}에서"
      fixed = fixed.replace(/\.\s+에서\s/g, (m) => { subjectFixes++; return '. ' + coreName + '에서 '; });
      // "모여 으로" → "모여 {coreName}으로"
      fixed = fixed.replace(/모여\s+으로/g, () => { subjectFixes++; return '모여 ' + coreName + '으로'; });
      // "에너지가 을" → "에너지가 {coreName}을"
      fixed = fixed.replace(/에너지가\s+을\s/g, () => { subjectFixes++; return '에너지가 ' + coreName + '을 '; });
      // "여러 중에서도" → "여러 곳 중에서도"
      fixed = fixed.replace(/여러\s+중에서도/g, () => { subjectFixes++; return '여러 곳 중에서도'; });
      // "감사함이 뒤흔든다" → "감사함이 마음을 뒤흔든다"
      fixed = fixed.replace(/감사함이 뒤흔든다/g, () => { subjectFixes++; return '감사함이 마음을 뒤흔든다'; });
      fixed = fixed.replace(/감사함이 전환시킨다/g, () => { subjectFixes++; return '감사함이 기분을 전환시킨다'; });
      // "자를 물들인다" → "방문자를 물들인다"
      fixed = fixed.replace(/자를 물들인다/g, () => { subjectFixes++; return '방문자를 물들인다'; });
      // "자 만족도" → "방문자 만족도"
      fixed = fixed.replace(/자\s만족도/g, () => { subjectFixes++; return '방문자 만족도'; });
      // "현장감가" → "현장감이"
      fixed = fixed.replace(/현장감가/g, () => { subjectFixes++; return '현장감이'; });
      // "감각가" → "감각이"
      fixed = fixed.replace(/감각가/g, () => { subjectFixes++; return '감각이'; });
      return fixed;
    }
    if (Array.isArray(obj)) return obj.map(fixSubject);
    if (typeof obj === 'object' && obj !== null) {
      const r = {};
      for (const [k, val] of Object.entries(obj)) r[k] = fixSubject(val);
      return r;
    }
    return obj;
  }

  // Apply to story, bodySections, hookIntro
  ['story', 'bodySections', 'hookIntro', 'conclusionText', 'sectionIntros', 'faq', 'aiSummary'].forEach(field => {
    if (v[field]) v[field] = fixSubject(v[field]);
  });
});
console.log(`[5] Missing subjects fixed: ${subjectFixes} instances`);

// ═══════════════════════════════════════════════════════════════
// FIX 6: Fix remaining particle spacing for multi-char particles
// "옥타곤 에서의" → "옥타곤에서의"
// ═══════════════════════════════════════════════════════════════

const MULTI_PARTICLES = ['에서의', '에서는', '에서도', '에서', '만큼', '이라는', '이라면', '이란', '이라', '만의', '에는', '에도'];
let multiPartFixes = 0;

venues.forEach(v => {
  const coreName = v.name_display.replace(v.region + ' ', '').replace(/\s+(클럽|나이트|라운지)\s*$/, '').trim();
  if (!coreName) return;

  function fixMultiPart(obj) {
    if (typeof obj === 'string') {
      let fixed = obj;
      for (const p of MULTI_PARTICLES) {
        const regex = new RegExp(escapeRegex(coreName) + '\\s+' + escapeRegex(p), 'g');
        const replacement = coreName + p;
        const newFixed = fixed.replace(regex, replacement);
        if (newFixed !== fixed) multiPartFixes++;
        fixed = newFixed;
      }
      return fixed;
    }
    if (Array.isArray(obj)) return obj.map(fixMultiPart);
    if (typeof obj === 'object' && obj !== null) {
      const r = {};
      for (const [k, val] of Object.entries(obj)) r[k] = fixMultiPart(val);
      return r;
    }
    return obj;
  }

  for (const [k, val] of Object.entries(v)) {
    if (['id', 'geo', 'images', 'imagePrompts', 'relatedVenueIds', 'name_display', 'name_input', 'name_seo'].includes(k)) continue;
    v[k] = fixMultiPart(val);
  }
});
console.log(`[6] Multi-char particle spacing fixed: ${multiPartFixes} instances`);

// Save
writeFileSync('data/venues.json', JSON.stringify(venues, null, 2), 'utf8');
console.log(`\n=== All deep fixes applied. venues.json saved. ===`);

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
