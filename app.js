'use strict';
const LOG=(()=>{try{return JSON.parse(localStorage.getItem('psp-log'))||[]}catch{return[]}})();
function logE(m){LOG.push(new Date().toLocaleTimeString()+' '+String(m).slice(0,160));while(LOG.length>20)LOG.shift();try{localStorage.setItem('psp-log',JSON.stringify(LOG))}catch{}const el=document.getElementById('logv');if(el)el.textContent=LOG.join('\n')}
addEventListener('error',e=>{if(e.filename&&!/app\.js/.test(e.filename))return;logE((e.message||'error')+' @'+(e.lineno||'?'))});
addEventListener('unhandledrejection',e=>{if(e.reason&&e.reason.stack&&!/app\.js/.test(e.reason.stack))return;logE('promesa: '+((e.reason&&e.reason.message)||e.reason))});
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const h=(t,a={},...c)=>{const e=document.createElement(t);for(const k in a){if(k.startsWith('on'))e[k]=a[k];else e.setAttribute(k,a[k])}e.append(...c.flat().filter(x=>x!=null&&x!==false));return e};
const BGK=['bgImg','bgV','bgH','bgHI'];
const DEF={mode:'dark',primary:'#7c5cff',secondary:'#19c6e6',bg:'#0b0d14',bgImg:'',bgV:'',bgH:'',bgHI:'',orient:'auto',overlay:35,blur:12,glass:55,cover:150,radius:18,shadow:30,gap:14,font:'system',anim:true,animBg:false,fit:'contain',ratio:'3/4',cbord:0,cbc:'#ffffff',bright:100,showCat:true,showNote:false,btn:'pill',tsize:14,pad:10,hsize:24,calign:'left',canim:'cascade',aspd:100,sfx:true,vol:40,pack:'soft',line:35,czoom:112,cang:38,cdim:45,bigt:true,tf:'system',tfs:26,tfc:'#ffffff',legib:60,perf:'full',ccover:190,edgeT:7,edgeC:'#ffffff',compact:true,pblur:10,pa:25,pdelay:0,psound:false,pdv:0,lfx:'zoom',bgt:false,bgti:40,bgtt:false,tout:50,bhd:25,flip3:true,plock:true};
const FONTS={system:'-apple-system,system-ui,sans-serif',rounded:'ui-rounded,"SF Pro Rounded",system-ui,sans-serif',serif:'ui-serif,Georgia,serif',mono:'ui-monospace,Menlo,monospace',didot:'"Didot","Bodoni 72",serif',avenir:'"Avenir Next",system-ui,sans-serif',futura:'"Futura","Avenir Next",sans-serif',optima:'"Optima",sans-serif',copper:'"Copperplate",serif',marker:'"Marker Felt",cursive'};
const PRE={dark:'#0b0d14',light:'#f1f3f9'},VIEWS=['list','grid','car'],ICON={list:'☰',grid:'▦',car:'◫'},ORI=['auto','v','h','hi'];
const PRESETS={
 glass:{n:'Cristal',mode:'dark',bg:'#0b0d14',primary:'#8ab4ff',secondary:'#c4a8ff',glass:35,blur:24,glow:0,cbord:1,cbc:'#ffffff',radius:24,shadow:35,font:'rounded'},
 retro:{n:'Retro PSP',mode:'custom',bg:'#14110f',primary:'#e8b84a',secondary:'#d4602e',glass:70,blur:4,glow:0,cbord:2,cbc:'#e8b84a',radius:6,shadow:50,font:'serif'},
 minimal:{n:'Minimal',mode:'light',bg:'#f1f3f9',primary:'#111827',secondary:'#6b7280',glass:80,blur:0,glow:0,cbord:0,cbc:'#ffffff',radius:10,shadow:12,font:'system'},
 sunset:{n:'Atardecer',mode:'custom',bg:'#1a0b1f',primary:'#ff7a59',secondary:'#ffc15e',glass:45,blur:18,glow:14,cbord:0,cbc:'#ffffff',radius:22,shadow:35,font:'rounded'}};
function applyPreset(k){const{n,...p}=PRESETS[k];Object.assign(S,p);saveS();sync();toast('Estilo «'+n+'» aplicado ✓')}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const ls=(k,d)=>{try{return{...d,...JSON.parse(localStorage.getItem(k))}}catch{return{...d}}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const RM=matchMedia('(prefers-reduced-motion: reduce)');
let db,games=[],imgs={},isVid=new Set(),S=ls('psp-s',DEF),M=ls('psp-m',{title:'Game Space',sub:'Mis juegos',view:'grid'}),filter='',sec='all',vS={file:null,clear:false},pS={file:null,clear:false},blobs={},curG=null,editing=null,cs={data:null,clear:false},tt,curKey='V',lastBg=null;

/* ---------- IndexedDB (misma base que la versión 1) ---------- */
const openDB=()=>new Promise((res,rej)=>{const r=indexedDB.open('psp-universe',1);r.onupgradeneeded=()=>['games','images','themes'].forEach(s=>r.result.createObjectStore(s,{keyPath:'id'}));r.onsuccess=()=>{db=r.result;res()};r.onerror=()=>rej(r.error)});
const tx=(s,m,f)=>new Promise((res,rej)=>{const t=db.transaction(s,m),q=f(t.objectStore(s));t.oncomplete=()=>res(q&&q.result);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error||new Error('Almacenamiento lleno o no disponible'))});
const put=(s,v)=>tx(s,'readwrite',o=>o.put(v)),del=(s,k)=>tx(s,'readwrite',o=>o.delete(k)),all=s=>tx(s,'readonly',o=>o.getAll()),clr=s=>tx(s,'readwrite',o=>o.clear());

/* ---------- Utilidades ---------- */
function toast(m,bad){const t=$('#toast');t.textContent=m;t.className='show'+(bad?' bad':'');clearTimeout(tt);tt=setTimeout(()=>t.className='',bad?5000:1800);const s=$('#st');s.textContent=m;s.className='st'+(bad?' bad':'')}
const show=(id,on=true)=>$(id).classList.toggle('on',on);
const okLink=l=>/^ppsspp:\/\/open\?path=\S{3,}$/i.test(l);
const cover=g=>g.cover&&g.cover.startsWith('img:')?imgs[g.cover.slice(4)]:g.cover;
const hue=n=>[...n].reduce((a,c)=>a+c.charCodeAt(0),0)%360;
const shrink=(f,max)=>new Promise((res,rej)=>{if(f.size>25e6)return rej(new Error('Imagen demasiado grande (máx. 25 MB).'));const u=URL.createObjectURL(f),i=new Image();i.onload=()=>{const k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);c.getContext('2d').drawImage(i,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c.toDataURL('image/jpeg',.82))};i.onerror=()=>rej(new Error('No se pudo leer la imagen.'));i.src=u});

/* ---------- Orientación (la interfaz gira por código) ---------- */
function orient(){
 const W=Math.max(innerWidth,document.documentElement.clientWidth),H=Math.max(innerHeight,document.documentElement.clientHeight),land=W>H,o=S.orient;let r=0;
 if(o==='v')r=land?90:0;else if(o==='h')r=land?0:90;else if(o==='hi')r=land?180:-90;
 const a=$('#app'),sw=r===90||r===-90;
 a.style.width=(sw?H:W)+'px';a.style.height=(sw?W:H)+'px';
 a.style.transform=r===90?`translate(${W}px,0) rotate(90deg)`:r===-90?`translate(0,${H}px) rotate(-90deg)`:r===180?`translate(${W}px,${H}px) rotate(180deg)`:'none';
 a.classList.remove('r0','rx');a.classList.add(r?'rx':'r0');curR=r;curW=W;curH=H;
 const k=o==='v'?'V':o==='h'?'H':o==='hi'?'HI':land?'H':'V';
 if(k!==curKey){curKey=k;apply()}
 $$('#seg button').forEach(b=>b.classList.toggle('on',b.dataset.o===o));
 setCmp();requestAnimationFrame(applyCar);
}
addEventListener('resize',orient);addEventListener('orientationchange',()=>setTimeout(orient,150));

