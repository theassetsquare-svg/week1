// 놀쿨70-1 — dd.nolcool.com 빌드 뒤 손질(소스·데이터는 그대로 두고 dist 만 고친다)
//
//   ① 일산명월관요정 두 쪽(/venue/ilsan-myeongwolgwan/ · /yojeong/ilsan/myeongwolgwan/)과 요정 목록
//      담당 = 신실장 010-3695-4929 — 옛 일산룸 총책임자 번호 010-4117-5556 은 어디에도 0(대표님 2026-10-04 04:35)
//      「광고」 표시와 19세 줄 · 아래 고정 전화바는 번호만(대표님 2026-10-08 21:34) · 1:1 카드
//   ② 해지된 연락처 → 광고문의 카카오톡 besta12(대표님 2026-10-25 01:28 · 지시서 전체57-1 ④)
//      울산챔피언나이트(춘자 010-5653-0069) · 일산룸(010-4117-5556 · 신실장 허용 쪽이 아님)
//      담당 줄·표 칸·아래 바 = 광고문의 그대로 · 문장 속 사람 구절만 뺀다 · JSON-LD telephone 뺌 · 광고문의 1:1 카드
//   ③ 다른 쪽에 남은 같은 연락처 — 목록 다섯 쪽 · 광주첨단엠파 문단 · 해운대고구려 비교 칸 · og 그림 셋(svg 고치고 png 다시 그림)
//
//   자리를 하나라도 못 찾으면 아무것도 쓰지 않고 종료 1 → 빌드 실패 → 라이브는 그대로
//   이미 고친 dist(표지가 있음)는 확인만 한다 — 두 번 돌려도 같다
//   node scripts/ad-set-n70.mjs [dist]        (N70_SHARP=<sharp 경로> 로 다른 sharp 를 쓸 수 있음 · 시험용)
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createRequire } from 'node:module';

const ROOT = process.argv[2] || process.env.AD_SET_ROOT || 'dist';
const HOST = 'https://dd.nolcool.com';
const MAIN_SITE = 'https://nolcool.com';
const TAG = '[ad-set-n70]';
const MARK = '<!-- ad-set-n70 -->';
function stop(msg) { console.error(`${TAG} 실패 — ${msg}`); process.exit(1); }
if (!existsSync(join(ROOT, 'index.html'))) stop(`dist 가 아님(index.html 없음): ${ROOT}`);

const NICK = '신실장';
const PHONE = '010-3695-4929';
const OLD_R = '010-4117-5556';
const OLD_U = '010-5653-0069';
const INQ = '광고문의 카카오톡 besta12';
const ALT_M = `일산명월관요정 ${NICK} ${PHONE} 광고문의 카톡 besta12`;
const LARGE = '<meta name="robots" content="index, follow, max-image-preview:large">';
const AGE = '<p class="ad-g" style="margin:10px 0 0;font-size:13px;font-weight:700;color:#fff;"><span class="ad-label" style="display:inline-block;margin-right:6px;padding:1px 8px;border:1px solid #fff;border-radius:4px;font-size:12px;">광고</span>19세 미만 출입 금지</p>';
const NOTICE = `<p class="ad-notice" style="margin:24px 0 8px;padding:12px 16px;font-size:13px;line-height:1.6;color:var(--text-secondary);text-align:center;border-top:1px solid var(--border);">광고 · 예약·문의는 ${NICK} ${PHONE}</p>`;
const SHORT_U0 = '춘자 담당에게 전화 한 통이면 좌석부터 케이크까지 일사천리.';
const SHORT_U1 = '입구에 금색 트로피 장식이 서 있고, 무대는 권투 링처럼 로프를 둘렀다.';
const cut25 = (s) => `${s.substring(0, 25)}…`; // 순위 쪽 카드 설명 = 앞 25자 + …(src/pages/ranking/index.astro)

// dist 어디에도 남으면 안 되는 것 · 신실장이 나와도 되는 파일
const BAD = /5653[\s.\-]?0069|4117[\s.\-]?5556|01056530069|01041175556|춘자|일산룸\s*총책임자|미친 기억력|일산룸(?:한테|에게| 담당(?!자)| 바로 연결|이라는 사람)|일산명월관요정(?:에게| 담당(?!자)| 바로 연결)|담당: (?:일산룸|일산명월관요정)/;
const SIN = /신실장|3695[\s.\-]?4929|01036954929/;
const SIN_OK = new Set(['venue/ilsan-myeongwolgwan/index.html', 'yojeong/ilsan/myeongwolgwan/index.html', 'yojeong/index.html', 'og/ilsan-myeongwolgwan.svg']);

