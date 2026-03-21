import type { APIRoute, GetStaticPaths } from 'astro';
import { venues } from '../../data/venues';

const gradients: Record<string, [string, string]> = {
  night: ['#7C3AED', '#A855F7'],
  club: ['#0891B2', '#06B6D4'],
  lounge: ['#D97706', '#F59E0B'],
  room: ['#059669', '#10B981'],
  yojeong: ['#BE185D', '#EC4899'],
  hoppa: ['#E11D48', '#FB7185'],
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
  <rect x="60" y="60" width="1080" height="510" rx="24" fill="rgba(255,255,255,0.1)"/>
  <rect x="80" y="80" width="120" height="36" rx="18" fill="rgba(255,255,255,0.2)"/>
  <text x="140" y="105" font-family="sans-serif" font-size="16" font-weight="700" fill="#fff" text-anchor="middle">${typeName}</text>
  <text x="600" y="290" font-family="sans-serif" font-size="52" font-weight="800" fill="#fff" text-anchor="middle">${escapeXml(name)}</text>
  <text x="600" y="355" font-family="sans-serif" font-size="26" fill="rgba(255,255,255,0.8)" text-anchor="middle">${escapeXml(region)}</text>
  <text x="600" y="520" font-family="sans-serif" font-size="20" fill="rgba(255,255,255,0.6)" text-anchor="middle">오늘밤어디</text>
</svg>`;

  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=31536000' }
  });
};

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
