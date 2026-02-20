# SEO Diagnosis Report - TOP 10 Priority Issues

**Project:** night-4qy.pages.dev (night korea)
**Date:** 2026-02-20
**Total Pages:** ~187 (venue detail + static pages)

---

## Priority Legend

| Priority | Meaning | Action Timeline |
|----------|---------|-----------------|
| **P0** | Blocking / catastrophic SEO failure | Fix immediately before any other work |
| **P1** | High impact, significant ranking loss | Fix within 1-2 days |
| **P2** | Medium impact, missed optimization | Fix within 1 week |
| **P3** | Low impact, nice-to-have improvement | Fix when convenient |

---

## Issue #1 — Wrong Domain Across Entire Codebase

| Field | Detail |
|-------|--------|
| **Priority** | **P0 - CRITICAL** |
| **Impact** | Catastrophic. All canonical URLs, sitemap entries, OG tags, and robots.txt point to a domain that is not the live deployment target. Search engines index the wrong domain or discard signals entirely. |
| **Current State** | Every hardcoded URL references `https://week1-6m5.pages.dev`. |
| **Desired State** | All URLs must reference `https://night-4qy.pages.dev` (or the final custom domain once assigned). |
| **Affected Files** | `astro.config.mjs` (site field), `BaseLayout.astro` (siteUrl constant), `sitemap.xml` (all 187 entries), `robots.txt` (Sitemap directive), every template that constructs canonical or OG URLs. |
| **Affected Pages** | All 187+ pages. |
| **Recommended Fix** | 1. Update `astro.config.mjs` `site` to the correct domain. 2. Ensure `BaseLayout.astro` derives `siteUrl` from the Astro config site value rather than a hardcoded string. 3. Regenerate or rewrite `sitemap.xml` with the correct domain. 4. Update `robots.txt` Sitemap directive. 5. Search the entire codebase for `week1-6m5.pages.dev` and replace every occurrence. 6. Consider defining the domain in a single config constant so future domain changes require editing only one file. |

---

## Issue #2 — Static Sitemap (Not Dynamically Generated)

| Field | Detail |
|-------|--------|
| **Priority** | **P1 - HIGH** |
| **Impact** | High. Any page added, removed, or renamed in the future will not appear in (or be removed from) the sitemap. Search engines rely on sitemaps for discovery, especially for large Korean-language sites with deep URL structures. |
| **Current State** | `sitemap.xml` is a hand-written static file containing 187 URLs. |
| **Desired State** | Sitemap is generated automatically at build time, reflecting every routable page in the project. |
| **Affected Files** | `public/sitemap.xml` (static file to be removed), `astro.config.mjs` (integration config). |
| **Affected Pages** | All current and future pages. |
| **Recommended Fix** | 1. Install and configure `@astrojs/sitemap` integration. 2. Delete the static `public/sitemap.xml`. 3. Verify the integration output after build includes all expected URLs with the correct domain. 4. Add `lastmod`, `changefreq`, and `priority` attributes where appropriate. |

---

## Issue #3 — Brand Name Inconsistency ("NLC" vs. correct brand)

| Field | Detail |
|-------|--------|
| **Priority** | **P1 - HIGH** |
| **Impact** | High for branded search queries. Users and search engines see "NLC" instead of the target brand name. This dilutes brand authority and confuses branded search intent signals. |
| **Current State** | Header and footer display "NLC". Page titles and meta descriptions may also reference "NLC". |
| **Desired State** | All user-facing brand references display the correct brand name as specified by the project owner. |
| **Affected Files** | Header component, Footer component, `BaseLayout.astro` (default title/meta), any template that outputs the brand string. |
| **Affected Pages** | All pages (header/footer are global). |
| **Recommended Fix** | 1. Define the canonical brand name in a single shared constant (e.g., `src/config.ts`). 2. Replace every occurrence of "NLC" in components and templates with the constant. 3. Verify meta titles, OG titles, and structured data also use the correct brand. |

---

## Issue #4 — Store Name Not Leading Titles / H1s on Venue Pages

