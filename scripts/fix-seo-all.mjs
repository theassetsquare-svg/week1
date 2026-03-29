#!/usr/bin/env node
/**
 * SEO 일괄 수정 스크립트
 * [1] seoDescription: 가게이름 포함, 150자 이내
 * [2] h1Title: 가게이름 포함, "가게이름 — 후킹제목" 형식
 * [8] description 첫 부분에 가게이름 포함
 * [19] hookTitle에 가게이름 단어 중복 금지
 * [20] title 끝에 놀쿨
 */
import fs from 'fs';

const dataFiles = [
  'src/data/clubs-data.ts',
  'src/data/nights-seoul.ts',
  'src/data/nights-gyeonggi.ts',
  'src/data/nights-other.ts',
  'src/data/lounges-data.ts',
  'src/data/others-data.ts',
];

let totalFixed = { seoDesc: 0, h1: 0, descName: 0 };

for (const file of dataFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Extract all venue blocks
  const venueRegex = /\{\s*\n?\s*id:\s*(\d+)[\s\S]*?(?=\n\s*\{|\n\];)/g;

  // Fix seoDescription: ensure it contains the venue name
  const nameDescPairs = [];
  const nameRegex = /name:'([^']+)'/g;
  const seoDescRegex = /seoDescription:'([^']+)'/g;
  const h1Regex = /h1Title:'([^']+)'/g;
  const descRegex = /(?<= )description:'([^']+)'/g;

  let nameMatch, names = [];
  while ((nameMatch = nameRegex.exec(content)) !== null) {
    names.push({ name: nameMatch[1], index: nameMatch.index });
  }

  // Fix seoDescription
  let seoDescMatch, seoDescs = [];
  const seoDescRegex2 = /seoDescription:'([^']+)'/g;
  while ((seoDescMatch = seoDescRegex2.exec(content)) !== null) {
    seoDescs.push({ desc: seoDescMatch[1], full: seoDescMatch[0], index: seoDescMatch.index });
  }

  for (let i = 0; i < names.length && i < seoDescs.length; i++) {
    const name = names[i].name;
    const desc = seoDescs[i].desc;

    // Check if seoDescription contains the full name
    if (!desc.includes(name)) {
      // Prepend venue name to description, keep under 150 chars
      let newDesc = name + ' — ' + desc;
      if (newDesc.length > 150) {
        // Trim the desc part to fit
        newDesc = name + ' — ' + desc.substring(0, 150 - name.length - 4) + '.';
      }
      if (newDesc.length > 150) {
        newDesc = newDesc.substring(0, 147) + '...';
      }
      content = content.replace(
        `seoDescription:'${desc}'`,
        `seoDescription:'${newDesc}'`
      );
      totalFixed.seoDesc++;
      modified = true;
    }
  }

  // Fix h1Title: ensure it contains the venue name
  const h1Regex2 = /h1Title:'([^']+)'/g;
  let h1Match, h1s = [];
  while ((h1Match = h1Regex2.exec(content)) !== null) {
    h1s.push({ h1: h1Match[1], full: h1Match[0], index: h1Match.index });
  }

  // Re-extract names since content may have changed
  const nameRegex3 = /name:'([^']+)'/g;
  let names2 = [];
  while ((nameMatch = nameRegex3.exec(content)) !== null) {
    names2.push({ name: nameMatch[1], index: nameMatch.index });
  }

  for (let i = 0; i < names2.length && i < h1s.length; i++) {
    const name = names2[i].name;
    const h1 = h1s[i].h1;

    if (!h1.includes(name)) {
      // h1Title doesn't contain venue name - fix it
      // If h1 has "—" format, prepend the name
      if (h1.includes('—')) {
        const hookPart = h1.split('—').slice(1).join('—').trim();
        const newH1 = `${name} — ${hookPart}`;
        content = content.replace(
          `h1Title:'${h1}'`,
          `h1Title:'${newH1}'`
        );
      } else {
        // Just prepend the name
        const newH1 = `${name} — ${h1}`;
        content = content.replace(
          `h1Title:'${h1}'`,
          `h1Title:'${newH1}'`
        );
      }
      totalFixed.h1++;
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ ${file} 수정 완료`);
  } else {
    console.log(`⏭️  ${file} 수정 불필요`);
  }
}

console.log('\n=== 수정 결과 ===');
console.log(`seoDescription 수정: ${totalFixed.seoDesc}건`);
console.log(`h1Title 수정: ${totalFixed.h1}건`);

// Verify
console.log('\n=== 검증 ===');
let remainingIssues = { seoDesc: 0, h1: 0 };
for (const file of dataFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const nameRegex = /name:'([^']+)'/g;
  const seoDescRegex = /seoDescription:'([^']+)'/g;
  const h1Regex = /h1Title:'([^']+)'/g;

  let names = [], seoDescs = [], h1s = [];
  let m;
  while ((m = nameRegex.exec(content)) !== null) names.push(m[1]);
  while ((m = seoDescRegex.exec(content)) !== null) seoDescs.push(m[1]);
  while ((m = h1Regex.exec(content)) !== null) h1s.push(m[1]);

  for (let i = 0; i < names.length; i++) {
    if (seoDescs[i] && !seoDescs[i].includes(names[i])) {
      remainingIssues.seoDesc++;
      console.log(`  ❌ seoDesc: ${names[i]}`);
    }
    if (h1s[i] && !h1s[i].includes(names[i])) {
      remainingIssues.h1++;
      console.log(`  ❌ h1: ${names[i]}`);
    }
  }
}
console.log(`\n남은 이슈 - seoDesc: ${remainingIssues.seoDesc}, h1: ${remainingIssues.h1}`);
