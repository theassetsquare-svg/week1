#!/usr/bin/env node
/**
 * Fix templated phrases across venues:
 * 1. Conclusion text ("잊기 어려운 하룻밤을 선사하는 곳이다. 정보는 변동될 수 있으니...")
 * 2. FAQ templated answers ("주말·공휴일 전날은...", "파티나 기념일로...", "그룹 방문이라면...")
 * 3. Timeline template text
 */
import { readFileSync, writeFileSync } from 'fs';

const VENUES_PATH = 'data/venues.json';
const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf8'));

let totalFixes = 0;

// ── 1. Diversify conclusion text ──
const conclusionVariants = [
  '정보는 수시로 바뀔 수 있으니, 출발 전 한 번 더 확인해 보세요.',
  '운영 정보가 달라질 수 있으니, 가기 전에 최신 현황을 체크하세요.',
  '현장 상황에 따라 달라질 수 있으니, 방문 전 재확인을 추천합니다.',
  '영업 조건이 바뀔 수 있으니, 당일 확인 후 출발하세요.',
  '시즌이나 요일에 따라 차이가 있을 수 있으니, 사전 확인을 권합니다.',
  '변동 사항이 있을 수 있으니, 최신 정보를 한 번 더 살펴보세요.',
  '세부 사항은 달라질 수 있으니, 직접 확인 후 방문하면 더 좋습니다.',
  '운영 방식이 변경될 수 있으니, 출발 전 공식 채널을 확인하세요.',
  '상황에 따라 변경될 수 있으니, 방문 직전에 한번 더 알아보세요.',
  '최신 영업 현황은 달라질 수 있으니, 가기 전에 재확인하는 게 좋습니다.',
];

const conclusionPattern = /잊기 어려운 하룻밤을 선사하는 곳이다\.\s*정보는 변동될 수 있으니 전 한 번 더 확인하는 것을 권장합니다\./g;
const conclusionPattern2 = /정보는 변동될 수 있으니 전 한 번 더 확인하는 것을 권장합니다\./g;

venues.forEach((v, i) => {
  const variant = conclusionVariants[i % conclusionVariants.length];
  function fixConclusion(obj) {
    if (typeof obj === 'string') {
      let fixed = obj;
      if (fixed.includes('정보는 변동될 수 있으니 전 한 번 더 확인하는 것을 권장합니다')) {
        fixed = fixed.replace(/정보는 변동될 수 있으니 전 한 번 더 확인하는 것을 권장합니다\.?/g, variant);
        if (fixed !== obj) totalFixes++;
      }
      return fixed;
    }
    if (Array.isArray(obj)) return obj.map(item => fixConclusion(item));
    if (typeof obj === 'object' && obj !== null) {
      const result = {};
      for (const [k, val] of Object.entries(obj)) {
        result[k] = fixConclusion(val);
      }
      return result;
    }
    return obj;
  }
  venues[i] = fixConclusion(v);
});
console.log(`[1] Conclusion diversified: ${totalFixes} fixes`);

// ── 2. Diversify FAQ templates ──
const faqReservationVariants = [
  '주말과 공휴일 전야에는 좌석이 일찍 마감되는 편입니다.',
  '금·토요일은 자리가 빨리 차니, 일찍 도착하는 것이 유리합니다.',
  '주말 저녁은 사전 예약 또는 이른 도착이 필수입니다.',
  '금요일·토요일은 대기가 길어질 수 있으니, 여유를 두고 방문하세요.',
  '주말 피크타임에는 좌석이 금방 채워지니, 미리 계획을 세우세요.',
  '인기 시간대에는 자리가 빠르게 마감되므로, 사전 확인을 추천합니다.',
  '금토 밤에는 혼잡할 수 있으니, 넉넉한 시간을 두고 출발하세요.',
  '주말 방문이라면 예약이나 이른 시간 도착이 더 편합니다.',
  '인기 요일에는 오픈 시간 근처에 도착하는 것이 가장 좋습니다.',
  '피크타임에는 대기가 발생할 수 있으니, 시간 여유를 갖고 가세요.',
];

