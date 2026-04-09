// ═══════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════
const ADMIN_PASS = 'pdsu@admin2024';
const UPI_ID     = '7727867614@postbank';
const TG_HANDLE  = 'https://t.me/PdusuLibraryHelpline';
const DISMISSED_KEY = 'pdsu_dismissed_rejections';

// ═══════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════
const UG_STREAMS = [
  {id:'BA',   name:'BA',    emoji:'📜', full:'Bachelor of Arts'},
  {id:'BSc',  name:'B.Sc',  emoji:'🔬', full:'Bachelor of Science'},
  {id:'BCom', name:'B.Com', emoji:'📊', full:'Bachelor of Commerce'},
  {id:'BCA',  name:'BCA',   emoji:'💻', full:'Bachelor of Comp. Applications'},
  {id:'BBA',  name:'BBA',   emoji:'💼', full:'Bachelor of Business Admin'},
];
const PG_STREAMS = [
  {id:'MA',   name:'MA',    emoji:'🎓', full:'Master of Arts'},
  {id:'MSc',  name:'M.Sc',  emoji:'🔭', full:'Master of Science'},
  {id:'MCom', name:'M.Com', emoji:'📈', full:'Master of Commerce'},
  {id:'MCA',  name:'MCA',   emoji:'🖥️', full:'Master of Comp. Applications'},
  {id:'MBA',  name:'MBA',   emoji:'🏢', full:'Master of Business Admin'},
];
const SEMS = ['Semester 1','Semester 2','Semester 3','Semester 4','Semester 5','Semester 6'];
const UNIT_LABELS = {1:'Unit 1',2:'Unit 2',3:'Unit 3',4:'Unit 4','All':'All Units','all':'All Units'};
const UNIT_BADGE_CLASS = {1:'u1',2:'u2',3:'u3',4:'u4','All':'uA','all':'uA'};
const GRADIENTS = ['#7B1D1D,#B84E00','#1A4A7A,#2E7AC8','#1A7A40,#2EAA60','#5A0F7A,#8E2EC8','#7A5A0F,#C89A2E'];
const EMOJIS    = ['📘','📗','📙','📕','📓'];

// State
let _cat='UG';
let _ss=null;
let _sem=null;
let _selSubject=null;
let _admUnlocked=false;
let _pdfFile=null;
let _selBook=null;
let _appliedCoupon=null, _finalPrice=0;
let _screenshotFile=null, _screenshotUrl=null;
let _appRendered=false;

// ═══════════════════════════════════════════
//  DISMISSAL PERSISTENCE
// ═══════════════════════════════════════════
function getDismissed(){
  try{ return new Set(JSON.parse(localStorage.getItem(DISMISSED_KEY)||'[]')); }
  catch{ return new Set(); }
}
function saveDismissed(set){
  try{ localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set])); }
  catch{}
}
function dismissOrder(orderId){
  const d=getDismissed(); d.add(String(orderId)); saveDismissed(d);
}
function clearAllDismissals(){
  localStorage.removeItem(DISMISSED_KEY); renderMyBooks();
  toast('Saare notices wapas dikhaye ja rahe hain','ok');
}

// ═══════════════════════════════════════════
//  MOBILE DETECTION
// ═══════════════════════════════════════════
function isMobile(){
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 1 && window.innerWidth < 900);
}

// ═══════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════
function renderApp(){
  if(_appRendered) return;
  _appRendered=true;
  document.getElementById('ls').classList.add('gone');
  renderNav();
  nav('home');
}
setTimeout(()=>{ if(!_appRendered){ window._books=[]; window._purchases=[]; renderApp(); }}, 5000);

(function(){
  if(localStorage.getItem('pdsu-dark')==='1') document.body.classList.add('dark');
})();

// ═══════════════════════════════════════════
//  NAV
// ═══════════════════════════════════════════
function nav(v){
  document.querySelectorAll('.view').forEach(e=>e.classList.remove('active'));
  document.getElementById('view-'+v)?.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
  if(v==='library')  renderLib();
  if(v==='my-books') renderMyBooks();
  if(v==='admin')    renderAdmin();
  renderNav();
}

function renderNav(){
  const u=window._cur;
  const isDark=document.body.classList.contains('dark');
  const darkLabel=isDark?'☀️ Light':'🌙 Dark';
  const n=document.getElementById('hn');
  n.innerHTML = u
    ? `<button class="nb" onclick="nav('library')">Library</button>
       <button class="nb" onclick="nav('my-books')">Mere Books</button>
       ${u.isAdmin?`<button class="nb acc" onclick="nav('admin')">Admin</button>`:''}
       <button class="dark-btn" onclick="toggleDark()">${darkLabel}</button>
       <button class="nb red" onclick="doLogout()">Logout</button>`
    : `<button class="nb" onclick="nav('library')">Browse</button>
       <button class="dark-btn" onclick="toggleDark()">${darkLabel}</button>
       <button class="nb" onclick="nav('login')">Login</button>
       <button class="nb acc" onclick="nav('register')">Join Free</button>`;
  const cta=document.getElementById('hero-cta');
  if(cta) cta.innerHTML=u
    ?`<button class="btn-p" onclick="nav('library')">Library Browse Karo →</button>`
    :`<button class="btn-p" onclick="nav('register')">Register — Free</button>
      <button class="btn-s" onclick="nav('login')">Login</button>`;
}

function toggleDark(){
  document.body.classList.toggle('dark');
  localStorage.setItem('pdsu-dark',document.body.classList.contains('dark')?'1':'0');
  renderNav();
}

// ═══════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════
async function doLogin(){
  const e=v('li-e'),p=v('li-p'),b=document.getElementById('li-btn');
  if(!e||!p) return toast('Email aur password dono bharein','err');
  b.disabled=1; b.textContent='Login ho raha hai...';
  try{ await window.loginUser(e,p); nav('library'); toast('Welcome back! 👋','ok'); }
  catch{ toast('Galat email ya password!','err'); }
  b.disabled=0; b.textContent='Login Karo →';
}
async function doRegister(){
  const n=v('rg-n'),e=v('rg-e'),p=v('rg-p'),b=document.getElementById('rg-btn');
  if(!e||!p) return toast('Email aur password required','err');
  b.disabled=1; b.textContent='Ban raha hai...';
  try{ await window.regUser(n,e,p); nav('library'); toast('Account ban gaya! 🎉','ok'); }
  catch(er){ toast(er.message||'Error!','err'); }
  b.disabled=0; b.textContent='Account Banao — Free 🎉';
}
async function doLogout(){ await window.logoutUser(); nav('home'); toast('Logout ho gaye'); }

// ═══════════════════════════════════════════
//  ACCESS CHECK
// ═══════════════════════════════════════════
function getSt(bid){
  const purch=window._purchases||[];
  const direct=purch.find(p=>p.bookId===bid);
  if(direct) return direct.status;
  const bk=(window._books||[]).find(b=>b.id===bid);
  if(bk){
    if(purch.find(p=>p.isCombo&&p.stream===bk.stream&&p.semester===bk.semester&&p.status==='approved')) return 'approved';
    if(purch.find(p=>p.isUnitBundle&&p.stream===bk.stream&&p.semester===bk.semester&&p.subject===(bk.subject||bk.title)&&p.status==='approved'&&(p.unitBookIds||[]).includes(bid))) return 'approved';
    if(purch.find(p=>p.isUnitBundle&&p.stream===bk.stream&&p.semester===bk.semester&&p.subject===(bk.subject||bk.title)&&p.status==='pending')) return 'pending';
    if(purch.find(p=>p.isUnitBundle&&p.stream===bk.stream&&p.semester===bk.semester&&p.subject===(bk.subject||bk.title)&&p.status==='rejected')) return 'rejected';
  }
  return null;
}
function isComboOwned(stream,sem){ return (window._purchases||[]).some(p=>p.bookId==='COMBO_'+stream+'_'+sem&&p.status==='approved'); }
function isComboPending(stream,sem){ return (window._purchases||[]).some(p=>p.bookId==='COMBO_'+stream+'_'+sem&&p.status==='pending'); }

// ═══════════════════════════════════════════
//  LIBRARY
// ═══════════════════════════════════════════
function renderLib(){
  renderBC(); renderCatTabs();
  if(_cat==='YT')         renderYT();
  else if(_cat==='OTHER') renderOther();
  else if(!_ss)           showStreams();
  else if(!_sem)          showSems();
  else if(!_selSubject)   showSubjects();
  else                    showUnitPanel();
}

function renderCatTabs(){
  const tabs=document.getElementById('cat-tabs');
  tabs.style.display='flex';
  tabs.innerHTML=[
    {id:'UG',label:'🎓 UG Courses',cls:'ug'},
    {id:'PG',label:'🏆 PG Courses',cls:'pg'},
    {id:'OTHER',label:'🎯 Other Exams',cls:'other'},
    {id:'YT',label:'▶️ YT Classes',cls:'yt'},
  ].map(c=>`<button class="cat-pill ${c.cls} ${_cat===c.id?'active':''}" onclick="selCat('${c.id}')">${c.label}</button>`).join('');
}

