#!/usr/bin/env node
// GSC performance report: top queries, pages, positions, and low-CTR / striking-distance
// opportunities. Writes scripts/.secrets/gsc-report.json and prints a summary.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadKey, getAccessToken, listSites, searchAnalytics, dateRange } from './lib/gsc-client.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = process.env.GSC_SITE || 'https://week1-6m5.pages.dev/';
const DAYS = Number(process.env.GSC_DAYS || 28);

async function main() {
  const key = loadKey();
  const token = await getAccessToken(key);
  const sites = await listSites(token);
  const owned = sites.find((s) => s.siteUrl === SITE);
  if (!owned) {
    console.error(`Property ${SITE} not accessible by ${key.client_email}. Add it as a user in GSC.`);
    process.exit(2);
  }
  const range = dateRange(DAYS);
  console.log(`# GSC report for ${SITE}  (${range.startDate} → ${range.endDate})\n`);

  const [queries, pages, qp] = await Promise.all([
    searchAnalytics(token, SITE, { ...range, dimensions: ['query'], rowLimit: 100 }),
    searchAnalytics(token, SITE, { ...range, dimensions: ['page'], rowLimit: 100 }),
    searchAnalytics(token, SITE, { ...range, dimensions: ['query', 'page'], rowLimit: 250 }),
  ]);

  const totals = queries.reduce((a, r) => ({
    clicks: a.clicks + r.clicks, impressions: a.impressions + r.impressions,
  }), { clicks: 0, impressions: 0 });

  // Striking distance: positions 5-20 — push these to page 1.
  const striking = queries
    .filter((r) => r.position >= 5 && r.position <= 20)
    .sort((a, b) => b.impressions - a.impressions).slice(0, 30);

  // Cannibalization: one query ranking with multiple URLs.
  const byQuery = {};
  for (const r of qp) {
    const q = r.keys[0];
    (byQuery[q] ||= []).push({ page: r.keys[1], pos: r.position, clicks: r.clicks, impr: r.impressions });
  }
  const cannibal = Object.entries(byQuery)
    .filter(([, urls]) => urls.length > 1)
    .map(([q, urls]) => ({ query: q, urls: urls.sort((a, b) => a.pos - b.pos) }))
    .sort((a, b) => b.urls.length - a.urls.length).slice(0, 30);

  const report = {
    site: SITE, range, generatedAt: new Date().toISOString(),
    totals,
    indexedQueries: queries.length,
    topQueries: queries.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 25),
    topPages: pages.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 25),
    strikingDistance: striking,
    cannibalization: cannibal,
  };
  const out = path.join(__dirname, '.secrets', 'gsc-report.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));

  const fmt = (r, kcol = 'keys') => `${(r[kcol] ? r[kcol].join(' | ') : '')}  pos=${r.position.toFixed(1)} impr=${r.impressions} clk=${r.clicks}`;
  console.log(`TOTAL: ${totals.clicks} clicks, ${totals.impressions} impressions, ${queries.length} queries\n`);
  console.log('## Top queries');
  report.topQueries.slice(0, 15).forEach((r) => console.log('  ' + fmt(r)));
  console.log('\n## Striking distance (pos 5-20 — quickest wins)');
  if (!striking.length) console.log('  (none yet — site likely still being indexed)');
  striking.slice(0, 15).forEach((r) => console.log('  ' + fmt(r)));
  console.log('\n## Possible cannibalization (1 query → many URLs)');
  if (!cannibal.length) console.log('  (none)');
  cannibal.slice(0, 10).forEach((c) => {
    console.log(`  "${c.query}" → ${c.urls.length} URLs`);
    c.urls.slice(0, 3).forEach((u) => console.log(`      ${u.pos.toFixed(1)}  ${u.page}`));
  });
  console.log(`\nFull JSON: ${out}`);
}
main().catch((e) => { console.error('ERR:', e.message); process.exit(1); });
