#!/usr/bin/env node
/**
 * generate-rss.mjs — RSS 2.0 피드 생성
 * Naver 웹마스터 도구 + Google News 호환
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildVenueUrl } from './lib/url.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const SITE = 'https://week1-6m5.pages.dev';

const venues = JSON.parse(readFileSync(join(ROOT, 'data', 'venues.json'), 'utf8'));

const today = new Date().toUTCString();
const todayISO = new Date().toISOString().split('T')[0];

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const items = venues.map(v => {
  const url = `${SITE}${encodeURI(buildVenueUrl(v))}`;
  const title = escapeXml(v.pageTitle || v.name_seo || v.name_display);
  const desc = escapeXml(v.metaDescription || v.seoDescription || '');
  const region = escapeXml(v.region || '');
  const category = escapeXml(v.typeLabel || '');

  return `    <item>
      <title>${title}</title>
      <link>${url}</link>
      <description>${desc}</description>
      <category>${category} — ${region}</category>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${today}</pubDate>
    </item>`;
}).join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>나이트코리아 — 전국 나이트·클럽·라운지 가이드</title>
    <link>${SITE}</link>
    <description>한국 전국 나이트, 클럽, 라운지 130곳의 상세 정보와 방문 가이드</description>
    <language>ko</language>
    <lastBuildDate>${today}</lastBuildDate>
    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

if (existsSync(DIST)) {
  writeFileSync(join(DIST, 'rss.xml'), rss, 'utf8');
}
writeFileSync(join(ROOT, 'public', 'rss.xml'), rss, 'utf8');

console.log(`rss.xml generated with ${venues.length} items`);
