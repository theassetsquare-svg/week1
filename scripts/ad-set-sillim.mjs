#!/usr/bin/env node
// 가게 전용 사이트(dd) — 빌드 맨 끝 단계. 전용22-8(2026-10-06): 신림그랑프리나이트 쪽 한 쪽에 광고주 세트(담당 쌍코피)를 넣는다.
//   틀(src/pages/venue/[slug].astro · src/layouts/BaseLayout.astro)은 다른 쪽과 같이 쓰므로 고치지 않고,
//   빌드 결과 dist/venue/sinlim-grandprix/index.html 한 파일만 고친다(정적 쪽 — 크롤러와 사람이 같은 글을 본다).
//   의존성 0(node 내장만). 찾을 자리를 하나라도 못 찾으면 무엇을 못 찾았는지 찍고 종료코드 1(반쪽짜리가 올라가지 않게).
//   이미 넣은 파일에 다시 돌리면 그대로 둔다(멱등). 주소 · <title> · h1 글자 · canonical · og:url 은 바꾸지 않는다(앞뒤를 견줘 다르면 종료 1).
// 쓰는 법: node scripts/ad-set-sillim.mjs [뿌리 폴더]   (뿌리 = 기본 dist · 환경변수 AD_SET_ROOT 로도 바꿀 수 있음)
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.argv[2] || process.env.AD_SET_ROOT || 'dist';
const PAGE = join(ROOT, 'venue', 'sinlim-grandprix', 'index.html');
const HOST = 'https://dd.nolcool.com';
const NAME = '신림그랑프리나이트';
const NICK = '쌍코피';
const PHONE = '010-7352-1606';
const TEL = 'tel:01073521606';
const LD_TEL = '+82-10-7352-1606';
const ALT = `${NAME} ${NICK} ${PHONE} 광고문의 카톡 besta12`;
const BAR_TEXT = `${NAME} 예약 · ${NICK} ${PHONE}`;
const NOTICE = `이 페이지는 광고이며, 업소 제공 정보를 받아 실었습니다(담당 ${NICK}). 확인일 2026-10-06. 실린 내용은 사정에 따라 바뀔 수 있습니다.`;
// PC(768px 이상)에서 global.css 가 has-phone 바를 max-width:360px(border-box · 좌우 24px)로 줄이는데, 바 글자는 18px 로 약 412px 라 넘친다.
//   이 쪽만 PC 에서 상한을 푼다(바는 right:24px · width:auto 라 글자 폭만큼 넓어짐). 768px 아래는 global.css 그대로(최대 480px · 가운데).
// 틀의 아래 안내 창 둘(.slide-up-banner · .scroll-banner)은 숨은 상태가 translateY(100%) 인데 자리가 bottom:92px 라, 숨어 있을 때도 위쪽 92px 가
//   화면 아래에 떠서(z-index 98·97) 폰 화면의 고정 전화바(z-index 49)를 덮는다(2026-10-07 로컬 화면 · 라이브 같은 틀 쪽 실측).
//   이 쪽만 숨은 상태를 화면 밖까지 내린다(.show 가 붙어 올라올 때는 틀 그대로 — 글자·요소는 손대지 않음).
const BAR_PC_STYLE = '<style>@media (min-width:768px){a.phone-bar.has-phone{max-width:none}}.slide-up-banner:not(.show),.scroll-banner:not(.show){transform:translateY(calc(100% + 92px))}</style>';
// 확인 안 된 시각(영업시간으로 읽히는 글) — 검토 지적(2026-10-07). 틀([slug].astro:302 이름표 · 값 description)은 다른 쪽과 같이 쓰므로 이 쪽 결과에서만 뺀다.
//   넘김 사진 이름표는 글자(span)만 뺀다 — 슬라이드 6장과 넘김 스크립트(total = 6)는 그대로라 빈 칸이 생기지 않는다.
//   설명 첫 문장은 「…가속이 붙고, 새벽 2시에는 전부 전속력이다.」 한 문장이라 그 절만 떼면 문장이 끊긴다 → 문장째 뺀다(새 글로 채우지 않음).
const TIME_DROP_LABELS = ['새벽 2시, 피크 타임', '라스트콜 직전의 에너지'];
const TIME_DROP_SENTENCES = ['시동 걸 듯 느릿하게 시작해서, 코너를 돌 때마다 가속이 붙고, 새벽 2시에는 전부 전속력이다.', '10시 넘으면 소파는 없다고 보면 된다.'];
const TIME_RE = /새벽 ?\d+시|\d+시 넘으면|라스트콜/;
const MARK = '<!-- ad-set-sillim -->';
const TAG = '[ad-set-sillim]';