// 찾을 틀: § = astro cid 자리(첫 자리 값을 뒤 자리도 똑같이 가져야 함) · 태그 사이 빈칸 하나 = 빈칸 0개 이상
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function pat(t) {
  const parts = t.split('§').map((x) => esc(x).replace(/> </g, '>\\s*<'));
  let src = parts[0];
  for (let i = 1; i < parts.length; i++) src += (i === 1 ? '((?: data-astro-cid-[a-z0-9]+)*)' : '\\1') + parts[i];
  return new RegExp(src, 'g');
}
const fill = (t, cid) => t.split('§').join(cid);
function sub(h, miss, label, from, to, n = 1) {
  const re = from instanceof RegExp ? new RegExp(from.source, 'g') : pat(from);
  const all = [...h.matchAll(re)];
  if (all.length !== n) { miss.push(`${label}(찾은 수 ${all.length} · 기대 ${n})`); return h; }
  const cid = typeof from === 'string' && from.includes('§');
  if (!cid && to.includes('§')) stop(`${label}: 틀 잘못(바꿀 글에만 §)`);
  return h.replace(re, (...a) => fill(to, cid ? a[1] : ''));
}
function swap(h, miss, label, from, to, n) {
  const c = h.split(from).length - 1;
  if (c !== n) { miss.push(`${label}(찾은 수 ${c} · 기대 ${n})`); return h; }
  return h.split(from).join(to);
}
// 여는 태그부터 짝이 맞는 닫는 태그까지 뺀다
function removeEl(h, miss, label, startTpl) {
  const all = [...h.matchAll(pat(startTpl))];
  if (all.length !== 1) { miss.push(`${label}(찾은 수 ${all.length} · 기대 1)`); return h; }
  const start = all[0].index;
  const tag = h.slice(start).match(/^<([a-zA-Z][a-zA-Z0-9]*)\b/)[1].toLowerCase();
  const tr = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  tr.lastIndex = start;
  let depth = 0, end = -1, m;
  while ((m = tr.exec(h))) {
    if (m[1] === '/') { depth--; if (depth === 0) { end = m.index + m[0].length; break; } } else if (!m[0].endsWith('/>')) depth++;
  }
  if (end < 0) { miss.push(`${label}(닫는 태그 없음)`); return h; }
  return h.slice(0, start) + h.slice(end);
}
const LD_RE = /(<script type="application\/ld\+json"[^>]*>)([\s\S]*?)<\/script>/g;
function ldOf(h) {
  const all = [...h.matchAll(LD_RE)];
  if (all.length !== 1) return null;
  try { return JSON.parse(all[0][2]); } catch { return null; }
}
function ldEdit(h, miss, label, fn) {
  const all = [...h.matchAll(LD_RE)];
  if (all.length !== 1) { miss.push(`${label} JSON-LD 덩이(찾은 수 ${all.length})`); return h; }
  let d;
  try { d = JSON.parse(all[0][2]); } catch { miss.push(`${label} JSON-LD 읽기 실패`); return h; }
  if (JSON.stringify(d) !== all[0][2]) { miss.push(`${label} JSON-LD 를 다시 묶으면 글자가 달라짐`); return h; }
  if (!Array.isArray(d)) { miss.push(`${label} JSON-LD 꼴(배열 아님)`); return h; }
  fn(d);
  const txt = JSON.stringify(d);
  if (/<\/script/i.test(txt)) { miss.push(`${label} JSON-LD 안에 </script`); return h; }
  return h.slice(0, all[0].index) + all[0][1] + txt + '</script>' + h.slice(all[0].index + all[0][0].length);
}
const nodeOf = (d, type) => d.filter((n) => n && n['@type'] === type);
function faqSet(d, miss, label, oldA, newA) {
  const f = nodeOf(d, 'FAQPage');
  const qs = f.length === 1 ? (f[0].mainEntity || []).filter((q) => q.acceptedAnswer && q.acceptedAnswer.text === oldA) : [];
  if (qs.length !== 1) { miss.push(`${label} JSON-LD FAQ 답(찾은 수 ${qs.length})`); return; }
  qs[0].acceptedAnswer.text = newA;
}
function faqDrop(d, miss, label, qName) {
  const f = nodeOf(d, 'FAQPage');
  const list = f.length === 1 ? f[0].mainEntity || [] : [];
  const idx = list.map((q, i) => (q.name === qName ? i : -1)).filter((i) => i >= 0);
  if (idx.length !== 1) { miss.push(`${label} JSON-LD FAQ 물음(찾은 수 ${idx.length})`); return; }
  list.splice(idx[0], 1);
}
// 키 순서를 지키며 after 다음에 끼움
function putAfter(o, after, k, v) {
  const r = {};
  for (const [kk, vv] of Object.entries(o)) { if (kk !== k) r[kk] = vv; if (kk === after) r[k] = v; }
  if (!(k in r)) r[k] = v;
  return r;
}
function cardOf(prefix) {
  const ogDir = join(ROOT, 'og');
  if (!existsSync(ogDir)) stop(`카드 폴더 없음: ${ogDir}`);
  const re = new RegExp(`^${esc(prefix)}-[0-9a-f]{8}\\.png$`);
  const cards = readdirSync(ogDir).filter((f) => re.test(f));
  if (cards.length !== 1) stop(`카드(${prefix}-<8자리>.png)가 1개여야 하는데 ${cards.length}개`);
  return cards[0];
}
const visibleFaq = (h) => [...h.matchAll(/<div class="faq-a"[^>]*>([\s\S]*?)<\/div>/g)].map((m) => m[1].trim());
const firstImgInMain = (h) => { const i = h.indexOf('<main'); return i < 0 ? '' : (h.slice(i).match(/<img\b[^>]*>/) || [''])[0]; };

