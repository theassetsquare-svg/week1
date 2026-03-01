#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const VENUES_PATH = 'data/venues.json';
const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf8'));
let totalFixes = 0;

// ── 1. Fix "정보는 변동될 수 있으니 전 한 번 더 확인하는 것을 권장" ──
const disclaimerVariants = [
  '세부 사항은 변경될 수 있으니, 출발 전 최신 정보를 확인하세요.',
  '운영 조건이 바뀔 수 있으니, 방문 전 공식 채널에서 확인하세요.',
  '상황에 따라 달라질 수 있으니, 사전 확인 후 방문하세요.',
  '현장 여건에 따라 변경될 수 있으니, 가기 전 한번 더 체크하세요.',
  '영업 정보가 수시로 바뀔 수 있으니, 직접 확인 후 출발하세요.',
  '최신 현황은 달라질 수 있으니, 방문 직전에 재확인하세요.',
  '변동 가능성이 있으니, 출발 전 업소에 직접 확인하는 게 좋습니다.',
  '운영 정보는 변경될 수 있으니, 최신 상태를 꼭 확인하세요.',
  '세부 조건이 바뀔 수 있으니, 방문 전 한번 더 알아보세요.',
  '현장 상황은 달라질 수 있으니, 최신 정보를 확인하고 출발하세요.',
];
let f1 = 0;
venues.forEach((v, i) => {
  const variant = disclaimerVariants[i % disclaimerVariants.length];
  function fix(obj) {
    if (typeof obj === 'string') {
      if (obj.includes('변동될 수 있으니 전 한 번 더 확인하는 것을 권장')) {
        const fixed = obj.replace(/정보는 변동될 수 있으니 전 한 번 더 확인하는 것을 권장[^.]*\./g, variant);
        if (fixed !== obj) { f1++; return fixed; }
      }
      return obj;
    }
    if (Array.isArray(obj)) return obj.map(item => fix(item));
    if (typeof obj === 'object' && obj !== null) {
      const r = {};
      for (const [k, val] of Object.entries(obj)) r[k] = fix(val);
      return r;
    }
    return obj;
  }
  venues[i] = fix(v);
});
console.log(`[1] Disclaimer diversified: ${f1} fixes`);

// ── 2. Fix "파티나 기념일로 방문하려면 문의가 필요할까요?" ──
const partyQVariants = [
  '기념일이나 파티 방문 시 사전 준비가 필요한가요?',
  '생일이나 기념일에 방문할 때 미리 문의해야 하나요?',
  '특별한 날 방문이라면 예약 시 무엇을 요청할 수 있나요?',
  '파티 목적으로 방문 시 이벤트 서비스가 있나요?',
  '생일 파티나 축하 이벤트를 진행할 수 있나요?',
  '기념일 방문 시 특별한 서비스를 받을 수 있나요?',
  '단체 파티나 기념일에 맞는 서비스가 있나요?',
  '생일·기념일 방문이라면 어떤 준비가 가능한가요?',
  '특별 이벤트를 요청하려면 어떻게 해야 하나요?',
  '축하 행사를 위한 서비스 옵션이 있나요?',
];
let f2 = 0;
venues.forEach((v, i) => {
  if (!v.faq) return;
  v.faq.forEach(f => {
    if (f.q && f.q.includes('파티나 기념일로 방문하려면 문의가 필요할까요')) {
      f.q = partyQVariants[i % partyQVariants.length];
      f2++;
    }
  });
});
console.log(`[2] FAQ party questions diversified: ${f2} fixes`);

