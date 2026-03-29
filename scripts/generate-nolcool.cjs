/**
 * 놀쿨 서브사이트 생성 스크립트
 * 기존 나이트·클럽·라운지·룸·요정·호빠 6종 카테고리 152개 가게 데이터 활용
 * 정적 HTML, DB/로그인/결제 없음, 가격 없음
 */
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'nolcool');
const PUBLIC = path.join(__dirname, '..', 'public');
const SITE_URL = 'https://week1-6m5.pages.dev';

// ─── 데이터 로드 (ts → require 불가하므로 파싱) ─────────────
function loadVenues() {
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  const files = [
    'nights-seoul.ts', 'nights-gyeonggi.ts', 'nights-other.ts',
    'clubs-data.ts', 'lounges-data.ts', 'others-data.ts'
  ];
  let allCode = '';
  for (const f of files) {
    allCode += fs.readFileSync(path.join(dataDir, f), 'utf8') + '\n';
  }
  // 정규식으로 각 venue 객체 추출
  const venues = [];
  const objRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gs;
  // 더 정확하게: 배열 내 객체들을 추출
  const arrayRegex = /export\s+const\s+\w+\s*(?::\s*Venue\[\])?\s*=\s*\[([\s\S]*?)\];/g;
  let arrayMatch;
  while ((arrayMatch = arrayRegex.exec(allCode)) !== null) {
    const arrayContent = arrayMatch[1];
    // 각 venue 객체 파싱
    let depth = 0, start = -1;
    for (let i = 0; i < arrayContent.length; i++) {
      if (arrayContent[i] === '{') {
        if (depth === 0) start = i;
        depth++;
      } else if (arrayContent[i] === '}') {
        depth--;
        if (depth === 0 && start !== -1) {
          const objStr = arrayContent.substring(start, i + 1);
          try {
            const venue = parseVenueObj(objStr);
            if (venue && venue.name && venue.slug) venues.push(venue);
          } catch(e) {}
          start = -1;
        }
      }
    }
  }
  return venues;
}

