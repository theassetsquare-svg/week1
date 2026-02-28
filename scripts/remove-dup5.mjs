#!/usr/bin/env node
/**
 * remove-dup5.mjs
 * 가계이름 제외하고 중복단어 5개 이상인 단어를 텍스트 필드에서 삭제
 * (MODE 1 기준: club/night/lounge 나이트라이프 디렉토리)
 */
import { readFileSync, writeFileSync } from 'fs';

const VENUES_PATH = 'data/venues.json';
const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf8'));

// 텍스트 필드 목록
const TEXT_FIELDS = [
  'teaser', 'card_hook', 'card_value', 'description_short',
  'intro', 'hookIntro', 'conclusionText', 'storyFrame', 'story'
];

// 모든 업소명 수집 (가계이름 보호용)
const venueNameTokens = new Set();
venues.forEach(v => {
  const names = [v.name_display, v.name_input, v.name_seo].filter(Boolean);
  names.forEach(n => {
    const parts = n.match(/[\uAC00-\uD7AF]{2,}/g) || [];
    parts.forEach(p => venueNameTokens.add(p));
    // 영문 이름도 보호
    const engParts = n.match(/[a-zA-Z]{2,}/g) || [];
    engParts.forEach(p => venueNameTokens.add(p.toLowerCase()));
  });
});

// Step 1: 전체 텍스트에서 단어 빈도 계산
const wordCount = {};

venues.forEach(v => {
  TEXT_FIELDS.forEach(field => {
    const text = v[field];
    if (!text || typeof text !== 'string') return;
    const words = text.match(/[\uAC00-\uD7AF]{2,}/g) || [];
    words.forEach(w => {
      if (!venueNameTokens.has(w)) {
        wordCount[w] = (wordCount[w] || 0) + 1;
      }
    });
  });
});

// Step 2: 5회 이상 등장 단어 목록
const dupWords = new Set(
  Object.entries(wordCount)
    .filter(([w, c]) => c >= 5)
    .map(([w]) => w)
);

console.log(`\n중복단어 5회 이상 (가계이름 제외): ${dupWords.size}개`);
const sorted = Object.entries(wordCount)
  .filter(([w, c]) => c >= 5)
  .sort((a, b) => b[1] - a[1]);
sorted.forEach(([w, c]) => console.log(`  "${w}": ${c}회`));

// Step 3: 단어 제거 (단어가 다른 단어와 붙어있으면 제거 시 정리)
function removeWord(text, word) {
  // 단어 단위로 제거 (앞뒤가 한글이 아닌 경우)
  // 문장에서 자연스럽게 제거
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // 단어 앞뒤 공백/구두점 처리
  let result = text.replace(new RegExp(`(?<=[\\s,·.!?]|^)${escaped}(?=[\\s,·.!?]|$)`, 'g'), '');
  // 연속 공백 정리
  result = result.replace(/\s{2,}/g, ' ').trim();
  return result;
}

let totalFixed = 0;

venues.forEach(v => {
  TEXT_FIELDS.forEach(field => {
    const text = v[field];
    if (!text || typeof text !== 'string') return;

    let newText = text;
    dupWords.forEach(word => {
      if (newText.includes(word)) {
        newText = removeWord(newText, word);
      }
    });

    if (newText !== text) {
      v[field] = newText;
      totalFixed++;
    }
  });
});

console.log(`\n수정된 필드: ${totalFixed}개`);

writeFileSync(VENUES_PATH, JSON.stringify(venues, null, 2), 'utf8');
console.log('venues.json 저장 완료\n');