function selCat(id){ _cat=id; _ss=null; _sem=null; _selSubject=null; hideAllPanels(); renderLib(); }

function hideAllPanels(){
  ['pan-stream','pan-sem','pan-subjects','pan-units','pan-books','pan-yt','pan-other'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){ el.style.display='none'; el.innerHTML=''; }
  });
}

function renderBC(){
  const bc=document.getElementById('bc');
  let h=`<span class="bci" onclick="goHome()">🏠 Home</span>`;
  if(_cat==='UG'||_cat==='PG'){
    const streams=_cat==='PG'?PG_STREAMS:UG_STREAMS;
    h+=`<span class="bcs">›</span><span class="bci ${!_ss?'act':''}" onclick="selCat('${_cat}')">${_cat} Courses</span>`;
    if(_ss){
      const s=streams.find(x=>x.id===_ss);
      h+=`<span class="bcs">›</span><span class="bci ${!_sem?'act':''}" onclick="goStream()">${s?s.emoji:''} ${s?s.name:_ss}</span>`;
    }
    if(_sem) h+=`<span class="bcs">›</span><span class="bci ${!_selSubject?'act':''}" onclick="goSem()">${_sem}</span>`;
    if(_selSubject) h+=`<span class="bcs">›</span><span class="bci act">${esc(_selSubject)}</span>`;
  } else if(_cat==='OTHER'){
    h+=`<span class="bcs">›</span><span class="bci act">Other Exams</span>`;
  } else if(_cat==='YT'){
    h+=`<span class="bcs">›</span><span class="bci act">YT Classes</span>`;
  }
  bc.innerHTML=h;
}

function goHome(){ _ss=null; _sem=null; _selSubject=null; _cat='UG'; hideAllPanels(); renderLib(); }
function goStream(){ _sem=null; _selSubject=null; hideAllPanels(); renderLib(); }
function goSem(){ _selSubject=null; hideAllPanels(); renderLib(); }

function showStreams(){
  const streams=_cat==='PG'?PG_STREAMS:UG_STREAMS;
  setHd(`📚 ${_cat} Library`,`Apni stream choose karo`);
  hideAllPanels(); show('pan-stream');
  const bks=window._books||[];
  document.getElementById('pan-stream').innerHTML=`<div class="sg">${streams.map(s=>{
    const cnt=bks.filter(b=>b.stream===s.id&&(b.category===_cat||(!b.category&&_cat==='UG'))).length;
    const isPG=_cat==='PG';
    return `<div class="sc ${isPG?'pg-card':''}" onclick="selStream('${s.id}')">
      <span class="sc-e">${s.emoji}</span><span class="sc-n">${s.name}</span>
      <span class="sc-c">${s.full}</span>
      <span class="sc-c" style="margin-top:.25rem;font-weight:700;color:${isPG?'var(--pu)':'var(--sf)'}">${cnt} materials</span>
    </div>`;
  }).join('')}</div>`;
}
function selStream(id){ _ss=id; _sem=null; _selSubject=null; hideAllPanels(); renderLib(); }

function showSems(){
  const streams=_cat==='PG'?PG_STREAMS:UG_STREAMS;
  const s=streams.find(x=>x.id===_ss);
  setHd(`${s?s.emoji:''} ${s?s.name:_ss}`,`Semester choose karo`);
  hideAllPanels(); show('pan-sem');
  const bks=window._books||[];
  document.getElementById('pan-sem').innerHTML=`
    <p style="color:var(--gy);font-size:.84rem;margin-bottom:1rem;font-weight:500">Konsa semester hai tumhara?</p>
    <div class="sem-row">${SEMS.map(sem=>{
      const cnt=bks.filter(b=>b.stream===_ss&&b.semester===sem).length;
      const has=cnt>0;
      return `<button class="sp ${has?'act':'empty-sem'}" onclick="${has?`selSem('${sem}')`:''}">
        ${sem} ${has?`<span style="font-size:.63rem;opacity:.75">(${cnt})</span>`:`<span style="font-size:.62rem;opacity:.4">—</span>`}
      </button>`;
    }).join('')}</div>`;
}
function selSem(sem){ _sem=sem; _selSubject=null; hideAllPanels(); renderLib(); }

function showSubjects(){
  const streams=_cat==='PG'?PG_STREAMS:UG_STREAMS;
  const s=streams.find(x=>x.id===_ss);
  setHd(`${s?s.emoji:''} ${s?s.name:_ss} — ${_sem}`,`Subject choose karo`);
  hideAllPanels();
  const bks=(window._books||[]).filter(b=>b.stream===_ss&&b.semester===_sem);
  const combo=(window._combos||[]).find(c=>c.stream===_ss&&c.semester===_sem&&c.active!==false);
  const comboOwned=isComboOwned(_ss,_sem);
  const comboPending=isComboPending(_ss,_sem);
  const totalPrice=bks.filter(b=>Number(b.price)>0).reduce((a,b)=>a+Number(b.price||0),0);
  const subjects={};
  bks.forEach(b=>{ const subj=b.subject||b.title; if(!subjects[subj]) subjects[subj]={name:subj,books:[]}; subjects[subj].books.push(b); });
  if(!Object.keys(subjects).length){
    document.getElementById('pan-subjects').innerHTML=`<div class="empty"><div class="em">📭</div><p>Is semester mein abhi koi material nahi hai.</p></div>`;
    show('pan-subjects'); return;
  }
  const savings=combo?totalPrice-combo.price:0;
  let comboBannerHtml='';
  if(combo){
    comboBannerHtml=`<div class="combo-banner" style="margin-bottom:1.5rem">
      <div class="combo-info">
        <div class="combo-tag">⚡ Best Value — Semester Bundle</div>
        <div class="combo-title">${s?s.emoji:''} ${s?s.name:_ss} ${_sem} — Complete Bundle</div>
        <div class="combo-desc">Is semester ke sabhi subjects ek saath lo — ${savings>0?`₹${savings} sasta!`:''}</div>
      </div>
      <div class="combo-right">
        ${savings>0?`<div class="combo-price-old">₹${totalPrice} alag-alag</div>`:''}
        <div class="combo-price">₹${combo.price}</div>
        ${savings>0?`<div class="combo-save">💰 ₹${savings} bachao!</div>`:''}
        ${comboOwned?`<button class="btn-combo btn-combo-owned" onclick="nav('my-books')">✅ Unlocked</button>`
          :comboPending?`<button class="btn-combo" style="background:var(--gd);cursor:not-allowed" disabled>⏳ Verifying...</button>`
          :window._cur?`<button class="btn-combo" onclick="openComboPay('${_ss}','${_sem}')">🛒 Combo Buy — ₹${combo.price}</button>`
          :`<button class="btn-combo" onclick="nav('login')">Login to Buy</button>`}
      </div>
    </div>`;
  }
  const subjCards=Object.values(subjects).map(subj=>{
    const ci=Math.abs([...subj.name].reduce((a,c)=>a+c.charCodeAt(0),0))%5;
    const units=subj.books.filter(b=>b.unitNumber&&b.unitNumber!=='All');
    const prices=subj.books.map(b=>Number(b.price||0)).filter(p=>p>0);
    const minP=prices.length?Math.min(...prices):0;
    const maxP=prices.length?Math.max(...prices):0;
    const hasVideo=subj.books.some(b=>b.youtubeUrl);
    return `<div class="subj-card" onclick="openSubject('${esc(subj.name)}')">
      <div class="subj-cov" style="background:linear-gradient(135deg,${GRADIENTS[ci]})">${EMOJIS[ci]}</div>
      <div class="subj-bd">
        <div class="subj-name">${esc(subj.name)}${hasVideo?`<span class="subj-yt-badge">▶ Video</span>`:''}</div>
        <div class="subj-meta">${subj.books.length} materials • ${units.length} units</div>
        <div class="subj-ft">
          <div class="subj-units-count">${units.length>0?'Units 1–'+Math.min(units.length,4):'Full Material'}</div>
          <div class="subj-price-range">${prices.length?`₹${minP===maxP?minP:minP+'–₹'+maxP}`:'<span style="color:var(--gn);font-size:.85rem">FREE</span>'}</div>
        </div>
      </div>
    </div>`;
  }).join('');
  document.getElementById('pan-subjects').innerHTML=comboBannerHtml+`<div class="subj-grid">${subjCards}</div>`;
  show('pan-subjects');
}
function openSubject(name){ _selSubject=name; hideAllPanels(); renderLib(); }

