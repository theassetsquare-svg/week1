import type { APIRoute, GetStaticPaths } from 'astro';
import { venues } from '../../data/venues';

const gradients: Record<string, [string, string]> = {
  night: ['#1e1b4b', '#4338ca'],
  club: ['#0c4a6e', '#0891b2'],
  lounge: ['#78350f', '#d97706'],
  room: ['#064e3b', '#059669'],
  yojeong: ['#4a1942', '#be185d'],
  hoppa: ['#7f1d1d', '#dc2626'],
};

export const getStaticPaths: GetStaticPaths = () => {
  return venues.map(v => ({ params: { slug: v.slug } }));
};

export const GET: APIRoute = ({ params }) => {
  const venue = venues.find(v => v.slug === params.slug);
  if (!venue) return new Response('Not found', { status: 404 });

  const [c1, c2] = gradients[venue.type] || gradients.night;
  const name = venue.name.length > 14 ? venue.name.substring(0, 14) + '…' : venue.name;
  const region = venue.region;
  const typeName = venue.typeName;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="60" y="60" width="1080" height="510" rx="24" fill="rgba(0,0,0,0.2)"/>
  <rect x="80" y="80" width="120" height="36" rx="18" fill="rgba(255,255,255,0.2)"/>
  <text x="140" y="105" font-family="sans-serif" font-size="16" font-weight="700" fill="#fff" text-anchor="middle">${typeName}</text>
  <text x="600" y="300" font-family="sans-serif" font-size="56" font-weight="800" fill="#fff" text-anchor="middle">${escapeXml(name)}</text>
  <text x="600" y="370" font-family="sans-serif" font-size="28" fill="rgba(255,255,255,0.7)" text-anchor="middle">${escapeXml(region)}</text>
  <text x="600" y="520" font-family="sans-serif" font-size="20" fill="rgba(255,255,255,0.5)" text-anchor="middle">오늘밤어디</text>
</svg>`;

  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=31536000' }
  });
};

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