// ── 3. Fix "대화에 적합합니다. 분위기에서 편안하게 이야기하세요" ──
const chatVariants = [
  '대화하기 좋은 자리입니다. 편안하게 이야기를 나누세요.',
  '대화를 나누기에 적당한 위치입니다. 자연스럽게 대화를 시작하세요.',
  '대화가 편한 좌석입니다. 조용한 분위기를 활용하세요.',
  '이야기 나누기에 좋은 자리입니다. 여유롭게 대화를 즐기세요.',
  '대화에 좋은 자리입니다. 눈을 맞추며 편하게 이야기하세요.',
  '대화가 잘 되는 위치입니다. 음악 소리에 방해받지 않습니다.',
  '이야기에 집중할 수 있는 자리입니다. 분위기가 뒷받침해 줍니다.',
  '대화용으로 좋은 자리입니다. 서로의 이야기에 집중할 수 있습니다.',
  '조용히 대화하기 좋은 위치입니다. 무드를 즐기며 이야기하세요.',
  '대화가 잘 되는 좌석입니다. 적절한 음악이 분위기를 만들어 줍니다.',
];
let f3 = 0;
venues.forEach((v, i) => {
  const variant = chatVariants[i % chatVariants.length];
  function fix(obj) {
    if (typeof obj === 'string') {
      if (obj.includes('대화에 적합합니다.') && obj.includes('편안하게 이야기하세요')) {
        const fixed = obj.replace(/대화에 적합합니다\.\s*[^.]*분위기에서 편안하게 이야기하세요\./g, variant);
        if (fixed !== obj) { f3++; return fixed; }
      }
      return obj;
    }
    if (Array.isArray(obj)) return obj.map(item => fix(item));
    if (typeof obj === 'object' && obj !== null) {
      const r = {};
      for (const [k, val] of Object.entries(obj)) r[k] = fix(val);
      return r;
    }
    return obj;
  }
  venues[i] = fix(v);
});
console.log(`[3] Chat location phrases diversified: ${f3} fixes`);

// ── 4. Fix "메인 플로어 중앙이 최적의 위치입니다" ──
const floorVariants = [
  '메인 플로어 가운데가 에너지를 가장 잘 느낄 수 있는 자리입니다.',
  '플로어 중앙 근처에서 DJ 사운드를 온몸으로 느껴보세요.',
  '중앙 플로어에 서면 음악의 진동을 가장 가까이 체험할 수 있습니다.',
  '플로어 한가운데가 현장 에너지를 극대화할 수 있는 위치입니다.',
  '메인 플로어 중심부에서 비트를 온전히 즐기세요.',
  '플로어 중앙이 사운드와 조명을 동시에 즐기기에 가장 좋습니다.',
  '가장 좋은 자리는 플로어 중앙 — 모든 에너지가 집중되는 곳입니다.',
  '중앙 플로어에서 음악에 빠져보세요. 에너지가 확 다릅니다.',
  '메인 플로어 근처에 서면 현장 무드를 완전히 흡수할 수 있습니다.',
  '플로어 중앙에서 DJ와 가장 가까운 거리로 음악을 체험하세요.',
];
let f4 = 0;
venues.forEach((v, i) => {
  const variant = floorVariants[i % floorVariants.length];
  function fix(obj) {
    if (typeof obj === 'string') {
      if (obj.includes('메인 플로어 중앙이 최적의 위치입니다')) {
        const fixed = obj.replace(/메인 플로어 중앙이 최적의 위치입니다\./g, variant);
        if (fixed !== obj) { f4++; return fixed; }
      }
      return obj;
    }
    if (Array.isArray(obj)) return obj.map(item => fix(item));
    if (typeof obj === 'object' && obj !== null) {
      const r = {};
      for (const [k, val] of Object.entries(obj)) r[k] = fix(val);
      return r;
    }
    return obj;
  }
  venues[i] = fix(v);
});
console.log(`[4] Floor position phrases diversified: ${f4} fixes`);

