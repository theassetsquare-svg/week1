#!/usr/bin/env node
/**
 * qa-intro-sections.mjs
 * Validates 6-component intro sections across all built pages.
 * Checks: char count >= 300, value elements >= 8, 6 components present, no duplication.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DIST = join(process.cwd(), 'dist');

function getAllHtmlFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) results.push(...getAllHtmlFiles(full));
    else if (entry.endsWith('.html')) results.push(full);
  }
  return results;
}

const files = getAllHtmlFiles(DIST);
const READING_SPEED = 350; // chars/min for Korean

let totalPages = 0;
let withIntro = 0;
let pass60s = 0;
let failPages = [];
const introHashes = new Map();

// Pages that are exempt from full intro requirement (404 only)
const exemptPaths = ['/404.html'];

for (const file of files) {
  const relPath = file.replace(DIST, '');
  totalPages++;

  const html = readFileSync(file, 'utf-8');

  // Check if page has intro-section
  const hasIntro = html.includes('class="intro-section"');
  // 404 uses intro-scan-box directly without full intro-section
  const has404Nav = html.includes('class="intro-scan-box"') && relPath.includes('404');

  // 404 page is exempt from full intro requirement
  if (relPath.includes('404')) {
    withIntro++;
    pass60s++;
    continue;
  }

  if (!hasIntro && !has404Nav) {
    if (!exemptPaths.some(p => relPath.includes(p.replace('.html','')))) {
      // Not exempt, but no intro - check if it's a page that should have one
      // Only flag venue/category/guide/home/region/about/policy pages
      const shouldHave = relPath.includes('/club/') || relPath.includes('/night/') || relPath.includes('/lounge/')
        || relPath === '/index.html'
        || relPath.includes('/clubs/') || relPath.includes('/nights/') || relPath.includes('/lounges/')
        || relPath.includes('/region/') || relPath.includes('/guides/')
        || relPath.includes('/about/') || relPath.includes('/editorial-policy/');

      if (shouldHave) {
        failPages.push({ path: relPath, reason: 'intro-section 미존재' });
      }
    }
    continue;
  }

  withIntro++;

  // Extract intro section text
  const introMatch = html.match(/<section class="intro-section"[^>]*>([\s\S]*?)<\/section>/);
  if (!introMatch && !has404Nav) continue;

  const introHtml = introMatch ? introMatch[1] : '';
  // Strip HTML tags
  const introText = introHtml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const charCount = introText.replace(/\s/g, '').length;
  const koreanChars = introText.replace(/[^가-힣]/g, '').length;

  // Reading time
  const readingTimeSec = Math.ceil(charCount / READING_SPEED * 60);

  // Value element count
  const scanItems = (introHtml.match(/intro-scan-box__list[\s\S]*?<\/ul>/g) || [''])[0];
  const scanCount = (scanItems.match(/<li/g) || []).length;
  const checkItems = (introHtml.match(/intro-checklist__list[\s\S]*?<\/ul>/g) || [''])[0];
  const checkCount = (checkItems.match(/<li/g) || []).length;
  const riskCount = (introHtml.match(/intro-risk__item/g) || []).length;
  const teaserCount = (introHtml.match(/intro-teaser__item/g) || []).length;
  const valueCount = scanCount + checkCount + riskCount + teaserCount + 2; // +2 for hook and value promise

  // Component presence
  const components = {
    hook: introHtml.includes('intro-hook'),
    valuePromise: introHtml.includes('intro-value-promise'),
    scanBox: introHtml.includes('intro-scan-box'),
    checklist: introHtml.includes('intro-checklist'),
    risk: introHtml.includes('intro-risk'),
    teasers: introHtml.includes('intro-teasers'),
  };
  const missingComponents = Object.entries(components).filter(([,v]) => !v).map(([k]) => k);

  // Duplicate check
  const textHash = introText.slice(0, 200);
  if (introHashes.has(textHash)) {
    failPages.push({ path: relPath, reason: `인트로 중복: ${introHashes.get(textHash)}와 동일` });
  } else {
    introHashes.set(textHash, relPath);
  }

  // Validation
  const issues = [];
  if (charCount < 300) issues.push(`글자 수 부족: ${charCount}자 (최소 300)`);
  if (valueCount < 8) issues.push(`가치 요소 부족: ${valueCount}개 (최소 8)`);
  if (missingComponents.length > 0) issues.push(`누락 컴포넌트: ${missingComponents.join(', ')}`);

  if (issues.length > 0) {
    failPages.push({ path: relPath, reason: issues.join(' | ') });
  } else if (readingTimeSec >= 60) {
    pass60s++;
  } else {
    failPages.push({ path: relPath, reason: `읽기 시간 부족: ${readingTimeSec}초 (최소 60초)` });
  }
}

// Report
console.log('\n═══ P0 Intro Section QA Report ═══');
console.log(`전체 페이지: ${totalPages}개`);
console.log(`인트로 포함: ${withIntro}개`);
console.log(`60초 통과: ${pass60s}개`);
console.log(`실패: ${failPages.length}개`);

if (failPages.length > 0) {
  console.log('\n실패 목록:');
  for (const f of failPages) {
    console.log(`  - ${f.path}: ${f.reason}`);
  }
}

// Sample 5 pages with intro details
console.log('\n── 샘플 5개 페이지 인트로 가치 항목 요약 ──');
const sampleFiles = files
  .filter(f => {
    const html = readFileSync(f, 'utf-8');
    return html.includes('class="intro-section"');
  })
  .slice(0, 5);

for (const file of sampleFiles) {
  const relPath = file.replace(DIST, '');
  const html = readFileSync(file, 'utf-8');
  const introMatch = html.match(/<section class="intro-section"[^>]*>([\s\S]*?)<\/section>/);
  if (!introMatch) continue;

  const introHtml = introMatch[1];
  const introText = introHtml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const charCount = introText.replace(/\s/g, '').length;
  const readingTimeSec = Math.ceil(charCount / READING_SPEED * 60);

  // Extract hook first sentence
  const hookMatch = introHtml.match(/intro-hook[\s\S]*?<p>([\s\S]*?)<\/p>/);
  const hookText = hookMatch ? hookMatch[1].replace(/<[^>]+>/g, '').trim().slice(0, 60) : 'N/A';

  const scanCount = (introHtml.match(/intro-scan-box__list[\s\S]*?<li/g) || []).length;
  const checkCount = ((introHtml.match(/intro-checklist__list[\s\S]*?<\/ul>/g) || [''])[0].match(/<li/g) || []).length;
  const riskCount = (introHtml.match(/intro-risk__item/g) || []).length;
  const teaserCount = (introHtml.match(/intro-teaser__item/g) || []).length;

  console.log(`\n[${relPath}]`);
  console.log(`  Hook: ${hookText}...`);
  console.log(`  ScanBox: ${scanCount} | Checklist: ${checkCount} | Risk: ${riskCount} | Teasers: ${teaserCount}`);
  console.log(`  글자 수: ${charCount}자 | 예상 읽기: ${readingTimeSec}초`);
}

console.log('\n═══ QA 완료 ═══');

// Exit with error if failures
if (failPages.length > 0) process.exit(1);
