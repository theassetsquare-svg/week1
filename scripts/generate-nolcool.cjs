/**
 * 놀쿨 서브사이트 v2 — 나이트라이프 152곳
 * 체류↑: 1000자+, 비교표, 다음글추천, 스크롤진행률
 * SEO: seoDesc150자, 키워드3회, hookTitle가게단어금지, og:image실제
 * 품질: AI글금지, 유사도10%, 금지단어제거, target_blank, PageSpeed100
 */
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'nolcool');
const PUBLIC = path.join(__dirname, '..', 'public');
const SITE = 'https://week1-6m5.pages.dev';

// ─── 데이터 로드 ─────────────────────────────────────
function loadVenues() {
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  const files = ['nights-seoul.ts','nights-gyeonggi.ts','nights-other.ts','clubs-data.ts','lounges-data.ts','others-data.ts'];
  let allCode = '';
  for (const f of files) allCode += fs.readFileSync(path.join(dataDir, f), 'utf8') + '\n';
  const venues = [];
  const arrayRe = /export\s+const\s+\w+\s*(?::\s*Venue\[\])?\s*=\s*\[([\s\S]*?)\];/g;
  let am;
  while ((am = arrayRe.exec(allCode)) !== null) {
    let depth = 0, start = -1;
    const ac = am[1];
    for (let i = 0; i < ac.length; i++) {
      if (ac[i] === '{') { if (depth === 0) start = i; depth++; }
      else if (ac[i] === '}') { depth--; if (depth === 0 && start !== -1) { try { const v = parseObj(ac.substring(start, i+1)); if (v && v.name && v.slug) venues.push(v); } catch(e){} start = -1; } }
    }
  }
  return venues;
}
function parseObj(s) {
  const g = k => { const m = s.match(new RegExp(`${k}\\s*:\\s*'([^']*(?:\\\\'[^']*)*)'`)) || s.match(new RegExp(`${k}\\s*:\\s*\`([^\`]*)\``)); return m ? m[1].replace(/\\'/g,"'") : ''; };
  const gn = k => { const m = s.match(new RegExp(`${k}\\s*:\\s*(\\d+)`)); return m ? parseInt(m[1]) : 0; };
  const ga = k => { const m = s.match(new RegExp(`${k}\\s*:\\s*\\[([^\\]]*?)\\]`,'s')); return m ? [...m[1].matchAll(/'([^']*)'/g)].map(x=>x[1]) : []; };
  const faqs = []; let fm; const fr = /\{\s*q:\s*'([^']*(?:\\'[^']*)*)'\s*,\s*a:\s*'([^']*(?:\\'[^']*)*)'\s*\}/g;
  while ((fm = fr.exec(s)) !== null) faqs.push({ q: fm[1].replace(/\\'/g,"'"), a: fm[2].replace(/\\'/g,"'") });
  const tl = []; let tm; const tr = /\{\s*time:\s*'([^']*)'\s*,\s*event:\s*'([^']*(?:\\'[^']*)*)'\s*\}/g;
  while ((tm = tr.exec(s)) !== null) tl.push({ time: tm[1], event: tm[2].replace(/\\'/g,"'") });
  return { id:gn('id'), slug:g('slug'), name:g('name'), type:g('type'), typeName:g('typeName'), nickname:g('nickname'), phone:g('phone'), region:g('region'), regionSlug:g('regionSlug'), address:g('address'), shortDesc:g('shortDesc'), description:g('description'), atmosphere:g('atmosphere'), music:g('music'), highlights:ga('highlights'), timeline:tl, faq:faqs, tags:ga('tags'), seoTitle:g('seoTitle'), seoDescription:g('seoDescription'), h1Title:g('h1Title') };
}

// ─── 카테고리 ─────────────────────────────────────────
const CATS = [
  { type:'night', name:'나이트', icon:'🌙', slug:'night', color:'#7c3aed' },
  { type:'club', name:'클럽', icon:'🎵', slug:'club', color:'#dc2626' },
  { type:'lounge', name:'라운지', icon:'🍸', slug:'lounge', color:'#0ea5e9' },
  { type:'hoppa', name:'호빠', icon:'🎭', slug:'hoppa', color:'#e11d48' },
  { type:'room', name:'룸', icon:'🚪', slug:'room', color:'#ea580c' },
  { type:'yojeong', name:'요정', icon:'🏮', slug:'yojeong', color:'#059669' },
];

// ─── 금지단어 필터 ────────────────────────────────────
const BANNED = ['가족모임','가족 모임','패밀리','family','성인용','19금','불법','도박'];
function clean(t) { let r = t; for (const w of BANNED) r = r.split(w).join(''); return r; }

// ─── hookTitle: 가게단어 금지, 지역+업종+후킹 ──────────────
const HOOK_PHRASES = [
  '한 번 가면 단골 되는 곳','밤이 아까워지는 공간','입소문만으로 줄 서는 이유',
  '분위기 하나로 승부하는 곳','새벽이 짧게 느껴지는 밤','아는 사람만 찾는 숨은 명소',
  '소문대로 분위기 끝내주는 곳','갈 때마다 새로운 밤','기대 이상의 경험을 선사하는 곳',
  '퇴근 후 스트레스 한 방에 날리는 곳','이 동네 밤문화의 기준점','들어서는 순간 기분이 달라지는 곳',
];
function hookTitle(v, idx) {
  return `${v.region} ${v.typeName} — ${HOOK_PHRASES[idx % HOOK_PHRASES.length]}`;
}

// ─── seoDescription 150자 맞추기 ──────────────────────
function seoDesc150(v) {
  const base = `${v.region} ${v.typeName} ${v.name}의 분위기, 음악, 이용 정보를 한눈에. `;
  let d = base + (v.shortDesc || v.seoDescription || '');
  d = clean(d);
  if (d.length > 155) d = d.substring(0, 152) + '...';
  while (d.length < 145) d += ' 놀쿨에서 확인하세요.';
  return d.substring(0, 155);
}

// ─── 본문 1000자+ 구축 (키워드 3회 보장) ──────────────────
function buildBody(v) {
  let body = clean(v.description || '');
  if (v.atmosphere) body += '\n\n' + clean(v.atmosphere);
  if (v.music) body += '\n\n' + clean(v.music);
  // 키워드 3회 보장
  const kw = v.name;
  let count = (body.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'g')) || []).length;
  if (count < 3) {
    const extras = [
      `${kw}을(를) 처음 방문한다면 이 가이드가 도움이 될 것이다.`,
      `${kw}에서의 밤은 평범하지 않다.`,
      `${kw}이(가) 오래도록 사랑받는 데는 이유가 있다.`,
    ];
    for (let i = count; i < 3 && extras[i-count]; i++) body += ' ' + extras[i-count];
  }
  // 하이라이트 텍스트 추가
  if (v.highlights.length && body.length < 1000) {
    body += '\n\n' + v.highlights.join('. ') + '.';
  }
  // 타임라인 텍스트 추가
  if (v.timeline.length && body.length < 1000) {
    body += '\n\n방문 타임라인을 참고하면 더 알찬 시간을 보낼 수 있다. ' + v.timeline.map(t => t.time + ' ' + t.event).join('. ') + '.';
  }
  // 1000자 미만이면 보강
  if (body.length < 1000) {
    body += `\n\n${v.region} 지역에서 ${v.typeName} 문화를 이야기할 때 빠지지 않는 이름이다. 첫 방문이라면 피크 시간대를 피해 일찍 도착하는 것을 권한다. 내부 분위기를 충분히 감상하면서 자리를 잡으면, 시간이 지날수록 공간의 진가를 느낄 수 있다. 음악과 조명이 만들어내는 분위기는 직접 경험해 봐야 알 수 있다. 주변 맛집이나 카페와 연계하면 하루 코스로도 알차다. 단골이 많은 곳에는 이유가 있다. 한 번 방문으로 판단하기보다 두세 번 다른 시간대에 찾아보면, 이 공간이 왜 꾸준히 사랑받는지 직접 체감할 수 있을 것이다.`;
  }
  return body;
}

// ─── 비교표 (같은 카테고리 3곳) ──────────────────────────
function comparisonTable(v, sameType) {
  const others = sameType.filter(x => x.slug !== v.slug).slice(0, 2);
  if (others.length === 0) return '';
  const all = [v, ...others];
  return `<section class="nc-section">
<h2>${v.typeName} 비교</h2>
<div style="overflow-x:auto"><table class="nc-table">
<thead><tr><th>구분</th>${all.map(x=>`<th>${esc(x.name)}</th>`).join('')}</tr></thead>
<tbody>
<tr><td>지역</td>${all.map(x=>`<td>${esc(x.region)}</td>`).join('')}</tr>
<tr><td>분위기</td>${all.map(x=>`<td>${esc((x.atmosphere||'').substring(0,40))}...</td>`).join('')}</tr>
<tr><td>음악</td>${all.map(x=>`<td>${esc((x.music||'').substring(0,30))}...</td>`).join('')}</tr>
<tr><td>특징</td>${all.map(x=>`<td>${esc((x.highlights[0]||''))}</td>`).join('')}</tr>
</tbody>
</table></div>
</section>`;
}

// ─── 다음글 추천 ──────────────────────────────────────
function nextArticles(v, sameType, cat) {
  const others = sameType.filter(x => x.slug !== v.slug);
  const picks = [];
  // 같은 지역 우선
  const sameRegion = others.filter(x => x.regionSlug === v.regionSlug);
  if (sameRegion[0]) picks.push(sameRegion[0]);
  // 다른 지역
  const diffRegion = others.filter(x => x.regionSlug !== v.regionSlug);
  while (picks.length < 3 && diffRegion.length) picks.push(diffRegion.shift());
  while (picks.length < 3 && others.length > picks.length) {
    const next = others.find(x => !picks.includes(x));
    if (next) picks.push(next); else break;
  }
  if (picks.length === 0) return '';
  return `<section class="nc-section">
<h2>다음에 읽을 글</h2>
<div class="nc-next-grid">
${picks.map(p => `<a href="/nolcool/${cat.slug}/${p.slug}/" class="nc-next-card" target="_blank" rel="noopener">
<div class="nc-next-thumb" style="background:${cat.color}">${cat.icon}</div>
<div><strong>${esc(p.name)}</strong><span>${esc(p.region)}</span></div>
</a>`).join('')}
</div>
</section>`;
}

// ─── CSS (PageSpeed 최적화: inline, system font, 최소) ──────
const CSS = `*{margin:0;padding:0;box-sizing:border-box}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:-apple-system,'Pretendard','Noto Sans KR',sans-serif;color:#1a1a1a;background:#fff;line-height:1.78;word-break:keep-all}
a{color:inherit;text-decoration:none}
.scroll-bar{position:fixed;top:0;left:0;height:3px;background:#7c3aed;z-index:999;width:0;transition:width .1s}
.nc-h{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.97);backdrop-filter:blur(8px);border-bottom:1px solid #eee;padding:0 20px}
.nc-hi{max-width:720px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:52px}
.nc-lo{font-size:1.2rem;font-weight:800;color:#7c3aed}.nc-lo span{color:#1a1a1a}
.nc-nv{display:flex;gap:12px;font-size:.8rem;color:#666;overflow-x:auto;white-space:nowrap}.nc-nv a:hover{color:#7c3aed}
.nc-hero{width:100%;max-width:720px;margin:0 auto;aspect-ratio:1/1;border-radius:16px;overflow:hidden}
.nc-hero .ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3.5rem;color:rgba(255,255,255,.8)}
.nc-gal{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:28px auto;max-width:720px;padding:0 20px}
.nc-gi{aspect-ratio:4/3;border-radius:12px;overflow:hidden}
.nc-gi .ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.4rem;color:rgba(255,255,255,.7)}
.nc-a{max-width:720px;margin:0 auto;padding:24px 20px 60px}
.nc-bc{font-size:.78rem;color:#999;margin-bottom:14px}.nc-bc a{color:#7c3aed}
.nc-tag{display:inline-block;background:#f3f0ff;color:#7c3aed;font-size:.72rem;font-weight:600;padding:3px 10px;border-radius:20px;margin-bottom:10px}
h1{font-size:1.65rem;font-weight:800;line-height:1.3;margin-bottom:6px;letter-spacing:-.03em}
.nc-sub{font-size:.95rem;color:#666;margin-bottom:6px;font-weight:500}
.nc-dt{font-size:.78rem;color:#aaa;margin-bottom:22px}
.nc-hook{font-size:1.02rem;color:#333;line-height:1.88;margin-bottom:30px;background:#faf9fc;padding:20px 22px;border-radius:12px;border-left:4px solid #7c3aed}
.nc-s{margin-bottom:36px}
.nc-s h2{font-size:1.2rem;font-weight:700;margin-bottom:14px;padding-bottom:7px;border-bottom:2px solid #f0f0f0}
.nc-s p{color:#444;margin-bottom:10px;line-height:1.82}
.nc-s ul{padding-left:18px;margin-bottom:10px}.nc-s li{color:#444;margin-bottom:5px}
.nc-ig{display:grid;grid-template-columns:72px 1fr;gap:6px 14px;background:#f9f8fc;padding:18px;border-radius:12px;font-size:.93rem}
.nc-ig dt{font-weight:600;color:#666}.nc-ig dd{color:#333}
.nc-tl{position:relative;padding-left:22px;border-left:3px solid #e9e5ff}
.nc-tl .ti{margin-bottom:14px;position:relative}
.nc-tl .ti::before{content:'';position:absolute;left:-28px;top:5px;width:10px;height:10px;border-radius:50%;background:#7c3aed}
.nc-tl .tt{font-size:.8rem;font-weight:700;color:#7c3aed}.nc-tl .te{font-size:.93rem;color:#444}
.nc-fq details{border:1px solid #eee;border-radius:10px;margin-bottom:7px;overflow:hidden}
.nc-fq summary{padding:12px 18px;font-weight:600;cursor:pointer;background:#fafafa;font-size:.93rem}
.nc-fq summary:hover{background:#f0f0f0}
.nc-fq details[open] summary{border-bottom:1px solid #eee}
.nc-fq .fa{padding:12px 18px;color:#555;font-size:.9rem;line-height:1.82}
.nc-table{width:100%;border-collapse:collapse;font-size:.88rem;margin-top:8px}
.nc-table th,.nc-table td{padding:10px 12px;border:1px solid #eee;text-align:left}
.nc-table th{background:#f9f8fc;font-weight:600;color:#555;white-space:nowrap}
.nc-table td{color:#444}
.nc-next-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
.nc-next-card{display:flex;align-items:center;gap:12px;border:1px solid #eee;border-radius:12px;padding:12px;transition:box-shadow .2s}
.nc-next-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.06)}
.nc-next-thumb{width:48px;height:48px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:#fff;flex-shrink:0}
.nc-next-card strong{display:block;font-size:.9rem}.nc-next-card span{font-size:.78rem;color:#999}
.nc-cta{text-align:center;padding:36px 20px;background:linear-gradient(135deg,#f3f0ff,#e9e5ff);border-radius:16px;margin:36px 0}
.nc-cta p{font-size:.95rem;color:#555;margin-bottom:14px}
.nc-cta .btn{display:inline-block;background:#7c3aed;color:#fff;font-size:.95rem;font-weight:700;padding:12px 32px;border-radius:28px}
.nc-ft{border-top:1px solid #eee;padding:36px 20px;text-align:center;color:#999;font-size:.8rem;line-height:1.9}
.nc-ft .kk{font-weight:600;color:#666}.nc-ft .sm{margin-top:10px;font-size:.88rem;color:#7c3aed;font-weight:600}
.nc-hub-hero{text-align:center;padding:56px 20px 36px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;margin-bottom:36px}
.nc-hub-hero h1{font-size:1.9rem;margin-bottom:10px;color:#fff}.nc-hub-hero p{font-size:1rem;opacity:.85;max-width:480px;margin:0 auto}
.nc-cg{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px;margin:28px 0}
.nc-cc{border:1px solid #eee;border-radius:14px;overflow:hidden;transition:box-shadow .2s,transform .2s}
.nc-cc:hover{box-shadow:0 6px 24px rgba(0,0,0,.07);transform:translateY(-2px)}
.nc-cc .ct{aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;font-size:2.2rem}
.nc-cc .ci{padding:18px}.nc-cc .ci h3{font-size:1.05rem;font-weight:700;margin-bottom:4px}.nc-cc .ci p{font-size:.85rem;color:#666}.nc-cc .ci .cn{font-size:.75rem;color:#7c3aed;font-weight:600;margin-top:6px}
.nc-vc{display:flex;gap:14px;border:1px solid #eee;border-radius:12px;padding:14px;margin-bottom:14px;transition:box-shadow .2s}
.nc-vc:hover{box-shadow:0 3px 16px rgba(0,0,0,.05)}
.nc-vc .vt{width:90px;min-width:90px;aspect-ratio:1/1;border-radius:10px;overflow:hidden;flex-shrink:0}
.nc-vc .vt .ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.2rem}
.nc-vc .vx h3{font-size:.95rem;font-weight:700;margin-bottom:3px}.nc-vc .vx .vl{font-size:.78rem;color:#999;margin-bottom:4px}
.nc-vc .vx p{font-size:.85rem;color:#555;line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
@media(max-width:640px){h1{font-size:1.35rem}.nc-nv{gap:8px}.nc-hero{border-radius:0;margin:0 -20px;max-width:none}.nc-gal{grid-template-columns:1fr 1fr;padding:0}.nc-vc{flex-direction:column}.nc-vc .vt{width:100%;aspect-ratio:16/9}.nc-cg{grid-template-columns:1fr}.nc-hub-hero h1{font-size:1.4rem}.nc-next-grid{grid-template-columns:1fr}}`;

// ─── 스크롤 진행률 JS ───────────────────────────────────
const SCROLL_JS = `<script>
(function(){var b=document.getElementById('sb');if(!b)return;window.addEventListener('scroll',function(){var h=document.documentElement;var p=(h.scrollTop/(h.scrollHeight-h.clientHeight))*100;b.style.width=p+'%';},{passive:true});})();
</script>`;

// ─── HTML 공통 ──────────────────────────────────────
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function hdr() {
  const nv = CATS.map(c=>`<a href="/nolcool/${c.slug}/">${c.icon} ${c.name}</a>`).join('');
  return `<div class="scroll-bar" id="sb"></div>
<header class="nc-h"><div class="nc-hi"><a href="/" class="nc-lo">놀<span>쿨</span></a><nav class="nc-nv">${nv}</nav></div></header>`;
}
function ftr() {
  return `<footer class="nc-ft"><p>카카오톡 상담: <span class="kk">besta12</span></p><p class="sm">구글·AI에서 놀쿨을 검색하세요</p><p style="margin-top:6px">&copy; 2025 놀쿨</p></footer>`;
}
function ctaBlock(n) {
  return `<div class="nc-cta"><p>${esc(n)}의 더 자세한 정보와 실시간 현황을 확인해 보세요.</p><a href="https://www.google.com/search?q=놀쿨+${encodeURIComponent(n)}" class="btn" target="_blank" rel="noopener">놀쿨에서 확인하세요</a></div>`;
}

// ─── 가게 페이지 ─────────────────────────────────────
function venuePage(v, cat, sameType, idx) {
  const ht = hookTitle(v, idx);
  const sd = seoDesc150(v);
  const body = buildBody(v);
  const canon = `${SITE}/nolcool/${cat.slug}/${v.slug}/`;
  const ogImg = `${SITE}/nolcool/og/${cat.slug}.svg`;
  const today = new Date().toISOString().split('T')[0];
  const c = cat.color;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(v.name)} — ${esc(v.region)} ${esc(v.typeName)} 가이드 | 놀쿨</title>
<meta name="description" content="${esc(sd)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${canon}">
<link rel="icon" type="image/svg+xml" href="/favicon-nolcool.svg">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(v.name)} — ${esc(v.region)} ${esc(v.typeName)} 가이드">
<meta property="og:description" content="${esc(sd)}">
<meta property="og:url" content="${canon}">
<meta property="og:image" content="${ogImg}">
<meta property="og:site_name" content="놀쿨">
<meta property="og:locale" content="ko_KR">
${v.faq.length ? `<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"FAQPage","mainEntity":v.faq.map(f=>({"@type":"Question","name":f.q,"acceptedAnswer":{"@type":"Answer","text":f.a}}))})}</script>` : ''}
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"놀쿨","item":SITE},{"@type":"ListItem","position":2,"name":cat.name,"item":`${SITE}/nolcool/${cat.slug}/`},{"@type":"ListItem","position":3,"name":v.name}]})}</script>
<style>${CSS}</style>
</head>
<body>
${hdr()}
<div class="nc-hero"><div class="ph" style="background:${c}">${cat.icon}</div></div>
<article class="nc-a">
<div class="nc-bc"><a href="/">놀쿨</a> &gt; <a href="/nolcool/${cat.slug}/">${cat.name}</a> &gt; ${esc(v.name)}</div>
<span class="nc-tag">${cat.icon} ${cat.name}</span>
<h1>${esc(v.name)}</h1>
<p class="nc-sub">${esc(ht)}</p>
<p class="nc-dt">${esc(v.region)} · 업데이트 ${today}</p>
<div class="nc-hook">${esc(clean(body))}</div>

<section class="nc-s"><h2>기본 정보</h2>
<dl class="nc-ig">
<dt>주소</dt><dd>${esc(v.address)}</dd>
<dt>지역</dt><dd>${esc(v.region)}</dd>
<dt>업종</dt><dd>${esc(v.typeName)}</dd>
${v.phone?`<dt>연락처</dt><dd>${esc(v.phone)}</dd>`:''}
${v.nickname?`<dt>담당</dt><dd>${esc(v.nickname)}</dd>`:''}
</dl></section>

<div class="nc-gal">
<div class="nc-gi"><div class="ph" style="background:${c}">📸</div></div>
<div class="nc-gi"><div class="ph" style="background:${c}dd">📷</div></div>
<div class="nc-gi"><div class="ph" style="background:${c}aa">🖼️</div></div>
</div>

${v.highlights.length?`<section class="nc-s"><h2>이런 점이 좋다</h2><ul>${v.highlights.map(h=>`<li>${esc(h)}</li>`).join('')}</ul></section>`:''}
${v.timeline.length?`<section class="nc-s"><h2>타임라인</h2><div class="nc-tl">${v.timeline.map(t=>`<div class="ti"><span class="tt">${esc(t.time)}</span><p class="te">${esc(t.event)}</p></div>`).join('')}</div></section>`:''}
${v.faq.length?`<section class="nc-s nc-fq"><h2>자주 묻는 질문</h2>${v.faq.map(f=>`<details><summary>${esc(f.q)}</summary><div class="fa">${esc(f.a)}</div></details>`).join('')}</section>`:''}

${comparisonTable(v, sameType)}
${ctaBlock(v.name)}
${nextArticles(v, sameType, cat)}

</article>
${ftr()}
${SCROLL_JS}
</body>
</html>`;
}

// ─── 카테고리 페이지 ────────────────────────────────────
function catPage(cat, venues) {
  const sd = `전국 인기 ${cat.name} ${venues.length}곳의 분위기·음악·이용 정보를 한눈에 비교. 놀쿨에서 확인하세요.`;
  const canon = `${SITE}/nolcool/${cat.slug}/`;
  const ogImg = `${SITE}/nolcool/og/${cat.slug}.svg`;
  const today = new Date().toISOString().split('T')[0];
  return `<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>전국 ${cat.name} ${venues.length}곳 완벽 가이드 | 놀쿨</title>
<meta name="description" content="${esc(sd.substring(0,155))}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${canon}">
<link rel="icon" type="image/svg+xml" href="/favicon-nolcool.svg">
<meta property="og:type" content="website"><meta property="og:title" content="전국 ${cat.name} ${venues.length}곳 가이드 | 놀쿨">
<meta property="og:description" content="${esc(sd.substring(0,155))}"><meta property="og:url" content="${canon}">
<meta property="og:image" content="${ogImg}"><meta property="og:site_name" content="놀쿨"><meta property="og:locale" content="ko_KR">
<style>${CSS}</style></head><body>
${hdr()}
<article class="nc-a" style="padding-top:36px">
<div class="nc-bc"><a href="/">놀쿨</a> &gt; ${cat.name}</div>
<span class="nc-tag">${cat.icon} ${cat.name}</span>
<h1>전국 ${cat.name} ${venues.length}곳 완벽 가이드</h1>
<p class="nc-dt">업데이트 ${today}</p>
<p style="color:#555;margin-bottom:28px">${esc(sd)}</p>
<section class="nc-s"><h2>${cat.name} 전체 목록</h2>
${venues.map(v=>`<a href="/nolcool/${cat.slug}/${v.slug}/" class="nc-vc" target="_blank" rel="noopener">
<div class="vt"><div class="ph" style="background:${cat.color}">${cat.icon}</div></div>
<div class="vx"><h3>${esc(v.name)}</h3><p class="vl">${esc(v.region)} · ${esc(v.address)}</p><p>${esc(v.shortDesc)}</p></div></a>`).join('')}
</section>
${ctaBlock(cat.name)}
</article>${ftr()}${SCROLL_JS}</body></html>`;
}

// ─── 허브(홈) ───────────────────────────────────────
function hubPage(allV) {
  const sd = '전국 나이트·클럽·라운지·호빠 152곳의 분위기·음악·이용 정보를 한눈에. 놀쿨에서 확인하세요.';
  const cc = {}; for (const v of allV) cc[v.type]=(cc[v.type]||0)+1;
  return `<!DOCTYPE html>
<html lang="ko"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>놀쿨 — 전국 나이트·클럽·라운지 완벽 가이드</title>
<meta name="description" content="${esc(sd)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${SITE}/">
<link rel="icon" type="image/svg+xml" href="/favicon-nolcool.svg">
<meta property="og:type" content="website"><meta property="og:title" content="놀쿨 — 전국 나이트·클럽·라운지 완벽 가이드">
<meta property="og:description" content="${esc(sd)}"><meta property="og:url" content="${SITE}/">
<meta property="og:image" content="${SITE}/nolcool/og/night.svg"><meta property="og:site_name" content="놀쿨"><meta property="og:locale" content="ko_KR">
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"WebSite","name":"놀쿨","url":SITE,"description":sd})}</script>
<style>${CSS}</style></head><body>
${hdr()}
<div class="nc-hub-hero"><h1>놀쿨</h1><p>전국 나이트·클럽·라운지·호빠 ${allV.length}곳<br>분위기·음악·이용 정보를 한눈에</p></div>
<article class="nc-a">
<section class="nc-s"><h2>카테고리별 가이드</h2><div class="nc-cg">
${CATS.map(c=>`<a href="/nolcool/${c.slug}/" class="nc-cc" target="_blank" rel="noopener"><div class="ct" style="background:${c.color}">${c.icon}</div><div class="ci"><h3>${c.name}</h3><p>전국 인기 ${c.name}의 분위기·이용 정보</p><p class="cn">${cc[c.type]||0}곳</p></div></a>`).join('')}
</div></section>
<section class="nc-s"><h2>최근 업데이트</h2>
${allV.slice(0,8).map(v=>{const ct=CATS.find(c=>c.type===v.type);return`<a href="/nolcool/${ct.slug}/${v.slug}/" class="nc-vc" target="_blank" rel="noopener"><div class="vt"><div class="ph" style="background:${ct.color}">${ct.icon}</div></div><div class="vx"><h3>${esc(v.name)}</h3><p class="vl">${esc(v.region)} · ${esc(v.typeName)}</p><p>${esc(v.shortDesc)}</p></div></a>`;}).join('')}
</section>
${ctaBlock('놀쿨')}
</article>${ftr()}${SCROLL_JS}</body></html>`;
}

// ─── sitemap 생성 ───────────────────────────────────
function genSitemap(allV, byType) {
  const today = new Date().toISOString().split('T')[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  xml += `<url><loc>${SITE}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>\n`;
  for (const cat of CATS) {
    if (!byType[cat.type] || byType[cat.type].length===0) continue;
    xml += `<url><loc>${SITE}/nolcool/${cat.slug}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
    for (const v of byType[cat.type]) {
      xml += `<url><loc>${SITE}/nolcool/${cat.slug}/${v.slug}/</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>\n`;
    }
  }
  xml += `</urlset>`;
  return xml;
}

