#!/usr/bin/env node
// indexnow.mjs — submit canonical URLs to IndexNow (Bing/Yandex/Seznam; NOT Google).
// Honest note: Google does NOT use IndexNow — Google recrawl is nudged via the
// GSC sitemap resubmit in auto-fix.mjs. This accelerates Bing/Yandex indexing.
//   node scripts/indexnow.mjs            (submit live sitemap URLs)
//   node scripts/indexnow.mjs --dry-run  (show payload, no POST)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOST = 'week1-6m5.pages.dev';
const SITE = `https://${HOST}`;
const DRY = process.argv.includes('--dry-run');

const KEY = (fs.readFileSync(path.join(__dirname, '.secrets', 'indexnow-key.txt'), 'utf8') || '').trim();
if (!KEY) { console.error('no IndexNow key (scripts/.secrets/indexnow-key.txt)'); process.exit(1); }

// pull URL list from live sitemap (canonical source of indexable URLs)
const smRes = await fetch(`${SITE}/sitemap.xml`, { signal: AbortSignal.timeout(20000) });
const sm = await smRes.text();
const urlList = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]).slice(0, 10000);

const payload = { host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList };
console.log(`IndexNow: ${urlList.length} URLs | key ${KEY.slice(0, 8)}… | keyLocation ${payload.keyLocation}`);

if (DRY) { console.log('(--dry-run) would POST to https://api.indexnow.org/indexnow\n  sample:', JSON.stringify(urlList.slice(0, 3))); process.exit(0); }

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload), signal: AbortSignal.timeout(20000),
});
console.log(`IndexNow response: ${res.status} ${res.statusText} (200/202 = accepted)`);
process.exit(res.status === 200 || res.status === 202 ? 0 : 1);
