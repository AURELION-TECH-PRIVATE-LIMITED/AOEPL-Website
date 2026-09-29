(function(){
'use strict';

/* ---------------------------------------------------------------
   Edit these lines with your real details.
---------------------------------------------------------------- */
var CONTACT={whatsapp:"919040800314",email:"mail.aoepl@gmail.com"};
var PKG=[{"id": "std", "name": "Standard Structural", "rate": 1600, "tag": "", "desc": "Durable, cost-optimized construction adhering to IS codes.", "pts": ["M20 grade machine-mixed concrete", "Fe500 primary brand TMT bars", "Fly ash brick masonry"], "spec": [["Steel and cement", "Fe500 primary brand TMT bars, OPC cement"], ["Masonry", "Fly ash brick masonry with cement plaster"], ["Flooring", "Vitrified tiles (standard allowance)"], ["Fixtures", "Standard modular switches, ISI sanitary fittings"]]}, {"id": "pre", "name": "Premium Turnkey", "rate": 2000, "tag": "Most popular", "desc": "Our most popular choice: engineered strength with modern designer finishes.", "pts": ["M25 grade ready-mix concrete", "Fe500D seismic-resistant TMT", "High-density AAC blocks"], "spec": [["Steel and cement", "Tata Tiscon / SAIL Fe500D, Ultratech Super OPC"], ["Masonry", "Precision AAC blocks / fly ash outer walls with waterproofing coats"], ["Flooring", "Double-charged vitrified glazed tiles (up to ₹75/sq ft value)"], ["Fixtures", "Schneider / Legrand modular switches, Jaquar sanitary fittings"]]}, {"id": "lux", "name": "Architectural Luxury", "rate": 2400, "tag": "", "desc": "Bespoke architectural elevations, high-end stone finishes, and smart conduits.", "pts": ["M30 engineered high-performance concrete", "Tata Tiscon Fe550D TMT steel", "Italian / large-slab glazed vitrified tiles"], "spec": [["Steel and cement", "Tata Tiscon Fe550D TMT, premium 53 grade OPC"], ["Masonry", "AAC blocks with weather-shield exterior finish"], ["Flooring", "Italian / large-slab glazed vitrified tiles"], ["Fixtures", "Smart conduits, premium modular switches and sanitary fittings"]]}];
var BOQ=[["RCC and substructure", 50, "#D2A85A"], ["Masonry, waterproofing and plaster", 15, "#B4532F"], ["Flooring, paint and joinery", 20, "#3E8791"], ["MEP, plumbing and electrification", 15, "#E6E0D3"]];

var root=document.documentElement;
var MODE=root.getAttribute('data-mode');
var CONTACT_HREF=root.getAttribute('data-contact')||'contact.html';
var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function $(id){return document.getElementById(id);}
function $$(sel){return [].slice.call(document.querySelectorAll(sel));}

/* ---------- WhatsApp links ---------- */
var waSet=!/X/.test(CONTACT.whatsapp);
var waLink='https://wa.me/'+CONTACT.whatsapp+'?text='+encodeURIComponent('Hello Art of Engineering, I would like to discuss a project.');
['fab','bandWa','officeWa'].forEach(function(id){
  var a=$(id);
  if(a&&waSet){a.href=waLink;a.target='_blank';a.rel='noopener';}
});

/* ---------- mobile menu ---------- */
var menuBtn=$('menuBtn'),mnav=$('mnav');
function setMenu(o){
  if(!menuBtn||!mnav){return;}
  mnav.classList.toggle('open',o);
  menuBtn.setAttribute('aria-expanded',o?'true':'false');
  menuBtn.textContent=o?'Close':'Menu';
  document.body.style.overflow=o?'hidden':'';
}
if(menuBtn){
  menuBtn.addEventListener('click',function(){setMenu(!mnav.classList.contains('open'));});
  $$('#mnav a').forEach(function(a){a.addEventListener('click',function(){setMenu(false);});});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){setMenu(false);}});
}

