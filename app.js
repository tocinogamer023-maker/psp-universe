'use strict';
const LOG=(()=>{try{return JSON.parse(localStorage.getItem('psp-log'))||[]}catch{return[]}})();
function logE(m){LOG.push(new Date().toLocaleTimeString()+' '+String(m).slice(0,160));while(LOG.length>20)LOG.shift();try{localStorage.setItem('psp-log',JSON.stringify(LOG))}catch{}const el=document.getElementById('logv');if(el)el.textContent=LOG.join('\n')}
addEventListener('error',e=>logE((e.message||'error')+' @'+(e.lineno||'?')));
addEventListener('unhandledrejection',e=>logE('promesa: '+((e.reason&&e.reason.message)||e.reason)));
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const h=(t,a={},...c)=>{const e=document.createElement(t);for(const k in a){if(k.startsWith('on'))e[k]=a[k];else e.setAttribute(k,a[k])}e.append(...c.flat().filter(x=>x!=null&&x!==false));return e};
const BGK=['bgImg','bgV','bgH','bgHI'];
const DEF={mode:'dark',primary:'#7c5cff',secondary:'#19c6e6',bg:'#0b0d14',bgImg:'',bgV:'',bgH:'',bgHI:'',orient:'auto',overlay:35,blur:12,glass:55,cover:150,radius:18,shadow:30,gap:14,font:'system',anim:true,animBg:false,fit:'contain',ratio:'3/4',cbord:0,cbc:'#ffffff',bright:100,showCat:true,showNote:false,btn:'pill',tsize:14,pad:10,hsize:24,calign:'left',canim:'cascade',aspd:100,sfx:true,vol:40,pack:'soft',line:35,czoom:112,cang:38,cdim:45,bigt:true,tf:'system',tfs:26,tfc:'#ffffff',legib:60,perf:'full',ccover:190,edgeT:7,edgeC:'#ffffff',compact:true,pblur:10,pa:25,pdelay:0,psound:false,pdv:0,fx:true,fxn:14,fxo:60,fxi:true,lfx:'zoom'};
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
 set('--tf',FONTS[t.tf]||FONTS.system);set('--tfs',t.tfs+'px');set('--tfc',t.tfc);set('--pblur',t.pblur+'px');set('--pa',t.pa/100);
 set('--edgeC',t.edgeC);document.body.classList.toggle('lite',t.perf==='lite');document.body.classList.toggle('shownote',!!t.showNote);
 set('--onp',(.299*(p>>16)+.587*(p>>8&255)+.114*(p&255))/255>.6?'#111':'#fff');
 const id=bgId();
 document.body.classList.toggle('noanim',!t.anim);document.body.classList.toggle('animbg',t.animBg&&!imgs[id]);
 if(id!==lastBg){lastBg=id;bgRender(id)}
 $('meta[name=theme-color]').content=t.bg;
}
const saveS=()=>{lsSet('psp-s',S);apply();orient()};
const sync=()=>$$('[data-k]').forEach(el=>{el[el.type==='checkbox'?'checked':'value']=S[el.dataset.k];if(el._v)el._v.textContent=el.value});
function bind(){
 $$('[data-k]').forEach(el=>{const k=el.dataset.k,c=el.type==='checkbox';el.oninput=()=>{S[k]=c?el.checked:el.type==='range'?+el.value:el.value;if(k==='bg')S.mode='custom';if(k==='mode'&&PRE[S.mode])S.bg=PRE[S.mode];saveS();sync();if(k==='showCat'||k==='showNote')render();if(['czoom','cang','cdim','cover','gap'].includes(k))applyCar();if(k==='perf'||k.slice(0,2)==='fx')buildFx()};el.onchange=()=>toast('Guardado ✓')});
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
 await del('images',id);if(isVid.has(id))URL.revokeObjectURL(imgs[id]);delete imgs[id];isVid.delete(id);
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
 const art=h('article',{class:'card'},h('div',{class:'fl'},h('div',{class:'ff'},cv,inf),back),h('div',{class:'edge'}));
 art._g=g;art.dataset.n=g.name;cv.onclick=()=>tap(g,art);back.onclick=()=>tap(g,art);
 return art;
}
function render(){
 const q=$('#q').value.trim().toLowerCase(),inSec=g=>{const t=g.type||'psp';return sec==='rec'?g.last>0:sec==='all'?t==='psp'||t==='game':t===sec},base=games.filter(inSec),cats=[...new Set(base.map(g=>g.cat).filter(Boolean))].sort();
 if(filter&&filter!=='*'&&!cats.includes(filter))filter='';
 $('#secs').replaceChildren(...SK.filter(k=>sc(k).on||k===sec).map(k=>h('button',{class:sec===k?'on':'',onclick:()=>{sec=k;filter='';view();render();snd('swap')}},sc(k).e+' '+sc(k).n)));
 const chip=(l,v)=>h('button',{class:filter===v?'on':'',onclick:()=>{filter=v;render()}},l);
 $('#chips').replaceChildren(chip('Todas',''),chip('★ Favoritos','*'),...cats.map(c=>chip(c,c)));
 $('#cl').replaceChildren(...[...new Set(games.map(g=>g.cat).filter(Boolean))].sort().map(c=>h('option',{value:c})));
 let L=base.filter(g=>(!q||(g.name+' '+g.cat+' '+g.note).toLowerCase().includes(q))&&(!filter||(filter==='*'?g.fav:g.cat===filter)));
 L=sec==='rec'?L.sort((a,b)=>b.last-a.last).slice(0,30):L.sort((a,b)=>a.name.localeCompare(b.name));
 const msg=sec==='rec'?'Aún no has abierto nada.':games.length?'No hay nada aquí todavía.':'Tu biblioteca está vacía.';
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
 if(ty==='web'||ty==='video'){window.open(l,'_blank','noopener');return}
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
 E.curl.value=g&&/^https?:/.test(g.cover)?g.cover:'';E.type.value=g?(g.type||'psp'):(['psp','game','web','video'].includes(sec)?sec:'psp');vS={file:null,clear:false};pS={file:null,clear:false};tsync(g);pv();pvsync(g);show('#gf');
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
  const g={type:ty,last:old?old.last||0:0,vfile:vf,prev:pr,id:old?old.id:uid(),name:name.slice(0,120),cat:E.cat.value.trim().slice(0,40),note:E.note.value.trim().slice(0,300),link,fav:E.fav.checked,cover:cv};
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
  const ims=(await all('images')).filter(i=>!i.blob),skipped=isVid.size;
  const d={app:'psp-universe',v:2,date:new Date().toISOString(),meta:M,settings:S,games,themes:await all('themes'),images:ims};
  const blob=new Blob([JSON.stringify(d)],{type:'application/json'}),f=new File([blob],'psp-universe-copia.json',{type:'application/json'});
  if(skipped)toast('Aviso: los fondos de video no entran en la copia.');
  if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f]});return}catch(e){if(e.name==='AbortError')return}}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=f.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);toast('Copia exportada ✓');
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
  else if(k==='lfx'){if(['zoom','spin','flip','none'].includes(v))o[k]=v}
  else if(BGK.includes(k)){if(ids.has(v))o[k]=v}
  else o[k]=v}
 return o;
}
function clean(d){
 if(!d||d.app!=='psp-universe'||!Array.isArray(d.games))throw new Error('No es una copia de PSP Universe.');
 if(d.games.length>2000)throw new Error('Demasiados juegos.');
 const s=x=>typeof x==='string'?x:'',okId=x=>/^[\w-]{1,40}$/.test(s(x));
 const im=(Array.isArray(d.images)?d.images:[]).filter(i=>i&&okId(i.id)&&/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s(i.data))&&i.data.length<6e6).map(i=>({id:i.id,data:i.data})),ids=new Set(im.map(i=>i.id));
 const gs=d.games.filter(g=>g&&okId(g.id)&&s(g.name).trim()).map(g=>{const c=s(g.cover),ty=['psp','game','web','video'].includes(g.type)?g.type:'psp';return{type:ty,last:Number.isFinite(g.last)?g.last:0,id:g.id,name:s(g.name).trim().slice(0,120),cat:s(g.cat).slice(0,40),note:s(g.note).slice(0,300),link:okFor(ty,s(g.link))?g.link:'',fav:g.fav===true,cover:c.startsWith('img:')?(ids.has(c.slice(4))?c:''):/^https?:\/\/\S+$/i.test(c)?c:''}});
 const th=(Array.isArray(d.themes)?d.themes:[]).filter(t=>t&&s(t.id).trim()).slice(0,100).map(t=>({...cleanS(t,ids),id:s(t.id).trim().slice(0,40)}));
 const m=d.meta||{};
 return{games:gs,im,themes:th,S:cleanS(d.settings,ids),M:{title:s(m.title).slice(0,60)||'Game Space',sub:s(m.sub).slice(0,80),view:VIEWS.includes(m.view)?m.view:'grid',secs:cleanSecs(m.secs),acts:cleanActs(m.acts)}};
}
$('#imf').onchange=async e=>{
 const f=e.target.files[0];e.target.value='';if(!f)return;
 try{
  if(f.size>80e6)throw new Error('Archivo demasiado grande.');
  const d=clean(JSON.parse(await f.text()));
  if(!confirm(`Vas a REEMPLAZAR tu biblioteca actual (${games.length} juegos) por la copia (${d.games.length} juegos, ${d.im.length} imágenes). Tus fondos de video actuales se perderán.\n¿Continuar?`))return;
  for(const s of['games','images','themes'])await clr(s);
  for(const g of d.games)await put('games',g);for(const i of d.im)await put('images',i);for(const t of d.themes)await put('themes',t);
  isVid.forEach(id=>URL.revokeObjectURL(imgs[id]));isVid=new Set();
  games=d.games;imgs=Object.fromEntries(d.im.map(i=>[i.id,i.data]));S=d.S;M=d.M;lsSet('psp-s',S);lsSet('psp-m',M);
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
function tap(g,c){
 const car=$('#lib').className==='v-car',cen=c.classList.contains('cen');
 if(car&&!cen){centerCard(c);snd('swap');return}
 if(c.classList.contains('flip')){const v=c.querySelector('.pvb video');if(v&&v.paused){v.play().catch(()=>{});return}}
 if(g.prev&&imgs[g.prev]&&(car||c.classList.contains('flip'))){
  if(c._tm){clearTimeout(c._tm);c._tm=0;flipCard(g,c);return}
  c._tm=setTimeout(()=>{c._tm=0;c.classList.contains('flip')?flipCard(g,c):launch(g,c)},300);return}
 launch(g,c)}
function endFlip(c){c.classList.remove('flip');setTimeout(()=>{if(c.classList.contains('flip'))return;const v=c.querySelector('.pvb video');if(v){v.pause();v.removeAttribute('src');v.remove()}},750)}
function flipCard(g,c,auto){
 if(c.classList.contains('flip'))return endFlip(c);
 if(!g.prev||!imgs[g.prev])return;
 const box=c.querySelector('.pvb');box.replaceChildren();
 const v=h('video',{muted:'',loop:'',playsinline:'',autoplay:'',preload:'auto'});v.muted=!!auto||!S.psound;v.playsInline=true;v.src=imgs[g.prev];box.append(v);
 const go=()=>v.play().catch(()=>{});v.addEventListener('canplay',go,{once:true});go();setTimeout(()=>{if(v.paused)go()},700);
 c.classList.add('flip');
}
const pvsync=g=>{$('#pvn').textContent=pS.file?pS.file.name:(g&&g.prev&&!pS.clear?'Video de presentación guardado ✓':'')};
let cm=[],cw=0,lastCi=-1,apT=0;
function setCmp(){const car=$('#lib').className==='v-car',a=$('#app');a.classList.toggle('cmp',!!(S.compact&&car&&curKey!=='V'));a.classList.toggle('big',!!(S.bigt&&car&&curKey!=='V'))}
function fitText(el,base,min){el.style.fontSize=base+'px';let f=base;while(el.scrollWidth>el.clientWidth+1&&f>min){f-=.5;el.style.fontSize=f+'px'}}
function fitAll(cs){cs.forEach(c=>{const b=c.querySelector('.inf b'),t=c.querySelector('.tag');if(b)fitText(b,S.tsize,8);if(t)fitText(t,11,7)})}
function applyCar(){
 setCmp();
 const l=$('#lib'),cs=[...l.children].filter(c=>c.classList.contains('card'));
 if(l.className!=='v-car'){l.style.paddingLeft=l.style.paddingRight='';l.parentElement.style.overflowY='';cs.forEach(c=>{c.style.transform='';const ee=c.querySelector('.edge');if(ee)ee.style.display='none';c.style.zIndex='';c.style.removeProperty('--dim');c.classList.remove('cen')});cm=[];fitAll(cs);return}
 if(!cs.length){cm=[];return}
 const m=l.parentElement,[rw,rh]=S.ratio.split('/').map(Number),base=m.clientWidth-32,availH=$('#app').clientHeight-m.offsetTop-14;
 cw=Math.max(90,Math.min(base*.46,S.ccover*1.15,(availH-110)/(rh/rw)));
 l.style.setProperty('--cw',cw+'px');m.style.overflowY='hidden';
 const pad=Math.max(16,(m.clientWidth-cw)/2)+'px';
 if(l.style.paddingLeft!==pad){l.style.paddingLeft=pad;l.style.paddingRight=pad}
 cm=cs.map(c=>({c,x:c.offsetLeft+cw/2,v:0,cn:false,e:c.querySelector('.edge')}));fitAll(cs);lastCi=-1;carFrame();
 const bt=$('#bigt');if($('#app').classList.contains('big'))fitText(bt,S.tfs,12);
}
function carFrame(){
 const l=$('#lib');if(!cm.length||l.className!=='v-car')return;
 const mid=l.scrollLeft+l.clientWidth/2,stp=cw*.85,Z=S.czoom/100,A=S.cang,D=S.cdim/100,T=S.edgeT;let best=0,bd=1e9;
 cm.forEach((o,i)=>{const t=(o.x-mid)/stp,at=Math.abs(t),c=o.c;
  if(at<bd){bd=at;best=i}
  if(at>3.2){if(o.v){c.style.transform='';if(o.e)o.e.style.display='none';o.v=0}if(o.cn){o.cn=false;c.classList.remove('cen')}return}
  const a1=Math.min(at,1),a2=Math.max(0,Math.min(at-1,1)),isC=at<.5;o.v=1;
  c.style.transform=`perspective(700px) rotateY(${(-Math.max(-1,Math.min(1,t))*A).toFixed(1)}deg) scale(${(Z-(Z-.86)*a1-.1*a2).toFixed(3)})`;
  c.style.zIndex=Math.round(10-at*3);c.style.setProperty('--dim',(D*a1+.15*a2).toFixed(2));
  const e=o.e;if(e){if(T&&a1>.05){const th=(T*a1).toFixed(1);e.style.display='block';e.style.width=th+'px';if(t<0){e.style.left='-'+th+'px';e.style.right='auto'}else{e.style.right='-'+th+'px';e.style.left='auto'}}else e.style.display='none'}
  if(isC!==o.cn){o.cn=isC;c.classList.toggle('cen',isC)}});
 if(best!==lastCi){const first=lastCi<0,c=cm[best].c;lastCi=best;
  document.querySelectorAll('.card.flip').forEach(x=>{if(x!==c||first)endFlip(x)});
  if(!first)snd('tick');
  const b=$('#bigt');b.textContent=c.dataset.n||'';if($('#app').classList.contains('big'))fitText(b,S.tfs,12);
  clearTimeout(apT);if(S.pdelay>0&&c._g&&c._g.prev)apT=setTimeout(()=>{if(cm[lastCi]&&cm[lastCi].c===c&&!c.classList.contains('flip'))flipCard(c._g,c,true)},S.pdelay*1000)}
}
$('#lib').addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;carFrame()})},{passive:true});
addEventListener('resize',()=>setTimeout(applyCar,60));
$('#pvf').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;pS={file:f,clear:false};pvsync(editing)};
$('#pvc').onclick=()=>{pS={file:null,clear:true};pvsync(editing)};