/* ---------- Tema y fondo ---------- */
const bgId=()=>S['bg'+curKey]||S.bgImg;
function bgRender(id){
 const src=imgs[id],bg=$('#bg');bg.replaceChildren();bg.style.backgroundImage='';
 if(src&&isVid.has(id)){const v=h('video',{muted:'',loop:'',playsinline:'','webkit-playsinline':''});v.muted=true;v.defaultMuted=true;v.playsInline=true;v.src=src;bg.append(v);if(!RM.matches)v.play().catch(()=>{})}
 else if(src)bg.style.backgroundImage=`url("${src}")`;
}
function apply(){
 const t=S,r=document.documentElement.style,n=parseInt((/^#[0-9a-f]{6}$/i.test(t.bg)?t.bg:DEF.bg).slice(1),16),R=n>>16,G=n>>8&255,B=n&255,light=(.299*R+.587*G+.114*B)/255>.55,p=parseInt(t.primary.slice(1),16),set=(k,v)=>r.setProperty(k,v);
 set('--p',t.primary);set('--s',t.secondary);set('--bg',t.bg);
 set('--txt',light?'#12141c':'#f4f6fb');set('--mut',light?'#4a5066':'#a9b0c6');
 set('--glass',`rgba(${light?'255,255,255':'24,27,40'},${t.glass/100})`);
 set('--blur',t.blur+'px');set('--ovc',`rgba(${R},${G},${B},${t.overlay/100})`);
 set('--cover',t.cover+'px');set('--rad',t.radius+'px');set('--gap',t.gap+'px');
 set('--sh',`0 8px 24px rgba(0,0,0,${t.shadow/100})`);set('--font',FONTS[t.font]||FONTS.system);
 set('--ratio',t.ratio);set('--fit',t.fit);set('--cb',t.cbord+'px');set('--cbc',t.cbc);set('--bright',t.bright+'%');set('--tsz',t.tsize+'px');set('--pad',t.pad+'px');set('--hsz',t.hsize+'px');set('--calign',t.calign);
 document.body.dataset.btn=t.btn;document.body.dataset.calign=t.calign;set('--spd',t.aspd/100);if(!['none','cascade','zoom','flip'].includes(t.canim))t.canim='cascade';document.body.dataset.canim=t.canim;set('--line',`rgba(${light?'0,0,0':'255,255,255'},${t.line/100})`);
 const sa=t.legib/100,sh2=light?'255,255,255':'0,0,0';set('--ts',`0 1px 2px rgba(${sh2},${(sa*.9).toFixed(2)}),0 0 10px rgba(${sh2},${(sa*.6).toFixed(2)})`);
 set('--et',t.edgeT+'px');document.body.dataset.et=t.edgeT;document.body.classList.toggle('f3',!!t.flip3);
 set('--tf',FONTS[t.tf]||FONTS.system);
 {const w=t.tout/100*2.4,oc=`rgba(${sh2},.95)`;set('--to',w<.15?'0 0 0 transparent':[[1,0],[-1,0],[0,1],[0,-1],[.7,.7],[-.7,-.7],[.7,-.7],[-.7,.7]].map(([x,y])=>`${(x*w).toFixed(2)}px ${(y*w).toFixed(2)}px 0 ${oc}`).join(','))}set('--tfs',t.tfs+'px');set('--tfc',t.tfc);set('--pblur',t.pblur+'px');set('--pa',t.pa/100);
 document.body.classList.toggle('lite',t.perf==='lite');document.body.classList.toggle('shownote',!!t.showNote);
 set('--onp',(.299*(p>>16)+.587*(p>>8&255)+.114*(p&255))/255>.6?'#111':'#fff');
 const id=bgId();
 document.body.classList.toggle('noanim',!t.anim);document.body.classList.toggle('animbg',t.animBg&&!imgs[id]);
 if(id!==lastBg){lastBg=id;bgRender(id)}
 $('meta[name=theme-color]').content=t.bg;
}
const saveS=()=>{lsSet('psp-s',S);apply();orient()};
const sync=()=>$$('[data-k]').forEach(el=>{el[el.type==='checkbox'?'checked':'value']=S[el.dataset.k];if(el._v)el._v.textContent=el.value});
function bind(){
 const hook=el=>{const k=el.dataset.k,c=el.type==='checkbox';el.oninput=()=>{recent(k);S[k]=c?el.checked:el.type==='range'?+el.value:el.value;if(k==='bg')S.mode='custom';if(k==='mode'&&PRE[S.mode])S.bg=PRE[S.mode];saveS();sync();if(k==='showCat'||k==='showNote')render();if(['czoom','cang','cdim','cover','gap'].includes(k))applyCar();if(k.slice(0,3)==='bgt')motionStart(k==='bgt'&&S.bgt)};el.onchange=()=>toast('Guardado ✓')};window.hook=hook;$$('[data-k]').forEach(hook);
 $$('[data-m]').forEach(el=>{el.value=M[el.dataset.m];el.oninput=()=>{M[el.dataset.m]=el.value;lsSet('psp-m',M);head()}});
 $$('#seg button').forEach(b=>b.onclick=()=>{S.orient=b.dataset.o;saveS();toast('Orientación guardada ✓')});
 $$('#tabs button').forEach(b=>b.onclick=()=>{$$('#tabs button').forEach(x=>x.classList.toggle('on',x===b));$$('[data-s]').forEach(s=>s.hidden=s.dataset.s!==b.dataset.t)});
 $('#presets').replaceChildren(...Object.entries(PRESETS).map(([k,v])=>h('button',{onclick:()=>applyPreset(k)},v.n)));
 $$('input[type=range][data-k]').forEach(el=>{const v=h('span',{class:'val'},String(S[el.dataset.k]));el.before(v);el._v=v;el.addEventListener('input',()=>{v.textContent=el.value})});
 sync();
}
const head=()=>{$('#ttl').textContent=M.title;$('#sub').textContent=M.sub;document.title=M.title};
function view(){const v0=sc(sec).view||M.view,v=VIEWS.includes(v0)?v0:'grid';$('#lib').className='v-'+v;$('#bView').textContent=ICON[v];requestAnimationFrame(applyCar)}
async function gcBg(id){
 if(!id||BGK.some(k=>S[k]===id))return;
 if((await all('themes')).some(t=>BGK.some(k=>t[k]===id)))return;
 await del('images',id);if(blobs[id]){URL.revokeObjectURL(imgs[id]);delete blobs[id]}delete imgs[id];isVid.delete(id);
}
const gcAll=ids=>Promise.all(ids.map(gcBg));
function bgRows(){
 const N={bgImg:'Global (todos los modos)',bgV:'Vertical',bgH:'Horizontal',bgHI:'Horizontal invertido'};
 $('#bgrows').replaceChildren(...BGK.map(k=>h('div',{class:'row'},
  h('span',{},h('b',{},N[k]),h('br'),h('small',{class:'mut'},S[k]?(isVid.has(S[k])?'Video propio':'Imagen propia'):k==='bgImg'?'Sin fondo':'Usa el global')),
  h('label',{class:'btn'},'Elegir',h('input',{type:'file',accept:'image/*,video/*',hidden:'',onchange:e=>setBg(k,e)})),
  S[k]?h('button',{class:'dng',onclick:()=>clearBg(k)},'Quitar'):null)));
}
async function setBg(k,e){
 const f=e.target.files[0];e.target.value='';if(!f)return;
 try{
  const id='bg'+uid();let vid=f.type.startsWith('video/');
  if(vid){if(f.size>80e6)throw new Error('El video pesa más de 80 MB. Recórtalo o comprímelo.');await put('images',{id,blob:f,vid:true});imgs[id]=URL.createObjectURL(f);blobs[id]=f;isVid.add(id)}
  else if(/^image\/(gif|webp)$/.test(f.type)){if(f.size>25e6)throw new Error('La imagen animada pesa más de 25 MB.');await put('images',{id,blob:f,img:true});imgs[id]=URL.createObjectURL(f);blobs[id]=f}
  else{const d=await shrink(f,1600);await put('images',{id,data:d});imgs[id]=d}
  const old=S[k];S[k]=id;saveS();await gcBg(old);bgRows();toast('Fondo guardado ✓');
 }catch(x){toast(x.message||'No se pudo guardar el fondo.',1)}
}
async function clearBg(k){const old=S[k];S[k]='';saveS();await gcBg(old);bgRows();toast('Fondo quitado')}

/* ---------- Biblioteca ---------- */
function more(g){curG=g;$('#amt').textContent=g.name;show('#am')}
function card(g){
 const src=cover(g),ini=[...g.name.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0])].join('').toUpperCase()||'?',fb=h('div',{class:'ini'},ini),cv=h('div',{class:'cv'},h('span',{class:'pb'},'▶'));
 fb.style.setProperty('--hue',hue(g.name));
 if(src){cv.style.setProperty('--ci',`url("${src}")`);const im=h('img',{src,alt:'',loading:'lazy'});im.onerror=()=>{cv.style.removeProperty('--ci');im.replaceWith(fb)};cv.append(im)}else cv.append(fb);
 const inf=h('div',{class:'inf'},h('b',{title:g.name},g.name),
  h('div',{class:'meta'},S.showCat&&g.cat?h('span',{class:'tag'},g.cat):null,
   h('button',{class:'ib fv'+(g.fav?' on':''),'aria-label':'Favorito',onclick:()=>fav(g)},g.fav?'★':'☆'),
   h('button',{class:'ib','aria-label':'Más opciones',onclick:()=>more(g)},'⋯')),
  g.note?h('small',{class:'note'},g.note):null);
 const back=h('div',{class:'fb'},h('div',{class:'pvb'}),h('div',{class:'pn'},g.note||'Sin notas'));
 const art=h('article',{class:'card'},h('div',{class:'fl'},h('div',{class:'ff'},cv,inf),back,h('div',{class:'ed el'}),h('div',{class:'ed er'})));
 art._g=g;art.dataset.n=g.name;cv.onclick=()=>tap(g,art);back.onclick=()=>tap(g,art);
 return art;
}
function render(){
 const q=$('#q').value.trim().toLowerCase(),vis=games.filter(g=>!!g.priv===priv),inSec=g=>{const t=g.type||'psp';return sec==='rec'?g.last>0:sec==='all'?ALLIN.includes(t):t===sec},base=vis.filter(inSec),cats=[...new Set(base.map(g=>g.cat).filter(Boolean))].sort();
 if(filter&&filter!=='*'&&!cats.includes(filter))filter='';
 $('#app').classList.toggle('priv',priv);
 $('#secs').replaceChildren(...SKM().filter(k=>sc(k).on||k===sec).map(k=>h('button',{class:sec===k?'on':'',onclick:()=>{if(k==='priv'){privEnter();return}sec=k;filter='';view();render();snd('swap')}},sc(k).e+' '+sc(k).n)),...(priv?[h('button',{class:'ex',onclick:privExit},'Salir del modo privado')]:[]));
 const chip=(l,v)=>h('button',{class:filter===v?'on':'',onclick:()=>{filter=v;render()}},l);
 $('#chips').replaceChildren(chip('Todas',''),chip('★ Favoritos','*'),...cats.map(c=>chip(c,c)));
 $('#cl').replaceChildren(...[...new Set(vis.map(g=>g.cat).filter(Boolean))].sort().map(c=>h('option',{value:c})));
 let L=base.filter(g=>(!q||(g.name+' '+g.cat+' '+g.note).toLowerCase().includes(q))&&(!filter||(filter==='*'?g.fav:g.cat===filter)));
 L=sec==='rec'?L.sort((a,b)=>b.last-a.last).slice(0,30):L.sort((a,b)=>a.name.localeCompare(b.name));
 const msg=sec==='rec'?'Aún no has abierto nada.':vis.length?'No hay nada aquí todavía.':priv?'Tu espacio privado está vacío.':'Tu biblioteca está vacía.';
 $('#lib').replaceChildren(...(L.length?L.map((g,i)=>{const c=card(g);c.style.setProperty('--i',Math.min(i,12));return c}):[h('div',{class:'empty'},h('span',{},'🎮'),msg,sec==='rec'?null:h('div',{},h('button',{class:'pri',onclick:()=>edit(null)},'＋ Añadir')))]));
 requestAnimationFrame(applyCar);
}
async function fav(g){g.fav=!g.fav;try{await put('games',g);render()}catch(e){g.fav=!g.fav;toast('No se pudo guardar.',1)}}
async function rm(g){
 if(!confirm(`¿Eliminar «${g.name}» de la biblioteca?\nSolo se borra este registro; tu ROM y tus partidas guardadas no se tocan.`))return;
 try{await del('games',g.id);if(g.prev){await del('images',g.prev);URL.revokeObjectURL(imgs[g.prev]);delete imgs[g.prev];delete blobs[g.prev];isVid.delete(g.prev)}if(g.vfile){await del('images',g.vfile);URL.revokeObjectURL(imgs[g.vfile]);delete imgs[g.vfile];delete blobs[g.vfile];isVid.delete(g.vfile)}if(g.cover&&g.cover.startsWith('img:')){await del('images',g.cover.slice(4));delete imgs[g.cover.slice(4)]}games=games.filter(x=>x.id!==g.id);render();toast('Juego eliminado de la biblioteca')}catch(e){toast('No se pudo eliminar.',1)}
}
function play(g){
 const ty=g.type||'psp',l=g.link;
 if(ty==='video'&&g.vfile&&imgs[g.vfile]){stamp(g);return player(imgs[g.vfile])}
 if(!l)return toast(ty==='psp'?'Este juego no tiene enlace. Edítalo y pega el enlace profundo de PPSSPP.':'Este elemento no tiene enlace. Edítalo para añadirlo.',1);
 if(!okFor(ty,l))return toast(ERR[ty],1);
 stamp(g);
 if(ty==='video'&&/\.(mp4|m4v|mov|webm)(\?|#|$)/i.test(l))return player(l);
 if(ty==='web'||ty==='online'||ty==='video'){window.open(l,'_blank','noopener');return}
 let left=false;const f=()=>{if(document.hidden)left=true};document.addEventListener('visibilitychange',f);
 location.href=l;
 setTimeout(()=>{document.removeEventListener('visibilitychange',f);if(!left)toast(ty==='psp'?'No se pudo abrir PPSSPP. Comprueba que está instalado y copia de nuevo el enlace profundo desde el juego (la ruta puede haber cambiado).':'No se pudo abrir la app. Revisa el atajo o el enlace.',1)},2500);
}

/* ---------- Formulario ---------- */
const err=m=>{const e=$('#err');e.textContent=m;e.hidden=false};
function pv(){const E=$('#fm').elements,s=cs.data||(!cs.clear&&editing&&cover(editing))||E.curl.value.trim();$('#pv').replaceChildren(s&&/^(data:image|https?:)/.test(s)?h('img',{src:s,alt:''}):h('span',{},'Sin portada'))}
function edit(g){
 const f=$('#fm'),E=f.elements;f.reset();editing=g;cs={data:null,clear:false};$('#err').hidden=true;
 $('#ft').textContent=g?'Editar juego':'Añadir juego';
 E.gid.value=g?g.id:'';E.name.value=g?g.name:'';E.cat.value=g?g.cat:'';E.note.value=g?g.note:'';E.link.value=g?g.link:'';E.fav.checked=!!(g&&g.fav);
 E.curl.value=g&&/^https?:/.test(g.cover)?g.cover:'';E.type.value=g?(g.type||'psp'):(ALLT.includes(sec)?sec:'psp');vS={file:null,clear:false};pS={file:null,clear:false};tsync(g);pv();pvsync(g);show('#gf');
}
$('#fm').onsubmit=async e=>{
 e.preventDefault();$('#err').hidden=true;
 const E=e.target.elements,ty=E.type.value,name=E.name.value.trim(),link=E.link.value.trim(),url=E.curl.value.trim();
 if(!name)return err('Escribe un nombre.');
 if(link&&!okFor(ty,link))return err(ERR[ty]);
 if(url&&!/^https?:\/\/\S+$/i.test(url))return err('La URL de la portada debe empezar por https://');
 const old=editing,oc=old?old.cover:'',oldId=oc.startsWith('img:')?oc.slice(4):'';let cv=oc;
 try{
  if(cs.data){const id=uid();await put('images',{id,data:cs.data});imgs[id]=cs.data;cv='img:'+id}
  else if(url)cv=url;
  else if(cs.clear||!oldId)cv='';
  if(oldId&&cv!==oc){await del('images',oldId);delete imgs[oldId]}
  let vf=old&&old.vfile||'';if((vS.clear||ty!=='video')&&vf){await del('images',vf);URL.revokeObjectURL(imgs[vf]);delete imgs[vf];delete blobs[vf];isVid.delete(vf);vf=''}
  if(ty==='video'&&vS.file){if(vS.file.size>200e6)throw new Error('El video pesa más de 200 MB.');const nid='vf'+uid();await put('images',{id:nid,blob:vS.file,vid:true});if(vf){await del('images',vf);URL.revokeObjectURL(imgs[vf]);isVid.delete(vf)}vf=nid;imgs[nid]=URL.createObjectURL(vS.file);blobs[nid]=vS.file;isVid.add(nid)}
  let pr=old&&old.prev||'';
  if(pS.clear&&pr){await del('images',pr);URL.revokeObjectURL(imgs[pr]);delete imgs[pr];delete blobs[pr];isVid.delete(pr);pr=''}
  if(pS.file){if(pS.file.size>60e6)throw new Error('El video de presentación pesa más de 60 MB.');const nid='pv'+uid();await put('images',{id:nid,blob:pS.file,vid:true});if(pr){await del('images',pr);URL.revokeObjectURL(imgs[pr]);isVid.delete(pr);delete blobs[pr]}pr=nid;imgs[nid]=URL.createObjectURL(pS.file);blobs[nid]=pS.file;isVid.add(nid)}
  const g={type:ty,last:old?old.last||0:0,vfile:vf,prev:pr,priv:old?!!old.priv:priv,id:old?old.id:uid(),name:name.slice(0,120),cat:E.cat.value.trim().slice(0,40),note:E.note.value.trim().slice(0,300),link,fav:E.fav.checked,cover:cv};
  await put('games',g);games=games.filter(x=>x.id!==g.id).concat(g);
 }catch(x){return err('No se pudo guardar: '+(x.message||x))}
 show('#gf',false);render();toast('Guardado ✓');
};
$('#cf').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{cs.data=await shrink(f,700);cs.clear=false;pv()}catch(x){err(x.message)}};
$('#cclr').onclick=()=>{cs={data:null,clear:true};$('#fm').elements.curl.value='';pv()};
$('#fm').elements.curl.oninput=pv;
$('#fc').onclick=()=>show('#gf',false);
$('#paste').onclick=()=>navigator.clipboard.readText().then(t=>{$('#fm').elements.link.value=t.trim()}).catch(()=>err('Safari no permitió leer el portapapeles. Mantén pulsado el campo y elige Pegar.'));

/* ---------- Temas ---------- */
async function themes(){
 const L=await all('themes').catch(()=>[]);
 $('#tl').replaceChildren(...L.map(t=>h('div',{class:'row'},h('span',{},t.id),h('button',{onclick:()=>useTheme(t)},'Aplicar'),h('button',{class:'dng',onclick:()=>delTheme(t)},'Borrar'))),L.length?'':h('p',{class:'mut'},'Aún no hay temas guardados.'));
}
$('#ts').onclick=async()=>{const n=$('#tn').value.trim().slice(0,40);if(!n)return toast('Escribe un nombre para el tema.',1);
 if((await all('themes')).some(t=>t.id===n)&&!confirm(`Ya existe «${n}». ¿Sobrescribirlo?`))return;
 try{await put('themes',{...S,id:n});$('#tn').value='';themes();toast('Tema guardado ✓')}catch(e){toast('No se pudo guardar el tema.',1)}};
async function useTheme(t){const{id,...r}=t,old=BGK.map(k=>S[k]);S={...DEF,...r};saveS();sync();bgRows();await gcAll(old);toast('Tema «'+id+'» aplicado')}
async function delTheme(t){if(!confirm(`¿Borrar el tema «${t.id}»?`))return;await del('themes',t.id);await gcAll(BGK.map(k=>t[k]));themes();toast('Tema borrado')}
$('#tr').onclick=async()=>{if(!confirm('¿Restaurar el tema predeterminado? Tus juegos no se tocan.'))return;const old=BGK.map(k=>S[k]);S={...DEF};saveS();sync();bgRows();await gcAll(old);toast('Tema predeterminado restaurado')};

/* ---------- Exportar / importar ---------- */
$('#ex').onclick=async()=>{
 try{
  const mine=games.filter(g=>!!g.priv===priv),ref=new Set(),th=await all('themes');
  mine.forEach(g=>{if(g.cover&&g.cover.startsWith('img:'))ref.add(g.cover.slice(4))});
  [S,...th].forEach(o=>['bgImg','bgV','bgH','bgHI'].forEach(k=>{if(o[k])ref.add(o[k])}));
  const ims=(await all('images')).filter(i=>!i.blob&&ref.has(i.id)),skipped=isVid.size;
  const meta={...M};if(!priv)delete meta.secsP;delete meta.mu;
  const d={app:'psp-universe',v:2,priv,date:new Date().toISOString(),meta,settings:S,games:mine,themes:th,images:ims};
  const blob=new Blob([JSON.stringify(d)],{type:'application/json'}),f=new File([blob],priv?'game-space-privado.json':'psp-universe-copia.json',{type:'application/json'});
  if(skipped)toast('Aviso: los fondos de video no entran en la copia.');
  if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f]});return}catch(e){if(e.name==='AbortError')return}}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=f.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);toast(priv?'Copia privada exportada ✓':'Copia exportada ✓');
 }catch(e){toast('No se pudo exportar: '+(e.message||e),1)}
};
function cleanS(x,ids){
 const o={...DEF};x=x&&typeof x==='object'?x:{};
 for(const k in DEF){if(typeof x[k]!==typeof DEF[k])continue;const v=x[k];
  if(typeof v==='number'){if(Number.isFinite(v))o[k]=Math.min(Math.max(v,0),300)}
  else if(['primary','secondary','bg','cbc','tfc','edgeC'].includes(k)){if(/^#[0-9a-f]{6}$/i.test(v))o[k]=v}
  else if(k==='font'){if(FONTS[v])o[k]=v}
  else if(k==='mode'){if(['dark','light','custom'].includes(v))o[k]=v}
  else if(k==='orient'){if(ORI.includes(v))o[k]=v}
  else if(k==='fit'){if(['contain','cover'].includes(v))o[k]=v}
  else if(k==='ratio'){if(['3/4','2/3','1/1','4/3','16/9'].includes(v))o[k]=v}
  else if(k==='btn'){if(['pill','round','square'].includes(v))o[k]=v}
  else if(k==='calign'){if(['left','center'].includes(v))o[k]=v}
  else if(k==='canim'){if(['none','cascade','zoom','flip'].includes(v))o[k]=v}
  else if(k==='pack'){if(['soft','glass','arcade'].includes(v))o[k]=v}
  else if(k==='tf'){if(FONTS[v])o[k]=v}
  else if(k==='perf'){if(['full','lite'].includes(v))o[k]=v}
  else if(k==='lfx'){if(['zoom','spin','flip','hole','dust','none'].includes(v))o[k]=v}
  else if(BGK.includes(k)){if(ids.has(v))o[k]=v}
  else o[k]=v}
 return o;
}
function clean(d){
 if(!d||d.app!=='psp-universe'||!Array.isArray(d.games))throw new Error('No es una copia de PSP Universe.');
 if(d.games.length>2000)throw new Error('Demasiados juegos.');
 const s=x=>typeof x==='string'?x:'',okId=x=>/^[\w-]{1,40}$/.test(s(x));
 const im=(Array.isArray(d.images)?d.images:[]).filter(i=>i&&okId(i.id)&&/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s(i.data))&&i.data.length<6e6).map(i=>({id:i.id,data:i.data})),ids=new Set(im.map(i=>i.id));
 const gs=d.games.filter(g=>g&&okId(g.id)&&s(g.name).trim()).map(g=>{const c=s(g.cover),ty=ALLT.includes(g.type)?g.type:'psp';return{type:ty,last:Number.isFinite(g.last)?g.last:0,priv:g.priv===true,id:g.id,name:s(g.name).trim().slice(0,120),cat:s(g.cat).slice(0,40),note:s(g.note).slice(0,300),link:okFor(ty,s(g.link))?g.link:'',fav:g.fav===true,cover:c.startsWith('img:')?(ids.has(c.slice(4))?c:''):/^https?:\/\/\S+$/i.test(c)?c:''}});
 const th=(Array.isArray(d.themes)?d.themes:[]).filter(t=>t&&s(t.id).trim()).slice(0,100).map(t=>({...cleanS(t,ids),id:s(t.id).trim().slice(0,40)}));
 const m=d.meta||{};
 return{games:gs,im,themes:th,S:cleanS(d.settings,ids),M:{title:s(m.title).slice(0,60)||'Game Space',sub:s(m.sub).slice(0,80),view:VIEWS.includes(m.view)?m.view:'grid',secs:cleanSecs(m.secs),secsP:cleanSecs(m.secsP),acts:cleanActs(m.acts)}};
}
$('#imf').onchange=async e=>{
 const f=e.target.files[0];e.target.value='';if(!f)return;
 try{
  if(f.size>80e6)throw new Error('Archivo demasiado grande.');
  const d=clean(JSON.parse(await f.text())),other=games.filter(g=>!!g.priv!==priv),mine=games.filter(g=>!!g.priv===priv);
  if(!confirm(`Vas a REEMPLAZAR ${priv?'tus juegos PRIVADOS':'tu biblioteca'} (${mine.length} juegos) por la copia (${d.games.length} juegos, ${d.im.length} imágenes).${priv?'':' Tus juegos privados no se tocan.'} Tus fondos de video actuales se perderán.\n¿Continuar?`))return;
  const keep=new Set();other.forEach(g=>[g.vfile,g.prev,g.cover&&g.cover.startsWith('img:')?g.cover.slice(4):''].forEach(id=>{if(id)keep.add(id)}));
  const recs=(await all('images')).filter(i=>keep.has(i.id)||i.id.slice(0,2)==='mu');
  for(const s of['games','images','themes'])await clr(s);
  for(const g of other)await put('games',g);for(const i of recs)await put('images',i);
  const ng=d.games.map(g=>({...g,priv}));
  for(const g of ng)await put('games',g);for(const i of d.im)await put('images',i);for(const t of d.themes)await put('themes',t);
  const keepImgs=Object.fromEntries(Object.entries(imgs).filter(([id])=>keep.has(id)));
  isVid=new Set([...isVid].filter(id=>keep.has(id)));Object.keys(blobs).forEach(id=>{if(!keep.has(id)&&id.slice(0,2)!=='mu')delete blobs[id]});
  games=[...other,...ng];imgs={...keepImgs,...Object.fromEntries(d.im.map(i=>[i.id,i.data]))};
  const oc=priv?'secs':'secsP';S=d.S;M={...M,...d.M,[oc]:M[oc],mu:M.mu};lsSet('psp-s',S);lsSet('psp-m',M);
  sync();$$('[data-m]').forEach(el=>el.value=M[el.dataset.m]);lastBg=null;apply();orient();head();view();themes();bgRows();render();toast('Copia importada ✓');
 }catch(x){toast('No se pudo importar: '+(x.message||x),1)}
};

/* ---------- Eventos y arranque ---------- */
$('#bView').onclick=()=>{const cur=sc(sec).view||M.view;setSec(sec,{view:VIEWS[(VIEWS.indexOf(cur)+1)%3]});view();snd('swap')};
$('#bSet').onclick=()=>{$('#st').textContent='';sync();themes();bgRows();secUI();actsUI();showLog();show('#ds')};
$('#dc').onclick=()=>show('#ds',false);
$('#amc').onclick=()=>show('#am',false);
$('#ame').onclick=()=>{show('#am',false);edit(curG)};
$('#amd').onclick=()=>{show('#am',false);rm(curG)};
$('#bAdd').onclick=()=>edit(null);
$('#q').oninput=render;

/* ---------- Carrusel estilo Xbox 360 ---------- */
let raf=0;
function centerCard(c){const l=$('#lib');l.scrollTo({left:c.offsetLeft+c.offsetWidth/2-l.clientWidth/2,behavior:S.anim?'smooth':'auto'})}
const cvOf=c=>c.querySelector('.cv');
function tap(g,c){
 const car=$('#lib').className==='v-car',cen=c.classList.contains('cen');
 if(car&&!cen){centerCard(c);snd('swap');return}
 if(c.classList.contains('plock'))return;
 if(c.classList.contains('flip')){const v=c.querySelector('video');if(v&&v.paused){v.play().catch(()=>{});return}}
 if(g.prev&&imgs[g.prev]&&(car||c.classList.contains('flip'))){
  if(c._tm){clearTimeout(c._tm);c._tm=0;flipCard(g,c);return}
  c._tm=setTimeout(()=>{c._tm=0;c.classList.contains('flip')?flipCard(g,c):launch(g,c)},300);return}
 launch(g,c)}
function cleanVid(c){const v=c.querySelector('video');if(v){v.pause();v.removeAttribute('src');v.remove()}c.querySelectorAll('.sb,.lkp').forEach(x=>x.remove())}
function endFlip(c){
 if(S.flip3){c.classList.remove('flip','plock');setTimeout(()=>{if(!c.classList.contains('flip'))cleanVid(c)},800);return}
 const cv=cvOf(c);cv.classList.add('fx');setTimeout(()=>cv.classList.remove('fx'),500);setTimeout(()=>{c.classList.remove('flip','plock');cleanVid(c)},220)}
function flipCard(g,c,auto){
 if(c.classList.contains('flip'))return endFlip(c);
 if(!g.prev||!imgs[g.prev])return;
 const f3=S.flip3,box=f3?c.querySelector('.pvb'):cvOf(c);
 box.querySelectorAll('video,.sb,.lkp').forEach(x=>x.remove());
 if(!f3){box.classList.add('fx');setTimeout(()=>box.classList.remove('fx'),500)}
 const v=h('video',{loop:'',playsinline:'',autoplay:'',preload:'auto'});v.loop=true;v.muted=!!auto||!S.psound;v.playsInline=true;v.src=imgs[g.prev];box.append(v);
 const go=()=>v.play().catch(()=>{});
 v.addEventListener('pause',()=>{if(v.isConnected&&c.classList.contains('flip')&&!v.ended)setTimeout(go,60)});
 v.addEventListener('ended',()=>{v.currentTime=0;go()});
 v.addEventListener('canplay',go,{once:true});
 const ka=setInterval(()=>{if(!v.isConnected){clearInterval(ka);return}if(c.classList.contains('flip')&&v.paused)go()},1000);
 const b=h('button',{class:'sb','aria-label':'Sonido',onclick:e=>{e.stopPropagation();v.muted=!v.muted;setIc(b,v.muted?'mute':'volume');go()}});setIc(b,v.muted?'mute':'volume');
 const lk=h('button',{class:'lk lkp','aria-label':'Bloquear',onclick:e=>{e.stopPropagation();const on=!c.classList.contains('plock');c.classList.toggle('plock',on);setIc(lk,on?'lock':'unlock');lk.setAttribute('aria-label',on?'Desbloquear':'Bloquear')}});setIc(lk,'unlock');
 box.append(b,lk);
 go();setTimeout(()=>{if(v.paused)go()},700);
 if(f3)c.classList.add('flip');else setTimeout(()=>c.classList.add('flip'),220);
}
function launch(g,c){
 if(!c||S.lfx==='none'||RM.matches||!S.anim){play(g);return}
 if(busy)return;
 let m=S.lfx;
 if(m==='hole'||m==='dust'){
  if(['web','online','video'].includes(g.type||'psp'))m='zoom';
  else{busy=true;setTimeout(()=>{busy=false},S.bhd*100+1500);snd('swap');(m==='hole'?holeFall:dustFall)(g,c,S.bhd/10);return}}
 snd('swap');c.classList.add('go','go-'+m);
 setTimeout(()=>{c.classList.remove('go','go-'+m);play(g)},430)}
const pvsync=g=>{$('#pvn').textContent=pS.file?pS.file.name:(g&&g.prev&&!pS.clear?'Video de presentación guardado ✓':'')};
let cm=[],cw=0,lastCi=-1,apT=0;
function setCmp(){const car=$('#lib').className==='v-car',a=$('#app');a.classList.toggle('cmp',!!(S.compact&&car&&curKey!=='V'));a.classList.toggle('big',!!(S.bigt&&car&&curKey!=='V'))}
function fitText(el,base,min){el.style.fontSize=base+'px';let f=base;while(el.scrollWidth>el.clientWidth+1&&f>min){f-=.5;el.style.fontSize=f+'px'}}
function fitAll(cs){cs.forEach(c=>{const b=c.querySelector('.inf b'),t=c.querySelector('.tag');if(b)fitText(b,S.tsize,8);if(t)fitText(t,11,7)})}
function applyCar(){
 setCmp();
 const l=$('#lib'),cs=[...l.children].filter(c=>c.classList.contains('card'));
 if(l.className!=='v-car'){l.style.paddingLeft=l.style.paddingRight=l.style.paddingTop=l.style.paddingBottom='';l.parentElement.style.overflowY='';cs.forEach(c=>{c.style.transform='';c.style.boxShadow='';c.style.zIndex='';c.style.removeProperty('--dim');c.classList.remove('cen')});cm=[];fitAll(cs);return}
 if(!cs.length){cm=[];return}
 const m=l.parentElement,base=m.clientWidth-32,availH=$('#app').clientHeight-m.offsetTop-10,Z=S.czoom/100;
 let w=Math.max(80,Math.min(base*.46,S.ccover*1.15));
 const setW=x=>l.style.setProperty('--cw',x+'px');
 setW(w);m.style.overflowY='hidden';
 for(let i=0;i<3;i++){const need=cs[0].offsetHeight*Z+14;if(need<=availH||w<=80)break;w=Math.max(80,w*availH/need*.98);setW(w)}
 cw=w;
 const ph=Math.ceil(cs[0].offsetHeight*(Z-1)/2)+7;l.style.paddingTop=l.style.paddingBottom=ph+'px';
 const pad=Math.max(16,(m.clientWidth-cw)/2)+'px';
 if(l.style.paddingLeft!==pad){l.style.paddingLeft=pad;l.style.paddingRight=pad}
 cm=cs.map(c=>({c,x:c.offsetLeft+cw/2,v:0,cn:false}));fitAll(cs);lastCi=-1;carFrame();
 const bt=$('#bigt');if($('#app').classList.contains('big'))fitText(bt,S.tfs,12);
}
function carFrame(){
 const l=$('#lib');if(!cm.length||l.className!=='v-car')return;
 const mid=l.scrollLeft+l.clientWidth/2,stp=cw*.85,Z=S.czoom/100,A=S.cang,D=S.cdim/100,T=S.edgeT;let best=0,bd=1e9;
 cm.forEach((o,i)=>{const t=(o.x-mid)/stp,at=Math.abs(t),c=o.c;
  if(at<bd){bd=at;best=i}
  if(at>3.2){if(o.v){c.style.transform='';c.style.boxShadow='';o.v=0}if(o.cn){o.cn=false;c.classList.remove('cen')}return}
  const a1=Math.min(at,1),a2=Math.max(0,Math.min(at-1,1)),isC=at<.5;o.v=1;
  c.style.transform=`perspective(700px) rotateY(${(-Math.max(-1,Math.min(1,t))*A).toFixed(1)}deg) scale(${(Z-(Z-.86)*a1-.1*a2).toFixed(3)})`;
  c.style.zIndex=Math.round(10-at*3);c.style.setProperty('--dim',(D*a1+.15*a2).toFixed(2));
  {const sx=(t<0?-1:1)*T*a1;c.style.boxShadow=!S.flip3&&T&&a1>.05?`${(sx*.55).toFixed(1)}px 0 4px #eef7fd, ${sx.toFixed(1)}px 0 0 #9fc7e8, var(--sh)`:''}
  if(isC!==o.cn){o.cn=isC;c.classList.toggle('cen',isC)}});
 if(best!==lastCi){const first=lastCi<0,c=cm[best].c;lastCi=best;
  document.querySelectorAll('.card.flip').forEach(x=>{if(x!==c)endFlip(x)});
  if(!first)snd('tick');
  const b=$('#bigt');b.textContent=c.dataset.n||'';if($('#app').classList.contains('big'))fitText(b,S.tfs,12);
  clearTimeout(apT);if(S.pdelay>0&&c._g&&c._g.prev)apT=setTimeout(()=>{if(cm[lastCi]&&cm[lastCi].c===c&&!c.classList.contains('flip'))flipCard(c._g,c,true)},S.pdelay*1000)}
}
$('#lib').addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;carFrame()})},{passive:true});
addEventListener('resize',()=>setTimeout(applyCar,60));
$('#pvf').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;pS={file:f,clear:false};pvsync(editing)};
$('#pvc').onclick=()=>{pS={file:null,clear:true};pvsync(editing)};
/* ---------- Iconos propios, candado del reproductor, agujero negro ---------- */
const IC={
 volume:'<path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
 mute:'<path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="m16 9 5 6M21 9l-5 6"/>',
 lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
 unlock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
 pin:'<path d="M12 16v5"/><path d="M9 3h6l-1 6 3 3H7l3-3-1-6z"/>',
 pinon:'<path d="M12 16v5"/><path d="M9 3h6l-1 6 3 3H7l3-3-1-6z" fill="currentColor"/>'};