| Field | Detail |
|-------|--------|
| **Priority** | **P1 - HIGH** |
| **Impact** | High for Korean local SEO. Korean search engines (Naver, Google Korea) weight the first words in title tags and H1s heavily. If the venue store name does not appear at the start, ranking for "[store name] + region" queries drops significantly. |
| **Current State** | Some venue pages may have `pageTitle` / `h1Title` values where the store name is not the leading term. |
| **Desired State** | Every venue detail page title and H1 begins with the exact store name, followed by region and descriptors. Pattern: `{storeName} {region} {type}`. |
| **Affected Files** | Venue data files (JSON/frontmatter), the three venue templates (club, night, lounge). |
| **Affected Pages** | Up to 130 venue detail pages. |
| **Recommended Fix** | 1. Audit all venue data entries and verify `pageTitle` and `h1Title` start with the store name. 2. If titles are constructed in templates, restructure the template logic to guarantee store-name-first ordering. 3. Write a build-time validation script that flags any title not beginning with the store name. |

---

## Issue #5 — Missing OG Images on Most Pages

| Field | Detail |
|-------|--------|
| **Priority** | **P2 - MEDIUM** |
| **Impact** | Medium. Pages shared on KakaoTalk, Naver Blog, or social platforms render without a preview image, reducing click-through rates. OG images also serve as indirect ranking signals via engagement metrics. |
| **Current State** | `ogImage` in `BaseLayout.astro` is only populated when explicitly passed by the page. Most pages do not pass it, resulting in no `og:image` meta tag. |
| **Desired State** | Every page has an `og:image`. Venue pages use a venue-specific image. Other pages fall back to a default site-wide OG image. |
| **Affected Files** | `BaseLayout.astro` (fallback logic), venue templates, `public/` (default OG image asset). |
| **Affected Pages** | Estimated 150+ pages currently missing OG images. |
| **Recommended Fix** | 1. Create a high-quality default OG image (1200x630px) and place it in `public/images/og-default.jpg`. 2. Update `BaseLayout.astro` to fall back to the default image when `ogImage` is not provided. 3. For venue pages, auto-select the first venue image as the OG image in the template. 4. Validate output with Facebook Sharing Debugger and KakaoTalk link preview. |

---

## Issue #6 — High Structural Similarity Across 130 Venue Pages

| Field | Detail |
|-------|--------|
| **Priority** | **P2 - MEDIUM** |
| **Impact** | Medium. Google may classify highly similar pages as thin or duplicate content, leading to crawl budget waste and potential soft penalties. While text content has been humanized, the HTML structure, section ordering, and boilerplate ratio remain nearly identical across pages of the same type. |
| **Current State** | 130 venue detail pages are rendered by 3 templates (club, night, lounge). DOM structure, section headings, and layout are identical within each type. |
| **Desired State** | Each venue page has enough unique structural and content signals to be treated as a distinct, valuable page by search engines. |
| **Affected Files** | The three venue detail templates, venue data files. |
| **Affected Pages** | ~130 venue detail pages. |
| **Recommended Fix** | 1. Introduce conditional sections that render only when a venue has specific data (e.g., parking info, dress code, VIP options) so page structures diverge naturally. 2. Vary section ordering based on venue attributes or type. 3. Add unique structured data (LocalBusiness schema) per venue with distinct attributes. 4. Ensure meta descriptions are fully unique per page (not template-derived). 5. Add user-generated or editorial content sections where available. |

---

## Issue #7 — Missing Naver Site Verification

