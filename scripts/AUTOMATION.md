# 놀쿨 SEO 자동화 시스템

이 사이트(`https://week1-6m5.pages.dev`)의 SEO·색인·헬스체크를 **사람이 신경 쓰지 않아도**
유지하도록 만든 자동화입니다. 모두 외부 의존성 없이 Node 20 + 내장 모듈로 동작합니다.

## 구성요소

| 스크립트 | npm | 역할 |
|---|---|---|
| `scripts/seo-audit.mjs` | `npm run seo:audit` | 빌드된 `dist/` 전 페이지 SEO 감사 → 점수/100, 중복 타이틀(카니발리제이션)·메타·H1, 누락 canonical/JSON-LD/OG 등. `seo-audit-report.json` 생성 |
| `scripts/gsc-report.mjs` | `npm run gsc:report` | Google Search Console 실데이터: 상위 쿼리·페이지·순위, **5~20위 상위노출 기회**, 카니발리제이션. `.secrets/gsc-report.json` |
| `scripts/auto-seo.mjs` | `npm run seo:monitor:all` | 통합 모니터: 감사 + GSC + **라이브 헬스체크**(주요 URL HTTP) → `.secrets/monitor-state.json` + `monitor-alert.md`. 문제 있으면 exit 1 |
| `scripts/auto-fix.mjs` | `npm run seo:autofix` | 안전·반복가능 자동수정: 재빌드 → 재감사 → **sitemap GSC 재제출** |
| `scripts/seo-cron.sh` | `npm run seo:cron` | 무인 오케스트레이터: pull → 모니터 → 문제 시 auto-fix → commit/push(자동 배포) → sitemap 재제출. 로그: `.secrets/seo-cron.log` |
| `scripts/lib/gsc-client.mjs` | — | GSC API 클라이언트(서비스계정 JWT, 무의존). 키: `.secrets/theasset-gsc.json`(gitignore) |

## 동작 흐름 (매 실행)

1. `git pull` 최신화
2. `auto-seo.mjs` 실행 — 점수<90·중복 타이틀·라이브 비정상(≠200)·sitemap 오류면 **action 필요(exit 1)**
3. action 필요 시 `auto-fix.mjs`로 재빌드+재감사+sitemap 재제출 → 변경 있으면 commit & push → Cloudflare Pages 자동 배포
4. 정상이면 sitemap만 재제출(색인 신선도 유지)
5. 결과를 `.secrets/monitor-alert.md`에 기록

## 스케줄 에이전트 런북 (Gmail 연동 부분)

스케줄로 도는 Claude 에이전트는 위 엔진을 돌린 뒤 **Gmail MCP**로 다음을 수행:

- `auto-seo.mjs` 결과(`monitor-alert.md`)에 🔴 오류가 있으면 → **`theassetsquare@gmail.com`로 알림 초안(draft) 생성**
  (Gmail MCP에는 발송 도구가 없어 **draft**까지 자동 생성, 클릭 한 번으로 발송)
- 받은편지함에서 사이트 문제 알림(Search Console 커버리지, Cloudflare 배포 실패, 5xx 등) 검색 →
  안전하게 고칠 수 있으면 수정·배포하고, 해당 메일을 **읽음 처리 + `놀쿨-처리완료` 라벨 + 보관(archive)**
  ⚠️ Gmail MCP에는 **영구 삭제 도구가 없음** → 삭제 대신 라벨/보관으로 대체

## 한계 (정직하게)

- 헤드리스(원격/cron) 실행에서는 대화형 인증 MCP(Gmail)가 **없을 수 있음**. 엔진(감사·GSC·배포)은 무인 동작하지만,
  Gmail 초안/트리아지는 인터랙티브 세션 또는 MCP가 유지되는 스케줄에서만 동작.
- "상위노출/순위"는 구글이 결정. 본 시스템은 **상위노출 조건을 100% 충족**시키고 sitemap을 계속 재제출하지만,
  실제 순위 상승은 색인 후 수일~수주 소요.

## 직접 실행

```bash
npm run seo:monitor:all   # 지금 상태 한눈에
npm run gsc:report        # 키워드·순위·기회
npm run seo:cron          # 무인 1회 사이클(수정·배포 포함)
```

## Stage 5 — Autopilot enrollment (2026-06-06)
- `scripts/autopilot-stages.mjs` — LIVE monitor for Stage 1-4 guarantees
  (risk words, one-blob >600c, CSS 404, dual-URL/nolcool 301, nolcool.com
  direct (no ilsanroom hop), build gates). Emits `[WEEK1-<TYPE>-<id>]`
  findings → `scripts/.secrets/stage-alert.md`. `--dry-run` supported.
  Wired into `seo-cron.sh` (runs daily via cloud routine `nolcool-seo-daily`).
- Build gates auto-applied to every (re)build, incl. new pages:
  `lint-copy.mjs` (risk/one-blob/read-time/fake-NAP) → `qa_gate_stage2.mjs`
  (CSS-exists/one-blob/dual-URL/title-meta) → `qa_funnel.mjs`
  (dead-link/orphan/dead-end/ilsanroom-hop/dark-pattern).
- `scripts/indexnow.mjs` — IndexNow ping (Bing/Yandex; NOT Google). Key file
  `public/<key>.txt`. Google recrawl = GSC sitemap resubmit (auto-fix.mjs).

### Owner 1-time setup (24h autopilot; shared with week2)
1. `wrangler login` (Cloudflare)
2. KV namespace for the shared Worker engine (if using week2's Worker)
3. Secrets: Resend API key (email), GSC service-account JSON (write scope
   `webmasters`), PSI API key (CWV/INP real metrics — currently 확인 불가)
4. `wrangler deploy`
Optional: GA4 (real dwell-time/체류 측정 — structural signals already 100).