/* ---------- Inicio de juego, cristales flotantes ---------- */
let curR=0,curW=0,curH=0,sh=[],fxRaf=0,fxT=0;
function launch(g,c){
 if(!c||S.lfx==='none'){play(g);return}
 snd('swap');c.classList.add('go','go-'+S.lfx);
 setTimeout(()=>{c.classList.remove('go','go-'+S.lfx);play(g)},430)}
function loc(e){const r=curR;return r===90?{x:e.clientY,y:curW-e.clientX}:r===-90?{x:curH-e.clientY,y:e.clientX}:r===180?{x:curW-e.clientX,y:curH-e.clientY}:{x:e.clientX,y:e.clientY}}
const NS='http://www.w3.org/2000/svg';
function shDraw(o){o.el.style.transform=`translate3d(${(o.x-o.s).toFixed(1)}px,${(o.y-o.s).toFixed(1)}px,0) rotate(${o.r.toFixed(1)}deg)`}
function buildFx(){
 const B=$('#fxb'),F=$('#fxf');B.replaceChildren();F.replaceChildren();sh=[];
 if(!S.fx||S.perf==='lite'||!S.fxn)return;
 const a=$('#app'),W=a.clientWidth||innerWidth,H=a.clientHeight||innerHeight;
 for(let i=0;i<Math.min(S.fxn,30);i++){
  const front=i%3===0,s=12+Math.random()*(front?30:48),k=3+Math.floor(Math.random()*3),pts=[];
  for(let j=0;j<k;j++){const an=j/k*6.283+Math.random()*.9,rr=s*(.45+Math.random()*.55);pts.push((s+Math.cos(an)*rr).toFixed(1)+','+(s+Math.sin(an)*rr).toFixed(1))}
  const el=document.createElementNS(NS,'svg'),p=document.createElementNS(NS,'polygon');
  el.setAttribute('width',s*2);el.setAttribute('height',s*2);el.classList.add('sd');p.setAttribute('points',pts.join(' '));el.append(p);
  el.style.opacity=((.35+Math.random()*.65)*S.fxo/100).toFixed(2);(front?F:B).append(el);
  const bx=(Math.random()-.5)*.35,by=(Math.random()-.5)*.35,o={el,p,s,x:Math.random()*W,y:Math.random()*H,vx:bx,vy:by,bx,by,r:Math.random()*360,vr:(Math.random()-.5)*.12,fz:false,drag:false};
  sh.push(o);shDraw(o);if(front&&S.fxi)bindShard(o);
 }
 if(!RM.matches&&!fxRaf)fxRaf=requestAnimationFrame(fxLoop);
}
function fxLoop(t){
 fxRaf=requestAnimationFrame(fxLoop);
 if(document.hidden||!sh.length){fxT=0;return}
 const dt=Math.min(40,t-(fxT||t))/16.7;fxT=t;const a=$('#app'),W=a.clientWidth,H=a.clientHeight;
 for(const o of sh){
  if(!o.drag){
   if(o.fz){o.vx*=.9;o.vy*=.9}else{o.vx+=(o.bx-o.vx)*.01*dt;o.vy+=(o.by-o.vy)*.01*dt;o.r+=o.vr*dt}
   o.x+=o.vx*dt;o.y+=o.vy*dt;const m=o.s*2;
   if(o.x<-m)o.x=W+m;else if(o.x>W+m)o.x=-m;if(o.y<-m)o.y=H+m;else if(o.y>H+m)o.y=-m}
  shDraw(o)}
}
function bindShard(o){
 const el=o.p;let q0=null,lx=0,ly=0,mv=0,lt=0;
 el.addEventListener('pointerdown',e=>{e.preventDefault();try{el.setPointerCapture(e.pointerId)}catch{}const q=loc(e);q0=q;lx=q.x;ly=q.y;mv=0;o.drag=true;o.vx=o.vy=0;lt=performance.now()});
 el.addEventListener('pointermove',e=>{if(!q0)return;const q=loc(e),n=performance.now(),d=Math.max(1,n-lt)/16.7;o.vx=(q.x-lx)/d;o.vy=(q.y-ly)/d;o.x+=q.x-lx;o.y+=q.y-ly;mv+=Math.abs(q.x-lx)+Math.abs(q.y-ly);lx=q.x;ly=q.y;lt=n});
 const up=()=>{if(!q0)return;q0=null;o.drag=false;
  if(mv<6){o.fz=!o.fz;if(o.fz){o.vx=o.vy=0}else{o.vx=o.bx;o.vy=o.by}}
  else{o.fz=false;o.vx=Math.max(-14,Math.min(14,o.vx));o.vy=Math.max(-14,Math.min(14,o.vy))}};
 el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
}
const showLog=()=>{$('#logv').textContent=LOG.join('\n')||'Sin errores registrados.'};
$('#logc').onclick=()=>navigator.clipboard.writeText(LOG.join('\n')).then(()=>toast('Registro copiado ✓')).catch(()=>toast('No se pudo copiar.',1));
$('#logx').onclick=()=>{LOG.length=0;try{localStorage.removeItem('psp-log')}catch{}showLog()};
$('#safe').onclick=()=>{Object.assign(S,{canim:'none',sfx:false,blur:0,animBg:false,perf:'lite',czoom:100,cang:20,pblur:0,fx:false});saveS();sync();buildFx();toast('Modo seguro activado ✓')};
document.addEventListener('visibilitychange',()=>{const v=$('#bg video');if(v&&document.hidden)v.pause()});


