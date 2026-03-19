export interface Venue {
  id: number;
  slug: string;
  name: string;
  type: 'night' | 'club' | 'lounge' | 'room' | 'yojeong' | 'hoppa';
  typeName: string;
  nickname?: string;
  phone?: string;
  region: string;
  regionSlug: string;
  address: string;
  shortDesc: string;
  description: string;
  atmosphere: string;
  music: string;
  highlights: string[];
  timeline: { time: string; event: string }[];
  faq: { q: string; a: string }[];
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  h1Title: string;
}

export const TYPE_LABELS: Record<string, string> = {
  night: '나이트',
  club: '클럽',
  lounge: '라운지',
  room: '룸',
  yojeong: '요정',
  hoppa: '호빠',
};

export const TYPE_URLS: Record<string, string> = {
  night: '/nights/',
  club: '/clubs/',
  lounge: '/lounges/',
  room: '/rooms/',
  yojeong: '/yojeong/',
  hoppa: '/hoppa/',
};