const faqPartyVariants = [
  '케이크 반입, 샴페인 서비스 등은 사전 문의 시 가능한 경우가 많습니다.',
  '생일·기념일 이벤트는 미리 요청하면 준비해 주는 곳이 대부분입니다.',
  '특별한 날 방문이라면, 예약 시 이벤트 옵션을 문의해 보세요.',
  '기념일 서비스는 미리 상담하면 맞춤 안내를 받을 수 있습니다.',
  '파티 목적이라면, 예약 단계에서 원하는 서비스를 미리 요청하세요.',
  '축하 이벤트는 사전 예약 시 논의하면 더 원활하게 진행됩니다.',
  '생일이나 특별 이벤트는 미리 연락하면 현장에서 자연스럽게 준비됩니다.',
  '기념일 방문은 최소 2~3일 전에 예약하면서 요청 사항을 전달하세요.',
  '특별한 날이라면, 예약 시 케이크·장식 등을 미리 상의하세요.',
  '축하 서비스는 예약 시 문의하면, 당일 깔끔하게 준비됩니다.',
];

const faqBottleVariants = [
  '인원이 3명 이상이면 보틀이 경제적이고, 2인 이하라면 잔 주문이 합리적입니다.',
  '소그룹이면 보틀, 1~2인이면 잔 단위 주문이 비용 면에서 유리합니다.',
  '4인 이상이라면 보틀을, 소수 방문이라면 잔 단위 주문을 추천합니다.',
  '그룹이면 보틀이 가성비가 좋고, 혼자이거나 둘이면 잔 주문이 편합니다.',
  '일행이 많으면 보틀을 나눠 마시는 게 합리적이고, 소수면 잔 단위가 낫습니다.',
  '인원수에 따라 보틀과 잔 주문을 비교한 뒤 결정하는 것이 좋습니다.',
  '보틀은 여럿이 나눌 때 경제적이고, 1~2인이면 잔 단위가 부담이 적습니다.',
  '단체라면 보틀이 할인 효과가 있고, 소수 방문이면 잔 단위가 편합니다.',
  '보틀 vs 잔 단위는 인원에 따라 다르니, 도착 후 비교해 보세요.',
  '그룹 방문이면 보틀을, 1~2명이면 잔으로 부담 없이 즐기세요.',
];

let faqFixes = 0;

venues.forEach((v, i) => {
  if (!v.faq) return;
  v.faq.forEach(f => {
    // Fix reservation template
    if (f.a && f.a.includes('주말·공휴일 전날은 자리가 빨리 차는 편입니다')) {
      f.a = f.a.replace(/주말·공휴일 전날은 자리가 빨리 차는 편입니다\.?/g, faqReservationVariants[i % faqReservationVariants.length]);
      faqFixes++;
    }
    // Fix party template
    if (f.a && f.a.includes('케이크·샴페인 서비스 등')) {
      const variant = faqPartyVariants[i % faqPartyVariants.length];
      f.a = f.a.replace(/케이크·샴페인 서비스 등[^.]*\./g, variant);
      faqFixes++;
    }
    // Fix bottle template
    if (f.a && f.a.includes('그룹 방문이라면 보틀이 경제적입니다') && f.a.includes('잔 단위 주문을 권장합니다')) {
      f.a = f.a.replace(/그룹 방문이라면 보틀이 경제적입니다\.\s*혼자이거나 2인이라면 잔 단위 주문을 권장합니다\.?/g, faqBottleVariants[i % faqBottleVariants.length]);
      faqFixes++;
    }
  });
});
console.log(`[2] FAQ templates diversified: ${faqFixes} fixes`);