/* ---------- services: tabs that cycle as you scroll ---------- */
function clamp01(x){return Math.min(1,Math.max(0,x));}
var tabs=$$('.tab'),pns=$$('.pn');
var track=$('svtrack'),stick=$('svstick'),hint=$('svhint');
var sel=-1,scrollMode=false,geo={topV:0,k:1};
function pick(i,focus){
  if(i===sel&&!focus){return;}
  sel=i;
  tabs.forEach(function(t,j){t.setAttribute('aria-selected',j===i?'true':'false');t.tabIndex=j===i?0:-1;});
  pns.forEach(function(p,j){p.hidden=j!==i;});
  if(focus){tabs[i].focus();}
}
function svRange(){
  var r=track.getBoundingClientRect(),sh=stick.getBoundingClientRect().height;
  return {r:r,range:r.height-sh};
}
function svGoto(i,focus){
  if(!scrollMode){pick(i,focus);return;}
  var g=svRange();
  if(g.range>0){
    var y=window.pageYOffset+(g.r.top-geo.topV)+((i+0.5)/tabs.length)*g.range;
    window.scrollTo({top:y,behavior:'instant'});
  }
  pick(i,focus);
}
function svLayout(){
  if(!track||!stick||!track.offsetParent){return;}
  var keep=sel<0?0:sel;
  track.classList.remove('scrollmode','tight');
  track.style.height='';stick.style.minHeight='';
  scrollMode=false;
  if(!window.matchMedia('(min-width:861px)').matches){sel=-1;pick(keep,false);return;}
  function tallest(){
    var m=0;
    pns.forEach(function(p,j){pns.forEach(function(q,x){q.hidden=x!==j;});m=Math.max(m,stick.offsetHeight);});
    return m;
  }
  var k=stick.getBoundingClientRect().width/(stick.offsetWidth||1)||1;
  var topV=(parseFloat(window.getComputedStyle(stick).top)||104)*k;
  if(!isFinite(topV)||topV<=0){topV=104*k;}
  var avail=window.innerHeight-104*k-12;
  var m=tallest();
  if(m*k>avail){track.classList.add('tight');m=tallest();}
  if(m*k>avail){track.classList.remove('tight');sel=-1;pick(keep,false);return;}
  var stepV=window.innerHeight*0.6;
  stick.style.minHeight=m+'px';
  track.style.height=(m+(tabs.length*stepV)/k)+'px';
  track.classList.add('scrollmode');
  scrollMode=true;geo.k=k;geo.topV=104*k;
  sel=-1;pick(keep,false);
  svUpdate();
}
var svTick=false;
function svUpdate(){
  svTick=false;
  if(!scrollMode||!track.offsetParent){return;}
  var g=svRange();
  if(g.range<=0){return;}
  var p=clamp01((geo.topV-g.r.top)/g.range);
  var i=Math.min(tabs.length-1,Math.floor(p*tabs.length));
  if(hint){hint.style.setProperty('--f',p.toFixed(3));}
  if(i!==sel){pick(i,false);}
}
tabs.forEach(function(t,i){
  t.addEventListener('click',function(){svGoto(i,false);});
  t.addEventListener('keydown',function(e){
    var k=e.key,n=tabs.length,j=-1;
    if(k==='ArrowDown'||k==='ArrowRight'){j=(i+1)%n;}
    else if(k==='ArrowUp'||k==='ArrowLeft'){j=(i-1+n)%n;}
    else if(k==='Home'){j=0;}
    else if(k==='End'){j=n-1;}
    if(j>-1){e.preventDefault();svGoto(j,true);}
  });
});
if(tabs.length){
  pick(0,false);
  window.addEventListener('scroll',function(){if(!svTick){svTick=true;requestAnimationFrame(svUpdate);}},{passive:true});
  window.addEventListener('resize',svLayout);
  window.addEventListener('load',svLayout);
  if(document.fonts&&document.fonts.ready){document.fonts.ready.then(svLayout);}
  svLayout();
}

/* ---------- drawings that draw when they scroll into view ---------- */
var ills=$$('.ill');
if(window.IntersectionObserver&&ills.length){
  var io=new IntersectionObserver(function(es){
    es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('on');io.unobserve(en.target);}});
  },{threshold:0.4});
  ills.forEach(function(el){io.observe(el);});
}else{ills.forEach(function(el){el.classList.add('on');});}

/* ---------- stat numbers that count up when they scroll into view ---------- */
var cnums=$$('.cnum');
function runCount(el){
  var to=parseInt(el.getAttribute('data-to'),10)||0;
  if(reduce){el.textContent=num(to);return;}
  var t0=null;
  function step(ts){
    if(t0===null){t0=ts;}
    var p=Math.min(1,(ts-t0)/1200),e=1-Math.pow(1-p,3);
    el.textContent=num(to*e);
    if(p<1){requestAnimationFrame(step);}
  }
  requestAnimationFrame(step);
}
if(window.IntersectionObserver&&cnums.length){
  var cio=new IntersectionObserver(function(es){
    es.forEach(function(en){if(en.isIntersecting){runCount(en.target);cio.unobserve(en.target);}});
  },{threshold:0.6});
  cnums.forEach(function(el){cio.observe(el);});
}else{cnums.forEach(function(el){el.textContent=num(parseInt(el.getAttribute('data-to'),10)||0);});}

