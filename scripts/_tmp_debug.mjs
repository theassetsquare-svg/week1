#!/usr/bin/env node
import { readFileSync } from 'fs';

const venues = JSON.parse(readFileSync('data/venues.json', 'utf8'));
const v = venues[0]; // 첫 번째 업소 분석

console.log('=== 업소:', v.name_display, '===\n');

// story.scene1 텍스트 확인
const text = v.story?.scene1 || '';
console.log('story.scene1:', text.substring(0, 200));
console.log();

// 한글 토큰 추출
const tokens = text.match(/[\uAC00-\uD7AF]{2,}/g) || [];
console.log('추출된 토큰:', tokens.join(', '));
console.log();

// "확인" 같은 단어가 실제로 어떻게 존재하는지 확인
const testWords = ['확인', '방문', '사전', '입장', '예약'];
testWords.forEach(w => {
  const regex1 = new RegExp(`(?<![\\uAC00-\\uD7AF])${w}(?![\\uAC00-\\uD7AF])`, 'g');
  const matches1 = [...text.matchAll(regex1)];

  // 단순 indexOf로도 확인
  let count2 = 0;
  let pos = 0;
  while ((pos = text.indexOf(w, pos)) !== -1) { count2++; pos += w.length; }

  console.log(`"${w}": regex매칭=${matches1.length}, indexOf=${count2}`);
  if (count2 > 0 && matches1.length === 0) {
    // 어디에 있는지 확인
    pos = 0;
    while ((pos = text.indexOf(w, pos)) !== -1) {
      const before = pos > 0 ? text[pos-1] : '^';
      const after = pos + w.length < text.length ? text[pos + w.length] : '$';
      console.log(`  위치 ${pos}: ...${text.substring(Math.max(0,pos-3), pos)}[${w}]${text.substring(pos+w.length, pos+w.length+3)}...`);
      pos += w.length;
    }
  }
});

// 전체 필드의 전체 텍스트에서 토큰 빈도
console.log('\n=== 전체 필드 토큰 빈도 (상위 20) ===');
function getAllText(v) {
  const texts = [];
  const sf = ['pageTitle','metaDescription','teaser','description_short','hookIntro','conclusionText','card_hook','card_value','seoTitle','seoDescription','h1Title'];
  sf.forEach(f => { if(v[f]) texts.push(v[f]); });
  if (v.story) Object.values(v.story).forEach(val => { if(typeof val==='string') texts.push(val); });
  if (v.bodySections) { function w(o){for(const val of Object.values(o)){if(typeof val==='string')texts.push(val);else if(typeof val==='object'&&val)w(val);}} w(v.bodySections); }
  if (v.faq) v.faq.forEach(f => { texts.push(f.q); texts.push(f.a); });
  if (v.timeline) v.timeline.forEach(t => { if(t.desc) texts.push(t.desc); });
  if (v.checklist) v.checklist.forEach(c => texts.push(c));
  if (v.sectionIntros) Object.values(v.sectionIntros).forEach(val => { if(typeof val==='string') texts.push(val); });
  if (v.intro) { if(v.intro.hook)texts.push(v.intro.hook); if(v.intro.valuePromise)texts.push(v.intro.valuePromise); }
  if (v.plannerRules) { function w(o){for(const val of Object.values(o)){if(typeof val==='string')texts.push(val);else if(typeof val==='object'&&val)w(val);}} w(v.plannerRules); }
  if (v.quickPlan) { if(v.quickPlan.costNote)texts.push(v.quickPlan.costNote); }
  return texts.join(' ');
}

const allText = getAllText(v);
const allTokens = allText.match(/[\uAC00-\uD7AF]{2,}/g) || [];
const freq = {};
allTokens.forEach(t => { freq[t] = (freq[t] || 0) + 1; });
const sorted = Object.entries(freq).sort((a,b) => b[1]-a[1]);
sorted.slice(0, 30).forEach(([w,c]) => console.log(`  "${w}": ${c}회`));

// 핵심: 2글자 이상 한글이 연속되면 하나의 토큰으로 추출됨
// "확인하세요" → 하나의 토큰 "확인하세요"
// "사전 확인" → "사전", "확인" (공백으로 분리)
console.log('\n=== 토큰 길이 분포 ===');
const lenDist = {};
allTokens.forEach(t => { const l = t.length; lenDist[l] = (lenDist[l] || 0) + 1; });
Object.entries(lenDist).sort((a,b) => a[0]-b[0]).forEach(([l,c]) => console.log(`  ${l}글자: ${c}개`));
