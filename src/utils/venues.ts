// Venue data utilities
import venuesData from '../../data/venues.json';

export interface Venue {
  id: string;
  type: string;
  typePath: string;
  typeLabel: string;
  name_input: string;
  name_display: string;
  name_seo: string;
  region: string;
  regionSlug: string;
  venueSlug: string;
  urlSlug: string;
  geo: {
    formatted_address: string;
    lat: number;
    lon: number;
    city: string;
    district: string;
    neighborhood: string;
    precision: string;
  };
  keywords: string[];
  teaser: string;
  card_hook?: string;
  card_value?: string;
  card_tags?: string[];
  image_alt?: string;
  map_url?: string;
  seoTitle?: string;
  seoDescription?: string;
  pageTitle?: string;
  metaDescription?: string;
  h1Title?: string;
  sectionIntros?: {
    summaryTitle?: string;
    atmosphereLead?: string;
    musicLead?: string;
    faqLead?: string;
    checklistLead?: string;
    timelineLead?: string;
  };
  conclusionText?: string;
  intro?: {
    hook: string;
    valuePromise: string;
    scanBox: string[];
    checklist: string[];
    riskItems: { dont: string; doInstead: string }[];
    teasers: string[];
  };
  hookIntro?: string;
  storyFrame: { id: string; pov: string; tone: string; style: string };
  story: Record<string, string>;
  bodySections: { atmosphere: string; music: string; safety: string; deepDive?: { checkpoint: string; history: string; season: string; course: string } };
  timeline: { time: string; label: string; desc: string }[];
  checklist: string[];
  faq: { q: string; a: string }[];
  plannerRules: Record<string, Record<string, string>>;
  images: { src: string; alt: string }[];
  imagePrompts: string[];
  relatedVenueIds: {
    sameRegion: string[];
    sameType: string[];
    nearby: string[];
    guides: string[];
  };
}

export const venues: Venue[] = venuesData as Venue[];

export function getVenue(id: string): Venue | undefined {
  return venues.find(v => v.id === id);
}

export function getVenueBySlug(regionSlug: string, venueSlug: string): Venue | undefined {
  return venues.find(v => v.regionSlug === regionSlug && (v.urlSlug === venueSlug || v.venueSlug === venueSlug));
}

export function getVenuesByType(type: string): Venue[] {
  return venues.filter(v => v.type === type);
}

export function getVenuesByRegion(regionSlug: string): Venue[] {
  return venues.filter(v => v.regionSlug === regionSlug);
}

export function getUniqueRegions(): { slug: string; name: string; count: number }[] {
  const map = new Map<string, { slug: string; name: string; count: number }>();
  for (const v of venues) {
    const existing = map.get(v.regionSlug);
    if (existing) { existing.count++; }
    else { map.set(v.regionSlug, { slug: v.regionSlug, name: v.region, count: 1 }); }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

/**
 * slug에서 category/region 중복 토큰 제거
 */
function cleanSlug(slug: string, typePath: string, regionSlug: string): string {
  const catKr: Record<string, string> = { club: '클럽', night: '나이트', lounge: '라운지' };
  let s = slug;
  const cat = catKr[typePath];
  if (cat) {
    const cleaned = s.split('-').filter(p => p !== cat).join('-');
    if (cleaned.length > 0) s = cleaned;
  }
  if (regionSlug) {
    const cleaned = s.split('-').filter(p => p !== regionSlug).join('-');
    if (cleaned.length > 0) s = cleaned;
  }
  return s;
}

/**
 * 정규 URL 생성 (Single Source of Truth)
 */
export function getVenueUrl(v: Venue): string {
  const slug = cleanSlug(v.urlSlug || v.venueSlug, v.typePath, v.regionSlug);
  return `/${v.typePath}/${v.regionSlug}/${slug}/`;
}

export function getReadingTime(v: Venue): number {
  const text = [
    v.teaser, v.hookIntro || '', v.bodySections.atmosphere, v.bodySections.music, v.bodySections.safety,
    ...(v.bodySections.deepDive ? Object.values(v.bodySections.deepDive) : []),
    ...Object.values(v.story),
    ...v.timeline.map(t => t.desc),
    ...v.checklist,
    ...v.faq.map(f => f.q + f.a),
  ].join('');
  const chars = text.replace(/\s/g, '').length;
  return Math.max(10, Math.ceil(chars / 500));
}

export const guides = [
  { slug: 'first-visit', title: '첫 입장 핵심 팁', desc: '나이트·클럽·라운지 첫 방문이 걱정된다면, 입장부터 퇴장까지 흐름과 준비물을 미리 확인하세요.' },
  { slug: 'dress-code', title: '드레스코드 총정리', desc: '클럽·나이트·라운지 유형별 드레스코드 조건과 계절별 복장 팁을 한눈에 확인하세요.' },
  { slug: 'safety-tips', title: '안전하게 즐기는 법', desc: '음주 관리, 귀가 교통편, 개인 물품 보관 등 즐거운 밤을 위한 필수 안전 수칙과 주의사항 안내.' },
  { slug: 'music-genres', title: '음악 장르 총정리', desc: 'EDM, 힙합, 하우스, 테크노부터 트로트·재즈까지 — 유형별 음악 장르 특징과 즐기는 법.' },
  { slug: 'solo-nightlife', title: '혼자서도 즐기는 나이트라이프', desc: '솔로 방문이 걱정된다면 이 가이드를 읽어보세요. 라운지·나이트·클럽에서 혼자 즐기는 실전 팁.' },
  { slug: 'group-party', title: '단체 파티 기획 노하우', desc: '생일 파티, 회식, 동호회 모임을 위한 단체 예약 방법과 매장 유형별 기획 팁을 정리했습니다.' },
  { slug: 'regional-nightlife', title: '전국별 밤문화 특징', desc: '서울 강남·이태원, 부산 해운대·서면, 대구 동성로, 인천 등 주요 도시별 밤문화 특성과 추천 매장.' },
];