// ── 3. Diversify timeline "너무 이르면 한산, 너무 늦으면 대기" ──
const timelineVariants = [
  '일찍 가면 조용하고, 늦으면 줄을 서야 할 수 있습니다.',
  '오픈 직후는 한적하고, 피크타임은 혼잡합니다.',
  '이른 시간은 여유롭고, 늦은 시간은 북적입니다.',
  '초반은 한산한 편이고, 피크에 가까워지면 자리가 빨리 찹니다.',
  '일찍 도착하면 분위기를 먼저 느낄 수 있고, 늦으면 줄이 길어집니다.',
  '오픈 시간대는 여유롭고, 자정 전후가 가장 활기찹니다.',
  '시작 시간은 조용하지만, 피크가 되면 에너지가 급상승합니다.',
  '초반에는 편하게 자리를 잡을 수 있고, 늦을수록 대기가 생깁니다.',
  '일찍 가면 좋은 자리를 고를 수 있고, 피크에는 자리가 금방 찹니다.',
  '오픈 초기에는 느긋하지만, 밤이 깊어지면 분위기가 뜨겁게 달아오릅니다.',
];

let tlFixes = 0;
venues.forEach((v, i) => {
  const variant = timelineVariants[i % timelineVariants.length];
  function fixTimeline(obj) {
    if (typeof obj === 'string') {
      if (obj.includes('너무 이르면 한산, 너무 늦으면 대기')) {
        const fixed = obj.replace(/너무 이르면 한산, 너무 늦으면 대기[^.]*\.?/g, variant);
        if (fixed !== obj) { tlFixes++; return fixed; }
      }
      return obj;
    }
    if (Array.isArray(obj)) return obj.map(item => fixTimeline(item));
    if (typeof obj === 'object' && obj !== null) {
      const result = {};
      for (const [k, val] of Object.entries(obj)) result[k] = fixTimeline(val);
      return result;
    }
    return obj;
  }
  venues[i] = fixTimeline(v);
});
console.log(`[3] Timeline templates diversified: ${tlFixes} fixes`);

// ── 4. Diversify "안주류를 판매하는 경우가 많습니다" ──
const snackVariants = [
  '간단한 안주류도 함께 주문할 수 있는 곳이 많습니다.',
  '안주 메뉴가 별도로 마련된 곳도 있으니 참고하세요.',
  '음료와 함께 가벼운 안주를 즐길 수 있는 경우가 대부분입니다.',
  '안주류 메뉴는 업소마다 다르니, 현장에서 확인하세요.',
  '가벼운 안주를 함께 제공하는 곳이 적지 않습니다.',
  '사이드 메뉴로 간단한 안주를 판매하는 곳도 많습니다.',
  '안주 메뉴 유무는 업소마다 상이하니, 미리 확인하면 좋습니다.',
  '음식 메뉴가 별도로 있는 곳도 있으니, 궁금하면 문의하세요.',
  '음료 외에 안주류를 갖춘 곳도 있으니, 메뉴판을 확인해 보세요.',
  '가벼운 안주와 함께 즐길 수 있는 메뉴가 마련된 곳도 있습니다.',
];

let snackFixes = 0;
venues.forEach((v, i) => {
  const variant = snackVariants[i % snackVariants.length];
  function fixSnack(obj) {
    if (typeof obj === 'string') {
      if (obj.includes('안주류를 판매하는 경우가 많습니다')) {
        const fixed = obj.replace(/안주류를 판매하는 경우가 많습니다\.?/g, variant);
        if (fixed !== obj) { snackFixes++; return fixed; }
      }
      return obj;
    }
    if (Array.isArray(obj)) return obj.map(item => fixSnack(item));
    if (typeof obj === 'object' && obj !== null) {
      const result = {};
      for (const [k, val] of Object.entries(obj)) result[k] = fixSnack(val);
      return result;
    }
    return obj;
  }
  venues[i] = fixSnack(v);
});
console.log(`[4] Snack menu templates diversified: ${snackFixes} fixes`);