/* ---------- brand statement: cursor glow ---------- */
var brandEl=$('brand');
if(brandEl&&window.matchMedia('(hover:hover) and (pointer:fine)').matches){
  brandEl.addEventListener('mousemove',function(e){
    var r=brandEl.getBoundingClientRect();
    brandEl.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');
    brandEl.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');
  });
}

/* ---------- navigation between pages ---------- */
function goContact(query){
  if(MODE==='spa'){go('#/contact'+(query?'?'+query:''));}
  else{window.location.href='contact.html'+(query?'?'+query:'');}
}
$$('[data-scope]').forEach(function(b){
  b.addEventListener('click',function(){goContact('scope='+b.getAttribute('data-scope'));});
});

/* ---------- query parameters (works for both routing modes) ---------- */
function params(){
  var s='',h=window.location.hash||'',qi=h.indexOf('?');
  if(qi>-1){s=h.slice(qi+1);}else if(window.location.search){s=window.location.search.slice(1);}
  var o={};
  s.split('&').forEach(function(kv){
    if(!kv){return;}
    var p=kv.split('=');
    try{o[decodeURIComponent(p[0])]=decodeURIComponent((p[1]||'').replace(/\+/g,' '));}catch(e){}
  });
  return o;
}
function applyPrefill(){
  var f=$('enquiry');if(!f){return;}
  var p=params();
  if(p.scope!==undefined&&p.scope!==''){var i=parseInt(p.scope,10);if(!isNaN(i)&&$('f-scope')&&i>=0&&i<$('f-scope').options.length){$('f-scope').selectedIndex=i;}}
  if(p.area&&$('f-area')){$('f-area').value=p.area;}
  if(p.notes&&$('f-notes')){$('f-notes').value=p.notes;}
  if(p.site&&$('f-site')){$('f-site').value=p.site;}
}

/* ---------- enquiry form ---------- */
var form=$('enquiry'),status=$('status');
function val(id){return $(id).value.trim();}
function collect(){
  var need=[];
  if(!val('f-name')){need.push('your name');}
  if(!val('f-phone')){need.push('your phone number');}
  if(!val('f-site')){need.push('the site location');}
  if(need.length){status.textContent='Please add '+need.join(', ')+' so we can reply.';return null;}
  return 'Hello Art of Engineering, I would like an engineering proposal.\n'+
    'Name: '+val('f-name')+'\n'+
    'Phone: '+val('f-phone')+'\n'+
    'Email: '+(val('f-email')||'-')+'\n'+
    'Scope: '+$('f-scope').value+'\n'+
    'Built-up area (sq ft): '+(val('f-area')||'-')+'\n'+
    'Site location: '+val('f-site')+'\n'+
    'Requirements: '+(val('f-notes')||'-');
}
if(form){
  form.addEventListener('submit',function(ev){
    ev.preventDefault();
    var msg=collect();
    if(!msg){return;}
    window.open('https://wa.me/'+CONTACT.whatsapp+'?text='+encodeURIComponent(msg),'_blank','noopener');
    status.textContent='Opening WhatsApp with your details.';
  });
  $('mailBtn').addEventListener('click',function(){
    var msg=collect();
    if(!msg){return;}
    window.location.href='mailto:'+CONTACT.email+'?subject='+encodeURIComponent('Engineering proposal request')+'&body='+encodeURIComponent(msg);
    status.textContent='Opening your email app with the details.';
  });
}

