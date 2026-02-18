/**
 * url.mjs — URL 생성 단일 진실 공급원 (Single Source of Truth)
 *
 * buildVenueUrl({ typePath, regionSlug, urlSlug, venueSlug })
 *   ⇒ "/{category}/{region}/{slug}/"
 *
 * 규칙:
 *  1. slug = urlSlug || venueSlug
 *  2. slug에서 category 한글 토큰 제거 (클럽/나이트/라운지)
 *     단, 제거 후 빈 문자열이면 원래 slug 유지
 *  3. slug에서 regionSlug 영문 토큰 제거
 *  4. 연속 중복 세그먼트 병합
 */

const CAT_KR = { club: '클럽', night: '나이트', lounge: '라운지' };

/**
 * slug에서 region/category 중복 토큰 제거
 */
export function cleanSlug(slug, typePath, regionSlug) {
  let s = slug;

  // 하이픈으로 분리된 category 토큰 제거 (예: "레이스-클럽" → "레이스")
  const catKr = CAT_KR[typePath];
  if (catKr) {
    const cleaned = s
      .split('-')
      .filter(p => p !== catKr)
      .join('-');
    if (cleaned.length > 0) s = cleaned;
  }

  // 하이픈으로 분리된 regionSlug 토큰 제거 (예: "gangnam-레이스" → "레이스")
  if (regionSlug) {
    const cleaned = s
      .split('-')
      .filter(p => p !== regionSlug)
      .join('-');
    if (cleaned.length > 0) s = cleaned;
  }

  return s;
}

/**
 * 정규 URL 생성
 */
export function buildVenueUrl(v) {
  const slug = cleanSlug(v.urlSlug || v.venueSlug, v.typePath, v.regionSlug);
  return `/${v.typePath}/${v.regionSlug}/${slug}/`;
}

/**
 * 구 URL 생성 (venueSlug 기반, redirect용)
 */
export function buildOldVenueUrl(v) {
  return `/${v.typePath}/${v.regionSlug}/${v.venueSlug}/`;
}