function stop(msg) { console.error(`${TAG} 실패 — ${msg}`); process.exit(1); }

if (!existsSync(PAGE)) stop(`쪽 파일이 없음: ${PAGE}`);
const ogDir = join(ROOT, 'og');
if (!existsSync(ogDir)) stop(`카드 폴더가 없음: ${ogDir}`);
const cards = readdirSync(ogDir).filter((f) => /^sillim-grandprix-night-[0-9a-f]{8}\.png$/.test(f));
if (cards.length !== 1) stop(`카드(sillim-grandprix-night-<8자리>.png)가 ${ogDir} 에 1개여야 하는데 ${cards.length}개: ${cards.join(', ')}`);
const CARD = cards[0];
const CARD_PATH = `/og/${CARD}`;
const CARD_URL = `${HOST}${CARD_PATH}`;

const before = readFileSync(PAGE, 'utf8');

function ident(h) {
  const g = (re) => { const m = h.match(re); return m ? m[1] : null; };
  return {
    title: g(/<title>([^<]*)<\/title>/),
    h1: g(/<h1\b[^>]*>([^<]*)<\/h1>/),
    canonical: g(/<link rel="canonical" href="([^"]*)"/),
    ogurl: g(/<meta property="og:url" content="([^"]*)"/),
  };
}
const id0 = ident(before);
for (const [k, v] of Object.entries(id0)) if (!v) stop(`처음 판에서 ${k} 를 못 찾음`);
if (id0.canonical !== `${HOST}/venue/sinlim-grandprix/`) stop(`canonical 이 예상과 다름: ${id0.canonical}`);

// ── 이미 넣은 파일이면 확인만 하고 그대로 둔다(멱등) ──
function verify(h) {
  const bad = [];
  if (!h.includes(`href="${TEL}" class="phone-bar has-phone"`) || !h.includes(`>${BAR_TEXT}</a>`)) bad.push('전화바');
  if (!/<span class="ad-label"[^>]*>광고<\/span>19세 미만 출입 금지<\/p>\s*<h1\b/.test(h)) bad.push('h1 바로 앞 광고 표시');
  if (!h.includes(`"telephone":"${LD_TEL}"`)) bad.push('JSON-LD telephone');
  if (!h.includes(`<meta property="og:image" content="${CARD_URL}">`)) bad.push('og:image');
  if (!h.includes(`<meta name="twitter:image" content="${CARD_URL}">`)) bad.push('twitter:image');
  if (!h.includes(`<meta property="og:image:alt" content="${ALT}">`)) bad.push('og:image:alt');
  if (!h.includes(`<img src="${CARD_PATH}" alt="${ALT}" width="1200" height="1200"`)) bad.push('본문 카드 img');
  if (!h.includes(NOTICE)) bad.push('관계 고지');
  if (!h.includes(`${BAR_PC_STYLE}</head>`)) bad.push('PC 전화바 폭');
  for (const t of [...TIME_DROP_LABELS, ...TIME_DROP_SENTENCES]) if (h.includes(t)) bad.push(`확인 안 된 시각 「${t}」 남음`);
  const tm = h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').match(TIME_RE);
  if (tm) bad.push(`확인 안 된 시각 「${tm[0]}」 남음(보이는 글자)`);
  if (/<p class="tp-desc"[^>]*>\s*<\/p>/.test(h)) bad.push('빈 설명 문단');
  if (/<span class="sg-label"[^>]*>\s*<\/span>/.test(h)) bad.push('빈 사진 이름표');
  return bad;
}
if (before.includes(MARK)) {
  const bad = verify(before);
  if (bad.length) stop(`표식은 있는데 빠진 자리: ${bad.join(' · ')}`);
  console.log(`${TAG} 이미 넣음 — 그대로 둠 (${PAGE} · 카드 ${CARD})`);
  process.exit(0);
}