/* ---------- cost estimator ---------- */
var FL_LONG=['','1 floor (ground only)','2 floors (ground + 1st floor)','3 floors (ground + 2 floors)','4 floors (ground + 3 floors)'];
var FL_SHORT=['','ground only','G+1 floor','G+2 floors','G+3 floors'];
function inr(n){return '\u20B9'+Math.round(n).toLocaleString('en-IN');}
function num(n){return Math.round(n).toLocaleString('en-IN');}
function checkedVal(name){var r=document.querySelector('input[name="'+name+'"]:checked');return r?parseInt(r.value,10):0;}
function initEstimator(){
  var range=$('e-area');
  if(!range){return;}
  var fls=$$('#r-elev .fl');
  var shown=0,firstPaint=true,raf=0;
  function tween(to){
    var el=$('r-total');
    if(reduce||firstPaint){el.textContent=inr(to);shown=to;return;}
    var from=shown,t0=null;
    if(raf){cancelAnimationFrame(raf);}
    function step(ts){
      if(t0===null){t0=ts;}
      var p=Math.min(1,(ts-t0)/450),e=1-Math.pow(1-p,3);
      shown=from+(to-from)*e;
      el.textContent=inr(shown);
      if(p<1){raf=requestAnimationFrame(step);}else{shown=to;}
    }
    raf=requestAnimationFrame(step);
  }
  function paint(){
    var a=parseInt(range.value,10)||1200,f=checkedVal('floors')||2,pk=PKG[checkedVal('pkg')]||PKG[1];
    var area=a*f,total=area*pk.rate;
    range.style.setProperty('--p',(((a-500)/4500)*100).toFixed(1)+'%');
    $('e-areaOut').textContent=num(a);
    $('e-floorLbl').textContent=FL_LONG[f];
    $('e-trow').textContent='Total constructed area ('+num(a)+' sq ft \u00D7 '+f+' floor'+(f>1?'s':'')+')';
    $('e-tarea').textContent=num(area)+' sq ft';
    $('e-specH').textContent=pk.name+' specification standards';
    $('e-spec').innerHTML=pk.spec.map(function(s){return '<div><dt>'+s[0]+'</dt><dd>'+s[1]+'</dd></div>';}).join('');
    $('r-area').textContent=num(area)+' sq ft total ('+FL_SHORT[f]+')';
    $('r-pkg').textContent=pk.name+' package';
    $('r-rate').textContent=num(area)+' sq ft @ '+inr(pk.rate)+'/sq ft';
    $('r-boq').innerHTML=BOQ.map(function(b){
      return '<li><i style="background:'+b[2]+'"></i><span>'+b[0]+' ('+b[1]+'%)</span><b>'+inr(total*b[1]/100)+'</b></li>';
    }).join('');
    $('r-bar').innerHTML=BOQ.map(function(b){
      return '<span style="width:'+b[1]+'%;background:'+b[2]+'"></span>';
    }).join('');
    fls.forEach(function(g,i){g.classList.toggle('off',i>=f);});
    tween(total);
    firstPaint=false;
    var msg='Hello Art of Engineering, I calculated a construction estimate on your website.\n'+
      'Package: '+pk.name+' ('+inr(pk.rate)+'/sq ft)\n'+
      'Floors: '+FL_SHORT[f]+' ('+f+' floor'+(f>1?'s':'')+')\n'+
      'Footprint: '+num(a)+' sq ft per floor\n'+
      'Total built-up area: '+num(area)+' sq ft\n'+
      'Estimated budget: '+inr(total)+' (indicative)\n'+
      'I would like a site inspection and a detailed BOQ.';
    var wa=$('r-wa');
    wa.href='https://wa.me/'+CONTACT.whatsapp+'?text='+encodeURIComponent(msg);wa.target='_blank';wa.rel='noopener';
    var notes='BOQ estimate: '+pk.name+', '+FL_SHORT[f]+', '+inr(total)+' (indicative)';
    $('r-book').href=CONTACT_HREF+'?scope=0&area='+area+'&notes='+encodeURIComponent(notes);
  }
  range.addEventListener('input',paint);
  $$('input[name="floors"],input[name="pkg"]').forEach(function(r){r.addEventListener('change',paint);});
  paint();
}
initEstimator();

/* ---------- single-file preview: hash routing between the pages ---------- */
var current=null;
function go(h){
  try{window.location.hash=h;}catch(e){}
  if(current!==h){render(h);}
}
function render(h){
  var pages=$$('.page');
  if(!pages.length){return;}
  current=h;
  var raw=(h||'').replace(/^#/,''),qi=raw.indexOf('?'),path=qi>-1?raw.slice(0,qi):raw;
  var map={'':'home','/':'home','/services':'services','/how-we-work':'how','/estimate':'estimate','/contact':'contact'};
  var name=map[path]||'home';
  var key=name;
  pages.forEach(function(p){
    var on=p.getAttribute('data-page')===name;
    p.hidden=!on;
    if(on){document.title=p.getAttribute('data-title');}
  });
  $$('[data-nav]').forEach(function(a){
    if(a.getAttribute('data-nav')===key){a.setAttribute('aria-current','page');}else{a.removeAttribute('aria-current');}
  });
  setMenu(false);
  window.scrollTo({top:0,behavior:'instant'});
  try{window.dispatchEvent(new Event('resize'));}catch(e){}
  if(name==='contact'){applyPrefill();}
}
if(MODE==='spa'){
  document.addEventListener('click',function(e){
    var a=e.target.closest?e.target.closest('a[href^="#/"]'):null;
    if(!a){return;}
    e.preventDefault();
    go(a.getAttribute('href'));
  });
  window.addEventListener('hashchange',function(){if(window.location.hash!==current){render(window.location.hash);}});
  render(window.location.hash||'#/');
}else{
  applyPrefill();
}
})();
