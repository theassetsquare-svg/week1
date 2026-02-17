#!/usr/bin/env node
/**
 * generate-sitemap.mjs - Generates sitemap.xml from venues.json + known routes
 * Uses urlSlug (clean, no category token duplication) for venue URLs
 * Outputs to both dist/sitemap.xml and root sitemap.xml
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const VENUES_PATH = join(ROOT, 'data', 'venues.json');
const DIST = join(ROOT, 'dist');

const SITE = 'https://week1-6m5.pages.dev';

const venues = JSON.parse(readFileSync(VENUES_PATH, 'utf8'));

const urls = [];

// Static pages
urls.push({ loc: '/', priority: '1.0', changefreq: 'weekly' });
urls.push({ loc: '/nights/', priority: '0.9', changefreq: 'weekly' });
urls.push({ loc: '/clubs/', priority: '0.9', changefreq: 'weekly' });
urls.push({ loc: '/lounges/', priority: '0.9', changefreq: 'weekly' });
urls.push({ loc: '/guides/', priority: '0.8', changefreq: 'monthly' });

// Guide pages
const guideSlugs = ['first-visit', 'dress-code', 'budget-guide', 'safety-tips', 'music-genres', 'solo-nightlife', 'group-party', 'regional-nightlife'];
for (const slug of guideSlugs) {
  urls.push({ loc: `/guides/${slug}/`, priority: '0.7', changefreq: 'monthly' });
}

// Region hubs (all unique regions)
const regionSet = new Set();
for (const v of venues) {
  regionSet.add(v.regionSlug);
}
for (const slug of regionSet) {
  urls.push({ loc: `/region/${slug}/`, priority: '0.8', changefreq: 'weekly' });
}

// Venue pages — use urlSlug (clean, no duplicate tokens)
const seenUrls = new Set();
for (const v of venues) {
  const slug = v.urlSlug || v.venueSlug;
  const path = `/${v.typePath}/${v.regionSlug}/${slug}/`;
  if (!seenUrls.has(path)) {
    urls.push({ loc: path, priority: '0.8', changefreq: 'weekly' });
    seenUrls.add(path);
  }
}

const today = new Date().toISOString().split('T')[0];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${SITE}${encodeURI(u.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

// Write to dist/ if it exists
if (existsSync(DIST)) {
  writeFileSync(join(DIST, 'sitemap.xml'), xml, 'utf8');
}

// Also write to root for reference
writeFileSync(join(ROOT, 'sitemap.xml'), xml, 'utf8');

console.log(`sitemap.xml generated with ${urls.length} URLs (${venues.length} venues + ${urls.length - venues.length} static/region pages)`);
