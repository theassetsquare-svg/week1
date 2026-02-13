import { Venue } from "./types";
import { SITE_URL, canonical } from "./site";

export function nightClubJsonLd(venue: Venue) {
  return {
    "@context": "https://schema.org",
    "@type": "NightClub",
    name: venue.nameKo,
    description: venue.summary,
    address: {
      "@type": "PostalAddress",
      streetAddress: venue.address,
      addressLocality: venue.city,
      addressRegion: venue.region,
      addressCountry: "KR",
    },
    ...(venue.lat && venue.lng
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: venue.lat,
            longitude: venue.lng,
          },
        }
      : {}),
    ...(venue.phone ? { telephone: venue.phone } : {}),
    ...(venue.website ? { url: venue.website } : {}),
    ...(venue.priceMin
      ? {
          priceRange:
            venue.priceMin && venue.priceMax
              ? `₩${venue.priceMin.toLocaleString()}~₩${venue.priceMax.toLocaleString()}`
              : undefined,
        }
      : {}),
    image: `${SITE_URL}/og-default.jpg`,
    sameAs: [
      venue.instagram,
      venue.website,
    ].filter(Boolean),
  };
}

export function breadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "전국 나이트클럽 정보",
    url: SITE_URL,
    description:
      "대한민국 전국 나이트클럽 정보 디렉터리 — 지역별, 테마별로 나이트클럽을 검색하고 비교하세요.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function itemListJsonLd(venues: Venue[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: venues.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: v.nameKo,
      url: canonical(`/club/${v.slug}/`),
    })),
  };
}
