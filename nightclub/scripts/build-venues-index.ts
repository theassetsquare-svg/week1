/**
 * Build script: Scans content/venues/*.mdx + legacy folders
 * to generate lib/venues.generated.ts (single source of truth)
 *
 * Run: npx tsx scripts/build-venues-index.ts
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROOT = path.resolve(__dirname, "..");
const VENUES_DIR = path.join(ROOT, "content", "venues");
const LEGACY_DIR = path.join(ROOT, "..", ""); // parent: week1 root
const OUTPUT = path.join(ROOT, "lib", "venues.generated.ts");

interface VenueData {
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
  beginnerFriendly: boolean;
  summary: string;
  tips: string[];
  lastVerifiedAt: string;
  legacyPaths: string[];
  operatingHours?: string;
  peakTime?: string;
  bodyContent: string;
}

// Legacy folder mapping (folder letter -> slug)
const LEGACY_MAP: Record<string, string> = {
  b: "suwon-chance-dome",
  c: "sinlim-grandprix",
  d: "cheongdam-h2o",
  e: "indeokwon-kookbingwan",
  f: "paju-skydome",
  g: "ulsan-champion",
  h: "ilsan-shampoo",
  j: "sangbong-hankookgwan",
  k: "incheon-arabian",
  n: "sangbong-hankookgwan",
  o: "sangbong-hankookgwan",
  p: "sangbong-hankookgwan",
  q: "sangbong-hankookgwan",
};

function scanVenuesMdx(): VenueData[] {
  if (!fs.existsSync(VENUES_DIR)) return [];

  const files = fs.readdirSync(VENUES_DIR).filter((f) => f.endsWith(".mdx"));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(VENUES_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    return {
      slug: data.slug,
      nameKo: data.nameKo,
      region: data.region,
      city: data.city,
      address: data.address || "",
      lat: data.lat,
      lng: data.lng,
      phone: data.phone,
      kakao: data.kakao,
      website: data.website,
      instagram: data.instagram,
      themes: (data.themes || []).map(String),
      genres: (data.genres || []).map(String),
      priceMin: data.priceMin,
      priceMax: data.priceMax,
      dressCode: data.dressCode,
      parking: data.parking ?? false,
      beginnerFriendly: data.beginnerFriendly ?? true,
      summary: data.summary || "",
      tips: data.tips || [],
      lastVerifiedAt: data.lastVerifiedAt || "2025-01-01",
      legacyPaths: [],
      operatingHours: data.operatingHours,
      peakTime: data.peakTime,
      bodyContent: content.trim(),
    };
  });
}

function scanLegacyFolders(venues: VenueData[]): void {
  const slugMap = new Map(venues.map((v) => [v.slug, v]));

  for (const [folder, slug] of Object.entries(LEGACY_MAP)) {
    const legacyPath = path.join(LEGACY_DIR, folder, "index.html");
    if (fs.existsSync(legacyPath)) {
      const venue = slugMap.get(slug);
      if (venue && !venue.legacyPaths.includes(`/${folder}/`)) {
        venue.legacyPaths.push(`/${folder}/`);
      }
    }
  }
}

function scanAppLegacyRoutes(venues: VenueData[]): void {
  // Scan /app for any koreanight or legacy routes
  const appDir = path.join(ROOT, "app");
  if (!fs.existsSync(appDir)) return;

  function walk(dir: string, prefix: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        walk(path.join(dir, e.name), `${prefix}/${e.name}`);
      } else if (e.name === "page.tsx" && prefix.includes("legacy")) {
        console.log(`  Found legacy app route: ${prefix}`);
      }
    }
  }
  walk(appDir, "");
}

function generate() {
  console.log("🔍 Scanning content/venues/*.mdx ...");
  const venues = scanVenuesMdx();
  console.log(`  Found ${venues.length} venue(s)`);

  console.log("🔍 Scanning legacy folders ...");
  scanLegacyFolders(venues);

  console.log("🔍 Scanning app legacy routes ...");
  scanAppLegacyRoutes(venues);

  // Deduplicate (same slug)
  const deduped = new Map<string, VenueData>();
  for (const v of venues) {
    if (deduped.has(v.slug)) {
      const existing = deduped.get(v.slug)!;
      existing.legacyPaths = [
        ...new Set([...existing.legacyPaths, ...v.legacyPaths]),
      ];
    } else {
      deduped.set(v.slug, v);
    }
  }

  const result = Array.from(deduped.values());

  // Collect unique regions, cities, themes
  const regions = [...new Set(result.map((v) => v.region))].sort();
  const cities = [
    ...new Set(result.map((v) => `${v.region}/${v.city}`)),
  ].sort();
  const themes = [...new Set(result.flatMap((v) => v.themes))].sort();

  // Build legacy redirects
  const legacyRedirects: Record<string, string> = {};
  for (const v of result) {
    for (const lp of v.legacyPaths) {
      legacyRedirects[lp] = "/club/" + v.slug + "/";
    }
  }

  // Build cities by region
  const citiesByRegion: Record<string, string[]> = {};
  for (const r of regions) {
    citiesByRegion[r] = [
      ...new Set(result.filter((v) => v.region === r).map((v) => v.city)),
    ];
  }

  const lines = [
    "// AUTO-GENERATED by scripts/build-venues-index.ts — DO NOT EDIT",
    "// Generated at: " + new Date().toISOString(),
    "",
    'import type { Venue } from "./types";',
    "",
    "export const venues: Venue[] = " + JSON.stringify(result, null, 2) + ";",
    "",
    "export const regions = " + JSON.stringify(regions) + " as const;",
    "",
    "export const citiesByRegion: Record<string, string[]> = " +
      JSON.stringify(citiesByRegion, null, 2) + ";",
    "",
    "export const allThemes = " + JSON.stringify(themes) + " as const;",
    "",
    "export const legacyRedirects: Record<string, string> = " +
      JSON.stringify(legacyRedirects, null, 2) + ";",
    "",
  ];

  const output = lines.join("\n");

  fs.writeFileSync(OUTPUT, output, "utf-8");
  console.log(`✅ Generated ${OUTPUT}`);
  console.log(
    `   ${result.length} venues, ${regions.length} regions, ${themes.length} themes`
  );
}

generate();
