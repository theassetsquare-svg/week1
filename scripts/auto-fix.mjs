#!/usr/bin/env node
// auto-fix.mjs — safe, idempotent autonomous fixes for the 놀쿨 site.
// Only does things that are always safe to repeat: rebuild, re-audit, and
// (re)submit the sitemap to Google Search Console. Anything risky is left to
// a human / the scheduled agent. Prints a short summary of what it did.
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadKey, getAccessToken, submitSitemap, listSitemaps } from './lib/gsc-client.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SITE = process.env.GSC_SITE || 'https://week1-6m5.pages.dev/';
const SITEMAP = `${SITE}sitemap.xml`;
const did = [];

function sh(cmd) { return execSync(cmd, { cwd: ROOT, stdio: 'pipe' }).toString(); }

try {
  console.log('• rebuilding site...');
  sh('npm run build');
  did.push('rebuilt site');
} catch (e) {
  console.error('build FAILED — not safe to continue:', e.message.slice(0, 400));
  process.exit(1);
}

try {
  const out = sh('node scripts/seo-audit.mjs');
  const m = out.match(/SCORE: (\d+)\/100/);
  did.push(`audit score ${m ? m[1] : '?'}/100`);
} catch { /* non-fatal */ }

try {
  const key = loadKey();
  const token = await getAccessToken(key, 'https://www.googleapis.com/auth/webmasters');
  await submitSitemap(token, SITE, SITEMAP);
  const list = await listSitemaps(token, SITE);
  const sm = list.find((s) => s.path === SITEMAP);
  did.push(`resubmitted sitemap (errors=${sm?.errors ?? 0})`);
} catch (e) {
  console.error('sitemap resubmit skipped:', e.message);
}

console.log('\nauto-fix done:', did.join(' · '));
