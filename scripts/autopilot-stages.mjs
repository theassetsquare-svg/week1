#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────
// autopilot-stages.mjs — LIVE monitor for week1 Stages 1-4 regressions.
// Enrolls week1 into the autopilot: probes the LIVE site for every guarantee
// won in Stages 1-4 + runs the static build gates, emits [WEEK1-<TYPE>-<id>]
// findings, writes scripts/.secrets/stage-alert.md, exits 1 if action needed.
//   node scripts/autopilot-stages.mjs            (real probe)
//   node scripts/autopilot-stages.mjs --dry-run  (probe + show would-fix/alert, no writes)
// No external deps (uses global fetch, Node 20+). Gates run via execSync.
// ─────────────────────────────────────────────────────────────────────────
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SITE = (process.env.GSC_SITE || 'https://week1-6m5.pages.dev/').replace(/\/$/, '');
const MAIN = 'https://nolcool.com';
const DRY = process.argv.includes('--dry-run');
const findings = []; // {type, sev, msg}
let id = 0;
const flag = (type, sev, msg) => findings.push({ id: `WEEK1-${type}-${String(++id).padStart(2, '0')}`, type, sev, msg });

const get = async (url) => {
  try { const r = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000) }); const body = r.status < 300 ? await r.text() : ''; return { status: r.status, loc: r.headers.get('location') || '', ct: r.headers.get('content-type') || '', body }; }
  catch (e) { return { status: 0, err: e.message, loc: '', ct: '', body: '' }; }
};

const VENUES = ['gangnam-club-jack', 'ilsan-room', 'jeju', 'busan-asiad', 'cheongdam-h2o'];
const SAMPLE = ['', 'clubs/', 'nights/', 'guides/first-visit/', 'venue/gangnam-club-jack/', 'compare/'];

console.log(`autopilot-stages | LIVE=${SITE} | ${DRY ? 'DRY-RUN' : 'LIVE'}`);

// ── Stage1: risk words (live) ──
for (const p of [...SAMPLE, ...VENUES.map(v => `venue/${v}/`)]) {
  const r = await get(`${SITE}/${p}`);
  if (r.body) {
    const hit = (r.body.match(/밤문화|유흥|룸살롱|룸싸롱|노래방|초이스|2차(?!\s*(위반|경고|정지))/g) || []);
    if (hit.length) flag('RISKWORD', 'error', `/${p} contains ${[...new Set(hit)].join(',')}`);
  }
}

// ── Stage2: one-blob (live venue tp-desc > 600c) + guide CSS 200 ──
for (const v of VENUES) {
  const r = await get(`${SITE}/venue/${v}/`);
  if (r.body) {
    const blobs = [...r.body.matchAll(/<p [^>]*class="tp-desc"[^>]*>([\s\S]*?)<\/p>/g)].map(m => m[1].replace(/<[^>]+>/g, '').length).filter(l => l > 600);
    if (blobs.length) flag('ONEBLOB', 'error', `/venue/${v}/ has ${blobs.length} paragraph(s) >600c (un-split)`);
  }
}
// CSS assets referenced by live pages must be 200
for (const p of ['guides/first-visit/', 'about/', '']) {
  const r = await get(`${SITE}/${p}`);
  const css = [...r.body.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="(\/[^"]+)"/g)].map(m => m[1]);
  for (const href of [...new Set(css)]) {
    const cr = await get(`${SITE}${href}`);
    if (cr.status !== 200 || !/css/.test(cr.ct)) flag('CSS404', 'error', `/${p} css ${href} → ${cr.status} ${cr.ct}`);
  }
}

// ── Stage3: dual-URL regression (no /nolcool dup in sitemap; /nolcool 301s) ──
const sm = await get(`${SITE}/sitemap.xml`);
if (sm.body) {
  const nol = (sm.body.match(/\/nolcool\//g) || []).length;
  if (nol) flag('DUALURL', 'error', `sitemap lists ${nol} /nolcool/ dup URL(s)`);
}
const nr = await get(`${SITE}/nolcool/club/gangnam-club-jack/`);
if (!(nr.status === 301 && /\/venue\/gangnam-club-jack\//.test(nr.loc))) flag('DUALURL', 'error', `/nolcool/ not 301→/venue/ (got ${nr.status} ${nr.loc})`);

// ── Stage4: nolcool direct (no ilsanroom hop) + main 200 ──
for (const v of VENUES.slice(0, 2)) {
  const r = await get(`${SITE}/venue/${v}/`);
  if (r.body && /ilsanroom\.pages\.dev/.test(r.body)) flag('ILSANHOP', 'error', `/venue/${v}/ links ilsanroom.pages.dev (not direct nolcool.com)`);
}
const mr = await get(`${MAIN}/`);
if (mr.status !== 200) flag('MAINLINK', 'warn', `nolcool.com → ${mr.status} (expected 200)`);

// ── Static build gates (exhaustive, on current dist) ──
const gates = ['lint-copy.mjs', 'generate-search-index.mjs && npx astro build', 'qa_gate_stage2.mjs', 'qa_funnel.mjs'];
let gateOk = true;
try {
  execSync('npm run build', { cwd: ROOT, stdio: 'pipe' });
} catch (e) {
  gateOk = false;
  const out = (e.stdout?.toString() || '') + (e.stderr?.toString() || '');
  const failLine = out.split('\n').filter(l => /❌|FAIL/.test(l)).slice(0, 4).join(' | ');
  flag('GATE', 'error', `build gate FAILED: ${failLine || e.message.slice(0, 200)}`);
}

// ── report ──
const errs = findings.filter(f => f.sev === 'error');
const ts = new Date().toISOString();
let md = `# [WEEK1] autopilot stage-monitor — ${ts}\n\nLIVE: ${SITE}\nStatus: ${errs.length ? '🔴 ACTION NEEDED' : '🟢 HEALTHY'} | findings: ${findings.length} (errors ${errs.length}) | gates: ${gateOk ? 'PASS' : 'FAIL'}\n\n`;
if (findings.length) md += findings.map(f => `- [${f.id}] (${f.sev}) ${f.msg}`).join('\n') + '\n';
else md += '_All Stage 1-4 guarantees hold on live + gates pass._\n';
md += `\n## Safe auto-fix plan (if action needed)\n- rebuild + push (CF deploys) → \`node scripts/auto-fix.mjs\`\n- resubmit sitemap (GSC API, write scope)\n- IndexNow ping → \`node scripts/indexnow.mjs\`\n- alert [WEEK1-*] → theassetsquare@gmail.com (cloud routine Gmail draft)\n`;

console.log(md);
if (!DRY) {
  const SEC = path.join(__dirname, '.secrets');
  fs.mkdirSync(SEC, { recursive: true });
  fs.writeFileSync(path.join(SEC, 'stage-alert.md'), md);
  fs.writeFileSync(path.join(SEC, 'stage-findings.json'), JSON.stringify({ ts, site: SITE, findings, gateOk }, null, 2));
  console.log('→ wrote scripts/.secrets/stage-alert.md + stage-findings.json');
} else {
  console.log('(--dry-run: no files written, no alerts sent, no fixes applied)');
}
process.exit(errs.length ? 1 : 0);
