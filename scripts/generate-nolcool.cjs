/**
 * 놀쿨 v3 — 체류95분 / 베스트셀러 / SEO 완벽
 * seoDesc≤150자! 본문≥1000자! JSON-LD NightClub!
 * 제목중복금지! 금지단어! 유사도10%! 틱톡심리학!
 */
const fs = require('fs'), path = require('path');
const BASE = path.join(__dirname,'..','nolcool');
const PUB = path.join(__dirname,'..','public');
const SITE = 'https://week1-6m5.pages.dev';

// ─── 광고주 없는 업소 (닉네임/전화 표시 금지) ─────────────
const AD_FREE = new Set(['sangbong-hankukgwan','hwajeong-hankukgwan','suwon-korea','bundang-pongpong','busan-asiad','ulsan-newworld','suyu-shampoo','indeokwon-gukbingwan']);
const NICK_BAN = { 'haeundae-goguryeo': ['신실장'] };

// ─── AI 금지단어 + 구어체 변환 ────────────────────────
function rewrite(t) {
  return (t||'')
    .replace(/다양한/g,'여러').replace(/특별한/g,'남다른').replace(/프리미엄/g,'고급')
    .replace(/최고의/g,'으뜸가는').replace(/뛰어난/g,'눈에 띄는').replace(/차별화된/g,'독특한')
    .replace(/혁신적인/g,'새로운').replace(/할 수 있습니다/g,'할 수 있다').replace(/할수있습니다/g,'할 수 있다')
    .replace(/제공합니다/g,'준다').replace(/드립니다/g,'준다').replace(/되어 있습니다/g,'돼 있다')
    .replace(/됩니다/g,'된다').replace(/있습니다/g,'있다').replace(/합니다/g,'한다')
    .replace(/입니다/g,'이다').replace(/습니다/g,'다').replace(/ㅂ니다/g,'다')
    .replace(/가족모임/g,'').replace(/가족 모임/g,'').replace(/패밀리/g,'').replace(/놀쿨/g,'놀쿨');
}

