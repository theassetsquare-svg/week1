import type { APIRoute, GetStaticPaths } from 'astro';
import { venues } from '../../data/venues';

export const getStaticPaths: GetStaticPaths = () => {
  return venues.map(v => ({ params: { slug: v.slug } }));
};

export const GET: APIRoute = ({ params }) => {
  const venue = venues.find(v => v.slug === params.slug);
  if (!venue) return new Response('Not found', { status: 404 });

  const name = venue.name.length > 14 ? venue.name.substring(0, 14) + '…' : venue.name;
  const region = venue.region;
  const typeName = venue.typeName;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0A0A0F"/>
      <stop offset="100%" stop-color="#1A0A2E"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <!-- Grid pattern -->
  <g opacity="0.05">
    ${Array.from({length: 20}, (_, i) => `<line x1="${i*60}" y1="0" x2="${i*60}" y2="630" stroke="#39FF14" stroke-width="1"/>`).join('')}
    ${Array.from({length: 11}, (_, i) => `<line x1="0" y1="${i*60}" x2="1200" y2="${i*60}" stroke="#39FF14" stroke-width="1"/>`).join('')}
  </g>
  <!-- Border frame -->
  <rect x="40" y="40" width="1120" height="550" rx="16" fill="none" stroke="#39FF14" stroke-width="2" opacity="0.3"/>
  <!-- Type badge -->
  <rect x="80" y="80" width="120" height="36" rx="18" fill="rgba(57,255,20,0.15)" stroke="#39FF14" stroke-width="1"/>
  <text x="140" y="105" font-family="monospace" font-size="16" font-weight="700" fill="#39FF14" text-anchor="middle">${typeName}</text>
  <!-- Venue name -->
  <text x="600" y="290" font-family="sans-serif" font-size="52" font-weight="800" fill="#FFFFFF" text-anchor="middle" filter="url(#glow)">${escapeXml(name)}</text>
  <!-- Region -->
  <text x="600" y="355" font-family="monospace" font-size="26" fill="#A855F7" text-anchor="middle">${escapeXml(region)}</text>
  <!-- Slogan -->
  <text x="600" y="430" font-family="monospace" font-size="18" fill="rgba(57,255,20,0.6)" text-anchor="middle">새벽까지 멈추지 않는 밤</text>
  <!-- Site name -->
  <text x="600" y="530" font-family="monospace" font-size="22" fill="#39FF14" text-anchor="middle" opacity="0.8">오늘밤어디</text>
  <!-- Corner decorations -->
  <line x1="50" y1="50" x2="120" y2="50" stroke="#39FF14" stroke-width="3"/>
  <line x1="50" y1="50" x2="50" y2="120" stroke="#39FF14" stroke-width="3"/>
  <line x1="1080" y1="580" x2="1150" y2="580" stroke="#A855F7" stroke-width="3"/>
  <line x1="1150" y1="510" x2="1150" y2="580" stroke="#A855F7" stroke-width="3"/>
</svg>`;

  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=31536000' }
  });
};

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