function setIc(el,n){el.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+IC[n]+'</svg>'}
function plLock(on){const p=$('#pl'),v=$('#plv'),k=$('#plk');p.classList.toggle('locked',on);v.controls=!on;setIc(k,on?'lock':'unlock');k.setAttribute('aria-label',on?'Desbloquear pantalla':'Bloquear pantalla')}
$('#plk').onclick=()=>plLock(!$('#pl').classList.contains('locked'));
setIc($('#plk'),'unlock');
function holeFall(g,c,D){
 const a=$('#app'),r=c.getBoundingClientRect(),q=loc({clientX:r.left+r.width/2,clientY:r.top+r.height/2});
 const cw0=c.offsetWidth,ch0=c.offsetHeight,H=a.clientHeight,d0=Math.max(150,Math.min(320,cw0*1.25));
 const hx=q.x,hy=Math.min(q.y+ch0*.48+d0*.08,H-d0*.26),dx=hx-q.x,dy=hy-q.y;
 const bh=h('div',{class:'bh'});bh.style.width=bh.style.height=d0+'px';bh.style.left=hx+'px';bh.style.top=hy+'px';a.append(bh);
 const t0=performance.now(),dur=Math.max(800,D*1000),tr0=c.style.transform,z0=c.style.zIndex;
 c.style.zIndex=38;c.style.willChange='transform,opacity';
 const step=now=>{
  const p=Math.min(1,(now-t0)/dur),hk=p<.15?p/.15:p>.9?(1-p)/.1:1;
  bh.style.opacity=hk.toFixed(3);bh.style.transform=`translate(-50%,-50%) perspective(520px) rotateX(64deg) scale(${(.25+.75*hk).toFixed(3)})`;
  const f=Math.max(0,(p-.12)/.88),pos=f*f,sh=Math.pow(f,1.5);
  c.style.transform=`translate(${(dx*pos).toFixed(1)}px,${(dy*pos).toFixed(1)}px) perspective(700px) rotateX(${(sh*72).toFixed(1)}deg) rotateZ(${(f*f*230).toFixed(1)}deg) scale(${(1.1-1.06*sh).toFixed(3)})`;
  c.style.opacity=f>.82?String(Math.max(0,1-(f-.82)/.18)):'1';
  if(p<1)requestAnimationFrame(step);else{bh.remove();c.style.transform=tr0;c.style.opacity='';c.style.zIndex=z0;c.style.willChange='';play(g)}
 };
 requestAnimationFrame(step);
}

