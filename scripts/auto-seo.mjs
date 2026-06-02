#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// auto-seo.mjs — unified SEO + health monitor for 놀쿨 (week1-6m5.pages.dev)
// Runs the on-disk SEO audit, queries Google Search Console (keywords,
// rankings, cannibalization, sitemap status), and probes the LIVE site for
// availability. Aggregates everything into one status object, writes
// scripts/.secrets/monitor-state.json + a human-readable alert markdown, and
// exits non-zero when action is needed. Meant to be run by a scheduled agent
// (see scripts/AUTOMATION.md) which then emails/fixes based on the output.
// No external deps.
// ─────────────────────────────────────────────────────────────────────────
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadKey, getAccessToken, listSites, searchAnalytics, listSitemaps, dateRange,
} from './lib/gsc-client.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SITE = process.env.GSC_SITE || 'https://week1-6m5.pages.dev/';
const SECRETS = path.join(__dirname, '.secrets');

const issues = [];           // {severity:'error'|'warn', area, msg}
const add = (severity, area, msg) => issues.push({ severity, area, msg });

async function probe(url) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 15000);
    const res = await fetch(url, { signal: ctl.signal, redirect: 'manual' });
    clearTimeout(t);
    return res.status;
  } catch (e) { return `ERR:${e.name}`; }
}

async function runAudit() {
  try {
    execSync('node scripts/seo-audit.mjs', { cwd: ROOT, stdio: 'pipe' });
  } catch { /* audit prints; report file is what matters */ }
  const p = path.join(ROOT, 'seo-audit-report.json');
  if (!fs.existsSync(p)) { add('error', 'audit', 'audit report not produced'); return null; }
  const r = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (r.score < 90) add('error', 'audit', `SEO score ${r.score}/100 (<90)`);
  if (r.duplicateTitles > 0) add('error', 'audit', `${r.duplicateTitles} duplicate titles (cannibalization)`);
  if (r.duplicateDescriptions > 0) add('warn', 'audit', `${r.duplicateDescriptions} duplicate descriptions`);
  if (r.errorCount > 0) add('error', 'audit', `${r.errorCount} SEO errors across ${new Set(r.errors.map(e=>e.url)).size} pages`);
  return r;
}

async function runLiveHealth() {
  const targets = [
    SITE, `${SITE}robots.txt`, `${SITE}sitemap.xml`, `${SITE}llms.txt`,
    `${SITE}clubs/`, `${SITE}nights/`, `${SITE}hoppa/`, `${SITE}ranking/`,
    `${SITE}venue/cheongdam-h2o/`,
  ];
  const results = {};
  for (const u of targets) {
    const s = await probe(u);
    results[u] = s;
    if (s !== 200) add('error', 'live', `${u} → ${s}`);
  }
  return results;
}

