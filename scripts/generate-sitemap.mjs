import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://week1-6m5.pages.dev';
const distDir = path.join(process.cwd(), 'dist');

function findHtmlFiles(dir, base = '') {
  const urls = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = base ? `${base}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        urls.push(...findHtmlFiles(fullPath, relPath));
      } else if (entry.name === 'index.html') {
        const urlPath = base === '' ? '/' : `/${base}/`;
        urls.push(urlPath);
      }
    }
  } catch (e) {}
  return urls;
}

const urls = findHtmlFiles(distDir);
const today = new Date().toISOString().split('T')[0];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${SITE_URL}${u}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${u === '/' ? '1.0' : u.includes('/venue/') ? '0.8' : '0.6'}</priority>
  </url>`).join('\n')}
</urlset>`;

fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xml);
console.log(`Sitemap: ${urls.length} URLs`);
