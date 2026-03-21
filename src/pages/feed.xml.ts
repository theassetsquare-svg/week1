import type { APIRoute } from 'astro';
import { venues, SITE_URL, SITE_NAME, SLOGAN } from '../data/venues';

export const GET: APIRoute = () => {
  const items = venues.slice(0, 20).map(v => `
    <item>
      <title>${escapeXml(v.name)}</title>
      <link>${SITE_URL}/venue/${v.slug}/</link>
      <description>${escapeXml(v.shortDesc)}</description>
      <guid>${SITE_URL}/venue/${v.slug}/</guid>
    </item>`).join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <description>${SLOGAN}</description>
    <language>ko</language>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: { 'Content-Type': 'application/xml' }
  });
};

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
