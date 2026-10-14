'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const h=(t,a={},...c)=>{const e=document.createElement(t);for(const k in a){if(k.startsWith('on'))e[k]=a[k];else e.setAttribute(k,a[k])}e.append(...c.flat().filter(x=>x!=null&&x!==false));return e};
const BGK=['bgImg','bgV','bgH','bgHI'];
const DEF={mode:'dark',primary:'#7c5cff',secondary:'#19c6e6',bg:'#0b0d14',bgImg:'',bgV:'',bgH:'',bgHI:'',orient:'auto',overlay:35,blur:12,glass:55,cover:150,radius:18,shadow:30,gap:14,font:'system',anim:true,animBg:false};
const FONTS={system:'-apple-system,system-ui,sans-serif',rounded:'ui-rounded,"SF Pro Rounded",system-ui,sans-serif',serif:'ui-serif,Georgia,serif',mono:'ui-monospace,Menlo,monospace'};
const PRE={dark:'#0b0d14',light:'#f1f3f9'},VIEWS=['list','grid','car'],ICON={list:'☰',grid:'▦',car:'◫'},ORI=['auto','v','h','hi'];
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const ls=(k,d)=>{try{return{...d,...JSON.parse(localStorage.getItem(k))}}catch{return{...d}}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const RM=matchMedia('(prefers-reduced-motion: reduce)');
let db,games=[],imgs={},isVid=new Set(),S=ls('psp-s',DEF),M=ls('psp-m',{title:'PSP Universe',sub:'Mi biblioteca de PSP',view:'grid'}),filter='',editing=null,cs={data:null,clear:false},tt,curKey='V',lastBg=null;

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
 const W=innerWidth,H=innerHeight,land=W>H,o=S.orient;let r=0;
 if(o==='v')r=land?90:0;else if(o==='h')r=land?0:90;else if(o==='hi')r=land?180:-90;
 const a=$('#app'),sw=r===90||r===-90;
 a.style.width=(sw?H:W)+'px';a.style.height=(sw?W:H)+'px';
 a.style.transform=r===90?`translate(${W}px,0) rotate(90deg)`:r===-90?`translate(0,${H}px) rotate(-90deg)`:r===180?`translate(${W}px,${H}px) rotate(180deg)`:'none';
 a.className=r?'rx':'r0';
 const k=o==='v'?'V':o==='h'?'H':o==='hi'?'HI':land?'H':'V';
 if(k!==curKey){curKey=k;apply()}
 $$('#seg button').forEach(b=>b.classList.toggle('on',b.dataset.o===o));
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
 set('--onp',(.299*(p>>16)+.587*(p>>8&255)+.114*(p&255))/255>.6?'#111':'#fff');
 const id=bgId();
 document.body.classList.toggle('noanim',!t.anim);document.body.classList.toggle('animbg',t.animBg&&!imgs[id]);
 if(id!==lastBg){lastBg=id;bgRender(id)}
 $('meta[name=theme-color]').content=t.bg;
}
const saveS=()=>{lsSet('psp-s',S);apply();orient()};
const sync=()=>$$('[data-k]').forEach(el=>el[el.type==='checkbox'?'checked':'value']=S[el.dataset.k]);
function bind(){
 $$('[data-k]').forEach(el=>{const k=el.dataset.k,c=el.type==='checkbox';el.oninput=()=>{S[k]=c?el.checked:el.type==='range'?+el.value:el.value;if(k==='bg')S.mode='custom';if(k==='mode'&&PRE[S.mode])S.bg=PRE[S.mode];saveS();sync()};el.onchange=()=>toast('Guardado ✓')});
 $$('[data-m]').forEach(el=>{el.value=M[el.dataset.m];el.oninput=()=>{M[el.dataset.m]=el.value;lsSet('psp-m',M);head()}});
 $$('#seg button').forEach(b=>b.onclick=()=>{S.orient=b.dataset.o;saveS();toast('Orientación guardada ✓')});
 $$('#tabs button').forEach(b=>b.onclick=()=>{$$('#tabs button').forEach(x=>x.classList.toggle('on',x===b));$$('[data-s]').forEach(s=>s.hidden=s.dataset.s!==b.dataset.t)});
 sync();
}
const head=()=>{$('#ttl').textContent=M.title;$('#sub').textContent=M.sub;document.title=M.title};
function view(){const v=VIEWS.includes(M.view)?M.view:'grid';$('#lib').className='v-'+v;$('#bView').textContent=ICON[v]}
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
  if(vid){if(f.size>80e6)throw new Error('El video pesa más de 80 MB. Recórtalo o comprímelo.');await put('images',{id,blob:f,vid:true});imgs[id]=URL.createObjectURL(f);isVid.add(id)}
  else{const d=await shrink(f,1600);await put('images',{id,data:d});imgs[id]=d}
  const old=S[k];S[k]=id;saveS();await gcBg(old);bgRows();toast('Fondo guardado ✓');
 }catch(x){toast(x.message||'No se pudo guardar el fondo.',1)}
}
async function clearBg(k){const old=S[k];S[k]='';saveS();await gcBg(old);bgRows();toast('Fondo quitado')}