// ── 5. Diversify "잊기 어려운 하룻밤을 선사하는 곳이다" ──
const endingVariants = [
  '특별한 밤을 만들어 주는 곳이다.',
  '한 번 가면 다시 찾게 되는 곳이다.',
  '기대 이상의 밤을 경험할 수 있는 곳이다.',
  '밤의 감각을 제대로 느낄 수 있는 곳이다.',
  '분위기와 서비스 모두 기억에 남는 곳이다.',
  '첫 방문에도 편하게 즐길 수 있는 곳이다.',
  '오래 기억에 남을 밤을 보낼 수 있는 곳이다.',
  '기분 좋은 밤을 보장하는 곳이다.',
  '다시 오고 싶게 만드는 묘한 매력이 있는 곳이다.',
  '한 번쯤 가봐야 할 곳이다.',
];

let endingFixes = 0;
venues.forEach((v, i) => {
  const variant = endingVariants[i % endingVariants.length];
  function fixEnding(obj) {
    if (typeof obj === 'string') {
      if (obj.includes('잊기 어려운 하룻밤을 선사하는 곳이다')) {
        const fixed = obj.replace(/잊기 어려운 하룻밤을 선사하는 곳이다\.?/g, variant);
        if (fixed !== obj) { endingFixes++; return fixed; }
      }
      return obj;
    }
    if (Array.isArray(obj)) return obj.map(item => fixEnding(item));
    if (typeof obj === 'object' && obj !== null) {
      const result = {};
      for (const [k, val] of Object.entries(obj)) result[k] = fixEnding(val);
      return result;
    }
    return obj;
  }
  venues[i] = fixEnding(v);
});
console.log(`[5] Ending phrases diversified: ${endingFixes} fixes`);

// ── 6. Diversify "바 카운터에 자리 잡고 음악부터 느끼기" ──
const barVariants = [
  '바 자리에 앉아 분위기를 먼저 읽기',
  '바 카운터에서 첫 잔을 받으며 현장 흐름 파악하기',
  '바에 앉아 음악과 현장 무드를 천천히 느끼기',
  '카운터에서 한 잔 시키고 주변 분위기를 살피기',
  '바 자리에서 음료 한 잔과 함께 무드에 적응하기',
  '바에서 첫 음료를 받으며 현장 톤 확인하기',
  '카운터석에서 여유롭게 음악을 즐기며 적응하기',
  '바 카운터에서 분위기를 읽고 자리를 정하기',
  '바에서 음악에 몸을 맡기며 시작하기',
  '카운터에 앉아 현장 에너지를 천천히 흡수하기',
];

let barFixes = 0;
venues.forEach((v, i) => {
  const variant = barVariants[i % barVariants.length];
  function fixBar(obj) {
    if (typeof obj === 'string') {
      if (obj.includes('바 카운터에 자리 잡고 음악부터 느끼기')) {
        const fixed = obj.replace(/바 카운터에 자리 잡고 음악부터 느끼기/g, variant);
        if (fixed !== obj) { barFixes++; return fixed; }
      }
      return obj;
    }
    if (Array.isArray(obj)) return obj.map(item => fixBar(item));
    if (typeof obj === 'object' && obj !== null) {
      const result = {};
      for (const [k, val] of Object.entries(obj)) result[k] = fixBar(val);
      return result;
    }
    return obj;
  }
  venues[i] = fixBar(v);
});
console.log(`[6] Bar counter phrases diversified: ${barFixes} fixes`);

// ── Save ──
writeFileSync(VENUES_PATH, JSON.stringify(venues, null, 2), 'utf8');
console.log(`\n=== TOTAL: ${totalFixes + faqFixes + tlFixes + snackFixes + endingFixes + barFixes} phrase fixes applied ===`);
console.log('venues.json saved');