/* ---------- Polvo de partículas al iniciar ---------- */
let busy=false;
function dustFall(g,c,D){
 const a=$('#app'),W=a.clientWidth,H=a.clientHeight,d=Math.min(devicePixelRatio||1,2);
 const r=c.getBoundingClientRect(),q=loc({clientX:r.left+r.width/2,clientY:r.top+r.height/2}),k=$('#lib').className==='v-car'?S.czoom/100:1;
 const cw0=c.offsetWidth*k,ch0=c.offsetHeight*k,x0=q.x-cw0/2,y0=q.y-ch0/2;
 let px=null;try{const im=c.querySelector('.cv img');if(im&&im.complete){const sc=document.createElement('canvas');sc.width=16;sc.height=22;const sx=sc.getContext('2d');sx.drawImage(im,0,0,16,22);px=sx.getImageData(0,0,16,22).data}}catch{px=null}
 const PAL=[[90,169,255],[127,216,255],[155,123,255],[193,139,255],[77,224,255],[111,125,255]],N=S.perf==='lite'?220:480,P=[];
 for(let i=0;i<N;i++){
  const u=Math.random(),v=Math.random(),pal=PAL[Math.floor(Math.random()*PAL.length)];let col=pal;
  if(px){const o=(Math.floor(v*21)*16+Math.floor(u*15))*4;col=[(px[o]*.45+pal[0]*.55)|0,(px[o+1]*.45+pal[1]*.55)|0,(px[o+2]*.45+pal[2]*.55)|0]}
  P.push({sx:x0+u*cw0,sy:y0+v*ch0,col:col.join(','),dl:Math.random()*.35+(1-v)*.1,amp:(30+Math.random()*90)*(Math.random()<.5?-1:1),ph:Math.random()*6.28,sz:1.2+Math.random()*2.6});
 }
 const cv=document.createElement('canvas');cv.width=W*d;cv.height=H*d;cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:39';a.append(cv);
 const x=cv.getContext('2d');x.scale(d,d);
 const tx=W/2,ty=H-14,t0=performance.now(),dur=Math.max(800,D*1000);
 const step=now=>{
  const p=Math.min(1,(now-t0)/dur),cl=(v,a2=0,b2=1)=>Math.max(a2,Math.min(b2,v));
  c.style.opacity=String(Math.max(0,1-p/.45));
  x.clearRect(0,0,W,H);x.globalCompositeOperation='lighter';
  const gl=cl((p-.5)/.3)*(1-cl((p-.85)/.15));
  if(gl>0){const g2=x.createRadialGradient(tx,ty,0,tx,ty,90);g2.addColorStop(0,`rgba(140,150,255,${(.55*gl).toFixed(2)})`);g2.addColorStop(1,'rgba(140,150,255,0)');x.fillStyle=g2;x.fillRect(tx-100,ty-100,200,200)}
  for(const o of P){const t=cl((p-o.dl)/.65);if(t<=0)continue;
   const te=Math.pow(t,1.6),X=o.sx+(tx-o.sx)*te+Math.sin(te*7.5+o.ph)*o.amp*(1-te),Y=o.sy+(ty-o.sy)*te,al=Math.min(1,t*8)*(t>.8?(1-t)/.2:1),s2=o.sz*(1-.55*te);
   x.fillStyle=`rgba(${o.col},${al.toFixed(2)})`;x.fillRect(X-s2/2,Y-s2/2,s2,s2)}
  if(p<1)requestAnimationFrame(step);else{cv.remove();c.style.opacity='';play(g)}
 };
 requestAnimationFrame(step);
}
/* ---------- Fondo que reacciona al giro y al toque ---------- */
let curR=0,curW=0,curH=0;
const bgm={x:0,y:0,tx:0,ty:0,raf:0,ori:false,got:false,bx:null,by:null,px:0,py:0,asked:false};
const sheetOpen=()=>!!document.querySelector('.sheet.on');
function loc(e){const r=curR;return r===90?{x:e.clientY,y:curW-e.clientX}:r===-90?{x:curH-e.clientY,y:e.clientX}:r===180?{x:curW-e.clientX,y:curH-e.clientY}:{x:e.clientX,y:e.clientY}}
function onOri(e){
 if(!S.bgt||RM.matches)return;bgm.got=true;
 const g=e.gamma||0,b=e.beta||0,an=(((screen.orientation&&screen.orientation.angle)||window.orientation||0)%360+360)%360;
 let sx,sy;
 if(an===90){sx=b;sy=-g}else if(an===270){sx=-b;sy=g}else if(an===180){sx=-g;sy=-b}else{sx=g;sy=b}
 if(bgm.bx===null){bgm.bx=sx;bgm.by=sy}
 bgm.bx+=(sx-bgm.bx)*.01;bgm.by+=(sy-bgm.by)*.01;
 const amp=S.bgti/100*26,cl=v=>Math.max(-1,Math.min(1,v/25)),dx=-cl(sx-bgm.bx)*amp,dy=-cl(sy-bgm.by)*amp,th=-curR*Math.PI/180;
 bgm.tx=dx*Math.cos(th)-dy*Math.sin(th)+bgm.px;bgm.ty=dx*Math.sin(th)+dy*Math.cos(th)+bgm.py;
}
function motionStart(ask){
 const want=(S.bgt||S.bgtt)&&!RM.matches;
 if(!want){motionStop();return}
 if(S.bgt&&!bgm.ori){
  const go=()=>{window.addEventListener('deviceorientation',onOri);bgm.ori=true},DO=window.DeviceOrientationEvent;
  if(DO&&typeof DO.requestPermission==='function'){
   if(ask)DO.requestPermission().then(r=>{if(r==='granted')go();else{S.bgt=false;saveS();sync();toast('Sin permiso de movimiento: el fondo no reaccionará al giro.',1)}}).catch(()=>toast('No se pudo pedir el permiso de movimiento.',1));
   else go();
  }else go();
 }
 if(!S.bgt&&bgm.ori){window.removeEventListener('deviceorientation',onOri);bgm.ori=false}
 $('#bg').style.transform=`translate3d(${bgm.x.toFixed(1)}px,${bgm.y.toFixed(1)}px,0) scale(1.1)`;
 if(!bgm.raf)bgm.raf=requestAnimationFrame(mLoop);
}
function motionStop(){if(bgm.ori){window.removeEventListener('deviceorientation',onOri);bgm.ori=false}cancelAnimationFrame(bgm.raf);bgm.raf=0;bgm.tx=bgm.ty=bgm.px=bgm.py=0;bgm.x=bgm.y=0;$('#bg').style.transform=''}
function mLoop(){
 bgm.raf=requestAnimationFrame(mLoop);
 if(document.hidden)return;
 if(!S.bgt){bgm.tx=bgm.px;bgm.ty=bgm.py}
 const dx=bgm.tx-bgm.x,dy=bgm.ty-bgm.y;if(Math.abs(dx)<.05&&Math.abs(dy)<.05)return;
 bgm.x+=dx*.08;bgm.y+=dy*.08;$('#bg').style.transform=`translate3d(${bgm.x.toFixed(1)}px,${bgm.y.toFixed(1)}px,0) scale(1.1)`;
}
let pdn=false;
function touchPush(q){const amp=S.bgti/100*26;bgm.px=-(q.x-curW/2)/curW*amp;bgm.py=-(q.y-curH/2)/curH*amp}
function ripple(q){const r=h('div',{class:'rp'});r.style.left=q.x+'px';r.style.top=q.y+'px';$('#app').append(r);setTimeout(()=>r.remove(),750)}
document.addEventListener('pointerdown',e=>{
 if(S.bgt&&!bgm.got&&!bgm.asked){bgm.asked=true;motionStart(true)}
 if(!S.bgtt||RM.matches||sheetOpen())return;const q=loc(e);ripple(q);pdn=true;touchPush(q)},{capture:true,passive:true});
