import type { Venue } from './types';
export type { Venue } from './types';
export { TYPE_LABELS, TYPE_URLS } from './types';

export const MAIN_SITE_URL = 'https://nolcool.com';
export const SITE_URL = 'https://week1-6m5.pages.dev';
export const SLOGAN = '새벽까지 멈추지 않는 밤';
export const SITE_NAME = '놀쿨';

import { nightsSeoul } from './nights-seoul';
import { nightsGyeonggi } from './nights-gyeonggi';
import { nightsOther } from './nights-other';
import { clubVenues } from './clubs-data';
import { loungeVenues } from './lounges-data';
import { otherVenues } from './others-data';

export const venues: Venue[] = [
  ...nightsSeoul,
  ...nightsGyeonggi,
  ...nightsOther,
  ...clubVenues,
  ...loungeVenues,
  ...otherVenues,
];

export function getVenueBySlug(slug: string): Venue | undefined {
  return venues.find(v => v.slug === slug);
}

export function getVenuesByType(type: string): Venue[] {
  return venues.filter(v => v.type === type);
}
