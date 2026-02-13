export interface Venue {
  slug: string;
  nameKo: string;
  region: string;
  city: string;
  address: string;
  lat?: number;
  lng?: number;
  phone?: string;
  kakao?: string;
  website?: string;
  instagram?: string;
  themes: string[];
  genres: string[];
  priceMin?: number;
  priceMax?: number;
  dressCode?: string;
  parking: boolean;
  summary: string;
  tips: string[];
  lastVerifiedAt: string;
  legacyPaths?: string[];
  operatingHours?: string;
  peakTime?: string;
  beginnerFriendly: boolean;
  bodyContent?: string;
}

export interface LegacyLink {
  path: string;
  title: string;
  slug: string;
}