// ═══════════════════════════════════════════
//  UNIT PANEL
// ═══════════════════════════════════════════
function showUnitPanel(){
  setHd(`📐 ${esc(_selSubject)}`,`Units aur class videos`);
  hideAllPanels();
  const allBooks=(window._books||[]).filter(b=>b.stream===_ss&&b.semester===_sem&&(b.subject||b.title)===_selSubject);
  allBooks.sort((a,b)=>({1:1,2:2,3:3,4:4,'All':5,'all':5}[a.unitNumber]||99)-({1:1,2:2,3:3,4:4,'All':5,'all':5}[b.unitNumber]||99));
  const unitBooks=allBooks.filter(b=>b.unitNumber&&String(b.unitNumber)!=='All'&&String(b.unitNumber)!=='all');
  const bundleIndivTotal=unitBooks.filter(b=>Number(b.price)>0).reduce((a,b)=>a+Number(b.price||0),0);
  const bundlePrice=bundleIndivTotal>0?Math.max(bundleIndivTotal-5,unitBooks.length*5):0;
  const bundleOwned=unitBooks.every(b=>getSt(b.id)==='approved')||(window._purchases||[]).some(p=>p.isUnitBundle&&p.subject===_selSubject&&p.stream===_ss&&p.semester===_sem&&p.status==='approved');
  const bundlePending=(window._purchases||[]).some(p=>p.isUnitBundle&&p.subject===_selSubject&&p.stream===_ss&&p.semester===_sem&&p.status==='pending');
  let bundleBarHtml='';
  if(unitBooks.length>1&&bundleIndivTotal>0){
    bundleBarHtml=`<div class="unit-bundle-bar">
      <div class="unit-bundle-info">
        <div class="unit-bundle-tag">💡 Best Deal — All Units Bundle</div>
        <div class="unit-bundle-title">${esc(_selSubject)} — Saari Units (1 to ${unitBooks.length})</div>
      </div>
      <div class="unit-bundle-price">
        <div class="unit-bundle-old">₹${bundleIndivTotal} alag-alag</div>
        <div class="unit-bundle-new">₹${bundlePrice}</div>
        <div class="unit-bundle-save">💰 ₹5 discount!</div>
      </div>
      ${bundleOwned?`<button class="btn-bundle" style="background:var(--gn)" onclick="nav('my-books')">✅ Unlocked</button>`
        :bundlePending?`<button class="btn-bundle" style="background:var(--gd);cursor:not-allowed" disabled>⏳ Verifying</button>`
        :window._cur?`<button class="btn-bundle" onclick="buyUnitBundle()">🛒 Bundle Buy — ₹${bundlePrice}</button>`
        :`<button class="btn-bundle" onclick="nav('login')">Login to Buy</button>`}
    </div>`;
  }
  const unitCardsHtml=allBooks.map(bk=>{
    const st=getSt(bk.id);
    const uKey=String(bk.unitNumber||'All');
    const bCls=UNIT_BADGE_CLASS[uKey]||'uA';
    const label=UNIT_LABELS[uKey]||`Unit ${uKey}`;
    const hasYT=!!bk.youtubeUrl;
    const hasPDF=!!(bk.content||bk.driveUrl)&&bk.contentType!=='none';
    const isRej=st==='rejected';
    const ytBtn=hasYT?`<a href="${esc(bk.youtubeUrl)}" target="_blank" rel="noopener" style="text-decoration:none"><button class="btn-yt-watch">▶ Watch Class Free</button></a>`:'';
    let pdfBtn='';
    if(hasPDF){
      if(st==='approved') pdfBtn=`<button class="btn-unit-open" onclick="openBook('${bk.id}')">📄 Open PDF →</button>`;
      else if(st==='pending') pdfBtn=`<button class="btn-unit-pend" disabled>⏳ Verifying...</button>`;
      else if(isRej) pdfBtn=`<button class="btn-unit-rej" onclick="openPay('${bk.id}')">❌ Retry Payment</button>`;
      else if(window._cur) pdfBtn=`<button class="btn-unit-buy" onclick="openPay('${bk.id}')">🔒 Buy PDF to Unlock</button>`;
      else pdfBtn=`<button class="btn-unit-buy" onclick="nav('login')">Login to Buy PDF</button>`;
    }
    return `<div class="unit-card ${isRej?'rej-card':''}">
      <div class="unit-badge ${bCls}">${uKey==='All'||uKey==='all'?'All':uKey}</div>
      <div class="unit-info">
        <div class="unit-name">${label} — ${esc(bk.subject||bk.title)}</div>
        <div class="unit-sub">${esc(bk.category||'')}${hasYT?` <span class="yt-free-chip">▶ Video FREE</span>`:''}${hasPDF?' • PDF Premium':''}</div>
        ${isRej?`<div class="unit-rej-notice">❌ Payment reject ho gaya — UTR verify nahi hua. Sahi UTR se dobara try karo.</div>`:''}
      </div>
      <div class="unit-right">
        ${hasPDF&&!isRej&&st!=='approved'?`<div class="unit-price">₹${bk.price}</div>`:''}
        ${ytBtn}${pdfBtn}
      </div>
    </div>`;
  }).join('');
  document.getElementById('pan-units').innerHTML=`<div class="unit-panel">
    <div class="unit-panel-hd">
      <div class="unit-panel-tt">📐 ${esc(_selSubject)}</div>
      <button class="unit-close" onclick="goSem();_selSubject=null;hideAllPanels();renderLib();">← Subjects</button>
    </div>
    ${bundleBarHtml}
    <div class="unit-list">${unitCardsHtml||'<div class="empty"><p>Is subject mein koi unit nahi hai abhi.</p></div>'}</div>
  </div>`;
  show('pan-units');
}

function buyUnitBundle(){
  if(!window._cur) return nav('login');
  const unitBooks=(window._books||[]).filter(b=>b.stream===_ss&&b.semester===_sem&&(b.subject||b.title)===_selSubject&&b.unitNumber&&String(b.unitNumber)!=='All'&&String(b.unitNumber)!=='all');
  const total=unitBooks.filter(b=>Number(b.price)>0).reduce((a,b)=>a+Number(b.price||0),0);
  const bundlePrice=Math.max(total-5,unitBooks.length*5);
  _selBook={id:'BUNDLE_'+_ss+'_'+_sem+'_'+_selSubject.replace(/\s/g,'_'),title:`${_selSubject} — All Units Bundle`,price:bundlePrice,isUnitBundle:true,stream:_ss,semester:_sem,subject:_selSubject,unitBookIds:unitBooks.map(b=>b.id)};
  _appliedCoupon=null; _finalPrice=bundlePrice; _screenshotFile=null; _screenshotUrl=null;
  showPayModal();
}

// ═══════════════════════════════════════════
//  YT CLASSES
// ═══════════════════════════════════════════
function renderYT(){
  setHd('▶️ YT Classes','YouTube classes — FREE watch karo, PDF purchase karo');
  hideAllPanels();
  const bks=(window._books||[]).filter(b=>b.category==='YT');
  const yt=document.getElementById('pan-yt');
  yt.style.display='block';
  if(!bks.length){ yt.innerHTML=`<div class="empty"><div class="em">📺</div><p>Abhi koi YT class material nahi hai.</p></div>`; return; }
  yt.innerHTML=`<div class="yt-section-hd"><div class="yt-logo">▶</div><div><div class="yt-title">YouTube Classes Material</div><div class="yt-sub">▶ Watch class FREE — 📄 PDF unlock for premium notes</div></div></div>
  <div class="yt-grid">${bks.map(bk=>{
    const st=getSt(bk.id);
    const ci=Math.abs([...bk.id].reduce((a,c)=>a+c.charCodeAt(0),0))%5;
    const hasYT=!!bk.youtubeUrl;
    const hasPDF=!!(bk.content||bk.driveUrl)&&bk.contentType!=='none';
    const isRej=st==='rejected';
    const ytBtn=hasYT?`<a href="${esc(bk.youtubeUrl)}" target="_blank" rel="noopener" style="text-decoration:none;flex:1"><button class="btn-bk bb-yt" style="width:100%;justify-content:center">▶ Watch Free</button></a>`:'';
    let pdfBtn='';
    if(hasPDF){
      if(st==='approved') pdfBtn=`<button class="btn-bk bb-open" onclick="openBook('${bk.id}')">📄 Open PDF</button>`;
      else if(st==='pending') pdfBtn=`<button class="btn-bk bb-wait" disabled>⏳ Verifying</button>`;
      else if(isRej) pdfBtn=`<button class="btn-bk bb-rej" onclick="openPay('${bk.id}')">❌ Retry</button>`;
      else if(window._cur) pdfBtn=`<button class="btn-bk bb-buy" onclick="openPay('${bk.id}')">🔒 Buy PDF</button>`;
      else pdfBtn=`<button class="btn-bk bb-buy" onclick="nav('login')">Login</button>`;
    }
    return `<div class="yt-card">
      <div class="yt-thumb" style="background:linear-gradient(135deg,#1A0000,#CC0000)">${EMOJIS[ci]}<div class="yt-play">▶</div>
        ${st==='approved'?`<div class="bk-tag t-own" style="position:absolute;top:.5rem;right:.5rem">✓ PDF</div>`:''}
        ${st==='pending'?`<div class="bk-tag t-pen" style="position:absolute;top:.5rem;right:.5rem">⏳</div>`:''}
        ${isRej?`<div class="bk-tag t-rej" style="position:absolute;top:.5rem;right:.5rem">❌</div>`:''}
      </div>
      <div class="yt-bd">
        <div class="yt-name">${esc(bk.title)}</div>
        <div class="yt-meta">${bk.subject?esc(bk.subject):''}${hasPDF?' • PDF Available':' • Video Only'}</div>
        <div class="yt-ft">${hasPDF?`<div class="yt-price">₹${bk.price}</div>`:`<div class="free-badge">🆓 FREE</div>`}</div>
        <div class="yt-ft-row" style="margin-top:.6rem;gap:.5rem;display:flex;flex-wrap:wrap">${ytBtn}${pdfBtn}</div>
        ${isRej?`<div style="font-size:.68rem;color:var(--rd);font-weight:700;margin-top:.4rem">❌ Payment rejected — dobara try karo</div>`:''}
      </div>
    </div>`;
  }).join('')}</div>`;
}