async function runGsc() {
  const out = { ok: false };
  try {
    const key = loadKey();
    const tokenRO = await getAccessToken(key);
    const sites = await listSites(tokenRO);
    if (!sites.find((s) => s.siteUrl === SITE)) {
      add('error', 'gsc', `${SITE} not accessible by service account`);
      return out;
    }
    const range = dateRange(28);
    const [queries, qp] = await Promise.all([
      searchAnalytics(tokenRO, SITE, { ...range, dimensions: ['query'], rowLimit: 100 }),
      searchAnalytics(tokenRO, SITE, { ...range, dimensions: ['query', 'page'], rowLimit: 250 }),
    ]);
    // cannibalization in live GSC data: a query served by >1 URL
    const byQuery = {};
    for (const r of qp) (byQuery[r.keys[0]] ||= new Set()).add(r.keys[1]);
    const cannibal = Object.entries(byQuery).filter(([, s]) => s.size > 1)
      .map(([q, s]) => ({ query: q, urls: [...s] }));
    cannibal.forEach((c) => add('warn', 'gsc', `cannibalization: "${c.query}" served by ${c.urls.length} URLs`));
    const striking = queries.filter((r) => r.position >= 5 && r.position <= 20)
      .sort((a, b) => b.impressions - a.impressions).slice(0, 20);
    const totals = queries.reduce((a, r) => ({ clicks: a.clicks + r.clicks, impr: a.impr + r.impressions }), { clicks: 0, impr: 0 });

    const sitemaps = await listSitemaps(tokenRO, SITE);
    sitemaps.forEach((s) => {
      if (Number(s.errors) > 0) add('error', 'gsc', `sitemap ${s.path} has ${s.errors} errors`);
    });
    out.ok = true;
    out.totals = totals;
    out.queryCount = queries.length;
    out.topQueries = queries.sort((a, b) => b.impressions - a.impressions).slice(0, 15)
      .map((r) => ({ q: r.keys[0], pos: +r.position.toFixed(1), impr: r.impressions, clk: r.clicks }));
    out.strikingDistance = striking.map((r) => ({ q: r.keys[0], pos: +r.position.toFixed(1), impr: r.impressions }));
    out.cannibalization = cannibal;
    out.sitemaps = sitemaps.map((s) => ({ path: s.path, errors: s.errors, warnings: s.warnings, lastDownloaded: s.lastDownloaded }));
  } catch (e) {
    add('warn', 'gsc', `GSC query failed: ${e.message}`);
  }
  return out;
}

function writeAlert(state) {
  const errs = issues.filter((i) => i.severity === 'error');
  const warns = issues.filter((i) => i.severity === 'warn');
  const lines = [];
  lines.push(`# 놀쿨 SEO 모니터 — ${state.generatedAt}`);
  lines.push('');
  lines.push(`상태: ${errs.length ? '🔴 조치 필요' : warns.length ? '🟡 경고' : '🟢 정상'}`);
  lines.push(`- SEO 점수: ${state.audit?.score ?? '?'} /100`);
  lines.push(`- 라이브 홈: ${state.live?.[SITE] ?? '?'}`);
  lines.push(`- GSC: ${state.gsc?.ok ? `${state.gsc.queryCount} 쿼리 / ${state.gsc.totals?.impr ?? 0} 노출 / ${state.gsc.totals?.clicks ?? 0} 클릭` : '조회 실패'}`);
  lines.push('');
  if (errs.length) { lines.push('## 🔴 오류'); errs.forEach((i) => lines.push(`- [${i.area}] ${i.msg}`)); lines.push(''); }
  if (warns.length) { lines.push('## 🟡 경고'); warns.forEach((i) => lines.push(`- [${i.area}] ${i.msg}`)); lines.push(''); }
  if (state.gsc?.strikingDistance?.length) {
    lines.push('## 🎯 상위노출 기회 (5~20위 — 1페이지 진입 임박)');
    state.gsc.strikingDistance.forEach((r) => lines.push(`- "${r.q}"  현재 ${r.pos}위 · 노출 ${r.impr}`));
    lines.push('');
  }
  fs.writeFileSync(path.join(SECRETS, 'monitor-alert.md'), lines.join('\n'));
  return lines.join('\n');
}

async function main() {
  fs.mkdirSync(SECRETS, { recursive: true });
  const audit = await runAudit();
  const live = await runLiveHealth();
  const gsc = await runGsc();
  const state = {
    generatedAt: new Date().toISOString(), site: SITE,
    audit: audit && { score: audit.score, totalPages: audit.totalPages, duplicateTitles: audit.duplicateTitles, errorCount: audit.errorCount, warningCount: audit.warningCount },
    live, gsc,
    issues,
    needsAction: issues.some((i) => i.severity === 'error'),
  };
  fs.writeFileSync(path.join(SECRETS, 'monitor-state.json'), JSON.stringify(state, null, 2));
  const alert = writeAlert(state);
  console.log(alert);
  console.log(`\nState: scripts/.secrets/monitor-state.json`);
  process.exit(state.needsAction ? 1 : 0);
}
main().catch((e) => { console.error('FATAL', e); process.exit(2); });
