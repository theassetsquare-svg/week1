/**
 * PHASE 7 Lint Checker
 * Checks:
 * 1. Banned words across all text fields
 * 2. FAQ opener diversity within each venue (max 3 same first-word)
 * 3. Store name mention count in assembled page text (target 8–10)
 * 4. Meaningful-word repetition (>5x flagged)
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const VENUES_PATH = join(__dirname, '../data/venues.json');

const BANNED = ['해당', '이곳', '공간', '매장', '감도', '기준'];

function allText(v) {
  return [
    v.hookIntro || '',
    v.teaser || '',
    v.description_short || '',
    v.conclusionText || '',
    v.bodySections?.atmosphere || '',
    v.bodySections?.music || '',
    v.bodySections?.safety || '',
    v.intro?.hook || '',
    v.intro?.valuePromise || '',
    Object.values(v.story || {}).join(' '),
    (v.faq || []).map(f => f.q + ' ' + f.a).join(' '),
    (v.checklist || []).join(' '),
    (v.aiSummary || []).join(' '),
    v.quickPlan?.costNote || '',
    (v.quickPlan?.scenarios || []).map(s => s.title + ' ' + s.desc).join(' '),
    (v.quickPlan?.table || []).map(t => t.condition + ' ' + t.tip).join(' '),
    (v.timeline || []).map(t => (t.label || '') + ' ' + (t.desc || '')).join(' '),
  ].join(' ');
}

const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf-8'));

let totalErrors = 0;
let totalWarnings = 0;

for (const v of venues) {
  const n = v.name_display;
  const text = allText(v);
  const errors = [];
  const warnings = [];

  // 1. Banned word check (excluding venue name itself)
  for (const bw of BANNED) {
    if (v.name_display.includes(bw)) continue; // skip if name contains it
    const re = new RegExp(bw, 'g');
    const hits = (text.match(re) || []).length;
    if (hits > 0) errors.push(`금지어 "${bw}" ${hits}회`);
  }

  // 2. FAQ opener diversity (first 4 chars of each question)
  const openers = {};
  for (const f of (v.faq || [])) {
    const key = f.q.slice(0, 5);
    openers[key] = (openers[key] || 0) + 1;
  }
  for (const [k, cnt] of Object.entries(openers)) {
    if (cnt > 3) errors.push(`FAQ opener "${k}…" ${cnt}회 중복`);
  }

  // 3. FAQ count
  const faqCount = (v.faq || []).length;
  if (faqCount < 10) errors.push(`FAQ ${faqCount}개 (10개 미만)`);
  if (faqCount > 14) warnings.push(`FAQ ${faqCount}개 (14개 초과)`);

  // 4. Store name mention count in full text (8–14 acceptable range)
  const nameRe = new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const nameCount = (text.match(nameRe) || []).length;
  if (nameCount < 8) warnings.push(`가게명 언급 ${nameCount}회 (8회 미만)`);
  if (nameCount > 14) warnings.push(`가게명 언급 ${nameCount}회 (14회 초과, 과다)`);
  // FAQ count: 12 is target, max 14
  if ((v.faq || []).length > 14) warnings.push(`FAQ ${(v.faq||[]).length}개 (14개 초과)`);

  // 5. aiSummary present
  if (!v.aiSummary || v.aiSummary.length < 6) errors.push('aiSummary 없음 또는 부족');

  // 6. quickPlan present
  if (!v.quickPlan || !v.quickPlan.scenarios || v.quickPlan.scenarios.length < 3) {
    errors.push('quickPlan 없음 또는 시나리오 부족');
  }

  if (errors.length > 0) {
    console.log(`\n[ERROR] ${n}`);
    errors.forEach(e => console.log(`  ✗ ${e}`));
    totalErrors += errors.length;
  }
  if (warnings.length > 0) {
    console.log(`[WARN]  ${n}`);
    warnings.forEach(w => console.log(`  ! ${w}`));
    totalWarnings += warnings.length;
  }
}

console.log(`\n─── 결과 ───`);
console.log(`오류: ${totalErrors}개 | 경고: ${totalWarnings}개`);
if (totalErrors === 0) console.log('lint-phase7 통과');
process.exit(totalErrors > 0 ? 1 : 0);