// ═══════════════════════════════════════════
//  OTHER EXAMS
// ═══════════════════════════════════════════
function renderOther(){
  setHd('🎯 Other Exams','Competitive exams ke liye direct material');
  hideAllPanels();
  const bks=(window._books||[]).filter(b=>b.category==='OTHER');
  const oth=document.getElementById('pan-other');
  oth.style.display='block';
  if(!bks.length){ oth.innerHTML=`<div class="empty"><div class="em">🎯</div><p>Abhi koi Other Exam material nahi hai.</p></div>`; return; }
  oth.innerHTML=`<div class="other-grid">${bks.map(bk=>{
    const st=getSt(bk.id);
    const ci=Math.abs([...bk.id].reduce((a,c)=>a+c.charCodeAt(0),0))%5;
    const hasYT=!!bk.youtubeUrl;
    const hasPDF=!!(bk.content||bk.driveUrl)&&bk.contentType!=='none';
    const isRej=st==='rejected';
    const ytBtn=hasYT?`<a href="${esc(bk.youtubeUrl)}" target="_blank" rel="noopener" style="text-decoration:none;flex:1"><button class="btn-bk bb-yt" style="width:100%;justify-content:center">▶ Watch Free</button></a>`:'';
    let pdfBtn='';
    if(hasPDF){
      if(st==='approved') pdfBtn=`<button class="btn-bk bb-open" style="flex:1" onclick="openBook('${bk.id}')">📄 Open PDF</button>`;
      else if(st==='pending') pdfBtn=`<button class="btn-bk bb-wait" style="flex:1" disabled>⏳ Verifying</button>`;
      else if(isRej) pdfBtn=`<button class="btn-bk bb-rej" style="flex:1" onclick="openPay('${bk.id}')">❌ Retry</button>`;
      else if(window._cur) pdfBtn=`<button class="btn-bk bb-buy" style="flex:1" onclick="openPay('${bk.id}')">🔒 Buy PDF</button>`;
      else pdfBtn=`<button class="btn-bk bb-buy" style="flex:1" onclick="nav('login')">Login</button>`;
    }
    return `<div class="other-card">
      <div class="other-cov" style="background:linear-gradient(135deg,var(--te-l),#B0E8F0);position:relative">${EMOJIS[ci]}
        ${st==='approved'?`<div class="bk-tag t-own" style="position:absolute;top:.5rem;right:.5rem">✓</div>`:''}
        ${isRej?`<div class="bk-tag t-rej" style="position:absolute;top:.5rem;right:.5rem">❌</div>`:''}
      </div>
      <div class="other-bd">
        <div class="other-name">${esc(bk.title)}</div>
        <div class="other-meta">${bk.subject?esc(bk.subject):''}${hasPDF?' • PDF Premium':' • Free'}</div>
        <div class="other-ft">${hasPDF?`<div class="other-price">₹${bk.price}</div>`:`<div class="free-badge">🆓 FREE</div>`}</div>
        <div style="display:flex;gap:.5rem;margin-top:.6rem;flex-wrap:wrap">${ytBtn}${pdfBtn}</div>
        ${isRej?`<div style="font-size:.68rem;color:var(--rd);font-weight:700;margin-top:.4rem">❌ Payment rejected — dobara try karo</div>`:''}
      </div>
    </div>`;
  }).join('')}</div>`;
}

// ═══════════════════════════════════════════
//  PAYMENT FLOW
// ═══════════════════════════════════════════
function openPay(bid){
  if(!window._cur) return nav('login');
  _selBook=(window._books||[]).find(b=>b.id===bid);
  if(!_selBook) return;
  _appliedCoupon=null; _finalPrice=Number(_selBook.price); _screenshotFile=null; _screenshotUrl=null;
  showPayModal();
}
function openComboPay(stream,sem){
  if(!window._cur) return nav('login');
  const combo=(window._combos||[]).find(c=>c.stream===stream&&c.semester===sem&&c.active!==false);
  if(!combo) return toast('Combo available nahi hai','err');
  const bks=(window._books||[]).filter(b=>b.stream===stream&&b.semester===sem);
  const streams=_cat==='PG'?PG_STREAMS:UG_STREAMS;
  const s=streams.find(x=>x.id===stream);
  _selBook={id:'COMBO_'+stream+'_'+sem,title:`${s?s.name:stream} ${sem} — Complete Bundle`,price:combo.price,isCombo:true,stream,semester:sem,bookIds:bks.map(b=>b.id)};
  _appliedCoupon=null; _finalPrice=Number(combo.price); _screenshotFile=null; _screenshotUrl=null;
  showPayModal();
}

function showPayModal(){
  const price=_selBook.price;
  const mobile=isMobile();
  const upiLink=`upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=GIRIRAJ%20PAREEK&am=${price}&cu=INR&tn=${encodeURIComponent(_selBook.title.substring(0,30))}`;
  const qr=`https://api.qrserver.com/v1/create-qr-code/?size=155x155&data=upi://pay?pa=${UPI_ID}%26pn=GIRIRAJ%20PAREEK%26am=${price}%26cu=INR`;
  const payNowHtml=mobile
    ?`<a href="${esc(upiLink)}" id="pay-now-link" style="display:block;text-decoration:none"><button class="pay-now-btn pay-now-mobile" onclick="onMobilePayTap()"><span>📱</span><div><div>Pay Now — ₹${price}</div><div class="pay-now-label">UPI App mein open hoga</div></div></button></a>`
    :`<div class="ss-section"><span class="ss-label">📸 Payment Screenshot Upload Karo (Optional)</span>
      <div class="ss-dz" id="ss-dz" onclick="document.getElementById('ss-fi').click()">
        <input type="file" id="ss-fi" accept="image/*" style="display:none;position:absolute;inset:0;opacity:0;cursor:pointer" onchange="handleSSFile(this)">
        <div style="font-size:1.5rem;margin-bottom:.3rem">🖼️</div>
        <div class="ss-dz-txt">Screenshot yahan drop karo ya click karo</div>
        <div class="ss-dz-sub">JPG, PNG • Max 5MB</div>
      </div>
      <div id="ss-preview" style="display:none;padding:.55rem .75rem;background:var(--gn-l);border:1.5px solid #7EC8A0;border-radius:10px;font-size:.78rem;font-weight:600;color:var(--gn);margin-top:.5rem">✅ <span id="ss-fn"></span></div>
      <div id="ss-progress" style="display:none;margin-top:.5rem"><div class="ss-prog-bar"><div class="ss-prog-fill" id="ss-prog-fill"></div></div></div>
    </div>`;
  let extraInfoHtml='';
  if(_selBook.isUnitBundle){
    extraInfoHtml=`<div style="background:var(--gn-l);border-radius:10px;padding:.65rem .9rem;margin-bottom:.75rem;text-align:left"><p style="font-size:.72rem;font-weight:700;color:var(--gn);margin-bottom:.2rem">📐 Unit Bundle (${(_selBook.unitBookIds||[]).length} units)</p><p style="font-size:.7rem;color:var(--ink-m)">Saari units ek saath unlock hongi approval ke baad.</p></div>`;
  }
  const m=document.getElementById('pay-modal');
  m.style.display='flex'; m.className='mov';
  m.innerHTML=`<div class="mo">
    <h3>${_selBook.isCombo?'📦 Combo Payment':_selBook.isUnitBundle?'📐 Bundle Payment':'💳 Secure Payment'}</h3>
    <p class="mo-sub" id="mo-price-sub">₹${price} • "${esc(_selBook.title)}"</p>
    ${extraInfoHtml}
    ${mobile
      ?`${payNowHtml}<div style="display:flex;align-items:center;gap:.6rem;margin:.3rem 0 .7rem"><div style="flex:1;height:1px;background:var(--cr-d)"></div><span style="font-size:.65rem;color:var(--gy);font-weight:700;letter-spacing:1px">YA QR SCAN KARO</span><div style="flex:1;height:1px;background:var(--cr-d)"></div></div><div class="qr-box"><img src="${qr}" alt="QR" onerror="this.style.display='none'"></div><div class="upi-l">${UPI_ID}</div>`
      :`<div class="qr-box"><img src="${qr}" alt="QR" onerror="this.style.display='none'"></div><div class="upi-l">GIRIRAJ PAREEK • IPPB • ${UPI_ID}</div>${payNowHtml}`
    }
    <div class="coup-row"><input class="coup-in" id="coup-i" type="text" maxlength="20" placeholder="COUPON CODE (optional)"><button class="coup-apply" onclick="applyCoupon()">Apply</button></div>
    <div class="coup-status" id="coup-status"></div>
    <div id="price-display" style="margin-bottom:.65rem"></div>
    <span class="utr-lb">UPI Transaction UTR Number dalo (12 digits)</span>
    <div class="utr-wrap">
      <input class="utr-in" id="utr-i" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="12" placeholder="000000000000" autocomplete="off" oninput="onUTRInput(this)" onpaste="onUTRPaste(event)">
      <span class="utr-counter" id="utr-counter">0/12</span>
    </div>
    <div class="utr-alert" id="utr-alert">⚠️ <span id="utr-alert-msg">Yeh UTR pehle se use ho chuka hai.</span></div>
    <p class="utr-hint">📌 Sirf 12 numeric digits — UPI app mein "Transaction ID" ya "UTR" ke naam se milega</p>
    <div class="m-acts">
      <button class="btn-mc" onclick="closePay()">Cancel</button>
      <button class="btn-mp" id="pay-btn" onclick="doPay()" disabled>✓ Submit Payment</button>
    </div>
    <div class="mo-tg-line"><span>❓ Koi problem?</span><a href="${TG_HANDLE}" target="_blank" rel="noopener">📱 @PdusuLibraryHelpline</a></div>
  </div>`;
  if(!mobile){
    const dz=document.getElementById('ss-dz');
    if(dz){
      dz.addEventListener('dragover',e=>{e.preventDefault();dz.style.borderColor='var(--sf)';});
      dz.addEventListener('dragleave',()=>{dz.style.borderColor='';});
      dz.addEventListener('drop',e=>{e.preventDefault();dz.style.borderColor='';const f=e.dataTransfer.files[0];if(f)handleSSFileDirect(f);});
    }
  }
}

