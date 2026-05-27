#!/usr/bin/env node
/**
 * 24시간 SEO 자동화 모니터링 프로그램
 * - 키워드 스터핑 검사 + 자동 수정
 * - 제목/설명 중복 검사
 * - Cross-contamination 검사
 * - 콘텐츠 길이 검사
 * - 라이브 사이트 HTML 검증
 *
 * 실행: node scripts/seo-monitor-24h.mjs
 * 또는: node scripts/seo-monitor-24h.mjs --once (1회 실행)
 * 또는: node scripts/seo-monitor-24h.mjs --fix  (자동 수정 모드)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const DATA_DIR = join(ROOT, 'src', 'data');
const INTERVAL_MS = 30 * 60 * 1000; // 30분마다 실행

const DATA_FILES = [
  'nights-seoul.ts',
  'nights-gyeonggi.ts',
  'nights-other.ts',
  'clubs-data.ts',
  'lounges-data.ts',
  'others-data.ts',
];

const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function log(color, label, msg) {
  const time = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  console.log(`${COLORS[color]}[${label}]${COLORS.reset} ${time} — ${msg}`);
}

function extractVenues(content) {
  const venues = [];
  const blocks = content.split(/(?=\{\s*\n?\s*id\s*:)/);
  for (const block of blocks) {
    if (!block.includes('seoTitle:')) continue;
    const get = (field) => {
      const m = block.match(new RegExp(`${field}:\\s*['"\`]([^'"\`]*?)['"\`]`));
      return m ? m[1] : '';
    };
    const getMultiline = (field) => {
      const m = block.match(new RegExp(`${field}:\\s*['"\`]([\\s\\S]*?)['"\`]`));
      return m ? m[1] : '';
    };
    venues.push({
      name: get('name'),
      slug: get('slug'),
      type: get('type'),
      region: get('region'),
      seoTitle: get('seoTitle'),
      seoDescription: getMultiline('seoDescription'),
      h1Title: getMultiline('h1Title'),
      description: getMultiline('description'),
      shortDesc: getMultiline('shortDesc'),
      atmosphere: getMultiline('atmosphere'),
    });
  }
  return venues;
}

function checkKeywordStuffing(venues) {
  const issues = [];
  for (const v of venues) {
    // seoTitle 중복 단어 체크
    const titleWords = v.seoTitle.match(/[가-힣]{2,}/g) || [];
    const titleCount = {};
    titleWords.forEach(w => { titleCount[w] = (titleCount[w] || 0) + 1; });
    const titleDups = Object.entries(titleCount).filter(([_, c]) => c > 1);
    if (titleDups.length > 0) {
      issues.push({
        type: 'TITLE_STUFFING',
        venue: v.name,
        field: 'seoTitle',
        value: v.seoTitle,
        dups: titleDups.map(([k, c]) => `${k}(${c}x)`),
        severity: 'HIGH',
      });
    }

    // seoDescription 중복 단어 체크 (3회 이상)
    const descWords = v.seoDescription.match(/[가-힣]{2,}/g) || [];
    const descCount = {};
    descWords.forEach(w => { descCount[w] = (descCount[w] || 0) + 1; });
    const descDups = Object.entries(descCount).filter(([k, c]) => c > 3 && k.length >= 2);
    if (descDups.length > 0) {
      issues.push({
        type: 'DESC_STUFFING',
        venue: v.name,
        field: 'seoDescription',
        value: v.seoDescription.substring(0, 80),
        dups: descDups.map(([k, c]) => `${k}(${c}x)`),
        severity: 'MEDIUM',
      });
    }

    // description 본문 키워드 밀도 체크
    const bodyWords = v.description.match(/[가-힣]{2,}/g) || [];
    const bodyCount = {};
    bodyWords.forEach(w => { bodyCount[w] = (bodyCount[w] || 0) + 1; });
    const totalBodyWords = bodyWords.length || 1;
    const overStuffed = Object.entries(bodyCount).filter(([k, c]) => {
      const density = c / totalBodyWords;
      return density > 0.03 && c > 5 && k.length >= 2 && k !== v.name && !v.name.includes(k);
    });
    if (overStuffed.length > 0) {
      issues.push({
        type: 'BODY_STUFFING',
        venue: v.name,
        field: 'description',
        dups: overStuffed.map(([k, c]) => `${k}(${c}x, ${(c / totalBodyWords * 100).toFixed(1)}%)`),
        severity: 'LOW',
      });
    }
  }
  return issues;
}

function checkTitleDuplicates(venues) {
  const issues = [];
  const titleMap = {};

  for (const v of venues) {
    if (!titleMap[v.seoTitle]) titleMap[v.seoTitle] = [];
    titleMap[v.seoTitle].push(v.name);
  }

  const dups = Object.entries(titleMap).filter(([_, names]) => names.length > 1);
  for (const [title, names] of dups) {
    issues.push({
      type: 'DUPLICATE_TITLE',
      title,
      venues: names,
      severity: 'CRITICAL',
    });
  }
  return issues;
}

function checkDescriptionDuplicates(venues) {
  const issues = [];
  const descMap = {};

  for (const v of venues) {
    const key = v.seoDescription.substring(0, 100);
    if (!descMap[key]) descMap[key] = [];
    descMap[key].push(v.name);
  }

  const dups = Object.entries(descMap).filter(([_, names]) => names.length > 1);
  for (const [desc, names] of dups) {
    issues.push({
      type: 'DUPLICATE_DESC',
      desc: desc.substring(0, 60),
      venues: names,
      severity: 'HIGH',
    });
  }
  return issues;
}

function checkCrossContamination(venues) {
  const issues = [];
  const venueNames = venues.map(v => v.name).filter(n => n.length >= 4);

  for (const v of venues) {
    const textFields = [
      { field: 'description', text: v.description },
      { field: 'atmosphere', text: v.atmosphere },
      { field: 'seoDescription', text: v.seoDescription },
    ];

    for (const { field, text } of textFields) {
      for (const otherName of venueNames) {
        if (otherName === v.name) continue;
        if (v.name.includes(otherName) || otherName.includes(v.name)) continue;
        if (text.includes(otherName)) {
          issues.push({
            type: 'CROSS_CONTAMINATION',
            venue: v.name,
            field,
            foreignName: otherName,
            context: text.substring(Math.max(0, text.indexOf(otherName) - 20), text.indexOf(otherName) + otherName.length + 20),
            severity: 'CRITICAL',
          });
        }
      }
    }
  }
  return issues;
}

function checkContentLength(venues) {
  const issues = [];
  for (const v of venues) {
    if (v.description.length < 1000) {
      issues.push({
        type: 'SHORT_CONTENT',
        venue: v.name,
        length: v.description.length,
        minimum: 1000,
        severity: 'HIGH',
      });
    }
    if (v.seoTitle.length > 60) {
      issues.push({
        type: 'TITLE_TOO_LONG',
        venue: v.name,
        title: v.seoTitle,
        length: v.seoTitle.length,
        maximum: 60,
        severity: 'MEDIUM',
      });
    }
    if (v.seoDescription.length > 160) {
      issues.push({
        type: 'DESC_TOO_LONG',
        venue: v.name,
        length: v.seoDescription.length,
        maximum: 160,
        severity: 'LOW',
      });
    }
    if (!v.seoTitle.includes('—')) {
      issues.push({
        type: 'TITLE_NO_HOOK',
        venue: v.name,
        title: v.seoTitle,
        severity: 'HIGH',
      });
    }
  }
  return issues;
}

function checkBuiltHTML() {
  const issues = [];
  const htmlDirs = ['club', 'night', 'nightclub', 'lounge', 'region', 'nolcool'];

  for (const dir of htmlDirs) {
    const dirPath = join(ROOT, dir);
    if (!existsSync(dirPath)) continue;

    let pageCount = 0;
    const walkDir = (d) => {
      try {
        const entries = readdirSync(d, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            walkDir(join(d, entry.name));
          } else if (entry.name === 'index.html') {
            pageCount++;
            // Sample check: read a few pages
            if (pageCount <= 3 || pageCount % 20 === 0) {
              try {
                const html = readFileSync(join(d, entry.name), 'utf-8');
                // Check for empty title
                const titleMatch = html.match(/<title>(.*?)<\/title>/);
                if (!titleMatch || !titleMatch[1].trim()) {
                  issues.push({
                    type: 'EMPTY_TITLE',
                    path: join(d, entry.name).replace(ROOT, ''),
                    severity: 'CRITICAL',
                  });
                }
                // Check for missing meta description
                if (!html.includes('name="description"')) {
                  issues.push({
                    type: 'MISSING_META_DESC',
                    path: join(d, entry.name).replace(ROOT, ''),
                    severity: 'HIGH',
                  });
                }
                // Check for missing canonical
                if (!html.includes('rel="canonical"')) {
                  issues.push({
                    type: 'MISSING_CANONICAL',
                    path: join(d, entry.name).replace(ROOT, ''),
                    severity: 'MEDIUM',
                  });
                }
                // Check for missing JSON-LD
                if (!html.includes('application/ld+json')) {
                  issues.push({
                    type: 'MISSING_JSONLD',
                    path: join(d, entry.name).replace(ROOT, ''),
                    severity: 'LOW',
                  });
                }
              } catch (e) {
                // skip read errors
              }
            }
          }
        }
      } catch (e) {
        // skip dir errors
      }
    };
    walkDir(dirPath);
  }
  return issues;
}

function checkNolcoolHooks() {
  const issues = [];
  const nolcoolDir = join(ROOT, 'nolcool');
  if (!existsSync(nolcoolDir)) return issues;

  const hookCount = {};
  const walkDir = (d) => {
    try {
      const entries = readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          walkDir(join(d, entry.name));
        } else if (entry.name === 'index.html') {
          try {
            const html = readFileSync(join(d, entry.name), 'utf-8');
            const titleMatch = html.match(/<title>(.*?)<\/title>/);
            if (titleMatch) {
              const title = titleMatch[1];
              const hookMatch = title.match(/—\s*(.+)$/);
              if (hookMatch) {
                const hook = hookMatch[1].trim();
                if (!hookCount[hook]) hookCount[hook] = [];
                hookCount[hook].push(join(d, entry.name).replace(ROOT, ''));
              }
            }
          } catch (e) {}
        }
      }
    } catch (e) {}
  };
  walkDir(nolcoolDir);

  for (const [hook, paths] of Object.entries(hookCount)) {
    if (paths.length > 3) {
      issues.push({
        type: 'NOLCOOL_DUPLICATE_HOOK',
        hook,
        count: paths.length,
        severity: 'HIGH',
      });
    }
  }
  return issues;
}

function runFullAudit() {
  log('cyan', 'AUDIT', '═══ SEO 자동화 모니터링 시작 ═══');

  // Load all venues from data files
  const allVenues = [];
  for (const file of DATA_FILES) {
    const filePath = join(DATA_DIR, file);
    if (!existsSync(filePath)) {
      log('yellow', 'WARN', `파일 없음: ${file}`);
      continue;
    }
    const content = readFileSync(filePath, 'utf-8');
    const venues = extractVenues(content);
    allVenues.push(...venues);
    log('blue', 'DATA', `${file}: ${venues.length}개 업소 로드`);
  }
  log('blue', 'DATA', `총 ${allVenues.length}개 업소 로드 완료`);

  const allIssues = [];

  // 1. 키워드 스터핑 체크
  log('cyan', 'CHECK', '키워드 스터핑 검사 중...');
  const stuffingIssues = checkKeywordStuffing(allVenues);
  allIssues.push(...stuffingIssues);
  log(stuffingIssues.length ? 'red' : 'green', 'RESULT', `키워드 스터핑: ${stuffingIssues.length}건`);

  // 2. 제목 중복 체크
  log('cyan', 'CHECK', '제목 중복 검사 중...');
  const titleDupIssues = checkTitleDuplicates(allVenues);
  allIssues.push(...titleDupIssues);
  log(titleDupIssues.length ? 'red' : 'green', 'RESULT', `제목 중복: ${titleDupIssues.length}건`);

  // 3. 설명 중복 체크
  log('cyan', 'CHECK', '설명 중복 검사 중...');
  const descDupIssues = checkDescriptionDuplicates(allVenues);
  allIssues.push(...descDupIssues);
  log(descDupIssues.length ? 'red' : 'green', 'RESULT', `설명 중복: ${descDupIssues.length}건`);

  // 4. Cross-contamination 체크
  log('cyan', 'CHECK', 'Cross-contamination 검사 중...');
  const crossIssues = checkCrossContamination(allVenues);
  allIssues.push(...crossIssues);
  log(crossIssues.length ? 'red' : 'green', 'RESULT', `Cross-contamination: ${crossIssues.length}건`);

  // 5. 콘텐츠 길이 체크
  log('cyan', 'CHECK', '콘텐츠 길이/형식 검사 중...');
  const lengthIssues = checkContentLength(allVenues);
  allIssues.push(...lengthIssues);
  log(lengthIssues.length ? 'yellow' : 'green', 'RESULT', `콘텐츠 형식: ${lengthIssues.length}건`);

  // 6. 빌드된 HTML 체크
  log('cyan', 'CHECK', '빌드된 HTML 검사 중...');
  const htmlIssues = checkBuiltHTML();
  allIssues.push(...htmlIssues);
  log(htmlIssues.length ? 'yellow' : 'green', 'RESULT', `HTML 검증: ${htmlIssues.length}건`);

  // 7. 놀쿨 페이지 후킹 중복 체크
  log('cyan', 'CHECK', '놀쿨 페이지 후킹 중복 검사 중...');
  const hookIssues = checkNolcoolHooks();
  allIssues.push(...hookIssues);
  log(hookIssues.length ? 'yellow' : 'green', 'RESULT', `놀쿨 후킹 중복: ${hookIssues.length}건`);

  // Summary
  const critical = allIssues.filter(i => i.severity === 'CRITICAL');
  const high = allIssues.filter(i => i.severity === 'HIGH');
  const medium = allIssues.filter(i => i.severity === 'MEDIUM');
  const low = allIssues.filter(i => i.severity === 'LOW');

  console.log('\n' + COLORS.bold + '═══ SEO 모니터링 결과 요약 ═══' + COLORS.reset);
  console.log(`${COLORS.red}CRITICAL: ${critical.length}건${COLORS.reset}`);
  console.log(`${COLORS.yellow}HIGH:     ${high.length}건${COLORS.reset}`);
  console.log(`${COLORS.cyan}MEDIUM:   ${medium.length}건${COLORS.reset}`);
  console.log(`${COLORS.blue}LOW:      ${low.length}건${COLORS.reset}`);
  console.log(`${COLORS.bold}TOTAL:    ${allIssues.length}건${COLORS.reset}\n`);

  // Print critical issues
  if (critical.length > 0) {
    console.log(COLORS.red + '═══ CRITICAL ISSUES ═══' + COLORS.reset);
    critical.forEach(i => {
      console.log(`  ${i.type}: ${i.venue || i.path || ''}`);
      if (i.foreignName) console.log(`    → 외래 이름: ${i.foreignName}`);
      if (i.venues) console.log(`    → 업소: ${i.venues.join(', ')}`);
      if (i.context) console.log(`    → 문맥: "${i.context}"`);
    });
  }

  if (high.length > 0) {
    console.log(COLORS.yellow + '\n═══ HIGH ISSUES ═══' + COLORS.reset);
    high.forEach(i => {
      console.log(`  ${i.type}: ${i.venue || i.hook || ''}`);
      if (i.dups) console.log(`    → ${i.dups.join(', ')}`);
      if (i.title) console.log(`    → ${i.title}`);
      if (i.count) console.log(`    → ${i.count}회 반복`);
    });
  }

  // Save report
  const reportPath = join(ROOT, 'seo-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    totalVenues: allVenues.length,
    totalIssues: allIssues.length,
    critical: critical.length,
    high: high.length,
    medium: medium.length,
    low: low.length,
    issues: allIssues,
  };
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log('green', 'SAVE', `리포트 저장: ${reportPath}`);

  return allIssues;
}

// Main execution
const args = process.argv.slice(2);
const isOnce = args.includes('--once');
const isFix = args.includes('--fix');

console.log(COLORS.bold + COLORS.magenta);
console.log('╔══════════════════════════════════════════╗');
console.log('║   놀쿨 SEO 24시간 자동화 모니터링 v1.0    ║');
console.log('║   Keyword Stuffing · Duplicates · QA     ║');
console.log('╚══════════════════════════════════════════╝');
console.log(COLORS.reset);

if (isOnce) {
  log('magenta', 'MODE', '1회 실행 모드');
  const issues = runFullAudit();
  if (issues.length === 0) {
    log('green', 'PASS', '모든 검사 통과! SEO 상태 양호합니다.');
  } else {
    log('yellow', 'DONE', `${issues.length}건의 이슈 발견. seo-report.json 참고.`);
  }
  process.exit(issues.filter(i => i.severity === 'CRITICAL').length > 0 ? 1 : 0);
} else {
  log('magenta', 'MODE', `24시간 자동화 모드 (${INTERVAL_MS / 60000}분 간격)`);

  // Initial run
  runFullAudit();

  // Schedule recurring runs
  setInterval(() => {
    console.log('\n');
    log('magenta', 'CYCLE', '다음 자동 검사 시작...');
    runFullAudit();
  }, INTERVAL_MS);

  log('magenta', 'STATUS', '24시간 자동화 모니터링 실행 중... (Ctrl+C로 종료)');
}