document.addEventListener('pointermove',e=>{if(pdn&&S.bgtt)touchPush(loc(e))},{passive:true});
const pup=()=>{pdn=false;bgm.px=bgm.py=0};
document.addEventListener('pointerup',pup,true);document.addEventListener('pointercancel',pup,true);

/* ---------- Música de fondo ---------- */
let AM=null,AUD=null;
const MUS=()=>(M.mu=M.mu||{on:false,vol:40,cur:'gen',tracks:[]});
function genStart(vol){
 try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume()}catch{return}
 const now=AC.currentTime,master=AC.createGain();master.gain.setValueAtTime(0,now);master.connect(AC.destination);
 const dly=AC.createDelay(2);dly.delayTime.value=.55;const fb=AC.createGain();fb.gain.value=.5;dly.connect(fb);fb.connect(dly);
 const wet=AC.createGain();wet.gain.value=.5;dly.connect(wet);wet.connect(master);
 const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1300;lp.Q.value=.3;lp.connect(master);lp.connect(dly);
 const CH=[[57,60,64,67],[53,57,60,64],[48,52,55,59],[55,59,62,66]],mf=n=>440*Math.pow(2,(n-69)/12);
 let ci=0;
 const chord=()=>{const t=AC.currentTime,c=CH[ci++%CH.length];
  c.forEach((n,i)=>{[0,1].forEach(k=>{const o=AC.createOscillator(),g=AC.createGain();o.type=k?'triangle':'sine';o.frequency.value=mf(n+(i===0?-12:0));o.detune.value=(Math.random()-.5)*14;
   g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(k?.025:.06,t+3.5);g.gain.linearRampToValueAtTime(0,t+10);o.connect(g);g.connect(lp);o.start(t);o.stop(t+10.5)})})};
 const bell=()=>{if(Math.random()<.45)return;const t=AC.currentTime,sc=[69,72,74,76,79,81],n=sc[Math.floor(Math.random()*sc.length)],o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=mf(n);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.02);g.gain.exponentialRampToValueAtTime(.0005,t+3.5);o.connect(g);g.connect(lp);o.start(t);o.stop(t+3.6)};
 chord();const i1=setInterval(chord,7500),i2=setInterval(bell,2300);
 master.gain.linearRampToValueAtTime(vol*.9,now+3);
 AM={master,stop(){clearInterval(i1);clearInterval(i2);try{master.gain.cancelScheduledValues(AC.currentTime);master.gain.setTargetAtTime(0,AC.currentTime,.25)}catch{}setTimeout(()=>{try{master.disconnect();lp.disconnect();dly.disconnect()}catch{}},1500)}};
}
function musicStop(){if(AM){AM.stop();AM=null}if(AUD){AUD.pause();try{URL.revokeObjectURL(AUD._u)}catch{}AUD.removeAttribute('src');AUD=null}}
function musicPlay(){
 const m=MUS();musicStop();m.on=true;lsSet('psp-m',M);
 if(m.cur==='gen'||!blobs[m.cur])genStart(m.vol/100);
 else{const u=URL.createObjectURL(blobs[m.cur]),a=new Audio(u);a._u=u;a.loop=true;a.volume=m.vol/100;a.play().catch(()=>toast('Toca ▶ para iniciar la música.',1));AUD=a}
 mpUI();
}
function musicVol(v){const m=MUS();m.vol=v;lsSet('psp-m',M);if(AM&&AC)AM.master.gain.setTargetAtTime(v/100*.9,AC.currentTime,.1);if(AUD)AUD.volume=v/100}
function useTrack(id){const m=MUS();m.cur=id;lsSet('psp-m',M);if(m.on)musicPlay();else mpUI()}
function musicNext(){const m=MUS(),ids=['gen',...m.tracks.filter(t=>blobs[t.id]).map(t=>t.id)];useTrack(ids[(Math.max(0,ids.indexOf(m.cur))+1)%ids.length])}
async function addTrack(e){const f=e.target.files[0];e.target.value='';if(!f)return;
 if(f.size>60e6)return toast('El audio pesa más de 60 MB.',1);
 try{const id='mu'+uid(),m=MUS();await put('images',{id,blob:f,aud:true});blobs[id]=f;m.tracks.push({id,name:f.name.replace(/\.[^.]+$/,'').slice(0,40)});m.cur=id;lsSet('psp-m',M);musicPlay();toast('Música añadida ✓')}catch(x){toast('No se pudo guardar el audio.',1)}}