// ───────── 쪽마다 할 일 ─────────
const VENUE_DEMOTE = [
  {
    rel: 'venue/ulsan-champion/index.html', slug: 'ulsan-champion', name: '울산챔피언나이트', nick: '춘자', phone: OLD_U,
    card: 'ulsan-champion-card', alt: '울산챔피언나이트 광고문의 카톡 besta12', heroAlt: '울산챔피언나이트 나이트 울산',
    title0: '울산챔피언나이트 — 춘자 담당에게 전화 한 통이면 좌석부터 케이크까지 일사천리',
    title1: '울산챔피언나이트 — 트로피 장식과 토요일 노래 챔피언십',
    desc0: '울산챔피언나이트 — 자리 잡아줄게, 뭐 좋아해, 몇 명이야 — 물어볼 거 다 물어보고 전화를 끊으면 이미 모든 게 세팅되어 있다. 트로피 장식과 골드 앤 블랙 인테리어가 챔피언의 격을 표현한다. 울산 나이트 현장 체험 가이드.',
    desc1: '울산챔피언나이트 — 입구에 금색 트로피 장식이 서 있고, 무대는 코너에 로프를 두른 권투 링 모양이다. 토요일 밤에는 노래 챔피언십이 열린다.',
    hl: ['춘자 담당의 친근한 응대', '토요일 노래 챔피언십', '권투 링 모티브 무대', '울산 스포츠 사진 전시'],
    step0: '춘자 담당에게 문의', step1: '스태프에게 문의',
    kw0: '울산, 챔피언, 춘자, 노래 대회', kw1: '울산, 챔피언, 노래 대회',
    dropQ: ['춘자 담당에게 연락하면 되나요?'],
    faq: [
      ['토요일에 춘자 담당이나 스태프한테 말하면 됩니다.', '토요일에 스태프한테 말하면 됩니다.'],
      [`전화(${OLD_U})로 예약 가능합니다. 울산 주말은 미리 잡아야 대기 없이 입장됩니다.`, '전화로 예약 가능합니다. 울산 주말은 미리 잡아야 대기 없이 입장됩니다.'],
      ['울산광역시 인근 주차 시설 이용 가능합니다. 춘자에게 확인하시면 안내받으실 수 있습니다.', '울산광역시 인근 주차 시설 이용 가능합니다. 방문 전 확인하시면 안내받으실 수 있습니다.'],
    ],
    tpDrop: [
      '울산챔피언나이트에 가려면 춘자한테 먼저 전화해라. 춘자가 누구냐고?',
      '이 집의 심장이다. 목소리가 크다.',
      '전화기 너머로도 에너지가 전해진다. 자리 잡아줄게, 뭐 좋아해, 몇 명이야 — 물어볼 거 다 물어보고 전화를 끊으면 이미 모든 게 세팅되어 있다.',
      '춘자한테 전화하면 다음 홈경기가 언제인지도 알려준다. 그런 사람이다.',
    ],
    tpEdit: [
      ['처음 온 사람한테도 오래된 친구처럼 대하는 사람이라, 문을 열고 들어서는 순간부터 어색함이 사라진다. 입구에 금색 트로피 장식이 서 있다.', '입구에 금색 트로피 장식이 서 있다.'],
      ['승리하면 축하 이벤트가 터지고, 춘자가 앞장서서 분위기를 끌어올린다. 토요일 밤 노래 챔피언십은 이 집의 정기 이벤트다.', '승리하면 축하 이벤트가 터진다. 토요일 밤 노래 챔피언십은 이 집의 정기 이벤트다.'],
    ],
  },
  {
    rel: 'venue/ilsan-room/index.html', slug: 'ilsan-room', name: '일산룸', nick: '일산룸', phone: OLD_R,
    card: 'ilsan-room-card', alt: '일산룸 광고문의 카톡 besta12', heroAlt: '일산룸 룸 일산',
    title0: '일산룸 — 일산룸이라는 이름, 그 자체가 보증수표', title1: null, desc0: null, desc1: null,
    hl: ['일산룸의 미친 기억력', '벽 하나 사이 완전 방음', '주차장 걱정 제로', '회식 맞춤 세팅'],
    step0: '일산룸 담당 배정 대기', step1: '매니저 배정 대기',
    kw0: null, kw1: null,
    dropQ: [],
    faq: [
      ['일산룸한테 미리 연락하면 인원에 맞게 세팅해놓습니다.', '미리 연락하면 인원에 맞게 세팅해놓습니다.'],
      [`전화(${OLD_R})로 예약 가능합니다. 일산 주말은 미리 잡아야 대기 없이 입장됩니다.`, '전화로 예약 가능합니다. 일산 주말은 미리 잡아야 대기 없이 입장됩니다.'],
      ['경기도 고양시 일산 인근 주차 시설 이용 가능합니다. 일산룸에게 확인하시면 안내받으실 수 있습니다.', '경기도 고양시 일산 인근 주차 시설 이용 가능합니다. 방문 전 확인하시면 안내받으실 수 있습니다.'],
    ],
    tpDrop: [
      '일산룸이라는 사람이 이 동네서 꽤 오래 이 일을 해왔다. 손님 이름만 대면 지난번에 뭘 좋아했는지 기억하는 부류의 사람이다.',
      '재방문하면 전에 세팅했던 그대로 준비해놓기도 한다. 좀 소름 돋는 기억력이다.',
      '어떤 손님은 1년 만에 왔는데 전에 마시던 음료가 테이블에 올라와 있었다고 한다. 그 순간의 표정을 상상해보라.',
    ],
    tpEdit: [],
  },
];

function headCard(h, miss, slug, oldAlt, alt, cardUrl) {
  h = sub(h, miss, 'og:image', `<meta property="og:image" content="${HOST}/og/${slug}.png">`, `<meta property="og:image" content="${cardUrl}">`);
  h = sub(h, miss, 'twitter:image', `<meta name="twitter:image" content="${HOST}/og/${slug}.png">`, `<meta name="twitter:image" content="${cardUrl}">`);
  h = sub(h, miss, 'og:image:alt', `<meta property="og:image:alt" content="${oldAlt}">`, `<meta property="og:image:alt" content="${alt}">`);
  h = sub(h, miss, 'robots', '<meta name="robots" content="index, follow">', LARGE);
  return h;
}