function parseVenueObj(str) {
  const get = (key) => {
    // 문자열 값
    const re1 = new RegExp(`${key}\\s*:\\s*'([^']*(?:\\\\'[^']*)*)'`);
    const re2 = new RegExp(`${key}\\s*:\\s*"([^"]*(?:\\\\"[^"]*)*)"`);
    const re3 = new RegExp(`${key}\\s*:\\s*\`([^\`]*)\``);
    const m = str.match(re1) || str.match(re2) || str.match(re3);
    return m ? m[1].replace(/\\'/g, "'").replace(/\\"/g, '"') : '';
  };
  const getNum = (key) => {
    const re = new RegExp(`${key}\\s*:\\s*(\\d+)`);
    const m = str.match(re);
    return m ? parseInt(m[1]) : 0;
  };
  const getArr = (key) => {
    const re = new RegExp(`${key}\\s*:\\s*\\[([^\\]]*?)\\]`, 's');
    const m = str.match(re);
    if (!m) return [];
    return [...m[1].matchAll(/'([^']*)'/g)].map(x => x[1]);
  };
  const getFaqArr = (str) => {
    const faqs = [];
    const faqRe = /\{\s*q:\s*'([^']*(?:\\'[^']*)*)'\s*,\s*a:\s*'([^']*(?:\\'[^']*)*)'\s*\}/g;
    let m;
    while ((m = faqRe.exec(str)) !== null) {
      faqs.push({ q: m[1].replace(/\\'/g, "'"), a: m[2].replace(/\\'/g, "'") });
    }
    return faqs;
  };
  const getTimeline = (str) => {
    const tl = [];
    const re = /\{\s*time:\s*'([^']*)'\s*,\s*event:\s*'([^']*(?:\\'[^']*)*)'\s*\}/g;
    let m;
    while ((m = re.exec(str)) !== null) {
      tl.push({ time: m[1], event: m[2].replace(/\\'/g, "'") });
    }
    return tl;
  };

  return {
    id: getNum('id'),
    slug: get('slug'),
    name: get('name'),
    type: get('type'),
    typeName: get('typeName'),
    nickname: get('nickname'),
    phone: get('phone'),
    region: get('region'),
    regionSlug: get('regionSlug'),
    address: get('address'),
    shortDesc: get('shortDesc'),
    description: get('description'),
    atmosphere: get('atmosphere'),
    music: get('music'),
    highlights: getArr('highlights'),
    timeline: getTimeline(str),
    faq: getFaqArr(str),
    tags: getArr('tags'),
    seoTitle: get('seoTitle'),
    seoDescription: get('seoDescription'),
    h1Title: get('h1Title'),
  };
}

// ─── 카테고리 정의 ──────────────────────────────────
const CATEGORIES = [
  { type: 'night', name: '나이트', icon: '🌙', slug: 'night', color: '#7c3aed', gradient: 'linear-gradient(135deg,#7c3aed,#a855f7)' },
  { type: 'club', name: '클럽', icon: '🎵', slug: 'club', color: '#dc2626', gradient: 'linear-gradient(135deg,#dc2626,#f97316)' },
  { type: 'lounge', name: '라운지', icon: '🍸', slug: 'lounge', color: '#0ea5e9', gradient: 'linear-gradient(135deg,#0ea5e9,#06b6d4)' },
  { type: 'hoppa', name: '호빠', icon: '🎭', slug: 'hoppa', color: '#e11d48', gradient: 'linear-gradient(135deg,#e11d48,#f472b6)' },
  { type: 'room', name: '룸', icon: '🚪', slug: 'room', color: '#ea580c', gradient: 'linear-gradient(135deg,#ea580c,#f59e0b)' },
  { type: 'yojeong', name: '요정', icon: '🏮', slug: 'yojeong', color: '#059669', gradient: 'linear-gradient(135deg,#059669,#34d399)' },
];

// ─── CSS ──────────────────────────────────────────
const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:-apple-system,'Pretendard','Noto Sans KR',sans-serif;color:#1a1a1a;background:#fff;line-height:1.75;word-break:keep-all}
a{color:inherit;text-decoration:none}
img{max-width:100%;height:auto;display:block}
.nc-header{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.97);backdrop-filter:blur(8px);border-bottom:1px solid #eee;padding:0 20px}
.nc-header-inner{max-width:720px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:56px}
.nc-logo{font-size:1.25rem;font-weight:800;color:#7c3aed;letter-spacing:-.02em}
.nc-logo span{color:#1a1a1a}
.nc-nav{display:flex;gap:14px;font-size:.82rem;color:#666;overflow-x:auto;white-space:nowrap}
.nc-nav a:hover{color:#7c3aed}
.nc-hero-img{width:100%;max-width:720px;margin:0 auto;aspect-ratio:1/1;border-radius:16px;overflow:hidden}
.nc-hero-img .placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;color:rgba(255,255,255,.8)}
.nc-gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:32px auto;max-width:720px;padding:0 20px}
.nc-gallery-item{aspect-ratio:4/3;border-radius:12px;overflow:hidden}
.nc-gallery-item .placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:rgba(255,255,255,.7)}
.nc-article{max-width:720px;margin:0 auto;padding:24px 20px 60px}
.nc-breadcrumb{font-size:.8rem;color:#999;margin-bottom:16px}
.nc-breadcrumb a{color:#7c3aed}
.nc-category-tag{display:inline-block;background:#f3f0ff;color:#7c3aed;font-size:.75rem;font-weight:600;padding:4px 12px;border-radius:20px;margin-bottom:12px}
h1{font-size:1.75rem;font-weight:800;line-height:1.3;margin-bottom:8px;letter-spacing:-.03em}
.nc-date{font-size:.8rem;color:#999;margin-bottom:24px}
.nc-hook{font-size:1.05rem;color:#333;line-height:1.85;margin-bottom:32px;background:#f9fafb;padding:20px 24px;border-radius:12px;border-left:4px solid #7c3aed}
.nc-section{margin-bottom:40px}
.nc-section h2{font-size:1.25rem;font-weight:700;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #f0f0f0}
.nc-section p{color:#444;margin-bottom:12px}
.nc-section ul{padding-left:20px;margin-bottom:12px}
.nc-section li{color:#444;margin-bottom:6px}
.nc-info-grid{display:grid;grid-template-columns:80px 1fr;gap:8px 16px;background:#f9fafb;padding:20px;border-radius:12px;font-size:.95rem}
.nc-info-grid dt{font-weight:600;color:#666}
.nc-info-grid dd{color:#333}
.nc-tip-card{background:linear-gradient(135deg,#f3f0ff,#f0fdf4);padding:20px 24px;border-radius:12px;margin-bottom:12px}
.nc-tip-card strong{color:#7c3aed;display:block;margin-bottom:4px}
.nc-timeline{position:relative;padding-left:24px;border-left:3px solid #e9e5ff}
.nc-timeline .tl-item{margin-bottom:16px;position:relative}
.nc-timeline .tl-item::before{content:'';position:absolute;left:-30px;top:6px;width:12px;height:12px;border-radius:50%;background:#7c3aed}
.nc-timeline .tl-time{font-size:.82rem;font-weight:700;color:#7c3aed}
.nc-timeline .tl-event{font-size:.95rem;color:#444}
.nc-faq details{border:1px solid #eee;border-radius:10px;margin-bottom:8px;overflow:hidden}
.nc-faq summary{padding:14px 20px;font-weight:600;cursor:pointer;background:#fafafa;font-size:.95rem}
.nc-faq summary:hover{background:#f0f0f0}
.nc-faq details[open] summary{border-bottom:1px solid #eee}
.nc-faq .faq-answer{padding:14px 20px;color:#555;font-size:.93rem;line-height:1.8}
.nc-cta{text-align:center;padding:40px 20px;background:linear-gradient(135deg,#f3f0ff,#e9e5ff);border-radius:16px;margin:40px 0}
.nc-cta p{font-size:1rem;color:#555;margin-bottom:16px}
.nc-cta .btn{display:inline-block;background:#7c3aed;color:#fff;font-size:1rem;font-weight:700;padding:14px 36px;border-radius:30px;transition:background .2s}
.nc-cta .btn:hover{background:#6d28d9}
.nc-footer{border-top:1px solid #eee;padding:40px 20px;text-align:center;color:#999;font-size:.82rem;line-height:1.9}
.nc-footer .kakao{font-weight:600;color:#666}
.nc-footer .search-msg{margin-top:12px;font-size:.9rem;color:#7c3aed;font-weight:600}
.nc-cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px;margin:32px 0}
.nc-cat-card{border:1px solid #eee;border-radius:16px;overflow:hidden;transition:box-shadow .2s,transform .2s}
.nc-cat-card:hover{box-shadow:0 8px 30px rgba(0,0,0,.08);transform:translateY(-2px)}
.nc-cat-card .thumb{aspect-ratio:16/9;overflow:hidden}
.nc-cat-card .thumb .placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem}
.nc-cat-card .info{padding:20px}
.nc-cat-card .info h3{font-size:1.1rem;font-weight:700;margin-bottom:6px}
.nc-cat-card .info p{font-size:.9rem;color:#666;line-height:1.6}
.nc-cat-card .info .count{font-size:.78rem;color:#7c3aed;font-weight:600;margin-top:8px}
.nc-venue-card{display:flex;gap:16px;border:1px solid #eee;border-radius:14px;padding:16px;margin-bottom:16px;transition:box-shadow .2s}
.nc-venue-card:hover{box-shadow:0 4px 20px rgba(0,0,0,.06)}
.nc-venue-card .thumb{width:100px;min-width:100px;aspect-ratio:1/1;border-radius:10px;overflow:hidden;flex-shrink:0}
.nc-venue-card .thumb .placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.3rem}
.nc-venue-card .text h3{font-size:1rem;font-weight:700;margin-bottom:4px}
.nc-venue-card .text .loc{font-size:.8rem;color:#999;margin-bottom:6px}
.nc-venue-card .text p{font-size:.88rem;color:#555;line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.nc-hub-hero{text-align:center;padding:60px 20px 40px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;margin-bottom:40px}
.nc-hub-hero h1{font-size:2rem;margin-bottom:12px;color:#fff}
.nc-hub-hero p{font-size:1.05rem;opacity:.85;max-width:500px;margin:0 auto}
@media(max-width:640px){
  h1{font-size:1.4rem}
  .nc-nav{gap:10px;font-size:.78rem}
  .nc-hero-img{border-radius:0;margin:0 -20px;max-width:none}
  .nc-gallery{grid-template-columns:1fr 1fr;padding:0}
  .nc-venue-card{flex-direction:column}
  .nc-venue-card .thumb{width:100%;aspect-ratio:16/9}
  .nc-cat-grid{grid-template-columns:1fr}
  .nc-hub-hero h1{font-size:1.5rem}
}`;

// ─── HTML 공통 ──────────────────────────────────────
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function header() {
  const navItems = CATEGORIES.map(c =>
    `<a href="/nolcool/${c.slug}/">${c.icon} ${c.name}</a>`
  ).join('');
  return `<header class="nc-header"><div class="nc-header-inner"><a href="/" class="nc-logo">놀<span>쿨</span></a><nav class="nc-nav">${navItems}</nav></div></header>`;
}

function footer() {
  return `<footer class="nc-footer">
<p>카카오톡 상담: <span class="kakao">besta12</span></p>
<p class="search-msg">구글·AI에서 놀쿨을 검색하세요</p>
<p style="margin-top:8px">&copy; 2025 놀쿨. All rights reserved.</p>
</footer>`;
}

function cta(name) {
  return `<div class="nc-cta">
<p>${esc(name)}의 더 자세한 정보와 실시간 현황을 확인해 보세요.</p>
<a href="https://www.google.com/search?q=놀쿨+${encodeURIComponent(name)}" class="btn" target="_blank" rel="noopener">놀쿨에서 확인하세요</a>
</div>`;
}

function faqSchema(faqs) {
  return JSON.stringify({
    "@context": "https://schema.org", "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question", "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  });
}

// ─── 후킹설명 생성 (description + atmosphere 합쳐서 500자+) ─────
function buildHook(v) {
  let hook = v.description || '';
  if (hook.length < 500 && v.atmosphere) {
    hook += ' ' + v.atmosphere;
  }
  if (hook.length < 500 && v.music) {
    hook += ' 이곳의 음악은 ' + v.music + ' 장르를 중심으로 운영됩니다.';
  }
  if (hook.length < 500) {
    hook += ` ${v.region} 지역에서 ${v.typeName} 문화를 대표하는 ${v.name}은(는) 처음 방문하는 분부터 단골까지 누구나 만족할 수 있는 공간입니다. 방문 전 분위기와 이용 정보를 미리 확인하면 더욱 알찬 시간을 보낼 수 있습니다.`;
  }
  return hook;
}

// ─── 가게 페이지 ─────────────────────────────────────
function buildVenuePage(v, cat) {
  const title = `${esc(v.name)} 완벽 가이드 | 놀쿨`;
  const hook = buildHook(v);
  const desc = esc(hook.substring(0, 155)) + '...';
  const canonical = `${SITE_URL}/nolcool/${cat.slug}/${v.slug}/`;
  const today = new Date().toISOString().split('T')[0];
  const catColor = cat.color;

  // 이미지 색상 (카테고리 기반)
  const colors = [catColor, catColor+'cc', catColor+'99'];

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="놀쿨">
<meta property="og:locale" content="ko_KR">
${v.faq.length ? `<script type="application/ld+json">${faqSchema(v.faq)}</script>` : ''}
<style>${CSS}</style>
</head>
<body>
${header()}

<div class="nc-hero-img"><div class="placeholder" style="background:${catColor}">${cat.icon}</div></div>

<article class="nc-article">
<div class="nc-breadcrumb"><a href="/">놀쿨</a> &gt; <a href="/nolcool/${cat.slug}/">${cat.name}</a> &gt; ${esc(v.name)}</div>
<span class="nc-category-tag">${cat.icon} ${cat.name}</span>
<h1>${esc(v.h1Title || v.name)}</h1>
<p class="nc-date">${v.region} · 업데이트 ${today}</p>

<div class="nc-hook">${esc(hook)}</div>

<section class="nc-section">
<h2>기본 정보</h2>
<dl class="nc-info-grid">
<dt>주소</dt><dd>${esc(v.address)}</dd>
<dt>지역</dt><dd>${esc(v.region)}</dd>
<dt>업종</dt><dd>${esc(v.typeName)}</dd>
${v.phone ? `<dt>연락처</dt><dd>${esc(v.phone)}</dd>` : ''}
${v.nickname ? `<dt>담당</dt><dd>${esc(v.nickname)}</dd>` : ''}
</dl>
</section>

<div class="nc-gallery">
${colors.map(c => `<div class="nc-gallery-item"><div class="placeholder" style="background:${c}">📸</div></div>`).join('')}
</div>

${v.atmosphere ? `<section class="nc-section">
<h2>분위기</h2>
<p>${esc(v.atmosphere)}</p>
</section>` : ''}

${v.music ? `<section class="nc-section">
<h2>음악</h2>
<p>${esc(v.music)}</p>
</section>` : ''}

${v.highlights.length ? `<section class="nc-section">
<h2>이런 점이 좋아요</h2>
<ul>${v.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
</section>` : ''}

${v.timeline.length ? `<section class="nc-section">
<h2>타임라인</h2>
<div class="nc-timeline">
${v.timeline.map(t => `<div class="tl-item"><span class="tl-time">${esc(t.time)}</span><p class="tl-event">${esc(t.event)}</p></div>`).join('')}
</div>
</section>` : ''}

${v.faq.length ? `<section class="nc-section nc-faq">
<h2>자주 묻는 질문</h2>
${v.faq.map(f => `<details><summary>${esc(f.q)}</summary><div class="faq-answer">${esc(f.a)}</div></details>`).join('')}
</section>` : ''}

${cta(v.name)}

</article>
${footer()}
</body>
</html>`;
}

// ─── 카테고리 페이지 ────────────────────────────────────
function buildCategoryPage(cat, venues) {
  const title = `${cat.name} 추천 — 전국 ${cat.name} ${venues.length}곳 가이드 | 놀쿨`;
  const desc = `전국 인기 ${cat.name} ${venues.length}곳의 분위기·음악·이용 정보를 한눈에 비교하세요.`;
  const canonical = `${SITE_URL}/nolcool/${cat.slug}/`;
  const today = new Date().toISOString().split('T')[0];

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="놀쿨">
<meta property="og:locale" content="ko_KR">
<style>${CSS}</style>
</head>
<body>
${header()}

<article class="nc-article" style="padding-top:40px">
<div class="nc-breadcrumb"><a href="/">놀쿨</a> &gt; ${cat.name}</div>
<span class="nc-category-tag">${cat.icon} ${cat.name}</span>
<h1>전국 ${cat.name} ${venues.length}곳 완벽 가이드</h1>
<p class="nc-date">업데이트 ${today}</p>
<p style="color:#555;line-height:1.8;margin-bottom:32px">${desc}</p>

<section class="nc-section">
<h2>${cat.name} 전체 목록</h2>
${venues.map(v => `
<a href="/nolcool/${cat.slug}/${v.slug}/" class="nc-venue-card">
  <div class="thumb"><div class="placeholder" style="background:${cat.color}">${cat.icon}</div></div>
  <div class="text">
    <h3>${esc(v.name)}</h3>
    <p class="loc">${esc(v.region)} · ${esc(v.address)}</p>
    <p>${esc(v.shortDesc)}</p>
  </div>
</a>`).join('')}
</section>

${cta(cat.name)}

</article>
${footer()}
</body>
</html>`;
}

// ─── 허브(홈) 페이지 ────────────────────────────────────
function buildHubPage(allVenues) {
  const title = '놀쿨 — 전국 나이트·클럽·라운지 완벽 가이드';
  const desc = '전국 나이트, 클럽, 라운지, 호빠, 룸, 요정 152곳의 분위기·음악·이용 정보를 한눈에. 놀쿨에서 확인하세요.';
  const canonical = `${SITE_URL}/`;
  const today = new Date().toISOString().split('T')[0];

  const catCounts = {};
  for (const v of allVenues) { catCounts[v.type] = (catCounts[v.type]||0) + 1; }

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="놀쿨">
<meta property="og:locale" content="ko_KR">
<script type="application/ld+json">${JSON.stringify({
  "@context":"https://schema.org","@type":"WebSite",
  "name":"놀쿨","url":SITE_URL,"description":desc
})}</script>
<style>${CSS}</style>
</head>
<body>
${header()}

<div class="nc-hub-hero">
<h1>놀쿨</h1>
<p>전국 나이트·클럽·라운지·호빠 ${allVenues.length}곳<br>분위기·음악·이용 정보를 한눈에 확인하세요</p>
</div>

<article class="nc-article">

<section class="nc-section">
<h2>카테고리별 가이드</h2>
<div class="nc-cat-grid">
${CATEGORIES.map(c => `
<a href="/nolcool/${c.slug}/" class="nc-cat-card">
  <div class="thumb"><div class="placeholder" style="background:${c.gradient}">${c.icon}</div></div>
  <div class="info">
    <h3>${c.name}</h3>
    <p>전국 인기 ${c.name}의 분위기·이용 정보 가이드</p>
    <p class="count">${catCounts[c.type]||0}곳</p>
  </div>
</a>`).join('')}
</div>
</section>

<section class="nc-section">
<h2>최근 업데이트</h2>
${allVenues.slice(0, 8).map(v => {
  const cat = CATEGORIES.find(c => c.type === v.type);
  return `
<a href="/nolcool/${cat.slug}/${v.slug}/" class="nc-venue-card">
  <div class="thumb"><div class="placeholder" style="background:${cat.color}">${cat.icon}</div></div>
  <div class="text">
    <h3>${esc(v.name)}</h3>
    <p class="loc">${esc(v.region)} · ${esc(v.typeName)}</p>
    <p>${esc(v.shortDesc)}</p>
  </div>
</a>`;
}).join('')}
</section>

${cta('놀쿨')}

</article>
${footer()}
</body>
</html>`;
}

// ─── 파일 생성 ──────────────────────────────────────
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function generate() {
  console.log('🎯 놀쿨 서브사이트 생성 시작 (나이트라이프 152곳)...\n');

  const allVenues = loadVenues();
  console.log(`📊 로드된 가게: ${allVenues.length}곳`);

  const byType = {};
  for (const v of allVenues) {
    if (!byType[v.type]) byType[v.type] = [];
    byType[v.type].push(v);
  }
  for (const [t, arr] of Object.entries(byType)) {
    console.log(`   ${t}: ${arr.length}곳`);
  }

  // 허브 → public/index.html + nolcool/index.html
  ensureDir(BASE);
  ensureDir(PUBLIC);
  const hubHtml = buildHubPage(allVenues);
  fs.writeFileSync(path.join(BASE, 'index.html'), hubHtml);
  fs.writeFileSync(path.join(PUBLIC, 'index.html'), hubHtml);
  console.log('\n✅ 허브: / (루트) + /nolcool/');

  // 카테고리 & 가게
  let venueCount = 0;
  for (const cat of CATEGORIES) {
    const venues = byType[cat.type] || [];
    if (venues.length === 0) { console.log(`⏭️  ${cat.name}: 0곳, 스킵`); continue; }

    const catDir = path.join(BASE, cat.slug);
    ensureDir(catDir);
    fs.writeFileSync(path.join(catDir, 'index.html'), buildCategoryPage(cat, venues));
    console.log(`✅ ${cat.name}: ${venues.length}곳 → /nolcool/${cat.slug}/`);

    for (const v of venues) {
      const venueDir = path.join(catDir, v.slug);
      ensureDir(venueDir);
      fs.writeFileSync(path.join(venueDir, 'index.html'), buildVenuePage(v, cat));
      venueCount++;
    }
  }

  console.log(`\n🎉 생성 완료!`);
  console.log(`   허브: 1개 (루트)`);
  console.log(`   카테고리: ${CATEGORIES.length}개`);
  console.log(`   가게: ${venueCount}개`);
  console.log(`   총: ${1 + CATEGORIES.length + venueCount}개 페이지`);
}

generate();