/* ---------- Tipos de elemento ---------- */
const LBL={psp:['Enlace profundo de PPSSPP','ppsspp://open?path=…'],game:['Atajo o enlace de la app','shortcuts://run-shortcut?name=…'],web:['Dirección de la página','https://…'],video:['Enlace del video (opcional si importas uno)','https://…']};
const ERR={psp:'Enlace no válido. Debe empezar por ppsspp://open?path= (en PPSSPP usa «Copiar enlace profundo»).',game:'Enlace no válido. Usa shortcuts://run-shortcut?name=… u otro enlace de app (esquema://…).',web:'La dirección debe empezar por https://',video:'El enlace del video debe empezar por https://'};
const okFor=(t,l)=>!l||(t==='psp'?okLink(l):t==='game'?/^[a-z][a-z0-9+.-]{1,30}:\/\/\S+$/i.test(l)&&!/^(javascript|data|file|blob):/i.test(l):/^https?:\/\/\S+$/i.test(l));
function tsync(g){const E=$('#fm').elements,t=E.type.value;$('#ll').textContent=LBL[t][0];E.link.placeholder=LBL[t][1];$('#vrow').hidden=t!=='video';$('#vname').textContent=vS.file?vS.file.name:(g&&g.vfile&&!vS.clear?'Video importado ✓':'')}
$('#fm').elements.type.onchange=()=>tsync(editing);
$('#vf').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;vS={file:f,clear:false};tsync(editing)};
const stamp=g=>{g.last=Date.now();put('games',g).catch(()=>{});if(sec==='rec')render()};
function player(src){const v=$('#plv');v.src=src;show('#pl');v.play().catch(()=>{})}
$('#plc').onclick=()=>{const v=$('#plv');v.pause();v.removeAttribute('src');v.load();show('#pl',false)};