async function delTrack(id){const m=MUS();try{await del('images',id)}catch{}delete blobs[id];m.tracks=m.tracks.filter(t=>t.id!==id);if(m.cur===id){m.cur='gen';if(m.on)musicPlay()}lsSet('psp-m',M);mpUI()}
function mpUI(){
 const m=MUS(),box=$('#mp'),tr=m.tracks.filter(t=>blobs[t.id]),nm=m.cur==='gen'?'Ambiente infinito (predeterminada)':((tr.find(t=>t.id===m.cur)||{}).name||'Ambiente infinito');
 const vol=h('input',{type:'range',min:'0',max:'100',value:String(m.vol),oninput:e=>musicVol(+e.target.value)});
 box.replaceChildren(
  h('div',{class:'mut'},'Sonando: '+nm),
  h('div',{class:'row'},h('button',{class:'pri',onclick:()=>{if(m.on){m.on=false;lsSet('psp-m',M);musicStop();mpUI()}else musicPlay()}},m.on?'⏸ Pausar':'▶ Reproducir'),h('button',{onclick:musicNext},'⏭ Cambiar')),
  h('label',{class:'row'},h('span',{},'Volumen'),vol),
  h('label',{class:'sec btn'},'＋ Subir mi música',h('input',{type:'file',accept:'audio/*',hidden:'',onchange:addTrack})),
  h('div',{class:'row'},h('span',{},'Ambiente infinito'),h('button',{onclick:()=>useTrack('gen')},m.cur==='gen'?'✓':'Usar')),
  ...tr.map(t=>h('div',{class:'row'},h('span',{},t.name),h('button',{onclick:()=>useTrack(t.id)},m.cur===t.id?'✓':'Usar'),h('button',{class:'dng',onclick:()=>delTrack(t.id)},'✕'))),
  h('p',{class:'mut'},'La música se pausa si sales de la app y vuelve con un toque. Tus canciones se guardan solo en este iPhone y no entran en la copia de seguridad.'));
}
document.addEventListener('pointerdown',()=>{const m=MUS();if(m.on&&!AM&&!AUD)musicPlay()},{once:true,capture:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)return;if(AC&&AC.state==='suspended'&&AM)AC.resume();if(AUD&&AUD.paused&&MUS().on)AUD.play().catch(()=>{})});

