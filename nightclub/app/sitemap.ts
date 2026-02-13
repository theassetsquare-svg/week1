import type { MetadataRoute } from "next";
import { venues, allThemes, getAllCities } from "@/lib/venues";
import { regionSlug, citySlug } from "@/lib/venues";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: base + "/",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  // City nightclub pages
  const cityPages: MetadataRoute.Sitemap = getAllCities().map((c) => ({
    url: `${base}/kr/${regionSlug(c.region)}/${citySlug(c.city)}/nightclubs/`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Club detail pages (highest SEO value)
  const clubPages: MetadataRoute.Sitemap = venues.map((v) => ({
    url: `${base}/club/${v.slug}/`,
    lastModified: new Date(v.lastVerifiedAt),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // Theme pages
  const themePages: MetadataRoute.Sitemap = allThemes.map((t) => ({
    url: `${base}/theme/${encodeURIComponent(t)}/`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Guide pages
  const guideCities = ["seoul", "suwon", "goyang", "incheon", "ulsan", "anyang", "paju"];
  const guidePages: MetadataRoute.Sitemap = guideCities.map((c) => ({
    url: `${base}/guide/${c}/first-time/`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...clubPages,
    ...cityPages,
    ...themePages,
    ...guidePages,
  ];
}