// ═══════════════════════════════════════════
//  UTR INPUT — strict 12 numeric digits
// ═══════════════════════════════════════════
function onUTRInput(inp){
  const clean=inp.value.replace(/[^0-9]/g,'').substring(0,12);
  inp.value=clean;
  const len=clean.length;
  const counter=document.getElementById('utr-counter');
  if(counter){ counter.textContent=`${len}/12`; counter.className='utr-counter'+(len===12?' full':len>12?' over':''); }
  inp.classList.remove('valid-utr','invalid-utr');
  hideUTRAlert();
  updatePayBtn();
}
function onUTRPaste(e){
  e.preventDefault();
  const pasted=(e.clipboardData||window.clipboardData).getData('text');
  const clean=pasted.replace(/[^0-9]/g,'').substring(0,12);
  const inp=document.getElementById('utr-i');
  if(inp){ inp.value=clean; onUTRInput(inp); }
}
function updatePayBtn(){
  const b=document.getElementById('pay-btn');
  if(!b) return;
  b.disabled=((document.getElementById('utr-i')?.value||'').length!==12);
}
function showUTRAlert(msg){
  const al=document.getElementById('utr-alert');
  const ms=document.getElementById('utr-alert-msg');
  if(al) al.className='utr-alert show';
  if(ms) ms.textContent=msg||'Yeh UTR pehle se use ho chuka hai.';
  const inp=document.getElementById('utr-i');
  if(inp) inp.classList.add('invalid-utr');
}
function hideUTRAlert(){
  const al=document.getElementById('utr-alert');
  if(al) al.className='utr-alert';
  const inp=document.getElementById('utr-i');
  if(inp) inp.classList.remove('invalid-utr');
}
function onMobilePayTap(){
  setTimeout(()=>{ const u=document.getElementById('utr-i'); if(u){ u.focus(); toast('UPI app mein payment karo → wapas aao → UTR dalo 👆','ok'); } },1500);
}
function handleSSFile(inp){ if(inp.files?.[0]) handleSSFileDirect(inp.files[0]); }
function handleSSFileDirect(f){
  if(!f.type.startsWith('image/')) return toast('Sirf image files allowed!','err');
  if(f.size>5*1024*1024) return toast('Screenshot 5MB se badi hai!','err');
  _screenshotFile=f;
  const prev=document.getElementById('ss-preview');
  const fn=document.getElementById('ss-fn');
  if(prev) prev.style.display='flex';
  if(fn) fn.textContent=f.name+' ('+(f.size/1024).toFixed(0)+' KB)';
}
function closePay(){ document.getElementById('pay-modal').style.display='none'; _screenshotFile=null; _screenshotUrl=null; }

async function doPay(){
  const utr=(document.getElementById('utr-i')?.value||'').trim();
  if(!/^\d{12}$/.test(utr)){ showUTRAlert('UTR exactly 12 numeric digits hona chahiye.'); document.getElementById('utr-i')?.focus(); return; }
  const b=document.getElementById('pay-btn');
  b.disabled=true; b.textContent='Check ho raha hai...'; hideUTRAlert();
  try{
    const utrUsed=await window.checkUTRExists(utr);
    if(utrUsed){ showUTRAlert('Yeh UTR number pehle se use ho chuka hai. Apna sahi UTR dalo.'); document.getElementById('utr-i').classList.add('invalid-utr'); b.disabled=false; b.textContent='✓ Submit Payment'; return; }
    let screenshotUrl=null;
    if(_screenshotFile&&window.uploadScreenshot){
      try{
        const fill=document.getElementById('ss-prog-fill');
        const prog=document.getElementById('ss-progress');
        if(prog) prog.style.display='block';
        b.textContent='Screenshot upload ho rahi hai...';
        screenshotUrl=await window.uploadScreenshot(_screenshotFile,p=>{if(fill)fill.style.width=p+'%';});
        _screenshotUrl=screenshotUrl;
      }catch(ssErr){ console.warn('Screenshot upload failed:',ssErr); }
    }
    b.textContent='Saving...';
    const payAmt=(_finalPrice>0?_finalPrice:Number(_selBook.price));
    if(_selBook.isCombo) await window.submitComboPurchase(_selBook.stream,_selBook.semester,_selBook.bookIds,payAmt,utr,screenshotUrl);
    else if(_selBook.isUnitBundle) await window.submitPayment(_selBook.id,_selBook.title,payAmt,utr,screenshotUrl,{isUnitBundle:true,stream:_selBook.stream,semester:_selBook.semester,subject:_selBook.subject,unitBookIds:_selBook.unitBookIds});
    else await window.submitPayment(_selBook.id,_selBook.title,payAmt,utr,screenshotUrl);
    if(_appliedCoupon) await window.useCoupon(_appliedCoupon.id).catch(e=>console.warn('useCoupon:',e));
    closePay(); toast('🎉 Payment submit! 1-2 ghante mein verify hoga.','ok'); hideAllPanels(); renderLib();
  }catch(err){
    const msg=err?.code==='permission-denied'?'Permission denied — dobara login karo.':err?.message||'Network error. Check internet.';
    toast('❌ '+msg,'err'); b.disabled=false; b.textContent='✓ Submit Payment';
  }
}