/* ---------- Menú rápido ☰ ---------- */
const recent=k=>{M.rk=[k,...(M.rk||[]).filter(x=>x!==k)].slice(0,12);lsSet('psp-m',M)};
function qpUI(){
 const pk=M.pk||[],rk=(M.rk||[]).filter(k=>!pk.includes(k)),keys=[...pk,...rk].slice(0,10);
 const rows=keys.map(k=>{const o=document.querySelector('#ds [data-k="'+k+'"]');if(!o)return null;
  const lab=o.closest('label'),name=lab?lab.firstChild.textContent:k,c=o.cloneNode(true);
  c.value=o.value;if(o.type==='checkbox')c.checked=o.checked;window.hook(c);
  const pinned=pk.includes(k),pb=h('button',{class:'ib'+(pinned?' on':''),'aria-label':pinned?'Desanclar':'Anclar',onclick:()=>{M.pk=pinned?pk.filter(x=>x!==k):[...pk,k];lsSet('psp-m',M);qpUI()}});setIc(pb,pinned?'pinon':'pin');
  const kids=[h('span',{},name)];
  if(o.type==='range'){const v=h('span',{class:'val'},o.value);c.addEventListener('input',()=>{v.textContent=c.value});kids.push(v)}
  kids.push(c,pb);return h('div',{class:'row'},...kids)}).filter(Boolean);
 $('#qr').replaceChildren(...(rows.length?rows:[h('p',{class:'mut'},'Aún no has cambiado ajustes. Los que cambies aparecerán aquí; fija con el icono de pin los que quieras tener siempre a mano.')]));
 sync();
}
$('#bMenu').onclick=()=>{sync();mpUI();qpUI();show('#qp')};
$('#qc').onclick=()=>show('#qp',false);
$('#qp').addEventListener('click',e=>{if(e.target===e.currentTarget)show('#qp',false)});
/* ---------- Modo privado ---------- */
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('gs:'+s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
function askPin(title){return new Promise(res=>{let v='';const pd=$('#pd'),pk=$('#pk'),fin=r=>{show('#pin',false);res(r)};
 $('#pt').textContent=title;const upd=()=>{pd.textContent='●'.repeat(v.length)+'○'.repeat(6-v.length)};upd();
 pk.replaceChildren(...[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k=>h('button',{onclick:()=>{if(k==='')return;if(k==='⌫')v=v.slice(0,-1);else if(v.length<6)v+=k;upd();if(v.length===6)setTimeout(()=>fin(v),140)}},String(k))));
 $('#px').onclick=()=>fin(null);show('#pin')})}
async function privEnter(){
 if(!(window.crypto&&crypto.subtle))return toast('Este navegador no permite crear el código de seguridad.',1);
 const h0=localStorage.getItem('psp-pin');
 if(!h0){const a=await askPin('Crea tu código de 6 dígitos');if(!a)return;const b=await askPin('Repite el código');if(!b)return;if(a!==b)return toast('Los códigos no coinciden.',1);localStorage.setItem('psp-pin',await sha(a))}
 else{const a=await askPin('Código del modo privado');if(!a)return;if(await sha(a)!==h0)return toast('Código incorrecto.',1)}
 priv=true;sec='rec';filter='';$('#q').value='';view();render();secUI();snd('swap');toast('Modo privado')}
function privExit(){priv=false;sec='all';filter='';$('#q').value='';show('#ds',false);show('#qp',false);show('#gf',false);view();render();secUI()}
$('#pinchg').onclick=async()=>{
 try{const h0=localStorage.getItem('psp-pin');
  if(h0){const a=await askPin('Código actual');if(!a)return;if(await sha(a)!==h0)return toast('Código incorrecto.',1)}
  const n1=await askPin('Nuevo código');if(!n1)return;const n2=await askPin('Repite el nuevo código');if(!n2)return;if(n1!==n2)return toast('Los códigos no coinciden.',1);
  localStorage.setItem('psp-pin',await sha(n1));toast('Código guardado ✓')}catch{toast('No se pudo guardar el código.',1)}};
$('#pinrst').onclick=async()=>{
 if(!confirm('¿Borrar TODOS los juegos privados y quitar el código? Esto no se puede deshacer.'))return;
 try{for(const g of games.filter(g=>g.priv)){await del('games',g.id);for(const id of [g.vfile,g.prev,g.cover&&g.cover.startsWith('img:')?g.cover.slice(4):'']){if(id){try{await del('images',id)}catch{}try{URL.revokeObjectURL(imgs[id])}catch{}delete imgs[id];delete blobs[id];isVid.delete(id)}}}
  games=games.filter(g=>!g.priv);localStorage.removeItem('psp-pin');M.secsP={};lsSet('psp-m',M);privExit();toast('Modo privado restablecido')}catch{toast('No se pudo restablecer.',1)}};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&priv&&S.plock)privExit()});
let tp;$('#ttl').addEventListener('pointerdown',()=>{tp=setTimeout(()=>{if(!priv)privEnter()},800)});
['pointerup','pointerleave','pointercancel'].forEach(ev=>$('#ttl').addEventListener(ev,()=>clearTimeout(tp)));
const showLog=()=>{$('#logv').textContent=LOG.join('\n')||'Sin errores registrados.'};
$('#logc').onclick=()=>navigator.clipboard.writeText(LOG.join('\n')).then(()=>toast('Registro copiado ✓')).catch(()=>toast('No se pudo copiar.',1));
$('#logx').onclick=()=>{LOG.length=0;try{localStorage.removeItem('psp-log')}catch{}showLog()};
$('#safe').onclick=()=>{Object.assign(S,{canim:'none',sfx:false,blur:0,animBg:false,perf:'lite',czoom:100,cang:20,pblur:0,flip3:false});saveS();sync();toast('Modo seguro activado ✓')};
document.addEventListener('visibilitychange',()=>{const v=$('#bg video');if(v&&document.hidden)v.pause()});


/* ---------- Tipos de elemento ---------- */
const CON=['nes','snes','n64','gbc','gba','nds'],ALLT=['psp','game','web','video','online',...CON],ALLIN=['psp','game','online',...CON];
const LG=['Enlace del juego o atajo','delta://game/…  o  shortcuts://run-shortcut?name=…'],LW=['Dirección de la página','https://…'];
const EG='Enlace no válido. Usa un enlace de app (esquema://…), por ejemplo delta://game/… o shortcuts://run-shortcut?name=…',EW='La dirección debe empezar por https://';
const LBL={psp:['Enlace profundo de PPSSPP','ppsspp://open?path=…'],game:['Atajo o enlace de la app','shortcuts://run-shortcut?name=…'],web:LW,online:LW,video:['Enlace del video (opcional si importas uno)','https://…']};
CON.forEach(k=>LBL[k]=LG);
const ERR={psp:'Enlace no válido. Debe empezar por ppsspp://open?path= (en PPSSPP usa «Copiar enlace profundo»).',game:'Enlace no válido. Usa shortcuts://run-shortcut?name=… u otro enlace de app (esquema://…).',web:EW,online:EW,video:'El enlace del video debe empezar por https://'};
CON.forEach(k=>ERR[k]=EG);
const okFor=(t,l)=>!l||(t==='psp'?okLink(l):(t==='game'||CON.includes(t))?/^[a-z][a-z0-9+.-]{1,30}:\/\/\S+$/i.test(l)&&!/^(javascript|data|file|blob):/i.test(l):/^https?:\/\/\S+$/i.test(l));

