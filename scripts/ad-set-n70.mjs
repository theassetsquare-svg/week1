// 놀쿨70-1 · 일산74-2 · 일산76-2 — dd.nolcool.com 빌드 뒤 손질(소스·데이터는 그대로 두고 dist 만 고친다)
//
//   ① 해지된 연락처 → 광고문의 카카오톡 besta12
//      · 울산챔피언나이트(대표님 2026-10-25 01:28 · 지시서 전체57-1 ④)
//      담당 줄·표 칸·아래 바 = 광고문의 그대로 · 문장 속 사람 구절만 뺀다 · JSON-LD telephone 뺌 · 광고문의 1:1 카드
//   ② 일산 세 쪽 = 광고주 세트(대표님 2026-11-13 13:30 · 13:48 · 지시서 일산76-2)
//      · /venue/ilsan-room/ = 닉네임 「일산룸 총책임자 …」 · /venue/ilsan-myeongwolgwan/ · /yojeong/ilsan/myeongwolgwan/ = 「일산요정 총책임자 …」
//      · 쪽마다: 1:1 광고주 카드(og:image = 본문 첫 그림 = JSON-LD image) · h1 앞 「광고」 + 19세 줄 · 담당 줄 · 전화 단추
//        · 아래 고정 전화바(번호만) · JSON-LD telephone · 본문 끝 알림 · 사이트맵 그림 줄
//      · 제목·설명·주소는 그대로 · 지어낸 사람 이야기(기억력 문단 등)는 일산74-2 때처럼 뺀다 · 자주 묻는 것 답에는 닉네임·번호를 넣지 않는다
//      · 이 사이트 광고주 쪽 표준(ad-set-sillim ⑦)과 같이, 광고주 번호가 보이는 이 세 쪽에서는 틀이 셈으로 만든 숫자(오늘 N명 조회 · N번째 손님 ·
//        오늘 단 N명) · 지어낸 후기 인용 · 쿠폰 · 떠오르는 혜택 칸과 확인 안 된 영업시간 · 요금 · 주차 · 걸리는 시간 · 행사 글을 뺀다(새 글로 채우지 않는다)
//      · 보이는 글자에 번호는 쪽마다 3번 이하 — 본문 끝 알림에는 번호를 적지 않는다(닉네임만)
//      (11-11~11-12 에는 이 세 쪽이 광고문의였다 — 일산74-2. 소스 자료에 든 옛 번호는 여기서 새 번호로 바뀐다)
//   ③ 다른 쪽에 남은 옛 연락처 — 목록 다섯 쪽 · 광주첨단엠파 문단 · 해운대고구려 비교 칸
//      · 비교 쪽 자료 덩이(base64 라 글자 찾기에 안 걸림) · og 그림 셋(svg 고치고 png 다시 그림)
//      이 쪽들은 광고문의 그대로다(일산 세 쪽 밖에는 닉네임·새 번호 0)
//
//   자리를 하나라도 못 찾으면 아무것도 쓰지 않고 종료 1 → 빌드 실패 → 라이브는 그대로
//   이미 고친 dist(표지가 있음)는 확인만 한다 — 두 번 돌려도 같다
//   끝에 dist 글 파일 전부(base64 덩이는 풀어서)를 훑는다 — 옛 번호·해지 이름은 어디에도 0 ·
//   닉네임과 새 번호는 일산 세 쪽에만(쪽마다 제 닉네임만) — 어긋나면 종료 1
//   ※ 저장소 연락처 검사(naver-watch scripts/adv/legacy-repo-scan.mjs)는 이 파일도 훑는다 — 2026-11-13 부터는 나눠 적은 번호까지 센다.
//     · 해지된 옛 번호 둘은 번호 글자를 어떤 꼴로도 두지 않는다 → 끝 여덟 자리의 지문(sha256 앞 16자)만 두고 dist 를 그 지문으로 지킨다(GONE_FP)
//     · 새 번호와 두 닉네임은 일산 가게 이름이 붙은 기록(ADV_N) 한 곳에만 통째로 적는다 — 그 검사는 기록 주인이 일산 가게일 때만 통과시킨다
//   node scripts/ad-set-n70.mjs [dist]        (N70_SHARP=<sharp 경로> 로 다른 sharp 를 쓸 수 있음 · 시험용)
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const ROOT = process.argv[2] || process.env.AD_SET_ROOT || 'dist';
const HOST = 'https://dd.nolcool.com';
const MAIN_SITE = 'https://nolcool.com';
const TAG = '[ad-set-n70]';
const MARK = '<!-- ad-set-n70 -->';
function stop(msg) { console.error(`${TAG} 실패 — ${msg}`); process.exit(1); }
if (!existsSync(join(ROOT, 'index.html'))) stop(`dist 가 아님(index.html 없음): ${ROOT}`);

// 번호 = [앞, 가운데, 끝] 조각 · dash = 쪽에 적힌 꼴 · tail·flat = 지킴 검사에 쓰는 꼴
const tel = (a, b, c) => ({ dash: [a, b, c].join('-'), tail: `${b}[\\s.\\-]?${c}`, flat: [a, b, c].join('') });
const TEL_R = tel('010', '4117', '5556'); // 옛 일산룸·일산명월관요정 자료 번호(소스 데이터에 있음 → 여기서 뺀다)
// 2026-11-13 일산 세 쪽 광고주(대표님 13:30 번호 · 13:48 닉네임) — 이 세 쪽에만 · 번호와 닉네임은 이 기록 한 곳에만 적는다
const ADV_N = { name: '일산룸 · 일산명월관요정', nickRoom: '일산룸 총책임자 신실장', nickYo: '일산요정 총책임자 신실장', phone: '010-3541-0027' };
const TEL_N = tel(...ADV_N.phone.split('-'));
const NICK_ROOM = ADV_N.nickRoom; // 일산룸 쪽
const NICK_YO = ADV_N.nickYo;     // 일산명월관 · 일산요정 쪽
// 닉네임 끝 낱말 — 일산 세 쪽에서 위 두 닉네임 꼴로만 쓴다(그 밖의 쪽에는 0 · 뒤에 TV 가 붙은 옛 이름은 어디에도 0)
const NICK_X = NICK_ROOM.split(' ').pop();
// 해지된 옛 번호 둘(울산챔피언나이트 2026-10-25 · 옛 일산 담당 2026-11-11 — 어디에도 0 · 지킴만)의 끝 여덟 자리 지문.
//   dist 글에서 「네 자리 + (빈칸·점·줄표 하나) + 네 자리」를 한 자리씩 밀며 지문을 견준다 — 옛 지킴 틀(가운데·끝 묶음)과 같은 범위라
//   앞 세 자리를 붙인 꼴 · 붙여 쓴 꼴도 잡힌다. 울산 번호의 자리는 src/data/nights-other.ts 의 자리 표시(OLD_U)가 맡는다.
const GONE_FP = new Set(['858733e59f736af7', '8b4f061cef6f703f']);
const fp8 = (d) => createHash('sha256').update(d).digest('hex').slice(0, 16);
function goneHit(t) {
  for (const m of String(t).matchAll(/(?=(\d{4})[\s.\-]?(\d{4}))/g)) if (GONE_FP.has(fp8(m[1] + m[2]))) return ['해지된 옛 번호'];
  return null;
}
const OLD_R = TEL_R.dash;
const NEW = TEL_N.dash;               // 쪽에 적는 꼴
const NEW_HREF = `tel:${TEL_N.flat}`; // 전화 링크
const NEW_LD = `+82-${NEW.slice(1)}`; // JSON-LD telephone(이 사이트 광고주 쪽 꼴 — ad-set-cube 의 LD_TEL 과 같음)
// 울산챔피언나이트의 옛 번호는 src/data/nights-other.ts 에서 지우고 이 자리 표시를 두었다(번호가 아님).
// 틀이 「전화 있는 가게」 꼴로 그리게만 하고, 표시가 든 자리(전화 단추·바·FAQ·JSON-LD·og 그림)는 아래에서 전부 광고문의로 바뀐다 — dist 에 남으면 종료 1
const OLD_U = 'OLD-CONTACT-U';
const INQ = '광고문의 카카오톡 besta12';
const LARGE = '<meta name="robots" content="index, follow, max-image-preview:large">';
const SHORT_U0 = '춘자 담당에게 전화 한 통이면 좌석부터 케이크까지 일사천리.';
const SHORT_U1 = '입구에 금색 트로피 장식이 서 있고, 무대는 권투 링처럼 로프를 둘렀다.';
const cut25 = (s) => `${s.substring(0, 25)}…`; // 순위 쪽 카드 설명 = 앞 25자 + …(src/pages/ranking/index.astro)