async function applyCoupon(){
  const code=(document.getElementById('coup-i')?.value||'').trim().toUpperCase();
  const st=document.getElementById('coup-status');
  const inp=document.getElementById('coup-i');
  if(!code){ st.className='coup-status err'; st.textContent='⚠️ Coupon code likho pehle'; return; }
  st.className='coup-status'; st.textContent='Checking...'; st.style.display='block';
  try{
    const cp=await window.validateCoupon(code);
    if(!cp){ inp.className='coup-in invalid'; st.className='coup-status err'; st.textContent='❌ Invalid ya expired coupon!'; _appliedCoupon=null; _finalPrice=Number(_selBook.price); document.getElementById('price-display').innerHTML=''; return; }
    _appliedCoupon=cp;
    const orig=Number(_selBook.price);
    let disc=cp.discountType==='percent'?Math.round(orig*cp.discountValue/100):Number(cp.discountValue);
    disc=Math.min(disc,orig-1); _finalPrice=orig-disc;
    inp.className='coup-in valid'; st.className='coup-status ok';
    st.textContent=cp.discountType==='percent'?`🎉 "${cp.code}" applied! ${cp.discountValue}% off!`:`🎉 "${cp.code}" applied! ₹${cp.discountValue} off!`;
    document.getElementById('price-display').innerHTML=`
      <div class="disc-line"><span style="font-size:.72rem;color:var(--gy)">Original</span><span class="disc-orig">₹${orig}</span></div>
      <div class="disc-line"><span style="font-size:.72rem;color:var(--gy)">Discount</span><span class="disc-save">- ₹${disc}</span></div>
      <div class="disc-line" style="margin-top:.3rem;padding-top:.4rem;border-top:1px dashed var(--cr-d)"><span style="font-size:.78rem;font-weight:700;color:var(--ink)">Final</span><span class="disc-final">₹${_finalPrice}</span></div>`;
    const qrImg=document.querySelector('.qr-box img');
    if(qrImg) qrImg.src=`https://api.qrserver.com/v1/create-qr-code/?size=155x155&data=upi://pay?pa=${UPI_ID}%26pn=GIRIRAJ%20PAREEK%26am=${_finalPrice}%26cu=INR`;
    const sub=document.getElementById('mo-price-sub');
    if(sub) sub.textContent=`₹${_finalPrice} (discount ke baad)`;
    const payLink=document.getElementById('pay-now-link');
    if(payLink) payLink.href=`upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=GIRIRAJ%20PAREEK&am=${_finalPrice}&cu=INR`;
  }catch(e){ st.className='coup-status err'; st.textContent='⚠️ Check nahi ho saka. Internet check karo.'; }
}

// ═══════════════════════════════════════════
//  MY BOOKS
// ═══════════════════════════════════════════
function renderMyBooks(){
  const purchases=window._purchases||[];
  const approved=purchases.filter(p=>p.status==='approved');
  const rejected=purchases.filter(p=>p.status==='rejected');
  const dismissed=getDismissed();
  const hasDismissed=rejected.some(p=>dismissed.has(String(p.id)));
  const clearBtn=document.getElementById('clear-dismissals-btn');
  if(clearBtn) clearBtn.className='clear-dismissals-btn'+(hasDismissed?' visible':'');
  const approvedIds=new Set(approved.map(p=>p.bookId));
  approved.filter(p=>p.isCombo&&p.bookIds).forEach(p=>p.bookIds.forEach(id=>approvedIds.add(id)));
  approved.filter(p=>p.isUnitBundle&&p.unitBookIds).forEach(p=>p.unitBookIds.forEach(id=>approvedIds.add(id)));
  const ownedCombos=approved.filter(p=>p.isCombo).map(p=>({stream:p.stream,semester:p.semester}));
  const ownedBundles=approved.filter(p=>p.isUnitBundle).map(p=>({stream:p.stream,semester:p.semester,subject:p.subject,count:(p.unitBookIds||[]).length}));
  const bks=(window._books||[]).filter(b=>approvedIds.has(b.id));
  const rejSection=document.getElementById('my-rej-section');
  const visibleRejected=rejected.filter(p=>!dismissed.has(String(p.id)));
  if(visibleRejected.length){
    rejSection.innerHTML=visibleRejected.map(p=>`
      <div class="rej-notice-wrap" id="rej-wrap-${p.id}">
        <div class="rej-notice">
          <div class="rej-notice-icon">❌</div>
          <div class="rej-notice-text">
            <div class="rej-notice-tt">Payment Rejected — "${esc(p.bookTitle)}"</div>
            <div class="rej-notice-sub">UTR <strong>${esc(p.utrNumber)}</strong> verify nahi hua. Sahi UTR use karke dobara payment karo. Help: <a href="${TG_HANDLE}" target="_blank" style="color:var(--rd);font-weight:700">@PdusuLibraryHelpline</a></div>
          </div>
          <button class="rej-dismiss-btn" onclick="dismissNotice('${p.id}')">✕ Dismiss</button>
        </div>
      </div>`).join('');
  } else { rejSection.innerHTML=''; }
  const g=document.getElementById('my-g');
  if(!bks.length&&!ownedCombos.length&&!ownedBundles.length){
    g.innerHTML=`<div class="empty" style="grid-column:1/-1"><div class="em">📭</div><p>Abhi koi book nahi hai.<br>Library se purchase karo!</p><br><button class="btn-p" onclick="nav('library')" style="margin:0 auto;margin-top:.5rem">Library Kholo →</button></div>`;
    return;
  }
  const allStreams=[...UG_STREAMS,...PG_STREAMS];
  g.innerHTML=
    ownedCombos.map(c=>{ const s=allStreams.find(x=>x.id===c.stream); return `<div class="mc" style="border-color:var(--sf);background:var(--sf-l)"><div style="font-size:1.9rem">${s?s.emoji:'📦'}</div><div class="mc-tt" style="color:var(--sf-d)">📦 ${s?s.name:c.stream} ${c.semester} Bundle</div><div class="mc-bg" style="color:var(--sf-d)">✅ Semester Combo</div><button class="btn-bk bb-open" style="width:100%;padding:.65rem" onclick="nav('library')">Browse Books →</button></div>`; }).join('')+
    ownedBundles.map(b=>{ const s=allStreams.find(x=>x.id===b.stream); return `<div class="mc" style="border-color:var(--gn)"><div style="font-size:1.9rem">📐</div><div class="mc-tt">${esc(b.subject)} — All Units</div><div style="font-size:.7rem;color:var(--gy)">${s?s.name:b.stream} • ${b.semester} • ${b.count} units</div><div class="mc-bg">✅ Unit Bundle</div><button class="btn-bk bb-open" style="width:100%;padding:.65rem" onclick="nav('library')">Browse Units →</button></div>`; }).join('')+
    bks.map(b=>{ const s=allStreams.find(x=>x.id===b.stream); return `<div class="mc"><div style="font-size:1.9rem">${s?s.emoji:'📖'}</div><div class="mc-tt">${esc(b.title)}</div><div style="font-size:.7rem;color:var(--gy);font-weight:600">${b.stream||''}${b.semester?' • '+b.semester:''}${b.unitNumber?' • Unit '+b.unitNumber:''}</div><div class="mc-bg">✅ Unlocked</div><button class="btn-bk bb-open" style="width:100%;padding:.65rem" onclick="openBook('${b.id}')">Open PDF →</button></div>`; }).join('');
}

function dismissNotice(orderId){
  dismissOrder(orderId);
  const wrap=document.getElementById('rej-wrap-'+orderId);
  if(wrap){
    wrap.classList.add('dismissing');
    wrap.addEventListener('animationend',()=>{
      wrap.remove();
      const dismissed=getDismissed();
      const hasDismissed=(window._purchases||[]).filter(p=>p.status==='rejected').some(p=>dismissed.has(String(p.id)));
      const clearBtn=document.getElementById('clear-dismissals-btn');
      if(clearBtn) clearBtn.className='clear-dismissals-btn'+(hasDismissed?' visible':'');
    });
  }
  toast('Notice hata diya gaya','ok');
}

// ═══════════════════════════════════════════
//  BOOK VIEWER
// ═══════════════════════════════════════════
function openBook(bid){
  const bk=(window._books||[]).find(b=>b.id===bid);
  if(!bk) return;
  if(getSt(bid)!=='approved'&&!window._cur?.isAdmin) return toast('Access nahi hai! Payment verify karo.','err');
  document.getElementById('vw-tt').textContent=bk.title;
  document.getElementById('vw-wm').textContent=`🔒 Secure Reader • ${window._cur?.email}`;
  const backBtn=document.getElementById('vw-back-btn');
  backBtn.textContent='← Wapas'; backBtn.onclick=()=>nav('my-books');
  const bd=document.getElementById('vw-bd');
  const url=bk.driveUrl||bk.content;
  if(bk.contentType==='drive'||bk.driveUrl){
    let embedUrl=url;
    const match=url?.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if(match) embedUrl=`https://drive.google.com/file/d/${match[1]}/preview`;
    bd.innerHTML=`<iframe src="${esc(embedUrl)}" style="width:100%;height:80vh;border:none;display:block" allow="autoplay" oncontextmenu="return false"></iframe>`;
  } else if(bk.contentType==='pdf'||(url?.startsWith('https://')&&!bk.driveUrl)){
    bd.innerHTML=`<iframe src="${esc(url)}#toolbar=0&navpanes=0" style="width:100%;height:78vh;border:none;display:block" oncontextmenu="return false"></iframe>`;
  } else {
    bd.innerHTML=bk.content||'<p>Content abhi available nahi.</p>';
  }
  nav('viewer');
}