/* ---------- Biblioteca ---------- */
function card(g){
 const src=cover(g),ini=[...g.name.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0])].join('').toUpperCase()||'?',fb=h('div',{class:'ini'},ini),cv=h('div',{class:'cv'});
 fb.style.setProperty('--hue',hue(g.name));
 if(src){const im=h('img',{src,alt:'',loading:'lazy'});im.onerror=()=>im.replaceWith(fb);cv.append(im)}else cv.append(fb);
 return h('article',{class:'card'},cv,
  h('div',{class:'inf'},h('b',{},g.name),g.cat?h('span',{class:'tag'},g.cat):null,g.note?h('small',{},g.note):null),
  h('div',{class:'act'},h('button',{class:'play',onclick:()=>play(g)},'▶ Abrir'),
   h('button',{class:'ib'+(g.fav?' on':''),'aria-label':'Favorito',onclick:()=>fav(g)},g.fav?'★':'☆'),
   h('button',{class:'ib','aria-label':'Editar',onclick:()=>edit(g)},'✎'),
   h('button',{class:'ib','aria-label':'Eliminar',onclick:()=>rm(g)},'🗑')));
}
function render(){
 const q=$('#q').value.trim().toLowerCase(),cats=[...new Set(games.map(g=>g.cat).filter(Boolean))].sort();
 if(filter&&filter!=='*'&&!cats.includes(filter))filter='';
 const chip=(l,v)=>h('button',{class:filter===v?'on':'',onclick:()=>{filter=v;render()}},l);
 $('#chips').replaceChildren(chip('Todos',''),chip('★ Favoritos','*'),...cats.map(c=>chip(c,c)));
 $('#cl').replaceChildren(...cats.map(c=>h('option',{value:c})));
 const L=games.filter(g=>(!q||(g.name+' '+g.cat+' '+g.note).toLowerCase().includes(q))&&(!filter||(filter==='*'?g.fav:g.cat===filter))).sort((a,b)=>a.name.localeCompare(b.name));
 $('#lib').replaceChildren(...(L.length?L.map(card):[h('div',{class:'empty'},h('span',{},'🎮'),games.length?'Ningún juego coincide con la búsqueda.':'Tu biblioteca está vacía.',games.length?null:h('div',{},h('button',{class:'pri',onclick:()=>edit(null)},'＋ Añadir mi primer juego')))]));
}
async function fav(g){g.fav=!g.fav;try{await put('games',g);render()}catch(e){g.fav=!g.fav;toast('No se pudo guardar.',1)}}
async function rm(g){
 if(!confirm(`¿Eliminar «${g.name}» de la biblioteca?\nSolo se borra este registro; tu ROM y tus partidas guardadas no se tocan.`))return;
 try{await del('games',g.id);if(g.cover&&g.cover.startsWith('img:')){await del('images',g.cover.slice(4));delete imgs[g.cover.slice(4)]}games=games.filter(x=>x.id!==g.id);render();toast('Juego eliminado de la biblioteca')}catch(e){toast('No se pudo eliminar.',1)}
}
function play(g){
 if(!g.link)return toast('Este juego no tiene enlace. Edítalo y pega el enlace profundo de PPSSPP.',1);
 if(!okLink(g.link))return toast('El enlace no es válido. Debe empezar por ppsspp://open?path=',1);
 let left=false;const f=()=>{if(document.hidden)left=true};document.addEventListener('visibilitychange',f);
 location.href=g.link;
 setTimeout(()=>{document.removeEventListener('visibilitychange',f);if(!left)toast('No se pudo abrir PPSSPP. Comprueba que está instalado y copia de nuevo el enlace profundo desde el juego (la ruta puede haber cambiado).',1)},2500);
}