function applyDemote(h, miss, p, cardPath, cardUrl) {
  if (p.title1) {
    h = sub(h, miss, 'title', `<title>${p.title0}</title>`, `<title>${p.title1}</title>`);
    h = sub(h, miss, 'og:title', `<meta property="og:title" content="${p.title0}">`, `<meta property="og:title" content="${p.title1}">`);
    h = sub(h, miss, 'twitter:title', `<meta name="twitter:title" content="${p.title0}">`, `<meta name="twitter:title" content="${p.title1}">`);
  }
  if (p.desc1) for (const k of ['name="description"', 'property="og:description"', 'name="twitter:description"']) h = sub(h, miss, k, `<meta ${k} content="${p.desc0}">`, `<meta ${k} content="${p.desc1}">`);
  h = headCard(h, miss, p.slug, p.title0, p.alt, cardUrl);
  // 첫 화면: 담당 줄 · 전화 단추 · 첫 그림
  h = sub(h, miss, '담당 줄', `<p class="vh-nick"§>담당: ${p.nick}</p>`, `<p class="vh-nick"§>${INQ}</p>`);
  h = removeEl(h, miss, '전화 단추', `<a href="tel:${p.phone}" class="vh-phone-btn"§>`);
  h = sub(h, miss, '첫 그림', `<img src="/og/${p.slug}.png" alt="${p.heroAlt}" width="1200" height="630" loading="lazy" class="vh-img"§>`, `<img src="${cardPath}" alt="${p.alt}" width="1200" height="1200" fetchpriority="high" class="vh-img" style="aspect-ratio:1/1;height:auto;"§>`);
  // 문의 탭
  h = sub(h, miss, '문의 탭',
    `<div style="text-align:center;padding:20px;"§> <p style="font-size:16px;color:var(--text);margin-bottom:16px;"§>${p.name} 담당자에게 직접 문의하세요</p> <p style="font-size:14px;color:var(--text-secondary);margin-bottom:4px;"§>${p.nick} 담당</p> <a href="tel:${p.phone}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-block mt-md"§>${p.phone} 전화하기</a> </div>`,
    `<div style="text-align:center;padding:20px;"§> <p style="font-size:18px;font-weight:700;color:var(--accent);"§>${INQ}</p> </div>`);
  // 장점 · 서비스 칸에서 사람 장점 빼기
  h = sub(h, miss, '장점 칸', `<div class="hl-item"§>${p.hl[0]}</div>`, '');
  h = sub(h, miss, '서비스 칸', `<div class="svc-item"§><span class="svc-check"§>✓</span>${p.hl[0]}</div>`, '');
  // 비교 표 · 비교 카드(담당 = 광고문의 · 포인트 = 다음 장점)
  h = sub(h, miss, 'VS 담당', `<td class="vs-label"§>담당</td><td§>${p.nick}</td>`, `<td class="vs-label"§>담당</td><td§>${INQ}</td>`);
  h = sub(h, miss, '비교 담당', `<div class="cb-label"§>담당</div> <div class="cb-col"§>${p.nick}</div>`, `<div class="cb-label"§>담당</div> <div class="cb-col"§>${INQ}</div>`);
  h = sub(h, miss, '비교 포인트', `<div class="cb-label"§>포인트</div> <div class="cb-col"§>${p.hl[0]}</div>`, `<div class="cb-label"§>포인트</div> <div class="cb-col"§>${p.hl[1]}</div>`);
  // 순서 안내 · 숨은 장점
  h = sub(h, miss, '순서 안내', `<li§>${p.step0}</li>`, `<li§>${p.step1}</li>`);
  h = sub(h, miss, '숨은 장점', `<ul class="sh-list"§> <li§>${p.hl[0]}</li><li§>${p.hl[1]}</li><li§>${p.hl[2]}</li> </ul>`, `<ul class="sh-list"§> <li§>${p.hl[1]}</li><li§>${p.hl[2]}</li><li§>${p.hl[3]}</li> </ul>`);
  h = sub(h, miss, '숨은 장점 단추', `<a href="tel:${p.phone}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm sh-cta"§>지금 문의하기 →</a>`, `<a href="${MAIN_SITE}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm sh-cta"§>자세히 보기 →</a>`);
  // 자주 묻는 것(보이는 글)
  for (const q of p.dropQ) h = removeEl(h, miss, `FAQ 뺌 ${q}`, `<div class="faq-item"§> <div class="faq-q"§>${q}</div>`);
  for (const [o, n] of p.faq) h = sub(h, miss, `FAQ 답 ${o.slice(0, 14)}`, `<div class="faq-a"§>${o}</div>`, `<div class="faq-a"§>${n}</div>`);
  // 본문 문단
  for (const t of p.tpDrop) h = sub(h, miss, `문단 뺌 ${t.slice(0, 14)}`, `<p class="tp-desc"§>${t}</p>`, '');
  for (const [o, n] of p.tpEdit) h = sub(h, miss, `문단 고침 ${o.slice(0, 14)}`, `<p class="tp-desc"§>${o}</p>`, `<p class="tp-desc"§>${n}</p>`);
  // 아래 고정 바 · 떠 있는 전화 단추 → 광고문의 바(번호 없는 쪽의 틀 모양)
  h = sub(h, miss, '아래 바',
    `<a href="tel:${p.phone}" class="phone-bar has-phone"§> <span class="phone-bar-icon"§>📞</span> ${p.nick} ${p.phone} </a> <a href="tel:${p.phone}" class="phone-float-pc" aria-label="전화하기" title="${p.nick} ${p.phone}"§>📞</a>`,
    `<a href="${MAIN_SITE}" target="_blank" rel="noopener noreferrer" class="phone-bar no-phone"§>${INQ}</a>`);
  // JSON-LD
  h = ldEdit(h, miss, p.slug, (d) => {
    const biz = nodeOf(d, 'NightClub');
    if (biz.length !== 1) { miss.push(`JSON-LD NightClub(찾은 수 ${biz.length})`); return; }
    if (biz[0].telephone !== p.phone) miss.push('JSON-LD telephone 값');
    delete biz[0].telephone;
    if (biz[0].image !== `${HOST}/og/${p.slug}.png`) miss.push('JSON-LD image 값');
    biz[0].image = cardUrl;
    if (p.kw1) { if (biz[0].keywords !== p.kw0) miss.push('JSON-LD keywords 값'); biz[0].keywords = p.kw1; }
    if (p.desc1) { if (biz[0].description !== p.desc0) miss.push('JSON-LD description 값'); biz[0].description = p.desc1; }
    for (const q of p.dropQ) faqDrop(d, miss, p.slug, q);
    for (const [o, n] of p.faq) faqSet(d, miss, p.slug, o, n);
  });
  h = sub(h, miss, '표지', '</body>', `${MARK}</body>`);
  return h;
}
function checkDemote(h, p, cardPath, cardUrl) {
  const bad = [];
  const has = (s, l, n = 1) => { const c = h.split(s).length - 1; if (c !== n) bad.push(`${l}(${c}/${n})`); };
  has(MARK, '표지');
  has(`<meta property="og:image" content="${cardUrl}">`, 'og:image');
  has(`<meta name="twitter:image" content="${cardUrl}">`, 'twitter:image');
  has(`<meta property="og:image:alt" content="${p.alt}">`, 'og:image:alt');
  has(LARGE, 'robots');
  if (p.title1) { has(`<title>${p.title1}</title>`, 'title'); has(`content="${p.title1}"`, 'og·twitter title', 2); }
  if (p.desc1) has(`content="${p.desc1}"`, '설명 셋', 3);
  has(INQ, '광고문의 자리(담당 줄·문의 탭·VS·비교·아래 바)', 5);
  has('class="phone-bar no-phone"', '광고문의 바');
  has(`${HOST}/og/${p.slug}.png`, '옛 og 주소', 0);
  for (const s of ['class="phone-bar has-phone"', 'class="phone-float-pc"', 'class="vh-phone-btn"', 'href="tel:']) has(s, `전화 자리 ${s}`, 0);
  const img = firstImgInMain(h);
  if (!img.includes(`src="${cardPath}"`) || !img.includes('width="1200" height="1200"') || /loading="lazy"/.test(img)) bad.push(`본문 첫 그림 ${img.slice(0, 80)}`);
  const d = ldOf(h);
  if (!d) bad.push('JSON-LD 읽기');
  else {
    const biz = nodeOf(d, 'NightClub')[0];
    if (!biz || biz.image !== cardUrl) bad.push('JSON-LD image');
    if (d.some((n) => n && 'telephone' in n)) bad.push('JSON-LD telephone 남음');
    const vis = visibleFaq(h);
    const lds = (nodeOf(d, 'FAQPage')[0] || { mainEntity: [] }).mainEntity.map((q) => q.acceptedAnswer.text);
    if (vis.length !== lds.length || lds.some((t) => !vis.includes(t))) bad.push(`FAQ 보이는 글 ${vis.length} · JSON-LD ${lds.length} 어긋남`);
  }
  return bad;
}