/* ---------- Secciones ---------- */
const SK=['rec','all','psp','game','web','video'],SD={rec:['Recientes','🕘'],all:['Todo','🏠'],psp:['PSP','🎮'],game:['Juegos','📱'],web:['Web','🌐'],video:['Videos','🎬']};
const sc=k=>{const x=(M.secs||{})[k]||{};return{n:x.n||SD[k][0],e:x.e||SD[k][1],on:x.on!==false,view:x.view||''}};
const setSec=(k,p)=>{M.secs=M.secs||{};M.secs[k]={...(M.secs[k]||{}),...p};lsSet('psp-m',M)};
function secUI(){
 $('#secrows').replaceChildren(...SK.map(k=>{const c=sc(k),cb=h('input',{type:'checkbox',onchange:e=>{setSec(k,{on:e.target.checked});render()}});cb.checked=c.on;
  return h('div',{class:'sr'},h('input',{value:c.e,maxlength:'4',class:'se',oninput:e=>{setSec(k,{e:e.target.value});render()}}),h('input',{value:c.n,maxlength:'20',oninput:e=>{setSec(k,{n:e.target.value});render()}}),
   h('select',{onchange:e=>{setSec(k,{view:e.target.value});view()}},...[['','Vista global'],['list','Lista'],['grid','Cuadrícula'],['car','Carrusel']].map(([v,l])=>{const o=h('option',{value:v},l);if(v===c.view)o.selected=true;return o})),cb)}));
}
function cleanSecs(x){const o={},s=v=>typeof v==='string'?v:'';if(x&&typeof x==='object')for(const k of SK){const c=x[k];if(c&&typeof c==='object')o[k]={n:s(c.n).slice(0,20),e:s(c.e).slice(0,4),on:c.on!==false,view:VIEWS.includes(c.view)?c.view:''}}return o}

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
function resume(){Object.keys(blobs).forEach(id=>{try{URL.revokeObjectURL(imgs[id])}catch{}imgs[id]=URL.createObjectURL(blobs[id])});lastBg=null;orient();apply()}
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
 try{await openDB();games=await all('games');(await all('images')).forEach(i=>{if(i.blob){isVid.add(i.id);blobs[i.id]=i.blob;imgs[i.id]=URL.createObjectURL(i.blob)}else imgs[i.id]=i.data})}
 catch(e){toast('Este navegador no permite guardar datos (¿modo privado?). Los cambios no se conservarán.',1)}
 try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch{}
 if(!S.pdv){S.pdv=1;S.pdelay=5;lsSet('psp-s',S)}
 bind();orient();apply();head();view();render();buildFx();[0,250,800,2000].forEach(ms=>setTimeout(orient,ms));
 if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