function tsync(g){const E=$('#fm').elements,t=E.type.value;$('#ll').textContent=LBL[t][0];E.link.placeholder=LBL[t][1];$('#vrow').hidden=t!=='video';$('#vname').textContent=vS.file?vS.file.name:(g&&g.vfile&&!vS.clear?'Video importado ✓':'')}
$('#fm').elements.type.onchange=()=>tsync(editing);
$('#vf').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;vS={file:f,clear:false};tsync(editing)};
const stamp=g=>{g.last=Date.now();put('games',g).catch(()=>{});if(sec==='rec')render()};
function player(src){const v=$('#plv');v.src=src;show('#pl');plLock(false);v.play().catch(()=>{})}
$('#plc').onclick=()=>{const v=$('#plv');plLock(false);v.pause();v.removeAttribute('src');v.load();show('#pl',false)};

/* ---------- Secciones ---------- */
const SK=['rec','all','game','online','web','video','psp','nes','n64','snes','gbc','gba','nds','priv'],SKP=['rec','video','web','online','game','psp','nes','snes','n64','gbc','gba','nds'],SD={rec:['Recientes','🕘'],all:['Todo','🏠'],game:['Juegos','📱'],online:['Juegos online','🌍'],web:['Web','🌐'],video:['Videos','🎬'],psp:['PSP','🎮'],nes:['Nintendo NES','🕹️'],n64:['Nintendo 64','🎲'],snes:['Super Nintendo','🎮'],gbc:['Game Boy Color','🟣'],gba:['Game Boy Advance','🔷'],nds:['Nintendo DS','📟'],priv:['Privado','🔒']};
let priv=false;
const SKM=()=>priv?SKP:SK,SCF=()=>priv?'secsP':'secs';
const sc=k=>{const x=((M[SCF()]||{})[k])||{};return{n:x.n||SD[k][0],e:x.e||SD[k][1],on:x.on!==false,view:x.view||''}};
const setSec=(k,p)=>{const f=SCF();M[f]=M[f]||{};M[f][k]={...(M[f][k]||{}),...p};lsSet('psp-m',M)};
function secUI(){
 $('#secrows').replaceChildren(h('p',{class:'mut'},priv?'Estás editando las secciones del modo privado.':'Aquí editas las secciones normales. Las del modo privado se editan estando dentro de él.'),...SKM().map(k=>{const c=sc(k),cb=h('input',{type:'checkbox',onchange:e=>{setSec(k,{on:e.target.checked});render()}});cb.checked=c.on;
  return h('div',{class:'sr'},h('input',{value:c.e,maxlength:'4',class:'se',oninput:e=>{setSec(k,{e:e.target.value});render()}}),h('input',{value:c.n,maxlength:'20',oninput:e=>{setSec(k,{n:e.target.value});render()}}),
   h('select',{onchange:e=>{setSec(k,{view:e.target.value});view()}},...[['','Vista global'],['list','Lista'],['grid','Cuadrícula'],['car','Carrusel']].map(([v,l])=>{const o=h('option',{value:v},l);if(v===c.view)o.selected=true;return o})),cb)}));
}
function cleanSecs(x){const o={},s=v=>typeof v==='string'?v:'';if(x&&typeof x==='object')for(const k of Object.keys(SD)){const c=x[k];if(c&&typeof c==='object')o[k]={n:s(c.n).slice(0,20),e:s(c.e).slice(0,4),on:c.on!==false,view:VIEWS.includes(c.view)?c.view:''}}return o}

/* ---------- Acciones en cadena (botón ⚡) ---------- */
const AT={theme:'Aplicar tema',orient:'Orientación',wait:'Esperar',bg:'Recargar fondo'};
const defActs=()=>[{t:'theme',v:''},{t:'orient',v:'hi'},{t:'wait',v:700},{t:'orient',v:'h'},{t:'bg',v:''}];
const acts=()=>Array.isArray(M.acts)?M.acts:(M.acts=defActs());
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function cleanActs(x){return Array.isArray(x)?x.filter(a=>a&&AT[a.t]).slice(0,12).map(a=>({t:a.t,v:a.t==='wait'?Math.min(Math.max(+a.v||0,0),5000):typeof a.v==='string'?a.v.slice(0,40):''})):defActs()}
const opt=(v,l,sel)=>{const o=h('option',{value:v},l);if(sel)o.selected=true;return o};
async function actsUI(){
 const TL=(await all('themes').catch(()=>[])).map(t=>t.id),A=acts(),sv=()=>lsSet('psp-m',M);
 $('#acts').replaceChildren(...A.map((a,i)=>{
  const ts=h('select',{onchange:e=>{a.t=e.target.value;a.v=a.t==='wait'?700:'';sv();actsUI()}},...Object.entries(AT).map(([k,l])=>opt(k,l,k===a.t)));
  const list=a.t==='theme'?[['','— elegir tema —'],...TL.map(x=>[x,x])]:a.t==='orient'?[['auto','Automático'],['v','Vertical'],['h','Horizontal'],['hi','Horizontal invertido']]:null;
  const vc=a.t==='wait'?h('input',{type:'number',min:'0',max:'5000',step:'100',value:String(a.v),oninput:e=>{a.v=Math.min(Math.max(+e.target.value||0,0),5000);sv()}}):list?h('select',{onchange:e=>{a.v=e.target.value;sv()}},...list.map(([v,l])=>opt(v,l,v===a.v))):h('span',{class:'mut'},'—');
  return h('div',{class:'row'},ts,vc,h('button',{class:'dng',onclick:()=>{A.splice(i,1);sv();actsUI()}},'✕'))}));
}
let running=false;
async function runActs(){
 if(running)return;running=true;
 try{for(const a of acts()){
  if(a.t==='theme'&&a.v){const t=(await all('themes')).find(x=>x.id===a.v);if(t)await useTheme(t)}
  else if(a.t==='orient'){S.orient=a.v;saveS()}
  else if(a.t==='wait')await sleep(a.v);
  else if(a.t==='bg'){lastBg=null;apply()}
 }toast('Acciones listas ✓')}catch(e){toast('No se pudo completar la cadena.',1)}
 running=false;
}
$('#actadd').onclick=()=>{acts().push({t:'orient',v:'h'});lsSet('psp-m',M);actsUI()};
$('#actrun').onclick=runActs;
$('#actreset').onclick=()=>{M.acts=defActs();lsSet('psp-m',M);actsUI()};
let lp=0,pressT;const bA=$('#bAct');
bA.addEventListener('pointerdown',()=>{lp=0;pressT=setTimeout(()=>{lp=1;$('#bSet').click();$('#tabs button[data-t=acc]').click()},650)});
['pointerup','pointerleave','pointercancel'].forEach(ev=>bA.addEventListener(ev,()=>clearTimeout(pressT)));
bA.onclick=()=>{if(lp){lp=0;return}runActs()};

/* ---------- Al volver a la app: recalcular tamaño y recargar fondos ---------- */
function resume(){Object.keys(blobs).forEach(id=>{if(id.slice(0,2)==='mu')return;try{URL.revokeObjectURL(imgs[id])}catch{}imgs[id]=URL.createObjectURL(blobs[id])});lastBg=null;orient();apply()}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(resume,120)});
addEventListener('pageshow',()=>setTimeout(resume,120));

/* ---------- Sonidos (generados por código) ---------- */
let AC,sct;document.addEventListener('pointerdown',()=>{try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume()}catch{}},{once:true,capture:true});
function snd(t){
 if(!S.sfx||!S.vol)return;
 try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume();
  const P={soft:['sine',520,780],glass:['triangle',1175,1760],arcade:['square',330,660]}[S.pack]||['sine',520,780],o=AC.createOscillator(),g=AC.createGain(),n=AC.currentTime,sw=t==='swap';
  o.type=P[0];o.frequency.setValueAtTime(P[1]*(t==='tick'?1.5:1),n);if(sw)o.frequency.exponentialRampToValueAtTime(P[2],n+.14);
  g.gain.setValueAtTime(0,n);g.gain.linearRampToValueAtTime(S.vol/100*(P[0]==='square'?.06:.14),n+.01);g.gain.exponentialRampToValueAtTime(.0001,n+(sw?.18:.07));
  o.connect(g).connect(AC.destination);o.start(n);o.stop(n+.2);
 }catch{}
}
document.addEventListener('pointerdown',e=>{if(e.target.closest&&e.target.closest('button,label.btn,summary'))snd('tap')},true);


document.addEventListener('pointerdown',()=>{const v=$('#bg video');if(v&&v.paused&&!RM.matches)v.play().catch(()=>{})});
(async()=>{
 try{await openDB();games=await all('games');(await all('images')).forEach(i=>{if(i.blob){blobs[i.id]=i.blob;if(!i.aud){if(!i.img)isVid.add(i.id);imgs[i.id]=URL.createObjectURL(i.blob)}}else imgs[i.id]=i.data})}
 catch(e){toast('Este navegador no permite guardar datos (¿modo privado?). Los cambios no se conservarán.',1)}
 try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch{}
 if(!S.pdv)S.pdelay=5;if((S.pdv||0)<2){S.pdv=2;S.psound=true;lsSet('psp-s',S)}
 bind();orient();apply();head();view();render();motionStart(false);[0,250,800,2000].forEach(ms=>setTimeout(orient,ms));
 if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