const missing = [];
let h = before;

// 정확히 한 군데만 바꾼다. 못 찾거나 여러 군데면 missing 에 적는다.
function once(label, re, repl) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const n = (h.match(g) || []).length;
  if (n !== 1) { missing.push(`${label}(찾은 수 ${n})`); return; }
  h = h.replace(new RegExp(re.source, re.flags.replace('g', '')), repl);
}
// 여는 태그(re 의 맨 앞)부터 짝이 맞는 닫는 태그까지 통째로 뺀다. optional 이면 없을 때 넘어간다.
function removeEl(label, re, optional = false) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const all = [...h.matchAll(g)];
  if (all.length === 0 && optional) return false;
  if (all.length !== 1) { missing.push(`${label}(찾은 수 ${all.length})`); return false; }
  const start = all[0].index;
  const tm = h.slice(start).match(/^<([a-zA-Z][a-zA-Z0-9]*)\b/);
  if (!tm) { missing.push(`${label}(여는 태그 아님)`); return false; }
  const tag = tm[1].toLowerCase();
  const tr = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  tr.lastIndex = start;
  let depth = 0, end = -1, m;
  while ((m = tr.exec(h))) {
    if (m[1] === '/') { depth--; if (depth === 0) { end = m.index + m[0].length; break; } }
    else if (!m[0].endsWith('/>')) depth++;
  }
  if (end < 0) { missing.push(`${label}(닫는 태그 못 찾음)`); return false; }
  h = h.slice(0, start) + h.slice(end);
  return true;
}
const A = '(?: data-astro-cid-[a-z0-9]+)*'; // Astro 범위 속성(있어도 없어도)
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ① og · twitter 그림
once('og:image', /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${CARD_URL}">`);
once('og:image:width', /<meta property="og:image:width" content="[^"]*">/, '<meta property="og:image:width" content="1200">');
once('og:image:height', /<meta property="og:image:height" content="[^"]*">/, '<meta property="og:image:height" content="1200">');
once('og:image:alt', /<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${ALT}">`);
once('twitter:card', /<meta name="twitter:card" content="[^"]*">/, '<meta name="twitter:card" content="summary_large_image">');
once('twitter:image', /<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${CARD_URL}">`);

// ② JSON-LD — NightClub 에 telephone · 새 카드 · 확인된 주소 / FAQPage 는 보이는 문답과 같게
const FAQ_DROP = ['신림역에서 어떻게 가나요?', '가격대는 어떤가요?', `${NAME} 주차가 되나요?`, `${NAME} 영업 시간은 어떻게 되나요?`];
const FAQ_DROP_REQUIRED = FAQ_DROP.slice(1);
const FAQ_BOOK_Q = `${NAME} 예약 방법이 궁금합니다`;
const FAQ_BOOK_A = `담당 ${NICK} ${PHONE}으로 전화하면 됩니다.`;
{
  const ldRe = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  const lds = [...h.matchAll(ldRe)];
  if (lds.length !== 1) missing.push(`JSON-LD 덩이(찾은 수 ${lds.length})`);
  else {
    let data = null;
    try { data = JSON.parse(lds[0][1]); } catch (e) { missing.push('JSON-LD 읽기(JSON.parse 실패)'); }
    if (data) {
      const nodes = Array.isArray(data) ? data : [data];
      const clubs = nodes.filter((n) => n && n['@type'] === 'NightClub');
      if (clubs.length !== 1) missing.push(`JSON-LD NightClub 노드(찾은 수 ${clubs.length})`);
      else {
        const c = clubs[0];
        const oldImg = c.image;
        c.telephone = LD_TEL;
        c.image = CARD_URL;
        c.address = { '@type': 'PostalAddress', streetAddress: '신림로 340', addressLocality: '관악구', addressRegion: '서울', addressCountry: 'KR' };
        delete c.openingHours;
        delete c.openingHoursSpecification;
        for (const n of nodes) if (n !== c && n && oldImg && n.image === oldImg) n.image = CARD_URL;
      }
      const faqs = nodes.filter((n) => n && n['@type'] === 'FAQPage');
      if (faqs.length !== 1) missing.push(`JSON-LD FAQPage 노드(찾은 수 ${faqs.length})`);
      else {
        const f = faqs[0];
        const names = (f.mainEntity || []).map((q) => q.name);
        for (const q of FAQ_DROP_REQUIRED) if (!names.includes(q)) missing.push(`JSON-LD 문답 「${q}」`);
        f.mainEntity = (f.mainEntity || []).filter((q) => !FAQ_DROP.includes(q.name));
        const book = f.mainEntity.find((q) => q.name === FAQ_BOOK_Q);
        if (!book) missing.push(`JSON-LD 문답 「${FAQ_BOOK_Q}」`);
        else book.acceptedAnswer = { '@type': 'Answer', text: FAQ_BOOK_A };
      }
      const out = JSON.stringify(data).replace(/<\//g, '<\\/');
      h = h.slice(0, lds[0].index) + `<script type="application/ld+json">${out}</script>` + h.slice(lds[0].index + lds[0][0].length);
    }
  }
}

// ③ h1 바로 앞 「광고」 표시(+19세 미만 출입 금지)
once('h1 바로 앞', new RegExp(`(<div class="vh-badge"${A}>[^<]*</div>\\s*)(<h1\\b[^>]*>${esc(id0.h1)}</h1>)`),
  `$1<p class="ad-g" style="margin:10px 0 0;font-size:13px;font-weight:700;color:#fff;"><span class="ad-label" style="display:inline-block;margin-right:6px;padding:1px 8px;border:1px solid #fff;border-radius:4px;font-size:12px;">광고</span>19세 미만 출입 금지</p>$2`);

// ④ 본문 첫 그림(히어로) → 새 카드 (h1 뒤 · 첫 h2 앞 · lazy 없음)
once('히어로 그림', new RegExp(`<img src="/og/sinlim-grandprix\\.png" alt="[^"]*" width="1200" height="630" loading="lazy" class="vh-img"(${A})>`),
  `<img src="${CARD_PATH}" alt="${ALT}" width="1200" height="1200" class="vh-img" style="aspect-ratio:1/1;height:auto;"$1>`);

// ⑤ 아래 고정 바 → tel 바(이 틀의 전화 있는 꼴 phone-bar has-phone)
once('아래 고정 바', new RegExp(`<a href="https://nolcool\\.com" target="_blank" rel="noopener noreferrer" class="phone-bar no-phone"(${A})>[^<]*</a>`),
  `<a href="${TEL}" class="phone-bar has-phone" style="font-size:clamp(13px,3.9vw,18px);letter-spacing:0;white-space:nowrap;"$1>${BAR_TEXT}</a>`);
once('머리 끝(PC 전화바 폭)', /<\/head>/, `${BAR_PC_STYLE}</head>`);

// 문의 칸 → 담당 쌍코피 전화(예약·문의 창구)
{
  const m = h.match(new RegExp(`(<div class="tab-panel"${A} id="tab-price"${A}>\\s*<h2 class="tp-title"${A}>[^<]*</h2>\\s*)<div style="text-align:center;padding:20px;"${A}>\\s*<p[^>]*>전화로 문의하세요</p>\\s*<p[^>]*>상세 페이지에서 연락처 확인</p>\\s*</div>`, 'g'));
  if (!m || m.length !== 1) missing.push(`문의 칸(찾은 수 ${m ? m.length : 0})`);
  else h = h.replace(new RegExp(`(<div class="tab-panel"${A} id="tab-price"${A}>\\s*<h2 class="tp-title"${A}>[^<]*</h2>\\s*)<div style="text-align:center;padding:20px;"${A}>\\s*<p[^>]*>전화로 문의하세요</p>\\s*<p[^>]*>상세 페이지에서 연락처 확인</p>\\s*</div>`),
    `$1<div style="text-align:center;padding:20px;"><a href="${TEL}" class="btn btn-primary btn-block">담당 ${NICK} ${PHONE} 전화하기</a></div>`);
}

// VS 표 · 아래 비교 표의 담당 칸(이 쪽 몫 「—」 → 쌍코피)
once('VS 표 담당 칸', new RegExp(`(<td class="vs-label"${A}>담당</td><td${A}>)—(</td>)`), `$1${NICK}$2`);
once('비교 표 담당 칸', new RegExp(`(<div class="cb-label"${A}>담당</div> <div class="cb-col"${A}>)—(</div>)`), `$1${NICK}$2`);

// 보이는 문답 — 영업시간 · 요금 · 주차 · 확인 안 된 출구 문답 빼기, 예약 문답은 담당 쌍코피로
const faqItem = (q) => new RegExp(`<div class="faq-item"${A}>\\s*<div class="faq-q"${A}>${esc(q)}</div>`);
removeEl('문답 신림역 출구', faqItem(FAQ_DROP[0]), true);
for (const q of FAQ_DROP_REQUIRED) removeEl(`문답 「${q}」`, faqItem(q));
once('예약 문답 답', new RegExp(`(<div class="faq-q"${A}>${esc(FAQ_BOOK_Q)}</div>\\s*<div class="faq-a"${A}>)[^<]*(</div>)`), `$1${FAQ_BOOK_A}$2`);

// ⑦ 세트와 어긋나거나 확인 안 된 글 빼기
once('설명 「새벽 3시까지」 문단', new RegExp(`<p class="tp-desc"${A}>체크 플래그가 내려오는 새벽 3시까지[^<]*</p>`), '');
for (const t of TIME_DROP_LABELS) once(`넘김 사진 이름표 「${t}」`, new RegExp(`<span class="sg-label"${A}>${esc(t)}</span>`), '');
for (const s of TIME_DROP_SENTENCES) once(`설명 문장 「${s.slice(0, 20)}…」`, new RegExp(`(<p class="tp-desc"${A}>[^<]*?)${esc(s)}\\s*`), '$1');
removeEl('인기시간 탭 단추', new RegExp(`<button class="tab-btn"${A} data-tab="popular"${A}>`));
removeEl('요일별 인기도 · 시간대별 안내 칸', new RegExp(`<div class="tab-panel"${A} id="tab-popular"${A}>`));
// 시간대 칸은 이제 기본정보 칸에 하나만 남는다(값이 비어도 · 차 있어도 통째로 뺀다)
once('타임라인 제목', new RegExp(`<h3 class="tp-sub"${A}>타임라인</h3>\\s*`), '');
removeEl('타임라인 칸', new RegExp(`<div class="timeline"${A}>`));
removeEl('이벤트 탭 단추', new RegExp(`<button class="tab-btn"${A} data-tab="event"${A}>`));
removeEl('이벤트 · 프로모션 칸', new RegExp(`<div class="tab-panel"${A} id="tab-event"${A}>`));
removeEl('찾아가는 길 걸리는 시간', new RegExp(`<div class="map-travel"${A}>`));
removeEl('VS 투표 물음', new RegExp(`<p class="tp-note"${A} style="margin:16px 0 8px;text-align:center;"${A}>어느 쪽이 더 핫할까\\?</p>`));
removeEl('VS 투표 칸', new RegExp(`<div class="vs-arena"${A} id="vsArena"${A}>`));
removeEl('VS 투표 결과', new RegExp(`<p class="tp-note"${A} id="vsResult"`));
removeEl('오늘 N명 조회', new RegExp(`<div class="view-counter"${A} id="viewCounter"${A}>`));
removeEl('지금 예약하면 N번째', new RegExp(`<div class="time-attack"${A} id="timeAttack"${A}>`));
removeEl('사장님만 아는 숨겨진 메뉴', new RegExp(`<section class="secret-section"${A} id="secretSection"`));
removeEl('리뷰 + 실시간 순위 띠', new RegExp(`<div class="cta-section"${A} style="margin:24px 0;"${A}>\\s*<h3${A}>[^<]*리뷰 \\+ 실시간 순위</h3>`));
removeEl('리뷰 인용 3줄', new RegExp(`<div class="blur-lock"${A}>`));
removeEl('할인 쿠폰', new RegExp(`<div class="coupon-lock"${A}>`));
removeEl('복장 가이드', new RegExp(`<div class="insider-card"${A}>\\s*<span class="insider-icon"${A}>[^<]*</span>\\s*<h4${A}>복장 가이드</h4>`));
removeEl('예산 가이드', new RegExp(`<div class="insider-card"${A}>\\s*<span class="insider-icon"${A}>[^<]*</span>\\s*<h4${A}>예산 가이드</h4>`));
removeEl('인사이더 팁 띄우기(첫 방문 혜택 등)', new RegExp(`<section class="insider-tip"${A} id="insiderTip"`));
removeEl('오늘 단 N명 문구', new RegExp(`<p class="scarcity-text"${A} id="scarcityText"`));
removeEl('다음 업소 자동 이동', new RegExp(`<section class="next-countdown"${A} id="nextCountdown"${A}>`));
removeEl('지금 N명 탐색 중', new RegExp(`<span style="margin-left:12px;color:var\\(--accent\\);font-weight:600;"${A} id="fomoCounter"${A}>`));
removeEl('예약 문의 들어옴 알림', new RegExp(`<div class="toast"${A} id="toast"${A}>`));
removeEl('떠오르는 알림(확인 안 된 혜택 · 마감 문구)', new RegExp(`<div class="var-reward"${A} id="varReward"${A}>`));

// ⑥ 관계 고지 — 본문 끝
once('본문 끝', /<\/main>/, `${MARK}<p class="ad-notice" style="margin:24px 0 8px;padding:12px 16px;font-size:13px;line-height:1.6;color:var(--text-secondary);text-align:center;border-top:1px solid var(--border);">${NOTICE}</p></main>`);

if (missing.length) stop(`못 찾은 자리 ${missing.length}곳 — ${missing.join(' · ')} (${PAGE} 는 쓰지 않음)`);

const id1 = ident(h);
for (const k of Object.keys(id0)) if (id0[k] !== id1[k]) stop(`${k} 가 바뀜: 「${id0[k]}」 → 「${id1[k]}」 (쓰지 않음)`);
const bad = verify(h);
if (bad.length) stop(`넣은 뒤 확인에서 빠진 자리: ${bad.join(' · ')} (쓰지 않음)`);
const visible = h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
const phoneCount = visible.split(PHONE).length - 1;
if (phoneCount > 3) stop(`보이는 글자에 번호가 ${phoneCount}번(3번 이하여야 함)`);

writeFileSync(PAGE, h);
console.log(`${TAG} 넣음 — ${PAGE} · 카드 ${CARD} · ${before.length}B → ${h.length}B · 보이는 번호 ${phoneCount}번`);