// ═══════════════════════════════════════════
//  ADMIN
// ═══════════════════════════════════════════
function chkAdm(){
  const inp=document.getElementById('adm-p');
  if(inp.value===ADMIN_PASS){
    _admUnlocked=1;
    document.getElementById('adm-gate').style.display='none';
    document.getElementById('adm-dash').style.display='block';
    loadPayments(); toast('Dashboard unlock ✅','ok');
  } else {
    inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake');
    inp.value=''; toast('Galat password!','err');
    setTimeout(()=>inp.classList.remove('shake'),500);
  }
}
function lockAdm(){
  _admUnlocked=0;
  document.getElementById('adm-gate').style.display='block';
  document.getElementById('adm-dash').style.display='none';
  document.getElementById('adm-p').value='';
  toast('Dashboard lock 🔒');
}
function renderAdmin(){
  if(!window._cur?.isAdmin) return nav('home');
  if(!_admUnlocked){ document.getElementById('adm-gate').style.display='block'; document.getElementById('adm-dash').style.display='none'; }
  else loadPayments();
}

async function loadPayments(){
  const lst=document.getElementById('pay-list');
  lst.innerHTML='<p style="color:var(--gy);padding:1rem">Load ho raha hai...</p>';
  try{
    const pays=await window.loadPending();
    if(!pays.length){ lst.innerHTML=`<div class="empty"><div class="em">✅</div><p>Koi pending payment nahi!</p></div>`; return; }
    lst.innerHTML=pays.map(p=>`<div class="pc" id="pc-${p.id}">
      <div style="flex:1;min-width:0">
        <div class="pc-em">${esc(p.userEmail)}</div>
        <div class="pc-bk">${p.isCombo?'📦 ':p.isUnitBundle?'📐 ':''}${esc(p.bookTitle)}</div>
        <div class="pc-ut">UTR: ${esc(p.utrNumber)} • ₹${p.amount}</div>
        ${p.screenshotUrl?`<div class="pc-ss">📸 <a href="${esc(p.screenshotUrl)}" target="_blank" rel="noopener">Screenshot Dekho →</a></div>`:''}
      </div>
      <div class="pc-actions">
        <button class="btn-apr" data-id="${p.id}" data-combo="${!!p.isCombo||!!p.isUnitBundle}" onclick="doApprove(this)">✓ Approve</button>
        <button class="btn-rej" data-id="${p.id}" onclick="doReject(this)">✗ Reject</button>
      </div>
    </div>`).join('');
  }catch(e){ lst.innerHTML='<p style="color:red;padding:1rem">Error! Refresh karo.</p>'; }
}

async function doApprove(btn){
  const id=btn.dataset.id;
  try{
    if(btn.dataset.combo==='true') await window.approveCombo(id);
    else await window.approvePurchase(id);
    document.getElementById('pc-'+id)?.remove(); toast('Payment approve! ✅','ok');
  }catch(e){ toast('Error: '+(e?.message||''),'err'); }
}
async function doReject(btn){
  const id=btn.dataset.id;
  if(!confirm('Reject karna chahte ho?')) return;
  try{ await window.rejectPurchase(id); document.getElementById('pc-'+id)?.remove(); toast('Payment reject kar diya ❌','ok'); }
  catch(e){ toast('Error: '+(e?.message||''),'err'); }
}

function swAT(t){
  document.querySelectorAll('.at').forEach(x=>x.classList.remove('act'));
  document.getElementById('at-'+t).classList.add('act');
  ['adm-pay','adm-up','adm-edit','adm-coup','adm-combo'].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.display='none'; });
  document.getElementById('adm-'+t).style.display='block';
  if(t==='coup') loadCouponList();
  if(t==='combo') renderComboAdmin();
  if(t==='edit') renderEditList();
  if(t==='pay') loadPayments();
}

function onCatChange(){
  const cat=document.getElementById('bk-cat').value;
  document.getElementById('fg-stream').style.display=(cat==='OTHER'||cat==='YT')?'none':'block';
  document.getElementById('fg-sem-row').style.display=(cat==='OTHER'||cat==='YT')?'none':'grid';
}
function togCT(val){ ['pdf','drive','html','none'].forEach(k=>{ document.getElementById('ct-'+k).style.display=val===k?'block':'none'; }); }
function hFS(inp){ if(inp.files?.[0]) setPDF(inp.files[0]); }
function hDrop(e){ e.preventDefault(); document.getElementById('dz').style.borderColor='var(--cr-d)'; if(e.dataTransfer.files?.[0]) setPDF(e.dataTransfer.files[0]); }
function setPDF(f){
  if(!f.name.endsWith('.pdf')) return toast('Sirf PDF!','err');
  if(f.size>10*1024*1024) return toast('File 10MB se badi!','err');
  _pdfFile=f;
  document.getElementById('pdf-fn').textContent=f.name+' ('+(f.size/1024/1024).toFixed(2)+' MB)';
  document.getElementById('pdf-sel').style.display='block';
}

async function doUpload(){
  const tt=v('bk-tt'),cat=v('bk-cat'),st=v('bk-st'),sm=v('bk-sm'),su=v('bk-su'),pr=v('bk-pr'),ca=v('bk-ca'),unit=document.getElementById('bk-unit')?.value;
  const ct=document.querySelector('input[name="ct"]:checked').value;
  const ytUrl=v('bk-yt');
  if(!tt) return toast('Title required','err');
  if(!cat) return toast('Category choose karo','err');
  if(ct!=='none'&&!pr) return toast('Price dalo','err');
  if((cat==='UG'||cat==='PG')&&!st) return toast('Stream choose karo','err');
  const btn=document.getElementById('up-btn');
  btn.disabled=1; btn.textContent='⏳ Upload ho rahi hai...';
  let content='',driveUrl='';
  try{
    if(ct==='pdf'){
      if(!_pdfFile){ toast('PDF select karo','err'); btn.disabled=0; return; }
      document.getElementById('up-prog').style.display='block';
      content=await window.uploadPDF(_pdfFile,p=>{document.getElementById('pp').textContent=p+'%';document.getElementById('pb').style.width=p+'%';});
      document.getElementById('up-prog').style.display='none';
    } else if(ct==='drive'){ driveUrl=v('bk-drive'); if(!driveUrl){ toast('Drive URL dalo','err'); btn.disabled=0; return; } content=driveUrl; }
    else if(ct==='html'){ content=v('bk-co'); if(!content){ toast('Content dalo','err'); btn.disabled=0; return; } }
    await window.uploadBook({title:tt,category:cat,stream:st||null,semester:sm||null,subject:su||null,unitNumber:unit||'All',price:Number(pr||0),contentCategory:ca,content,contentType:ct,driveUrl:driveUrl||null,youtubeUrl:ytUrl||null,createdAt:new Date()});
    toast('✅ Upload ho gaya!','ok');
    ['bk-tt','bk-su','bk-pr','bk-co','bk-drive','bk-yt'].forEach(id=>{ const el=document.getElementById(id);if(el)el.value=''; });
    document.getElementById('bk-cat').value=''; document.getElementById('bk-st').value=''; document.getElementById('bk-sm').value=''; document.getElementById('bk-unit').value='All'; document.getElementById('pdf-sel').style.display='none'; _pdfFile=null;
  }catch(er){ toast('Error: '+(er.message||'Upload fail'),'err'); }
  btn.disabled=0; btn.textContent='📤 Upload Karo';
}

function renderEditList(){
  const search=(document.getElementById('edit-search')?.value||'').toLowerCase();
  const catF=document.getElementById('edit-cat-filter')?.value||'';
  const lst=document.getElementById('edit-book-list');
  let bks=window._books||[];
  if(search) bks=bks.filter(b=>(b.title||'').toLowerCase().includes(search)||(b.subject||'').toLowerCase().includes(search));
  if(catF) bks=bks.filter(b=>b.category===catF||(catF==='UG'&&!b.category));
  if(!bks.length){ lst.innerHTML='<div class="empty"><div class="em">🔍</div><p>Koi book nahi mili.</p></div>'; return; }
  const allStreams=[...UG_STREAMS,...PG_STREAMS];
  lst.innerHTML=bks.map(bk=>{ const s=allStreams.find(x=>x.id===bk.stream); return `<div class="pc" style="flex-wrap:wrap"><div style="flex:1;min-width:200px"><div class="pc-em">${esc(bk.category||'UG')}${s?' • '+s.name:''}${bk.semester?' • '+esc(bk.semester):''}</div><div class="pc-bk">${esc(bk.title)}</div><div style="font-size:.7rem;color:var(--gy);margin-top:.2rem">Unit: ${bk.unitNumber||'All'} • ₹${bk.price} • ${bk.contentType||'pdf'}${bk.youtubeUrl?` • <span style="color:var(--yt)">▶ YT</span>`:''}</div></div><div style="display:flex;gap:.5rem;flex-shrink:0;align-items:center"><button class="btn-apr" style="background:var(--bl)" data-id="${bk.id}" onclick="openEditModal(this.dataset.id)">✏️ Edit</button></div></div>`; }).join('');
}