// dist 어디에도 남으면 안 되는 것 — 허용 쪽 없음(옛 자료 번호 · 해지 이름 · 옛 TV 이름 · 지어낸 사람 구절 · 가게 이름을 사람처럼 쓴 옛 담당 줄)
//   해지된 옛 번호 둘은 이 틀이 아니라 goneHit(지문)이 본다
const BAD = new RegExp([
  TEL_R.tail, TEL_R.flat, OLD_U,
  '춘자', `${NICK_X}\\s*TV`, '미친 기억력',
  '일산룸(?:한테|에게| 담당(?!자)| 바로 연결|이라는 사람)',
  '일산명월관요정(?:에게|한테| 담당(?!자)| 바로 연결)',
  '담당: (?:일산룸|일산명월관요정)(?! 총책임자)',
].join('|'));
// 일산 세 쪽 밖에는 남으면 안 되는 것 — 닉네임 · 새 번호(교차 오염 0). 세 쪽 안에서는 쪽마다 제 닉네임만(아래 지킴 검사)
const BAD_OUT = new RegExp([NICK_X, '일산(?:룸|요정)\\s*총책임자', TEL_N.tail, TEL_N.flat].join('|'));

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
// 여는 태그부터 짝이 맞는 닫는 태그까지 뺀다(startTpl = 틀 글 또는 정규식 · optional 이면 없을 때 넘어간다)
function removeEl(h, miss, label, startTpl, optional = false) {
  const all = [...h.matchAll(startTpl instanceof RegExp ? new RegExp(startTpl.source, 'g') : pat(startTpl))];
  if (all.length === 0 && optional) return h;
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
// 쪽 안 자료 덩이(base64 · UTF-8 JSON) — 정확히 하나 · 다시 묶어 글자가 같을 때만 고친다
const B64_RE = /const _b64 = "([A-Za-z0-9+/]+={0,2})";/g;
function blobOf(h) {
  const all = [...h.matchAll(B64_RE)];
  if (all.length !== 1) return null;
  try { return JSON.parse(Buffer.from(all[0][1], 'base64').toString('utf8')); } catch { return null; }
}
function blobEdit(h, miss, label, fn) {
  const all = [...h.matchAll(B64_RE)];
  if (all.length !== 1) { miss.push(`${label} 자료 덩이(찾은 수 ${all.length})`); return h; }
  let d;
  try { d = JSON.parse(Buffer.from(all[0][1], 'base64').toString('utf8')); } catch { miss.push(`${label} 자료 덩이 읽기 실패`); return h; }
  if (Buffer.from(JSON.stringify(d), 'utf8').toString('base64') !== all[0][1]) { miss.push(`${label} 자료 덩이를 다시 묶으면 글자가 달라짐`); return h; }
  fn(d);
  const b64 = Buffer.from(JSON.stringify(d), 'utf8').toString('base64');
  return h.slice(0, all[0].index) + `const _b64 = "${b64}";` + h.slice(all[0].index + all[0][0].length);
}
// 아래 고정 바 · 떠 있는 전화 단추 → 광고문의 바(번호 없는 쪽의 틀 모양)
const BAR_FROM = (nick, phone) => `<a href="tel:${phone}" class="phone-bar has-phone"§> <span class="phone-bar-icon"§>📞</span> ${nick} ${phone} </a> <a href="tel:${phone}" class="phone-float-pc" aria-label="전화하기" title="${nick} ${phone}"§>📞</a>`;
const BAR_TO = `<a href="${MAIN_SITE}" target="_blank" rel="noopener noreferrer" class="phone-bar no-phone"§>${INQ}</a>`;

// ───────── 쪽마다 할 일 ─────────
// hl = 사람 장점이 맨 앞에 든 장점 넷(없으면 null) · compare = 다른 가게와 견주는 칸이 있나 · step0 = 순서 안내의 사람 줄(없으면 null)
const VENUE_DEMOTE = [
  {
    rel: 'venue/ulsan-champion/index.html', slug: 'ulsan-champion', name: '울산챔피언나이트', nick: '춘자', phone: OLD_U,
    card: 'ulsan-champion-card', alt: '울산챔피언나이트 광고문의 카톡 besta12', heroAlt: '울산챔피언나이트 나이트 울산',
    title0: '울산챔피언나이트 — 춘자 담당에게 전화 한 통이면 좌석부터 케이크까지 일사천리',
    title1: '울산챔피언나이트 — 트로피 장식과 토요일 노래 챔피언십',
    desc0: '울산챔피언나이트 — 자리 잡아줄게, 뭐 좋아해, 몇 명이야 — 물어볼 거 다 물어보고 전화를 끊으면 이미 모든 게 세팅되어 있다. 트로피 장식과 골드 앤 블랙 인테리어가 챔피언의 격을 표현한다. 울산 나이트 현장 체험 가이드.',
    desc1: '울산챔피언나이트 — 입구에 금색 트로피 장식이 서 있고, 무대는 코너에 로프를 두른 권투 링 모양이다. 토요일 밤에는 노래 챔피언십이 열린다.',
    hl: ['춘자 담당의 친근한 응대', '토요일 노래 챔피언십', '권투 링 모티브 무대', '울산 스포츠 사진 전시'], compare: true,
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
];

// ───────── 일산 세 쪽 = 광고주 세트(일산76-2 · 대표님 2026-11-13 13:30 · 13:48) ─────────
// h1 바로 앞 「광고」 표시 + 19세 줄 — 이 사이트 광고주 쪽 꼴(ad-set-cube 의 AD_G 와 같은 글자)
const AGE = '<p class="ad-g" style="margin:10px 0 0;font-size:13px;font-weight:700;color:#fff;"><span class="ad-label" style="display:inline-block;margin-right:6px;padding:1px 8px;border:1px solid #fff;border-radius:4px;font-size:12px;">광고</span>19세 미만 출입 금지</p>';
// 본문 끝 알림 — 광고라는 것 · 담당 닉네임 · 확인한 날과 그날 확인한 것(번호는 적지 않는다 — 보이는 번호는 쪽마다 3번 이하)
//   「정보 확인: 날짜 (무엇 확인일)」 꼴 = 놀쿨 본 사이트 기본 정보 표와 같은 꼴(gsc163-check G6 「정보 확인 날짜 1곳」)
//   what = 그날 실제로 확인한 것만: 연락처(대표님 2026-11-13 13:30) · 일산명월관 두 쪽은 주소도(주소정보누리집 · 카카오맵 2026-11-13)
const NOTICE = (nick, what = '연락처') => `<p class="ad-notice" style="margin:24px 0 8px;padding:12px 16px;font-size:13px;line-height:1.6;color:var(--text-secondary);text-align:center;border-top:1px solid var(--border);">이 페이지는 광고입니다. 예약·문의는 담당 ${nick}에게 전화로 하시면 됩니다. 정보 확인: 2026-11-13 (${what} 확인일)</p>`;
// 숨은 아래 안내 창 둘이 폰 화면의 고정 전화바를 덮지 않게 화면 밖으로 내린다(ad-set-sillim · ad-set-cube 와 같은 까닭 · 같은 값)
const BAR_STYLE = '<style>.slide-up-banner,.scroll-banner{bottom:100px}.slide-up-banner:not(.show),.scroll-banner:not(.show){transform:translateY(calc(100% + 100px))}@media (min-width:768px){.slide-up-banner,.scroll-banner{bottom:92px}}</style>';
// 아래 고정 바 = 번호만(누르면 전화) · 떠 있는 전화 단추의 풍선 글도 번호만
const BAR_ADV = `<a href="${NEW_HREF}" class="phone-bar has-phone"§> <span class="phone-bar-icon"§>📞</span> ${NEW} </a> <a href="${NEW_HREF}" class="phone-float-pc" aria-label="전화하기" title="${NEW}"§>📞</a>`;
// 카드 alt = 그려진 것을 짧게 · 번호 0(이 사이트 광고주 쪽 꼴 — ad-set-cube 의 ALT)
const altOf = (p) => `${p.name} ${p.nick} 안내 카드`;

// ───────── 광고주 쪽에서 빼는 칸(이 사이트 광고주 쪽 표준 = ad-set-sillim ⑦ 과 같은 목록 · 같은 차례) ─────────
// 광고주 번호가 보이는 쪽에는 틀이 셈으로 만든 숫자(오늘 N명 조회 · N번째 손님 · 오늘 단 N명) · 지어낸 후기 인용 · 쿠폰 · 떠오르는 혜택과
// 확인 안 된 영업시간 · 요금 · 걸리는 시간 · 행사 글을 두지 않는다(틀은 다른 가게 쪽과 같이 쓰므로 이 쪽 결과에서만 뺀다 · 새 글로 채우지 않는다)
const A = '(?: data-astro-cid-[a-z0-9]+)*'; // Astro 범위 속성(있어도 없어도)
// cut = 요소가 아니라 맞은 글자만 뺀다 · pair = 견줄 가게가 있는 쪽에만 틀이 그리는 칸 · optional = 없으면 넘어간다
const VENUE_DROP = [
  { label: '인기시간 탭 단추', re: `<button class="tab-btn"${A} data-tab="popular"${A}>` },
  { label: '요일별 인기도 · 시간대별 안내 칸', re: `<div class="tab-panel"${A} id="tab-popular"${A}>` },
  { label: '타임라인 제목', re: `<h3 class="tp-sub"${A}>타임라인</h3>\\s*`, cut: true },
  { label: '타임라인 칸', re: `<div class="timeline"${A}>` }, // 위의 인기시간 칸을 먼저 빼야 1개가 된다(가게 쪽에 timeline 이 둘)
  { label: '이벤트 탭 단추', re: `<button class="tab-btn"${A} data-tab="event"${A}>` },
  { label: '이벤트 · 프로모션 칸', re: `<div class="tab-panel"${A} id="tab-event"${A}>` },
  { label: '찾아가는 길 걸리는 시간', re: `<div class="map-travel"${A}>` },
  { label: 'VS 투표 물음', re: `<p class="tp-note"${A} style="margin:16px 0 8px;text-align:center;"${A}>어느 쪽이 더 핫할까\\?</p>`, pair: true },
  { label: 'VS 투표 칸', re: `<div class="vs-arena"${A} id="vsArena"${A}>`, pair: true },
  { label: 'VS 투표 결과', re: `<p class="tp-note"${A} id="vsResult"`, pair: true },
  { label: '오늘 N명 조회', re: `<div class="view-counter"${A} id="viewCounter"${A}>` },
  { label: '지금 예약하면 N번째', re: `<div class="time-attack"${A} id="timeAttack"${A}>` },
  { label: '사장님만 아는 숨겨진 메뉴', re: `<section class="secret-section"${A} id="secretSection"` },
  { label: '리뷰 + 실시간 순위 띠', re: `<div class="cta-section"${A} style="margin:24px 0;"${A}>\\s*<h3${A}>[^<]*리뷰 \\+ 실시간 순위</h3>` },
  { label: '리뷰 인용 3줄', re: `<div class="blur-lock"${A}>` },
  { label: '할인 쿠폰', re: `<div class="coupon-lock"${A}>` },
  { label: '복장 가이드', re: `<div class="insider-card"${A}>\\s*<span class="insider-icon"${A}>[^<]*</span>\\s*<h4${A}>복장 가이드</h4>` },
  { label: '예산 가이드', re: `<div class="insider-card"${A}>\\s*<span class="insider-icon"${A}>[^<]*</span>\\s*<h4${A}>예산 가이드</h4>` },
  { label: '인사이더 팁 띄우기(첫 방문 혜택 등)', re: `<section class="insider-tip"${A} id="insiderTip"` },
  { label: '오늘 단 N명 문구', re: `<p class="scarcity-text"${A} id="scarcityText"` },
  { label: '다음 업소 자동 이동', re: `<section class="next-countdown"${A} id="nextCountdown"${A}>`, pair: true },
];
// 공통 틀(BaseLayout)이 모든 쪽에 넣는 칸 — 가게 쪽 · 요정 갈래 쪽 모두에서 뺀다. 앞의 둘은 2026-11-13 에 틀에서 뺐다(옛 빌드 판에만 있다 → 없으면 넘어감)
const LAYOUT_DROP = [
  { label: '지금 N명 탐색 중', re: `<span style="margin-left:12px;color:var\\(--accent\\);font-weight:600;"${A} id="fomoCounter"${A}>`, optional: true },
  { label: '예약 문의 들어옴 알림', re: `<div class="toast"${A} id="toast"${A}>`, optional: true },
  { label: '떠오르는 알림(확인 안 된 혜택 · 마감 문구)', re: `<div class="var-reward"${A} id="varReward"${A}>` },
];
function dropAll(h, miss, list, pair = true) {
  for (const s of list) {
    if (s.pair && !pair) continue; // 견줄 가게가 없는 쪽 — 틀이 안 그린 칸(남았는지는 확인에서 본다)
    const re = new RegExp(s.re);
    h = s.cut ? sub(h, miss, s.label, re, '') : removeEl(h, miss, s.label, re, !!s.optional);
  }
  return h;
}
const leftOf = (h, list) => list.filter((s) => new RegExp(s.re).test(h)).map((s) => `빼는 칸 「${s.label}」 남음`);
// 「최적 방문 시간」 칸의 글 — 틀이 타임라인 값으로 만든 시각 글을, 타임라인 없는 가게에 쓰는 틀의 글로([slug].astro 인사이더 팁)
const TIP_PLAIN = '피크 타임 전에 도착하면 좋은 자리를 잡을 수 있다.';
// 보이는 글자(스크립트 · 스타일 · 태그를 뗀 것) · 본문(<main>)
const visText = (h) => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
const mainOf = (h) => (h.match(/<main\b[\s\S]*<\/main>/) || [''])[0];
// 본문의 보이는 글자에 남으면 안 되는 확인 안 된 시각 · 값(ad-set-sillim 의 TIME_RE 에 시각 꼴 · 값 꼴을 더함)
const UNVERIFIED_RE = /\d{1,2}:\d{2}|새벽 ?(?:\d+|한|두|세|네) ?시|\d+시 넘으면|라스트콜|\d[\d,]*\s*원|\d+\s*%/;

// nick0 = 틀이 소스 자료로 그린 옛 담당 글자(가게 이름을 사람처럼 쓴 것) · nick = 넣을 닉네임
// hl = 지어낸 사람 장점이 맨 앞에 든 장점 넷(없으면 null) · compare = 다른 가게와 견주는 칸이 있나 · step0 = 순서 안내의 사람 줄(없으면 null)
// n = 고친 쪽에 있어야 하는 수(tel 전화 링크 · num 보이는 번호 · nick 닉네임)
const ADV_VENUES = [
  {
    rel: 'venue/ilsan-room/index.html', slug: 'ilsan-room', name: '일산룸', nick0: '일산룸', nick: NICK_ROOM, badge: '룸',
    card: 'ilsan-room-adv', heroAlt: '일산룸 룸 일산',
    title0: '일산룸 — 일산룸이라는 이름, 그 자체가 보증수표',
    hl: ['일산룸의 미친 기억력', '벽 하나 사이 완전 방음', '주차장 걱정 제로', '회식 맞춤 세팅'], compare: true,
    hlDrop: ['주차장 걱정 제로'], // 확인 안 된 주차 — 주차 문답 · 본문 주차 문단과 같이 뺀다
    // 설명(검색 결과에 보이는 글)에서도 확인 안 된 주차 구절만 뺀다 — 나머지 글자는 그대로
    desc0: '일산룸 — 일산 한복판, 일산룸이 이름 하나로 버텨온 공간. 그 이유가 있다.. 복도 양쪽으로 공간이 딱 나뉘어 있고, 방음이 미친 수준이다. 벽 하나 사이 완전 방음, 주차장 걱정 제로. 일산 룸 현장 체험 가이드',
    desc1: '일산룸 — 일산 한복판, 일산룸이 이름 하나로 버텨온 공간. 그 이유가 있다.. 복도 양쪽으로 공간이 딱 나뉘어 있고, 방음이 미친 수준이다. 벽 하나 사이 완전 방음. 일산 룸 현장 체험 가이드',
    step0: '일산룸 담당 배정 대기', step1: '매니저 배정 대기', stepDrop: null,
    faq: [
      ['일산룸한테 미리 연락하면 인원에 맞게 세팅해놓습니다.', '미리 연락하면 인원에 맞게 세팅해놓습니다.'],
      [`전화(${OLD_R})로 예약 가능합니다. 일산 주말은 미리 잡아야 대기 없이 입장됩니다.`, '전화로 예약 가능합니다. 일산 주말은 미리 잡아야 대기 없이 입장됩니다.'],
    ],
    // 확인 안 된 주차 · 영업시간 문답 — 보이는 글과 JSON-LD 에서 같이 뺀다
    dropQ: ['주차가 가능한가요?', '일산룸 주차가 되나요?', '일산룸 영업 시간은 어떻게 되나요?'],
    tpDrop: [
      '일산룸이라는 사람이 이 동네서 꽤 오래 이 일을 해왔다. 손님 이름만 대면 지난번에 뭘 좋아했는지 기억하는 부류의 사람이다.',
      '재방문하면 전에 세팅했던 그대로 준비해놓기도 한다. 좀 소름 돋는 기억력이다.',
      '어떤 손님은 1년 만에 왔는데 전에 마시던 음료가 테이블에 올라와 있었다고 한다. 그 순간의 표정을 상상해보라.',
      '일산룸 앞 골목에 해장국집이 있는데 새벽 두 시까지 열어서 마무리까지 완벽하다.', // 확인 안 된 시각이 든 문단
      // 확인 안 된 주차 문단 셋(셋째에는 지어낸 셈 「열에 일곱」도 있다)
      '주차장이 넉넉해서 차 몰고 와도 스트레스가 없다. 건물 지하 주차장이 넓어서 SUV도 편하게 들어간다.',
      '주차가 편한 건 확실한 장점이다. 건물 주차장이 넉넉한 편이라 SUV로 와도 부담 없다.',
      '주차 때문에 스트레스 받는 일은 없다. 일산에서 어디 가냐고 물으면 열에 일곱은 일산룸을 먼저 말한다.',
      // 지어낸 손님 이야기 · 광고 표시와 어긋나는 글(「광고보다 입소문」)
      '일산룸을 처음 알게 된 계기가 지인 소개였다는 사람이 대부분이다. 광고보다 입소문이 이 공간을 키웠다.',
      '일산룸 단골들은 다른 동네 가서도 결국 비교하게 된다고 한다. 기준이 높아져버린 거다.',
      '일산룸만의 방음 시스템은 경기 서부에서 따라올 곳이 없다. 회식 끝나고 나오면서 다음 일산룸 예약 날짜를 잡는 팀장들도 꽤 있다.',
      // 다른 가게 쪽 다섯 곳(클럽 · 나이트 등)에도 글자 그대로 든 문장 — 이 가게의 사실이 아니라 틀이 돌려 쓴 시설 이야기
      '커튼으로 가려진 VIP석이 있다. 예약할 때 물어봐라.',
      '바닥에 LED가 깔려 있다. 걸을 때마다 빛이 따라온다.',
    ],
    tip0: '22:00 전후가 분위기 최고조. 일찍 오면 자리 선점 가능.',
    n: { tel: 5, num: 4, nick: 8, shown: 3 },
  },
  {
    // 일산명월관요정 가게 쪽 — 사람 장점·견주는 칸·순서 안내의 사람 줄이 없는 쪽(없다는 것도 확인한다)
    rel: 'venue/ilsan-myeongwolgwan/index.html', slug: 'ilsan-myeongwolgwan', name: '일산명월관요정', nick0: '일산명월관요정', nick: NICK_YO, badge: '요정',
    checked: '연락처 · 주소',
    card: 'ilsan-myeongwolgwan-adv', heroAlt: '일산명월관요정 요정 일산',
    title0: '일산명월관요정 — 장항로 위, 한정식 코스에 가야금 소리가 얹힌다. 그런 곳이다',
    hl: null, compare: false, step0: null, step1: null,
    // 틀이 그린 장점 넷 · 그 가운데 확인 안 된 방 수 장점만 뺀다(놀쿨 기본 정보 표에 방 수 없음 — 장점 칸 · 서비스 칸 · 숨은 장점)
    hlPlain: ['계절마다 바뀌는 한정식 코스', '국악 라이브 순회 연주', '30개 넘는 개별 공간', '전 메뉴 정찰제'],
    hlPlainDrop: ['30개 넘는 개별 공간'],
    // 확인된 사실 = 상가 건물(우신프라자) 지하 1층 — 놀쿨 기본 정보 표 「장항동 895-1 B1층」 · 행정안전부 주소정보누리집 「장백로 184 우신프라자」 ·
    //   카카오맵 「명월관 · 장백로 184 지하 1층」(셋 다 확인한 날 2026-11-13). 이 사실과 맞지 않는 건물 · 실외 묘사 문장만 뺀 글로(문단의 나머지 문장은 그대로 · 새 글 0)
    tpEdit: [
      ['일산명월관요정은 일산동구 장항로 위에 조용히 서 있다. 명월관이라는 이름을 가진 이 공간은, 한정식 먹으면서 국악 공연까지 보는 곳이다.', '명월관이라는 이름을 가진 이 공간은, 한정식 먹으면서 국악 공연까지 보는 곳이다.'],
      ['한 곡이 울려 퍼지면 방 안 공기가 진동하는 게 느껴진다. 건물이 한옥 양식인데 현대식 편의 시설은 다 갖춰져 있다.', '한 곡이 울려 퍼지면 방 안 공기가 진동하는 게 느껴진다.'],
      // 접객으로 읽힐 수 있는 낱말이 든 문장만 뺀다(광고주 쪽 · 접객 암시 0 — 한장 152줄)
      ['예약할 때 모임 성격을 말해주면 그에 맞는 메뉴와 공간을 추천해준다. 비즈니스 접대인지 가족 모임인지에 따라 세팅이 달라진다.', '예약할 때 모임 성격을 말해주면 그에 맞는 메뉴와 공간을 추천해준다.'],
    ],
    // 보이는 주소 줄 · 지도 단추 검색어 — 소스 자료(others-data.ts)의 글자 · 놀쿨 기본 정보 표 표기(「장항로 895-1」은 주소정보누리집 0건 · 카카오맵 「검색 결과가 없어요」)
    addr: '고양시 일산동구 장항동 895-1 B1층',
    // 사진 없는 「포토 스토리」 칸의 첫 칸 글(기와지붕) — 지하 1층과 맞지 않아 그 칸만 뺀다(칸 수 6 → 5 · 점 · 셈 글 · 스크립트 값까지)
    slideDrop: ['sg-10', '기와지붕 아래 첫 걸음'], slideN: [6, 5],
    // 본문의 보이는 글자에 남으면 안 되는 낱말(지하 1층과 맞지 않는 건물 · 실외 묘사 · 확인 안 된 방 수)
    gone: ['기와지붕', '대문 앞', '마당', '본관', '정원', '창밖', '자연광', '한옥 양식', '장항로 위에', '30개 넘는', '접대', '접객', '도우미'],
    stepDrop: '전문 도우미 안내', // 순서 안내의 이 줄은 접객으로 읽힐 수 있어 뺀다(광고주 쪽 · 접객 암시 0)
    faq: [
      [`전화(${OLD_R})로 예약 가능합니다. 일산 주말은 미리 잡아야 대기 없이 입장됩니다.`, '전화로 예약 가능합니다. 일산 주말은 미리 잡아야 대기 없이 입장됩니다.'],
      // 가게 이름을 사람처럼 쓴 구절을 뺀다
      ['정찰제예요. 코스별 가격은 일산명월관요정한테 전화하시면 바로 안내해드립니다.', '정찰제예요. 코스별 가격은 전화하시면 바로 안내해드립니다.'],
    ],
    dropQ: ['주차가 가능한가요?', '일산명월관요정 주차가 되나요?', '일산명월관요정 영업 시간은 어떻게 되나요?'],
    tpDrop: [
      // 다른 가게 쪽 네 곳(클럽 · 나이트 등)에도 글자 그대로 든 문장 — 이 가게의 사실이 아니라 틀이 돌려 쓴 시설 이야기
      '간판이 일부러 어둡다. 아는 사람만 찾아오라는 뜻이다.',
      '화장실에 양치 도구가 비치되어 있다. 배려가 느껴진다.',
      // 상가 건물 지하 1층이라는 확인된 사실과 맞지 않는 건물 · 실외 묘사뿐인 문단(대문 · 기와지붕 · 마당 · 본관 · 정원 · 창밖 풍경 · 자연광) + 확인 안 된 방 수
      '처음 오는 사람은 대문 앞에서 잠시 멈춘다. 기와지붕 아래로 나무 향이 번지고, 자갈 깔린 마당을 지나야 본관에 닿는다.',
      '그 몇 걸음 사이에 이미 도시의 소음은 등 뒤로 사라진다. 30개 넘는 개별 공간이 있어서 연회든 소모임이든 유연하게 맞춘다.',
      '정원에 사계절 다른 꽃이 피어서 창밖 풍경도 계절마다 다르다. 봄에는 매화, 여름에는 수국, 가을에는 단풍이 창호지 너머로 비친다.',
      '창 너머로 정원이 보이는데, 그 자연광이 공간을 완성시킨다.',
    ],
    tip0: '17:00 전후가 분위기 최고조. 일찍 오면 자리 선점 가능.',
    n: { tel: 5, num: 4, nick: 6, shown: 3 },
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
  if (p.hl) {
    h = sub(h, miss, '장점 칸', `<div class="hl-item"§>${p.hl[0]}</div>`, '');
    h = sub(h, miss, '서비스 칸', `<div class="svc-item"§><span class="svc-check"§>✓</span>${p.hl[0]}</div>`, '');
  }
  // 비교 표 · 비교 카드(담당 = 광고문의 · 포인트 = 다음 장점)
  if (p.compare) {
    h = sub(h, miss, 'VS 담당', `<td class="vs-label"§>담당</td><td§>${p.nick}</td>`, `<td class="vs-label"§>담당</td><td§>${INQ}</td>`);
    h = sub(h, miss, '비교 담당', `<div class="cb-label"§>담당</div> <div class="cb-col"§>${p.nick}</div>`, `<div class="cb-label"§>담당</div> <div class="cb-col"§>${INQ}</div>`);
    h = sub(h, miss, '비교 포인트', `<div class="cb-label"§>포인트</div> <div class="cb-col"§>${p.hl[0]}</div>`, `<div class="cb-label"§>포인트</div> <div class="cb-col"§>${p.hl[1]}</div>`);
  }
  // 순서 안내 · 숨은 장점
  if (p.step0) h = sub(h, miss, '순서 안내', `<li§>${p.step0}</li>`, `<li§>${p.step1}</li>`);
  if (p.hl) h = sub(h, miss, '숨은 장점', `<ul class="sh-list"§> <li§>${p.hl[0]}</li><li§>${p.hl[1]}</li><li§>${p.hl[2]}</li> </ul>`, `<ul class="sh-list"§> <li§>${p.hl[1]}</li><li§>${p.hl[2]}</li><li§>${p.hl[3]}</li> </ul>`);
  h = sub(h, miss, '숨은 장점 단추', `<a href="tel:${p.phone}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm sh-cta"§>지금 문의하기 →</a>`, `<a href="${MAIN_SITE}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm sh-cta"§>자세히 보기 →</a>`);
  // 자주 묻는 것(보이는 글)
  for (const q of p.dropQ) h = removeEl(h, miss, `FAQ 뺌 ${q}`, `<div class="faq-item"§> <div class="faq-q"§>${q}</div>`);
  for (const [o, n] of p.faq) h = sub(h, miss, `FAQ 답 ${o.slice(0, 14)}`, `<div class="faq-a"§>${o}</div>`, `<div class="faq-a"§>${n}</div>`);
  // 본문 문단
  for (const t of p.tpDrop) h = sub(h, miss, `문단 뺌 ${t.slice(0, 14)}`, `<p class="tp-desc"§>${t}</p>`, '');
  for (const [o, n] of p.tpEdit) h = sub(h, miss, `문단 고침 ${o.slice(0, 14)}`, `<p class="tp-desc"§>${o}</p>`, `<p class="tp-desc"§>${n}</p>`);
  h = sub(h, miss, '아래 바', BAR_FROM(p.nick, p.phone), BAR_TO);
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
// 쪽이 다 고쳐졌는지 — 두 틀(가게 쪽 · 요정 갈래 쪽)이 같이 쓰는 확인
function checkCommon(h, bad, has, cardPath, cardUrl, alt, ogSlug, ldType) {
  has(MARK, '표지');
  has(`<meta property="og:image" content="${cardUrl}">`, 'og:image');
  has(`<meta name="twitter:image" content="${cardUrl}">`, 'twitter:image');
  has(`<meta property="og:image:alt" content="${alt}">`, 'og:image:alt');
  has(LARGE, 'robots');
  has('class="phone-bar no-phone"', '광고문의 바');
  has(`${HOST}/og/${ogSlug}.png`, '옛 og 주소', 0);
  for (const s of ['class="phone-bar has-phone"', 'class="phone-float-pc"', 'class="vh-phone-btn"', 'href="tel:']) has(s, `전화 자리 ${s}`, 0);
  const img = firstImgInMain(h);
  if (!img.includes(`src="${cardPath}"`) || !img.includes('width="1200" height="1200"') || /loading="lazy"/.test(img)) bad.push(`본문 첫 그림 ${img.slice(0, 80)}`);
  const d = ldOf(h);
  if (!d) bad.push('JSON-LD 읽기');
  else {
    const biz = nodeOf(d, ldType)[0];
    if (!biz || biz.image !== cardUrl) bad.push('JSON-LD image');
    if (d.some((n) => n && 'telephone' in n)) bad.push('JSON-LD telephone 남음');
    const vis = visibleFaq(h);
    const lds = (nodeOf(d, 'FAQPage')[0] || { mainEntity: [] }).mainEntity.map((q) => q.acceptedAnswer.text);
    if (vis.length !== lds.length || lds.some((t) => !vis.includes(t))) bad.push(`FAQ 보이는 글 ${vis.length} · JSON-LD ${lds.length} 어긋남`);
  }
}
function checkDemote(h, p, cardPath, cardUrl) {
  const bad = [];
  const has = (s, l, n = 1) => { const c = h.split(s).length - 1; if (c !== n) bad.push(`${l}(${c}/${n})`); };
  if (p.title1) { has(`<title>${p.title1}</title>`, 'title'); has(`content="${p.title1}"`, 'og·twitter title', 2); }
  if (p.desc1) has(`content="${p.desc1}"`, '설명 셋', 3);
  if (p.compare) has(INQ, '광고문의 자리(담당 줄·문의 탭·VS·비교·아래 바)', 5);
  else {
    has(INQ, '광고문의 자리(담당 줄·문의 탭·아래 바)', 3);
    for (const s of ['>담당</td>', '>담당</div>']) has(s, `견주는 칸이 없어야 하는 쪽의 ${s}`, 0);
  }
  checkCommon(h, bad, has, cardPath, cardUrl, p.alt, p.slug, 'NightClub');
  return bad;
}

// 남기는 장점 — 지어낸 사람 장점(맨 앞)과 확인 안 된 장점(hlDrop)을 뺀 것
const hlKeep = (p) => p.hl.slice(1).filter((t) => !(p.hlDrop || []).includes(t));
// 사람 장점이 없는 쪽의 남기는 장점 — 확인 안 된 장점(hlPlainDrop)만 뺀 것
const hlPlainKeep = (p) => p.hlPlain.filter((t) => !p.hlPlainDrop.includes(t));
// 가게 쪽 틀이 제목 카드(/og/<slug>.png · 가게 이름 · 지역 · 「놀쿨」 글자만 든 색 카드)를 본문에 네 번 넣으며 다는 alt 넷 → 그려진 것대로
const TP_ALT0 = ['내부 분위기', '분위기 현장', '사운드 시스템', '인사이더 가이드'];
const TP_ALT1 = (p) => `${p.name} 제목 카드`;

// 일산 가게 쪽 둘(/venue/ilsan-room/ · /venue/ilsan-myeongwolgwan/) → 광고주 세트
function applyAdv(h, miss, p, cardPath, cardUrl) {
  const alt = altOf(p);
  if (p.desc0) for (const k of ['name="description"', 'property="og:description"', 'name="twitter:description"']) h = sub(h, miss, k, `<meta ${k} content="${p.desc0}">`, `<meta ${k} content="${p.desc1}">`);
  h = headCard(h, miss, p.slug, p.title0, alt, cardUrl);
  h = sub(h, miss, '머리 끝(안내 창 자리)', '</head>', `${BAR_STYLE}</head>`);
  // 첫 화면: 광고 표시 · 담당 줄 · 전화 단추 · 첫 그림
  h = sub(h, miss, '광고 표시', `<div class="vh-badge"§>${p.badge}</div> <h1§>${p.name}</h1>`, `<div class="vh-badge"§>${p.badge}</div> ${AGE}<h1§>${p.name}</h1>`);
  h = sub(h, miss, '담당 줄', `<p class="vh-nick"§>담당: ${p.nick0}</p>`, `<p class="vh-nick"§>담당: ${p.nick}</p>`);
  h = sub(h, miss, '전화 단추', `<a href="tel:${OLD_R}" class="vh-phone-btn"§>`, `<a href="${NEW_HREF}" class="vh-phone-btn"§>`);
  h = sub(h, miss, '전화 단추 글', `<span class="vh-phone-label"§>${p.nick0} 바로 연결</span>`, `<span class="vh-phone-label"§>${p.nick} 바로 연결</span>`);
  h = sub(h, miss, '전화 단추 번호', `<span class="vh-phone-num"§>${OLD_R}</span>`, `<span class="vh-phone-num"§>${NEW}</span>`);
  h = sub(h, miss, '첫 그림', `<img src="/og/${p.slug}.png" alt="${p.heroAlt}" width="1200" height="630" loading="lazy" class="vh-img"§>`, `<img src="${cardPath}" alt="${alt}" width="1200" height="1200" fetchpriority="high" class="vh-img" style="aspect-ratio:1/1;height:auto;"§>`);
  // 문의 탭
  h = sub(h, miss, '문의 탭',
    `<div style="text-align:center;padding:20px;"§> <p style="font-size:16px;color:var(--text);margin-bottom:16px;"§>${p.name} 담당자에게 직접 문의하세요</p> <p style="font-size:14px;color:var(--text-secondary);margin-bottom:4px;"§>${p.nick0} 담당</p> <a href="tel:${OLD_R}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-block mt-md"§>${OLD_R} 전화하기</a> </div>`,
    `<div style="text-align:center;padding:20px;"§> <p style="font-size:16px;color:var(--text);margin-bottom:16px;"§>${p.name} 담당자에게 직접 문의하세요</p> <p style="font-size:14px;color:var(--text-secondary);margin-bottom:4px;"§>담당 ${p.nick}</p> <a href="${NEW_HREF}" class="btn btn-primary btn-block mt-md"§>${NEW} 전화하기</a> </div>`);
  // 장점 · 서비스 칸에서 지어낸 사람 장점 빼기
  if (p.hl) {
    h = sub(h, miss, '장점 칸', `<div class="hl-item"§>${p.hl[0]}</div>`, '');
    h = sub(h, miss, '서비스 칸', `<div class="svc-item"§><span class="svc-check"§>✓</span>${p.hl[0]}</div>`, '');
    for (const t of p.hlDrop || []) {
      h = sub(h, miss, `장점 칸 ${t}`, `<div class="hl-item"§>${t}</div>`, '');
      h = sub(h, miss, `서비스 칸 ${t}`, `<div class="svc-item"§><span class="svc-check"§>✓</span>${t}</div>`, '');
    }
  }
  // 사람 장점이 없는 쪽 — 확인 안 된 장점(방 수)만 장점 칸 · 서비스 칸 · 숨은 장점에서 뺀다(숨은 장점 = 남는 장점 앞 셋 · 새 글 0)
  if (p.hlPlain) {
    for (const t of p.hlPlainDrop) {
      h = sub(h, miss, `장점 칸 ${t}`, `<div class="hl-item"§>${t}</div>`, '');
      h = sub(h, miss, `서비스 칸 ${t}`, `<div class="svc-item"§><span class="svc-check"§>✓</span>${t}</div>`, '');
    }
    h = sub(h, miss, '숨은 장점', `<ul class="sh-list"§> ${p.hlPlain.slice(0, 3).map((t) => `<li§>${t}</li>`).join('')} </ul>`, `<ul class="sh-list"§> ${hlPlainKeep(p).slice(0, 3).map((t) => `<li§>${t}</li>`).join('')} </ul>`);
  }
  // 본문에 네 번 든 그림은 사진이 아니라 가게 이름이 적힌 제목 카드다 — alt 를 그려진 것대로(없는 사진을 설명하는 글 0 · 구글 이미지 공식: alt = 그려진 것)
  for (const t of TP_ALT0) h = sub(h, miss, `본문 그림 alt ${t}`, `<img src="/og/${p.slug}.png" alt="${p.name} ${t}" width="1200" height="630" loading="lazy" class="tp-img"§>`, `<img src="/og/${p.slug}.png" alt="${TP_ALT1(p)}" width="1200" height="630" loading="lazy" class="tp-img"§>`);
  // 비교 표 · 비교 카드(담당 = 닉네임 · 포인트 = 다음 장점)
  if (p.compare) {
    h = sub(h, miss, 'VS 담당', `<td class="vs-label"§>담당</td><td§>${p.nick0}</td>`, `<td class="vs-label"§>담당</td><td§>${p.nick}</td>`);
    h = sub(h, miss, '비교 담당', `<div class="cb-label"§>담당</div> <div class="cb-col"§>${p.nick0}</div>`, `<div class="cb-label"§>담당</div> <div class="cb-col"§>${p.nick}</div>`);
    h = sub(h, miss, '비교 포인트', `<div class="cb-label"§>포인트</div> <div class="cb-col"§>${p.hl[0]}</div>`, `<div class="cb-label"§>포인트</div> <div class="cb-col"§>${p.hl[1]}</div>`);
  }
  // 순서 안내 · 숨은 장점
  if (p.step0) h = sub(h, miss, '순서 안내', `<li§>${p.step0}</li>`, `<li§>${p.step1}</li>`);
  if (p.stepDrop) h = sub(h, miss, '순서 안내(접객으로 읽힐 줄)', `<li§>${p.stepDrop}</li>`, '');
  if (p.hl) h = sub(h, miss, '숨은 장점', `<ul class="sh-list"§> <li§>${p.hl[0]}</li><li§>${p.hl[1]}</li><li§>${p.hl[2]}</li> </ul>`, `<ul class="sh-list"§> ${hlKeep(p).slice(0, 3).map((t) => `<li§>${t}</li>`).join('')} </ul>`);
  h = sub(h, miss, '숨은 장점 단추', `<a href="tel:${OLD_R}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm sh-cta"§>지금 문의하기 →</a>`, `<a href="${NEW_HREF}" class="btn btn-primary btn-sm sh-cta"§>지금 문의하기 →</a>`);
  // 자주 묻는 것(보이는 글) — 확인 안 된 주차 · 영업시간 문답은 통째로 빼고(JSON-LD 는 아래에서 같이),
  //   남는 답은 가게 이름을 사람처럼 쓴 구절·옛 번호를 뺀 글(닉네임·번호는 넣지 않는다)
  for (const q of p.dropQ) h = removeEl(h, miss, `FAQ 뺌 ${q}`, `<div class="faq-item"§> <div class="faq-q"§>${q}</div>`);
  for (const [o, n] of p.faq) h = sub(h, miss, `FAQ 답 ${o.slice(0, 14)}`, `<div class="faq-a"§>${o}</div>`, `<div class="faq-a"§>${n}</div>`);
  // 본문 문단 — 지어낸 사람 이야기 · 확인 안 된 시각이 든 문단
  for (const t of p.tpDrop) h = sub(h, miss, `문단 뺌 ${t.slice(0, 14)}`, `<p class="tp-desc"§>${t}</p>`, '');
  // 본문 문단 — 확인 안 된 문장만 뺀 글로(문단의 나머지 문장은 그대로)
  for (const [o, n] of p.tpEdit || []) h = sub(h, miss, `문단 고침 ${o.slice(0, 14)}`, `<p class="tp-desc"§>${o}</p>`, `<p class="tp-desc"§>${n}</p>`);
  // 사진 없는 「포토 스토리」 칸 — 사실과 맞지 않는 글이 든 칸 하나를 빼고 칸 수(마지막 점 · 셈 글 · 스크립트 값)를 맞춘다
  if (p.slideDrop) {
    const [a, b] = p.slideN;
    h = sub(h, miss, '사진 칸 뺌', `<div class="swipe-slide ${p.slideDrop[0]}"§> <span class="sg-label"§>${p.slideDrop[1]}</span> </div>`, '');
    h = sub(h, miss, '사진 칸 점', `<span class="swipe-dot" data-idx="${a - 1}"§></span>`, '');
    h = sub(h, miss, '사진 칸 셈 글', `<p class="tp-note" id="galleryCounter"§>1 / ${a}</p>`, `<p class="tp-note" id="galleryCounter"§>1 / ${b}</p>`);
    h = swap(h, miss, '사진 칸 셈 값', `var total = ${a};`, `var total = ${b};`, 1);
  }
  // 광고주 쪽 표준 — 틀이 셈으로 만든 숫자 · 지어낸 후기 인용 · 쿠폰 · 확인 안 된 영업시간 · 요금 · 걸리는 시간 · 행사 칸
  h = dropAll(h, miss, [...VENUE_DROP, ...LAYOUT_DROP], p.compare);
  h = sub(h, miss, '최적 방문 시간 글', `<h4§>최적 방문 시간</h4> <p§>${p.tip0}</p>`, `<h4§>최적 방문 시간</h4> <p§>${TIP_PLAIN}</p>`);
  h = sub(h, miss, '아래 바', BAR_FROM(p.nick0, OLD_R), BAR_ADV);
  // JSON-LD
  h = ldEdit(h, miss, p.slug, (d) => {
    const biz = nodeOf(d, 'NightClub');
    if (biz.length !== 1) { miss.push(`JSON-LD NightClub(찾은 수 ${biz.length})`); return; }
    if (biz[0].telephone !== OLD_R) miss.push('JSON-LD telephone 값');
    biz[0].telephone = NEW_LD;
    if (biz[0].image !== `${HOST}/og/${p.slug}.png`) miss.push('JSON-LD image 값');
    biz[0].image = cardUrl;
    if (p.desc0) { if (biz[0].description !== p.desc0) miss.push('JSON-LD description 값'); else biz[0].description = p.desc1; }
    for (const k of ['openingHours', 'openingHoursSpecification', 'priceRange']) if (k in biz[0]) miss.push(`JSON-LD ${k} 가 있음(확인 안 된 값)`);
    for (const q of p.dropQ) faqDrop(d, miss, p.slug, q);
    for (const [o, n] of p.faq) faqSet(d, miss, p.slug, o, n);
  });
  h = sub(h, miss, '본문 끝 알림', '</main>', `${NOTICE(p.nick, p.checked)}</main>`);
  h = sub(h, miss, '표지', '</body>', `${MARK}</body>`);
  return h;
}
// 광고주 세트가 다 들어갔는지 — 두 틀(가게 쪽 · 요정 갈래 쪽)이 같이 쓰는 확인
function checkAdvCommon(h, bad, has, p, cardPath, cardUrl, ogSlug, ldType) {
  const alt = altOf(p);
  has(MARK, '표지');
  has(`<meta property="og:image" content="${cardUrl}">`, 'og:image');
  has(`<meta name="twitter:image" content="${cardUrl}">`, 'twitter:image');
  has(`<meta property="og:image:alt" content="${alt}">`, 'og:image:alt');
  has(LARGE, 'robots');
  has(`${BAR_STYLE}</head>`, '머리 끝(안내 창 자리)');
  has(`${HOST}/og/${ogSlug}.png`, '옛 og 주소', 0);
  has(`${AGE}<h1`, 'h1 바로 앞 광고 표시');
  has(`${NOTICE(p.nick, p.checked)}</main>`, '본문 끝 알림');
  has(INQ, '광고문의 글자(광고주 쪽에는 없어야 함)', 0);
  has('class="phone-bar no-phone"', '광고문의 바(없어야 함)', 0);
  has(`<a href="${NEW_HREF}" class="phone-bar has-phone"`, '고정 전화바');
  has(`</span> ${NEW} </a>`, '고정 전화바 글자(번호만)');
  has(`class="phone-float-pc" aria-label="전화하기" title="${NEW}"`, '떠 있는 전화 단추');
  has('href="tel:', '전화 링크', p.n.tel);
  has(`href="${NEW_HREF}"`, '새 번호 전화 링크', p.n.tel);
  has(NEW, '보이는 번호', p.n.num);
  has(p.nick, '닉네임', p.n.nick);
  has(NICK_X, '닉네임 끝 낱말(닉네임 꼴로만)', p.n.nick);
  has('총책임자', '「총책임자」(닉네임 꼴로만)', p.n.nick);
  const img = firstImgInMain(h);
  if (!img.includes(`src="${cardPath}"`) || !img.includes(`alt="${alt}"`) || !img.includes('width="1200" height="1200"') || /loading="lazy"/.test(img)) bad.push(`본문 첫 그림 ${img.slice(0, 80)}`);
  const d = ldOf(h);
  if (!d) bad.push('JSON-LD 읽기');
  else {
    const biz = nodeOf(d, ldType)[0];
    if (!biz || biz.image !== cardUrl) bad.push('JSON-LD image');
    if (!biz || biz.telephone !== NEW_LD) bad.push('JSON-LD telephone');
    if (d.filter((n) => n && 'telephone' in n).length !== 1) bad.push('JSON-LD telephone 이 한 곳이 아님');
    const vis = visibleFaq(h);
    const lds = (nodeOf(d, 'FAQPage')[0] || { mainEntity: [] }).mainEntity.map((q) => q.acceptedAnswer.text);
    if (vis.length !== lds.length || lds.some((t) => !vis.includes(t))) bad.push(`FAQ 보이는 글 ${vis.length} · JSON-LD ${lds.length} 어긋남`);
    const telRe = new RegExp(TEL_N.tail);
    if ([...vis, ...lds].some((t) => t.includes(NICK_X) || telRe.test(t))) bad.push('자주 묻는 것 답에 닉네임·번호');
    for (const n of d) for (const k of ['openingHours', 'openingHoursSpecification', 'priceRange', 'aggregateRating', 'review']) if (n && k in n) bad.push(`JSON-LD ${k}(확인 안 된 값)`);
  }
  // 광고주 쪽 표준 — 빼는 칸 · 뺀 문답 · 보이는 번호 수 · 확인 안 된 시각과 값
  bad.push(...leftOf(h, LAYOUT_DROP));
  for (const q of p.dropQ) has(q, `뺀 문답 「${q}」`, 0);
  const shown = visText(h).split(NEW).length - 1;
  if (shown !== p.n.shown || shown > 3) bad.push(`보이는 글자의 번호 ${shown}번(기대 ${p.n.shown} · 3번 이하)`);
  // (읽은 만큼 보여 주는 화면 칸 「0%」는 가게 사실이 아니라 뗀 뒤에 본다)
  const tm = visText(mainOf(h).replace(/<span id="scrollPct"[^>]*>\d+%<\/span>/, '')).match(UNVERIFIED_RE);
  if (tm) bad.push(`확인 안 된 시각·값 「${tm[0]}」 남음(본문의 보이는 글자)`);
}
function checkAdv(h, p, cardPath, cardUrl) {
  const bad = [];
  const has = (s, l, n = 1) => { const c = h.split(s).length - 1; if (c !== n) bad.push(`${l}(${c}/${n})`); };
  has(`>담당: ${p.nick}</p>`, '담당 줄');
  has(`>${p.nick} 바로 연결</span>`, '전화 단추 글');
  has(`>${NEW}</span>`, '전화 단추 번호');
  has(`>담당 ${p.nick}</p>`, '문의 탭 담당');
  has(`>${NEW} 전화하기</a>`, '문의 탭 전화 단추');
  if (p.compare) { has(`>${p.nick}</td>`, 'VS 담당'); has(`>${p.nick}</div>`, '비교 담당'); }
  else for (const s of ['>담당</td>', '>담당</div>']) has(s, `견주는 칸이 없어야 하는 쪽의 ${s}`, 0);
  if (p.hl) has(p.hl[0], '지어낸 사람 장점', 0);
  for (const t of p.hlDrop || []) has(t, `뺀 장점 「${t}」`, 0);
  if (p.desc1) { has(`content="${p.desc1}"`, '설명 셋', 3); has(p.desc0, '옛 설명', 0); }
  if (p.stepDrop) has(p.stepDrop, `뺀 순서 줄 「${p.stepDrop}」`, 0);
  bad.push(...leftOf(h, VENUE_DROP));
  has(p.tip0, '틀이 타임라인으로 만든 시각 글', 0);
  has(`>${TIP_PLAIN}</p>`, '최적 방문 시간 글');
  for (const t of p.tpDrop) has(t, `뺀 문단 ${t.slice(0, 14)}`, 0);
  for (const [o, n] of p.tpEdit || []) { has(o, `고친 문단의 옛 글 ${o.slice(0, 14)}`, 0); has(`>${n}</p>`, `고친 문단 ${n.slice(0, 14)}`); }
  for (const t of p.hlPlainDrop || []) has(t, `뺀 장점 「${t}」`, 0);
  if (p.hlPlain) {
    const sh = (h.match(/<ul class="sh-list"[^>]*>([\s\S]*?)<\/ul>/) || ['', ''])[1].replace(/<[^>]+>/g, '|').split('|').map((s) => s.trim()).filter(Boolean);
    const want = hlPlainKeep(p).slice(0, 3);
    if (sh.join('|') !== want.join('|')) bad.push(`숨은 장점 [${sh.join(' · ')}](기대 [${want.join(' · ')}])`);
  }
  for (const t of TP_ALT0) has(`alt="${p.name} ${t}"`, `옛 본문 그림 설명 「${t}」`, 0);
  has(`alt="${TP_ALT1(p)}"`, '본문 그림 alt(제목 카드)', 4);
  if (p.addr) {
    has(`주소:</strong> ${p.addr}</p>`, '주소 줄(놀쿨 기본 정보 표 표기)');
    has(`href="https://map.kakao.com/?q=${encodeURIComponent(p.addr)}"`, '지도 단추 검색어(주소 줄과 같은 글자)');
    has('장항로 895', '없는 주소 표기 「장항로 895」', 0);
  }
  if (p.slideDrop) {
    has(p.slideDrop[1], `뺀 사진 칸 글 「${p.slideDrop[1]}」`, 0);
    has('<div class="swipe-slide ', '사진 칸 수', p.slideN[1]);
    has('<span class="swipe-dot', '사진 칸 점 수', p.slideN[1]);
    has(`>1 / ${p.slideN[1]}</p>`, '사진 칸 셈 글');
    has(`var total = ${p.slideN[1]};`, '사진 칸 셈 값');
    has(`var total = ${p.slideN[0]};`, '사진 칸 옛 셈 값', 0);
  }
  { const vis = visText(mainOf(h)); for (const s of p.gone || []) if (vis.includes(s)) bad.push(`사실과 맞지 않는 묘사 「${s}」 남음(본문의 보이는 글자)`); }
  checkAdvCommon(h, bad, has, p, cardPath, cardUrl, p.slug, 'NightClub');
  return bad;
}

// 일산명월관요정 요정 갈래 쪽(틀이 가게 쪽과 다르다) — 틀이 그린 사람 호칭 「일산룸 총책임자」가 든 자리 13곳:
//   연락 자리(담당 줄 · 안내 표 담당 · 안내 표 전화 단추 · 상담 칸) = 이 쪽 닉네임 + 새 번호
//   글 자리(설명 셋 · 사람 문단 · 준비 목록 · 자주 묻는 것 답 둘) = 일산74-2 때 고친 글 그대로(사람 호칭 없는 글)
const YO = {
  rel: 'yojeong/ilsan/myeongwolgwan/index.html', card: 'yojeong-ilsan-myeongwolgwan-adv', ogSlug: 'ilsan-myeongwolgwan',
  name: '일산명월관요정', nick: NICK_YO, checked: '연락처 · 주소',
  h1: '장항로 명월관 — 달빛 아래 차려지는 격조 높은 연회',
  title0: '일산 명월관 — 30개 프라이빗 공간에서 코스 요리와 가야금 라이브',
  desc0: '일산 장항로 기와건물, 30개 프라이빗 룸에서 일산룸 총책임자가 직접 맞이합니다. 정찰제 한정식 코스에 가야금 연주까지 — 접대 자리 잡으려면 여기부터 전화하세요.',
  // 설명 — 사람 호칭을 뺀 글(일산74-2)에서, 확인된 사실과 맞지 않는 「장항로 기와건물, 30개」만 동 이름으로(없는 도로 이름 · 상가 건물 지하 1층 · 확인 안 된 방 수 — 새 사실 0)
  //   + 접객으로 읽힐 수 있는 낱말 「접대 자리」 → 「모임 자리」(광고주 쪽 · 접객 암시 0)
  desc1: '일산 장항동 프라이빗 룸에서 손님을 맞이합니다. 정찰제 한정식 코스에 가야금 연주까지 — 모임 자리 잡으려면 여기부터 확인하세요.',
  // h1 · JSON-LD 설명의 도로 이름 「장항로」 → 동 이름 「장항동」(이 가게의 도로명 주소는 장백로 184 · 「장항로 895-1」은 없는 주소 · 제목은 그대로 둔다)
  h1New: '장항동 명월관 — 달빛 아래 차려지는 격조 높은 연회',
  ldDesc: ['일산 장항로 전통 한정식과 국악 공연 공간', '일산 장항동 전통 한정식과 국악 공연 공간'],
  // 주소 글자 = 소스(myeongwolgwan.astro)와 같이 · 놀쿨 기본 정보 표 표기(행정안전부 주소정보누리집 대조 2026-11-13: 장항동 895-1 = 장백로 184 우신프라자 · 「장항로 895-1」은 없는 주소 ·
  //   카카오맵 2026-11-13: 「명월관 · 장백로 184 지하 1층」)
  addr: '고양시 일산동구 장항동 895-1 B1층', street: '장항동 895-1 B1층',
  faq: [
    // 값(원)은 확인 안 된 것이라 뺀다 — 「정찰제 · 가격표는 문의」만 남긴다
    ['전 메뉴 정찰제입니다. 기본 코스는 1인당 80,000원부터, 한우+전복 코스는 150,000원 선입니다. 정확한 가격표는 일산룸 총책임자에게 문의하시면 바로 안내드립니다.', '전 메뉴 정찰제입니다. 정확한 가격표는 문의하시면 바로 안내드립니다.'],
    [`전화로 예약 가능합니다. 일산룸 총책임자(${OLD_R})에게 직접 연락하시면 모임 성격에 맞는 공간과 메뉴를 사전에 조율해 드립니다. 주말과 공휴일은 최소 3일 전 예약을 권장합니다.`, '전화로 예약 가능합니다. 직접 연락하시면 모임 성격에 맞는 공간과 메뉴를 사전에 조율해 드립니다.'],
    // 점심 영업으로 읽히는 문장(확인 안 된 영업시간)을 뺀다
    ['물론입니다. 한정식 코스만 주문하셔도 되며, 무알코올 음료와 전통차도 다양하게 준비되어 있습니다. 비즈니스 런치 미팅 등 음주 없는 모임도 많이 이용합니다.', '물론입니다. 한정식 코스만 주문하셔도 되며, 무알코올 음료와 전통차도 다양하게 준비되어 있습니다.'],
  ],
  // 이 사이트 광고주 쪽 표준과 같은 종류만 뺀다(새 글로 채우지 않는다): 확인 안 된 주차 · 영업시간 · 걸리는 시간 · 환불 값이 든 문답,
  //   안내 표의 영업시간 · 주차 줄, 값 · 시각 · 걸리는 시간이 든 칸, 준비 목록의 주차 · 복장 줄, 지어낸 사람 · 후기 인용 문장
  //   + 확인 안 된 방 수 · 수용 인원(문답 하나 · 안내 표 「공간」 줄 · 본문 문장 하나) — 놀쿨 기본 정보 표에 없는 값
  //   + 접객으로 읽힐 수 있는 낱말이 든 문답 하나(「외국인 손님 접대」 — 답의 영문 메뉴판 · 한복 시착도 확인 안 된 것)
  dropQ: ['주차가 가능한가요?', '국악 공연은 항상 있나요?', '일산역에서 거리가 얼마나 되나요?', '환불 및 취소 정책은 어떻게 되나요?', '단체 연회는 최대 몇 명까지 가능한가요?', '외국인 손님 접대도 가능한가요?'],
  faqCount: [12, 6],
  rows: [['영업시간', '점심 11:30~14:00 / 저녁 17:00~22:00'], ['주차', '전용 주차장 30대 + 발렛 가능'], ['공간', '30개+ 프라이빗 공간 (4인~80인)']],
  //   + 상가 건물 지하 1층이라는 확인된 사실과 맞지 않는 건물 · 실외 묘사(기와지붕 · 마당 · 정원 · 연못 · 노을)와 원산지 · 등급을 단정한 메뉴 글이 든 칸,
  //     확인 안 된 예약 조건 숫자(「최소 2일 전」 · 「최소 3일 전」) · 값 표와 한 묶음이던 코스 이름
  sections: [['코스 메뉴 안내(값)', 'mw-price'], ['타임라인(시각)', 'mw-timeline'], ['주변 안내(걸리는 시간)', 'mw-area'], ['계절별 추천 메뉴(정원 묘사 · 원산지 단정)', 'mw-seasons']],
  guideDrop: [
    ['주차 줄', '<li§><strong§>주차 안내 확인</strong> — 전용 주차장 30대, 발렛 파킹 운영 중</li>'],
    ['복장 줄', '<li§><strong§>드레스코드</strong> — 격식 있는 자리는 비즈니스 캐주얼 권장</li>'],
  ],
  // 준비 목록의 줄 고침(남는 글은 그대로 · 새 글 0)
  guideEdit: [
    ['코스 줄', '<li§><strong§>코스 선택</strong> — 기본/한우+전복/VIP 중 선택하고 알레르기나 식이 제한 전달</li>', '<li§><strong§>코스 선택</strong> — 알레르기나 식이 제한 전달</li>'],
  ],
  // 통째로 빼는 본문 문단(문단 머리 글자로 찾는다) — 건물 · 실외 묘사뿐인 문단
  paraDrop: [
    ['달빛 문단(장항로 끝자락 · 기와지붕)', '달빛이 내려앉는 밤,'],
    ['정원 문단(연못 · 돌다리 · 노을)', '건물 뒷편에 정원이 있다.'],
    // 예약이 는다는 글(지어낸 활동) · 확인 안 된 직원·체험 · 견줄 데 없다는 단정이 한 문단에 든 것
    ['킨텍스 문단(예약 급증 · 영어 안내 직원 · 한복 체험 · 「이보다 나은 선택은 찾기 어렵다」)', '킨텍스에서 전시회가 열리는 시즌에는'],
  ],
  cut: [
    ' 조리장은 서울 유명 한식당 출신으로, 가락시장 새벽 경매에 직접 나간다.',
    ' "나중에 청구서를 보고 놀랄 일이 없다"는 것이 단골들의 공통된 평가다.',
    ' 4인이 마주 앉아 조용히 이야기를 나누기 좋은 작은 방이 있는가 하면, 대형 원탁이 놓여 80인이 넘는 단체가 한자리에 모일 수 있는 대연회장도 갖추고 있다.',
    // 문단 머리의 실외 묘사 두 문장(마당) — 문단의 나머지(방 · 방음 이야기)는 그대로
    '입구를 지나면 넓은 마당이 보인다. 그 마당을 둘러싸듯 이어진 각각의 독립된 방들이 명월관의 핵심이다. ',
    // 접객으로 읽힐 수 있는 낱말이 든 문장(문단의 나머지 — 정찰제 이야기 — 는 그대로)
    ' 비즈니스 접대 목적으로 방문하는 임원급 고객들에게 이 투명성은 중요한 선택 기준이 된다.',
  ],
  // 본문의 보이는 글자에 남으면 안 되는 낱말(「기와」만 쓰면 「분위기와」에 걸려 지붕·건물 꼴로 적는다)
  gone: ['기와지붕', '기와건물', '마당', '정원', '연못', '돌다리', '노을', '장항로', '최소 2일 전', '최소 3일 전', '한우+전복', '제주산', '통영산', '1++', '접대', '접객', '도우미', '킨텍스', '이보다 나은'],
  n: { tel: 4, num: 3, nick: 7, shown: 2 },
};
function applyYo(h, miss, p, cardPath, cardUrl) {
  const alt = altOf(p);
  for (const k of ['name="description"', 'property="og:description"', 'name="twitter:description"']) h = sub(h, miss, k, `<meta ${k} content="${p.desc0}">`, `<meta ${k} content="${p.desc1}">`);
  h = headCard(h, miss, p.ogSlug, p.title0, alt, cardUrl);
  h = sub(h, miss, '머리 끝(안내 창 자리)', '</head>', `${BAR_STYLE}</head>`);
  // 첫 화면: 광고 표시 · 담당 줄 · 첫 그림
  h = sub(h, miss, '광고 표시', `<div class="mw-badge"§>전통 한정식</div> <h1§>${p.h1}</h1>`, `<div class="mw-badge"§>전통 한정식</div> ${AGE}<h1§>${p.h1New}</h1>`);
  h = sub(h, miss, '담당 줄', `<p class="mw-sub"§>담당: 일산룸 총책임자 · ${p.addr}</p>`, `<p class="mw-sub"§>담당: ${p.nick} · ${p.addr}</p>`);
  h = sub(h, miss, '첫 그림', `<img src="/og/${p.ogSlug}.png" alt="일산 전통 연회 공간" width="1200" height="630" loading="lazy" class="mw-img"§>`, `<img src="${cardPath}" alt="${alt}" width="1200" height="1200" fetchpriority="high" class="mw-img" style="aspect-ratio:1/1;height:auto;"§>`);
  // 지어낸 사람 이야기뿐인 문단은 통째로 뺀다
  h = sub(h, miss, '사람 문단', /<p((?: data-astro-cid-[a-z0-9]+)*)>\s*일산룸 총책임자가 이 공간을 관리한다\.[^<]*<\/p> ?/, '');
  // 확인된 사실(상가 건물 지하 1층)과 맞지 않는 건물 · 실외 묘사뿐인 문단도 통째로 뺀다
  for (const [label, head] of p.paraDrop) h = sub(h, miss, `문단 뺌 ${label}`, new RegExp(`<p((?: data-astro-cid-[a-z0-9]+)*)>\\s*${esc(head)}[^<]*<\\/p> ?`), '');
  // 안내 표: 담당 칸 = 닉네임 + 번호 · 전화 단추 = 새 번호
  h = sub(h, miss, '안내 표 담당', `<td class="info-label"§>담당</td><td§>일산룸 총책임자 (${OLD_R})</td>`, `<td class="info-label"§>담당</td><td§>${p.nick} (${NEW})</td>`);
  h = sub(h, miss, '안내 표 전화 단추', `<a href="tel:${OLD_R}" target="_blank" class="btn btn-primary btn-block mt-md"§>`, `<a href="${NEW_HREF}" class="btn btn-primary btn-block mt-md"§>`);
  h = swap(h, miss, '안내 표 전화 단추 글', '일산룸 총책임자에게 전화하기', `${p.nick}에게 전화하기`, 1);
  // 준비 목록 · 자주 묻는 것(보이는 글) — 사람 호칭 없는 글(닉네임·번호는 넣지 않는다)
  h = sub(h, miss, '준비 목록', '<strong§>사전 예약 필수</strong> — 최소 2일 전 일산룸 총책임자에게 인원, 예산, 모임 성격을 알려주세요</li>', '<strong§>사전 예약 필수</strong> — 인원, 예산, 모임 성격을 알려주세요</li>');
  for (const [label, from, to] of p.guideEdit) h = sub(h, miss, `준비 목록 ${label}`, from, to);
  for (const q of p.dropQ) h = removeEl(h, miss, `FAQ 뺌 ${q}`, `<div class="faq-item"§> <div class="faq-q"§>${q}</div>`);
  for (const [o, n] of p.faq) h = sub(h, miss, `FAQ 답 ${o.slice(0, 14)}`, `<div class="faq-a"§>${o}</div>`, `<div class="faq-a"§>${n}</div>`);
  h = sub(h, miss, '자주 묻는 것 수', `<h2§>자주 묻는 질문 (${p.faqCount[0]}개)</h2>`, `<h2§>자주 묻는 질문 (${p.faqCount[1]}개)</h2>`);
  // 광고주 쪽 표준 — 확인 안 된 영업시간 · 주차 줄, 값 · 시각 · 걸리는 시간 칸, 준비 목록의 주차 · 복장 줄, 지어낸 사람 · 후기 인용 문장, 틀의 떠오르는 알림
  for (const [k, v] of p.rows) h = sub(h, miss, `안내 표 ${k} 줄`, `<tr§><td class="info-label"§>${k}</td><td§>${v}</td></tr>`, '');
  for (const [label, cls] of p.sections) h = removeEl(h, miss, label, `<section class="${cls}"§>`);
  for (const [label, li] of p.guideDrop) h = sub(h, miss, `준비 목록 ${label}`, li, '');
  for (const s of p.cut) h = swap(h, miss, `문장 뺌 ${s.slice(1, 15)}`, s, '', 1);
  h = dropAll(h, miss, LAYOUT_DROP);
  // 상담 칸: 글 = 닉네임 · 전화 단추 = 새 번호
  h = sub(h, miss, '상담 칸 글', '<h3§>명월관 예약 상담</h3> <p§>일산룸 총책임자에게 직접 문의하세요</p>', `<h3§>명월관 예약 상담</h3> <p§>${p.nick}에게 직접 문의하세요</p>`);
  h = sub(h, miss, '상담 칸 전화 단추', `<a href="tel:${OLD_R}" target="_blank" class="btn btn-primary"§>`, `<a href="${NEW_HREF}" class="btn btn-primary"§>`);
  h = sub(h, miss, '아래 바', BAR_FROM('일산명월관요정', OLD_R), BAR_ADV);
  // JSON-LD
  h = ldEdit(h, miss, p.rel, (d) => {
    const biz = nodeOf(d, 'LocalBusiness');
    if (biz.length !== 1) { miss.push(`JSON-LD LocalBusiness(찾은 수 ${biz.length})`); return; }
    if (biz[0].telephone !== OLD_R) miss.push('JSON-LD telephone 값');
    if ('image' in biz[0]) miss.push('JSON-LD image 가 이미 있음');
    const nu = putAfter(biz[0], 'description', 'image', cardUrl);
    nu.telephone = NEW_LD;
    if (nu.description !== p.ldDesc[0]) miss.push('JSON-LD description 값'); else nu.description = p.ldDesc[1];
    d[d.indexOf(biz[0])] = nu;
    for (const k of ['openingHours', 'openingHoursSpecification', 'priceRange']) if (k in nu) miss.push(`JSON-LD ${k} 가 있음(확인 안 된 값)`);
    for (const q of p.dropQ) faqDrop(d, miss, p.rel, q);
    for (const [o, n] of p.faq) faqSet(d, miss, p.rel, o, n);
  });
  h = sub(h, miss, '본문 끝 알림', '</main>', `${NOTICE(p.nick, p.checked)}</main>`);
  h = sub(h, miss, '표지', '</body>', `${MARK}</body>`);
  return h;
}
function checkYo(h, p, cardPath, cardUrl) {
  const bad = [];
  const has = (s, l, n = 1) => { const c = h.split(s).length - 1; if (c !== n) bad.push(`${l}(${c}/${n})`); };
  has(`content="${p.desc1}"`, '설명 셋', 3);
  has(`>담당: ${p.nick} · ${p.addr}</p>`, '담당 줄');
  has(`>${p.nick} (${NEW})</td>`, '안내 표 담당');
  has(`${p.nick}에게 전화하기`, '안내 표 전화 단추 글');
  has(`>${p.nick}에게 직접 문의하세요</p>`, '상담 칸 글');
  for (const [k] of p.rows) has(`>${k}</td>`, `뺀 안내 표 줄 「${k}」`, 0);
  for (const [label, cls] of p.sections) has(`<section class="${cls}"`, `뺀 칸 「${label}」`, 0);
  for (const s of ['주차 안내 확인', '드레스코드']) has(s, `뺀 준비 목록 줄 「${s}」`, 0);
  for (const s of p.cut) has(s.trim(), `뺀 문장 ${s.slice(1, 15)}`, 0);
  has(`자주 묻는 질문 (${p.faqCount[1]}개)</h2>`, '자주 묻는 것 수');
  has('<div class="faq-item"', '보이는 문답 수', p.faqCount[1]);
  // 주소 = 놀쿨 기본 정보 표 표기(보이는 줄 둘 + JSON-LD) · 없는 주소 표기 0 · 확인 안 된 방 수 · 수용 인원 0(본문 · 안내 표 · 문답)
  has(`>${p.addr}</td>`, '안내 표 주소');
  has('장항로 895', '없는 주소 표기 「장항로 895」', 0);
  const biz0 = nodeOf(ldOf(h) || [], 'LocalBusiness')[0];
  if (!biz0 || !biz0.address || biz0.address.streetAddress !== p.street) bad.push(`JSON-LD streetAddress 「${biz0 && biz0.address ? biz0.address.streetAddress : '없음'}」(기대 「${p.street}」)`);
  for (const s of ['30개 넘는', '30개+', '80인']) if (visText(mainOf(h)).includes(s)) bad.push(`확인 안 된 방 수 · 수용 인원 「${s}」 남음(본문의 보이는 글자)`);
  // h1 · JSON-LD 설명의 도로 이름 고침 · 건물 · 실외 묘사와 확인 안 된 예약 조건 · 코스 이름 · 원산지 글 0
  has(`>${p.h1New}</h1>`, 'h1(동 이름)');
  has(p.h1, '옛 h1(없는 도로 이름)', 0);
  if (!biz0 || biz0.description !== p.ldDesc[1]) bad.push(`JSON-LD description 「${biz0 ? biz0.description : '없음'}」(기대 「${p.ldDesc[1]}」)`);
  for (const [label, head] of p.paraDrop) has(head, `뺀 문단 「${label}」`, 0);
  // 준비 목록의 고친 두 줄은 태그(<strong>)가 끼어 있어 보이는 글자로 본다
  {
    const vis = visText(mainOf(h)).replace(/\s+/g, ' ');
    if (!vis.includes('사전 예약 필수 — 인원, 예산, 모임 성격을 알려주세요')) bad.push('준비 목록 예약 줄(고친 글) 없음');
    if (!vis.includes('코스 선택 — 알레르기나 식이 제한 전달')) bad.push('준비 목록 코스 줄(고친 글) 없음');
    for (const s of p.gone) if (vis.includes(s)) bad.push(`사실과 맞지 않거나 확인 안 된 글 「${s}」 남음(본문의 보이는 글자)`);
  }
  checkAdvCommon(h, bad, has, p, cardPath, cardUrl, p.ogSlug, 'LocalBusiness');
  return bad;
}

// 목록·다른 쪽
const DEMOTE_OF = (slug) => VENUE_DEMOTE.find((p) => p.slug === slug);
// 지어낸 사람 장점(맨 앞 장점)을 견주기 자료에서도 빼는 가게 — 광고문의로 내린 쪽과 일산 광고주 쪽 모두
const HL_PAGES = [...VENUE_DEMOTE, ...ADV_VENUES].filter((p) => p.hl);
const OTHERS = [
  {
    rel: 'rooms/index.html',
    apply: (h, miss) => sub(h, miss, '룸 목록 연락', `<div class="venue-card-contact">담당: 일산룸 | ${OLD_R}</div>`, `<div class="venue-card-contact">${INQ}</div>`),
    want: [[`<div class="venue-card-contact">${INQ}</div>`, 1]],
  },
  {
    rel: 'yojeong/index.html',
    apply: (h, miss) => sub(h, miss, '요정 목록 연락', `<div class="venue-card-contact">담당: 일산명월관요정 | ${OLD_R}</div>`, `<div class="venue-card-contact">${INQ}</div>`),
    want: [[`<div class="venue-card-contact">${INQ}</div>`, 1]],
  },
  {
    rel: 'ranking/index.html',
    apply: (h, miss) => {
      h = sub(h, miss, '순위 울산 연락', `<div class="venue-card-contact">춘자 · ${OLD_U}</div>`, `<div class="venue-card-contact">${INQ}</div>`);
      h = sub(h, miss, '순위 일산룸 연락', `<div class="venue-card-contact">일산룸 · ${OLD_R}</div>`, `<div class="venue-card-contact">${INQ}</div>`);
      h = sub(h, miss, '순위 명월관 연락', `<div class="venue-card-contact">일산명월관요정 · ${OLD_R}</div>`, ''); // 순위 쪽의 이 가게 카드는 연락 줄 없이(놀쿨70-1 때 그대로)
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
  {
    // 견주기 쪽 — 가게 자료가 base64 한 덩이: 사람 장점(맨 앞 장점)과 울산 한 줄 소개를 가게 쪽과 같게
    rel: 'compare/index.html',
    apply: (h, miss) => blobEdit(h, miss, '견주기 자료', (d) => {
      const list = Array.isArray(d.venues) ? d.venues : [];
      for (const p of HL_PAGES) {
        const v = list.filter((x) => x && x.s === p.slug);
        if (v.length !== 1) { miss.push(`견주기 자료 ${p.slug}(찾은 수 ${v.length})`); continue; }
        if (JSON.stringify(v[0].hl) !== JSON.stringify(p.hl)) { miss.push(`견주기 자료 ${p.slug} 장점 값`); continue; }
        v[0].hl = hlKeep(p);
        if (p.slug === 'ulsan-champion') { if (v[0].desc !== SHORT_U0) miss.push('견주기 자료 울산 한 줄 소개 값'); else v[0].desc = SHORT_U1; }
      }
    }),
    want: [],
    check: (h) => {
      const d = blobOf(h);
      if (!d || !Array.isArray(d.venues)) return ['견주기 자료 덩이 읽기'];
      const bad = [];
      for (const p of HL_PAGES) {
        const v = d.venues.filter((x) => x && x.s === p.slug);
        if (v.length !== 1 || JSON.stringify(v[0].hl) !== JSON.stringify(hlKeep(p))) bad.push(`견주기 자료 ${p.slug} 장점`);
      }
      const u = d.venues.filter((x) => x && x.s === DEMOTE_OF('ulsan-champion').slug);
      if (u.length !== 1 || u[0].desc !== SHORT_U1) bad.push('견주기 자료 울산 한 줄 소개');
      return bad;
    },
  },
];

// og 그림(빌드가 svg 로 그린 뒤 png 로 바꾼 것) — 연락 줄을 뺀다
const SVG_LINE = (s) => new RegExp(`<text\\b[^>]*\\by="450"[^>]*>${esc(s)}</text>`);
const SVGS = [
  { rel: 'og/ulsan-champion.svg', old: `담당 춘자 · ${OLD_U}` },
  { rel: 'og/ilsan-room.svg', old: `담당 일산룸 · ${OLD_R}` },
  { rel: 'og/ilsan-myeongwolgwan.svg', old: `담당 일산명월관요정 · ${OLD_R}` },
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
function runCardPage(p, apply, check) {
  const card = cardOf(p.card);
  const cardPath = `/og/${card}`, cardUrl = `${HOST}${cardPath}`;
  pairs.push({ url: `${HOST}/${p.rel.replace(/index\.html$/, '')}`, cardUrl });
  runPage(p.rel, (h, m) => apply(h, m, p, cardPath, cardUrl), (h) => check(h, p, cardPath, cardUrl));
}

for (const p of VENUE_DEMOTE) runCardPage(p, applyDemote, checkDemote);
for (const p of ADV_VENUES) runCardPage(p, applyAdv, checkAdv);
runCardPage(YO, applyYo, checkYo);
for (const o of OTHERS) {
  runPage(o.rel, (h, m) => sub(o.apply(h, m), m, '표지', '</body>', `${MARK}</body>`), (h) => {
    const bad = [];
    if (h.split(MARK).length - 1 !== 1) bad.push('표지');
    for (const [s, n] of o.want) { const c = h.split(s).length - 1; if (c !== n) bad.push(`${s.slice(0, 40)}(${c}/${n})`); }
    if (o.check) bad.push(...o.check(h));
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
    const y = x.replace(re, '');
    outs.set(s.rel, y);
    pngJobs.push({ rel: s.rel.replace(/\.svg$/, '.png'), svg: y });
  } else if (n === 0) already++;
  else miss.push(`${s.rel}: 연락 줄(찾은 수 ${n})`);
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

// dist 전체 지킴(고친 글은 메모리 판으로 · 쪽 안 base64 덩이는 풀어서 같이 본다)
const TEXT = /\.(html?|xml|txt|json|svg|m?js|css|webmanifest|md)$/i;
const B64_ANY = /["'`]([A-Za-z0-9+/]{200,}={0,2})["'`]/g;
const hits = [];
let scanned = 0, blobs = 0, ownSeen = 0;
// 일산 세 쪽 → 그 쪽의 닉네임(닉네임·새 번호는 이 세 쪽에서만 · 쪽마다 제 닉네임만)
const NICK_OF = new Map([...ADV_VENUES, YO].map((p) => [p.rel, p.nick]));
const headOf = (nick) => nick.slice(0, nick.length - NICK_X.length).trim(); // 닉네임에서 끝 낱말을 뗀 머리(「일산룸 총책임자」 · 「일산요정 총책임자」)
const count = (t, s) => t.split(s).length - 1;
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const f = join(dir, name);
    const st = statSync(f);
    if (st.isDirectory()) { walk(f); continue; }
    if (!TEXT.test(name) && /\.[A-Za-z0-9]+$/.test(name)) continue;
    const rel = relative(ROOT, f).split(sep).join('/');
    const t = outs.has(rel) ? outs.get(rel) : readFileSync(f, 'utf8');
    scanned++;
    const own = NICK_OF.get(rel);
    const b = t.match(BAD) || goneHit(t) || (own ? null : t.match(BAD_OUT));
    if (b) hits.push(`${rel}: 「${b[0]}」`);
    if (own) {
      ownSeen++;
      // 세 쪽 안: 다른 쪽 닉네임 0 · 끝 낱말과 「총책임자」는 제 닉네임 꼴로만(닉네임 수 = 끝 낱말 수 = 「총책임자」 수)
      for (const other of new Set(NICK_OF.values())) if (other !== own && t.includes(headOf(other))) hits.push(`${rel}: 다른 쪽 닉네임 「${headOf(other)}」`);
      const c = [count(t, own), count(t, NICK_X), count(t, '총책임자')];
      if (c[0] < 1 || c[0] !== c[1] || c[0] !== c[2]) hits.push(`${rel}: 닉네임 꼴이 아닌 글자(닉네임 ${c[0]} · 끝 낱말 ${c[1]} · 총책임자 ${c[2]})`);
    }
    for (const m of t.matchAll(B64_ANY)) {
      blobs++;
      const u = Buffer.from(m[1], 'base64').toString('utf8');
      const inner = u.match(BAD) || goneHit(u) || u.match(BAD_OUT); // 자료 덩이 안에는 어느 쪽이든 닉네임·새 번호 0
      if (inner) { hits.push(`${rel}: 자료 덩이 안의 「${inner[0]}」`); break; }
    }
  }
})(ROOT);
if (ownSeen !== NICK_OF.size) miss.push(`일산 세 쪽을 다 보지 못함(${ownSeen}/${NICK_OF.size})`);
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
console.log(`${TAG} 끝 — 고친 파일 ${outs.size} · 다시 그린 그림 ${pngs.length} · 이미 고쳐져 있던 것 ${already} · 사이트맵 그림 줄 +${smap.added} · 지킴 검사 글 파일 ${scanned}개(푼 자료 덩이 ${blobs}) 남은 글자 0`);
