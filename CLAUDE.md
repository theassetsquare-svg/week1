# NOLCOOL Sub — Single Store Nightlife Site
## MUST
- DELETE all shared content pools! Write UNIQUE content for EACH venue! Time does not matter! SEO is #1!
- base: "/" ONLY. BrowserRouter ONLY. No # in URL
- Store name FIRST in title. No "놀쿨" in title!
- Keyword density 1.5-2.5% (1000c=5-7x, 2000c=8-12x)
- Mobile: 16px font, 1.7 line-height, 44px touch
- useEffect cleanup ALL. persistSession:true. ErrorBoundary
- Bestseller writing. No AI text.
- All links open in new tab! target="_blank" rel="noopener noreferrer" Internal search ONLY

★★★ TITLE RULES — NO DUPLICATE WORDS! ★★★
Homepage ONLY: "놀쿨 — hook title"
ALL other pages: Store name + hook. NO 놀쿨! NO same word twice!
WRONG: "장안동호빠 장안동호빠" → DELETE duplicate!
WRONG: "강남클럽 레이스 강남 최고" → "강남" twice → DELETE!
RIGHT: "강남클럽 레이스 — 한번 가면 단골 되는 이유"
RIGHT: "장안동호빠 — 직접 가본 사람만 아는 진짜 이야기"
meta description: 150 chars. Store name + hooking. NO duplicate words!
Check EVERY page title. Same word appears twice = DELETE immediately!
Do NOT ask. Just fix. Report all titles when done.
- react-helmet-async for unique title/meta per page! SPA bots fix!
- Every page UNIQUE hookTitle! No duplicate titles! Fix gold-content.ts!
## SEO 2026
- title: Store name + hook. Under 60 chars
- meta: 150 chars. H1+H2 with store name 3+ times
- Schema: JSON-LD NightClub. og:image: real photo + nickname
- sitemap.xml + robots.txt + llms.txt
- Core Web Vitals: LCP<2.5s, INP<200ms, CLS<0.1
- E-E-A-T: real experience tone. Canonical URL. NEVER duplicate title/content across domains!. og:image 1200x1200 (1:1) every page!

- NEVER use shared content pools! Write UNIQUE 1000+ chars per venue! Takes time = OK! SEO = #1 priority!
- Time does not matter! Write UNIQUE 1000+ chars per venue! SEO > speed!
## NEVER
- Auto page transition. Next.js. Change URLs
- Brand path. Stuffing. Baby/family/kids images. No family content (parents birthday/family gathering/reunion/anniversary = DELETE!). Banned adult words (adult/prostitution/illegal = DELETE ALL!). Adult words