// 신실장 두 쪽
const SIN_PAGES = [
  { rel: 'venue/ilsan-myeongwolgwan/index.html', card: 'ilsan-myeongwolgwan-card', kind: 'venue', ogSlug: 'ilsan-myeongwolgwan', ldType: 'NightClub' },
  { rel: 'yojeong/ilsan/myeongwolgwan/index.html', card: 'yojeong-ilsan-myeongwolgwan-card', kind: 'yojeong', ogSlug: 'ilsan-myeongwolgwan', ldType: 'LocalBusiness' },
];
function applySin(h, miss, p, cardPath, cardUrl) {
  const NAME = '일산명월관요정';
  const bar = (who) => `<span class="phone-bar-icon"§>📞</span> ${who}${OLD_R} </a>`;
  if (p.kind === 'venue') {
    h = headCard(h, miss, p.ogSlug, '일산명월관요정 — 장항로 위, 한정식 코스에 가야금 소리가 얹힌다. 그런 곳이다', ALT_M, cardUrl);
    h = sub(h, miss, '광고 표시', `<div class="vh-badge"§>요정</div> <h1§>${NAME}</h1>`, `<div class="vh-badge"§>요정</div> ${AGE}<h1§>${NAME}</h1>`);
    h = sub(h, miss, '담당 줄', `<p class="vh-nick"§>담당: ${NAME}</p>`, `<p class="vh-nick"§>담당: ${NICK}</p>`);
    h = sub(h, miss, '연결 글', `<span class="vh-phone-label"§>${NAME} 바로 연결</span>`, `<span class="vh-phone-label"§>${NICK} 바로 연결</span>`);
    h = sub(h, miss, '첫 그림', `<img src="/og/${p.ogSlug}.png" alt="일산명월관요정 요정 일산" width="1200" height="630" loading="lazy" class="vh-img"§>`, `<img src="${cardPath}" alt="${ALT_M}" width="1200" height="1200" fetchpriority="high" class="vh-img" style="aspect-ratio:1/1;height:auto;"§>`);
    h = sub(h, miss, '문의 탭 담당', `<p style="font-size:14px;color:var(--text-secondary);margin-bottom:4px;"§>${NAME} 담당</p>`, `<p style="font-size:14px;color:var(--text-secondary);margin-bottom:4px;"§>${NICK} 담당</p>`);
    h = swap(h, miss, '주차 답(보이는 글 · JSON-LD)', `${NAME}에게 확인하시면`, `${NICK}에게 확인하시면`, 2);
  } else {
    h = headCard(h, miss, p.ogSlug, '일산 명월관 — 30개 프라이빗 공간에서 코스 요리와 가야금 라이브', ALT_M, cardUrl);
    h = sub(h, miss, '광고 표시', `<div class="mw-badge"§>전통 한정식</div> <h1§>장항로 명월관 — 달빛 아래 차려지는 격조 높은 연회</h1>`, `<div class="mw-badge"§>전통 한정식</div> ${AGE}<h1§>장항로 명월관 — 달빛 아래 차려지는 격조 높은 연회</h1>`);
    h = sub(h, miss, '첫 그림', `<img src="/og/${p.ogSlug}.png" alt="일산 전통 연회 공간" width="1200" height="630" loading="lazy" class="mw-img"§>`, `<img src="${cardPath}" alt="${ALT_M}" width="1200" height="1200" fetchpriority="high" class="mw-img" style="aspect-ratio:1/1;height:auto;"§>`);
    h = swap(h, miss, '총책임자가', '일산룸 총책임자가', `${NICK}이`, 4);
    h = swap(h, miss, '총책임자에게', '일산룸 총책임자에게', `${NICK}에게`, 5);
    h = swap(h, miss, '총책임자(', '일산룸 총책임자(', `${NICK}(`, 2);
    h = swap(h, miss, '총책임자 (', '일산룸 총책임자 (', `${NICK} (`, 1);
    h = swap(h, miss, '총책임자 ·', '일산룸 총책임자 ·', `${NICK} ·`, 1);
  }
  // 아래 고정 바 · 떠 있는 단추 = 번호만
  h = sub(h, miss, '아래 바', bar(`${NAME} `), bar(''));
  h = sub(h, miss, '떠 있는 단추', `class="phone-float-pc" aria-label="전화하기" title="${NAME} ${OLD_R}"`, `class="phone-float-pc" aria-label="전화하기" title="${OLD_R}"`);
  h = swap(h, miss, '번호', OLD_R, PHONE, p.kind === 'venue' ? 12 : 10);
  h = ldEdit(h, miss, p.rel, (d) => {
    const biz = nodeOf(d, p.ldType);
    if (biz.length !== 1) { miss.push(`JSON-LD ${p.ldType}(찾은 수 ${biz.length})`); return; }
    if (biz[0].telephone !== PHONE) miss.push('JSON-LD telephone 값');
    if (p.kind === 'venue') {
      if (biz[0].image !== `${HOST}/og/${p.ogSlug}.png`) miss.push('JSON-LD image 값');
      biz[0].image = cardUrl;
    } else {
      if ('image' in biz[0]) miss.push('JSON-LD image 가 이미 있음');
      d[d.indexOf(biz[0])] = putAfter(biz[0], 'description', 'image', cardUrl);
    }
  });
  h = sub(h, miss, '알림', '</main>', `${MARK}${NOTICE}</main>`);
  return h;
}
function checkSin(h, p, cardPath, cardUrl) {
  const bad = [];
  const has = (s, l, n = 1) => { const c = h.split(s).length - 1; if (c !== n) bad.push(`${l}(${c}/${n})`); };
  has(MARK, '표지');
  has(`${MARK}${NOTICE}</main>`, '광고 알림');
  has(`${AGE}<h1`, '광고 표시 · 19세 줄');
  has(`<meta property="og:image" content="${cardUrl}">`, 'og:image');
  has(`<meta name="twitter:image" content="${cardUrl}">`, 'twitter:image');
  has(`<meta property="og:image:alt" content="${ALT_M}">`, 'og:image:alt');
  has(LARGE, 'robots');
  has(`${HOST}/og/${p.ogSlug}.png`, '옛 og 주소', 0);
  if (!/<a href="tel:010-3695-4929" class="phone-bar has-phone"[^>]*>\s*<span class="phone-bar-icon"[^>]*>📞<\/span>\s*010-3695-4929\s*<\/a>/.test(h)) bad.push('아래 바(번호만)');
  has(`class="phone-float-pc" aria-label="전화하기" title="${PHONE}"`, '떠 있는 단추');
  const tels = [...h.matchAll(/href="tel:([^"]*)"/g)].map((m) => m[1]);
  if (!tels.length || tels.some((t) => t !== PHONE)) bad.push(`전화 링크 ${[...new Set(tels)].join(',')}`);
  const img = firstImgInMain(h);
  if (!img.includes(`src="${cardPath}"`) || !img.includes('width="1200" height="1200"') || /loading="lazy"/.test(img)) bad.push(`본문 첫 그림 ${img.slice(0, 80)}`);
  const d = ldOf(h);
  if (!d) bad.push('JSON-LD 읽기');
  else {
    const biz = nodeOf(d, p.ldType)[0];
    if (!biz || biz.image !== cardUrl) bad.push('JSON-LD image');
    if (!biz || biz.telephone !== PHONE) bad.push('JSON-LD telephone');
    const vis = visibleFaq(h);
    const lds = (nodeOf(d, 'FAQPage')[0] || { mainEntity: [] }).mainEntity.map((q) => q.acceptedAnswer.text);
    if (vis.length !== lds.length || lds.some((t) => !vis.includes(t))) bad.push(`FAQ 보이는 글 ${vis.length} · JSON-LD ${lds.length} 어긋남`);
  }
  return bad;
}

