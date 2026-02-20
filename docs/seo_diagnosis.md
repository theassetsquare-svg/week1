# SEO/AEO 진단 리포트

## 사이트 개요
- 도메인: https://week1-6m5.pages.dev
- 프레임워크: Astro 4.16.0 (SSG)
- 총 가게 페이지: 130개 (클럽 50, 나이트 60, 라운지 20)
- 배포: Cloudflare Pages

## 핵심 문제 TOP 10

| 순위 | 문제 | 영향도 | 원인 파일 | 상태 |
|------|------|--------|-----------|------|
| 1 | 가게 상세페이지에 JSON-LD 없음 (LocalBusiness/FAQPage/BreadcrumbList) | 🔴 심각 | src/pages/club/night/lounge [venueSlug].astro | 미수정 |
| 2 | robots.txt에 네이버 Yeti 봇 미명시 | 🟡 중요 | public/robots.txt | 미수정 |
| 3 | 내부 링크에 target="_blank" (내부 페이지인데 새탭으로 열림 - SEO/UX 모두 문제) | 🟡 중요 | src/pages/*/[regionSlug]/[venueSlug].astro | 미수정 |
| 4 | H1이 name_display 그대로 (SEO 최적화 H1이 아님) | 🟡 중요 | src/pages/*/[regionSlug]/[venueSlug].astro | 미수정 |
| 5 | FAQ에 가게이름 누락 (fix-venue-repetition이 과도하게 제거) | 🟡 중요 | scripts/fix-venue-repetition.mjs | 부분수정 |
| 6 | 페이지간 본문 유사도 높음 (같은 템플릿 문장 반복) | 🟡 중요 | scripts/parse-venues.mjs | 부분수정 |
| 7 | 가게이름 브랜드 등장 횟수 불균형 (일부 섹션 0회) | 🟡 중요 | scripts/fix-venue-repetition.mjs | 부분수정 |
| 8 | sitemap.xml에 lastmod 날짜 불일치 가능성 | 🟢 경미 | scripts/generate-sitemap.mjs | 미확인 |
| 9 | 이미지가 SVG 일러스트 (실제 사진 아님) - 이미지 검색 노출 제한 | 🟢 경미 | data/venues.json images | 구조적한계 |
| 10 | search_index.json에 description 필드 없음 | 🟢 경미 | scripts/generate-search-index.mjs | 미수정 |

## 상세 분석

### 1. JSON-LD 구조화 데이터 누락 (🔴 심각)
가게 상세페이지 130개 모두에 JSON-LD가 없음. 구글/네이버 리치 결과(FAQ 스니펫, 빵부스러기, 장소 정보)를 받을 수 없음.
- 필요한 스키마: WebPage, BreadcrumbList, FAQPage
- 원인: 3개 템플릿(club/night/lounge)에 JSON-LD 코드 미작성

### 2. robots.txt 네이버 미대응
네이버 검색로봇(Yeti) 전용 지시문이 없음. User-agent: Yeti를 명시적으로 추가해야 네이버 수집 안정성 향상.

### 3. 내부 링크 target="_blank" 문제
가게 상세페이지의 빵부스러기, CTA, 관련 가게 링크가 모두 target="_blank"로 새탭 열림.
- SEO: 크롤러에는 영향 없으나 UX/체류시간에 불리
- 내부 페이지 링크는 같은 탭에서 열리는 것이 표준

### 4. H1 SEO 최적화 부족
현재 H1은 name_display 그대로(예: "강남 레이스 클럽").
검색 의도를 반영한 H1이 더 효과적(예: "강남 레이스 클럽 방문 가이드").

### 5. FAQ 가게이름 누락
fix-venue-repetition.mjs가 FAQ에서 가게이름을 거의 전부 제거.
FAQ 질문에 가게이름이 없으면 FAQPage 스키마에서 검색 노출력이 떨어짐.

### 6. 페이지간 유사도
같은 템플릿 기반 문장이 여러 페이지에서 반복됨. 구글 중복 콘텐츠 필터에 걸릴 수 있음.

## 수정 계획
Phase 1-8에 걸쳐 순차 수정 후 QA 게이트 통과 시 자동 배포.