// ── 5. Fix "메뉴 구성은 방문 전 직접 확인하시기 바랍니다" ──
const menuVariants = [
  '메뉴는 시기마다 다를 수 있으니, 현장에서 직접 확인하세요.',
  '메뉴 구성은 변경될 수 있으니, 방문 시 확인해 보세요.',
  '안주 및 음료 메뉴는 현장에서 확인하는 것이 정확합니다.',
  '메뉴는 업소 사정에 따라 달라질 수 있으니, 참고해 주세요.',
  '음식 메뉴는 수시로 바뀔 수 있으니, 현장 메뉴판을 확인하세요.',
  '메뉴 구성은 방문일에 따라 다를 수 있으니, 직접 확인이 좋습니다.',
  '안주 종류는 시기마다 상이할 수 있으니, 현장에서 선택하세요.',
  '메뉴는 매번 같지 않을 수 있으니, 가서 확인하는 게 확실합니다.',
  '음식 메뉴는 변동 가능하니, 당일 확인이 가장 정확합니다.',
  '메뉴 선택은 현장에서 하는 것이 가장 좋습니다.',
];
let f5 = 0;
venues.forEach((v, i) => {
  const variant = menuVariants[i % menuVariants.length];
  function fix(obj) {
    if (typeof obj === 'string') {
      if (obj.includes('메뉴 구성은 방문 전 직접 확인하시기 바랍니다')) {
        const fixed = obj.replace(/메뉴 구성은 방문 전 직접 확인하시기 바랍니다\.?/g, variant);
        if (fixed !== obj) { f5++; return fixed; }
      }
      return obj;
    }
    if (Array.isArray(obj)) return obj.map(item => fix(item));
    if (typeof obj === 'object' && obj !== null) {
      const r = {};
      for (const [k, val] of Object.entries(obj)) r[k] = fix(val);
      return r;
    }
    return obj;
  }
  venues[i] = fix(v);
});
console.log(`[5] Menu phrases diversified: ${f5} fixes`);

// ── 6. Fix "테이블 이용 시 최소 주문 금액이 적용될" ──
const tableVariants = [
  '테이블석은 최소 주문 금액이 있을 수 있으니, 미리 확인하세요.',
  '테이블 이용 시 미니멈 차지가 적용되는 경우가 있습니다.',
  '테이블석은 최소 주문 조건이 있을 수 있으니, 사전에 알아보세요.',
  '테이블 좌석은 미니멈 오더가 있는 경우가 많으니, 확인 후 이용하세요.',
  '테이블 이용에는 최소 주문 조건이 붙을 수 있습니다.',
  '테이블을 원하면 미니멈 차지를 미리 확인하세요.',
  '테이블석 최소 주문 금액은 업소마다 다르니, 예약 시 문의하세요.',
  '테이블 이용 시 별도 최소 금액이 있는 곳도 있습니다.',
  '테이블석은 미니멈 오더가 있을 수 있으니, 사전 확인이 좋습니다.',
  '테이블 좌석 이용 조건은 미리 확인하는 것이 좋습니다.',
];
let f6 = 0;
venues.forEach((v, i) => {
  const variant = tableVariants[i % tableVariants.length];
  function fix(obj) {
    if (typeof obj === 'string') {
      if (obj.includes('테이블 이용 시 최소 주문 금액이 적용될')) {
        const fixed = obj.replace(/테이블 이용 시 최소 주문 금액이 적용될[^.]*\./g, variant);
        if (fixed !== obj) { f6++; return fixed; }
      }
      return obj;
    }
    if (Array.isArray(obj)) return obj.map(item => fix(item));
    if (typeof obj === 'object' && obj !== null) {
      const r = {};
      for (const [k, val] of Object.entries(obj)) r[k] = fix(val);
      return r;
    }
    return obj;
  }
  venues[i] = fix(v);
});
console.log(`[6] Table charge phrases diversified: ${f6} fixes`);

// Save
writeFileSync(VENUES_PATH, JSON.stringify(venues, null, 2), 'utf8');
console.log(`\n=== TOTAL: ${f1+f2+f3+f4+f5+f6} fixes applied ===`);
console.log('venues.json saved');