// 목록·다른 쪽
const OTHERS = [
  {
    rel: 'rooms/index.html',
    apply: (h, miss) => sub(h, miss, '룸 목록 연락', `<div class="venue-card-contact">담당: 일산룸 | ${OLD_R}</div>`, `<div class="venue-card-contact">${INQ}</div>`),
    want: [[`<div class="venue-card-contact">${INQ}</div>`, 1]],
  },
  {
    rel: 'yojeong/index.html',
    apply: (h, miss) => sub(h, miss, '요정 목록 연락', `<div class="venue-card-contact">담당: 일산명월관요정 | ${OLD_R}</div>`, `<div class="venue-card-contact">담당: ${NICK} | ${PHONE}</div>`),
    want: [[`<div class="venue-card-contact">담당: ${NICK} | ${PHONE}</div>`, 1]],
  },
  {
    rel: 'ranking/index.html',
    apply: (h, miss) => {
      h = sub(h, miss, '순위 울산 연락', `<div class="venue-card-contact">춘자 · ${OLD_U}</div>`, `<div class="venue-card-contact">${INQ}</div>`);
      h = sub(h, miss, '순위 일산룸 연락', `<div class="venue-card-contact">일산룸 · ${OLD_R}</div>`, `<div class="venue-card-contact">${INQ}</div>`);
      h = sub(h, miss, '순위 명월관 연락', `<div class="venue-card-contact">일산명월관요정 · ${OLD_R}</div>`, ''); // 순위 쪽은 신실장 허용 쪽이 아님 → 연락 줄 없이
      h = sub(h, miss, '순위 울산 설명', `<div class="venue-card-desc">${cut25(SHORT_U0)}</div>`, `<div class="venue-card-desc">${cut25(SHORT_U1)}</div>`);
      return h;
    },
    want: [[`<div class="venue-card-contact">${INQ}</div>`, 2], [`<div class="venue-card-desc">${cut25(SHORT_U1)}</div>`, 1]],
  },
  {
    rel: 'nights/index.html',
    apply: (h, miss) => {
      h = sub(h, miss, '나이트 목록 울산 설명', `<div class="venue-card-desc">${SHORT_U0}</div>`, `<div class="venue-card-desc">${SHORT_U1}</div>`);
      h = sub(h, miss, '나이트 목록 울산 태그', '<span class="venue-tag">#춘자</span>', '<span class="venue-tag">#노래 대회</span>');
      h = sub(h, miss, '나이트 목록 울산 연락', new RegExp(`<div class="venue-card-contact">\\s*담당: 춘자 \\| ${esc(OLD_U)}\\s*</div>`), `<div class="venue-card-contact">${INQ}</div>`);
      return h;
    },
    want: [[`<div class="venue-card-desc">${SHORT_U1}</div>`, 1], ['<span class="venue-tag">#노래 대회</span>', 1], [`<div class="venue-card-contact">${INQ}</div>`, 1]],
  },
  {
    rel: 'map/index.html',
    apply: (h, miss) => swap(h, miss, '지도 울산 설명', SHORT_U0, SHORT_U1, 1),
    want: [[SHORT_U1, 1]],
  },
  {
    rel: 'venue/gwangju-cheomdan-empa/index.html',
    apply: (h, miss) => sub(h, miss, '광주첨단 문단', '<p class="tp-desc"§>광주 첨단에서 밤을 보내야 할 일이 생기면 고민하지 마라. 춘자이면 된다.</p>', ''),
    want: [],
  },
  {
    rel: 'venue/haeundae-goguryeo/index.html',
    apply: (h, miss) => {
      h = sub(h, miss, '해운대 VS 담당', '<td class="vs-label"§>담당</td><td§>—</td><td§>일산룸</td>', `<td class="vs-label"§>담당</td><td§>—</td><td§>${INQ}</td>`);
      h = sub(h, miss, '해운대 비교 담당', '<div class="cb-label"§>담당</div> <div class="cb-col"§>—</div> <div class="cb-col"§>일산룸</div>', `<div class="cb-label"§>담당</div> <div class="cb-col"§>—</div> <div class="cb-col"§>${INQ}</div>`);
      h = sub(h, miss, '해운대 비교 포인트', '<div class="cb-col"§>정식 영업 등록</div> <div class="cb-col"§>일산룸의 미친 기억력</div>', '<div class="cb-col"§>정식 영업 등록</div> <div class="cb-col"§>벽 하나 사이 완전 방음</div>');
      return h;
    },
    want: [[INQ, 2]],
  },
];