function openEditModal(bid){
  const bk=(window._books||[]).find(b=>b.id===bid);
  if(!bk) return;
  const m=document.getElementById('edit-modal');
  m.style.display='flex'; m.className='edit-mov';
  m.innerHTML=`<div class="edit-modal-inner">
    <h3>✏️ Edit: ${esc(bk.title.substring(0,40))}</h3>
    <div class="fg"><label>Title</label><input type="text" id="em-tt" value="${esc(bk.title)}"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
      <div class="fg"><label>Price (₹)</label><input type="number" id="em-pr" value="${bk.price}"></div>
      <div class="fg"><label>Unit Number</label><select id="em-unit"><option value="All" ${bk.unitNumber==='All'?'selected':''}>All Units</option><option value="1" ${String(bk.unitNumber)==='1'?'selected':''}>Unit 1</option><option value="2" ${String(bk.unitNumber)==='2'?'selected':''}>Unit 2</option><option value="3" ${String(bk.unitNumber)==='3'?'selected':''}>Unit 3</option><option value="4" ${String(bk.unitNumber)==='4'?'selected':''}>Unit 4</option></select></div>
    </div>
    <div class="fg"><label>Subject</label><input type="text" id="em-su" value="${esc(bk.subject||'')}"></div>
    <div class="fg"><label>Google Drive / PDF URL</label><input type="url" id="em-drive" value="${esc(bk.driveUrl||bk.content||'')}" placeholder="https://drive.google.com/..."></div>
    <div class="fg" style="border:2px solid #FFCCCC;border-radius:10px;padding:.75rem;background:#FFF8F8">
      <label style="color:#CC0000">▶ YouTube Link <span style="font-weight:400;font-size:.65rem;letter-spacing:0;text-transform:none;color:var(--gy)">(Free, public)</span></label>
      <input type="url" id="em-yt" value="${esc(bk.youtubeUrl||'')}" placeholder="https://youtube.com/watch?v=..." style="margin-top:.3rem">
    </div>
    <div style="display:flex;gap:.75rem;margin-top:1rem">
      <button class="btn-mc" onclick="closeEditModal()">Cancel</button>
      <button class="btn-mp" onclick="saveEditBook('${bid}')">💾 Save Changes</button>
    </div>
  </div>`;
  m.addEventListener('click',e=>{ if(e.target===m) closeEditModal(); });
}
function closeEditModal(){ document.getElementById('edit-modal').style.display='none'; }
async function saveEditBook(bid){
  const tt=(document.getElementById('em-tt')?.value||'').trim();
  const pr=Number(document.getElementById('em-pr')?.value||0);
  const unit=document.getElementById('em-unit')?.value;
  const su=(document.getElementById('em-su')?.value||'').trim();
  const drive=(document.getElementById('em-drive')?.value||'').trim();
  const yt=(document.getElementById('em-yt')?.value||'').trim();
  if(!tt) return toast('Title required','err');
  try{
    const updates={title:tt,price:pr,unitNumber:unit,subject:su||null,youtubeUrl:yt||null};
    if(drive){ updates.driveUrl=drive; updates.contentType='drive'; updates.content=drive; }
    await window.updateBook(bid,updates); closeEditModal(); toast('✅ Book update ho gaya!','ok'); renderEditList();
  }catch(e){ toast('Error: '+(e?.message||''),'err'); }
}

async function doCreateCoupon(){
  const code=(document.getElementById('cp-code')?.value||'').trim().toUpperCase();
  const type=document.getElementById('cp-type')?.value;
  const val=Number(document.getElementById('cp-val')?.value||0);
  const maxU=Number(document.getElementById('cp-max')?.value||0);
  if(!code||code.length<3) return toast('Min 3 char code chahiye','err');
  if(!val||val<=0) return toast('Discount value dalo','err');
  if(type==='percent'&&val>90) return toast('Max 90% discount','err');
  try{
    await window.createCoupon({code,discountType:type,discountValue:val,maxUses:maxU,active:true});
    toast(`Coupon "${code}" ban gaya! 🎟️`,'ok');
    document.getElementById('cp-code').value=''; document.getElementById('cp-val').value=''; document.getElementById('cp-max').value='0';
    loadCouponList();
  }catch(e){ toast('Error: '+(e?.message||''),'err'); }
}
async function loadCouponList(){
  const lst=document.getElementById('coup-list');
  lst.innerHTML='<p style="color:var(--gy);font-size:.84rem">Load ho raha hai...</p>';
  try{
    const cps=await window.loadCoupons();
    const active=cps.filter(c=>c.active!==false);
    if(!active.length){ lst.innerHTML='<div class="empty"><div class="em">🎟️</div><p>Koi active coupon nahi.</p></div>'; return; }
    lst.innerHTML=active.map(c=>`<div class="cp-card"><div><div style="display:flex;align-items:center;gap:.6rem"><span class="cp-code">${esc(c.code)}</span><span class="cp-badge ${c.discountType==='percent'?'cp-pct':'cp-flat'}">${c.discountType==='percent'?c.discountValue+'% OFF':'₹'+c.discountValue+' OFF'}</span></div><div class="cp-meta">Used: ${c.usedCount||0}${c.maxUses>0?' / '+c.maxUses+' max':' (unlimited)'}</div></div><button class="cp-del" data-id="${c.id}" data-code="${esc(c.code)}" onclick="deactivateCoupon(this.dataset.id,this.dataset.code)">🗑 Delete</button></div>`).join('');
  }catch(e){ lst.innerHTML='<p style="color:red;font-size:.84rem">Load nahi hua.</p>'; }
}
async function deactivateCoupon(id,code){
  if(!confirm(`"${code}" delete karna chahte ho?`)) return;
  try{ await window.deleteCoupon(id); toast(`"${code}" delete ho gaya`,'ok'); loadCouponList(); }
  catch(e){ toast('Error: '+(e?.message||''),'err'); }
}

function renderComboAdmin(){
  const grid=document.getElementById('combo-admin-grid');
  if(!grid) return;
  const bks=window._books||[];
  const allStreams=[...UG_STREAMS,...PG_STREAMS];
  const rows=[];
  allStreams.forEach(s=>{
    SEMS.forEach(sem=>{
      const cnt=bks.filter(b=>b.stream===s.id&&b.semester===sem).length;
      if(cnt===0) return;
      const existing=(window._combos||[]).find(c=>c.stream===s.id&&c.semester===sem);
      const totalPrice=bks.filter(b=>b.stream===s.id&&b.semester===sem&&Number(b.price)>0).reduce((a,b)=>a+Number(b.price||0),0);
      const keyId='cpx-'+s.id+'-'+sem.replace(/\s/g,'_');
      rows.push(`<div class="combo-set-card"><div class="combo-set-head"><span class="combo-set-emoji">${s.emoji}</span><div><div class="combo-set-name">${s.name} — ${sem}</div><div class="combo-set-sem">${cnt} books • Individual: ₹${totalPrice}</div></div></div><div class="combo-price-row"><span style="font-size:.8rem;font-weight:700;color:var(--gy)">₹</span><input class="combo-price-in" id="${keyId}" type="number" placeholder="Combo Price" value="${existing?existing.price:''}" min="1"><button class="combo-save-btn" data-stream="${s.id}" data-sem="${sem}" onclick="saveComboPrice(this.dataset.stream,this.dataset.sem)">💾</button></div><div class="combo-bk-count">${existing?`✅ Active — ₹${existing.price}`:'⚠️ Not set'}</div></div>`);
    });
  });
  grid.innerHTML=rows.length?rows.join(''):'<p style="color:var(--gy);font-size:.84rem">Pehle books upload karo.</p>';
}
async function saveComboPrice(stream,sem){
  const key='cpx-'+stream+'-'+sem.replace(/\s/g,'_');
  const val=Number(document.getElementById(key)?.value||0);
  if(!val||val<1) return toast('Valid price dalo','err');
  try{ await window.saveCombo(stream,sem,val); await window.loadCombos(); renderComboAdmin(); toast(`Combo saved! ${stream} ${sem} — ₹${val} ✅`,'ok'); }
  catch(e){ toast('Error: '+(e?.message||''),'err'); }
}

// ═══════════════════════════════════════════
//  UTILS
// ═══════════════════════════════════════════
function setHd(h,s){ document.getElementById('lib-h').textContent=h; document.getElementById('lib-s').textContent=s; }
function show(id){ document.getElementById(id).style.display='block'; }
function hide(id){ document.getElementById(id).style.display='none'; }
const v=id=>document.getElementById(id)?.value?.trim()||'';
const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function toast(msg,type=''){
  document.querySelector('.toast')?.remove();
  const el=document.createElement('div');
  el.className='toast '+(type||'');
  el.textContent=msg;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),3800);
}

nav('home');
