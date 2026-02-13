import { venues, regions, citiesByRegion, allThemes } from "./venues.generated";
import type { Venue } from "./types";

export { venues, regions, citiesByRegion, allThemes };

export function getVenueBySlug(slug: string): Venue | undefined {
  return venues.find((v) => v.slug === slug);
}

export function getVenuesByCity(city: string): Venue[] {
  return venues.filter((v) => v.city === city);
}

export function getVenuesByRegion(region: string): Venue[] {
  return venues.filter((v) => v.region === region);
}

export function getVenuesByTheme(theme: string): Venue[] {
  return venues.filter((v) => v.themes.includes(theme));
}

export function getAllSlugs(): string[] {
  return venues.map((v) => v.slug);
}

export function getAllCities(): { region: string; city: string }[] {
  const seen = new Set<string>();
  return venues
    .filter((v) => {
      const key = `${v.region}/${v.city}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((v) => ({ region: v.region, city: v.city }));
}

export function getAllRegions(): string[] {
  return [...regions];
}

export function getAllThemes(): string[] {
  return [...allThemes];
}

export function filterVenues(opts: {
  region?: string;
  city?: string;
  theme?: string;
  genre?: string;
  parking?: boolean;
  beginnerFriendly?: boolean;
  maxPrice?: number;
  query?: string;
}): Venue[] {
  let result = [...venues];
  if (opts.region) result = result.filter((v) => v.region === opts.region);
  if (opts.city) result = result.filter((v) => v.city === opts.city);
  if (opts.theme) result = result.filter((v) => v.themes.includes(opts.theme!));
  if (opts.genre) result = result.filter((v) => v.genres.includes(opts.genre!));
  if (opts.parking !== undefined)
    result = result.filter((v) => v.parking === opts.parking);
  if (opts.beginnerFriendly)
    result = result.filter((v) => v.beginnerFriendly);
  if (opts.maxPrice)
    result = result.filter((v) => (v.priceMin ?? 0) <= opts.maxPrice!);
  if (opts.query) {
    const q = opts.query.toLowerCase();
    result = result.filter(
      (v) =>
        v.nameKo.toLowerCase().includes(q) ||
        v.address.toLowerCase().includes(q) ||
        v.summary.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q) ||
        v.region.toLowerCase().includes(q)
    );
  }
  return result;
}

export function regionSlug(region: string): string {
  const map: Record<string, string> = {
    서울: "seoul",
    경기: "gyeonggi",
    인천: "incheon",
    경남: "gyeongnam",
    경북: "gyeongbuk",
    충남: "chungnam",
    충북: "chungbuk",
    전남: "jeonnam",
    전북: "jeonbuk",
    강원: "gangwon",
    제주: "jeju",
    대구: "daegu",
    부산: "busan",
    대전: "daejeon",
    광주: "gwangju",
    울산: "ulsan",
    세종: "sejong",
  };
  return map[region] || region;
}

export function citySlug(city: string): string {
  const map: Record<string, string> = {
    서울: "seoul",
    수원: "suwon",
    안양: "anyang",
    파주: "paju",
    고양: "goyang",
    울산: "ulsan",
    인천: "incheon",
    부산: "busan",
    대구: "daegu",
    대전: "daejeon",
    광주: "gwangju",
    성남: "seongnam",
    천안: "cheonan",
  };
  return map[city] || city;
}

export function regionFromSlug(slug: string): string | undefined {
  const map: Record<string, string> = {
    seoul: "서울",
    gyeonggi: "경기",
    incheon: "인천",
    gyeongnam: "경남",
    gyeongbuk: "경북",
    chungnam: "충남",
    chungbuk: "충북",
    jeonnam: "전남",
    jeonbuk: "전북",
    gangwon: "강원",
    jeju: "제주",
    daegu: "대구",
    busan: "부산",
    daejeon: "대전",
    gwangju: "광주",
    ulsan: "울산",
    sejong: "세종",
  };
  return map[slug];
}

export function cityFromSlug(slug: string): string | undefined {
  const map: Record<string, string> = {
    seoul: "서울",
    suwon: "수원",
    anyang: "안양",
    paju: "파주",
    goyang: "고양",
    ulsan: "울산",
    incheon: "인천",
    busan: "부산",
    daegu: "대구",
    daejeon: "대전",
    gwangju: "광주",
    seongnam: "성남",
    cheonan: "천안",
  };
  return map[slug];
}