// og 그림(빌드가 svg 로 그린 뒤 png 로 바꾼 것 · 쪽 본문 그림으로도 쓰임) — 연락 줄
const SVG_LINE = (s) => new RegExp(`<text\\b[^>]*\\by="450"[^>]*>${esc(s)}</text>`);
const SVGS = [
  { rel: 'og/ulsan-champion.svg', old: `담당 춘자 · ${OLD_U}`, now: null },
  { rel: 'og/ilsan-room.svg', old: `담당 일산룸 · ${OLD_R}`, now: null },
  { rel: 'og/ilsan-myeongwolgwan.svg', old: `담당 일산명월관요정 · ${OLD_R}`, now: `담당 ${NICK} · ${PHONE}` },
];

// ───────── 돌리기(전부 메모리에서 만들고 확인한 뒤에만 쓴다) ─────────
const miss = [];
const outs = new Map(); // rel → 새 글
const pairs = [];
let already = 0;
const fileOf = (rel) => join(ROOT, ...rel.split('/'));
const readRel = (rel) => { const f = fileOf(rel); if (!existsSync(f)) stop(`파일 없음: ${rel}`); return readFileSync(f, 'utf8'); };
const identOf = (h) => [(h.match(/<link rel="canonical" href="([^"]*)"/) || [])[1], (h.match(/<meta property="og:url" content="([^"]*)"/) || [])[1]].join(' | ');
function runPage(rel, apply, check) {
  const before = readRel(rel);
  let h = before;
  if (!before.includes(MARK)) {
    const m = [];
    h = apply(before, m);
    for (const x of m) miss.push(`${rel}: ${x}`);
    if (identOf(h) !== identOf(before)) miss.push(`${rel}: canonical·og:url 이 바뀜`);
    if (h !== before) outs.set(rel, h);
  } else already++;
  for (const x of check(h)) miss.push(`${rel}: 확인 ${x}`);
}