| Field | Detail |
|-------|--------|
| **Priority** | **P2 - MEDIUM** |
| **Impact** | Medium-High for Korean audience. Without Naver Search Advisor verification, the site cannot be submitted to Naver's index, cannot access Naver crawl diagnostics, and loses visibility on Korea's dominant search engine. |
| **Current State** | No `<meta name="naver-site-verification" content="...">` tag exists in the document head. |
| **Desired State** | Naver verification meta tag is present on all pages, and the site is registered in Naver Search Advisor. |
| **Affected Files** | `BaseLayout.astro` (head section). |
| **Affected Pages** | All pages (tag goes in shared layout head). |
| **Recommended Fix** | 1. Register the site at [Naver Search Advisor](https://searchadvisor.naver.com/). 2. Obtain the verification meta tag code. 3. Add the meta tag to `BaseLayout.astro` inside `<head>`. 4. Submit the sitemap URL through Naver Search Advisor. |

---

## Issue #8 — FAQ Content Pattern Similarity Across Venues

| Field | Detail |
|-------|--------|
| **Priority** | **P2 - MEDIUM** |
| **Impact** | Medium. If FAQ question/answer text follows the same sentence patterns with only the venue name swapped, search engines may treat the FAQ sections as boilerplate. This reduces the unique content ratio per page and can hurt FAQ rich result eligibility. |
| **Current State** | Some FAQ sections across venue pages begin with identical phrasing patterns, differing only in the venue or region name. |
| **Desired State** | FAQ content is sufficiently varied in sentence structure, vocabulary, and specificity that each page's FAQ section reads as genuinely unique. |
| **Affected Files** | Venue data files containing FAQ arrays, FAQ rendering components. |
| **Affected Pages** | Up to 130 venue pages with FAQ sections. |
| **Recommended Fix** | 1. Audit FAQ entries for duplicate sentence starts (first 10-15 characters). 2. Rewrite questions and answers that share patterns, varying sentence structure and including venue-specific details. 3. Add venue-specific FAQ items that are not templated (e.g., unique policies, nearby landmarks, special events). 4. Implement FAQ structured data (`FAQPage` schema) per page to maximize rich result eligibility. |

---

## Issue #9 — Missing Google Search Console Verification

| Field | Detail |
|-------|--------|
| **Priority** | **P2 - MEDIUM** |
| **Impact** | Medium. Without Google Search Console access, there is no visibility into indexing status, crawl errors, search performance data, or manual actions. This is a fundamental SEO operations requirement. |
| **Current State** | No `<meta name="google-site-verification" content="...">` tag exists in the document head. |
| **Desired State** | Google verification meta tag is present on all pages, and the site is registered in Google Search Console with the sitemap submitted. |
| **Affected Files** | `BaseLayout.astro` (head section). |
| **Affected Pages** | All pages (tag goes in shared layout head). |
| **Recommended Fix** | 1. Register the site at [Google Search Console](https://search.google.com/search-console/). 2. Choose HTML meta tag verification method and obtain the code. 3. Add the meta tag to `BaseLayout.astro` inside `<head>`. 4. Submit the sitemap URL through Google Search Console. 5. Monitor the Index Coverage report after deployment. |

---

## Issue #10 — Weak Internal Cross-Linking Between Venue Types and Regions

| Field | Detail |
|-------|--------|
| **Priority** | **P3 - LOW** |
| **Impact** | Low-Medium. Current venue detail pages link to related venues but primarily within the same type. Cross-links between types (club to lounge in the same region) and between regions (same chain, different locations) are sparse, limiting crawl path diversity and PageRank distribution. |
| **Current State** | Venue pages include a "related venues" section linking to same-type venues. Cross-type and cross-region linking is minimal. |
| **Desired State** | Each venue page includes links to: (a) same-type venues in the same region, (b) different-type venues in the same region, and (c) same brand/chain venues in other regions where applicable. |
| **Affected Files** | Venue detail templates (related venues section), venue data files (relationship metadata). |
| **Affected Pages** | ~130 venue detail pages. |
| **Recommended Fix** | 1. Extend venue data with cross-type and cross-region relationship fields. 2. Add a "nearby venues" or "also in this area" section that includes different venue types. 3. Add breadcrumb navigation (region > type > venue) to improve hierarchical linking. 4. Ensure anchor text in internal links includes the target venue's store name and region for keyword relevance. |

---

## Summary Matrix

| # | Issue | Priority | Pages Affected | Effort |
|---|-------|----------|----------------|--------|
| 1 | Wrong domain in codebase | P0 | All (187+) | Low (find & replace) |
| 2 | Static sitemap | P1 | All (187+) | Low (add integration) |
| 3 | Brand name inconsistency | P1 | All (187+) | Low (string replace) |
| 4 | Store name not leading titles | P1 | ~130 | Medium (data audit) |
| 5 | Missing OG images | P2 | ~150+ | Medium (fallback logic + asset) |
| 6 | Structural page similarity | P2 | ~130 | High (template refactor) |
| 7 | Missing Naver verification | P2 | All | Low (add meta tag) |
| 8 | FAQ content pattern similarity | P2 | ~130 | High (content rewrite) |
| 9 | Missing Google SC verification | P2 | All | Low (add meta tag) |
| 10 | Weak internal cross-linking | P3 | ~130 | Medium (template + data) |

---

## Recommended Execution Order

1. **Immediate (P0):** Fix domain references (Issue #1) -- nothing else matters until canonical URLs are correct.
2. **Day 1-2 (P1):** Fix brand name (Issue #3), then sitemap generation (Issue #2), then title audit (Issue #4).
3. **Week 1 (P2):** Add verification tags (Issues #7, #9), implement OG image fallback (Issue #5), begin FAQ diversification (Issue #8), address structural similarity (Issue #6).
4. **Ongoing (P3):** Enhance internal linking (Issue #10) as part of regular content updates.