// ─── 데이터 로드 ─────────────────────────────────────
function loadVenues() {
  const dir = path.join(__dirname,'..','src','data');
  const files = ['nights-seoul.ts','nights-gyeonggi.ts','nights-other.ts','clubs-data.ts','lounges-data.ts','others-data.ts'];
  let code = ''; for (const f of files) code += fs.readFileSync(path.join(dir,f),'utf8')+'\n';
  const vs = []; const re = /export\s+const\s+\w+\s*(?::\s*Venue\[\])?\s*=\s*\[([\s\S]*?)\];/g; let m;
  while ((m=re.exec(code))!==null) { let d=0,s=-1; for(let i=0;i<m[1].length;i++){if(m[1][i]==='{'){if(d===0)s=i;d++;}else if(m[1][i]==='}'){d--;if(d===0&&s!==-1){try{const v=pv(m[1].substring(s,i+1));if(v&&v.name&&v.slug)vs.push(v);}catch(e){}s=-1;}}} }
  // 광고주 없는 업소 처리
  for (const v of vs) {
    if (AD_FREE.has(v.slug)) { v.nickname=''; v.phone=''; }
    if (NICK_BAN[v.slug]) { for (const n of NICK_BAN[v.slug]) { if (v.nickname===n) v.nickname=''; } }
  }
  return vs;
}
function pv(s){const g=k=>{const m=s.match(new RegExp(`${k}\\s*:\\s*'([^']*(?:\\\\'[^']*)*)'`))||s.match(new RegExp(`${k}\\s*:\\s*\`([^\`]*)\``));return m?m[1].replace(/\\'/g,"'"):''};const gn=k=>{const m=s.match(new RegExp(`${k}\\s*:\\s*(\\d+)`));return m?parseInt(m[1]):0};const ga=k=>{const m=s.match(new RegExp(`${k}\\s*:\\s*\\[([^\\]]*?)\\]`,'s'));return m?[...m[1].matchAll(/'([^']*)'/g)].map(x=>x[1]):[]};const fq=[];let fm;const fr=/\{\s*q:\s*'([^']*(?:\\'[^']*)*)'\s*,\s*a:\s*'([^']*(?:\\'[^']*)*)'\s*\}/g;while((fm=fr.exec(s))!==null)fq.push({q:fm[1].replace(/\\'/g,"'"),a:fm[2].replace(/\\'/g,"'")});const tl=[];let tm;const tr=/\{\s*time:\s*'([^']*)'\s*,\s*event:\s*'([^']*(?:\\'[^']*)*)'\s*\}/g;while((tm=tr.exec(s))!==null)tl.push({time:tm[1],event:tm[2].replace(/\\'/g,"'")});return{id:gn('id'),slug:g('slug'),name:g('name'),type:g('type'),typeName:g('typeName'),nickname:g('nickname'),phone:g('phone'),region:g('region'),regionSlug:g('regionSlug'),address:g('address'),shortDesc:g('shortDesc'),description:g('description'),atmosphere:g('atmosphere'),music:g('music'),highlights:ga('highlights'),timeline:tl,faq:fq,tags:ga('tags'),seoTitle:g('seoTitle'),seoDescription:g('seoDescription'),h1Title:g('h1Title')};}

const CATS=[
  {type:'night',name:'나이트',icon:'🌙',slug:'night',color:'#7c3aed'},
  {type:'club',name:'클럽',icon:'🎵',slug:'club',color:'#dc2626'},
  {type:'lounge',name:'라운지',icon:'🍸',slug:'lounge',color:'#0ea5e9'},
  {type:'hoppa',name:'호빠',icon:'🎭',slug:'hoppa',color:'#e11d48'},
  {type:'room',name:'룸',icon:'🚪',slug:'room',color:'#ea580c'},
  {type:'yojeong',name:'요정',icon:'🏮',slug:'yojeong',color:'#059669'},
];

// ─── hookTitle: 가게이름 단어 금지 + 제목중복금지 ──────────
const HOOKS = [
  '한 번 가면 단골 되는 곳','밤이 아까워지는 공간','입소문만으로 줄 서는 이유',
  '분위기 하나로 승부하는 곳','새벽이 짧게 느껴지는 밤','아는 사람만 찾는 숨은 명소',
  '갈 때마다 새로운 밤','기대 이상의 경험','퇴근 후 스트레스가 사라지는 곳',
  '들어서는 순간 기분이 바뀌는 곳','분위기 끝내주는 곳','멈출 수 없는 밤의 시작',
];
function hookTitle(v, idx) {
  const nameWords = v.name.replace(/나이트|클럽|라운지|호빠|룸|요정/g,'').split(/\s+/).filter(w=>w.length>=2);
  for (let i=0; i<HOOKS.length; i++) {
    const h = HOOKS[(idx+i) % HOOKS.length];
    const dup = nameWords.some(w => h.includes(w));
    if (!dup) return h;
  }
  return HOOKS[idx % HOOKS.length];
}
// 제목 중복단어 검사
function titleCheck(title) {
  const words = title.replace(/[|—·\-]/g,' ').split(/\s+/).filter(w=>w.length>=2);
  const seen = new Set();
  for (const w of words) { if (seen.has(w)) return false; seen.add(w); }
  return true;
}

// ─── seoDescription ≤ 150자 ─────────────────────────
function seoDesc(v) {
  let d = `${v.region} ${v.name}. ${rewrite(v.shortDesc||v.seoDescription||'')}`;
  d = d.replace(/\s+/g,' ').trim();
  if (d.length > 150) d = d.substring(0,147)+'...';
  return d;
}

// ─── 본문 1000자+ (첫100자 가게이름, 키워드 정확히 3회, 구어체) ──
function buildBody(v) {
  const fullName = `${v.region} ${v.typeName} ${v.name}`;
  const kw = v.name;
  const kwRe = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g');
  // 본문 조합
  let body = rewrite(v.description || '');
  if (v.atmosphere) body += ' ' + rewrite(v.atmosphere);
  if (v.music) body += ' 음악은 ' + rewrite(v.music) + ' 장르가 흐른다.';
  if (v.highlights.length) body += ' ' + v.highlights.join('. ') + '.';
  if (v.timeline.length) body += ' ' + v.timeline.map(t=>t.time+' '+t.event).join('. ')+'.';
  // 1000자 보장 (가게이름 대신 이곳/여기 사용)
  while (body.length < 1050) {
    body += ` 이 동네에서 빠질 수 없는 이름이다. 피크 시간을 피해 일찍 가면 여유롭게 자리 잡을 수 있다. 조명과 음악이 만드는 분위기는 말로 설명이 안 된다. 주변 먹거리와 연계하면 하루가 알차다. 단골이 많은 데는 이유가 있다. 두세 번 다른 시간대에 가 보면, 왜 꾸준히 사람이 몰리는지 체감한다.`;
  }
  // 키워드 정확히 3회로 조정 (스터핑 금지!)
  let cnt = (body.match(kwRe)||[]).length;
  // 3회 초과 → 초과분을 "이곳"으로 교체
  if (cnt > 3) {
    let replaced = 0;
    body = body.replace(kwRe, (match) => {
      replaced++;
      if (replaced <= 2) return match; // 처음 2개는 유지
      return '이곳'; // 나머지는 교체
    });
  }
  // 3회 미만 → 부족분 추가
  cnt = (body.match(kwRe)||[]).length;
  if (cnt < 2) body += ` ${kw}을(를) 처음 찾는 사람이라면 이 글이 도움이 될 것이다.`;
  cnt = (body.match(kwRe)||[]).length;
  if (cnt < 3) body += ` ${kw}, 직접 가 봐야 안다.`;
  // 첫 문장에 전체이름 삽입
  body = `${fullName}. ${body}`;
  // 최종 키워드 수 확인 (첫문장 포함 max 3)
  let finalCnt = (body.match(kwRe)||[]).length;
  if (finalCnt > 3) {
    let r = 0;
    body = body.replace(kwRe, (m) => { r++; return r <= 3 ? m : '이곳'; });
  }
  return body;
}

// ─── 이미지 10장 (전부 다른 그라데이션) ──────────────────
function imgGradients(c, n) {
  const angles = [135,180,225,90,270,45,315,0,160,200];
  const offsets = ['00','11','22','33','44','55','66','77','88','99'];
  return Array.from({length:n}, (_,i) => `linear-gradient(${angles[i%10]}deg,${c},${c}${offsets[i%10]})`);
}

// ─── JSON-LD NightClub ──────────────────────────────
function nightclubLD(v) {
  const obj = {"@context":"https://schema.org","@type":"NightClub","name":v.name,"address":{"@type":"PostalAddress","addressLocality":v.region,"streetAddress":v.address,"addressCountry":"KR"}};
  if (v.description) obj.description = v.description.substring(0,200);
  if (v.phone) obj.telephone = v.phone;
  return JSON.stringify(obj);
}

// ─── CSS ──────────────────────────────────────────
const CSS = `*{margin:0;padding:0;box-sizing:border-box}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:-apple-system,'Pretendard','Noto Sans KR',sans-serif;color:#1a1a1a;background:#fff;line-height:1.6;word-break:keep-all;padding-bottom:60px}
a{color:inherit;text-decoration:none}
.sb{position:fixed;top:0;left:0;height:3px;background:#7c3aed;z-index:999;width:0}
.hd{position:sticky;top:0;z-index:100;background:rgba(255,255,255,.97);backdrop-filter:blur(8px);border-bottom:1px solid #eee;padding:0 16px}
.hi{max-width:720px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:52px}
.lo{font-size:1.2rem;font-weight:800;color:#7c3aed}.lo span{color:#1a1a1a}
.nv{display:flex;gap:10px;font-size:.78rem;color:#666;overflow-x:auto;white-space:nowrap}.nv a{min-height:44px;display:flex;align-items:center;padding:0 4px}.nv a:hover{color:#7c3aed}
.hero{width:100%;max-width:720px;margin:0 auto;aspect-ratio:1/1;border-radius:16px;overflow:hidden}
.hero .ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3.5rem;color:rgba(255,255,255,.8)}
/* 스와이프 갤러리 6장 */
.sg{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding:0 16px;margin:24px auto;max-width:720px}
.sg::-webkit-scrollbar{display:none}.sg{scrollbar-width:none}
.sgi{min-width:70%;aspect-ratio:4/3;border-radius:14px;scroll-snap-align:center;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:1.3rem;color:rgba(255,255,255,.7)}
/* 본문 이미지 4장 */
.bg{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:24px auto;max-width:720px;padding:0 16px}
.bgi{aspect-ratio:4/3;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:rgba(255,255,255,.6)}
.ar{max-width:720px;margin:0 auto;padding:20px 16px 40px}
.bc{font-size:.76rem;color:#999;margin-bottom:12px}.bc a{color:#7c3aed}
.tg{display:inline-block;background:#f3f0ff;color:#7c3aed;font-size:.7rem;font-weight:600;padding:3px 10px;border-radius:20px;margin-bottom:8px}
h1{font-size:1.55rem;font-weight:800;line-height:1.3;margin-bottom:4px}
.sub{font-size:.88rem;color:#777;margin-bottom:4px}
.dt{font-size:.76rem;color:#aaa;margin-bottom:18px}
.cnt{font-size:.76rem;color:#e11d48;margin-bottom:18px;font-weight:600}
.hk{font-size:.98rem;color:#333;line-height:1.82;margin-bottom:28px;background:#faf9fc;padding:18px 20px;border-radius:12px;border-left:4px solid #7c3aed}
.sc{margin-bottom:32px}
.sc h2{font-size:1.15rem;font-weight:700;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #f0f0f0}
.sc p{color:#444;margin-bottom:8px}.sc ul{padding-left:16px;margin-bottom:8px}.sc li{color:#444;margin-bottom:4px}
.ig{display:grid;grid-template-columns:68px 1fr;gap:5px 12px;background:#f9f8fc;padding:16px;border-radius:12px;font-size:.9rem}
.ig dt{font-weight:600;color:#666}.ig dd{color:#333}
.tl{position:relative;padding-left:20px;border-left:3px solid #e9e5ff}
.tl .ti{margin-bottom:12px;position:relative}.tl .ti::before{content:'';position:absolute;left:-26px;top:4px;width:10px;height:10px;border-radius:50%;background:#7c3aed}
.tl .tt{font-size:.78rem;font-weight:700;color:#7c3aed}.tl .te{font-size:.9rem;color:#444}
.fq details{border:1px solid #eee;border-radius:10px;margin-bottom:6px;overflow:hidden}
.fq summary{padding:12px 16px;font-weight:600;cursor:pointer;background:#fafafa;font-size:.9rem;min-height:44px;display:flex;align-items:center}
.fq summary:hover{background:#f0f0f0}.fq details[open] summary{border-bottom:1px solid #eee}
.fq .fa{padding:12px 16px;color:#555;font-size:.88rem;line-height:1.78}
.tb{width:100%;border-collapse:collapse;font-size:.85rem;margin-top:6px}
.tb th,.tb td{padding:8px 10px;border:1px solid #eee;text-align:left}.tb th{background:#f9f8fc;font-weight:600;color:#555;white-space:nowrap}
/* VS 투표 */
.vs{display:flex;align-items:center;gap:12px;margin:24px 0;justify-content:center}
.vs button{flex:1;max-width:200px;padding:16px;border:2px solid #eee;border-radius:14px;background:#fff;font-size:.9rem;font-weight:700;cursor:pointer;min-height:60px;transition:all .2s}
.vs button:hover{border-color:#7c3aed;background:#f3f0ff}.vs button.voted{border-color:#7c3aed;background:#7c3aed;color:#fff}
.vs .mid{font-size:1.2rem;font-weight:800;color:#7c3aed}
/* 퀴즈/운세 */
.qz{background:#f3f0ff;padding:20px;border-radius:14px;margin:24px 0;text-align:center}
.qz p{font-weight:700;margin-bottom:10px}.qz button{background:#7c3aed;color:#fff;border:none;padding:10px 24px;border-radius:20px;font-weight:600;cursor:pointer;min-height:44px}
.qz .ans{margin-top:10px;font-size:.9rem;color:#555;display:none}
/* 비밀 (80% 스크롤) */
.secret{background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:24px;border-radius:14px;margin:28px 0;display:none}
.secret h3{margin-bottom:8px;font-size:1.05rem}.secret p{font-size:.9rem;line-height:1.7;opacity:.85}
/* 다음글 */
.nx{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin:20px 0}
.nc{display:flex;align-items:center;gap:10px;border:1px solid #eee;border-radius:12px;padding:10px;min-height:60px}
.nc:hover{box-shadow:0 3px 12px rgba(0,0,0,.05)}
.nt{width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:#fff;flex-shrink:0}
.nc strong{display:block;font-size:.85rem}.nc span{font-size:.72rem;color:#999}
/* CTA */
.cta{text-align:center;padding:32px 16px;background:linear-gradient(135deg,#f3f0ff,#e9e5ff);border-radius:14px;margin:32px 0}
.cta p{font-size:.9rem;color:#555;margin-bottom:12px}
.cta .btn{display:inline-block;background:#7c3aed;color:#fff;font-size:.9rem;font-weight:700;padding:12px 28px;border-radius:26px;min-height:44px}
/* 푸터 */
.ft{border-top:1px solid #eee;padding:32px 16px 80px;text-align:center;color:#999;font-size:.78rem;line-height:1.9}
.ft .kk{font-weight:600;color:#666}.ft .sm{margin-top:8px;font-size:.85rem;color:#7c3aed;font-weight:600}
/* 하단 고정바 */
.bb{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #eee;display:flex;justify-content:space-around;padding:6px 0;z-index:100}
.bb a{display:flex;flex-direction:column;align-items:center;font-size:.65rem;color:#999;min-height:44px;justify-content:center;padding:0 8px;text-decoration:none}
.bb a:hover,.bb a.on{color:#7c3aed}
.bb .bi{font-size:1.1rem;margin-bottom:2px}
/* 허브 */
.hh{text-align:center;padding:50px 16px 32px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;margin-bottom:32px}
.hh h1{font-size:1.8rem;margin-bottom:8px;color:#fff}.hh p{font-size:.95rem;opacity:.85;max-width:440px;margin:0 auto}
.cg{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin:24px 0}
.cc{border:1px solid #eee;border-radius:14px;overflow:hidden}.cc:hover{box-shadow:0 5px 20px rgba(0,0,0,.06)}
.cc .ct{aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;font-size:2rem}
.cc .ci{padding:16px}.cc .ci h3{font-size:1rem;font-weight:700;margin-bottom:3px}.cc .ci p{font-size:.82rem;color:#666}.cc .ci .cn{font-size:.72rem;color:#7c3aed;font-weight:600;margin-top:4px}
.vc{display:flex;gap:12px;border:1px solid #eee;border-radius:12px;padding:12px;margin-bottom:12px;min-height:44px}
.vc:hover{box-shadow:0 2px 12px rgba(0,0,0,.04)}
.vc .vt{width:80px;min-width:80px;aspect-ratio:1/1;border-radius:10px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:#fff}
.vc .vx h3{font-size:.9rem;font-weight:700;margin-bottom:2px}.vc .vx .vl{font-size:.72rem;color:#999;margin-bottom:3px}
.vc .vx p{font-size:.82rem;color:#555;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
@media(max-width:640px){h1{font-size:1.3rem}.hero{border-radius:0;margin:0 -16px;max-width:none}.bg{padding:0}.vc{flex-direction:column}.vc .vt{width:100%;aspect-ratio:16/9}.cg{grid-template-columns:1fr}}`;

// ─── JS (스크롤바+비밀+카운터+퀴즈+투표+무한스크롤) ──────────
const JS = `<script>
(function(){
// 스크롤 진행률
var sb=document.getElementById('sb');
window.addEventListener('scroll',function(){var h=document.documentElement;sb.style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight))*100+'%';},{passive:true});
// 80% 비밀 공개
var sec=document.getElementById('sec');
if(sec){window.addEventListener('scroll',function(){var h=document.documentElement;if(h.scrollTop/(h.scrollHeight-h.clientHeight)>0.8)sec.style.display='block';},{passive:true});}
// 카운터
var vc=document.getElementById('vc');
if(vc){var k='nc_'+location.pathname;var c=parseInt(localStorage.getItem(k)||'0');c+=Math.floor(Math.random()*3)+1;localStorage.setItem(k,c);vc.textContent=Math.max(c,Math.floor(Math.random()*40)+15);}
// VS투표
document.querySelectorAll('.vs button').forEach(function(b){b.onclick=function(){this.classList.add('voted');this.parentElement.querySelectorAll('button').forEach(function(x){x.disabled=true;});}});
// 퀴즈 정답
document.querySelectorAll('.qz button').forEach(function(b){b.onclick=function(){this.nextElementSibling.style.display='block';this.style.display='none';}});
})();
</script>`;

function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function hdr(){const n=CATS.map(c=>`<a href="/nolcool/${c.slug}/">${c.icon} ${c.name}</a>`).join('');return `<div class="sb" id="sb"></div><header class="hd"><div class="hi"><a href="/" class="lo">놀<span>쿨</span></a><nav class="nv">${n}</nav></div></header>`;}
function ftr(){return `<footer class="ft"><p>카카오톡: <span class="kk">besta12</span></p><p class="sm">구글·AI에서 놀쿨을 검색하세요</p><p style="margin-top:5px">&copy; 2025 놀쿨</p></footer>`;}
function bbar(cat){return `<nav class="bb">${CATS.slice(0,5).map(c=>`<a href="/nolcool/${c.slug}/"${c.type===cat?.type?' class="on"':''}><span class="bi">${c.icon}</span>${c.name}</a>`).join('')}</nav>`;}

// ─── 가게 상세 페이지 ───────────────────────────────
function venuePage(v,cat,same,idx){
  const ht=hookTitle(v,idx);
  const ttl=`${v.name} — ${ht} | 놀쿨`;
  if(!titleCheck(ttl))console.warn('⚠️ 제목중복:',ttl);
  const sd=seoDesc(v);
  if(sd.length>150){console.error('❌ seoDesc>150:',v.slug,sd.length);process.exit(1);}
  const body=buildBody(v);
  const canon=`${SITE}/nolcool/${cat.slug}/${v.slug}/`;
  const ogImg=`${SITE}/nolcool/og/${cat.slug}.svg`;
  const today=new Date().toISOString().split('T')[0];
  const c=cat.color;
  const grads=imgGradients(c,10);
  const icons=['📸','📷','🖼️','🏙️','✨','🎶','🌃','💫','🔥','⭐'];
  // 비교표
  const comp=same.filter(x=>x.slug!==v.slug).slice(0,2);
  const compAll=[v,...comp];
  // 다음글
  const nxSame=same.filter(x=>x.regionSlug===v.regionSlug&&x.slug!==v.slug);
  const nxDiff=same.filter(x=>x.regionSlug!==v.regionSlug&&x.slug!==v.slug);
  const picks=[...nxSame.slice(0,1),...nxDiff.slice(0,2)].slice(0,3);
  if(picks.length<3){const more=same.filter(x=>x.slug!==v.slug&&!picks.includes(x));while(picks.length<3&&more.length)picks.push(more.shift());}
  // VS 상대
  const vsOpp=same.find(x=>x.slug!==v.slug&&x.regionSlug===v.regionSlug)||same.find(x=>x.slug!==v.slug);
  // 비밀 텍스트
  const secrets=['피크 직전에 가면 자리 선점이 쉽다.','단골들은 보통 두 번째 방문부터 진짜 재미를 느낀다고 한다.','직원에게 먼저 인사하면 분위기가 확 달라진다.','조명이 바뀌는 시간대가 있다. 그때가 하이라이트다.'];

  return `<!DOCTYPE html><html lang="ko"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(ttl)}</title>
<meta name="description" content="${esc(sd)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${canon}">
<link rel="icon" type="image/svg+xml" href="/favicon-nolcool.svg">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(v.name)} — ${esc(v.region)} ${esc(v.typeName)} 가이드">
<meta property="og:description" content="${esc(sd)}">
<meta property="og:url" content="${canon}">
<meta property="og:image" content="${ogImg}">
<meta property="og:site_name" content="놀쿨"><meta property="og:locale" content="ko_KR">
<script type="application/ld+json">${nightclubLD(v)}</script>
${v.faq.length?`<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"FAQPage","mainEntity":v.faq.map(f=>({"@type":"Question","name":f.q,"acceptedAnswer":{"@type":"Answer","text":f.a}}))})}</script>`:''}
<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"놀쿨","item":SITE},{"@type":"ListItem","position":2,"name":cat.name,"item":`${SITE}/nolcool/${cat.slug}/`},{"@type":"ListItem","position":3,"name":v.name}]})}</script>
<style>${CSS}</style></head><body>
${hdr()}
<div class="hero"><div class="ph" style="background:${grads[0]}">${cat.icon}</div></div>
<article class="ar">
<div class="bc"><a href="/">놀쿨</a> &gt; <a href="/nolcool/${cat.slug}/">${cat.name}</a> &gt; ${esc(v.name)}</div>
<span class="tg">${cat.icon} ${cat.name}</span>
<h1>${esc(v.name)}</h1>
<p class="sub">${esc(ht)}</p>
<p class="dt">${esc(v.region)} · ${today}</p>
<p class="cnt">오늘 <span id="vc">0</span>명이 봤습니다</p>
<div class="hk">${esc(body)}</div>

<section class="sc"><h2>기본 정보</h2>
<dl class="ig"><dt>주소</dt><dd>${esc(v.address)}</dd><dt>지역</dt><dd>${esc(v.region)}</dd><dt>업종</dt><dd>${esc(v.typeName)}</dd>
${v.phone?`<dt>연락처</dt><dd>${esc(v.phone)}</dd>`:''}${v.nickname?`<dt>담당</dt><dd>${esc(v.nickname)}</dd>`:''}</dl></section>

<div class="sg">${[0,1,2,3,4,5].map(i=>`<div class="sgi" style="background:${grads[i]}">${icons[i]} ${i+1}</div>`).join('')}</div>
<div class="bg">${[6,7,8,9].map(i=>`<div class="bgi" style="background:${grads[i]}">${icons[i]}</div>`).join('')}</div>

${v.highlights.length?`<section class="sc"><h2>이런 점이 좋다</h2><ul>${v.highlights.map(h=>`<li>${esc(h)}</li>`).join('')}</ul></section>`:''}
${v.timeline.length?`<section class="sc"><h2>타임라인</h2><div class="tl">${v.timeline.map(t=>`<div class="ti"><span class="tt">${esc(t.time)}</span><p class="te">${esc(t.event)}</p></div>`).join('')}</div></section>`:''}

${vsOpp?`<section class="sc"><h2>VS 투표</h2><div class="vs"><button>${esc(v.name)}</button><span class="mid">VS</span><button>${esc(vsOpp.name)}</button></div></section>`:''}

<section class="sc qz"><p>Q. ${esc(v.region)}에서 가장 분위기 좋은 ${esc(v.typeName)}은?</p><button>정답 확인</button><p class="ans">${esc(v.name)}이(가) 단연 인기다. 직접 가 봐야 안다.</p></section>

${v.faq.length?`<section class="sc fq"><h2>자주 묻는 질문</h2>${v.faq.map(f=>`<details><summary>${esc(f.q)}</summary><div class="fa">${esc(f.a)}</div></details>`).join('')}</section>`:''}

${comp.length?`<section class="sc"><h2>${esc(v.typeName)} 비교</h2><div style="overflow-x:auto"><table class="tb"><thead><tr><th></th>${compAll.map(x=>`<th>${esc(x.name)}</th>`).join('')}</tr></thead><tbody>
<tr><td>지역</td>${compAll.map(x=>`<td>${esc(x.region)}</td>`).join('')}</tr>
<tr><td>분위기</td>${compAll.map(x=>`<td>${esc((x.atmosphere||'').substring(0,35))}…</td>`).join('')}</tr>
<tr><td>음악</td>${compAll.map(x=>`<td>${esc((x.music||'').substring(0,25))}…</td>`).join('')}</tr>
<tr><td>특징</td>${compAll.map(x=>`<td>${esc(x.highlights[0]||'')}</td>`).join('')}</tr>
</tbody></table></div></section>`:''}

<div class="secret" id="sec"><h3>🔒 이 업소의 비밀</h3><p>${secrets[idx%secrets.length]} 아는 사람만 아는 팁이다.</p></div>

${ctaBlock(v.name)}

${picks.length?`<section class="sc"><h2>다음에 읽을 글</h2><div class="nx">${picks.map(p=>`<a href="/nolcool/${cat.slug}/${p.slug}/" class="nc" target="_blank" rel="noopener"><div class="nt" style="background:${c}">${cat.icon}</div><div><strong>${esc(p.name)}</strong><span>${esc(p.region)}</span></div></a>`).join('')}</div></section>`:''}
</article>
${ftr()}${bbar(cat)}${JS}</body></html>`;
}
function ctaBlock(n){return `<div class="cta"><p>${esc(n)}, 더 자세한 정보를 확인해 보자.</p><a href="https://www.google.com/search?q=놀쿨+${encodeURIComponent(n)}" class="btn" target="_blank" rel="noopener">놀쿨에서 확인하세요</a></div>`;}

// ─── 카테고리 페이지 ────────────────────────────────
function catPage(cat,vs){
  const sd=`전국 인기 ${cat.name} ${vs.length}곳의 분위기, 음악, 이용 정보를 한눈에. 놀쿨에서 확인.`;
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>전국 ${cat.name} ${vs.length}곳 가이드 | 놀쿨</title>
<meta name="description" content="${esc(sd.substring(0,150))}"><meta name="robots" content="index,follow">
<link rel="canonical" href="${SITE}/nolcool/${cat.slug}/"><link rel="icon" type="image/svg+xml" href="/favicon-nolcool.svg">
<meta property="og:type" content="website"><meta property="og:title" content="전국 ${cat.name} ${vs.length}곳 가이드 | 놀쿨">
<meta property="og:description" content="${esc(sd.substring(0,150))}"><meta property="og:url" content="${SITE}/nolcool/${cat.slug}/">
<meta property="og:image" content="${SITE}/nolcool/og/${cat.slug}.svg"><meta property="og:site_name" content="놀쿨"><meta property="og:locale" content="ko_KR">
<style>${CSS}</style></head><body>${hdr()}
<article class="ar" style="padding-top:32px"><div class="bc"><a href="/">놀쿨</a> &gt; ${cat.name}</div>
<span class="tg">${cat.icon} ${cat.name}</span><h1>전국 ${cat.name} ${vs.length}곳 가이드</h1><p class="dt">업데이트 ${new Date().toISOString().split('T')[0]}</p>
<section class="sc"><h2>전체 목록</h2>${vs.map(v=>`<a href="/nolcool/${cat.slug}/${v.slug}/" class="vc" target="_blank" rel="noopener"><div class="vt" style="background:${cat.color}">${cat.icon}</div><div class="vx"><h3>${esc(v.name)}</h3><p class="vl">${esc(v.region)}</p><p>${esc(rewrite(v.shortDesc))}</p></div></a>`).join('')}</section>
${ctaBlock(cat.name)}</article>${ftr()}${bbar(cat)}${JS}</body></html>`;
}

// ─── 허브 ───────────────────────────────────────
function hubPage(allV){
  const cc={};for(const v of allV)cc[v.type]=(cc[v.type]||0)+1;
  const sd='전국 나이트, 클럽, 라운지, 호빠 152곳의 분위기와 음악 정보를 한눈에. 놀쿨에서 확인.';
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>놀쿨 — 전국 나이트·클럽·라운지 가이드</title>
<meta name="description" content="${esc(sd)}"><meta name="robots" content="index,follow">
<link rel="canonical" href="${SITE}/"><link rel="icon" type="image/svg+xml" href="/favicon-nolcool.svg">
<meta property="og:type" content="website"><meta property="og:title" content="놀쿨 — 전국 나이트·클럽·라운지 가이드">
<meta property="og:description" content="${esc(sd)}"><meta property="og:url" content="${SITE}/">
<meta property="og:image" content="${SITE}/nolcool/og/night.svg"><meta property="og:site_name" content="놀쿨"><meta property="og:locale" content="ko_KR">
<style>${CSS}</style></head><body>${hdr()}
<div class="hh"><h1>놀쿨</h1><p>전국 나이트·클럽·라운지·호빠 ${allV.length}곳<br>분위기·음악 정보를 한눈에</p></div>
<article class="ar"><section class="sc"><h2>카테고리</h2><div class="cg">${CATS.map(c=>`<a href="/nolcool/${c.slug}/" class="cc" target="_blank" rel="noopener"><div class="ct" style="background:${c.color}">${c.icon}</div><div class="ci"><h3>${c.name}</h3><p>전국 인기 ${c.name} 가이드</p><p class="cn">${cc[c.type]||0}곳</p></div></a>`).join('')}</div></section>
<section class="sc"><h2>최근 업데이트</h2>${allV.slice(0,8).map(v=>{const ct=CATS.find(c=>c.type===v.type);return`<a href="/nolcool/${ct.slug}/${v.slug}/" class="vc" target="_blank" rel="noopener"><div class="vt" style="background:${ct.color}">${ct.icon}</div><div class="vx"><h3>${esc(v.name)}</h3><p class="vl">${esc(v.region)} · ${esc(v.typeName)}</p><p>${esc(rewrite(v.shortDesc))}</p></div></a>`;}).join('')}</section>
${ctaBlock('놀쿨')}</article>${ftr()}${bbar()}${JS}</body></html>`;
}

// ─── sitemap ────────────────────────────────────
function sitemap(allV,bt){const d=new Date().toISOString().split('T')[0];let x=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>${SITE}/</loc><lastmod>${d}</lastmod><priority>1.0</priority></url>\n`;for(const c of CATS){if(!bt[c.type])continue;x+=`<url><loc>${SITE}/nolcool/${c.slug}/</loc><lastmod>${d}</lastmod><priority>0.8</priority></url>\n`;for(const v of bt[c.type])x+=`<url><loc>${SITE}/nolcool/${c.slug}/${v.slug}/</loc><lastmod>${d}</lastmod><priority>0.7</priority></url>\n`;}x+=`</urlset>`;return x;}

// ─── 실행 ───────────────────────────────────────
function ensureDir(d){if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});}
function generate(){
  console.log('🎯 놀쿨 v3 생성...\n');
  const allV=loadVenues();console.log(`📊 ${allV.length}곳`);
  const bt={};for(const v of allV){if(!bt[v.type])bt[v.type]=[];bt[v.type].push(v);}
  ensureDir(BASE);ensureDir(PUB);
  const hub=hubPage(allV);
  fs.writeFileSync(path.join(BASE,'index.html'),hub);
  fs.writeFileSync(path.join(PUB,'index.html'),hub);
  console.log('✅ 허브');
  let vc=0,seoFail=0,titleFail=0;
  for(const cat of CATS){const vs=bt[cat.type]||[];if(!vs.length)continue;
    const cd=path.join(BASE,cat.slug);ensureDir(cd);
    fs.writeFileSync(path.join(cd,'index.html'),catPage(cat,vs));
    console.log(`✅ ${cat.name}: ${vs.length}곳`);
    for(let i=0;i<vs.length;i++){const vd=path.join(cd,vs[i].slug);ensureDir(vd);
      const html=venuePage(vs[i],cat,vs,i);
      // 검증
      const sdm=html.match(/name="description" content="([^"]*)"/);
      if(sdm&&sdm[1].length>150){seoFail++;console.error(`❌ seoDesc>${150}: ${vs[i].slug} (${sdm[1].length}자)`);}
      const tm=html.match(/<title>([^<]*)<\/title>/);
      if(tm&&!titleCheck(tm[1])){titleFail++;console.warn(`⚠️ 제목중복: ${tm[1]}`);}
      fs.writeFileSync(path.join(vd,'index.html'),html);vc++;
    }
  }
  fs.writeFileSync(path.join(PUB,'nolcool-sitemap.xml'),sitemap(allV,bt));
  console.log(`\n🎉 완료! ${1+CATS.length+vc}페이지`);
  if(seoFail)console.error(`❌ seoDesc 초과: ${seoFail}건`);
  if(titleFail)console.warn(`⚠️ 제목중복: ${titleFail}건`);
  console.log(`seoDesc≤150: ${seoFail===0?'✅':'❌'} | 제목중복: ${titleFail===0?'✅':'⚠️'}`);
}
generate();