// ─── 생성 실행 ──────────────────────────────────────
function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, {recursive:true}); }

function generate() {
  console.log('🎯 놀쿨 v2 생성 시작...\n');
  const allV = loadVenues();
  console.log(`📊 ${allV.length}곳 로드`);
  const byType = {};
  for (const v of allV) { if (!byType[v.type]) byType[v.type]=[]; byType[v.type].push(v); }

  // 허브
  ensureDir(BASE); ensureDir(PUBLIC);
  const hub = hubPage(allV);
  fs.writeFileSync(path.join(BASE,'index.html'), hub);
  fs.writeFileSync(path.join(PUBLIC,'index.html'), hub);
  console.log('✅ 허브 → / + /nolcool/');

  // 카테고리 & 가게
  let vc = 0;
  for (const cat of CATS) {
    const vs = byType[cat.type] || [];
    if (!vs.length) continue;
    const cd = path.join(BASE, cat.slug);
    ensureDir(cd);
    fs.writeFileSync(path.join(cd,'index.html'), catPage(cat, vs));
    console.log(`✅ ${cat.name}: ${vs.length}곳`);
    for (let i = 0; i < vs.length; i++) {
      const vd = path.join(cd, vs[i].slug);
      ensureDir(vd);
      fs.writeFileSync(path.join(vd,'index.html'), venuePage(vs[i], cat, vs, i));
      vc++;
    }
  }

  // sitemap
  const sm = genSitemap(allV, byType);
  fs.writeFileSync(path.join(PUBLIC, 'nolcool-sitemap.xml'), sm);
  console.log('✅ nolcool-sitemap.xml');

  console.log(`\n🎉 완료! 허브1 + 카테고리${CATS.length} + 가게${vc} = ${1+CATS.length+vc}페이지`);
}

generate();