/* ---------- Formulario ---------- */
const err=m=>{const e=$('#err');e.textContent=m;e.hidden=false};
function pv(){const E=$('#fm').elements,s=cs.data||(!cs.clear&&editing&&cover(editing))||E.curl.value.trim();$('#pv').replaceChildren(s&&/^(data:image|https?:)/.test(s)?h('img',{src:s,alt:''}):h('span',{},'Sin portada'))}
function edit(g){
 const f=$('#fm'),E=f.elements;f.reset();editing=g;cs={data:null,clear:false};$('#err').hidden=true;
 $('#ft').textContent=g?'Editar juego':'Añadir juego';
 E.gid.value=g?g.id:'';E.name.value=g?g.name:'';E.cat.value=g?g.cat:'';E.note.value=g?g.note:'';E.link.value=g?g.link:'';E.fav.checked=!!(g&&g.fav);
 E.curl.value=g&&/^https?:/.test(g.cover)?g.cover:'';pv();show('#gf');
}
$('#fm').onsubmit=async e=>{
 e.preventDefault();$('#err').hidden=true;
 const E=e.target.elements,name=E.name.value.trim(),link=E.link.value.trim(),url=E.curl.value.trim();
 if(!name)return err('Escribe un nombre.');
 if(link&&!okLink(link))return err('Enlace no válido. Debe empezar por ppsspp://open?path= (en PPSSPP usa «Copiar enlace profundo»).');
 if(url&&!/^https?:\/\/\S+$/i.test(url))return err('La URL de la portada debe empezar por https://');
 const old=editing,oc=old?old.cover:'',oldId=oc.startsWith('img:')?oc.slice(4):'';let cv=oc;
 try{
  if(cs.data){const id=uid();await put('images',{id,data:cs.data});imgs[id]=cs.data;cv='img:'+id}
  else if(url)cv=url;
  else if(cs.clear||!oldId)cv='';
  if(oldId&&cv!==oc){await del('images',oldId);delete imgs[oldId]}
  const g={id:old?old.id:uid(),name:name.slice(0,120),cat:E.cat.value.trim().slice(0,40),note:E.note.value.trim().slice(0,300),link,fav:E.fav.checked,cover:cv};
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
  else if(['primary','secondary','bg'].includes(k)){if(/^#[0-9a-f]{6}$/i.test(v))o[k]=v}
  else if(k==='font'){if(FONTS[v])o[k]=v}
  else if(k==='mode'){if(['dark','light','custom'].includes(v))o[k]=v}
  else if(k==='orient'){if(ORI.includes(v))o[k]=v}
  else if(BGK.includes(k)){if(ids.has(v))o[k]=v}
  else o[k]=v}
 return o;
}
function clean(d){
 if(!d||d.app!=='psp-universe'||!Array.isArray(d.games))throw new Error('No es una copia de PSP Universe.');
 if(d.games.length>2000)throw new Error('Demasiados juegos.');
 const s=x=>typeof x==='string'?x:'',okId=x=>/^[\w-]{1,40}$/.test(s(x));
 const im=(Array.isArray(d.images)?d.images:[]).filter(i=>i&&okId(i.id)&&/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s(i.data))&&i.data.length<6e6).map(i=>({id:i.id,data:i.data})),ids=new Set(im.map(i=>i.id));
 const gs=d.games.filter(g=>g&&okId(g.id)&&s(g.name).trim()).map(g=>{const c=s(g.cover);return{id:g.id,name:s(g.name).trim().slice(0,120),cat:s(g.cat).slice(0,40),note:s(g.note).slice(0,300),link:okLink(s(g.link))?g.link:'',fav:g.fav===true,cover:c.startsWith('img:')?(ids.has(c.slice(4))?c:''):/^https?:\/\/\S+$/i.test(c)?c:''}});
 const th=(Array.isArray(d.themes)?d.themes:[]).filter(t=>t&&s(t.id).trim()).slice(0,100).map(t=>({...cleanS(t,ids),id:s(t.id).trim().slice(0,40)}));
 const m=d.meta||{};
 return{games:gs,im,themes:th,S:cleanS(d.settings,ids),M:{title:s(m.title).slice(0,60)||'PSP Universe',sub:s(m.sub).slice(0,80),view:VIEWS.includes(m.view)?m.view:'grid'}};
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
$('#bView').onclick=()=>{M.view=VIEWS[(VIEWS.indexOf(M.view)+1)%3];lsSet('psp-m',M);view()};
$('#bSet').onclick=()=>{$('#st').textContent='';sync();themes();bgRows();show('#ds')};
$('#dc').onclick=()=>show('#ds',false);
$('#bAdd').onclick=()=>edit(null);
$('#q').oninput=render;
document.addEventListener('pointerdown',()=>{const v=$('#bg video');if(v&&v.paused&&!RM.matches)v.play().catch(()=>{})});
(async()=>{
 try{await openDB();games=await all('games');(await all('images')).forEach(i=>{if(i.blob){isVid.add(i.id);imgs[i.id]=URL.createObjectURL(i.blob)}else imgs[i.id]=i.data})}
 catch(e){toast('Este navegador no permite guardar datos (¿modo privado?). Los cambios no se conservarán.',1)}
 try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch{}
 bind();orient();apply();head();view();render();
 if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