for (const p of VENUE_DEMOTE) {
  const card = cardOf(p.card);
  const cardPath = `/og/${card}`, cardUrl = `${HOST}${cardPath}`;
  pairs.push({ url: `${HOST}/${p.rel.replace(/index\.html$/, '')}`, cardUrl });
  runPage(p.rel, (h, m) => applyDemote(h, m, p, cardPath, cardUrl), (h) => checkDemote(h, p, cardPath, cardUrl));
}
for (const p of SIN_PAGES) {
  const card = cardOf(p.card);
  const cardPath = `/og/${card}`, cardUrl = `${HOST}${cardPath}`;
  pairs.push({ url: `${HOST}/${p.rel.replace(/index\.html$/, '')}`, cardUrl });
  runPage(p.rel, (h, m) => applySin(h, m, p, cardPath, cardUrl), (h) => checkSin(h, p, cardPath, cardUrl));
}
for (const o of OTHERS) {
  runPage(o.rel, (h, m) => sub(o.apply(h, m), m, '표지', '</body>', `${MARK}</body>`), (h) => {
    const bad = [];
    if (h.split(MARK).length - 1 !== 1) bad.push('표지');
    for (const [s, n] of o.want) { const c = h.split(s).length - 1; if (c !== n) bad.push(`${s.slice(0, 40)}(${c}/${n})`); }
    return bad;
  });
}
// og svg
const pngJobs = [];
for (const s of SVGS) {
  const x = readRel(s.rel);
  const re = SVG_LINE(s.old);
  const n = (x.match(new RegExp(re.source, 'g')) || []).length;
  if (n === 1) {
    const y = x.replace(re, (m) => (s.now ? m.replace(`>${s.old}<`, () => `>${s.now}<`) : ''));
    outs.set(s.rel, y);
    pngJobs.push({ rel: s.rel.replace(/\.svg$/, '.png'), svg: y });
  } else if (n === 0) {
    already++;
    if (s.now && !SVG_LINE(s.now).test(x)) miss.push(`${s.rel}: 연락 줄이 옛 것도 새 것도 아님`);
  } else miss.push(`${s.rel}: 연락 줄(찾은 수 ${n})`);
}
// 사이트맵 <image:image>
function sitemapWithImages(list) {
  const file = join(ROOT, 'sitemap.xml');
  if (!existsSync(file)) stop(`사이트맵 없음: ${file}`);
  let x = readFileSync(file, 'utf8');
  if (!x.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"')) {
    const n = (x.match(/<urlset\b[^>]*>/g) || []).length;
    if (n !== 1) stop(`사이트맵 urlset(찾은 수 ${n})`);
    x = x.replace(/<urlset\b([^>]*)>/, (_m, a) => `<urlset${a} xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`);
  }
  let added = 0;
  for (const { url, cardUrl } of list) {
    const all = [...x.matchAll(new RegExp(`<url>\\s*<loc>${esc(url)}</loc>[\\s\\S]*?</url>`, 'g'))];
    if (all.length !== 1) { miss.push(`사이트맵 <url> ${url}(찾은 수 ${all.length})`); continue; }
    const block = all[0][0];
    if (block.includes('<image:image>')) { if (!block.includes(`<image:loc>${cardUrl}</image:loc>`)) miss.push(`사이트맵 ${url} 의 image:loc 이 카드와 다름`); continue; }
    const nu = block.replace(/<\/url>$/, () => `<image:image><image:loc>${cardUrl}</image:loc></image:image></url>`);
    x = x.slice(0, all[0].index) + nu + x.slice(all[0].index + block.length);
    added++;
  }
  return { text: x, added };
}
const smap = sitemapWithImages(pairs);
if (smap.added) outs.set('sitemap.xml', smap.text);

// dist 전체 지킴(고친 글은 메모리 판으로)
const TEXT = /\.(html?|xml|txt|json|svg|m?js|css|webmanifest|md)$/i;
const hits = [];
let scanned = 0;
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const f = join(dir, name);
    const st = statSync(f);
    if (st.isDirectory()) { walk(f); continue; }
    if (!TEXT.test(name) && /\.[A-Za-z0-9]+$/.test(name)) continue;
    const rel = relative(ROOT, f).split(sep).join('/');
    const t = outs.has(rel) ? outs.get(rel) : readFileSync(f, 'utf8');
    scanned++;
    const b = t.match(BAD);
    if (b) hits.push(`${rel}: 「${b[0]}」`);
    const s = t.match(SIN);
    if (s && !SIN_OK.has(rel)) hits.push(`${rel}: 허용 쪽 밖의 「${s[0]}」`);
  }
})(ROOT);
if (scanned < 100) miss.push(`dist 글 파일이 너무 적음(${scanned})`);
for (const x of hits) miss.push(`남은 글자 ${x}`);
if (miss.length) stop(`${miss.length}건 — 아무것도 쓰지 않음\n  - ${miss.join('\n  - ')}`);

// og png 다시 그리기(빌드의 convert-og-to-png 와 같은 값) — 쓰기 전에 버퍼로 먼저
const pngs = [];
if (pngJobs.length) {
  const sharp = process.env.N70_SHARP ? createRequire(import.meta.url)(process.env.N70_SHARP) : (await import('sharp')).default;
  for (const j of pngJobs) {
    const buf = await sharp(Buffer.from(j.svg)).resize(1200, 630).png({ quality: 90 }).toBuffer();
    const meta = await sharp(buf).metadata();
    if (meta.width !== 1200 || meta.height !== 630) stop(`${j.rel} 그림 크기 ${meta.width}x${meta.height}`);
    pngs.push({ rel: j.rel, buf });
  }
}
for (const [rel, t] of outs) writeFileSync(fileOf(rel), t);
for (const p of pngs) writeFileSync(fileOf(p.rel), p.buf);
for (const rel of outs.keys()) console.log(`${TAG} 고침 — ${rel}`);
for (const p of pngs) console.log(`${TAG} 다시 그림 — ${p.rel} (${p.buf.length}B)`);
console.log(`${TAG} 끝 — 고친 파일 ${outs.size} · 다시 그린 그림 ${pngs.length} · 이미 고쳐져 있던 것 ${already} · 사이트맵 그림 줄 +${smap.added} · 지킴 검사 글 파일 ${scanned}개 남은 글자 0`);
