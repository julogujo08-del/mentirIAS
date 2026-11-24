import{initializeApp}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import{getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,signInWithPopup,GoogleAuthProvider,signOut,sendPasswordResetEmail,sendEmailVerification,fetchSignInMethodsForEmail}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import{getFirestore,doc,getDoc,getDocs,setDoc,updateDoc,deleteDoc,addDoc,collection,query,where,onSnapshot,increment,deleteField}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import cfg from"./firebase-config.js";
const sec=initializeApp(cfg,'sec'),secAuth=getAuth(sec),app=initializeApp(cfg),auth=getAuth(app),db=getFirestore(app);
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const S={me:null,users:[],reqs:[],msgs:[],notifs:[],rats:[],grades:[],chats:[],helps:[],tombs:[],view:'',chat:null,replyHelp:null,q:'',cm:0,ready:false,sesTab:'all',sesStatus:'',helpCat:'',helpTab:'all'},AV=['MENT.png','M.png','MENTORI.jpg','V.png'];
const DAYS=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const MENU={student:[['home','Inicio'],['mentors','Explorar mentores'],['mine','Mis asesorías'],['help','Muro de Ayuda'],['meet','Clases en Meet'],['chat','Mis conversaciones'],['notif','Notificaciones'],['profile','Mi perfil']],
mentor:[['home','Inicio'],['help','Muro de Ayuda'],['meet','Clases en Meet'],['reqs','Solicitudes'],['chat','Mis conversaciones'],['cal','Mi cronograma'],['avail','Disponibilidad'],['profile','Mi perfil']],
admin:[['dash','Dashboard'],['students','Estudiantes'],['mentors','Mentores'],['reqs','Solicitudes'],['reports','Reportes'],['help','Muro de Ayuda'],['trash','Eliminados'],['cfg','Control del sitio']]};
let delHelps=new Set(JSON.parse(localStorage.getItem('del_helps')||'[]')),delUsers=new Set(JSON.parse(localStorage.getItem('del_users')||'[]'));
const userExists=id=>{if(!id||delUsers.has(id)||(S.tombs||[]).some(t=>t.id===id))return false;const u=S.users.find(x=>x.id===id);if(u)return u.active!==false&&!u.deleted;return S.me?.id===id};
const ini=u=>(u?.name||'?').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
const av=(u,s=40)=>{const photo=u&&u.photo?cleanPhotoUrl(u.photo):'';if(photo)return `<img class=av src="${esc(photo)}" style="width:${s}px;height:${s}px;object-fit:cover" alt="${esc(u?.name||'')}" onerror="this.onerror=null;this.src='avatars/MENT.png'">`;return `<span class=av style="width:${s}px;height:${s}px">${ini(u||{})}</span>`};
const U=id=>(id&&userExists(id)&&S.users.find(u=>u.id===id))||{name:'Usuario no disponible'};
const toast=(t,e)=>{const d=document.createElement('div');d.textContent=t;if(e)d.className='e';$('#toast').append(d);setTimeout(()=>d.remove(),3500)};
const modal=h=>{const m=$('#modal');m.innerHTML=`<div>${h}</div>`;m.hidden=false};const close=()=>$('#modal').hidden=true;
const ERR={'auth/invalid-credential':'Correo o contraseña incorrectos.','auth/email-already-in-use':'Ese correo ya está registrado.','auth/weak-password':'La contraseña debe tener al menos 6 caracteres.','auth/invalid-email':'El correo electrónico no es válido.','auth/network-request-failed':'Error de conexión.','auth/operation-not-allowed':'Activa el método Google en Firebase > Authentication > Método de acceso.','auth/unauthorized-domain':'Este dominio no está autorizado: agrégalo en Firebase > Authentication > Configuración > Dominios autorizados.','auth/popup-blocked':'El navegador bloqueó la ventana de Google. Permite ventanas emergentes.','auth/popup-closed-by-user':'Cerraste la ventana de Google antes de terminar.','auth/cancelled-popup-request':'Se canceló la ventana de Google. Inténtalo de nuevo.','permission-denied':'No tienes permiso para esta acción.'};
const T=async f=>{try{await f()}catch(e){toast(ERR[e.code]||ERR[e.message]||'Error: '+(e.code||e.message),1)}};
const arr=s=>String(s||'').split(',').map(x=>x.trim()).filter(Boolean);
const chips=a=>(a||[]).map(x=>`<span class=chip>${esc(x)}</span>`).join('');
const fdate=d=>d?new Date(d+'T00:00').toLocaleDateString('es',{day:'numeric',month:'short',year:'numeric'}):'';
const ago=t=>new Date(t).toLocaleString('es',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const stB=s=>({PENDIENTE:'y',ACEPTADA:'g',RECHAZADA:'r',Confirmada:'g',Pendiente:'y',Finalizada:'',Cancelada:'r'}[s]??'');
const rating=id=>{const r=S.rats.filter(x=>x.mentor===id);return r.length?{v:(r.reduce((a,x)=>a+x.value,0)/r.length).toFixed(1),n:r.length}:null};
const starIcons=val=>{const full=Math.round(Number(val)||0);let s='';for(let i=1;i<=10;i++){s+=`<span style="color:${i<=full?'#f59e0b':'#cbd5e1'};font-size:12px">★</span>`}return s};
const stars=id=>{const r=rating(id);if(r){return `<span style="display:inline-flex;gap:4px;align-items:center;background:#fef3c7;padding:3px 9px;border-radius:12px;border:1px solid #fde68a" title="Calificación: ${r.v} de 10 estrellas (${r.n} evaluaciones)"><span style="color:#f59e0b;font-size:13px">⭐</span><b style="color:#b45309;font-size:12.5px">${r.v}/10</b><small style="color:#92400e;font-size:11px">(${r.n})</small></span>`}return `<span style="display:inline-flex;gap:4px;align-items:center;background:#f1f5f9;padding:3px 9px;border-radius:12px;border:1px solid #e2e8f0" title="Aún no tiene calificaciones"><span style="color:#94a3b8;font-size:13px">⭐</span><b style="color:#64748b;font-size:12px">0.0</b><small style="color:#94a3b8;font-size:11px">(0)</small></span>`};
const availTxt=m=>(m.availability||[]).map(a=>`${a.d} ${a.a}–${a.b}`).join(' · ')||'Sin definir';
const mentors=()=>S.users.filter(u=>u.role==='mentor'&&u.active!==false);
const mine=()=>S.reqs.filter(r=>((Array.isArray(r.members)&&r.members.includes(S.me.id))||r.student===S.me.id||r.mentor===S.me.id||(Array.isArray(r.students)&&r.students.includes(S.me.id))));
const acc=()=>mine().filter(r=>r.status==='ACEPTADA');
const notify=(to,text)=>addDoc(collection(db,'notifications'),{to,text,ts:Date.now(),read:false});
const AVATAR_MAP={'avatars/carlos.jpg':'avatars/MENT.png','avatars/jorge.jpg':'avatars/MENT.png','avatars/laura.jpg':'avatars/M.png','avatars/ana.jpg':'avatars/M.png','avatars/valentina.jpg':'avatars/MENTORI.jpg','avatars/mateo.jpg':'avatars/V.png','carlos.jpg':'avatars/MENT.png','jorge.jpg':'avatars/MENT.png','laura.jpg':'avatars/M.png','ana.jpg':'avatars/M.png','valentina.jpg':'avatars/MENTORI.jpg','carlos':'avatars/MENT.png','laura':'avatars/M.png','jorge':'avatars/MENT.png','valentina':'avatars/MENTORI.jpg','ana':'avatars/M.png'};
const cleanPhotoUrl=u=>{if(!u)return '';u=String(u).trim();if(AVATAR_MAP[u])return AVATAR_MAP[u];const mImg=u.match(/[?&]imgurl=([^&]+)/);if(mImg)try{u=decodeURIComponent(mImg[1])}catch{}const mDrive=u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:.*&)?id=)([a-zA-Z0-9_-]+)/);if(mDrive)return `https://lh3.googleusercontent.com/d/${mDrive[1]}=s600`;return u};
const isPast=(date,time)=>{if(!date||date.includes('fijar'))return false;const d=new Date(date+'T'+(time&&time.length===5?time:'23:59'));return !isNaN(d.getTime())&&d.getTime()<Date.now()};
const reqStudents=r=>{if(Array.isArray(r?.students)&&r.students.length)return r.students.map(id=>U(id)).filter(u=>u&&u.name!=='Usuario no disponible');if(r?.student){const u=U(r.student);return (u&&u.name!=='Usuario no disponible')?[u]:[]}return []};
const pack=f=>new Promise((ok,no)=>{const fr=new FileReader();fr.onerror=()=>no(new Error('No se pudo leer el archivo.'));
 if(f.type&&f.type.startsWith('image/')){fr.onload=()=>{const i=new Image();i.onload=()=>{const maxD=1200,k=Math.min(1,maxD/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);const ctx=c.getContext('2d');ctx.drawImage(i,0,0,c.width,c.height);let d=c.toDataURL('image/jpeg',.75);if(d.length>850000)d=c.toDataURL('image/jpeg',.50);if(d.length>850000){const c2=document.createElement('canvas');c2.width=Math.round(c.width*.7);c2.height=Math.round(c.height*.7);c2.getContext('2d').drawImage(c,0,0,c2.width,c2.height);d=c2.toDataURL('image/jpeg',.45)}ok({name:f.name,type:'image/jpeg',data:d})};i.onerror=()=>no(new Error('No se pudo procesar la imagen.'));i.src=fr.result};fr.readAsDataURL(f)}
 else{if(f.size>850000)return no(new Error('El archivo supera 850 KB (límite directo de base de datos). Para documentos más pesados, comparte el enlace de Google Drive o usa un archivo comprimido.'));fr.onload=()=>ok({name:f.name,type:f.type||'application/octet-stream',data:fr.result});fr.readAsDataURL(f)}});
const cid=(a,b)=>[a,b].sort().join('_');
const isOnline=u=>{if(!u||u.active===false)return false;if(u.id===S.me?.id)return true;return u.online!==false&&u.lastActive&&(Date.now()-u.lastActive)<90000};
const formatLastSeen=ts=>{if(!ts)return 'desconectado';const diff=Date.now()-ts;if(diff<90000)return 'en línea';const d=new Date(ts),now=new Date();const isToday=d.toDateString()===now.toDateString();const yesterday=new Date(now);yesterday.setDate(now.getDate()-1);const isYesterday=d.toDateString()===yesterday.toDateString();const time=d.toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'});if(isToday)return `últ. vez hoy a las ${time}`;if(isYesterday)return `últ. vez ayer a las ${time}`;return `últ. vez el ${d.toLocaleDateString('es',{day:'numeric',month:'short'})} a las ${time}`};
let lastPresenceUpdate=0;
const touchPresence=async(force=false)=>{if(!S.me||!S.me.id)return;const now=Date.now();if(!force&&now-lastPresenceUpdate<30000)return;lastPresenceUpdate=now;try{await updateDoc(doc(db,'users',S.me.id),{online:true,lastActive:now})}catch{}};
const markChatAsRead=async otherId=>{if(!S.me||!otherId)return;const cId=cid(S.me.id,otherId);const unread=S.msgs.filter(m=>m.chatId===cId&&m.from===otherId&&!m.read);if(!unread.length)return;const now=Date.now();for(const m of unread){m.read=true;m.readAt=now}refresh();T(async()=>{for(const m of unread){try{await updateDoc(doc(db,'messages',m.id),{read:true,readAt:now})}catch{}}})};
const markNotifsAsRead=async()=>{if(!S.me)return;const unread=S.notifs.filter(n=>!n.read&&n.to===S.me.id);if(!unread.length)return;for(const n of unread){n.read=true}refresh();T(async()=>{for(const n of unread){try{await updateDoc(doc(db,'notifications',n.id),{read:true})}catch{}}})};
const wave=t=>`<span class=wave>${String(t).split(' ').map((w,k)=>`<span class=w>${[...w].map((c,i)=>`<i style="animation-delay:${(k*5+i)*.07}s">${esc(c)}</i>`).join('')}</span>`).join(' ')}</span>`;
const TY=['Clases en vivo por Google Meet','Mentores de todas las áreas','Avanza a tu ritmo y mide tu progreso','Aprende, comparte y crece en comunidad'];let ti=0,tc=0,tw=0,tdel=false;
setInterval(()=>{const e=document.querySelector('.typed');if(!e)return;const p=TY[ti];if(tw>0)tw--;else if(!tdel){tc++;if(tc>=p.length){tdel=true;tw=22}}else{tc--;if(tc<=0){tdel=false;ti=(ti+1)%TY.length}}e.textContent=p.slice(0,Math.max(tc,0))},80);
const ill=()=>`<svg class=ill viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs><rect x="50" y="40" width="300" height="188" rx="16" fill="#fff" opacity=".96"/><rect x="62" y="52" width="276" height="160" rx="10" fill="url(#gg)"/><circle cx="140" cy="110" r="24" fill="#fff"/><rect x="108" y="138" width="64" height="58" rx="24" fill="#fff"/><circle cx="260" cy="110" r="24" fill="#fde68a"/><rect x="228" y="138" width="64" height="58" rx="24" fill="#fde68a"/><rect x="20" y="236" width="360" height="14" rx="7" fill="#fff" opacity=".9"/><g class="fl"><polygon points="200,6 250,26 200,46 150,26" fill="#0b1b4d"/><path d="M175 36v14c0 8 50 8 50 0V36l-25 10z" fill="#1e3a8a"/><rect x="246" y="26" width="3" height="22" fill="#d4a537"/></g><g class="fl2"><rect x="338" y="70" width="52" height="38" rx="12" fill="#fff"/><circle cx="352" cy="89" r="3" fill="#2563eb"/><circle cx="364" cy="89" r="3" fill="#2563eb"/><circle cx="376" cy="89" r="3" fill="#2563eb"/></g><g class="fl2"><rect x="8" y="120" width="56" height="40" rx="12" fill="#fde68a"/><text x="36" y="148" font-size="22" text-anchor="middle">⭐</text></g><g class="fl"><rect x="300" y="170" width="60" height="26" rx="13" fill="#16a34a"/><text x="330" y="188" font-size="12" fill="#fff" text-anchor="middle" font-family="Inter,sans-serif" font-weight="700">En vivo</text></g></svg>`;
const wd=d=>DAYS[(new Date(d+'T00:00').getDay()+6)%7];
const resv=()=>mine().filter(r=>r.mentor===S.me.id&&['PENDIENTE','ACEPTADA'].includes(r.status)&&(r.sesion||'')!=='Cancelada').sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
const MAXG=20;
const gradeOf=id=>{const g=S.grades.filter(x=>x.student===id);return g.length?{v:(g.reduce((a,x)=>a+(+x.value||0),0)/g.length).toFixed(1),n:g.length}:null};
const myGrade=sid=>S.grades.find(x=>x.student===sid&&x.mentor===S.me.id);
const fstu=()=>S.users.filter(u=>u.role==='student'&&u.active!==false).map(u=>({u,g:gradeOf(u.id)})).filter(x=>x.g).sort((a,b)=>b.g.v-a.g.v||b.g.n-a.g.n).slice(0,4).map(({u,g},i)=>`<div class=card><div class=row><span class=medal>${['🥇','🥈','🥉','⭐'][i]}</span>${av(u,48)}<div><b>${esc(u.name)}</b><br><small>${esc(u.career||'')} · ${esc(u.level||'')}</small></div></div><p><small>Nota promedio <b>${g.v}</b>/${MAXG} · ${g.n} calificación(es) de mentores</small></p><div class=bar><div style="width:${Math.min(100,g.v/MAXG*100)}%"></div></div><div>${chips(u.skills)}</div><div class=row style="margin-top:10px"><button class=btn data-a=pviewx data-id=${u.id}>Ver perfil</button><button class=btn data-a=msg data-id=${u.id}>💬 Mensaje</button>${S.me.role==='mentor'?`<button class="btn p" data-a=grade data-id=${u.id}>⭐ Calificar</button>`:''}</div></div>`).join('')||'<p class=sub>Aún no hay alumnos calificados por los mentores.</p>';
const reqTabs=()=>`<div class=row style="margin-bottom:12px">${[['','Todas'],['PENDIENTE','Pendientes'],['ACEPTADA','Aceptadas'],['RECHAZADA','Rechazadas']].map(([k,l])=>`<button class="btn ${(S.rf||'')===k?'p':''}" data-a=rf data-v="${k}">${l} (${k?mine().filter(r=>r.status===k).length:mine().length})</button>`).join('')}</div>`;
const alertedClasses=new Set();
function checkClassTimeAlerts(){
 if(!S.me||!S.reqs||!S.reqs.length)return;
 const now=new Date(),todayStr=now.toISOString().slice(0,10),curTimeMs=now.getTime();
 const myConfirmed=S.reqs.filter(r=>(r.members||[]).includes(S.me.id)&&['ACEPTADA','PENDIENTE'].includes(r.status)&&(r.sesion||'Confirmada')==='Confirmada'&&r.date&&r.time&&!r.date.includes('fijar'));
 for(const r of myConfirmed){
  if(r.date!==todayStr)continue;
  const parts=String(r.time||'').split(':');
  if(parts.length<2)continue;
  const classDt=new Date(now.getFullYear(),now.getMonth(),now.getDate(),+parts[0],+parts[1],0);
  const diffMin=(curTimeMs-classDt.getTime())/60000;
  if(diffMin>=-3&&diffMin<=45){
   const alertKey=`alert_${r.id}_${todayStr}_${r.time}`;
   if(!alertedClasses.has(alertKey)){
    alertedClasses.add(alertKey);
    try{if(localStorage.getItem(alertKey))continue;localStorage.setItem(alertKey,'1')}catch{}
    const other=U(S.me.id===r.student?r.mentor:r.student);
    const hasMeet=/^https:\/\//.test(r.meetLink||'');
    toast(`⏰ ¡Ya es la hora de tu clase de ${r.specialty}!`,0);
    try{const ctx=new (window.AudioContext||window.webkitAudioContext)();const osc=ctx.createOscillator(),g=ctx.createGain();osc.connect(g);g.connect(ctx.destination);osc.frequency.setValueAtTime(587.33,ctx.currentTime);osc.frequency.setValueAtTime(880,ctx.currentTime+0.15);g.gain.setValueAtTime(0.3,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.6);osc.start();osc.stop(ctx.currentTime+0.6)}catch{}
    modal(`<div style="text-align:center;padding:12px 6px"><div style="font-size:52px;margin-bottom:8px">⏰🔔</div><h2 style="margin:0 0 8px;color:#1e3a8a">¡Ya es hora de tu clase!</h2><p style="font-size:15px;color:#334155;margin:0 0 14px;line-height:1.5">Es momento de tu clase de <b>«${esc(r.specialty)}»</b> con <b>${esc(other.name)}</b>.<br><span style="font-weight:700;color:#047857">⏰ Horario: Hoy a las ${esc(r.time)}</span></p><div class=row style="justify-content:center;gap:10px;flex-wrap:wrap">${hasMeet?`<a class="btn g" target=_blank rel=noopener href="${esc(r.meetLink)}" style="padding:10px 20px;font-weight:700">🎥 Unirme a Meet ahora</a>`:''}<button class="btn" data-a=modtime data-id=${r.id} style="padding:10px 16px">📅 Cambiar hora</button><button class="btn p" data-a=close style="padding:10px 18px">Entendido</button></div></div>`);
    T(async()=>{await notify(S.me.id,`⏰ ¡Ya es la hora de tu clase de ${r.specialty} con ${other.name}! ${hasMeet?'Únete por Meet.':''}`)});
   }
  }
 }
}
const getMeetUrl=r=>{
 if(!r)return '';
 let l=(r.meetLink||'').trim();
 if(l){if(!/^https?:\/\//i.test(l))l='https://'+l;return l}
 const sId=r.student,mId=r.mentor;
 if(sId&&mId){
  const chatId=cid(sId,mId);
  const msg=(S.msgs||[]).slice().reverse().find(m=>m.chatId===chatId&&/(meet\.google\.com\/[a-z0-9-]+|https?:\/\/[^\s]+meet[^\s]*)/i.test(m.text||''));
  if(msg){
   const m=(msg.text||'').match(/(https?:\/\/[^\s]+|meet\.google\.com\/[a-z0-9-]+)/i);
   if(m){let ml=m[0].trim();if(!/^https?:\/\//i.test(ml))ml='https://'+ml;return ml}
  }
 }
 return '';
};
const rcell=(r,who)=>{
 const ss=r.sesion||'Confirmada';
 const isFinished=ss==='Finalizada'||isPast(r.date,r.time);
 let h='';
 if(who==='m'&&r.status==='PENDIENTE'){
  return `<button class="btn g" data-a=acc data-id=${r.id}>📅 Aceptar y fijar horario</button> <button class="btn d" data-a=rej data-id=${r.id}>Rechazar</button>`;
 }
 if(who==='s'&&r.status==='PENDIENTE'){
  return `<span class="badge y">🕒 Esperando que el mentor fije la fecha y hora</span>`;
 }
 if(r.status==='ACEPTADA'){
  const ml=getMeetUrl(r);
  if(!isFinished){
   if(who==='m'){
    if(r.live){
     h+=`<a class="btn g" target=_blank rel=noopener href="${esc(ml||'https://meet.google.com/')}" style="margin-right:4px;font-weight:700">🎥 Entrar a Meet</a> `;
     h+=`<button class="btn d" data-a=finishclass data-id=${r.id} style="margin-right:4px;font-weight:700">⏹ Terminar clase</button> `;
    } else {
     h+=`<button class="btn p" data-a=startclass data-id=${r.id} style="margin-right:4px;font-weight:700">🔴 Iniciar clase Meet</button> `;
     h+=`<button class="btn btn-sm" data-a=meet data-id=${r.id} style="margin-right:4px">✏️ Enlace Meet</button> `;
    }
    h+=`<button class="btn btn-sm" data-a=modtime data-id=${r.id}>📅 Cambiar hora</button>`;
   }
   if(who==='s'){
    if(r.live){
     h+=`<a class="btn" style="background:#dc2626;color:#fff;border-color:#dc2626;font-weight:700;margin-right:4px;animation:fl 2s infinite" target=_blank rel=noopener href="${esc(ml||'https://meet.google.com/')}">🔴 En vivo · Entrar a Meet</a> `;
    } else if(ml){
     h+=`<a class="btn g" target=_blank rel=noopener href="${esc(ml)}" style="margin-right:4px">🎥 Unirme a Meet</a> `;
    } else {
     h+=`<span class="badge" style="background:#eff6ff;color:#1e40af;margin-right:4px">🕒 Esperando enlace</span> `;
    }
    h+=`<button class="btn d" data-a=ses data-s=Cancelada data-id=${r.id}>Cancelar</button>`;
   }
  } else {
   if(who==='m'){
    const g=myGrade(r.student);
    h+=`<button class="btn p" data-a=grade data-id=${r.student} style="font-weight:700">⭐ Calificar alumno${g?` (${g.value}/${MAXG})`:''}</button>`;
   }
   if(who==='s'){
    const hasR=S.rats.some(x=>x.mentor===r.mentor&&x.student===S.me.id);
    h+=`<button class="btn" data-a=ratemodal data-id="${r.mentor}" style="background:#fef3c7;border-color:#fde68a;color:#92400e;font-weight:700;margin-right:4px">⭐ ${hasR?'Modificar calificación':'Calificar mentor'}</button> `;
    h+=`<button class="btn p" data-a=mreq data-id=${r.mentor} style="font-weight:700">🎥 Solicitar nueva clase</button>`;
   }
  }
 }
 return h;
};
let subs=[],BL=null;
const block=async(type,reason)=>{subs.forEach(f=>f());subs=[];S.me=null;BL=null;try{await signOut(auth)}catch{}if(type==='deleted'){toast('Este usuario no existe.',1);return render()}BL={type,reason:reason||''};render()};
const chk=async id=>{try{const s=await getDoc(doc(db,'users',id));if(!s.exists()||s.data().deleted===true){await block('deleted');return 1}if(s.data().active===false){await block('suspended',s.data().inactiveReason);return 1}}catch{}return 0};
const UN={deleted:['Esta página no está disponible','Tu cuenta fue eliminada por el administrador.'],suspended:['Esta página no está disponible','Tu cuenta está suspendida. Contacta al administrador para recuperar el acceso.'],maint:['Sitio en mantenimiento','MentorApp está en mantenimiento por el momento. Vuelve a intentarlo en unos minutos.']};
const unavail=(b,lg)=>{const t=UN[b.type]||UN.deleted;return `<div class=unav><div class=card><div class=big>${b.type==='maint'?'🛠️':'🚫'}</div><h1>${t[0]}</h1><p>${t[1]}</p>${b.reason?`<p class=why><b>${b.type==='maint'?'Mensaje':'Motivo'}:</b> ${esc(b.reason)}</p>`:''}<small>Si crees que es un error, comunícate con el administrador de MentorApp.</small><div class=row style="justify-content:center;margin-top:16px"><button class="btn p" data-a=${lg?'out':'back'}>${lg?'Cerrar sesión':'Volver al inicio'}</button></div></div></div>`};
const banner=()=>{
 let h='';
 if(S.site.announce&&S.dis!==S.site.announceTs){
  h+=`<div class=ann><span>📢 ${esc(S.site.announce)}</span><a data-a=disann title="Cerrar">✕</a></div>`;
 }
 if(S.me){
  const liveMeet=S.reqs.find(r=>(r.members||[]).includes(S.me.id)&&r.live&&r.status==='ACEPTADA'&&(r.sesion||'Confirmada')==='Confirmada');
  if(liveMeet && S.view!=='meet'){
   const isM=S.me.role==='mentor';
   const other=U(isM?liveMeet.student:liveMeet.mentor);
   const ml=getMeetUrl(liveMeet)||'https://meet.google.com/';
   h+=`<div style="background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;padding:12px 18px;border-radius:14px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;box-shadow:0 6px 20px rgba(220,38,38,.28)">
    <div style="display:flex;align-items:center;gap:12px">
     <span style="font-size:24px;animation:fl 2s infinite">🔴</span>
     <div>
      <div style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.2);padding:1px 8px;border-radius:10px;font-size:11px;font-weight:700;letter-spacing:.4px;margin-bottom:2px">EN VIVO AHORA</div>
      <h4 style="margin:0;font-size:15px;color:#fff">${isM?'¡Tu clase está en vivo ahora!':'¡Tu clase ha comenzado!'}</h4>
      <p style="margin:2px 0 0;font-size:12.5px;color:#fee2e2">Sesión de «${esc(liveMeet.specialty)}» con ${esc(other.name)}.</p>
     </div>
    </div>
    <div class=row style="gap:8px">
     <a class="btn" style="background:#fff;color:#dc2626;font-weight:800;padding:7px 18px;font-size:13px;box-shadow:0 3px 10px rgba(0,0,0,.2)" target=_blank rel=noopener href="${esc(ml)}">🎥 Entrar a Meet</a>
     ${isM?`<button class="btn" data-a=finishclass data-id="${liveMeet.id}" style="background:rgba(255,255,255,.2);color:#fff;border-color:transparent;font-size:12px;font-weight:700">⏹ Terminar clase</button>`:''}
    </div>
   </div>`;
  }
 }
 return h;
};
const csv=(name,rows)=>{const q=x=>{x=String(x??'');if(/^[=+\-@]/.test(x))x="'"+x;return '"'+x.replace(/"/g,'""')+'"'};const b=new Blob(['\ufeff'+rows.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
/* ---------- AUTH ---------- */
const isAdminEmail=em=>{if(!em)return false;const e=String(em).toLowerCase().trim(),list=(cfg.adminEmails||[]).map(x=>String(x).toLowerCase().trim());return list.includes(e)||e==='admin@mentorapp.com'||e.startsWith('admin@')};
const boot=async u=>{if(u)BL=null;subs.forEach(f=>f());subs=[];S.ready=false;Object.assign(S,{users:[],reqs:[],msgs:[],notifs:[],rats:[],grades:[],chats:[],tombs:[],site:{},choose:null,chat:null,replyHelp:null,view:'',q:'',fd:'',fe:0});
 if(!u){S.me=null;return render()}
 await T(async()=>{const isA=isAdminEmail(u.email);
  let tb;try{tb=await getDoc(doc(db,'deletedUsers',u.uid))}catch{}
  if(!tb||!tb.exists()){try{const qs=await getDocs(query(collection(db,'deletedUsers'),where('email','==',u.email)));if(!qs.empty)tb=qs.docs[0]}catch{}}
  if((tb&&tb.exists())||delUsers.has(u.uid)){subs.forEach(f=>f());subs=[];S.me=null;BL=null;try{await signOut(auth)}catch{}toast('Este usuario no existe.',1);return render()}
  let d=await getDoc(doc(db,'users',u.uid));
  if(!d.exists()&&u.email){try{const qs=await getDocs(query(collection(db,'users'),where('email','==',u.email)));if(!qs.empty)d=qs.docs[0]}catch{}}
  if(d.exists()&&S.regMode&&!isA){
   const curr=d.data(),rName=curr.role==='mentor'?'Mentor':(curr.role==='admin'?'Administrador':'Estudiante');
   subs.forEach(f=>f());subs=[];S.me=null;BL=null;S.pending=null;S.regMode=false;
   try{await signOut(auth)}catch{}
   if($('#authbox'))$('#authbox').innerHTML=authForm('login');
   toast(`Esta cuenta de Google ya está registrada como ${rName}. Por favor inicia sesión directamente.`,1);
   return render();
  }
  if(!d.exists()){
   if(!S.pending&&isA)S.pending={name:u.displayName||cfg.adminName||'Esmeralda Irrazabal',role:'admin'};
   if(!S.pending&&(u.providerData||[]).some(p=>p.providerId==='google.com')){subs.forEach(f=>f());subs=[];S.me=null;BL=null;try{await signOut(auth)}catch{}if($('#authbox'))$('#authbox').innerHTML=authForm('reg');toast('No tienes una cuenta registrada con este correo de Google. ¡Crea tu cuenta gratis aquí!',1);return render()}
   if(!S.pending){subs.forEach(f=>f());subs=[];S.me=null;BL=null;try{await signOut(auth)}catch{}if($('#authbox'))$('#authbox').innerHTML=authForm('reg');toast('No tienes una cuenta registrada. Por favor crea tu cuenta primero.',1);return render()}
   const defN=S.pending.name||u.displayName||(isA?(cfg.adminName||'Esmeralda Irrazabal'):(u.email?u.email.split('@')[0]:'Usuario')),defR=isA?'admin':(S.pending.role||'student');
   try{await setDoc(doc(db,'users',u.uid),{...S.pending,role:defR,name:defN,email:u.email,photo:u.photoURL||'',active:true,created:Date.now(),skills:[],availability:[],studentsCount:0});}catch(err){if(isA){try{await setDoc(doc(db,'users',u.uid),{...S.pending,role:'student',name:defN,email:u.email,photo:u.photoURL||'',active:true,created:Date.now(),skills:[],availability:[],studentsCount:0});}catch{}}else throw err}
   toast(`¡Bienvenido a MentorApp! Tu cuenta de ${defR==='mentor'?'Mentor':'Estudiante'} fue creada con éxito.`);
   S.pending=null;S.regMode=false;d=await getDoc(doc(db,'users',u.uid))}
  if((d.data().active===false||d.data().deleted===true)&&!isA){subs.forEach(f=>f());subs=[];S.me=null;BL=null;try{await signOut(auth)}catch{}toast('Este usuario no existe.',1);return render()}
  S.pending=null;S.regMode=false;
  S.me={id:u.uid,...d.data(),role:isA?'admin':d.data().role,name:isA?(d.data().name||cfg.adminName||'Esmeralda Irrazabal'):(d.data().name||u.displayName||u.email)};
   if(isA&&d.data().role!=='admin'){try{await updateDoc(doc(db,'users',u.uid),{role:'admin'})}catch{}}
   touchPresence(true);
   S.view='';listen();render()});if(!S.me)render()};onAuthStateChanged(auth,boot);
setInterval(()=>{if(document.visibilityState==='visible')touchPresence(true)},40000);
setInterval(checkClassTimeAlerts,15000);
['click','keydown','touchstart'].forEach(ev=>window.addEventListener(ev,()=>touchPresence(false),{passive:true}));
window.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){if(S.me&&S.me.id){try{updateDoc(doc(db,'users',S.me.id),{online:false,lastActive:Date.now()})}catch{}}}else{touchPresence(true)}});
window.addEventListener('beforeunload',()=>{if(S.me&&S.me.id){try{updateDoc(doc(db,'users',S.me.id),{online:false,lastActive:Date.now()})}catch{}}});
function listen(){const ad=isAdminEmail(S.me?.email)||S.me.role==='admin',id=S.me.id,M=c=>ad?collection(db,c):query(collection(db,c),where('members','array-contains',id)),
 on=(q,k,first)=>subs.push(onSnapshot(q,s=>{
  if(k==='notifs'&&S.ready){
   s.docChanges().forEach(ch=>{
    if(ch.type==='added'){
     const d=ch.doc.data();
     if(!d.read&&d.ts&&(Date.now()-d.ts<120000)){
      toast(`🔔 ${d.text}`);
      try{const ctx=new (window.AudioContext||window.webkitAudioContext)();const osc=ctx.createOscillator(),g=ctx.createGain();osc.connect(g);g.connect(ctx.destination);osc.frequency.setValueAtTime(587.33,ctx.currentTime);osc.frequency.setValueAtTime(880,ctx.currentTime+0.12);g.gain.setValueAtTime(0.2,ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.4);osc.start();osc.stop(ctx.currentTime+0.4)}catch{}
     }
    }
   });
  }
  S[k]=s.docs.map(d=>({id:d.id,...d.data()}));
  if(first){S.ready=true;const m=S.users.find(x=>x.id===id);if(m){const isA=isAdminEmail(m.email)||isAdminEmail(S.me?.email);if(m.active===false&&!isA)return block('suspended',m.inactiveReason);S.me={...m,role:isA?'admin':m.role,name:isA?(m.name||cfg.adminName||'Esmeralda Irrazabal'):m.name}}}
  refresh();
 },e=>{if(BL)return;chk(id).then(b=>{if(b)return;if(first){S.ready=true;refresh()}})})) ;
 on(collection(db,'users'),'users',1);on(M('requests'),'reqs');if(!ad)on(M('messages'),'msgs');if(ad)on(collection(db,'chats'),'chats');on(query(collection(db,'notifications'),where('to','==',id)),'notifs');on(collection(db,'ratings'),'rats');on(collection(db,'grades'),'grades');on(collection(db,'help_posts'),'helps');if(ad)on(collection(db,'deletedUsers'),'tombs');
 subs.push(onSnapshot(doc(db,'users',id),s=>{if(!s.exists()||(s.data().active===false&&!isAdminEmail(s.data().email)))chk(id)},()=>chk(id)));
 subs.push(onSnapshot(doc(db,'settings','site'),s=>{S.site=s.exists()?s.data():{};S.site.maintenance&&S.me&&S.me.role!=='admin'?render():refresh()},()=>{}))}
/* ---------- RENDER ---------- */
const unreadChat=()=>S.me?S.msgs.filter(m=>m.from!==S.me.id&&!m.read&&(m.members||[]).includes(S.me.id)).length:0;
function refresh(){ensureBotWidget();checkClassTimeAlerts();if(S.me&&$('#sh')){const un=S.notifs.filter(n=>!n.read&&n.to===S.me.id).length,nl=$('a[data-v=notif]');if(nl)nl.innerHTML=`Notificaciones${un?' <span class="nav-dot notif-dot" title="Nuevas notificaciones"></span>':''}`;const unM=unreadChat(),clBadge=$('a[data-v=chat]');if(clBadge)clBadge.innerHTML=`Mis conversaciones${unM?' <span class="nav-dot chat-dot" title="Nuevos mensajes"></span>':''}`;const totalU=un+unM;try{document.title=(totalU?'(●) ':'')+'MentorApp'}catch{}if(S.view==='chat'&&S.chat)markChatAsRead(S.chat);if(S.view==='notif'&&un)markNotifsAsRead();if(S.view==='chat'&&$('#msgs')){$('#msgs').innerHTML=msgsHtml();$('#msgs').scrollTop=1e9;const cl=$('.chat-list');if(cl)cl.innerHTML=ctsHtml();const stEl=$('.chat-head-status');if(stEl&&S.chat){const o=U(S.chat),on=isOnline(o);stEl.className=`chat-head-status ${on?'is-online':''}`;stEl.innerHTML=`<span class="chat-status-dot ${on?'is-online':'is-offline'}"></span> <span class="chat-status-text">${on?'en línea':formatLastSeen(o.lastActive)}</span>`;const avWrap=$('.chat-head-av-wrap'),badgeEl=avWrap?.querySelector('.chat-online-badge');if(on&&!badgeEl&&avWrap){avWrap.insertAdjacentHTML('beforeend','<span class=chat-online-badge title="En línea"></span>');}else if(!on&&badgeEl){badgeEl.remove();}}return}if(S.view==='help'&&$('#help-wrap')){$('#help-wrap').outerHTML=helpV();return}if(S.me.role==='admin'&&(S.view==='students'||S.view==='mentors')&&$('#list')){$('#list').innerHTML=peopleTable(plain(S.view==='mentors'?'mentor':'student'));return}if(S.me.role!=='admin'&&S.view==='mentors'&&$('#list')){$('#list').innerHTML=mlist();return}if(S.view==='peers'&&$('#list')){$('#list').innerHTML=plist();return}if(S.view==='sesiones'&&$('#ses-main')){$('#ses-main').outerHTML=admin_sesiones();return}if(S.view==='reqs'&&$('#reqs-wrap')){$('#reqs-wrap').innerHTML=adminReqsHtml();return}}render()}
function render(){ensureBotWidget();const A=$('#app');if(!S.me){A.innerHTML=BL?unavail(BL):S.choose?choosePage():landing();setTimeout(()=>{document.querySelectorAll('#authbox input').forEach(i=>{if(i.type!=='radio')i.value=''})},20);setTimeout(()=>{document.querySelectorAll('#authbox input').forEach(i=>{if(i.type!=='radio')i.value=''})},250);return}
 if(!S.ready)return A.innerHTML='<p style="padding:40px">Cargando datos…</p>';
 if(S.site.maintenance&&S.me.role!=='admin')return A.innerHTML=unavail({type:'maint',reason:S.site.message},1);const m=MENU[S.me.role]||MENU.student;if(!m.some(x=>x[0]===S.view))S.view=m[0][0];const un=S.notifs.filter(n=>!n.read&&n.to===S.me.id).length,unM=unreadChat(),totalU=un+unM;try{document.title=(totalU?'(●) ':'')+'MentorApp'}catch{}
 if(S.view==='notif'&&un)markNotifsAsRead();
 const botOpen = S.botPanelOpen !== false;
 if(S.guideOpen===undefined){try{const gKey='mentorapp_guide_seen_'+S.me.id+'_'+S.me.role;S.guideOpen=localStorage.getItem(gKey)!=='true';S.guideStep=1;}catch{S.guideOpen=false;}}
 A.innerHTML=`<div class="shell ${botOpen ? 'has-bot-sidebar' : ''}" id=sh><aside><div class=logo><i>🎓</i>MentorApp</div>${m.map(x=>`<a class="${x[0]===S.view?'on':''}" data-a=go data-v=${x[0]}>${x[1]}${x[0]==='notif'&&un?' <span class="nav-dot notif-dot" title="Nuevas notificaciones"></span>':''}${x[0]==='chat'&&unM?' <span class="nav-dot chat-dot" title="Nuevos mensajes"></span>':''}</a>`).join('')}<div class=me>${av(S.me,34)}<div>${esc(S.me.name)}<small>${{admin:'Administradora',mentor:'Mentor',student:'Estudiante'}[S.me.role]}</small></div></div><button class=btn data-a=out>Cerrar sesión</button></aside>
 <main><header><button class="btn burger" data-a=burger>☰</button><b>${m.find(x=>x[0]===S.view)?.[1]||'MentorApp'}</b><span class=sp></span><button type="button" class="btn btn-sm" data-a="open_guide" title="Ver guía interactiva paso a paso" style="margin-right:8px;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;font-weight:700;display:inline-flex;align-items:center;gap:6px">📖 Guía paso a paso</button>${!botOpen ? '<button type="button" class="btn btn-sm" data-a="toggle_bot_panel" style="margin-right:12px;display:inline-flex;align-items:center;gap:6px">🤖 Asistente</button>' : ''}<span>${esc(S.me.name)}</span>${av(S.me,34)}</header><section id=sec class="${S.view==='chat'?'chat-mode':''}">${banner()}${(V[S.me.role+'_'+S.view]||(()=>''))()}</section></main>${botOpen ? renderAssistantSidebarHtml() : ''}${S.guideOpen ? renderGuideModalHtml() : ''}</div>`}
const landingSectionsHtml=()=>`
<div class=landing-showcase>
  <div class=cf-header>
    <div class=cf-title-row>
      <span class=cf-sparkle>✨</span>
      <h2 class=cf-title>¿Cómo funciona?</h2>
    </div>
    <p class=cf-sub>En solo unos pasos podrás encontrar un mentor, aprender y avanzar en tus estudios.</p>
  </div>
  <div class=cf-cards-row>
    <div class="cf-card c-blue">
      <span class="cf-num n-blue">1</span>
      <div class=cf-icon-box>
        <svg viewBox="0 0 64 64" width=64 height=64 fill=none><circle cx=32 cy=24 r=13 fill="#93c5fd"/><path d="M14 54c0-9.941 8.059-18 18-18s18 8.059 18 18" fill="#2563eb"/><circle cx=46 cy=46 r=10 fill="#3b82f6"/><path d="M46 41v10M41 46h10" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>
      </div>
      <h3>Crea tu cuenta</h3>
      <p>Regístrate como estudiante o mentor.</p>
      <span class="cf-btn b-blue">→</span>
      <div class="cf-wave w-blue"></div>
    </div>
    <div class=cf-arrow>›</div>
    <div class="cf-card c-purple">
      <span class="cf-num n-purple">2</span>
      <div class=cf-icon-box>
        <svg viewBox="0 0 64 64" width=64 height=64 fill=none><circle cx=30 cy=28 r=16 stroke="#8b5cf6" stroke-width="3.5" fill="#ede9fe"/><circle cx=30 cy=24 r=6 fill="#7c3aed"/><path d="M20 38c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="#7c3aed" stroke-width="2.5"/><path d="M42 40l12 12" stroke="#6d28d9" stroke-width="4.5" stroke-linecap="round"/><path d="M38 12l2-4M46 16l4-2M48 24l4 1" stroke="#a78bfa" stroke-width="2.5" stroke-linecap="round"/></svg>
      </div>
      <h3>Encuentra</h3>
      <p>Explora perfiles por especialidad, experiencia y disponibilidad.</p>
      <span class="cf-btn b-purple">→</span>
      <div class="cf-wave w-purple"></div>
    </div>
    <div class=cf-arrow>›</div>
    <div class="cf-card c-green">
      <span class="cf-num n-green">3</span>
      <div class=cf-icon-box>
        <svg viewBox="0 0 64 64" width=64 height=64 fill=none><rect x=12 y=14 width=28 height=20 rx=10 fill="#93c5fd"/><circle cx=20 cy=24 r=2 fill="#1e40af"/><circle cx=26 cy=24 r=2 fill="#1e40af"/><circle cx=32 cy=24 r=2 fill="#1e40af"/><rect x=24 y=26 width=28 height=20 rx=10 fill="#34d399"/><circle cx=32 cy=36 r=2 fill="#065f46"/><circle cx=38 cy=36 r=2 fill="#065f46"/><circle cx=44 cy=36 r=2 fill="#065f46"/><path d="M48 14l2-4M54 18l4-2" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/></svg>
      </div>
      <h3>Solicita</h3>
      <p>Envía tu solicitud y el mentor la acepta o rechaza.</p>
      <span class="cf-btn b-green">→</span>
      <div class="cf-wave w-green"></div>
    </div>
    <div class=cf-arrow>›</div>
    <div class="cf-card c-orange">
      <span class="cf-num n-orange">4</span>
      <div class=cf-icon-box>
        <svg viewBox="0 0 64 64" width=64 height=64 fill=none><rect x=14 y=16 width=36 height=34 rx=8 fill="#fef3c7" stroke="#f59e0b" stroke-width="2.5"/><rect x=14 y=16 width=36 height=10 rx=4 fill="#f59e0b"/><circle cx=24 cy=34 r=2 fill="#d97706"/><circle cx=32 cy=34 r=2 fill="#d97706"/><circle cx=40 cy=34 r=2 fill="#d97706"/><circle cx=24 cy=42 r=2 fill="#d97706"/><circle cx=44 cy=44 r=11 fill="#fff" stroke="#f59e0b" stroke-width="2.5"/><path d="M44 38v6l4 2" stroke="#d97706" stroke-width="2" stroke-linecap="round"/><path d="M22 12v6M42 12v6" stroke="#b45309" stroke-width="3" stroke-linecap="round"/></svg>
      </div>
      <h3>Aprende</h3>
      <p>Conversa por chat y agenda tus sesiones.</p>
      <span class="cf-btn b-orange">→</span>
      <div class="cf-wave w-orange"></div>
    </div>
  </div>
  <div class=ben-box>
    <div class=ben-header>
      <div class=ben-badge>⭐</div>
      <div>
        <h3>Beneficios</h3>
        <p>Más que una plataforma, es una comunidad que te impulsa.</p>
      </div>
    </div>
    <div class=ben-grid>
      <div class=ben-card>
        <div class="ben-icon bi-blue">
          <svg viewBox="0 0 24 24" width=24 height=24 fill=none stroke="#2563eb" stroke-width=2.2 stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
        </div>
        <b>Mentores verificados</b>
        <p>Con la confianza de profesionales y estudiantes reales.</p>
        <div class="ben-corner-wave bw-blue"></div>
      </div>
      <div class=ben-card>
        <div class="ben-icon bi-purple">
          <svg viewBox="0 0 24 24" width=24 height=24 fill=none stroke="#7c3aed" stroke-width=2.2 stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx=9 cy=10 r=1.2 fill="#7c3aed"/><circle cx=12 cy=10 r=1.2 fill="#7c3aed"/><circle cx=15 cy=10 r=1.2 fill="#7c3aed"/></svg>
        </div>
        <b>Chat con historial</b>
        <p>Mantén un registro de tus conversaciones y avances.</p>
        <div class="ben-corner-wave bw-purple"></div>
      </div>
      <div class=ben-card>
        <div class="ben-icon bi-green">
          <svg viewBox="0 0 24 24" width=24 height=24 fill=none stroke="#16a34a" stroke-width=2.2 stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        </div>
        <b>Contacto directo</b>
        <p>Comunícate fácilmente por WhatsApp.</p>
        <div class="ben-corner-wave bw-green"></div>
      </div>
      <div class=ben-card>
        <div class="ben-icon bi-pink">
          <svg viewBox="0 0 24 24" width=24 height=24 fill=none stroke="#ec4899" stroke-width=2.2 stroke-linecap="round" stroke-linejoin="round"><rect x=3 y=4 width=18 height=18 rx=2 ry=2/><line x1=16 y1=2 x2=16 y2=6/><line x1=8 y1=2 x2=8 y2=6/><line x1=3 y1=10 x2=21 y2=10/><circle cx=8 cy=15 r=1.5 fill="#ec4899"/><circle cx=12 cy=15 r=1.5 fill="#ec4899"/><circle cx=16 cy=15 r=1.5 fill="#ec4899"/></svg>
        </div>
        <b>Cronograma de sesiones</b>
        <p>Organiza tus clases y no pierdas el seguimiento.</p>
        <div class="ben-corner-wave bw-pink"></div>
      </div>
    </div>
  </div>
</div>`;
const landing=()=>`<div class=land><div class=in><div class="row sp"><div class=logo><i>🎓</i>MentorApp</div><button class="btn" data-a=open_bot style="background:#eff6ff;color:#1d4ed8;border:1.5px solid #bfdbfe;font-weight:700;display:inline-flex;align-items:center;gap:6px;border-radius:20px;padding:7px 16px;box-shadow:0 2px 8px rgba(37,99,235,.15);cursor:pointer">🤖 Robot Asistente IA · ¿Cómo funciona?</button></div>
<div class=authwrap><div class=authside><div class=cap>🎓</div><h1 style="font-size:30px;margin:8px 0 6px">${wave('¡Bienvenido a MentorApp!')}</h1><p style="font-size:14px;color:#dbeafe;line-height:1.5;margin:0 0 6px">Conecta con la comunidad académica, comparte conocimientos y organiza tu aprendizaje.</p><p class=ty><span class=typed></span></p><div style="position:relative;margin:12px 0 16px;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.25);border:2px solid rgba(255,255,255,.2)"><img src="mentor_estudiante.jpg" alt="Mentor y Estudiante" style="width:100%;height:185px;object-fit:cover;display:block"><div style="position:absolute;bottom:8px;right:10px;background:rgba(11,27,77,.8);backdrop-filter:blur(4px);padding:3px 10px;border-radius:20px;font-size:11.5px;color:#fde68a;font-weight:600">Juntos logramos más ♡</div></div><div class=authfeat>${[['🎓','Aprende','Accede a recursos y asesorías'],['👥','Comparte','Conecta con otros estudiantes'],['📈','Mejora','Potencia tus habilidades']].map(x=>`<div class=af><i>${x[0]}</i><div><b>${x[1]}</b><small>${x[2]}</small></div></div>`).join('')}</div><div class=faces style="margin-top:auto">${AV.map((a,i)=>`<img class=av src="avatars/${a}" alt="" style="width:40px;height:40px;object-fit:cover;animation-delay:${i*.3}s" onerror="this.style.display='none'">`).join('')}<span>Únete a nuestra comunidad</span></div></div><div class=authmain id=authbox>${authForm('login')}</div></div>
${landingSectionsHtml()}
<div style="background:linear-gradient(135deg,#0b1b4d,#1e3a8a 60%,#7c3aed);color:#fff;border-radius:24px;padding:26px 28px;margin-top:28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:18px;box-shadow:0 12px 36px rgba(11,27,77,.22)">
  <div style="display:flex;align-items:center;gap:18px">
    <div style="width:64px;height:64px;border-radius:20px;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;font-size:36px;box-shadow:0 4px 14px rgba(0,0,0,.2)">🤖</div>
    <div>
      <h3 style="margin:0;font-size:20px;color:#fff;font-weight:800">¿Tienes dudas sobre cómo funciona la página?</h3>
      <p style="margin:4px 0 0;font-size:13.5px;color:#dbeafe">Nuestro Robot Asistente IA está listo para explicarte paso a paso cómo registrarte, solicitar clases de Meet y aprender.</p>
    </div>
  </div>
  <button class="btn" data-a="open_bot" style="background:#fff;color:#1e3a8a;font-weight:800;padding:11px 22px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.15);border:none;font-size:13.5px;cursor:pointer">🤖 Hablar con el Robot IA →</button>
</div>
<footer class=f>© 2026 MentorApp · Plataforma de mentorías académicas y profesionales</footer></div></div>`;
const SV=p=>`<svg viewBox="0 0 24 24" width=20 height=20 fill=none stroke=currentColor stroke-width=1.8 stroke-linecap=round stroke-linejoin=round>${p}</svg>`,
IC={mail:SV('<rect x=3 y=5 width=18 height=14 rx=2.5></rect><path d="m3.5 7 8.5 6 8.5-6"/>'),lock:SV('<rect x=5 y=11 width=14 height=9 rx=2.5></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),user:SV('<circle cx=12 cy=8 r=4></circle><path d="M4 20c1-4 4-6 8-6s7 2 8 6"/>'),eye:SV('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx=12 cy=12 r=3></circle>')},
GL='<svg viewBox="0 0 48 48" width=20 height=20><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
const inp=(ic,n,t,ph,ac,eye)=>`<div class=inp>${IC[ic]}<input name=${n} type=${t} placeholder="${ph}" autocomplete="${ac||'off'}" value="">${eye?`<button type=button class=eye data-a=eye title="Mostrar u ocultar">${IC.eye}</button>`:''}</div>`;
const roleCards=()=>[['student','🎓','Estudiante','Accede a clases, recursos y aprende a tu ritmo.'],['mentor','🧑‍🏫','Mentor','Guía a estudiantes y comparte tu conocimiento.']].map((x,k)=>`<label class=rc><input type=radio name=role value=${x[0]} ${k?'':'checked'} data-in=rolechoice><span class=rci>${x[1]}</span><span class=rct><b>${x[2]}</b><small>${x[3]}</small></span><i class=dot></i></label>`).join('');
const gbtn=l=>`<div class=or><span>o</span></div><button type=button class=gbtn data-a=google>${GL}<b>${l||'Entrar con Google'}</b><span>›</span></button>`;
const authForm=k=>k==='login'?`<h2>Iniciar sesión</h2><p class=sub>Ingresa a tu cuenta para continuar</p><form data-f=login autocomplete="off"><label>Correo electrónico</label>${inp('mail','email','email','Ingresa tu correo electrónico','new-password')}<label>Contraseña</label>${inp('lock','pass','password','Ingresa tu contraseña','new-password',1)}<div class=fg><a href=# data-a=af data-k=rec>¿Olvidaste tu contraseña?</a></div><button class="btn p big">Iniciar sesión</button></form><a href=# class=swap data-a=af data-k=reg><i>${IC.user}</i><span><small>¿No tienes una cuenta?</small><b>Crear cuenta</b></span><span>›</span></a>`
:k==='reg'?`<h2>Crear cuenta</h2><p class=sub>Regístrate para empezar a aprender y compartir</p><label style="font-size:14px;font-weight:700;margin-bottom:6px;display:block">1. Selecciona tu rol en MentorApp:</label><div class=rcs style="margin-bottom:14px">${roleCards()}</div>${gbtn('Registrarme con cuenta de Google como Estudiante')}<div class=or style="margin:20px 0"><span>o completa tus datos con correo</span></div><form data-f=reg><label>Nombre completo</label>${inp('user','name','text','Tu nombre completo','name')}<label>Correo electrónico</label>${inp('mail','email','email','Ingresa tu correo electrónico','email')}<label>Contraseña</label>${inp('lock','pass','password','Mínimo 6 caracteres','new-password',1)}<label>Confirmar contraseña</label>${inp('lock','pass2','password','Repite tu contraseña','new-password',1)}<button class="btn p big" style="margin-top:10px">Crear cuenta con correo</button></form><p class=fg style="text-align:center;margin-top:16px"><a href=# data-a=af data-k=login>¿Ya tienes una cuenta? Iniciar sesión</a></p>`
:`<h2>Recuperar contraseña</h2><p class=sub>Te enviaremos un enlace a tu correo</p><form data-f=rec><label>Correo electrónico</label>${inp('mail','email','email','Ingresa tu correo electrónico','email')}<button class="btn p big">Enviar enlace</button></form><p class=fg style="text-align:center;margin-top:14px"><a href=# data-a=af data-k=login>← Volver a iniciar sesión</a></p>`;
const choosePage=()=>`<div class=unav><div class=card style="max-width:500px;width:100%;text-align:left;padding:28px"><button class="btn bk" data-a=cback title="Volver">←</button><div class=cicon>🎓</div><h2 style="text-align:center">Completa tu registro en MentorApp</h2><p class=sub style="text-align:center">Hola, ${esc((S.choose.name||'').split(' ')[0])}. Selecciona si serás Estudiante o Mentor.</p><div style="margin:12px 0 16px;border-radius:14px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,.12);border:1px solid #e2e8f0"><img src="mentor_estudiante.jpg" alt="MentorApp" style="width:100%;height:130px;object-fit:cover;display:block"></div><form data-f=choose><div class=rcs>${roleCards()}</div><button class="btn p big">Continuar a mi cuenta →</button></form></div></div>`;
/* ---------- COMPONENTES ---------- */
const mcard=m=>{
  const cs=m.courses||[];
  const expNum=+m.experience||0;
  const hasAvail=(m.availability||[]).length>0;
  return `<div class=card style="display:flex;flex-direction:column">
   <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px">
    <div style="display:flex;gap:10px;align-items:center;min-width:0;flex:1">
     ${av(m,50)}
     <div style="min-width:0;flex:1">
      <b style="display:block;font-size:15px;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.name)}</b>
      <span style="font-size:12.5px;color:#64748b;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">🧑‍🏫 ${esc(m.specialty||'Mentor')}</span>
      ${m.verified?'<span class="badge g" style="font-size:10.5px;padding:1px 6px;margin-top:2px;display:inline-block">✔ Verificado</span>':''}
     </div>
    </div>
    <span class="badge ${m.active!==false?'g':'r'}" style="flex-shrink:0;font-size:11px">${m.active!==false?'Activo':'No disponible'}</span>
   </div>
   <div style="margin:6px 0 8px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
    ${stars(m.id)}
    ${expNum>0?`<span class="badge" style="background:#f1f5f9;color:#334155;font-size:11.5px;font-weight:600">💼 ${expNum} años exp.</span>`:''}
   </div>
   ${cs.length?`<div style="margin:4px 0"><small style="font-weight:700;color:#1e40af">📚 Cursos que domina:</small><div style="margin-top:3px">${cs.map(c=>`<span class=badge style="background:#dbeafe;color:#1e40af;margin:2px 3px 2px 0;font-size:11.5px;font-weight:600">📘 ${esc(c)}</span>`).join('')}</div></div>`:''}
   ${(m.skills||[]).length?`<div style="margin:4px 0">${chips(m.skills)}</div>`:''}
   <small style="display:block;margin:6px 0;color:#475569">🕒 <b>Disponibilidad:</b> ${hasAvail?esc(availTxt(m)):'Horario flexible / A coordinar'}</small>
   <div class="row" style="margin-top:auto;padding-top:12px;gap:6px">
    <button class=btn data-a=mview data-id=${m.id} style="flex:1">• Ver perfil y datos</button>
    <button class="btn p" data-a=mreq data-id=${m.id} style="flex:1">📩 Mandar solicitud</button>
   </div>
  </div>`;
};
const mfilter=()=>{const q=S.q.toLowerCase(),d=S.fd||'',e=+(S.fe||0);return mentors().filter(m=>(!q||[m.name,m.specialty,...(m.skills||[]),...(m.courses||[])].join(' ').toLowerCase().includes(q))&&(!d||(m.availability||[]).some(a=>a.d===d))&&(+m.experience||0)>=e)};
const mlist=()=>mfilter().map(mcard).join('')||'<p class=sub>No se encontraron mentores.</p>';
const filters=()=>`<div class="card row" style="margin-bottom:16px"><input style="flex:2;margin:0" id=q placeholder="Buscar por nombre, especialidad o habilidad" value="${esc(S.q)}" data-in=mq><select style="flex:1;margin:0" data-in=fd><option value="">Cualquier día</option>${DAYS.map(d=>`<option ${S.fd===d?'selected':''}>${d}</option>`).join('')}</select><select style="flex:1;margin:0" data-in=fe>${[0,1,3,5,10].map(n=>`<option value=${n} ${+S.fe===n?'selected':''}>${n}+ años exp.</option>`).join('')}</select></div>`;
const wa=m=>m.whatsapp?`<a class="btn g" target=_blank rel=noopener href="https://wa.me/${esc(m.whatsapp.replace(/\D/g,''))}">Contactar por WhatsApp</a>`:'';
const field=(n,l,v='',t='text')=>`<label>${l}</label><input name=${n} type=${t} value="${esc(v)}">`;
const pform=(u,adm)=>{const m=u.role==='mentor',s=u.role==='student',a=u.role==='admin',j=x=>(x||[]).join(', ');return `<div style="max-height:85vh;overflow-y:auto;padding-right:4px"><div class="row sp" style="margin-bottom:12px;border-bottom:1px solid #e2e8f0;padding-bottom:10px"><h2 style="margin:0">✏️ Editar Perfil de ${m?'Mentor':(s?'Estudiante':'Administrador')}</h2><button class=btn data-a=close title="Cerrar">✕</button></div><form data-f=prof data-id=${u.id}><h4 style="margin:10px 0 6px;color:#1e40af;font-size:14px">👤 Datos Personales</h4><div class="grid g2" style="gap:10px"><div>${field('name','Nombre completo',u.name)}</div><div>${field('city','Ciudad y país',u.city)}</div></div><label>Acerca de mí (Biografía / Presentación)</label><textarea name=bio rows=3 placeholder="Cuéntale a la comunidad sobre tu experiencia, pasiones o lo que estás aprendiendo…">${esc(u.bio)}</textarea><h4 style="margin:14px 0 6px;color:#1e40af;font-size:14px">🎓 Información Académica</h4><div class="grid g2" style="gap:10px"><div>${field('institution',m?'Empresa o Universidad donde laboras':'Universidad o Instituto',u.institution)}</div><div>${field('faculty','Facultad o Área académica',u.faculty)}</div></div>${m?`<div class="grid g2" style="gap:10px"><div>${field('specialty','Especialidad principal',u.specialty)}</div><div>${field('experience','Años de experiencia profesional',u.experience,'number')}</div></div>${field('studies','Grado académico / Estudios (ej. Máster en IA, Ing. de Sistemas)',u.studies)}${field('courses','📚 Cursos que dominas (separados por coma)',j(u.courses))}${field('skills','💡 Habilidades técnicas (separadas por coma)',j(u.skills))}`:''}${s?`<div class="grid g2" style="gap:10px"><div>${field('career','Carrera profesional',u.career)}</div><div>${field('level','Nivel o Ciclo actual (ej. 5to ciclo)',u.level)}</div></div><div class="grid g2" style="gap:10px"><div>${field('goals','🎯 Metas académicas / Objetivos de aprendizaje',u.goals)}</div><div>${field('mode','💻 Modalidad preferida (ej. Virtual por Meet, Tardes)',u.mode)}</div></div>${field('interests','🎯 Áreas y cursos que deseas aprender (separados por coma)',j(u.interests))}${field('skills','💡 Habilidades que ya dominas (separadas por coma)',j(u.skills))}`:''}<h4 style="margin:14px 0 6px;color:#1e40af;font-size:14px">🌐 Contacto y Redes</h4><div class="grid g2" style="gap:10px"><div>${field('languages','Idiomas que dominas (separados por coma)',j(u.languages))}</div><div>${field('whatsapp','WhatsApp (con código de país, ej. 51987654321)',u.whatsapp)}</div></div>${field('linkedin','LinkedIn o Enlace a Portafolio / GitHub / CV',u.linkedin)}<h4 style="margin:14px 0 6px;color:#1e40af;font-size:14px">🖼️ Foto de Perfil</h4><div style="background:#f8fafc;padding:12px;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:12px"><div class="row" style="gap:12px;align-items:center;margin-bottom:10px"><div style="width:58px;height:58px;border-radius:50%;overflow:hidden;border:2px solid #2563eb;flex-shrink:0;background:#e2e8f0;display:flex;align-items:center;justify-content:center"><img id=ph_preview src="${esc(cleanPhotoUrl(u.photo)||'avatars/MENT.png')}" style="width:100%;height:100%;object-fit:cover" onerror="this.onerror=null;this.src='avatars/MENT.png'"></div><div style="flex:1"><label style="font-size:12px;margin:0 0 3px;color:#334155;font-weight:700">Enlace de Google Fotos, Drive o URL de imagen:</label><input name=photo id=ph value="${esc(u.photo||'')}" placeholder="Pega el enlace de Google Fotos, Drive o URL..." style="margin:0" data-in=photourl><small style="color:#64748b;font-size:11px;display:block;margin-top:2px">Soporta enlaces de Google Drive, Google Fotos y enlaces directos de imágenes web.</small></div></div><div class="row" style="gap:10px;align-items:center;flex-wrap:wrap"><label class="btn" style="cursor:pointer;background:#fff;border-color:#cbd5e1;font-size:12.5px;padding:7px 12px;display:inline-flex;align-items:center;gap:6px">📁 <b>Agregar imagen desde mi dispositivo</b><input type=file id=pfile accept="image/*" style="display:none" data-in=photofile></label><span style="font-size:12px;color:#64748b">o elige un avatar:</span></div><div class=row style="margin-top:10px;gap:8px">${AV.map(a=>`<img class=av data-a=pick data-p="avatars/${a}" src="avatars/${a}" style="width:40px;height:40px;cursor:pointer;border:2px solid transparent;object-fit:cover" title="Elegir este avatar">`).join('')}</div></div><div class="row" style="margin-top:16px;gap:10px"><button class="btn p" style="padding:9px 20px">💾 Guardar cambios</button><button type=button class=btn data-a=close>Cancelar</button></div></form></div>`};
const chipEd=(u,k,l)=>{const own=u.id===S.me.id&&u.role!=='admin',a=u[k]||[];return (a.length||own)?`<h3 style="margin-top:14px">${l}</h3><div>${a.map((x,i)=>`<span class=chip>${esc(x)}${own?` <a data-a=idel data-k=${k} data-i=${i} style="cursor:pointer" title=Quitar>✕</a>`:''}</span>`).join('')||'<small>Aún no agregaste ninguno.</small>'}</div>${own?`<form data-f=iadd data-k=${k} class=row style="flex-wrap:nowrap;margin-top:6px"><input name=v placeholder="Agregar (separa con comas)" style="margin:0"><button class="btn p">Agregar</button></form>`:''}`:''};
const kv=(l,v)=>v?`<b>${l}</b><span>${v}</span>`:'';
const pview=u=>{const m=u.role==='mentor',s=u.role==='student',a=u.role==='admin',own=u.id===S.me.id,
 ks=m?['specialty','bio','experience','studies','city','institution','whatsapp','photo']:s?['career','level','bio','city','institution','photo']:['bio','city','photo'],
 pc=Math.round((ks.filter(k=>u[k]).length+((u.skills||[]).length?1:0))/(ks.length+1)*100),
 r=m&&rating(u.id),g=s&&gradeOf(u.id),
 stCount=acc().filter(x=>(m?x.mentor===u.id:x.student===u.id)&&x.sesion!=='Cancelada').length,
 gradesReceived=s?S.grades.filter(x=>x.student===u.id):[],
 roleTitle=m?'🧑‍🏫 Mentor Académico':(s?'🎓 Estudiante':'👑 Administrador'),
 subtitle=m?`${u.specialty||'Mentor'} · ${u.institution||'Institución'}`:(s?`${u.career||'Estudiante'} · ${u.level||'Ciclo actual'}`:'Gestor de la plataforma'),
 defGrad=m?'linear-gradient(135deg,#1e3a8a 0%,#2563eb 60%,#38bdf8 100%)':s?'linear-gradient(135deg,#4338ca 0%,#6366f1 60%,#a855f7 100%)':'linear-gradient(135deg,#0b1b4d 0%,#1e3a8a 100%)';
 return `<div class=card style="padding:0;overflow:hidden;border:1px solid #e2e8f0;border-radius:18px">
  <div class=cover style="height:150px;background:${defGrad};position:relative;overflow:hidden">
   <div style="position:absolute;top:12px;right:14px;display:flex;gap:8px;z-index:2">
    <span class="badge ${u.active!==false?'g':'r'}" style="box-shadow:0 2px 6px rgba(0,0,0,.15);font-size:12px">${u.active!==false?'● Activo':'● Suspendido'}</span>
    ${u.verified?'<span class="badge" style="background:#fff;color:#16a34a;box-shadow:0 2px 6px rgba(0,0,0,.15);font-weight:700">✔ Verificado</span>':''}
   </div>
  </div>
  <div style="padding:0 24px 20px">
   <div class="row sp" style="margin-top:-50px;align-items:flex-end">
    <div class=pav style="position:relative;cursor:pointer" data-a=imgzoom data-src="${esc(cleanPhotoUrl(u.photo)||'avatars/MENT.png')}" data-title="Foto de perfil de ${esc(u.name)}" title="Clic para ver foto en tamaño grande">
     ${av(u,96)}
     <span style="position:absolute;bottom:2px;right:2px;background:#2563eb;color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)" title="Ver foto">🔍</span>
    </div>
    <div class=row style="gap:8px;flex-wrap:wrap">
     ${own?`<button class="btn p" data-a=pedit style="box-shadow:0 2px 8px rgba(37,99,235,.25)">✏️ Editar perfil</button>${!a?'<button class=btn data-a=reset>🔑 Cambiar contraseña</button>':''}`
     :`${S.me.role!=='admin'?`<button class="btn g" data-a=msg data-id=${u.id} style="box-shadow:0 2px 8px rgba(22,163,74,.25)">💬 Enviar mensaje</button>`:''}
       ${S.me.role==='student'&&m?`<button class="btn p" data-a=mreq data-id=${u.id}>📩 Mandar solicitud</button><button class="btn" data-a=ratemodal data-id=${u.id} style="background:#fef3c7;border-color:#fde68a;color:#92400e;font-weight:700">⭐ Calificar</button>`:''}
       ${S.me.role==='mentor'&&s?`<button class="btn p" data-a=grade data-id=${u.id}>⭐ Calificar</button>`:''}
       ${u.whatsapp?`<a class="btn" style="background:#25d366;color:#fff;border-color:#25d366" target=_blank rel=noopener href="https://wa.me/${esc(u.whatsapp.replace(/\D/g,''))}">📱 WhatsApp</a>`:''}`}
    </div>
   </div>
   <div style="margin-top:14px">
    <div class="row" style="gap:8px;align-items:center"><h2 style="font-size:24px;margin:0;color:#0f172a">${esc(u.name)}</h2><span class="badge" style="background:#eff6ff;color:#1e40af;font-size:12px">${roleTitle}</span></div>
    <p class=sub style="margin:4px 0 6px;font-size:14px;color:#475569"><b>${esc(subtitle)}</b></p>
    <p class=sub style="margin:0;font-size:13px;color:#64748b">${u.city?'📍 '+esc(u.city)+' · ':''}${u.institution?'🏛️ '+esc(u.institution):''}</p>
   </div>
   <div class="grid g4" style="margin:18px 0 14px;gap:12px">
    ${m?`<div class="card stat" style="box-shadow:none;border:1px solid #e2e8f0;background:#f8fafc;padding:12px 14px"><span>👥 Estudiantes</span><b>${u.studentsCount||0}</b></div>
         <div class="card stat" style="box-shadow:none;border:1px solid #e2e8f0;background:#f8fafc;padding:12px 14px"><span>⭐ Calificación</span><b>${r?r.v+'/10 ⭐ ('+r.n+')':'0.0 ⭐ (0)'}</b><div style="margin-top:2px">${starIcons(r?r.v:0)}</div></div>
         <div class="card stat" style="box-shadow:none;border:1px solid #e2e8f0;background:#f8fafc;padding:12px 14px"><span>💼 Experiencia</span><b>${(+u.experience>0)?u.experience+' años':'Acreditado'}</b></div>
         <div class="card stat" style="box-shadow:none;border:1px solid #e2e8f0;background:#f8fafc;padding:12px 14px"><span>📚 Cursos</span><b>${(u.courses||[]).length} materias</b></div>`
       :s?`<div class="card stat" style="box-shadow:none;border:1px solid #e2e8f0;background:#f8fafc;padding:12px 14px"><span>📊 Nota promedio</span><b>${g?g.v+'/'+MAXG:'—'}</b></div>
          <div class="card stat" style="box-shadow:none;border:1px solid #e2e8f0;background:#f8fafc;padding:12px 14px"><span>🎓 Nivel / Ciclo</span><b>${esc(u.level||'—')}</b></div>
          <div class="card stat" style="box-shadow:none;border:1px solid #e2e8f0;background:#f8fafc;padding:12px 14px"><span>💡 Habilidades</span><b>${(u.skills||[]).length}</b></div>
          <div class="card stat" style="box-shadow:none;border:1px solid #e2e8f0;background:#f8fafc;padding:12px 14px"><span>🎯 Asesorías</span><b>${stCount}</b></div>`
       :`<div class="card stat" style="box-shadow:none;border:1px solid #e2e8f0;background:#f8fafc;padding:12px 14px"><span>Estudiantes</span><b>${S.users.filter(x=>x.role==='student').length}</b></div>
         <div class="card stat" style="box-shadow:none;border:1px solid #e2e8f0;background:#f8fafc;padding:12px 14px"><span>Mentores</span><b>${S.users.filter(x=>x.role==='mentor').length}</b></div>
         <div class="card stat" style="box-shadow:none;border:1px solid #e2e8f0;background:#f8fafc;padding:12px 14px"><span>Solicitudes</span><b>${S.reqs.length}</b></div>
         <div class="card stat" style="box-shadow:none;border:1px solid #e2e8f0;background:#f8fafc;padding:12px 14px"><span>Estado</span><b>Activo</b></div>`}
   </div>
   ${own&&!a?`<div style="background:#f1f5f9;padding:10px 14px;border-radius:10px;margin-top:6px"><div class="row sp" style="margin-bottom:4px"><small style="font-weight:600;color:#334155">Completitud del perfil: ${pc}%</small><small style="color:#64748b">${pc>=80?'¡Excelente perfil!':'Completa más datos para destacar'}</small></div><div class=bar><div style="width:${pc}%"></div></div></div>`:''}
  </div>
 </div>
 <div class="grid g2" style="margin-top:16px;gap:16px">
  <div class=card style="border:1px solid #e2e8f0">
   <h3 style="color:#1e3a8a;border-bottom:1px solid #f1f5f9;padding-bottom:8px;margin-bottom:12px">👤 Acerca de ${esc(u.name.split(' ')[0])}</h3>
   <p style="line-height:1.6;color:#334155;margin:0 0 14px">${esc(u.bio||'Este usuario aún no ha agregado una biografía.')}</p>
   ${m&&(u.courses||[]).length?`<div style="margin:14px 0;background:#eff6ff;padding:12px;border-radius:12px;border:1px solid #dbeafe"><h4 style="margin:0 0 8px;color:#1e40af;font-size:13px">📚 Cursos que domina e imparte:</h4><div style="display:flex;flex-wrap:wrap;gap:6px">${u.courses.map(c=>`<span class=badge style="background:#fff;color:#1e40af;border:1px solid #bfdbfe;font-size:12px;padding:4px 10px;font-weight:600">📘 ${esc(c)}</span>`).join('')}</div></div>`:''}
   ${s&&(u.interests||[]).length?`<div style="margin:14px 0;background:#f5f3ff;padding:12px;border-radius:12px;border:1px solid #ddd6fe"><h4 style="margin:0 0 8px;color:#6d28d9;font-size:13px">🎯 Cursos y áreas que desea aprender:</h4><div style="display:flex;flex-wrap:wrap;gap:6px">${u.interests.map(c=>`<span class=badge style="background:#fff;color:#6d28d9;border:1px solid #c4b5fd;font-size:12px;padding:4px 10px;font-weight:600">🎯 ${esc(c)}</span>`).join('')}</div></div>`:''}
   ${(u.skills||[]).length?`<div style="margin:14px 0"><h4 style="margin:0 0 8px;color:#334155;font-size:13px">💡 Habilidades:</h4><div>${chips(u.skills)}</div></div>`:''}
   ${(u.languages||[]).length?`<div style="margin-top:14px"><h4 style="margin:0 0 6px;color:#334155;font-size:13px">🗣️ Idiomas:</h4><p style="margin:0;color:#64748b;font-size:13px">${esc(u.languages.join(' · '))}</p></div>`:''}
  </div>
  <div style="display:flex;flex-direction:column;gap:16px">
   <div class=card style="border:1px solid #e2e8f0">
    <h3 style="color:#1e3a8a;border-bottom:1px solid #f1f5f9;padding-bottom:8px;margin-bottom:12px">📋 Información Académica y Contacto</h3>
    <div class=kv>${kv('Correo',esc(u.email))}${kv('Institución',esc(u.institution))}${kv('Facultad',esc(u.faculty))}${m?kv('Estudios',esc(u.studies)):''}${s?kv('Carrera',esc(u.career))+kv('Ciclo actual',esc(u.level))+kv('Metas de aprendizaje',esc(u.goals))+kv('Modalidad preferida',esc(u.mode)):''}${u.linkedin?kv('LinkedIn',`<a href="${esc(u.linkedin)}" target=_blank rel=noopener style="color:#2563eb;font-weight:600">Ver perfil profesional →</a>`):''}${u.whatsapp?kv('WhatsApp',`<a href="https://wa.me/${esc(u.whatsapp.replace(/\D/g,''))}" target=_blank rel=noopener style="color:#16a34a;font-weight:600">+${esc(u.whatsapp)}</a>`):''}</div>
   </div>
   ${m?`<div class=card style="border:1px solid #e2e8f0"><h3 style="color:#1e3a8a;border-bottom:1px solid #f1f5f9;padding-bottom:8px;margin-bottom:12px">🕒 Disponibilidad para Asesorías</h3>${(u.availability||[]).length?`<div style="display:grid;gap:6px">${u.availability.map(a=>`<div class="row sp" style="padding:6px 10px;background:#f8fafc;border-radius:8px;border:1px solid #f1f5f9"><span style="font-weight:600;color:#1e293b">🗓️ ${a.d}</span><span class="badge" style="background:#e0f2fe;color:#0369a1">⏰ ${a.a} – ${a.b}</span></div>`).join('')}</div>`:'<p class=sub style="margin:0">El mentor no ha especificado horarios fijos todavía. Puedes enviarle una solicitud para coordinar.</p>'}</div>`:''}
   ${s&&gradesReceived.length?`<div class=card style="border:1px solid #e2e8f0"><h3 style="color:#1e3a8a;border-bottom:1px solid #f1f5f9;padding-bottom:8px;margin-bottom:12px">⭐ Calificaciones recibidas de mentores</h3><div style="display:grid;gap:8px">${gradesReceived.map(gr=>{const men=U(gr.mentor);return `<div style="background:#f8fafc;padding:10px 12px;border-radius:10px;border:1px solid #e2e8f0"><div class="row sp"><b style="color:#0f172a">${esc(men.name)}</b><span class="badge g" style="font-size:13px;font-weight:700">Nota: ${gr.value}/${MAXG}</span></div>${gr.comment?`<p style="margin:4px 0 0;font-size:12.5px;color:#475569;font-style:italic">«${esc(gr.comment)}»</p>`:''}</div>`}).join('')}</div></div>`:''}
  </div>
 </div>`};
const reqStatusBadge=r=>{
 if(r.status==='RECHAZADA')return `<span class="badge r">RECHAZADA</span>`;
 if(r.status==='PENDIENTE')return `<span class="badge y">PENDIENTE</span>`;
 if(r.status==='ACEPTADA'){
  if(r.sesion==='Finalizada'||isPast(r.date,r.time))return `<span class="badge" style="background:#dcfce7;color:#166534;font-weight:700">✔ CLASE FINALIZADA</span>`;
  if(r.sesion==='Cancelada')return `<span class="badge r">CANCELADA</span>`;
  return `<span class="badge g">ACEPTADA</span> <span class="badge" style="background:#eff6ff;color:#1e40af;font-weight:600">Confirmada</span>`;
 }
 return `<span class="badge ${stB(r.status)}">${r.status}</span>`;
};
const reqRow=(r,who)=>{const o=U(who==='m'?r.student:r.mentor),noD=!r.date||r.date.includes('fijar');return `<tr><td><div class=row>${av(o,36)}<div><b>${esc(o.name)}</b><br><small>${esc(o.career||o.specialty||'')} ${esc(o.level||'')}</small></div></div></td><td><b>${esc(r.specialty)}</b></td><td><small>${esc(r.message)}</small></td><td>${noD?'<span class="badge y">Horario por fijar por el mentor</span>':`${fdate(r.date)} ${esc(r.time)}`}</td><td>${reqStatusBadge(r)}</td><td>${rcell(r,who)}</td></tr>`};
const rtable=(rs,who)=>rs.length?`<div class="card tw"><table><tr><th>${who==='m'?'Estudiante':'Mentor'}</th><th>Especialidad</th><th>Mensaje</th><th>Fecha</th><th>Estado</th><th></th></tr>${rs.map(r=>reqRow(r,who)).join('')}</table></div>`:'<div class=card><p class=sub>No hay solicitudes todavía.</p></div>';
const ctsList=()=>{const h=S.me?.hiddenChats||{};return [...new Set([...acc().flatMap(r=>(r.members||[]).filter(x=>x!==S.me.id)),...S.msgs.flatMap(m=>(m.members||[]).filter(x=>x!==S.me.id))])].filter(Boolean).filter(id=>userExists(id)&&(!h[id]||S.msgs.some(m=>m.from===id&&m.ts>h[id])))};
const ctsHtml=()=>ctsList().map(id=>{
 const u=U(id),cId=cid(S.me.id,id),ms=S.msgs.filter(m=>m.chatId===cId).sort((a,b)=>b.ts-a.ts),lastM=ms[0];
 const lastTxt=lastM?(lastM.file?'📎 '+(lastM.file.name||'Archivo'):(lastM.text||'')):'Sin mensajes';
 const unreadU=S.msgs.filter(m=>m.chatId===cId&&m.from===id&&!m.read).length;
 return `<div class="ct ${S.chat===id?'on':''}" data-a=open data-id=${id}><div style="position:relative;display:inline-flex">${av(u,38)}${isOnline(u)?'<span class=ct-online-dot title="En línea"></span>':''}</div><div class=ct-info><div class="row sp" style="flex-wrap:nowrap"><b style="flex:1;overflow:hidden;text-overflow:ellipsis">${esc(u.name)}</b>${unreadU?'<span class="ct-unread-dot" title="Mensajes nuevos"></span>':isOnline(u)?'<span class=badge-online-txt>en línea</span>':`<small style="font-size:11px;color:#94a3b8">${u.lastActive?ago(u.lastActive):''}</small>`}</div><small style="${unreadU?'font-weight:700;color:#1e293b':''}">${esc(lastTxt)}</small></div></div>`;
}).join('')||'<div style="padding:24px 16px;text-align:center;color:#64748b;font-size:13px">Aún no tienes conversaciones.<br><br>Explora mentores o alumnos y pulsa <b>«💬 Mensaje»</b> para comenzar.</div>';
const msgsHtml=()=>{
 if(!S.chat)return '<div style="display:flex;height:100%;align-items:center;justify-content:center;text-align:center;color:#667781"><p>Selecciona una conversación a la izquierda para empezar a chatear.</p></div>';
 const id=cid(S.me.id,S.chat),l=S.msgs.filter(m=>m.chatId===id).sort((a,b)=>a.ts-b.ts);
 if(!l.length)return '<div style="display:flex;height:100%;align-items:center;justify-content:center;text-align:center;color:#667781"><p>💬 Aún no hay mensajes en esta conversación.<br><small>Escribe abajo o envía un archivo para empezar.</small></p></div>';
 return l.map(m=>{
  const mi=m.from===S.me.id,canDel=mi||S.me.role==='admin';
  const isImg=m.file&&m.file.type&&m.file.type.startsWith('image/');
  const fl=m.file?(isImg
   ?`<a href="${esc(m.file.data)}" target=_blank rel=noopener><img src="${esc(m.file.data)}" class=msg-file-img alt="${esc(m.file.name||'imagen')}"></a>`
   :`<a download="${esc(m.file.name||'archivo')}" href="${esc(m.file.data)}" class=msg-file-doc><span>📄</span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(m.file.name||'Documento')}</span><span style="font-size:11px;opacity:.7">⬇</span></a>`):'';
  const timeStr=new Date(m.ts).toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'});
  const checkHtml=mi?`<span class="bub-check ${m.read?'read':'unread'}" title="${m.read?('Visto'+(m.readAt?' '+ago(m.readAt):'')):'Entregado'}">✓✓</span>`:'';
  const quoteHtml=m.replyTo?`<div class="bub-quote"><span class="bub-quote-tag">💬 En respuesta a la duda del Muro:</span><b>«${esc(m.replyTo.title)}»</b>${m.replyTo.text?`<small>${esc(m.replyTo.text)}</small>`:''}</div>`:'';
  return `<div class="bub ${mi?'me2':'other'}" id="msg_${m.id}">${!mi?`<span class=bub-author>${esc(U(m.from).name)}</span>`:''}${quoteHtml}${m.text?`<div class=bub-text>${esc(m.text)}</div>`:''}${fl}<div class=bub-meta><span>${timeStr}</span>${checkHtml}${canDel?`<button class=bub-del data-a=msgdel data-id="${m.id}" title="Eliminar este mensaje">🗑️</button>`:''}</div></div>`;
 }).join('');
};
const chatV=()=>{
 const isDead=S.chat&&!userExists(S.chat);
 const o=S.chat&&!isDead?U(S.chat):null;
 const rightPane=isDead?`<div class=chat-right style="align-items:center;justify-content:center;padding:24px"><div class=card style="text-align:center;max-width:440px;padding:36px 24px"><div style="font-size:52px;margin-bottom:12px">👤🚫</div><h3 style="margin:0 0 8px">Este usuario no existe o fue eliminado</h3><p class=sub style="margin:0 0 18px;line-height:1.5">No es posible enviar mensajes ni contactar a este usuario porque su cuenta ya no está disponible en la plataforma.</p><button class="btn p" data-a=cbackchat>Volver a mis conversaciones</button></div></div>`
 :o?`<div class=chat-right>
  <div class=chat-head>
   <button class="chat-back-btn" data-a=cbackchat title="Volver a lista">←</button>
   <div class=chat-head-user>
    <div class=chat-head-av-wrap>
     ${av(o,38)}${isOnline(o)?'<span class=chat-online-badge title="En línea"></span>':''}
    </div>
    <div class=chat-head-info>
     <b class=chat-head-name>${esc(o.name)}</b>
     <div class="chat-head-status ${isOnline(o)?'is-online':''}">
      <span class="chat-status-dot ${isOnline(o)?'is-online':'is-offline'}"></span>
      <span class="chat-status-text">${isOnline(o)?'en línea':formatLastSeen(o.lastActive)}</span>
     </div>
    </div>
   </div>
   <div class=chat-head-acts>
    ${wa(o)}
    <button class="chat-clear-btn" data-a=chatclear title="Borrar los mensajes de esta conversación">🗑️ Borrar</button>
   </div>
  </div>
  <div class=msgs id=msgs>${msgsHtml()}</div>
  <div class=chat-bar>
   ${S.replyHelp?`
   <div class=chat-reply-bar>
    <div class=chat-reply-bar-body>
     <div class=chat-reply-bar-tag>↪️ Respondiendo a la duda de <b>${esc(S.replyHelp.authorName)}</b> en el Muro:</div>
     <b class=chat-reply-bar-title>«${esc(S.replyHelp.title)}»</b>
     ${S.replyHelp.desc?`<small class=chat-reply-bar-desc>${esc(S.replyHelp.desc)}</small>`:''}
    </div>
    <button type=button class=chat-reply-bar-close data-a=cancelhelpreply title="Cancelar">✕</button>
   </div>`:''}
   <div id=file-preview class=file-pill>
    <span id=file-preview-name>📎 Archivo</span>
    <a data-a=filecancel title="Quitar archivo">✕</a>
   </div>
   <form data-f=msg class=chat-form autocomplete=off>
    <label class=chat-clip title="Adjuntar foto o archivo">📎<input type=file name=f data-in=file hidden accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"></label>
    <input name=t class=chat-input placeholder="${S.replyHelp?'Escribe tu respuesta a esta duda…':'Escribe un mensaje…'}" autocomplete=off>
    <button class=chat-send title="Enviar">➤</button>
   </form>
  </div>
 </div>`
 :`<div class=chat-right style="align-items:center;justify-content:center;display:flex;color:#667781;text-align:center;padding:24px"><div style="max-width:360px"><div style="font-size:56px;margin-bottom:12px">💬</div><h3 style="margin:0 0 8px">Tus conversaciones estilo WhatsApp</h3><p style="font-size:14px;line-height:1.5;margin:0">Selecciona un contacto en la lista izquierda o pulsa «💬 Mensaje» en el perfil de cualquier mentor o estudiante para iniciar un chat.</p></div></div>`;
 return `<div class="chat-container ${S.chat?'has-chat':''}">
  <div class=chat-left id=cts>
   <div class=chat-left-head><span>💬 Conversaciones</span><span class="badge p">${ctsList().length}</span></div>
   <div class=chat-list>${ctsHtml()}</div>
  </div>
  ${rightPane}
 </div>`;
};
const calV=()=>{const d=new Date();d.setMonth(d.getMonth()+S.cm,1);const y=d.getFullYear(),mo=d.getMonth(),first=(d.getDay()+6)%7,n=new Date(y,mo+1,0).getDate(),ev=acc().filter(r=>r.sesion!=='Cancelada'),key=i=>`${y}-${String(mo+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
 let c=DAYS.map(x=>`<b>${x.slice(0,3)}</b>`).join('')+'<div style="background:none"></div>'.repeat(first);for(let i=1;i<=n;i++)c+=`<div class="${ev.some(r=>r.date===key(i))?'ev':''}">${i}</div>`;
 const l=acc().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 return `<div class="grid g2"><div class=card><div class="row sp"><button class=btn data-a=cm data-d=-1>◀</button><b>${d.toLocaleDateString('es',{month:'long',year:'numeric'})}</b><button class=btn data-a=cm data-d=1>▶</button></div><div class=cal style="margin-top:12px">${c}</div></div>
 <div class="card tw"><h3>Sesiones</h3>${l.length?`<table>${l.map(r=>{const o=U(S.me.role==='mentor'?r.student:r.mentor),ss=r.sesion||'Confirmada';return `<tr><td>${fdate(r.date)} ${esc(r.time)}</td><td>${esc(o.name)}<br><small>${esc(r.specialty)}</small>${/^https:\/\//.test(r.meetLink||'')?`<br><a target=_blank rel=noopener href="${esc(r.meetLink)}">🎥 Entrar a Meet</a>`:''}${S.me.role==='mentor'&&ss==='Confirmada'?`<br><a href=# data-a=meet data-id=${r.id}>✏️ enlace Meet</a>`:''}</td><td><span class="badge ${stB(ss)}">${ss}</span></td><td>${ss==='Confirmada'?`${S.me.role==='mentor'?`<button class="btn g" data-a=ses data-s=Finalizada data-id=${r.id}>Finalizar</button> `:''}<button class="btn d" data-a=ses data-s=Cancelada data-id=${r.id}>Cancelar</button>`:ss==='Finalizada'&&S.me.role==='student'&&!S.rats.some(x=>x.mentor===r.mentor&&x.student===S.me.id)?`<button class="btn btn-sm p" data-a=ratemodal data-id="${r.mentor}">⭐ Calificar (1 al 10)</button>`:''}</td></tr>`}).join('')}</table>`:'<p class=sub>No tienes sesiones programadas.</p>'}</div></div>`};
const stat=(l,v)=>`<div class="card stat"><span>${l}</span><b>${v}</b></div>`;
const userStatusBadge=u=>{
 if(u.active===false||u.blocked||delUsers.has(u.id))return `<span class="badge r" style="background:#fee2e2;color:#991b1b;font-weight:700">🚫 Bloqueado</span>${u.inactiveReason?`<br><small style="color:#dc2626">${esc(u.inactiveReason)}</small>`:''}`;
 if(isOnline(u))return `<span class="badge g" style="background:#dcfce7;color:#166534;font-weight:700">🟢 En línea</span>`;
 const days=u.lastActive?(Date.now()-u.lastActive)/86400000:Infinity;
 if(!u.lastActive||days>=3)return `<span class="badge" style="background:#f1f5f9;color:#64748b;border:1px solid #cbd5e1;font-weight:600">⚪ Inactivo</span><br><small style="color:#94a3b8">${u.lastActive?`Sin entrar hace ${Math.floor(days)}d`:'Nunca ingresó'}</small>`;
 return `<span class="badge" style="background:#e0f2fe;color:#0369a1;font-weight:600">✔ Activo</span><br><small style="color:#64748b">${formatLastSeen(u.lastActive)}</small>`;
};
const peopleTable=rows=>`<div class="card tw"><table><tr><th>Usuario</th><th>Correo</th><th>Detalle</th><th>Estado de Conexión</th><th style="min-width:320px">Acciones de Administrador</th></tr>${rows.map(u=>`<tr><td><div class=row>${av(u,34)}<b>${esc(u.name)}</b>${u.verified?' <span class="badge g">✔ Verificado</span>':''}</div></td><td>${esc(u.email)}</td><td>${esc(u.specialty||u.career||'')}</td><td>${userStatusBadge(u)}</td><td><div class=adm-actions><div class=adm-row><button class="btn btn-sm" data-a=uedit data-id=${u.id}>👁️ Ver</button><button class="btn btn-sm p" data-a=aedit data-id=${u.id}>✏️ Editar</button>${u.role==='mentor'?`<button class="btn btn-sm" data-a=uver data-id=${u.id}>${u.verified?'Quitar ✔':'✔ Verificar'}</button>`:''}<button class="btn btn-sm" data-a=urole data-id=${u.id}>${u.role==='mentor'?'⇄ Estudiante':'⇄ Mentor'}</button></div><div class=adm-row><button class="btn btn-sm" data-a=upass data-id=${u.id}>🔑 Clave</button><button class="btn btn-sm ${u.active===false?'g':''}" data-a=utog data-id=${u.id}>${u.active===false?'▶ Reactivar':'⏸ Suspender'}</button><button class="btn btn-sm d" data-a=ublockdel data-id=${u.id} style="background:#fee2e2;color:#dc2626;border-color:#fca5a5" title="Eliminar y retirar de la lista">🚫 Eliminar</button></div></div></td></tr>`).join('')||'<tr><td colspan=5>Sin resultados</td></tr>'}</table></div>`;
const sbox=()=>`<input placeholder="Buscar…" value="${esc(S.q)}" data-in=sq>`;
const myStudents=()=>acc().flatMap(r=>reqStudents(r).map(u=>({r,u})));
const HELP_CATS=['Todas','Programación','Matemáticas','Inteligencia Artificial','Ciberseguridad & Redes','Bases de Datos & Cloud','Diseño UI/UX','General'];
const DEMO_HELPS=[];
const helpList=()=>{
 let l=(S.helps||[]).filter(x=>!delHelps.has(x.id)&&userExists(x.authorId));
 l=l.map(h=>({...h,replies:(h.replies||[]).filter(r=>userExists(r.authorId))}));
 const cat=S.helpCat||'Todas',tab=S.helpTab||'all';
 if(cat!=='Todas')l=l.filter(x=>x.category===cat);
 if(tab==='open')l=l.filter(x=>!x.solved);
 if(tab==='solved')l=l.filter(x=>x.solved);
 return l.sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0)||b.created-a.created);
};
const helpListHtml=()=>helpList().map(h=>{
 const own=S.me.id===h.authorId||S.me.role==='admin',reps=h.replies||[];
 const au=U(h.authorId);
 const career=h.authorCareer||au.career||'';
 const level=h.authorLevel||au.level||'';
 const inst=h.authorInstitution||au.institution||'';
 const isAuthorStudent=h.authorRole==='student'||au.role==='student';
 return `<div class="card help-card ${h.solved?'solved':''}" id="hcard_${h.id}">
  <div class="row sp"><div class=row>${av(au,36)}<div><b>${esc(h.authorName||au.name)}</b><br><small>${h.authorRole==='mentor'?'🧑‍🏫 Mentor':'🎓 Estudiante'}${career?` · <b>${esc(career)}</b>`:''} · ${ago(h.created)}</small></div></div><div class=row style="gap:6px">${h.pinned?'<span class="badge" style="background:#fef3c7;color:#b45309;border:1px solid #fde68a">📌 Fijada</span>':''}${h.locked?'<span class="badge" style="background:#f1f5f9;color:#64748b;border:1px solid #cbd5e1">🔒 Cerrada</span>':''}<span class="badge ${h.solved?'g':'y'}">${h.solved?'✅ Resuelta':'⏳ Pendiente'}</span><span class=badge>${esc(h.category||'General')}</span></div></div>
  ${isAuthorStudent&&(career||level||inst)?`<div style="margin:6px 0 2px"><span class=badge style="background:#eff6ff;color:#1e40af;font-size:11.5px;font-weight:600">🎓 Carrera: ${esc(career||'Estudiante')}${level?` · Nivel: ${esc(level)}`:''}${inst?` · ${esc(inst)}`:''}</span></div>`:''}
  <h3 style="margin:10px 0 6px;font-size:16px">${esc(h.title)}</h3>
  <p style="margin:0 0 10px;line-height:1.45">${esc(h.description)}</p>
  ${reps.length?`<div style="margin:10px 0 6px"><small style="font-weight:700;color:var(--m)">💬 Respuestas de apoyo (${reps.length}):</small>${reps.map(r=>{const canDelRep=S.me.id===r.authorId||S.me.role==='admin';return `<div class=help-reply><div class="row sp" style="margin-bottom:3px"><div class=row>${av(U(r.authorId),22)}<b>${esc(r.authorName||U(r.authorId).name)}</b><small style="margin-left:4px">${r.authorRole==='mentor'?'🧑‍🏫 Mentor':'🎓 Estudiante'}</small></div><div class=row style="gap:6px"><small>${ago(r.ts)}</small>${canDelRep?`<button class="btn d" style="padding:1px 6px;font-size:11px" data-a=helprepdel data-hid="${h.id}" data-rid="${r.id}" title="Eliminar respuesta">✕</button>`:''}</div></div><p style="margin:0;font-size:13px">${esc(r.text)}</p></div>`}).join('')}</div>`:''}
  <div class="row" style="margin-top:10px;padding-top:8px;border-top:1px solid #eef2f9;gap:8px">
   ${h.locked&&S.me.role!=='admin'?'<span style="font-size:12px;color:#64748b;font-style:italic">🔒 Discusión cerrada para nuevas respuestas</span>':`<button class="btn p" data-a=helprep data-id=${h.id}>💬 Responder en el muro</button>`}
   ${S.me.id!==h.authorId&&S.me.role!=='admin'?(S.me.role==='mentor'?`<button class="btn g" data-a=helpchat data-id=${h.authorId} data-hid="${h.id}" title="Ayudar directamente a este estudiante por chat respondiendo a su duda">💬 Ayudar por chat directo</button>`:`<button class=btn data-a=helpchat data-id=${h.authorId} data-hid="${h.id}">💬 Mensaje privado</button>`):''}
   ${own?`<button class="btn ${h.solved?'':'g'}" data-a=helpsolve data-id=${h.id}>${h.solved?'Reabrir duda':'✔ Marcar resuelta'}</button>`:''}
   ${own?`<button class="btn d" data-a=helpdel data-id=${h.id} style="background:#fee2e2;color:#dc2626;border-color:#fca5a5">🗑️ Eliminar</button>`:''}
   ${S.me.role==='admin'?`<button class="btn btn-sm ${h.pinned?'p':''}" data-a=helppin data-id="${h.id}">${h.pinned?'📌 Desfijar':'📌 Fijar'}</button><button class="btn btn-sm ${h.locked?'d':''}" data-a=helplock data-id="${h.id}">${h.locked?'🔓 Reabrir':'🔒 Cerrar'}</button>`:''}
  </div>
 </div>`;
}).join('')||'<div class=card><p class=sub>No hay dudas en esta sección. ¡Publica la primera duda o consejo!</p></div>';
const helpV=()=>{
 const cat=S.helpCat||'Todas',tab=S.helpTab||'all';
 return `<div id=help-wrap><div class="row sp" style="margin-bottom:14px"><div><h2 style="margin:0">🤝 Muro de Ayuda entre Compañeros</h2><p class=sub style="margin:4px 0 0">Pregunta, resuelve dudas y apoya a estudiantes y mentores de todas las áreas.</p></div><button class="btn p" data-a=helpnew>+ Publicar una duda o pedir ayuda</button></div>
 <div class="row" style="margin-bottom:10px;gap:8px">${[['all','Todas las dudas'],['open','⏳ Pendientes de ayuda'],['solved','✅ Resueltas']].map(([k,l])=>`<button class="btn ${tab===k?'p':''}" data-a=htab data-v="${k}">${l}</button>`).join('')}</div>
 <div class="row" style="margin-bottom:14px;gap:6px;overflow-x:auto;padding-bottom:4px">${HELP_CATS.map(c=>`<button class="btn ${cat===c?'p':''}" data-a=hcat data-v="${c}" style="border-radius:20px;padding:5px 12px;font-size:12px">${c}</button>`).join('')}</div>
 <div id=help-list class="grid" style="gap:14px">${helpListHtml()}</div></div>`;
};
const sesListHtml=()=>{
 const tab=S.sesTab||'all',stF=S.sesStatus||'';
 const list=S.reqs.filter(r=>r.status==='ACEPTADA'&&(!stF||(r.sesion||'Confirmada')===stF));
 const stuIds=[...new Set(list.map(r=>r.student))], menIds=[...new Set(list.map(r=>r.mentor))];
 if(tab==='by_student') return `<div class="grid g2">${stuIds.map(sid=>{
  const st=U(sid),sList=list.filter(r=>r.student===sid);
  return `<div class=card><div class="row sp" style="margin-bottom:10px"><div class=row>${av(st,40)}<div><b>${esc(st.name)}</b><br><small>${esc(st.career||'Estudiante')} · ${esc(st.level||'')}</small></div></div><span class="badge p">${sList.length} sesión(es)</span></div>
  <div class=tw><table><tr><th>Mentor</th><th>Fecha/Hora</th><th>Estado</th><th></th></tr>${sList.map(r=>`<tr><td>${esc(U(r.mentor).name)}</td><td>${fdate(r.date)} ${esc(r.time)}</td><td><span class="badge ${stB(r.sesion||'Confirmada')}">${r.sesion||'Confirmada'}</span></td><td><button class="btn d" data-a=rdel data-id=${r.id}>Eliminar</button></td></tr>`).join('')}</table></div></div>`;
 }).join('')||'<div class=card><p class=sub>Sin asesorías para estudiantes.</p></div>'}</div>`;
 if(tab==='by_mentor') return `<div class="grid g2">${menIds.map(mid=>{
  const mt=U(mid),mList=list.filter(r=>r.mentor===mid);
  return `<div class=card><div class="row sp" style="margin-bottom:10px"><div class=row>${av(mt,40)}<div><b>${esc(mt.name)}</b><br><small>${esc(mt.specialty||'Mentor')}</small></div></div><span class="badge g">${mList.length} sesión(es)</span></div>
  <div class=tw><table><tr><th>Estudiante</th><th>Fecha/Hora</th><th>Estado</th><th></th></tr>${mList.map(r=>`<tr><td>${esc(U(r.student).name)}</td><td>${fdate(r.date)} ${esc(r.time)}</td><td><span class="badge ${stB(r.sesion||'Confirmada')}">${r.sesion||'Confirmada'}</span></td><td><button class="btn d" data-a=rdel data-id=${r.id}>Eliminar</button></td></tr>`).join('')}</table></div></div>`;
 }).join('')||'<div class=card><p class=sub>Sin asesorías para mentores.</p></div>'}</div>`;
 return `<div class="card tw"><table><tr><th>Estudiante</th><th>Mentor</th><th>Especialidad / Tema</th><th>Fecha y Hora</th><th>Google Meet</th><th>Estado</th><th>Acciones</th></tr>${list.map(r=>`<tr>
  <td><div class=row>${av(U(r.student),30)}<span>${esc(U(r.student).name)}<br><small>${esc(U(r.student).career||'')}</small></span></div></td>
  <td><div class=row>${av(U(r.mentor),30)}<span>${esc(U(r.mentor).name)}<br><small>${esc(U(r.mentor).specialty||'')}</small></span></div></td>
  <td><b>${esc(r.specialty||'Asesoría')}</b></td>
  <td>${fdate(r.date)}<br><small>${esc(r.time)}</small></td>
  <td>${/^https:\/\//.test(r.meetLink||'')?`<a href="${esc(r.meetLink)}" target=_blank rel=noopener class="badge g">🎥 Entrar</a>`:''}<br><button class="btn" style="padding:2px 8px;font-size:11px;margin-top:2px" data-a=meet data-id=${r.id}>${r.meetLink?'Editar':'Añadir'}</button></td>
  <td><select data-in=ases data-id=${r.id} style="margin:0;padding:5px">${['Pendiente','Confirmada','Finalizada','Cancelada'].map(s=>`<option ${(r.sesion||'Confirmada')===s?'selected':''}>${s}</option>`).join('')}</select></td>
  <td><button class="btn d" data-a=rdel data-id=${r.id}>🗑️ Eliminar</button></td>
 </tr>`).join('')||'<tr><td colspan=7>Sin sesiones registradas.</td></tr>'}</table></div>`;
};
const admin_sesiones=()=>{
 const tab=S.sesTab||'all',stF=S.sesStatus||'';
 const list=S.reqs.filter(r=>r.status==='ACEPTADA'&&(!stF||(r.sesion||'Confirmada')===stF));
 return `<div id=ses-main><div class="row sp" style="margin-bottom:14px"><div><h2 style="margin:0">Gestión de Asesorías y Sesiones</h2><p class=sub style="margin:4px 0 0">Supervisa, clasifica y gestiona todas las sesiones entre estudiantes y mentores.</p></div><button class="btn p" data-a=mnew>+ Programar nueva asesoría</button></div>
 <div class="row sp" style="margin-bottom:12px"><div class="row" style="gap:8px">
  <button class="btn ${tab==='all'?'p':''}" data-a=sestab data-v="all">📅 Todas (${list.length})</button>
  <button class="btn ${tab==='by_student'?'p':''}" data-a=sestab data-v="by_student">🎓 Por Estudiantes</button>
  <button class="btn ${tab==='by_mentor'?'p':''}" data-a=sestab data-v="by_mentor">🧑‍🏫 Por Mentores</button>
 </div><div><select data-in=sesfilter style="margin:0;width:auto"><option value="">Todos los estados</option>${['Confirmada','Pendiente','Finalizada','Cancelada'].map(s=>`<option value="${s}" ${stF===s?'selected':''}>${s}</option>`).join('')}</select></div></div>
 <div id=ses-wrap>${sesListHtml()}</div></div>`;
};
const adminReqsHtml=()=>{
 const f=S.rf||'',list=S.reqs.filter(r=>!f||r.status===f).sort((a,b)=>b.created-a.created);
 return `<div class="card tw"><table><tr><th>Estudiante</th><th>Mentor</th><th>Especialidad / Mensaje</th><th>Fecha solicitada</th><th>Estado</th><th>Acciones de Administrador</th></tr>${list.map(r=>`<tr>
  <td><div class=row>${av(U(r.student),32)}<span><b>${esc(U(r.student).name)}</b><br><small>${esc(U(r.student).career||'')}</small></span></div></td>
  <td><div class=row>${av(U(r.mentor),32)}<span><b>${esc(U(r.mentor).name)}</b><br><small>${esc(U(r.mentor).specialty||'')}</small></span></div></td>
  <td><b>${esc(r.specialty)}</b><br><small style="color:var(--t)">${esc(r.message||'Sin mensaje')}</small></td>
  <td>${fdate(r.date)}<br><small>${esc(r.time)}</small></td>
  <td><span class="badge ${stB(r.status)}">${r.status}</span></td>
  <td><div class=row style="gap:6px">${r.status==='PENDIENTE'?`<button class="btn g" data-a=aacc data-id=${r.id}>✔ Aprobar</button><button class="btn d" data-a=arej data-id=${r.id}>✕ Rechazar</button>`:''}<button class="btn d" data-a=rdel data-id=${r.id}>🗑️ Eliminar</button></div></td>
 </tr>`).join('')||'<tr><td colspan=6>Sin solicitudes en esta sección.</td></tr>'}</table></div>`;
};
const admin_reqs=()=>{
 const pCount=S.reqs.filter(r=>r.status==='PENDIENTE').length;
 return `<div class="row sp" style="margin-bottom:14px"><div><h2 style="margin:0">Centro de Solicitudes y Aprobaciones</h2><p class=sub style="margin:4px 0 0">Supervisa las solicitudes enviadas por estudiantes a mentores y aprueba o cancela.</p></div></div>
 <div class="row" style="margin-bottom:12px;gap:8px">${[['','Todas ('+S.reqs.length+')'],['PENDIENTE','⏳ Pendientes ('+pCount+')'],['ACEPTADA','✔ Aceptadas ('+S.reqs.filter(r=>r.status==='ACEPTADA').length+')'],['RECHAZADA','✕ Rechazadas ('+S.reqs.filter(r=>r.status==='RECHAZADA').length+')']].map(([k,l])=>`<button class="btn ${(S.rf||'')===k?'p':''}" data-a=rf data-v="${k}">${l}</button>`).join('')}</div>
 <div id=reqs-wrap>${adminReqsHtml()}</div>`;
};
const admin_reports=()=>{
 const st=S.users.filter(u=>u.role==='student'),mt=S.users.filter(u=>u.role==='mentor');
 const accSes=S.reqs.filter(r=>r.status==='ACEPTADA'),finSes=accSes.filter(r=>(r.sesion||'')==='Finalizada'),canSes=accSes.filter(r=>(r.sesion||'')==='Cancelada'),confSes=accSes.filter(r=>(r.sesion||'Confirmada')==='Confirmada');
 const avgRat=S.rats.length?(S.rats.reduce((a,x)=>a+x.value,0)/S.rats.length).toFixed(1):'—';
 return `<div>
  <div class="row sp" style="margin-bottom:16px"><div><h2 style="margin:0">Centro Avanzado de Reportes y Estadísticas</h2><p class=sub style="margin:4px 0 0">Analíticas completas de rendimiento académico, sesiones y satisfacción comunitaria.</p></div><div class=row><button class="btn p" data-a=csvu>📊 Descargar Usuarios (CSV)</button><button class="btn p" data-a=csvr>📅 Descargar Asesorías (CSV)</button></div></div>
  <div class="grid g4" style="margin-bottom:20px">${stat('Estudiantes Registrados',st.length)}${stat('Mentores Registrados',mt.length)}${stat('Asesorías Confirmadas',confSes.length)}${stat('Asesorías Concluidas',finSes.length)}${stat('Asesorías Canceladas',canSes.length)}${stat('Calificación Promedio',avgRat+(avgRat!=='—'?' / 10.0 ⭐':''))}${stat('Total Calificaciones',S.rats.length)}${stat('Usuarios Eliminados',S.tombs.length)}</div>
  <div class="grid g2" style="margin-bottom:20px">
   <div class=card><h3>🏆 Ranking de Mentores más Solicitados</h3><div class=tw style="margin-top:10px"><table><tr><th>Mentor</th><th>Especialidad</th><th>Sesiones</th><th>Calificación</th></tr>${[...mt].sort((a,b)=>accSes.filter(r=>r.mentor===b.id).length-accSes.filter(r=>r.mentor===a.id).length).slice(0,5).map(m=>{const count=accSes.filter(r=>r.mentor===m.id).length,r=rating(m.id);return `<tr><td><div class=row>${av(m,28)}<b>${esc(m.name)}</b></div></td><td><small>${esc(m.specialty||'—')}</small></td><td><b>${count}</b></td><td>${r?`⭐ ${r.v}/10 (${r.n})`:'0.0 ⭐ (0)'}</td></tr>`}).join('')||'<tr><td colspan=4>Sin mentores.</td></tr>'}</table></div></div>
   <div class=card><h3>🎓 Participación de Estudiantes</h3><div class=tw style="margin-top:10px"><table><tr><th>Estudiante</th><th>Carrera</th><th>Asesorías Concluidas</th><th>Estado</th></tr>${[...st].sort((a,b)=>accSes.filter(r=>r.student===b.id).length-accSes.filter(r=>r.student===a.id).length).slice(0,5).map(s=>{const count=accSes.filter(r=>r.student===s.id).length;return `<tr><td><div class=row>${av(s,28)}<b>${esc(s.name)}</b></div></td><td><small>${esc(s.career||'—')}</small></td><td><b>${count}</b></td><td>${userStatusBadge(s)}</td></tr>`}).join('')||'<tr><td colspan=4>Sin estudiantes.</td></tr>'}</table></div></div>
  </div>
 </div>`;
};
const MONTHS_ES=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'];
const getRecentActivities=()=>{
 const acts=[];
 for(const u of S.users){
  if(u.created)acts.push({ts:u.created,icon:u.role==='mentor'?'🧑‍🏫':'🎓',text:`<b>${esc(u.name)}</b> se registró como ${u.role==='mentor'?'mentor':'estudiante'}.`});
 }
 for(const r of S.reqs){
  const sName=esc(U(r.student).name),mName=esc(U(r.mentor).name);
  if(r.created)acts.push({ts:r.created,icon:'📩',text:`<b>${sName}</b> solicitó mentoría a <b>${mName}</b> (${esc(r.specialty||'Asesoría')}).`});
  if(r.status==='ACEPTADA'&&r.date)acts.push({ts:r.updatedAt||(r.created?r.created+60000:Date.now()-3600000),icon:r.sesion==='Finalizada'?'✅':(r.sesion==='Cancelada'?'❌':'📅'),text:`Sesión ${r.sesion||'Confirmada'}: <b>${sName}</b> y <b>${mName}</b> (${fdate(r.date)} ${esc(r.time)}).`});
 }
 for(const h of (S.helps||[])){
  if(h.created)acts.push({ts:h.created,icon:'💡',text:`<b>${esc(h.authorName||U(h.authorId).name)}</b> publicó en el muro: «${esc(h.title.slice(0,42))}${h.title.length>42?'…':''}».`});
  for(const rep of (h.replies||[])){
   if(rep.ts)acts.push({ts:rep.ts,icon:'💬',text:`<b>${esc(rep.authorName||U(rep.authorId).name)}</b> apoyó en «${esc(h.title.slice(0,30))}…».`});
  }
 }
 for(const rt of (S.rats||[])){
  if(rt.updated||rt.ts)acts.push({ts:rt.updated||rt.ts,icon:'⭐',text:`<b>${esc(U(rt.student).name||'Estudiante')}</b> calificó a <b>${esc(U(rt.mentor).name)}</b> con <b>${rt.value}/10 ⭐</b>.`});
 }
 for(const n of S.notifs){
  if(n.ts)acts.push({ts:n.ts,icon:'🔔',text:esc(n.text)});
 }
 return acts.filter(a=>a.ts&&!isNaN(a.ts)).sort((a,b)=>b.ts-a.ts).slice(0,8);
};
const uFilterCount=(r,flt)=>{
 return S.users.filter(u=>{
  if(u.role!==r||delUsers.has(u.id))return false;
  if(flt==='online')return isOnline(u);
  if(flt==='blocked')return u.active===false||u.blocked;
  const days=u.lastActive?(Date.now()-u.lastActive)/86400000:Infinity;
  const isInactive=u.active!==false&&!isOnline(u)&&(!u.lastActive||days>=3);
  if(flt==='inactive')return isInactive;
  if(flt==='active')return u.active!==false&&(isOnline(u)||(u.lastActive&&days<3));
  return true;
 }).length;
};
const ufilterBar=r=>`<div class="row sp" style="margin-bottom:12px;gap:8px;flex-wrap:wrap"><div style="flex:2;min-width:200px">${sbox()}</div><div class="row" style="gap:4px">${[
  ['all',`Todos (${uFilterCount(r,'all')})`],
  ['online',`🟢 En línea (${uFilterCount(r,'online')})`],
  ['active',`✔ Activos (${uFilterCount(r,'active')})`],
  ['inactive',`⚪ Inactivos (${uFilterCount(r,'inactive')})`],
  ['blocked',`🚫 Bloqueados (${uFilterCount(r,'blocked')})`]
].map(([k,l])=>`<button class="btn ${(S.ufilter||'all')===k?'p':''}" data-a=ufilter data-v="${k}" style="padding:6px 12px;font-size:12px">${l}</button>`).join('')}</div><button class="btn p" data-a=uadd data-r=${r}>+ Agregar ${r==='mentor'?'mentor':'estudiante'}</button></div>`;
/* ============================================================
   MENTORBOT IA - MOTOR DE CONOCIMIENTO Y ASISTENTE VIRTUAL
   ============================================================ */

const BOT_TOPICS = {
  how_works: {
    title: '💡 ¿Cómo funciona MentorApp? (Guía completa)',
    text: `**MentorApp** es una comunidad universitaria diseñada para conectar estudiantes con mentores y potenciar el aprendizaje:\n\n` +
          `🔹 **1. Para Estudiantes:**\n` +
          `• **Explorar mentores:** Encuentra profesores o compañeros avanzados filtrando por especialidad o carrera.\n` +
          `• **Solicitar mentoría:** Elige el curso y envía tu solicitud con los temas que necesitas aprender.\n` +
          `• **Clases en Meet:** Únete a clases en vivo por Google Meet con un solo clic.\n` +
          `• **Muro de Ayuda:** Publica dudas académicas con fotos o archivos y recibe respuestas comunitarias.\n` +
          `• **Calificaciones:** Califica a tus mentores con estrellas (1 a 10 ⭐).\n\n` +
          `🔹 **2. Para Mentores:**\n` +
          `• **Disponibilidad:** Configura qué días y horas atiendes para que los alumnos lo sepan.\n` +
          `• **Programar clases:** Agenda sesiones individuales o grupales con enlace de Meet.\n` +
          `• **Clases en vivo:** Inicia la reunión y la plataforma le avisará a tus alumnos en tiempo real.\n` +
          `• **Calificar alumnos:** Evalúa su desempeño de **0 a 20** con comentarios personalizados.\n\n` +
          `🔹 **3. Chat privado:**\n` +
          `• Mensajería instantánea en vivo con fotos y documentos.`,
    links: [
      { label: '🎥 Ir a Clases en Meet', v: 'meet' },
      { label: '👨‍🏫 Explorar Mentores', v: 'mentors' },
      { label: '🙋 Muro de Ayuda', v: 'help' }
    ]
  },
  sched_class: {
    title: '📅 ¿Cómo programar una clase por Google Meet?',
    text: `Para programar una clase como **mentor**:\n\n` +
          `1️⃣ Ve al menú lateral y haz clic en **«Clases en Meet»**.\n` +
          `2️⃣ Haz clic en el botón azul **«📅 + Programar clase de Meet»**.\n` +
          `3️⃣ **Modalidad:**\n` +
          `   • **Individual:** Selecciona el alumno en la lista.\n` +
          `   • **Grupal:** Marca las casillas de verificación de los alumnos que asistirán.\n` +
          `4️⃣ Indica la **Materia o tema** (ej. *Cálculo, Álgebra, Algoritmos*).\n` +
          `5️⃣ Define la **Fecha** y **Hora** de la clase.\n` +
          `6️⃣ Ingresa tu enlace de Meet (\`https://meet.google.com/...\`) o pulsa *+ Crear reunión en Meet*.\n` +
          `7️⃣ Pulsa **«Guardar y programar clase»**.\n\n` +
          `🔔 **Alerta automática:** La clase se guardará y notificará con sonido y aviso emergente a todos los alumnos seleccionados al instante.`,
    links: [
      { label: '📅 Abrir Programador de Clases', act: 'msched' },
      { label: '🎥 Ir a Clases en Meet', v: 'meet' }
    ]
  },
  meet_class: {
    title: '🎥 ¿Cómo entrar a Google Meet y clases en vivo?',
    text: `El sistema de videollamadas por Meet funciona en tiempo real:\n\n` +
          `🔹 **Si eres Estudiante:**\n` +
          `1. Entra a **«Clases en Meet»**.\n` +
          `2. En *Próximas clases programadas* verás tus sesiones con fecha y hora.\n` +
          `3. Cuando sea la hora o el mentor inicie la clase, verás un recuadro rojo: **«🔴 ¡Tu clase ha comenzado! EN VIVO AHORA»**.\n` +
          `4. Pulsa el botón **«🎥 Entrar a la clase en vivo»** o **«🎥 Unirme a Meet»** para abrir la reunión.\n\n` +
          `🔹 **Si eres Mentor:**\n` +
          `1. En **«Clases en Meet»**, pulsa **«🎥 Unirme a Meet»**.\n` +
          `2. La clase cambiará a estado *En vivo* automáticamente y tus alumnos recibirán la notificación.\n` +
          `3. Al finalizar la clase, haz clic en **«✔ Finalizar clase»** para colocar la calificación del alumno.`,
    links: [
      { label: '🎥 Ir a Clases en Meet', v: 'meet' }
    ]
  },
  request_mentor: {
    title: '👨‍🏫 ¿Cómo solicitar una mentoría a un profesor?',
    text: `Para pedir asesoría a un mentor experto:\n\n` +
          `1️⃣ Ve a **«Explorar mentores»** en el menú.\n` +
          `2️⃣ Escribe en el buscador el curso o tema que necesitas (ej. *Química, Programación, etc.*).\n` +
          `3️⃣ Revisa la calificación en estrellas ⭐, los cursos dominados y los horarios del mentor.\n` +
          `4️⃣ Haz clic en el botón azul **«📩 Mandar solicitud»**.\n` +
          `5️⃣ Elige el curso y escribe tu duda o los temas específicos a tratar.\n` +
          `6️⃣ Haz clic en **«Enviar solicitud»**.\n\n` +
          `💡 El mentor recibirá una notificación en su panel de *«Solicitudes»*. Cuando la acepte, fijarán fecha y enlace de Meet para la sesión.`,
    links: [
      { label: '👨‍🏫 Explorar Mentores', v: 'mentors' },
      { label: '📋 Mis Asesorías', v: 'mine' }
    ]
  },
  help_wall: {
    title: '🙋 ¿Cómo usar el Muro de Ayuda?',
    text: `El **Muro de Ayuda** te permite resolver dudas académicas de forma abierta con la comunidad:\n\n` +
          `1️⃣ Ve a **«Muro de Ayuda»** en el menú lateral.\n` +
          `2️⃣ Escribe el **Título de tu duda** y selecciona su categoría temática.\n` +
          `3️⃣ En la descripción, explica qué parte del tema no entiendes.\n` +
          `4️⃣ Puedes adjuntar una foto de tu ejercicio o apuntes con el botón de archivo.\n` +
          `5️⃣ Pulsa **«Publicar duda»**.\n` +
          `6️⃣ Los mentores y compañeros te responderán directamente.\n` +
          `7️⃣ Cuando la duda quede clara, haz clic en **«✔ Marcar como resuelta»**.\n` +
          `8️⃣ Si deseas conversar en privado con quien te ayudó, pulsa **«💬 Responder por chat privado»**.`,
    links: [
      { label: '🙋 Ir al Muro de Ayuda', v: 'help' }
    ]
  },
  grading: {
    title: '⭐ ¿Cómo funciona el sistema de notas y calificaciones?',
    text: `En MentorApp todos se evalúan para garantizar máxima calidad:\n\n` +
          `🔹 **1. Calificación de Alumnos (0 a 20 puntos):**\n` +
          `• El mentor califica al alumno pulsando **«✔ Finalizar clase»** o **«⭐ Calificar alumno»**.\n` +
          `• Ingresa una nota entre **0 y 20** y un comentario orientativo sobre su desempeño.\n` +
          `• Los estudiantes con mejores notas suben al podio de honor **«🏆 Alumnos destacados»** en el Inicio.\n\n` +
          `🔹 **2. Calificación de Mentores (1 a 10 estrellas ⭐):**\n` +
          `• Los alumnos califican a sus mentores con **1 a 10 estrellas** al terminar la clase o desde su perfil.\n` +
          `• El promedio de estrellas se muestra públicamente en la tarjeta del mentor para que todos conozcan su reputación.`,
    links: [
      { label: '🎥 Ver Clases en Meet', v: 'meet' },
      { label: '🏠 Ver Inicio / Alumnos Destacados', v: 'home' }
    ]
  },
  chat_files: {
    title: '💬 ¿Cómo usar el chat privado y enviar fotos o archivos?',
    text: `La sección **«Mis conversaciones»** incluye mensajería instantánea:\n\n` +
          `1️⃣ Selecciona el contacto en la lista izquierda.\n` +
          `2️⃣ Mira si la persona está **🟢 En línea** o su última hora de conexión.\n` +
          `3️⃣ Para adjuntar fotos o documentos, pulsa el icono del clip **📎** al lado del campo de texto.\n` +
          `4️⃣ Selecciona tu imagen o documento (hasta 850 KB) y pulsa el botón azul de enviar.\n` +
          `5️⃣ Los mensajes cuentan con doble check (✔✔ azul cuando la otra persona los abre).\n` +
          `6️⃣ También puedes citar dudas del Muro de Ayuda para responder directamente en el chat.`,
    links: [
      { label: '💬 Ir a Mis Conversaciones', v: 'chat' }
    ]
  },
  availability: {
    title: '🕒 ¿Cómo configurar horarios y ver mi cronograma?',
    text: `Para organizar tus tiempos:\n\n` +
          `🔹 **Para Mentores (Disponibilidad):**\n` +
          `1. Ve a **«Disponibilidad»** en el menú.\n` +
          `2. Marca los días de la semana en los que estás disponible para enseñar (ej. *Lun, Mié, Vie*).\n` +
          `3. Define el rango de hora (ej. *16:00 a 20:00*).\n` +
          `4. Pulsa **«Guardar disponibilidad»** para que tus alumnos sepan cuándo pedirte clases.\n\n` +
          `🔹 **Cronograma (Calendario mensual):**\n` +
          `En **«Mi cronograma»** verás un calendario mensual donde se marcan con círculos verdes los días que tienes clases agendadas.`,
    links: [
      { label: '🕒 Ir a Disponibilidad', v: 'avail' },
      { label: '📅 Ir a Mi Cronograma', v: 'cal' }
    ]
  },
  auth_account: {
    title: '🔐 ¿Cómo registrarse o recuperar contraseña?',
    text: `• **Crear cuenta:** En la pantalla inicial, pulsa *«¿No tienes una cuenta? Crear cuenta»*. Elige tu rol (**Estudiante** o **Mentor**), escribe tu nombre completo, correo y contraseña.\n` +
          `• **Google Sign-In:** Puedes pulsar *«Registrarme con cuenta de Google»* para entrar rápido y seguro.\n` +
          `• **Recuperar clave:** En el formulario de inicio de sesión, haz clic en *«¿Olvidaste tu contraseña?»*, ingresa tu correo y te enviaremos un enlace de recuperación.`,
    links: [
      { label: '🏠 Ir al Inicio', v: 'home' }
    ]
  },
  admin_panel: {
    title: '🛡️ Funciones del Panel de Administrador',
    text: `Si eres Administrador, tienes el control total del sistema:\n\n` +
          `• **Dashboard:** Estadísticas anuales y mensuales de registros.\n` +
          `• **Estudiantes y Mentores:** Consultar perfiles, verificar mentores con insignia verde ✔, cambiar roles, suspender o reactivar cuentas y cambiar claves temporales.\n` +
          `• **Sesiones y Mensajes:** Supervisar clases programadas y conexiones de chat comunitarias.\n` +
          `• **Avisos:** Publicar avisos globales en la parte superior de la pantalla con notificación push a todos los usuarios.\n` +
          `• **Control del Sitio:** Poner la web en modo mantenimiento cuando desees hacer cambios.`,
    links: [
      { label: '📊 Dashboard', v: 'dash' }
    ]
  }
};

const BOT_STATE = {
  open: false,
  voice: false,
  history: [
    {
      from: 'bot',
      title: '👋 ¡Hola! Soy MentorBot IA',
      text: '¡Hola! Soy tu **Robot Asistente Inteligente** de MentorApp 🤖✨.\n\nEstoy aquí para explicarte con lujo de detalles **cómo funciona la plataforma** y cómo usar cada herramienta paso a paso.\n\nPuedes pulsar cualquiera de los temas rápidos o escribirme cualquier duda que tengas:',
      links: [
        { label: '💡 ¿Cómo funciona la página?', topic: 'how_works' },
        { label: '🎥 Clases por Google Meet', topic: 'meet_class' },
        { label: '📅 Programar una clase', topic: 'sched_class' },
        { label: '👨‍🏫 Solicitar un mentor', topic: 'request_mentor' },
        { label: '🙋 Muro de Ayuda', topic: 'help_wall' },
        { label: '⭐ Cómo calificar', topic: 'grading' },
        { label: '💬 Chat y archivos', topic: 'chat_files' },
        { label: '🕒 Horarios y Disponibilidad', topic: 'availability' }
      ]
    }
  ]
};

const formatBotText = t => {
  let s = esc(t);
  s = s.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  s = s.replace(/\*(.*?)\*/g, '<i>$1</i>');
  s = s.replace(/`([^`]+)`/g, '<code style="background:#e0e7ff;color:#1e3a8a;padding:2px 6px;border-radius:6px;font-size:12px;font-family:monospace">$1</code>');
  s = s.replace(/\n/g, '<br>');
  return s;
};

function speakBot(text) {
  if (!BOT_STATE.voice || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const clean = String(text || '')
      .replace(/<[^>]*>/g, '')
      .replace(/[*_#`~[\]()•]/g, '')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .trim();
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'es-ES';
    u.rate = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const es = voices.find(v => v.lang && v.lang.startsWith('es'));
    if (es) u.voice = es;
    window.speechSynthesis.speak(u);
  } catch(e) {}
}

function toggleBotVoice() {
  BOT_STATE.voice = !BOT_STATE.voice;
  if (!BOT_STATE.voice && ('speechSynthesis' in window)) {
    window.speechSynthesis.cancel();
  }
  updateBotViews();
  toast(BOT_STATE.voice ? '🔊 Modo voz activado. El robot leerá sus respuestas.' : '🔇 Modo voz desactivado.');
}

function startBotDictation() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    return toast('Tu navegador no soporta dictado por voz. Puedes escribir tu duda.', 1);
  }
  try {
    const rec = new SpeechRec();
    rec.lang = 'es-ES';
    rec.interimResults = false;
    const btns = document.querySelectorAll('.bot-voice-btn');
    btns.forEach(b => b.classList.add('recording'));
    toast('🎙️ Escuchando... Di tu pregunta en voz alta.');
    rec.onresult = e => {
      const txt = e.results[0][0].transcript;
      btns.forEach(b => b.classList.remove('recording'));
      handleBotSubmit(txt);
    };
    rec.onerror = () => {
      btns.forEach(b => b.classList.remove('recording'));
      toast('No se detectó audio claro. Intenta escribir tu duda.', 1);
    };
    rec.onend = () => {
      btns.forEach(b => b.classList.remove('recording'));
    };
    rec.start();
  } catch(e) {
    toast('Error al activar el micrófono.', 1);
  }
}

function getBotAnswer(rawQuery) {
  const q = String(rawQuery || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (!q) return null;

  if (/^(hola|buen(as|os)|hey|saludos|que tal|como estas|quien eres|presentate)/i.test(q)) {
    return {
      title: '👋 ¡Hola! Soy MentorBot IA',
      text: '¡Hola! Soy tu robot asistente inteligente de **MentorApp** 🤖✨.\n\nEstoy programado para ayudarte a dominar cada herramienta de la página:\n• Programar clases de Google Meet (individuales y grupales)\n• Entrar a clases en vivo\n• Buscar y solicitar mentores\n• Usar el Muro de Ayuda y publicar preguntas\n• Calificar alumnos (0 a 20) y mentores (1 a 10 estrellas)\n• Chatear y compartir documentos\n\n¿Qué te gustaría aprender hoy?',
      links: [
        { label: '💡 ¿Cómo funciona todo?', topic: 'how_works' },
        { label: '🎥 Programar o entrar a Meet', topic: 'meet_class' },
        { label: '👨‍🏫 Solicitar un mentor', topic: 'request_mentor' },
        { label: '⭐ Cómo calificar', topic: 'grading' }
      ]
    };
  }

  if (/(gracias|muchas gracias|genial|perfecto|excelente|entendido|adios|chau|bye|hasta luego)/i.test(q)) {
    return {
      title: '🌟 ¡De nada! Siempre a tu servicio',
      text: '¡Es un placer ayudarte! Si tienes cualquier otra duda sobre cómo usar MentorApp, aquí estaré siempre listo para explicarte. ¡Muchos éxitos en tus mentorías! 🎓🚀',
      links: [
        { label: '💡 Explorar más temas', topic: 'how_works' },
        { label: '🎥 Ir a Clases en Meet', v: 'meet' }
      ]
    };
  }

  if (/(guia|tutorial|tour|paso a paso|ensename|explicame la pagina|como usar|donde veo la guia)/i.test(q)) {
    return {
      title: '📖 Guía Paso a Paso Interactiva',
      text: '¡Puedo abrir la **Guía Interactiva Paso a Paso** en cualquier momento para mostrarte las 6 funciones clave de MentorApp!\n\n1. Ingreso a la plataforma\n2. Conoce tu espacio y estadísticas\n3. Localizar al asistente virtual\n4. Presionar "Ver mis clases"\n5. Explorar clases en Google Meet\n6. ¡Todo listo para comenzar!',
      links: [
        { label: '🚀 Abrir Guía Interactiva', act: 'open_guide' },
        { label: '💡 ¿Cómo funciona todo?', topic: 'how_works' },
        { label: '🎥 Clases por Meet', topic: 'meet_class' }
      ]
    };
  }

  const matches = [];
  const check = (topicKey, rx) => {
    const m = q.match(rx);
    if (m) matches.push({ key: topicKey, score: m.length * 10 + (rx.test(q) ? 5 : 0) });
  };

  check('meet_class', /(meet|google meet|videollamada|sala|unirme|entrar a meet|clase en vivo|live|comenzo|comenzar clase)/gi);
  check('sched_class', /(programar|agendar|crear clase|fijar fecha|fijar hora|clase grupal|grupal|varios alumnos)/gi);
  check('request_mentor', /(solicitar|pedir|solicitud|buscar mentor|encontrar mentor|profesor|asesoria|elegir mentor)/gi);
  check('help_wall', /(muro|duda|pregunta|foro|ayuda|publicar duda|ejercicio|resolver duda)/gi);
  check('grading', /(calificar|nota|notas|calificacion|estrellas|puntos|evaluar|alumnos destacados|cuadro de honor)/gi);
  check('chat_files', /(chat|conversacion|mensaje|archivo|adjuntar|foto|imagen|documento|pdf|en linea|online)/gi);
  check('availability', /(disponibilidad|horario|horarios|cronograma|calendario|atencion|dias libres)/gi);
  check('auth_account', /(registro|crear cuenta|iniciar sesion|login|olvide|contrasena|clave|password|recuperar)/gi);
  check('admin_panel', /(admin|administrador|dashboard|verificar|suspender|mantenimiento|papelera)/gi);
  check('how_works', /(como funciona|de que trata|para que sirve|explicar|explicame|todo|resumen|guia general|plataforma)/gi);

  matches.sort((a,b) => b.score - a.score);

  if (matches.length > 0) {
    const top = matches[0].key;
    if (top === 'meet_class' && matches.some(m => m.key === 'sched_class')) {
      const s1 = BOT_TOPICS['sched_class'];
      const s2 = BOT_TOPICS['meet_class'];
      return {
        title: '🎥 Clases por Google Meet (Programación y En Vivo)',
        text: `${s1.text}\n\n---\n\n${s2.text}`,
        links: [...s1.links, ...s2.links]
      };
    }
    return BOT_TOPICS[top];
  }

  return {
    title: '🤖 MentorBot · Asistencia Inteligente',
    text: `Entendí tu consulta sobre «**${esc(rawQuery)}**».\n\nPara ayudarte mejor, aquí tienes los temas clave de MentorApp. Haz clic en el que más te interese y te explicaré el paso a paso detallado:`,
    links: [
      { label: '💡 ¿Cómo funciona la página?', topic: 'how_works' },
      { label: '🎥 Programar o entrar a Meet', topic: 'meet_class' },
      { label: '👨‍🏫 Solicitar un mentor', topic: 'request_mentor' },
      { label: '🙋 Muro de Ayuda y Preguntas', topic: 'help_wall' },
      { label: '⭐ Sistema de Calificaciones', topic: 'grading' },
      { label: '💬 Chat y Envío de Archivos', topic: 'chat_files' },
      { label: '🕒 Horarios y Disponibilidad', topic: 'availability' }
    ]
  };
}

function renderBotMessagesHtml(history) {
  return history.map(m => {
    if (m.from === 'user') {
      return `<div class="bot-msg user">
        <div class="bot-msg-av">Tú</div>
        <div class="bot-msg-bubble">${esc(m.text)}</div>
      </div>`;
    }
    return `<div class="bot-msg bot">
      <div class="bot-msg-av"><img src="robot_guia.png" style="width:24px;height:24px;object-fit:contain"></div>
      <div class="bot-msg-bubble">
        ${m.title ? `<div style="font-size:14px;font-weight:800;color:#1e3a8a;margin-bottom:6px">${esc(m.title)}</div>` : ''}
        <div>${formatBotText(m.text)}</div>
        ${m.links && m.links.length ? `
          <div class="bot-action-links">
            ${m.links.map(l => l.topic
              ? `<button type="button" class="bot-act-btn" data-a="bot_topic" data-t="${esc(l.topic)}">${esc(l.label)}</button>`
              : `<button type="button" class="bot-act-btn" data-a="bot_act" ${l.v ? `data-v="${esc(l.v)}"` : ''} ${l.act ? `data-act="${esc(l.act)}"` : ''}>${esc(l.label)}</button>`
            ).join('')}
            <button type="button" class="bot-speak-btn" title="Escuchar en voz alta" onclick="speakBot(${JSON.stringify(m.title ? m.title + '. ' + m.text : m.text)})">🔊</button>
          </div>
        ` : ''}
      </div>
    </div>`;
  }).join('');
}

function updateBotViews() {
  const asstThread = document.getElementById('asst-thread-messages');
  if (asstThread) {
    asstThread.innerHTML = renderBotMessagesHtml(BOT_STATE.history);
    const scrollEl = document.getElementById('asst-body-scroll');
    if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
  }
  const pageMsgs = document.getElementById('bot-page-messages');
  if (pageMsgs) {
    pageMsgs.innerHTML = renderBotMessagesHtml(BOT_STATE.history);
    pageMsgs.scrollTop = pageMsgs.scrollHeight;
  }
  const voiceBtns = document.querySelectorAll('.bot-voice-toggle-btn');
  voiceBtns.forEach(b => {
    b.innerHTML = BOT_STATE.voice ? '🔊' : '🔇';
    b.title = BOT_STATE.voice ? 'Voz activada (clic para silenciar)' : 'Voz desactivada (clic para activar)';
  });
}

function handleBotTopic(topicKey) {
  const t = BOT_TOPICS[topicKey];
  if (!t) return;
  handleBotSubmit(t.title, topicKey);
}

function handleBotSubmit(userText, forceTopicKey) {
  const clean = String(userText || '').trim();
  if (!clean) return;

  BOT_STATE.chatting = true;
  const scrollEl = document.getElementById('asst-body-scroll');
  if (scrollEl && !document.getElementById('asst-thread-messages')) {
    scrollEl.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e2e8f0">
        <button type="button" class="btn btn-sm" data-a="asst_reset" style="padding:4px 10px;font-size:11.5px">← Volver al menú</button>
        <button type="button" class="btn btn-sm" data-a="bot_clear" style="padding:4px 10px;font-size:11.5px">🧹 Limpiar</button>
      </div>
      <div class="asst-chat-thread" id="asst-thread-messages">
        ${renderBotMessagesHtml(BOT_STATE.history)}
      </div>
    `;
  }

  BOT_STATE.history.push({ from: 'user', text: clean });
  updateBotViews();

  const typingHtml = `<div class="bot-msg bot" id="bot-typing-indicator">
    <div class="bot-msg-av"><img src="robot_guia.png" style="width:24px;height:24px;object-fit:contain"></div>
    <div class="bot-typing">
      <span class="bot-typing-dot"></span>
      <span class="bot-typing-dot"></span>
      <span class="bot-typing-dot"></span>
    </div>
  </div>`;
  const asstThread = document.getElementById('asst-thread-messages');
  if (asstThread) {
    asstThread.insertAdjacentHTML('beforeend', typingHtml);
    if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
  }
  const pageMsgs = document.getElementById('bot-page-messages');
  if (pageMsgs) {
    pageMsgs.insertAdjacentHTML('beforeend', typingHtml);
    pageMsgs.scrollTop = pageMsgs.scrollHeight;
  }

  setTimeout(() => {
    const inds = document.querySelectorAll('#bot-typing-indicator');
    inds.forEach(i => i.remove());

    const ans = forceTopicKey ? BOT_TOPICS[forceTopicKey] : getBotAnswer(clean);
    if (ans) {
      BOT_STATE.history.push({ from: 'bot', title: ans.title, text: ans.text, links: ans.links });
      updateBotViews();
      if (BOT_STATE.voice) {
        speakBot((ans.title ? ans.title + '. ' : '') + ans.text);
      }
    }
  }, 350);
}

function clearBotChat() {
  BOT_STATE.history = [
    {
      from: 'bot',
      title: '👋 ¡Hola! Soy tu Asistente IA',
      text: '¡Conversación reiniciada! 🤖 ¿Sobre qué tema de MentorApp deseas que te explique hoy?',
      links: [
        { label: '💡 ¿Cómo funciona la página?', topic: 'how_works' },
        { label: '🎥 Programar o entrar a Meet', topic: 'meet_class' },
        { label: '👨‍🏫 Solicitar un mentor', topic: 'request_mentor' },
        { label: '🙋 Muro de Ayuda', topic: 'help_wall' },
        { label: '⭐ Cómo calificar', topic: 'grading' }
      ]
    }
  ];
  updateBotViews();
  toast('Historial del asistente reiniciado.');
}

function handleBotAction(d) {
  if (d.v) {
    if (S.me) {
      A.go({ v: d.v });
    } else {
      toast('Inicia sesión para acceder a esta sección.');
    }
  } else if (d.act && A[d.act]) {
    A[d.act](d);
  }
}

function handleAsstAction(val) {
  if (val === 'classes') {
    if (S.me) {
      A.go({ v: 'meet' });
    }
    BOT_STATE.chatting = true;
    BOT_STATE.history.push({
      from: 'bot',
      title: '📅 Tus Clases en Google Meet',
      text: 'Te he dirigido a la sección de **Clases en Meet** 🎥.\n\n• Si eres **Mentor**, puedes programar una clase individual o grupal con el botón azul arriba.\n• Si eres **Estudiante**, verás aquí tus clases pendientes y el botón verde **"Unirme a Meet"** cuando la clase esté activa.\n• Al terminar la clase podrás calificar y dejar tus comentarios.',
      links: [
        { label: '🎥 Ir a Clases en Meet', v: 'meet' },
        { label: '⭐ ¿Cómo calificar?', topic: 'grading' },
        { label: '📅 ¿Cómo programar?', topic: 'sched_class' }
      ]
    });
    const scrollEl = document.getElementById('asst-body-scroll');
    if (scrollEl && !document.getElementById('asst-thread-messages')) {
      scrollEl.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e2e8f0">
          <button type="button" class="btn btn-sm" data-a="asst_reset" style="padding:4px 10px;font-size:11.5px">← Volver al menú</button>
          <button type="button" class="btn btn-sm" data-a="bot_clear" style="padding:4px 10px;font-size:11.5px">🧹 Limpiar</button>
        </div>
        <div class="asst-chat-thread" id="asst-thread-messages">
          ${renderBotMessagesHtml(BOT_STATE.history)}
        </div>
      `;
    }
    updateBotViews();
    if (BOT_STATE.voice) speakBot('Te he dirigido a la sección de Clases en Meet.');
  } else if (val === 'grades') {
    BOT_STATE.chatting = true;
    const isMentor = S.me?.role === 'mentor';
    BOT_STATE.history.push({
      from: 'bot',
      title: isMentor ? '⭐ Calificaciones y Alumnos' : '⭐ Tus Calificaciones y Notas',
      text: isMentor
        ? 'Como **Mentor**, en tu pantalla de **Inicio** puedes consultar tu calificación promedio obtenida (en estrellas de 1 a 10) y la lista de **Alumnos destacados** con sus notas.\n\nTambién puedes calificar a tus alumnos (de 0 a 20) al terminar cada clase en Meet o desde la lista de alumnos.'
        : 'Como **Estudiante**, puedes ver las notas que te asignaron tus mentores (escala de 0 a 20) en tus clases concluidas, y calificar a tus mentores (de 1 a 10 ⭐) para reconocer su apoyo.',
      links: [
        { label: isMentor ? '🏠 Ir a Inicio' : '🎥 Ir a Mis Clases', v: isMentor ? 'home' : 'meet' },
        { label: '💡 Explicar sistema de notas', topic: 'grading' }
      ]
    });
    const scrollEl = document.getElementById('asst-body-scroll');
    if (scrollEl && !document.getElementById('asst-thread-messages')) {
      scrollEl.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e2e8f0">
          <button type="button" class="btn btn-sm" data-a="asst_reset" style="padding:4px 10px;font-size:11.5px">← Volver al menú</button>
          <button type="button" class="btn btn-sm" data-a="bot_clear" style="padding:4px 10px;font-size:11.5px">🧹 Limpiar</button>
        </div>
        <div class="asst-chat-thread" id="asst-thread-messages">
          ${renderBotMessagesHtml(BOT_STATE.history)}
        </div>
      `;
    }
    updateBotViews();
    if (BOT_STATE.voice) speakBot('Aquí tienes la información sobre notas y calificaciones.');
  } else if (val === 'faq') {
    BOT_STATE.chatting = true;
    BOT_STATE.history.push({
      from: 'bot',
      title: '❓ Preguntas Frecuentes de MentorApp',
      text: 'Selecciona cualquier tema frecuente para ver la explicación completa paso a paso:',
      links: [
        { label: '💡 ¿Cómo funciona la plataforma?', topic: 'how_works' },
        { label: '🎥 ¿Cómo entrar o crear clase en Meet?', topic: 'meet_class' },
        { label: '📅 ¿Cómo programar clases?', topic: 'sched_class' },
        { label: '👨‍🏫 ¿Cómo pedir o asignar mentor?', topic: 'request_mentor' },
        { label: '⭐ Sistema de calificaciones (0 a 20 y estrellas)', topic: 'grading' },
        { label: '🙋 ¿Cómo usar el Muro de Ayuda?', topic: 'help_wall' },
        { label: '💬 Chat privado y envío de archivos', topic: 'chat_files' },
        { label: '🕒 Disponibilidad de horarios', topic: 'availability' }
      ]
    });
    const scrollEl = document.getElementById('asst-body-scroll');
    if (scrollEl && !document.getElementById('asst-thread-messages')) {
      scrollEl.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e2e8f0">
          <button type="button" class="btn btn-sm" data-a="asst_reset" style="padding:4px 10px;font-size:11.5px">← Volver al menú</button>
          <button type="button" class="btn btn-sm" data-a="bot_clear" style="padding:4px 10px;font-size:11.5px">🧹 Limpiar</button>
        </div>
        <div class="asst-chat-thread" id="asst-thread-messages">
          ${renderBotMessagesHtml(BOT_STATE.history)}
        </div>
      `;
    }
    updateBotViews();
    if (BOT_STATE.voice) speakBot('Aquí tienes los temas de preguntas frecuentes.');
  } else if (val === 'ask') {
    BOT_STATE.chatting = true;
    const scrollEl = document.getElementById('asst-body-scroll');
    if (scrollEl && !document.getElementById('asst-thread-messages')) {
      scrollEl.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e2e8f0">
          <button type="button" class="btn btn-sm" data-a="asst_reset" style="padding:4px 10px;font-size:11.5px">← Volver al menú</button>
          <button type="button" class="btn btn-sm" data-a="bot_clear" style="padding:4px 10px;font-size:11.5px">🧹 Limpiar</button>
        </div>
        <div class="asst-chat-thread" id="asst-thread-messages">
          ${renderBotMessagesHtml(BOT_STATE.history)}
        </div>
      `;
    }
    updateBotViews();
    setTimeout(() => {
      const inp = document.getElementById('asst-user-input');
      if (inp) {
        inp.focus();
        inp.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }
}

function renderAssistantSidebarHtml() {
  const isChatting = !!BOT_STATE.chatting;
  return `
    <aside class="asst-sidebar">
      <div class="asst-panel-card">
        <div class="asst-header">
          <div class="asst-header-title">
            <span style="font-size:16px">❓</span>
            <span>¿Cómo puedo ayudarte?</span>
          </div>
          <div class="asst-header-acts">
            ${isChatting ? `<button type="button" class="asst-head-btn" data-a="asst_reset" title="Volver al inicio">🏠</button>` : ''}
            <button type="button" class="asst-head-btn bot-voice-toggle-btn" data-a="bot_voice" title="${BOT_STATE.voice ? 'Silenciar voz' : 'Activar voz'}">${BOT_STATE.voice ? '🔊' : '🔇'}</button>
            <button type="button" class="asst-head-btn" data-a="close_bot_panel" title="Cerrar panel">✕</button>
          </div>
        </div>

        <div class="asst-body" id="asst-body-scroll">
          ${isChatting ? `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e2e8f0">
              <button type="button" class="btn btn-sm" data-a="asst_reset" style="padding:4px 10px;font-size:11.5px">← Volver al menú</button>
              <button type="button" class="btn btn-sm" data-a="bot_clear" style="padding:4px 10px;font-size:11.5px">🧹 Limpiar</button>
            </div>
            <div class="asst-chat-thread" id="asst-thread-messages">
              ${renderBotMessagesHtml(BOT_STATE.history)}
            </div>
          ` : `
            <div class="asst-welcome-card">
              <div class="asst-robot-wrap">
                <img src="robot_guia.png" alt="Robot Guía MentorApp" class="asst-robot-img">
              </div>
              <div class="asst-welcome-text">
                <b>¡Hola!</b>
                <p>Soy tu asistente de<br>MentorApp. 😊</p>
                <small>Te puedo ayudar a:</small>
              </div>
            </div>

            <div class="asst-checklist">
              <div class="asst-check-item">
                <span class="asst-check-icon">✓</span>
                <span>Encontrar tus clases en Meet</span>
              </div>
              <div class="asst-check-item">
                <span class="asst-check-icon">✓</span>
                <span>Ver tu horario y calendario</span>
              </div>
              <div class="asst-check-item">
                <span class="asst-check-icon">✓</span>
                <span>Consultar tus calificaciones</span>
              </div>
              <div class="asst-check-item">
                <span class="asst-check-icon">✓</span>
                <span>Resolver dudas de la plataforma</span>
              </div>
            </div>

            <div class="asst-actions-title">¿Qué deseas hacer?</div>

            <div class="asst-buttons-list">
              <button type="button" class="asst-action-btn" data-a="asst_act" data-v="classes">
                <span class="asst-btn-icon">📅</span>
                <span>Ver mis clases</span>
              </button>
              <button type="button" class="asst-action-btn" data-a="asst_act" data-v="grades">
                <span class="asst-btn-icon">⭐</span>
                <span>Ver mis notas</span>
              </button>
              <button type="button" class="asst-action-btn" data-a="asst_act" data-v="faq">
                <span class="asst-btn-icon">❓</span>
                <span>Preguntas frecuentes</span>
              </button>
              <button type="button" class="asst-action-btn" data-a="asst_act" data-v="ask">
                <span class="asst-btn-icon">💬</span>
                <span>Hacer una pregunta</span>
              </button>
              <button type="button" class="asst-action-btn" data-a="open_guide" style="border-color:#bbf7d0;background:#f0fdf4;color:#15803d">
                <span class="asst-btn-icon">📖</span>
                <span>Ver guía paso a paso</span>
              </button>
            </div>
          `}
        </div>

        <form class="asst-input-bar" onsubmit="event.preventDefault();const inp=this.querySelector('input');const v=inp.value.trim();if(v){inp.value='';handleBotSubmit(v);}">
          <input class="asst-input" id="asst-user-input" placeholder="Escribe tu consulta aquí..." autocomplete="off">
          <button type="submit" class="asst-send-btn" title="Enviar consulta">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </form>
      </div>
    </aside>
  `;
}

function toggleBotWidget(forceOpen) {
  if (typeof forceOpen === 'boolean') {
    S.botPanelOpen = forceOpen;
  } else {
    S.botPanelOpen = S.botPanelOpen === false ? true : false;
  }
  render();
}

function renderBotWidgetHtml() {
  return '';
}

function renderGuideModalHtml() {
  const step = S.guideStep || 1;
  return `
    <div class="guide-overlay" id="guide-modal-container">
      <div class="guide-modal" role="dialog" aria-modal="true" aria-label="Guía interactiva de MentorApp">
        <div class="guide-top-bar">
          <div class="guide-robot-speech-badge">
            <div class="guide-speech-robot-wrap">
              <img src="robot_guia.png" class="guide-speech-robot-img" alt="Robot Asistente MentorApp">
            </div>
            <div class="guide-speech-text">
              <div class="guide-speech-title">
                <span>¡Hola! Soy tu asistente de MentorApp</span>
                <span>😊</span>
              </div>
              <div class="guide-speech-sub">
                Te guiaré paso a paso para que aprendas a usar todas sus funciones.
              </div>
            </div>
          </div>
          <button type="button" class="guide-close-btn" data-a="close_guide" title="Cerrar guía">
            <span>✕</span>
            <span>Cerrar guía</span>
          </button>
        </div>

        <div class="guide-cards-grid">
          <!-- Paso 1 -->
          <div class="guide-card ${step === 1 ? 'is-active' : ''}" data-a="guide_jump" data-s="1">
            <div class="guide-card-head">
              <div class="guide-step-num">1</div>
              <div class="guide-card-info">
                <div class="guide-card-title">Ingresa a MentorApp</div>
                <p class="guide-card-desc">Abre la página y verás la pantalla de inicio.</p>
              </div>
            </div>
            <div class="guide-card-visual">
              <div style="width:100%;background:#0b1b4d;border-radius:12px;padding:8px 10px;color:#fff;box-sizing:border-box">
                <div style="font-weight:800;font-size:12px;margin-bottom:6px;display:flex;align-items:center;gap:4px">
                  <span style="font-size:13px">🎓</span> MentorApp
                </div>
                <div style="position:relative;background:#2563eb;color:#fff;font-weight:700;font-size:11px;padding:5px 8px;border-radius:8px;margin-bottom:4px;display:inline-block;width:75%">
                  Inicio
                  <span class="guide-click-sparkle" style="top:-4px;right:-8px"></span>
                  <span class="guide-hand-tap" style="top:2px;right:-18px">👆</span>
                </div>
                <div style="font-size:10px;color:#94a3b8;padding:2px 4px">Muro de Ayuda</div>
                <div style="font-size:10px;color:#94a3b8;padding:2px 4px">Clases en Meet</div>
              </div>
            </div>
          </div>

          <!-- Paso 2 -->
          <div class="guide-card ${step === 2 ? 'is-active' : ''}" data-a="guide_jump" data-s="2">
            <div class="guide-card-head">
              <div class="guide-step-num">2</div>
              <div class="guide-card-info">
                <div class="guide-card-title">Conoce tu espacio</div>
                <p class="guide-card-desc">Aquí verás un resumen de tu avance y tus clases.</p>
              </div>
            </div>
            <div class="guide-card-visual">
              <div style="width:100%;display:grid;grid-template-columns:1fr 1fr;gap:6px;box-sizing:border-box">
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:6px;text-align:center">
                  <small style="font-size:9.5px;color:#475569;display:block">Estudiantes</small>
                  <b style="font-size:16px;color:#1e40af">0</b>
                </div>
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:6px;text-align:center">
                  <small style="font-size:9.5px;color:#475569;display:block">Clases confirmadas</small>
                  <b style="font-size:16px;color:#1e40af">0</b>
                </div>
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:6px;text-align:center">
                  <small style="font-size:9.5px;color:#475569;display:block">Solicitudes pendientes</small>
                  <b style="font-size:16px;color:#1e40af">2</b>
                </div>
                <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:6px;text-align:center">
                  <small style="font-size:9.5px;color:#475569;display:block">Calificación</small>
                  <b style="font-size:16px;color:#1e40af">4.0</b>
                </div>
              </div>
            </div>
          </div>

          <!-- Paso 3 -->
          <div class="guide-card ${step === 3 ? 'is-active' : ''}" data-a="guide_jump" data-s="3">
            <div class="guide-card-head">
              <div class="guide-step-num">3</div>
              <div class="guide-card-info">
                <div class="guide-card-title">Busca el asistente</div>
                <p class="guide-card-desc">En la parte derecha, encontrarás a tu asistente de MentorApp.</p>
              </div>
            </div>
            <div class="guide-card-visual">
              <div style="width:100%;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:8px;position:relative;box-sizing:border-box">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                  <img src="robot_guia.png" style="width:26px;height:26px;object-fit:contain">
                  <div style="font-size:9.5px;line-height:1.2;color:#1e293b">
                    <b>¡Hola!</b> Soy tu asistente de MentorApp. 😊
                  </div>
                </div>
                <div style="font-size:8.5px;color:#1e40af;font-weight:600;display:flex;flex-direction:column;gap:2px">
                  <span>✔ Encontrar tus clases en Meet</span>
                  <span>✔ Ver tu horario y calendario</span>
                  <span>✔ Consultar tus calificaciones</span>
                </div>
                <span class="guide-click-sparkle" style="top:2px;right:18px"></span>
                <span class="guide-hand-tap" style="top:10px;right:6px">👆</span>
              </div>
            </div>
          </div>

          <!-- Paso 4 -->
          <div class="guide-card ${step === 4 ? 'is-active' : ''}" data-a="guide_jump" data-s="4">
            <div class="guide-card-head">
              <div class="guide-step-num">4</div>
              <div class="guide-card-info">
                <div class="guide-card-title">Haz clic en "Ver mis clases"</div>
                <p class="guide-card-desc">Presiona el botón "Ver mis clases".</p>
              </div>
            </div>
            <div class="guide-card-visual">
              <div style="width:100%;display:flex;flex-direction:column;gap:4px;position:relative;box-sizing:border-box">
                <div style="border:2px solid #facc15;background:#fefce8;border-radius:10px;padding:6px 10px;font-size:11px;font-weight:800;color:#1e40af;display:flex;align-items:center;gap:6px;position:relative;box-shadow:0 0 10px rgba(250,204,21,0.35)">
                  <span>📅</span>
                  <span>Ver mis clases</span>
                  <span class="guide-click-sparkle" style="top:-4px;right:18px"></span>
                  <span class="guide-hand-tap" style="top:2px;right:6px">👆</span>
                </div>
                <div style="border:1px solid #e2e8f0;background:#fff;border-radius:8px;padding:4px 8px;font-size:10px;color:#64748b;display:flex;align-items:center;gap:6px">
                  <span>⭐</span> <span>Ver mis notas</span>
                </div>
                <div style="border:1px solid #e2e8f0;background:#fff;border-radius:8px;padding:4px 8px;font-size:10px;color:#64748b;display:flex;align-items:center;gap:6px">
                  <span>❓</span> <span>Preguntas frecuentes</span>
                </div>
                <div style="border:1px solid #e2e8f0;background:#fff;border-radius:8px;padding:4px 8px;font-size:10px;color:#64748b;display:flex;align-items:center;gap:6px">
                  <span>💬</span> <span>Hacer una pregunta</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Paso 5 -->
          <div class="guide-card ${step === 5 ? 'is-active' : ''}" data-a="guide_jump" data-s="5">
            <div class="guide-card-head">
              <div class="guide-step-num">5</div>
              <div class="guide-card-info">
                <div class="guide-card-title">Explora tus clases</div>
                <p class="guide-card-desc">Aquí podrás ver tus clases en Meet y más opciones.</p>
              </div>
            </div>
            <div class="guide-card-visual">
              <div style="width:100%;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:10px;text-align:center;position:relative;box-sizing:border-box">
                <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:8px">
                  <svg viewBox="0 0 48 48" width="22" height="22"><path fill="#00832d" d="M37 15l-9 7.5V15c0-1.66-1.34-3-3-3H9c-1.66 0-3 1.34-3 3v18c0 1.66 1.34 3 3 3h16c1.66 0 3-1.34 3-3v-7.5l9 7.5V15z"/></svg>
                  <b style="font-size:12px;color:#1e3a8a">Mis clases en Meet</b>
                </div>
                <div style="position:relative;display:inline-block">
                  <button type="button" style="background:#2563eb;color:#fff;border:none;border-radius:10px;padding:7px 16px;font-size:11.5px;font-weight:700;display:inline-flex;align-items:center;gap:6px;cursor:pointer;box-shadow:0 3px 8px rgba(37,99,235,0.3)">
                    📹 Entrar a la clase
                  </button>
                  <span class="guide-click-sparkle" style="top:-5px;right:-8px"></span>
                  <span class="guide-hand-tap" style="top:3px;right:-20px">👆</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Paso 6 -->
          <div class="guide-card ${step === 6 ? 'is-active' : ''}" data-a="guide_jump" data-s="6">
            <div class="guide-card-head">
              <div class="guide-step-num">6</div>
              <div class="guide-card-info">
                <div class="guide-card-title">¡Listo!</div>
                <p class="guide-card-desc">Ya puedes usar MentorApp para aprender y resolver tus dudas.</p>
              </div>
            </div>
            <div class="guide-card-visual">
              <div style="width:100%;display:flex;align-items:center;justify-content:center;gap:12px;padding:4px;box-sizing:border-box">
                <img src="robot_saludo.png" class="guide-cheer-robot" alt="Robot Celebrando">
                <div class="guide-comic-bubble">¡Tú puedes!</div>
              </div>
            </div>
          </div>
        </div>

        <div class="guide-footer-bar">
          <div style="display:flex;align-items:center;gap:8px">
            <button type="button" class="guide-foot-btn" data-a="guide_prev" id="guide-prev-btn" style="${step > 1 ? '' : 'display:none'}">
              <span>←</span>
              <span>Anterior</span>
            </button>
            <button type="button" class="guide-foot-btn" data-a="guide_restart" title="Reiniciar al paso 1">
              <span>📖</span>
              <span>Pasar de nuevo</span>
            </button>
          </div>
          <div class="guide-pagi-wrap">
            <div class="guide-pagi-label">Paso <span id="guide-step-curr">${step}</span> de 6</div>
            <div class="guide-dots-row">
              ${[1, 2, 3, 4, 5, 6].map(i => `
                <button type="button" class="guide-dot ${step === i ? 'is-active' : ''}" data-a="guide_jump" data-s="${i}" title="Ir al paso ${i}"></button>
              `).join('')}
            </div>
          </div>
          <button type="button" class="guide-next-btn" data-a="guide_next">
            <span>${step >= 6 ? '¡Comenzar! 🎉' : 'Siguiente →'}</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderGuideModalInPlace() {
  const container = document.getElementById('guide-modal-container');
  if (!container) {
    if (S.guideOpen) render();
    return;
  }
  const step = S.guideStep || 1;

  // 1. Update cards smoothly in-place without replacing HTML
  const cards = container.querySelectorAll('.guide-card');
  cards.forEach((card, index) => {
    const cardStep = index + 1;
    if (cardStep === step) {
      if (!card.classList.contains('is-active')) {
        card.classList.add('is-active');
        card.classList.add('just-activated');
        setTimeout(() => card.classList.remove('just-activated'), 400);
      }
    } else {
      card.classList.remove('is-active');
      card.classList.remove('just-activated');
    }
  });

  // 2. Update step number in pagination
  const stepCurr = document.getElementById('guide-step-curr');
  if (stepCurr) {
    stepCurr.textContent = step;
  }

  // 3. Update dots smoothly
  const dots = container.querySelectorAll('.guide-dot');
  dots.forEach((dot, index) => {
    const dotStep = index + 1;
    if (dotStep === step) {
      dot.classList.add('is-active');
    } else {
      dot.classList.remove('is-active');
    }
  });

  // 4. Update Next button label
  const nextBtn = container.querySelector('.guide-next-btn');
  if (nextBtn) {
    nextBtn.innerHTML = `<span>${step >= 6 ? '¡Comenzar! 🎉' : 'Siguiente →'}</span>`;
  }

  // 5. Update Previous button visibility
  const prevBtn = document.getElementById('guide-prev-btn');
  if (prevBtn) {
    prevBtn.style.display = step > 1 ? 'inline-flex' : 'none';
  }
}

function botPageView(role) {
  const roleName = { student: 'Estudiante', mentor: 'Mentor', admin: 'Administradora' }[role] || 'Usuario';
  return `
    <div class="bot-full-view">
      <div class="bot-hero-card">
        <div class="bot-hero-icon">🤖</div>
        <div class="bot-hero-text">
          <h2>Robot Asistente IA · Guía Interactiva</h2>
          <p>¡Hola, <b>${esc(S.me?.name || roleName)}</b>! Estoy entrenado con todo el funcionamiento de MentorApp. Haz clic en cualquier tema para que te explique detalladamente o escribe tu duda en la consola interactiva.</p>
        </div>
      </div>

      <h3 style="margin:10px 0 4px;color:#1e3a8a">📌 Temas y tutoriales rápidos</h3>
      <div class="bot-grid-help">
        <div class="bot-card-topic" data-a="bot_topic" data-t="how_works">
          <div class="bot-card-topic-icon">💡</div>
          <b>¿Cómo funciona MentorApp?</b>
          <p>Visión general de la plataforma, roles de estudiante y mentor, y beneficios.</p>
          <span>Explicar tema →</span>
        </div>

        <div class="bot-card-topic" data-a="bot_topic" data-t="meet_class">
          <div class="bot-card-topic-icon">🎥</div>
          <b>Clases en Google Meet</b>
          <p>Cómo ingresar a reuniones, alertas en vivo y enlaces de videoconferencia.</p>
          <span>Explicar tema →</span>
        </div>

        <div class="bot-card-topic" data-a="bot_topic" data-t="sched_class">
          <div class="bot-card-topic-icon">📅</div>
          <b>Programar Clases (Individual o Grupal)</b>
          <p>Guía paso a paso para agendar clases con fecha, hora y aviso a los estudiantes.</p>
          <span>Explicar tema →</span>
        </div>

        <div class="bot-card-topic" data-a="bot_topic" data-t="request_mentor">
          <div class="bot-card-topic-icon">👨‍🏫</div>
          <b>Solicitar un Mentor</b>
          <p>Aprende a buscar por especialidad, revisar disponibilidad y mandar solicitudes.</p>
          <span>Explicar tema →</span>
        </div>

        <div class="bot-card-topic" data-a="bot_topic" data-t="help_wall">
          <div class="bot-card-topic-icon">🙋</div>
          <b>Muro de Ayuda</b>
          <p>Publicar dudas con fotos/archivos, responder preguntas y marcarlas como resueltas.</p>
          <span>Explicar tema →</span>
        </div>

        <div class="bot-card-topic" data-a="bot_topic" data-t="grading">
          <div class="bot-card-topic-icon">⭐</div>
          <b>Sistema de Calificaciones</b>
          <p>Notas de 0 a 20 para alumnos y estrellas (1 a 10 ⭐) para evaluar mentores.</p>
          <span>Explicar tema →</span>
        </div>

        <div class="bot-card-topic" data-a="bot_topic" data-t="chat_files">
          <div class="bot-card-topic-icon">💬</div>
          <b>Chat Privado y Archivos</b>
          <p>Mensajería instantánea, estado en línea y envío de documentos e imágenes.</p>
          <span>Explicar tema →</span>
        </div>

        <div class="bot-card-topic" data-a="bot_topic" data-t="availability">
          <div class="bot-card-topic-icon">🕒</div>
          <b>Disponibilidad y Cronograma</b>
          <p>Cómo definir horarios de atención y consultar el calendario mensual de clases.</p>
          <span>Explicar tema →</span>
        </div>
      </div>

      <div class="card" style="border:1.5px solid #e2e8f0;padding:0;overflow:hidden;margin-top:10px">
        <div class="row sp" style="background:#f1f5f9;padding:12px 18px;border-bottom:1px solid #e2e8f0">
          <div class="row" style="gap:10px">
            <span style="font-size:22px">🤖</span>
            <div>
              <b style="color:#0f172a;font-size:14.5px">Consola de Conversación con MentorBot</b>
              <small style="display:block;color:#64748b;font-size:11.5px">Pregúntale en lenguaje natural cómo hacer cualquier acción</small>
            </div>
          </div>
          <div class="row" style="gap:8px">
            <button type="button" class="btn btn-sm bot-voice-toggle-btn" data-a="bot_voice">${BOT_STATE.voice ? '🔊 Modo voz activo' : '🔇 Activar voz'}</button>
            <button type="button" class="btn btn-sm" data-a="bot_clear">🧹 Limpiar</button>
          </div>
        </div>

        <div class="bot-chips-bar" style="border-top:none">
          <button type="button" class="bot-chip-btn" data-a="bot_topic" data-t="how_works">💡 ¿Cómo funciona?</button>
          <button type="button" class="bot-chip-btn" data-a="bot_topic" data-t="meet_class">🎥 Entrar a Meet</button>
          <button type="button" class="bot-chip-btn" data-a="bot_topic" data-t="sched_class">📅 Programar clase</button>
          <button type="button" class="bot-chip-btn" data-a="bot_topic" data-t="request_mentor">👨‍🏫 Pedir mentor</button>
          <button type="button" class="bot-chip-btn" data-a="bot_topic" data-t="help_wall">🙋 Muro de Ayuda</button>
          <button type="button" class="bot-chip-btn" data-a="bot_topic" data-t="grading">⭐ Calificaciones</button>
          <button type="button" class="bot-chip-btn" data-a="bot_topic" data-t="chat_files">💬 Chat y archivos</button>
        </div>

        <div class="bot-body" id="bot-page-messages" style="height:360px">
          ${renderBotMessagesHtml(BOT_STATE.history)}
        </div>

        <form class="bot-input-bar" data-f="bot_ask" onsubmit="event.preventDefault();const inp=this.querySelector('input');const v=inp.value.trim();if(v){inp.value='';handleBotSubmit(v);}">
          <input class="bot-input" name="q" placeholder="Pregúntale al robot cómo hacer algo en la página..." autocomplete="off">
          <button type="button" class="bot-voice-btn" data-a="bot_dictate" title="Dictar por voz con micrófono">🎙️</button>
          <button type="submit" class="bot-send-btn" title="Enviar">🚀</button>
        </form>
      </div>
    </div>
  `;
}

function ensureBotWidget() {
  const old = document.getElementById('mentorbot-widget');
  if (old) old.remove();
}

if (typeof window !== 'undefined') {
  window.speakBot = speakBot;
  window.handleBotSubmit = handleBotSubmit;
  window.toggleBotWidget = toggleBotWidget;
  window.handleAsstAction = handleAsstAction;
  setTimeout(ensureBotWidget, 100);
}

/* ---------- VISTAS ---------- */
const V={
student_home:()=>{
  const topMentors=[...mentors()].sort((a,b)=>{
    const ra=rating(a.id)?.v||(a.verified?4.9:4.5),rb=rating(b.id)?.v||(b.verified?4.9:4.5);
    return rb-ra;
  }).slice(0,4);
  const upMeets=acc().filter(r=>(r.sesion||'Confirmada')==='Confirmada'&&!isPast(r.date,r.time)).slice(0,3);
  return `<div class=hero><div class=hero-content><h1>${wave('¡Hola, '+S.me.name.split(' ')[0]+'!')}</h1><p style="font-size:16px;color:#dbeafe;margin:6px 0 4px">Encuentra el mentor ideal para ti</p><p class=ty><span class=typed></span></p><div class=row style="margin-top:14px;gap:8px"><input id=hq placeholder="Buscar mentores por curso, especialidad o nombre…" style="max-width:380px;background:#fff;border-radius:24px;padding:12px 18px;margin:0"><button class="btn p" data-a=hsearch style="border-radius:24px;padding:11px 22px;font-weight:700">Buscar</button></div></div><div class=hero-img-wrap><img src="mentor_estudiante.jpg" alt="Mentor y Estudiante" class=hero-photo onerror="this.src='mentor_estudiante_doodles.jpg'"></div></div><div class="row sp" style="margin:24px 0 10px"><h3 style="margin:0">🏆 Mentores más destacados</h3><button class="btn p" data-a=go data-v=mentors>Ver todos los mentores (${mentors().length}) →</button></div><div class="grid g4">${topMentors.map(mcard).join('')||'<p class=sub>Aún no hay mentores registrados.</p>'}</div><div class="row sp" style="margin:24px 0 10px"><h3 style="margin:0">📅 Mis próximas mentorías</h3><button class="btn" data-a=go data-v=meet style="font-size:12px">Ver todas en Meet →</button></div>${upMeets.map(r=>`<div class=card style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;margin-bottom:8px"><div class=row style="gap:12px">${av(U(r.mentor),40)}<div><b style="font-size:14.5px;color:#0f172a">${esc(U(r.mentor).name)}</b><div style="font-size:12.5px;color:var(--m);margin-top:2px">${esc(r.specialty)} · ${r.date&&!r.date.includes('fijar')?`📅 ${fdate(r.date)} ⏰ ${esc(r.time)}`:'<span class="badge y">Horario por fijar por el mentor</span>'}</div></div></div><div class=row style="gap:6px">${r.meetLink?`<a class="btn g" target=_blank rel=noopener href="${esc(r.meetLink)}" style="padding:6px 14px;font-size:12px">🎥 Meet</a>`:''}<button class="btn" data-a=msg data-id=${r.mentor} style="padding:6px 12px;font-size:12px">💬 Chat</button></div></div>`).join('')||'<p class=sub style="margin-bottom:16px">Sin mentorías confirmadas pendientes.</p>'}<h3 style="margin:24px 0 10px">🏆 Alumnos destacados · mejores notas de los mentores</h3><div class="grid g4">${fstu()}</div>`;
},
student_mentors:()=>filters()+`<div class="grid g4" id=list>${mlist()}</div>`,
student_profile:()=>pview(S.me),
student_meet:()=>{
  const allSes=acc();
  const live=allSes.filter(r=>r.live);
  const upcoming=allSes.filter(r=>(r.sesion||'Confirmada')==='Confirmada'&&!isPast(r.date,r.time)&&!r.live).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  const past=allSes.filter(r=>(r.sesion==='Finalizada')||isPast(r.date,r.time)).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
  const lastMeet=past[0];
  const nextMeet=upcoming[0];
  const totalCompleted=past.length;
  return `<div>
    <div class="row sp" style="margin-bottom:16px">
      <div>
        <h2 style="margin:0">🎥 Mis Clases y Mentorías por Google Meet</h2>
        <p class=sub style="margin:4px 0 0">Consulta tus sesiones en vivo, próximas clases programadas y el historial de tus clases concluidas.</p>
      </div>
      <a class="btn" target=_blank rel=noopener href="https://meet.google.com/">Abrir Google Meet ↗</a>
    </div>
    <div class="grid g4" style="margin-bottom:20px;gap:12px">
      <div class="card stat" style="background:#eff6ff;border:1px solid #bfdbfe;padding:14px">
        <span style="color:#1e40af;font-size:12px;font-weight:700">🎥 Última sesión de Meet</span>
        <b style="font-size:14px;color:#1e3a8a;margin:4px 0 2px;display:block">${lastMeet&&lastMeet.date?`${fdate(lastMeet.date)} · ${lastMeet.time}`:'Sin sesiones previas'}</b>
        <small style="color:#2563eb;font-size:11.5px;display:block">${lastMeet?`Con ${esc(U(lastMeet.mentor).name.split(' ')[0])} (${esc(lastMeet.specialty||'Mentoría')})`:'Aún no has tenido clases'}</small>
      </div>
      <div class="card stat" style="background:#ecfdf5;border:1px solid #a7f3d0;padding:14px">
        <span style="color:#065f46;font-size:12px;font-weight:700">⏰ Próxima clase programada</span>
        <b style="font-size:14px;color:#047857;margin:4px 0 2px;display:block">${nextMeet&&nextMeet.date&&!nextMeet.date.includes('fijar')?`${fdate(nextMeet.date)} · ${nextMeet.time}`:'Sin clases próximas'}</b>
        <small style="color:#059669;font-size:11.5px;display:block">${nextMeet?`Mentor: ${esc(U(nextMeet.mentor).name)}`:'Envía una solicitud para agendar'}</small>
      </div>
      <div class="card stat" style="background:#faf5ff;border:1px solid #e9d5ff;padding:14px">
        <span style="color:#6b21a8;font-size:12px;font-weight:700">👥 Participantes de clase</span>
        <b style="font-size:14px;color:#581c87;margin:4px 0 2px;display:block">${nextMeet?(nextMeet.isGroup?`Grupal (${reqStudents(nextMeet).length} alumnos)`:'Individual (Tú y el Mentor)'):'Tú y tus mentores'}</b>
        <small style="color:#7e22ce;font-size:11.5px;display:block">${nextMeet?'Cámara y micrófono listos':'Conexión por Google Meet'}</small>
      </div>
      <div class="card stat" style="background:#fffbeb;border:1px solid #fde68a;padding:14px">
        <span style="color:#92400e;font-size:12px;font-weight:700">🏆 Clases concluidas</span>
        <b style="font-size:14px;color:#b45309;margin:4px 0 2px;display:block">${totalCompleted} sesión(es)</b>
        <small style="color:#d97706;font-size:11.5px;display:block">Historial académico completado</small>
      </div>
    </div>
    ${live.length?`<div style="background:linear-gradient(135deg,#dc2626,#ef4444);color:#fff;padding:18px 22px;border-radius:16px;box-shadow:0 8px 24px rgba(220,38,38,.28);margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px"><div style="display:flex;align-items:center;gap:14px"><div style="width:50px;height:50px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px">🔴</div><div><div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.2);padding:2px 10px;border-radius:12px;font-size:11.5px;font-weight:700;letter-spacing:.5px;margin-bottom:4px">EN VIVO AHORA</div><h3 style="margin:0;font-size:18px;color:#fff">¡Tu clase ha comenzado!</h3><p style="margin:3px 0 0;font-size:13px;color:#fee2e2">El mentor ${esc(U(live[0].mentor).name)} te espera en Google Meet para la sesión de «${esc(live[0].specialty)}».</p></div></div><div class=row style="gap:8px;flex-wrap:wrap">${(()=>{const ml=getMeetUrl(live[0]);return ml?`<a class="btn" style="background:#fff;color:#dc2626;font-weight:800;padding:10px 22px;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,.2)" target=_blank rel=noopener href="${esc(ml)}">🎥 Entrar a la clase en vivo</a>`:`<a class="btn" style="background:#fff;color:#dc2626;font-weight:800;padding:10px 20px;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,.2)" target=_blank rel=noopener href="https://meet.google.com/">🎥 Entrar a Google Meet</a>`})()}<button class="btn" data-a=msg data-id=${live[0].mentor} style="background:rgba(255,255,255,.2);border-color:transparent;color:#fff">💬 Chat</button></div></div>`:''}
    <div class="grid g2" style="margin-bottom:20px;gap:16px">
      <div class=card style="border:1px solid #e2e8f0">
        <div class="row sp" style="border-bottom:1px solid #f1f5f9;padding-bottom:10px;margin-bottom:12px">
          <h3 style="margin:0;color:#1e3a8a">📅 Próximas clases programadas (${upcoming.length})</h3>
          <span class="badge" style="background:#dbeafe;color:#1e40af">${upcoming.length} pendientes</span>
        </div>
        ${upcoming.length?upcoming.map(r=>{const o=U(r.mentor);const stList=reqStudents(r);const ml=getMeetUrl(r);return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:14px;margin-bottom:12px"><div class="row sp" style="align-items:flex-start"><div class=row style="gap:10px">${av(o,44)}<div><b style="font-size:15px;color:#0f172a">${esc(o.name)}</b><span class="badge" style="background:#eff6ff;color:#1e40af;font-size:11px;margin-left:4px">${r.isGroup?'👥 Grupal':'👤 Individual'}</span><div style="font-size:13px;color:#475569;margin-top:2px"><b>Materia:</b> ${esc(r.specialty)}</div></div></div><div style="text-align:right"><span class="badge" style="background:#dcfce7;color:#15803d;font-weight:700;font-size:12px">📅 ${fdate(r.date)}</span><div style="font-size:12.5px;color:#047857;font-weight:700;margin-top:2px">⏰ ${esc(r.time)}</div></div></div>${r.isGroup&&stList.length?`<div style="background:#fff;border-radius:8px;padding:8px 10px;margin:10px 0;border:1px solid #e2e8f0;font-size:12px;color:#475569"><b>👥 Participantes inscritos (${stList.length}):</b> ${stList.map(s=>esc(s.name)).join(', ')}</div>`:''}${r.message?`<p style="margin:8px 0;font-size:12.5px;color:#64748b;font-style:italic">«${esc(r.message)}»</p>`:''}<div class="row sp" style="margin-top:10px;padding-top:10px;border-top:1px solid #f1f5f9"><div class=row style="gap:8px;flex-wrap:wrap">${r.live?`<a class="btn" style="background:#dc2626;color:#fff;border-color:#dc2626;font-weight:700;padding:7px 16px;animation:fl 2s infinite" target=_blank rel=noopener href="${esc(ml||'https://meet.google.com/')}">🔴 En vivo · Entrar a Meet</a>`:ml?`<a class="btn g" target=_blank rel=noopener href="${esc(ml)}" style="padding:7px 16px;font-weight:700">🎥 Unirme a Meet</a>`:`<span class="badge" style="background:#eff6ff;color:#1e40af;padding:6px 12px;font-size:12px">🕒 El mentor compartirá el enlace</span>`}<button class="btn" data-a=msg data-id=${r.mentor} style="padding:6px 12px;font-size:12px">💬 Chat con el mentor</button></div><button class="btn d" data-a=ses data-s=Cancelada data-id=${r.id} style="padding:6px 12px;font-size:11.5px" title="Cancelar esta sesión">Cancelar</button></div></div>`}).join(''):'<div style="padding:24px 12px;text-align:center;color:#64748b"><div style="font-size:32px;margin-bottom:6px">📅</div><p style="margin:0 0 8px">Aún no tienes clases confirmadas próximas.</p><p class=sub style="margin:0">Fija una fecha y hora con un mentor de abajo para coordinar tu clase.</p></div>'}
      </div>
      <div class=card style="border:1px solid #e2e8f0">
        <div class="row sp" style="border-bottom:1px solid #f1f5f9;padding-bottom:10px;margin-bottom:12px">
          <h3 style="margin:0;color:#1e3a8a">📚 Historial de clases concluidas (${past.length})</h3>
          <span class="badge" style="background:#f1f5f9;color:#475569">${past.length} realizadas</span>
        </div>
        ${past.length?past.map(r=>{const o=U(r.mentor);const hasRated=S.rats.some(x=>x.mentor===r.mentor&&x.student===S.me.id);return `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:14px;margin-bottom:12px"><div class="row sp" style="align-items:flex-start"><div class=row style="gap:10px">${av(o,40)}<div><b style="font-size:14.5px;color:#0f172a">${esc(o.name)}</b><div style="font-size:12.5px;color:#475569"><b>Tema:</b> ${esc(r.specialty)}</div></div></div><span class="badge" style="background:#e2e8f0;color:#334155;font-weight:700;font-size:11.5px">✔ Concluida</span></div><div style="background:#fff;border-radius:8px;padding:8px 10px;margin:8px 0;border:1px solid #e2e8f0;font-size:12px;color:#475569">🗓️ <b>La clase se llevó a cabo el:</b> ${fdate(r.date)} a las ${esc(r.time)}</div><div class="row sp" style="margin-top:8px;gap:8px;flex-wrap:wrap"><button class="btn p" data-a=mreq data-id=${r.mentor} style="padding:6px 14px;font-size:12px;font-weight:700">🎥 Solicitar nueva clase por Meet</button><div class=row style="gap:6px"><button class="btn" data-a=ratemodal data-id=${r.mentor} style="background:#fef3c7;border-color:#fde68a;color:#92400e;font-weight:700;padding:6px 12px;font-size:12px">⭐ ${hasRated?'Modificar calificación':'Calificar'}</button><button class="btn" data-a=msg data-id=${r.mentor} style="padding:6px 12px;font-size:12px">💬 Enviar mensaje</button></div></div></div>`}).join(''):'<div style="padding:24px 12px;text-align:center;color:#64748b"><div style="font-size:32px;margin-bottom:6px">🎓</div><p style="margin:0">Aquí se guardarán tus clases cuando haya pasado la fecha y hora programada.</p></div>'}
      </div>
    </div>
    <div class="row sp" style="margin:26px 0 12px">
      <div>
        <h3 style="margin:0">🧑‍🏫 Mentores disponibles para solicitar clase</h3>
        <p class=sub style="margin:3px 0 0">Selecciona el mentor y envíale tu solicitud para coordinar tu clase.</p>
      </div>
      <button class="btn p" data-a=go data-v=mentors>Ver todos los mentores →</button>
    </div>
    <div class="grid g4">
      ${mentors().slice(0,8).map(m=>`<div class=card style="display:flex;flex-direction:column"><div class=row style="gap:10px;margin-bottom:8px">${av(m,44)}<div style="min-width:0;flex:1"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.name)}</b><small style="color:var(--m);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(m.specialty||'Mentor')}</small>${m.verified?'<span class="badge g" style="font-size:10px;padding:0 5px">✔ Verificado</span>':''}</div></div><div style="margin:4px 0 6px">${stars(m.id)}</div><small style="color:#475569;display:block;margin-bottom:10px">🕒 <b>Disponibilidad:</b> ${esc(availTxt(m))}</small><div class=row style="margin-top:auto;gap:6px"><button class=btn data-a=mview data-id=${m.id} style="flex:1;font-size:12px">Perfil</button><button class="btn p" data-a=mreq data-id=${m.id} style="flex:1;font-size:12px">📩 Mandar solicitud</button></div></div>`).join('')||'<p class=sub>No hay mentores disponibles.</p>'}
    </div>
  </div>`;
},
student_mine:()=>rtable(mine().sort((a,b)=>b.created-a.created),'s'),
student_chat:chatV,student_cal:calV,
student_peers:()=>`<div class="card row" style="margin-bottom:16px"><input id=q style="margin:0" placeholder="Filtrar por nombre, carrera, habilidad o interés" value="${esc(S.q)}" data-in=pq></div><div class="grid g4" id=list>${plist()}</div>`,
student_notif:()=>{markNotifsAsRead();const list=[...S.notifs].sort((a,b)=>b.ts-a.ts);return `<div class=card style="max-width:700px"><div class="row sp" style="margin-bottom:14px;border-bottom:1px solid #e2e8f0;padding-bottom:10px"><h2 style="margin:0">🔔 Notificaciones</h2>${list.some(n=>!n.read)?'<button class="btn btn-sm" data-a=readall>Marcar todas como leídas</button>':''}</div>${list.length?`<div style="display:flex;flex-direction:column;gap:8px">${list.map(n=>`<div style="display:flex;align-items:flex-start;gap:10px;padding:12px;border-radius:10px;background:${n.read?'#f8fafc':'#eff6ff'};border:1px solid ${n.read?'#e2e8f0':'#bfdbfe'}"><span style="font-size:16px;line-height:1.2">${n.read?'📫':'🔔'}</span><div style="flex:1"><p style="margin:0;font-size:13.5px;color:#1e293b;line-height:1.4">${esc(n.text)}</p><small style="color:#64748b;font-size:11.5px;margin-top:4px;display:inline-block">${ago(n.ts)}</small></div></div>`).join('')}</div>`:'<p class=sub>No tienes notificaciones pendientes.</p>'}</div>`},
mentor_home:()=>{const m=S.me,p=mine().filter(r=>r.status==='PENDIENTE'),miss=!(m.specialty&&m.bio&&m.availability?.length);return `<div class=card><div class="row sp"><div class=row>${av(m,64)}<div><h2>${wave('Hola, '+m.name)}</h2><p class=sub>Comparte tu experiencia y ayuda a más personas a crecer.</p><p class=ty><span class=typed></span></p></div></div><button class="btn p" data-a=pedit>✏️ Editar / Completar mi perfil</button></div>${miss?`<div class="row sp" style="background:#fef3c7;border:1px solid #fde68a;padding:12px 16px;border-radius:12px;margin-top:14px"><span style="font-size:13px;color:#92400e">📌 <b>Tu perfil de mentor aún no está completo:</b> agrega tu especialidad, experiencia, biografía y horarios para que los alumnos te encuentren y soliciten clases.</span><button class="btn p" data-a=pedit style="font-size:12px">Completar ahora</button></div>`:''}</div><div class="grid g4" style="margin:16px 0">${stat('Estudiantes',new Set(acc().map(r=>r.student)).size)}${stat('Clases confirmadas',acc().filter(r=>(r.sesion||'Confirmada')==='Confirmada').length)}${stat('Solicitudes pendientes',p.length)}${stat('Calificación',rating(m.id)?.v||'—')}</div><div class="grid g2"><div class=card><h3>Próximas clases por Meet</h3>${acc().filter(r=>(r.sesion||'Confirmada')==='Confirmada').slice(0,4).map(r=>`<p class="row sp"><span><b>${esc(U(r.student).name)}</b> · ${fdate(r.date)} ${esc(r.time)}</span><button class="btn" style="padding:2px 8px;font-size:11px" data-a=meet data-id=${r.id}>🎥 Meet</button></p>`).join('')||'<p class=sub>Sin clases confirmadas.</p>'}</div><div class=card><h3>Mensajes recientes</h3>${[...S.msgs].sort((a,b)=>b.ts-a.ts).slice(0,4).map(x=>`<p><b>${esc(U(x.from).name)}</b>: ${esc(x.text)} <small>${ago(x.ts)}</small></p>`).join('')||'<p class=sub>Sin mensajes.</p>'}</div><div class=card><h3>Mis estudiantes aceptados</h3>${[...new Map(myStudents().map(x=>[x.u.id,x])).values()].map(({u})=>`<p class=row>${av(u,30)}<span>${esc(u.name)}<br><small>${esc(u.career||'')} · Mi nota: ${myGrade(u.id)?myGrade(u.id).value+'/'+MAXG:'sin calificar'}</small></span><button class=btn data-a=grade data-id=${u.id}>⭐ Calificar</button></p>`).join('')||'<p class=sub>Aún no aceptaste estudiantes.</p>'}</div></div><h3 style="margin:20px 0 10px">🏆 Alumnos destacados · mejores notas de los mentores</h3><div class="grid g4">${fstu()}</div>`},
mentor_meet:()=>{
  const allSes=acc().sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  const live=allSes.filter(r=>r.live);
  const upcoming=allSes.filter(r=>(r.sesion||'Confirmada')==='Confirmada'&&!isPast(r.date,r.time)&&!r.live);
  const past=allSes.filter(r=>(r.sesion==='Finalizada')||isPast(r.date,r.time)).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
  const lastMeet=past[0];
  return `<div>
    <div class="row sp" style="margin-bottom:16px;flex-wrap:wrap;gap:10px">
      <div>
        <h2 style="margin:0">🎥 Mis Clases por Google Meet</h2>
        <p class=sub style="margin:4px 0 0">Programa clases individuales o grupales, gestiona tus enlaces de Meet e inicia sesiones en vivo.</p>
      </div>
      <div class=row style="gap:8px">
        <button class="btn p" data-a=msched style="box-shadow:0 2px 8px rgba(37,99,235,.25);font-weight:700">📅 + Programar clase de Meet</button>
        <a class="btn" target="_blank" rel="noopener" href="https://meet.google.com/new">+ Crear reunión en Meet ↗</a>
      </div>
    </div>
    <div class="grid g4" style="margin-bottom:20px;gap:12px">
      <div class="card stat" style="background:#eff6ff;border:1px solid #bfdbfe;padding:14px">
        <span style="color:#1e40af;font-size:12px;font-weight:700">📅 Clases próximas</span>
        <b style="font-size:14px;color:#1e3a8a;margin:4px 0 2px;display:block">${upcoming.length} por dictar</b>
        <small style="color:#2563eb;font-size:11.5px;display:block">${live.length?'🔴 '+live.length+' en vivo ahora':'Sin clases activas ahora'}</small>
      </div>
      <div class="card stat" style="background:#ecfdf5;border:1px solid #a7f3d0;padding:14px">
        <span style="color:#065f46;font-size:12px;font-weight:700">✔ Clases concluidas</span>
        <b style="font-size:14px;color:#047857;margin:4px 0 2px;display:block">${past.length} realizadas</b>
        <small style="color:#059669;font-size:11.5px;display:block">Historial completado</small>
      </div>
      <div class="card stat" style="background:#faf5ff;border:1px solid #e9d5ff;padding:14px">
        <span style="color:#6b21a8;font-size:12px;font-weight:700">🎥 Última sesión realizada</span>
        <b style="font-size:14px;color:#581c87;margin:4px 0 2px;display:block">${lastMeet&&lastMeet.date?`${fdate(lastMeet.date)}`:'Sin sesiones previas'}</b>
        <small style="color:#7e22ce;font-size:11.5px;display:block">${lastMeet?`A las ${lastMeet.time}`:'Comienza programando una'}</small>
      </div>
      <div class="card stat" style="background:#fffbeb;border:1px solid #fde68a;padding:14px">
        <span style="color:#92400e;font-size:12px;font-weight:700">👥 Total estudiantes</span>
        <b style="font-size:14px;color:#b45309;margin:4px 0 2px;display:block">${new Set(allSes.flatMap(r=>reqStudents(r).map(u=>u.id))).size} atendidos</b>
        <small style="color:#d97706;font-size:11.5px;display:block">Individuales y grupales</small>
      </div>
    </div>
    <div class="grid g2" style="margin-bottom:20px;gap:16px">
      <div class=card style="border:1px solid #e2e8f0">
        <h3 style="color:#dc2626;border-bottom:1px solid #f1f5f9;padding-bottom:8px;margin-bottom:12px">🔴 En clase ahora</h3>
        ${live.map(r=>{
          const stList=reqStudents(r);
          return `<div class="row sp" style="padding:10px 0;border-bottom:1px solid #f1f5f9"><div class=row style="gap:10px">${av(stList[0]||{},40)}<div><b>${r.isGroup?`👥 Clase Grupal (${stList.length} alumnos)`:esc(stList[0]?.name||'Estudiante')}</b><br><small style="color:var(--m)">${esc(r.specialty)} · ⏰ ${esc(r.time)}</small></div></div><div class=row style="gap:6px">${r.meetLink?`<a class="btn g" target=_blank rel=noopener href="${esc(r.meetLink)}" style="font-weight:700">🎥 Entrar</a>`:''}<button class="btn d" data-a=finishclass data-id=${r.id} style="font-weight:700">⏹ Terminar clase</button></div></div>`;
        }).join('')||'<p class=sub>No tienes clases en vivo en este momento. Pulsa «🔴 Iniciar clase» abajo cuando comience tu videollamada.</p>'}
      </div>
      <div class=card style="border:1px solid #e2e8f0">
        <h3 style="color:#1e3a8a;border-bottom:1px solid #f1f5f9;padding-bottom:8px;margin-bottom:12px">💡 Cómo programar y usar Meet</h3>
        <ol style="margin:8px 0;padding-left:18px;line-height:1.6;font-size:13px;color:var(--m)">
          <li>Pulsa <b>«📅 + Programar clase de Meet»</b> arriba para definir fecha y hora para 1 persona o para un grupo.</li>
          <li>Puedes generar una sala con <b>«+ Crear reunión en Meet»</b> y pegar el enlace generado.</li>
          <li>Al comenzar la sesión, haz clic en <b>«🔴 Iniciar clase»</b>: entrarás a Meet y se notificará automáticamente a tus alumnos con «¡Tu clase ha comenzado!».</li>
          <li>Al pulsar <b>«⏹ Terminar clase»</b>, podrás calificar inmediatamente la nota del alumno.</li>
        </ol>
      </div>
    </div>
    <div class="card tw" style="margin-bottom:20px;border:1px solid #e2e8f0">
      <div class="row sp" style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #f1f5f9">
        <h3 style="margin:0;color:#1e3a8a">📅 Próximas clases programadas (${upcoming.length})</h3>
        <button class="btn p" data-a=msched style="font-size:12px">📅 + Nueva clase</button>
      </div>
      ${upcoming.length?`<table><tr><th>Participantes / Estudiante</th><th>Modalidad</th><th>Materia / Tema</th><th>Fecha y Hora</th><th>Enlace de Meet</th><th>En Vivo</th><th>Acción</th></tr>${upcoming.map(r=>{
        const stList=reqStudents(r);
        return `<tr><td>${r.isGroup?`<div><b style="color:#1e40af">👥 Grupo (${stList.length} estudiantes)</b><div style="font-size:11.5px;color:var(--m);max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${stList.map(s=>esc(s.name)).join(', ')}">${stList.map(s=>esc(s.name)).join(', ')}</div></div>`:`<div class=row style="gap:8px">${av(stList[0]||{},34)}<div><b>${esc(stList[0]?.name||'Estudiante')}</b><br><small style="color:var(--m)">${esc(stList[0]?.career||'Estudiante')}</small></div></div>`}</td><td><span class="badge" style="background:#eff6ff;color:#1e40af;font-size:11.5px">${r.isGroup?'👥 Grupal':'👤 Individual'}</span></td><td><b>${esc(r.specialty)}</b>${r.message?`<br><small style="color:var(--t)">${esc(r.message)}</small>`:''}</td><td><b>${fdate(r.date)}</b><br><small style="color:#047857;font-weight:700">⏰ ${esc(r.time)}</small><br><button class="btn btn-sm" data-a=modtime data-id=${r.id} style="font-size:10.5px;padding:2px 6px;margin-top:4px">📅 Cambiar hora</button></td><td>${r.live?`<a class="badge g" target=_blank rel=noopener href="${esc(getMeetUrl(r)||'https://meet.google.com/')}" style="font-weight:700">🎥 Entrar a Meet</a>`:(r.meetLink?`<a class="badge g" target=_blank rel=noopener href="${esc(r.meetLink)}" style="margin-bottom:3px;display:inline-block">🎥 Entrar</a><br><button class="btn btn-sm" data-a=meet data-id=${r.id} style="font-size:10.5px">✏️ Editar</button>`:`<button class="btn btn-sm" data-a=meet data-id=${r.id} style="font-size:11px">➕ Añadir enlace</button>`)}</td><td>${r.live?'<span class="badge" style="background:#fee2e2;color:#dc2626;font-weight:700">🔴 EN VIVO</span>':'<span class="badge" style="background:#f1f5f9;color:#64748b">Por iniciar</span>'}</td><td>${r.live?`<button class="btn d" data-a=finishclass data-id=${r.id} style="font-size:12px;font-weight:700">⏹ Terminar clase</button>`:`<button class="btn p" data-a=startclass data-id=${r.id} style="font-size:12px;font-weight:700">🔴 Iniciar clase por Meet</button>`}</td></tr>`;
      }).join('')}</table>`:'<p class=sub style="padding:12px 0">No tienes clases confirmadas pendientes. Puedes programar una nueva clase arriba o aceptar solicitudes pendientes.</p>'}
    </div>
    <div class="card tw" style="border:1px solid #e2e8f0">
      <div class="row sp" style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #f1f5f9">
        <h3 style="margin:0;color:#1e3a8a">📚 Historial de clases concluidas / realizadas (${past.length})</h3>
        <span class="badge" style="background:#f1f5f9;color:#475569">${past.length} terminadas</span>
      </div>
      ${past.length?`<table><tr><th>Participantes</th><th>Modalidad</th><th>Tema dictado</th><th>Fecha y hora de realización</th><th>Estado</th><th>Calificar Alumno</th></tr>${past.map(r=>{
        const stList=reqStudents(r);
        const st=stList[0]||U(r.student);
        const g=myGrade(st.id);
        return `<tr><td>${r.isGroup?`<div><b>👥 Grupo (${stList.length} estudiantes)</b><div style="font-size:11.5px;color:var(--m)">${stList.map(s=>esc(s.name)).join(', ')}</div></div>`:`<div class=row style="gap:8px">${av(st,30)}<b>${esc(st.name||'Estudiante')}</b></div>`}</td><td><span class="badge">${r.isGroup?'👥 Grupal':'👤 Individual'}</span></td><td><b>${esc(r.specialty)}</b></td><td><b>${fdate(r.date)}</b> · ${esc(r.time)}</td><td><span class="badge" style="background:#e2e8f0;color:#334155;font-weight:700">✔ Concluida</span></td><td>${g?`<div class=row style="gap:6px"><span class="badge g" style="font-weight:700">⭐ ${g.value}/${MAXG}</span><button class="btn btn-sm" data-a=grade data-id=${st.id} style="font-size:11px">Editar nota</button></div>`:`<button class="btn btn-sm p" data-a=grade data-id=${st.id} style="font-size:11.5px;font-weight:700">⭐ Calificar alumno</button>`}</td></tr>`;
      }).join('')}</table>`:'<p class=sub style="padding:12px 0">Aquí aparecerá el registro histórico de las clases una vez que haya pasado su hora y fecha programada.</p>'}
    </div>
  </div>`;
},
mentor_profile:()=>pview(S.me),
mentor_reqs:()=>reqTabs()+rtable(mine().filter(r=>!S.rf||r.status===S.rf).sort((a,b)=>b.created-a.created),'m'),mentor_chat:chatV,mentor_cal:calV,
mentor_avail:()=>{const rs=resv(),ds=S.me.availability||[];
 return `<div class="grid g2"><div class=card><h3>🗓️ Mis horarios</h3><p class=sub>Marca los días en que atiendes y define la hora.</p><div class=row style="margin:8px 0"><button type=button class=btn data-a=avp data-p=wk>Lun–Vie</button><button type=button class=btn data-a=avp data-p=all>Todos</button><button type=button class=btn data-a=avp data-p=none>Ninguno</button></div><form data-f=avail>${DAYS.map(d=>{const a=ds.find(x=>x.d===d);return `<div class=row><label style="width:110px"><input type=checkbox name=on_${d} style="width:auto" ${a?'checked':''}> ${d}</label><input type=time name=a_${d} value="${a?.a||'18:00'}" style="width:130px"><input type=time name=b_${d} value="${a?.b||'21:00'}" style="width:130px"></div>`}).join('')}<button class="btn p">Guardar disponibilidad</button></form></div>
 <div class=card><h3>📌 Días disponibles y reservas</h3>${DAYS.map(d=>{const a=ds.find(x=>x.d===d),l=rs.filter(r=>wd(r.date)===d);return `<div class=dayrow><div class="row sp"><b>${d}</b>${a?`<span class="badge g">✔ Disponible ${a.a} – ${a.b}</span>`:'<span class=badge>No disponible</span>'}</div>${l.map(r=>{const o=U(r.student),dentro=a&&r.time>=a.a&&r.time<=a.b;return `<div class="row resv">${av(o,28)}<span><b>${esc(o.name)}</b> reservó el ${fdate(r.date)} a las <b>${esc(r.time)}</b> <span class="badge ${stB(r.status)}">${r.status}</span>${!a?' <span class="badge y">día no disponible</span>':!dentro?' <span class="badge y">fuera de horario</span>':''}</span></div>`}).join('')||(a?'<small>Sin reservas este día</small>':'')}</div>`}).join('')}</div></div>
 <div class="card tw" style="margin-top:16px"><h3>✅ Quiénes reservaron su cita</h3>${rs.length?`<table><tr><th>Estudiante</th><th>Día</th><th>Fecha</th><th>Hora reservada</th><th>Estado</th></tr>${rs.map(r=>{const o=U(r.student);return `<tr><td><div class=row>${av(o,32)}${esc(o.name)}</div></td><td>${wd(r.date)}</td><td>${fdate(r.date)}</td><td><b>${esc(r.time)}</b></td><td><span class="badge ${stB(r.status)}">${r.status}</span></td></tr>`}).join('')}</table>`:'<p class=sub>Todavía nadie reservó una cita contigo.</p>'}</div>`},
admin_dash:()=>{
 const st=S.users.filter(u=>u.role==='student'),mt=S.users.filter(u=>u.role==='mentor');
 const curYear=new Date().getFullYear();
 const mo=[...Array(12)].map((_,i)=>[st,mt].map(l=>l.filter(u=>{const d=new Date(u.created||0);return d.getMonth()===i&&d.getFullYear()===curYear}).length));
 const maxVal=Math.max(5,...mo.flat());
 const stYearTotal=mo.reduce((a,x)=>a+x[0],0), mtYearTotal=mo.reduce((a,x)=>a+x[1],0);
 const getX=i=>55+i*45;
 const getY=v=>140-(v/maxVal)*115;
 const pt=k=>mo.map((v,i)=>`${getX(i)},${getY(v[k])}`).join(' ');
 const circles=k=>mo.map((v,i)=>`<circle cx="${getX(i)}" cy="${getY(v[k])}" r="4.5" fill="${k===0?'#2563eb':'#7c3aed'}" stroke="#fff" stroke-width="1.5"><title>${MONTHS_ES[i]}: ${v[k]} ${k===0?'estudiante(s)':'mentor(es)'}</title></circle>${v[k]>0?`<text x="${getX(i)}" y="${getY(v[k])-8}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${k===0?'#1e40af':'#6d28d9'}">${v[k]}</text>`:''}`).join('');
 return `<div class="row sp" style="margin-bottom:16px"><h2 style="margin:0">Panel de Control General</h2><div class=row><button class="btn p" data-a=seed>🌱 Cargar datos de prueba</button><button class="btn" data-a=csvu>⬇ Exportar usuarios</button></div></div>
 <div class="grid g4">${stat('Total de estudiantes',st.length)}${stat('Total de mentores',mt.length)}${stat('Mentores activos',mt.filter(u=>u.active!==false).length)}${stat('Solicitudes pendientes',S.reqs.filter(r=>r.status==='PENDIENTE').length)}${stat('Mentorías activas',S.reqs.filter(r=>r.status==='ACEPTADA'&&(r.sesion||'Confirmada')==='Confirmada').length)}${stat('Mensajes / conexiones',S.chats.reduce((a,c)=>a+(c.count||0),0))}${stat('Usuarios suspendidos',S.users.filter(u=>u.active===false).length)}${stat('Cuentas eliminadas',S.tombs.length)}${stat('Estado de la página',S.site.maintenance?'🛠️ Mantenimiento':'✅ Disponible')}</div>
 <div class="grid g2" style="margin-top:16px">
  <div class=card>
   <div class="row sp" style="margin-bottom:10px">
    <h3 style="margin:0">📊 Registros por mes (${curYear})</h3>
    <span class="badge" style="background:#eff6ff;color:#1e40af;font-size:11.5px">Escala 0 a ${maxVal}</span>
   </div>
   <svg viewBox="0 0 580 175" width=100% style="overflow:visible">
    <!-- Ejes y líneas de escala horizontal -->
    <line x1=45 y1=25 x2=550 y2=25 stroke="#e2e8f0" stroke-dasharray="3 3"/>
    <text x=38 y=29 text-anchor=end font-size=11 fill="#64748b" font-weight="600">${maxVal}</text>
    <line x1=45 y1=${25+115/2} x2=550 y2=${25+115/2} stroke="#e2e8f0" stroke-dasharray="3 3"/>
    <text x=38 y=${29+115/2} text-anchor=end font-size=11 fill="#64748b" font-weight="600">${Math.round(maxVal/2)}</text>
    <line x1=45 y1=140 x2=550 y2=140 stroke="#cbd5e1" stroke-width=1.5/>
    <text x=38 y=143 text-anchor=end font-size=11 fill="#64748b" font-weight="600">0</text>
    <!-- Etiquetas de meses -->
    ${MONTHS_ES.map((m,i)=>`<text x="${getX(i)}" y="158" text-anchor="middle" font-size="11" fill="${i===new Date().getMonth()?'#2563eb':'#64748b'}" font-weight="${i===new Date().getMonth()?'700':'400'}">${m}</text>`).join('')}
    <!-- Líneas de datos -->
    <polyline fill=none stroke="#2563eb" stroke-width=3 stroke-linecap="round" stroke-linejoin="round" points="${pt(0)}"/>
    <polyline fill=none stroke="#7c3aed" stroke-width=3 stroke-linecap="round" stroke-linejoin="round" points="${pt(1)}"/>
    <!-- Puntos y valores -->
    ${circles(0)}
    ${circles(1)}
   </svg>
   <div class="row sp" style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9;font-size:12.5px">
    <div class=row style="gap:14px">
     <span style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:3px;background:#2563eb;display:inline-block;border-radius:2px"></span><b>Estudiantes (${stYearTotal})</b></span>
     <span style="display:inline-flex;align-items:center;gap:6px"><span style="width:12px;height:3px;background:#7c3aed;display:inline-block;border-radius:2px"></span><b>Mentores (${mtYearTotal})</b></span>
    </div>
    <small style="color:#64748b">Actualizado en tiempo real</small>
   </div>
  </div>
  <div class=card>
   <div class="row sp" style="margin-bottom:8px"><h3 style="margin:0">⚡ Últimas actividades en tiempo real</h3><span class="badge g" style="font-size:11px">● En vivo</span></div>
   <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">
    ${getRecentActivities().map(a=>`<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 10px;border-radius:8px;background:#f8fafc;border:1px solid #f1f5f9;font-size:12.5px;line-height:1.4"><span style="font-size:15px;flex-shrink:0;margin-top:1px">${a.icon}</span><div style="flex:1"><div>${a.text}</div><small style="color:#94a3b8;font-size:11px">${ago(a.ts)}</small></div></div>`).join('')||'<p class=sub>Sin actividades registradas.</p>'}
   </div>
  </div>
  <div class=card><h3>Solicitudes recientes</h3>${[...S.reqs].sort((a,b)=>b.created-a.created).slice(0,5).map(r=>`<p>${esc(U(r.student).name)} → ${esc(U(r.mentor).name)} <span class="badge ${stB(r.status)}">${r.status}</span></p>`).join('')||'<p class=sub>Sin solicitudes.</p>'}</div>
  <div class=card><h3>Usuarios recientes</h3>${[...S.users].sort((a,b)=>b.created-a.created).slice(0,5).map(u=>`<p class=row>${av(u,28)}${esc(u.name)} <span class=badge>${u.role}</span></p>`).join('')}</div>
 </div>`;
},
admin_students:()=>ufilterBar('student')+`<div id=list>${peopleTable(plain('student'))}</div>`,
admin_mentors:()=>ufilterBar('mentor')+`<div id=list>${peopleTable(plain('mentor'))}</div>`,
admin_sesiones,
admin_reqs,
admin_msgs:()=>`<div class="row sp" style="margin-bottom:14px"><div><h2 style="margin:0">Conexiones y Conversaciones de la Comunidad</h2><p class=sub style="margin:4px 0 0">Supervisa las conversaciones activas entre estudiantes y mentores.</p></div></div><div class="card tw"><table><tr><th>Conexión</th><th>Mensajes</th><th>Última actividad</th><th style="min-width:220px">Acciones de Administrador</th></tr>${S.chats.map(c=>`<tr><td><div class=row>${av(U(c.members[0]),30)}<b>${esc(U(c.members[0]).name)}</b> <span style="color:var(--m)">↔</span> ${av(U(c.members[1]),30)}<b>${esc(U(c.members[1]).name)}</b></div></td><td><span class="badge p">${c.count||0} mensaje(s)</span></td><td>${ago(c.last)}</td><td><div class=row style="gap:6px"><button class="btn btn-sm" data-a=msg data-id=${c.members[0]}>💬 Escribir a ${esc(U(c.members[0]).name.split(' ')[0])}</button><button class="btn btn-sm d" data-a=chatdel data-id=${c.id} style="background:#fee2e2;color:#dc2626;border-color:#fca5a5" title="Eliminar conexión">🗑️ Eliminar</button></div></td></tr>`).join('')||'<tr><td colspan=4>Sin conversaciones activas.</td></tr>'}</table></div>`,
admin_reports,
student_help:helpV,
mentor_help:helpV,
admin_help:helpV,
admin_trash:()=>{return `<div class="row sp" style="margin-bottom:14px"><div><h2 style="margin:0">Papelera de Usuarios Eliminados</h2><p class=sub style="margin:4px 0 0">Personas eliminadas o bloqueadas por la administración. Ya no pueden acceder a MentorApp. Puedes restaurar su cuenta o eliminarla definitivamente.</p></div>${S.tombs.length?`<button class="btn d" data-a=tclear>🧹 Vaciar papelera (${S.tombs.length})</button>`:''}</div><div class="card tw"><table><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Motivo</th><th>Fecha eliminación</th><th>Acciones</th></tr>${[...S.tombs].sort((a,b)=>b.ts-a.ts).map(t=>`<tr><td><div class=row>${av(t,30)}<b>${esc(t.name)}</b></div></td><td>${esc(t.email)}</td><td><span class=badge>${{mentor:'Mentor',student:'Estudiante'}[t.role]||esc(t.role)}</span></td><td><small style="color:var(--m)">${esc(t.reason||'—')}</small></td><td>${ago(t.ts)}</td><td><div class=row style="gap:6px"><button class="btn g" data-a=urest data-id=${t.id}>↩ Restaurar</button><button class="btn d" data-a=tpurge data-id=${t.id}>🗑️ Eliminar definitivo</button></div></td></tr>`).join('')||'<tr><td colspan=6>La papelera está vacía. Ningún usuario ha sido eliminado.</td></tr>'}</table></div>`},
admin_cfg:()=>{const s=S.site,mt=!!s.maintenance;return `<div class="grid g2"><div class=card><h3>🛠️ Estado de la página</h3><p>Ahora está <span class="badge ${mt?'r':'g'}">${mt?'En mantenimiento':'Disponible'}</span></p><p class=sub>En mantenimiento, estudiantes y mentores ven «Sitio en mantenimiento». Tú sigues entrando como administrador.</p><label>Mensaje para los usuarios (opcional)</label><input id=mmsg value="${esc(s.message||'')}" placeholder="Ej. Volvemos a las 6 pm"><button type=button class="btn ${mt?'g':'d'}" data-a=maint>${mt?'✔ Reabrir la página':'⏸ Poner en mantenimiento'}</button></div>
<div class=card><h3>📢 Aviso para todos</h3><p class=sub>Aparece como franja arriba en la pantalla de todos los usuarios.</p>${s.announce?`<p class=ann style="margin:8px 0"><span>${esc(s.announce)}</span></p>`:''}<form data-f=ann><textarea name=text rows=3 placeholder="Escribe el aviso…"></textarea><label class=row style="font-weight:400"><input type=checkbox name=notif style="width:auto;margin:0"> Enviar también como notificación</label><div class=row style="margin-top:8px"><button class="btn p">Publicar aviso</button>${s.announce?'<button type=button class="btn d" data-a=annoff>Quitar aviso</button>':''}</div></form></div>
<div class=card><h3>👥 Control de usuarios</h3><p class=sub>En Estudiantes y Mentores puedes suspender (con motivo), eliminar, cambiar de rol, verificar mentores y enviar correo para cambiar contraseña. En «Eliminados» puedes restaurar cuentas.</p><p><span class=badge>${S.users.filter(u=>u.active===false).length} suspendidos</span> <span class=badge>${S.tombs.length} eliminados</span></p></div>
<div class=card><h3>Cuenta de administrador</h3><p>${esc(S.me.email)}</p><button class=btn data-a=reset>Enviar correo para cambiar contraseña</button></div></div>`}};
V.mentor_peers=V.student_peers;
V.student_bot=()=>botPageView('student');
V.mentor_bot=()=>botPageView('mentor');
V.admin_bot=()=>botPageView('admin');
const plain=r=>{
 const flt=S.ufilter||'all';
 return S.users.filter(u=>{
  if(u.role!==r||delUsers.has(u.id))return false;
  if(S.q&&!(u.name+u.email+(u.specialty||'')+(u.career||'')).toLowerCase().includes(S.q.toLowerCase()))return false;
  if(flt==='online')return isOnline(u);
  if(flt==='blocked')return u.active===false||u.blocked;
  const days=u.lastActive?(Date.now()-u.lastActive)/86400000:Infinity;
  const isInactive=u.active!==false&&!isOnline(u)&&(!u.lastActive||days>=3);
  if(flt==='inactive')return isInactive;
  if(flt==='active')return u.active!==false&&(isOnline(u)||(u.lastActive&&days<3));
  return true;
 });
};
const plist=()=>S.users.filter(u=>u.role==='student'&&u.id!==S.me.id&&u.active!==false&&(!S.q||[u.name,u.career,...(u.skills||[]),...(u.interests||[])].join(' ').toLowerCase().includes(S.q.toLowerCase()))).map(u=>`<div class=card><div class=row>${av(u,48)}<div><b>${esc(u.name)}</b><br><small>${esc(u.career||'')} · ${esc(u.level||'')}</small></div></div><div>${chips(u.skills)}${chips(u.interests)}</div><small>Progreso ${+u.progress||0}%</small><div style="background:#e5e9f5;border-radius:9px;height:8px"><div style="width:${+u.progress||0}%;background:var(--b);height:8px;border-radius:9px"></div></div><div class=row style="margin-top:10px"><button class=btn data-a=pviewx data-id=${u.id}>Ver perfil</button><button class=btn data-a=msg data-id=${u.id}>💬 Mensaje</button></div></div>`).join('')||'<p class=sub>No hay alumnos para mostrar.</p>';
/* ---------- ACCIONES ---------- */
const mprofile=m=>pview(m)+`<div class=row style="margin-top:14px">${S.me.role==='student'&&m.role==='mentor'?`<button class="btn p" data-a=mreq data-id=${m.id}>📩 Mandar solicitud</button>`:''}${S.me.id!==m.id&&S.me.role!=='admin'?`<button class="btn g" data-a=msg data-id=${m.id}>💬 Enviar mensaje directo</button>`:''}<button class=btn data-a=close>Cerrar</button></div>`;
const upd=(id,d)=>T(async()=>{const u=S.users.find(x=>x.id===id);if(u)Object.assign(u,d);if(S.me&&S.me.id===id)Object.assign(S.me,d);refresh();try{await updateDoc(doc(db,'users',id),d);toast('Cambios guardados correctamente.')}catch(e){toast('Acción aplicada en la aplicación.')}});
const A={
open_guide:()=>{S.guideOpen = true; S.guideStep = 1; render();},
close_guide:()=>{S.guideOpen = false; if(S.me) try{localStorage.setItem('mentorapp_guide_seen_' + S.me.id + '_' + S.me.role, 'true');}catch{} render();},
guide_next:()=>{if((S.guideStep||1) < 6){S.guideStep = (S.guideStep||1) + 1; renderGuideModalInPlace();} else {A.close_guide(); toast('🎉 ¡Excelente! Ya puedes usar MentorApp con toda confianza.');}},
guide_restart:()=>{S.guideStep = 1; renderGuideModalInPlace();},
guide_jump:d=>{S.guideStep = +d.s || 1; renderGuideModalInPlace();},
open_bot:()=>{S.botPanelOpen = true; render();},
close_bot:()=>{S.botPanelOpen = false; render();},
toggle_bot:()=>{S.botPanelOpen = S.botPanelOpen === false ? true : false; render();},
close_bot_panel:()=>{S.botPanelOpen = false; render();},
toggle_bot_panel:()=>{S.botPanelOpen = S.botPanelOpen === false ? true : false; render();},
asst_act:d=>{handleAsstAction(d.v);},
asst_reset:()=>{BOT_STATE.chatting = false; render();},
bot_topic:d=>{handleBotTopic(d.t)},
bot_act:d=>{handleBotAction(d)},
bot_clear:()=>{clearBotChat()},
bot_voice:()=>{toggleBotVoice()},
bot_dictate:()=>{startBotDictation()},
startclass:d=>{
 const r=S.reqs.find(x=>x.id===d.id);if(!r)return;
 let ml=getMeetUrl(r);
 if(!ml){
  modal(`<h2>🎥 Iniciar clase por Google Meet</h2>
  <p class=sub>Ingresa el enlace de Meet o crea una sala nueva para iniciar la clase con <b>${esc(U(r.student).name)}</b>:</p>
  <form data-f=meet_start data-id="${d.id}">
   <label><b>Enlace de la reunión:</b></label>
   <input name=link placeholder="https://meet.google.com/..." required style="margin-bottom:10px" autofocus>
   <div style="margin-bottom:14px">
    <a class="btn g" target=_blank rel=noopener href="https://meet.google.com/new" style="display:inline-flex;align-items:center;gap:6px">➕ Crear sala en Google Meet ↗</a>
   </div>
   <div class=row style="gap:8px">
    <button class="btn p">🔴 Iniciar clase en vivo ahora</button>
    <button type=button class=btn data-a=close>Cancelar</button>
   </div>
  </form>`);
  return;
 }
 T(async()=>{
  r.live=true;
  r.sesion='Confirmada';
  refresh();
  await updateDoc(doc(db,'requests',r.id),{live:true,sesion:'Confirmada'});
  const students=reqStudents(r);
  for(const s of (students.length?students:[U(r.student)])){
   if(s&&s.id)await notify(s.id,`🔴 ¡Tu clase de «${r.specialty}» ha comenzado! El mentor ${S.me.name} ya está en Google Meet.`);
  }
  window.open(ml,'_blank');
  toast('🔴 ¡Clase en vivo iniciada! Se abrió Meet y se notificó a tus alumnos.');
 });
},
finishclass:d=>{
 const r=S.reqs.find(x=>x.id===d.id);if(!r)return;
 if(!confirm(`¿Concluir y finalizar la clase de «${r.specialty}»?\n\nAl finalizarla, podrás calificar inmediatamente el desempeño de tu alumno.`))return;
 T(async()=>{
  r.sesion='Finalizada';
  r.live=false;
  refresh();
  await updateDoc(doc(db,'requests',r.id),{sesion:'Finalizada',live:false});
  const students=reqStudents(r);
  const targetStudents=students.length?students:[U(r.student)];
  for(const s of targetStudents){
   if(s&&s.id)await notify(s.id,`🎉 Tu clase de «${r.specialty}» con ${S.me.name} ha concluido. ¡Ya puedes calificar a tu mentor en MentorApp!`);
  }
  toast('✔ Clase finalizada y registrada en Clases concluidas.');
  const sid=targetStudents[0]?.id||r.student;
  if(sid&&S.me.role==='mentor'){
   setTimeout(()=>{
    A.grade({id:sid});
   },350);
  }
 });
},
live:d=>{
 const r=S.reqs.find(x=>x.id===d.id);if(!r)return;
 if(r.live){
  A.finishclass(d);
 }else{
  A.startclass(d);
 }
},
grade:d=>{
 const u=U(d.id),g=myGrade(d.id);
 const curVal=g?+g.value:18;
 modal(`<h2>⭐ Calificar al alumno: ${esc(u.name)}</h2>
 <p class=sub>Registra la nota académica del estudiante (de 0 a ${MAXG}). Esta calificación se reflejará en su perfil y en el ranking de Alumnos Destacados.</p>
 <div class="row" style="gap:12px;background:#f8fafc;padding:12px;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:14px;align-items:center">
  ${av(u,44)}
  <div>
   <b style="font-size:15px;color:#0f172a">${esc(u.name)}</b>
   <div style="font-size:12px;color:var(--m)">${esc(u.career||'Estudiante')} · ${esc(u.level||'')}</div>
  </div>
 </div>
 <form data-f=grade data-id="${d.id}">
  <div style="margin-bottom:14px">
   <label style="font-weight:700">Nota académica (0 a ${MAXG}):</label>
   <div style="display:flex;align-items:center;gap:10px;margin-top:6px">
    <select name=value id=grade_select style="font-size:16px;font-weight:700;padding:10px 14px;border-radius:10px;border:2px solid #2563eb;color:#1e40af;max-width:180px" onchange="document.getElementById('grade_label').innerText=this.value>=18?'🌟 Excelente':this.value>=15?'👏 Muy bueno':this.value>=13?'👍 Aprobado':this.value>=11?'Regular':'Requiere reforzar'">
     ${Array.from({length:MAXG+1},(_,i)=>MAXG-i).map(n=>`<option value="${n}" ${curVal===n?'selected':''}>Nota: ${n} / ${MAXG}</option>`).join('')}
    </select>
    <span id=grade_label class="badge" style="background:#eff6ff;color:#1e40af;font-size:13px;padding:8px 14px;font-weight:700">${curVal>=18?'🌟 Excelente':curVal>=15?'👏 Muy bueno':curVal>=13?'👍 Aprobado':curVal>=11?'Regular':'Requiere reforzar'}</span>
   </div>
  </div>
  <label style="font-weight:700">Comentario o retroalimentación para el alumno:</label>
  <textarea name=comment rows=3 placeholder="Escribe tus observaciones del desempeño del alumno, fortalezas o aspectos a mejorar…">${esc(g?.comment||'')}</textarea>
  <div class=row style="margin-top:16px;gap:8px">
   <button class="btn p" style="padding:10px 22px;font-weight:700">💾 Guardar calificación del alumno</button>
   <button type=button class=btn data-a=close>Cerrar</button>
  </div>
 </form>`);
},
avp:d=>document.querySelectorAll('[data-f=avail] [type=checkbox]').forEach(c=>{c.checked=d.p==='all'||(d.p==='wk'&&!['Sábado','Domingo'].includes(c.name.slice(3)))}),
rf:d=>{S.rf=d.v;render()},
quickcat:d=>{S.q=d.c;S.view='mentors';render()},
meet:d=>{const r=S.reqs.find(x=>x.id===d.id);if(!r)return;modal(`<h2>🎥 Enlace de Google Meet</h2><p class=sub>Clase con ${esc(U(r.student).name)} · ${fdate(r.date)} ${esc(r.time)}</p><form data-f=meet data-id=${d.id}>${field('link','Enlace (https://meet.google.com/...)',r.meetLink||'','url')}<div class=row><button class="btn p">Guardar enlace</button><a class=btn target=_blank rel=noopener href="https://meet.google.com/new">Crear reunión nueva</a><button type=button class=btn data-a=close>Cancelar</button></div></form>`)},
msched:()=>{
  const stList=S.users.filter(u=>u.role==='student'&&u.active!==false);
  const now=new Date();
  const defDate=new Date(now.getTime()+86400000).toISOString().slice(0,10);
  modal(`<h2>📅 Programar nueva clase por Google Meet</h2>
  <p class=sub>Crea una sesión por Meet para un estudiante individual o para un grupo de personas.</p>
  <form data-f=sched_meet>
    <div style="background:#f8fafc;padding:12px;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:14px">
      <label style="font-size:13px;font-weight:700;margin-bottom:8px;display:block">1. Elige la modalidad de la clase:</label>
      <div class="row" style="gap:16px">
        <label style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-weight:600">
          <input type=radio name=sched_mode value="ind" checked style="width:auto;margin:0" data-in=schedmode>
          👤 Para una persona (Individual)
        </label>
        <label style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-weight:600">
          <input type=radio name=sched_mode value="grp" style="width:auto;margin:0" data-in=schedmode>
          👥 Para un grupo de personas (Grupal)
        </label>
      </div>
    </div>

    <!-- MODO INDIVIDUAL -->
    <div id=sched_ind_wrap style="margin-bottom:14px">
      <label><b>🎓 Selecciona el estudiante:</b></label>
      <select name=student style="margin-bottom:4px">
        ${stList.map(s=>`<option value="${s.id}">🎓 ${esc(s.name)} ${s.career?`(${esc(s.career)})`:''}</option>`).join('')||'<option value="">Sin estudiantes disponibles</option>'}
      </select>
    </div>

    <!-- MODO GRUPAL -->
    <div id=sched_grp_wrap style="display:none;margin-bottom:14px">
      <div class="row sp" style="margin-bottom:6px">
        <label style="margin:0"><b>👥 Selecciona los estudiantes del grupo:</b></label>
        <div class=row style="gap:6px">
          <button type=button class="btn btn-sm" data-a=selallstudents style="font-size:11px;padding:2px 8px">Marcar todos</button>
          <button type=button class="btn btn-sm" data-a=deselallstudents style="font-size:11px;padding:2px 8px">Desmarcar</button>
        </div>
      </div>
      <div style="max-height:180px;overflow-y:auto;border:1px solid #cbd5e1;border-radius:10px;padding:8px 12px;background:#f8fafc">
        ${stList.map(s=>`<label class=row style="font-weight:500;font-size:13px;padding:5px 0;cursor:pointer;border-bottom:1px solid #f1f5f9">
          <input type=checkbox name=group_students value="${s.id}" checked style="width:auto;margin:0">
          ${av(s,26)}
          <span><b>${esc(s.name)}</b> <small style="color:var(--m)">${esc(s.career||'Estudiante')} ${esc(s.level||'')}</small></span>
        </label>`).join('')||'<p class=sub>Sin estudiantes disponibles.</p>'}
      </div>
      <small style="color:#64748b;font-size:11.5px;display:block;margin-top:4px">💡 Todos los estudiantes seleccionados recibirán la clase en sus paneles y podrán unirse al mismo enlace de Meet.</small>
    </div>

    <label><b>📚 Materia o Tema de la clase:</b></label>
    <input name=topic placeholder="Ej: Desarrollo Web Full Stack, Repaso de Cálculo, etc." value="${esc(S.me.specialty||'')}" required style="margin-bottom:12px">

    <div class="grid g2" style="gap:10px;margin-bottom:12px">
      <div>
        <label><b>📅 Fecha de la clase:</b></label>
        <input name=date type=date value="${defDate}" min="${new Date().toISOString().slice(0,10)}" required>
      </div>
      <div>
        <label><b>⏰ Hora de la clase:</b></label>
        <input name=time type=time value="19:00" required>
      </div>
    </div>

    <label><b>🎥 Enlace de Google Meet:</b></label>
    <input name=meetLink placeholder="https://meet.google.com/..." style="margin-bottom:4px">
    <div class="row sp" style="margin-bottom:12px">
      <small class=sub>Puedes pegar tu enlace de Meet o generar uno nuevo ahora:</small>
      <a class=btn target=_blank rel=noopener href="https://meet.google.com/new" style="font-size:11.5px;padding:3px 10px">+ Crear reunión en Meet</a>
    </div>

    <label><b>📝 Mensaje o notas para los alumnos (opcional):</b></label>
    <textarea name=message rows=2 placeholder="Indica temas a repasar, requisitos previos o enlaces de apoyo…"></textarea>

    <div class="row" style="margin-top:16px;gap:8px">
      <button class="btn p">📅 Guardar y programar clase</button>
      <button type=button class=btn data-a=close>Cancelar</button>
    </div>
  </form>`);
},
selallstudents:()=>{
  document.querySelectorAll('#sched_grp_wrap [type=checkbox]').forEach(c=>c.checked=true);
},
deselallstudents:()=>{
  document.querySelectorAll('#sched_grp_wrap [type=checkbox]').forEach(c=>c.checked=false);
},
imgzoom:d=>{
  const src=d.src||'avatars/MENT.png',title=d.title||'Foto de perfil';
  modal(`<div style="text-align:center;padding:6px 0">
    <div class="row sp" style="margin-bottom:12px;border-bottom:1px solid #e2e8f0;padding-bottom:10px">
      <b style="font-size:16px;color:#0f172a">🖼️ ${esc(title)}</b>
      <button class=btn data-a=close title="Cerrar">✕</button>
    </div>
    <div style="max-height:75vh;display:flex;align-items:center;justify-content:center;background:#0b1329;border-radius:14px;overflow:hidden;padding:12px;box-shadow:inset 0 0 24px rgba(0,0,0,.6)">
      <img src="${esc(src)}" style="max-width:100%;max-height:70vh;object-fit:contain;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.5)" alt="${esc(title)}" onerror="this.onerror=null;this.src='avatars/MENT.png'">
    </div>
    <div class="row" style="justify-content:center;margin-top:14px;gap:10px">
      <a class="btn p" target=_blank rel=noopener href="${esc(src)}" style="padding:7px 16px;font-size:13px">Abrir en tamaño original ↗</a>
      <button class=btn data-a=close style="padding:7px 16px;font-size:13px">Cerrar</button>
    </div>
  </div>`);
},
editcover:()=>{
  const u=S.me,cur=cleanPhotoUrl(u.coverPhoto)||'';
  modal(`<h2>🖼️ Cambiar imagen de portada (Banner superior azul)</h2>
  <p class=sub>Personaliza la parte superior de tu perfil con una imagen o foto que te guste.</p>
  <form data-f=coverform data-id="${u.id}">
    <div style="margin-bottom:14px;border-radius:12px;overflow:hidden;border:2px dashed #cbd5e1;height:140px;position:relative;background:#1e3a8a;display:flex;align-items:center;justify-content:center">
      <img id=cover_modal_preview src="${esc(cur)}" style="width:100%;height:100%;object-fit:cover;${cur?'':'display:none'}" onerror="this.style.display='none'">
      <div id=cover_modal_placeholder style="${cur?'display:none;':''}text-align:center;color:#fff;padding:16px">
        <div style="font-size:28px;margin-bottom:4px">🖼️</div>
        <b>Vista previa de tu portada</b>
      </div>
    </div>
    <label><b>🌐 Enlace de Google Fotos, Drive o URL de imagen:</b></label>
    <input name=coverPhoto id=cover_in value="${esc(u.coverPhoto||'')}" placeholder="Pega el enlace de Google Fotos, Drive o URL..." data-in=coverurl style="margin-bottom:6px">
    <small style="color:#64748b;font-size:11.5px;display:block;margin-bottom:14px">Soporta enlaces de Google Drive, Google Fotos y enlaces directos de imágenes web.</small>
    <div class="row" style="gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap">
      <label class="btn" style="cursor:pointer;background:#eff6ff;border-color:#bfdbfe;color:#1e40af;font-size:13px;padding:8px 14px;display:inline-flex;align-items:center;gap:6px;font-weight:700">
        📁 <b>Subir imagen desde mi dispositivo</b>
        <input type=file accept="image/*" style="display:none" data-in=coverfile>
      </label>
      ${cur?`<button type=button class="btn d" data-a=delcover style="font-size:12px;padding:7px 12px">🗑️ Quitar portada</button>`:''}
    </div>
    <label style="font-size:12.5px;color:#475569;font-weight:700;margin-bottom:6px;display:block">O elige un fondo temático de nuestra biblioteca:</label>
    <div class="row" style="gap:8px;margin-bottom:16px;flex-wrap:wrap">
      ${[
        ['💻 Tecnología & Código', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80'],
        ['📚 Biblioteca & Estudio', 'https://images.unsplash.com/photo-1507842229456-0616b60c04d2?w=1200&q=80'],
        ['📐 Ciencias & Cálculo', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&q=80'],
        ['🎓 Éxito Académico', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80']
      ].map(([label, url])=>`
        <button type=button class="btn btn-sm" data-a=pickcover data-url="${url}" style="font-size:11.5px;padding:4px 10px;background:#f8fafc;border-color:#cbd5e1">${label}</button>
      `).join('')}
    </div>
    <div class="row" style="gap:8px;margin-top:16px">
      <button class="btn p" style="padding:9px 20px">💾 Guardar portada</button>
      <button type=button class=btn data-a=close>Cancelar</button>
    </div>
  </form>`);
},
pickcover:d=>{
  const cIn=$('#cover_in');if(cIn)cIn.value=d.url;
  const cPrev=$('#cover_modal_preview')||$('#cover_preview');
  if(cPrev){cPrev.src=d.url;cPrev.style.display='block'}
  const cPh=$('#cover_modal_placeholder');if(cPh)cPh.style.display='none';
  const cTxt=$('#cover_ph_txt');if(cTxt)cTxt.style.display='none';
},
delcover:()=>{
  const cIn=$('#cover_in');if(cIn)cIn.value='';
  const cPrev=$('#cover_modal_preview')||$('#cover_preview');
  if(cPrev)cPrev.style.display='none';
  const cPh=$('#cover_modal_placeholder');if(cPh)cPh.style.display='block';
  const cTxt=$('#cover_ph_txt');if(cTxt)cTxt.style.display='block';
  if(S.me)upd(S.me.id,{coverPhoto:''});
  toast('Foto de portada eliminada.');
},
go:(d)=>{S.view=d.v;S.q='';S.chat=S.chat;$('#sh')?.classList.remove('open');if(d.v==='notif')markNotifsAsRead();render()},burger:()=>$('#sh').classList.toggle('open'),close,
out:()=>signOut(auth),af:d=>{S.regMode=d.k==='reg';$('#authbox').innerHTML=authForm(d.k)},
google:()=>T(async()=>{const isReg=!!$('#authbox form[data-f=reg]')||document.querySelector('#authbox h2')?.textContent?.includes('Crear cuenta');const r=document.querySelector('#authbox [name=role]:checked');S.regMode=isReg;S.pending=isReg?{name:'',role:r?.value||'student'}:null;const p=new GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});await signInWithPopup(auth,p)}),
pick:d=>{const p=$('#ph');if(p)p.value=d.p;const prev=$('#ph_preview');if(prev)prev.src=d.p},hsearch:()=>{S.q=$('#hq').value;S.view='mentors';render()},
ufilter:d=>{S.ufilter=d.v;render();},
helppin:d=>T(async()=>{const h=(S.helps||[]).find(x=>x.id===d.id);if(!h)return;h.pinned=!h.pinned;render();toast(h.pinned?'Duda fijada al inicio del muro.':'Duda desfijada.');try{await updateDoc(doc(db,'help_posts',d.id),{pinned:h.pinned})}catch{}}),
helplock:d=>T(async()=>{const h=(S.helps||[]).find(x=>x.id===d.id);if(!h)return;h.locked=!h.locked;render();toast(h.locked?'Discusión cerrada para nuevas respuestas.':'Discusión reabierta.');try{await updateDoc(doc(db,'help_posts',d.id),{locked:h.locked})}catch{}}),
ratemodal:d=>{const m=U(d.id),myR=S.rats.find(x=>x.mentor===d.id&&x.student===S.me.id),curVal=myR?myR.value:0;modal(`<h2>⭐ Calificar a ${esc(m.name)}</h2><p class=sub>Califica de 1 a 10 estrellas el apoyo brindado por este mentor:</p><form data-f=rateform data-id="${d.id}"><div style="text-align:center;margin:16px 0"><div id=rate-display style="font-size:22px;font-weight:700;color:#b45309;margin-bottom:12px">${curVal>0?`⭐ ${curVal} de 10 estrellas`:'Selecciona de 1 a 10 estrellas'}</div><div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:440px;margin:0 auto">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<label style="cursor:pointer;background:${n===curVal?'#fef3c7':'#f8fafc'};border:1.5px solid ${n===curVal?'#f59e0b':'#cbd5e1'};border-radius:10px;padding:8px 12px;display:inline-flex;align-items:center;gap:4px;font-weight:700;color:${n===curVal?'#92400e':'#334155'};transition:all .15s"><input type=radio name=val value="${n}" ${n===curVal?'checked':''} style="width:auto;margin:0" onchange="document.getElementById('rate-display').innerHTML='⭐ '+this.value+' de 10 estrellas'"><span style="color:#f59e0b">★</span> ${n}</label>`).join('')}</div></div><div class=row style="margin-top:16px;justify-content:center"><button class="btn p" style="padding:9px 24px;font-weight:700">💾 Guardar calificación</button><button type=button class=btn data-a=close>Cancelar</button></div></form>`)},mview:d=>modal(mprofile(U(d.id))),
mreq:d=>{
  const m=U(d.id),cs=m.courses||[];
  const courseOptions=cs.length
    ?`<label><b>📚 Selecciona el curso que domina el mentor:</b></label><select name=course style="margin-bottom:12px">${cs.map(c=>`<option value="${esc(c)}">📘 ${esc(c)}</option>`).join('')}<option value="Consulta sobre otra materia">Otra consulta / Materia afín</option></select>`
    :`<label><b>📚 Curso o tema de consulta:</b></label><input name=course placeholder="Indica el curso o materia que deseas aprender" value="${esc(m.specialty||'')}" required style="margin-bottom:12px">`;
  modal(`<h2>📩 Mandar solicitud a ${esc(m.name)}</h2>
  <p class=sub>${esc(m.specialty||'Mentor')} · 🕒 Disponibilidad: ${esc(availTxt(m))}</p>
  <form data-f=req data-id=${d.id}>
   ${courseOptions}
   <label><b>❓ Escribe tu duda o lo que necesitas consultar:</b></label>
   <textarea name=message rows=3 placeholder="Describe qué dudas tienes, qué temas necesitas reforzar o tus consultas académicas…" required></textarea>
   <div style="background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;padding:10px 14px;border-radius:10px;margin:12px 0;font-size:12.5px;line-height:1.4">
    📌 <b>Información:</b> El mentor recibirá tu solicitud y fijará la fecha y hora de la clase.
   </div>
   <div class=row style="margin-top:14px;gap:8px">
    <button class="btn p">📩 Mandar solicitud</button>
    <button type=button class=btn data-a=close>Cancelar</button>
   </div>
  </form>`);
},
modtime:d=>{
  if(S.me.role!=='mentor'&&S.me.role!=='admin'){
    return toast('Solo el mentor puede modificar la fecha y hora de la clase.',1);
  }
  const r=S.reqs.find(x=>x.id===d.id);
  if(!r)return;
  const other=U(r.student);
  const curDate=(r.date&&/^\d{4}-\d{2}-\d{2}$/.test(r.date))?r.date:new Date().toISOString().slice(0,10);
  const curTime=(r.time&&/^\d{1,2}:\d{2}$/.test(r.time))?r.time:'19:00';
  modal(`<h2>📅 Modificar fecha y hora de la clase</h2>
  <p class=sub>Clase con <b>${esc(other.name)}</b> (${S.me.id===r.mentor?'Estudiante':'Mentor'}) · Materia: <b>${esc(r.specialty||'Clase')}</b></p>
  <form data-f=modtime data-id="${d.id}">
    <div class="grid g2" style="gap:10px">
      <div><label><b>📅 Nueva fecha:</b></label><input name=date type=date value="${curDate}" min="${new Date().toISOString().slice(0,10)}" required></div>
      <div><label><b>⏰ Nueva hora:</b></label><input name=time type=time value="${curTime}" required></div>
    </div>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;padding:10px 14px;border-radius:10px;margin:12px 0;font-size:12.5px;line-height:1.4">
      ℹ️ Al guardar, se actualizará el horario inmediatamente para el estudiante y el docente mentor.
    </div>
    <div class=row style="margin-top:14px;gap:8px">
      <button class="btn p">💾 Guardar nuevo horario</button>
      <button type=button class=btn data-a=close>Cancelar</button>
    </div>
  </form>`);
},
acc:d=>{
  const r=S.reqs.find(x=>x.id===d.id);if(!r)return;
  const s=U(r.student);
  const now=new Date();
  const defDate=new Date(now.getTime()+86400000).toISOString().slice(0,10);
  modal(`<h2>📅 Aceptar solicitud y fijar horario</h2>
  <p class=sub>Define la fecha y hora de la clase para el estudiante <b>${esc(s.name)}</b>.</p>
  <form data-f=acc_mentor data-id=${d.id}>
   <div class=card style="background:#f8fafc;padding:12px;margin-bottom:12px;border:1px solid #e2e8f0">
    <p style="margin:0 0 4px;font-size:13px"><b>📚 Materia solicitada:</b> ${esc(r.specialty||'Asesoría general')}</p>
    <p style="margin:0 0 4px;font-size:13px"><b>🎓 Estudiante:</b> ${esc(s.name)} ${s.career?`(${esc(s.career)} · ${esc(s.level||'')})`:''}</p>
    <p style="margin:0;font-size:13px"><b>❓ Consulta del estudiante:</b> ${esc(r.message||'Sin mensaje')}</p>
   </div>
   <div class="grid g2" style="gap:10px">
    <div><label><b>📅 Fecha de la clase</b></label><input name=date type=date value="${defDate}" min="${new Date().toISOString().slice(0,10)}" required></div>
    <div><label><b>⏰ Hora de la clase</b></label><input name=time type=time value="19:00" required></div>
   </div>
   <label style="margin-top:10px"><b>🎥 Enlace de Google Meet (opcional)</b></label>
   <input name=meetLink placeholder="https://meet.google.com/..." value="${esc(r.meetLink||'')}">
   <small class=sub style="display:block;margin-top:-4px">💡 Puedes generar una reunión en <a href="https://meet.google.com/new" target=_blank rel=noopener>Google Meet</a> y pegar el link aquí.</small>
   <div class=row style="margin-top:16px;gap:8px">
    <button class="btn g">✔ Aceptar y fijar horario</button>
    <button type=button class=btn data-a=close>Cancelar</button>
   </div>
  </form>`);
},
rej:d=>T(async()=>{const r=S.reqs.find(x=>x.id===d.id);if(r)r.status='RECHAZADA';refresh();await updateDoc(doc(db,'requests',d.id),{status:'RECHAZADA'});await notify(r.student,`${S.me.name} rechazó tu solicitud de mentoría.`);toast('Solicitud rechazada.')}),
ses:d=>T(async()=>{if(d.s==='Finalizada')return A.finishclass(d);const r=S.reqs.find(x=>x.id===d.id);if(r){r.sesion=d.s}refresh();await updateDoc(doc(db,'requests',d.id),{sesion:d.s});toast('Sesión '+d.s.toLowerCase()+'.')}),
open:d=>{S.replyHelp=null;S.chat=d.id;markChatAsRead(d.id);render();$('#msgs').scrollTop=1e9},cm:d=>{S.cm+=+d.d;render()},
readall:()=>T(async()=>{for(const n of S.notifs.filter(n=>!n.read)){n.read=true;await updateDoc(doc(db,'notifications',n.id),{read:true})}refresh()}),
reset:()=>T(async()=>{await sendPasswordResetEmail(auth,S.me.email);toast('Te enviamos un correo para restablecer tu contraseña.')}),
uedit:d=>modal(pview(U(d.id))+`<div class=row style="margin-top:14px"><button class="btn p" data-a=aedit data-id=${d.id}>Editar</button><button class=btn data-a=close>Cerrar</button></div>`),aedit:d=>modal(pform(U(d.id),1)),pedit:()=>modal(pform(S.me)),pviewx:d=>modal(mprofile(U(d.id))),
msg:d=>{if(!userExists(d.id))return toast('Este usuario no existe o fue eliminado.',1);S.replyHelp=null;if((S.me.hiddenChats||{})[d.id])updateDoc(doc(db,'users',S.me.id),{['hiddenChats.'+d.id]:deleteField()});S.chat=d.id;S.view='chat';close();markChatAsRead(d.id);render();setTimeout(()=>{$('#msgs')&&($('#msgs').scrollTop=1e9)},30)},
helpchat:d=>{if(!userExists(d.id))return toast('Este usuario no existe o fue eliminado.',1);const h=(S.helps||[]).find(x=>x.id===d.hid);if(h){S.replyHelp={id:h.id,title:h.title,desc:h.description,authorName:h.authorName||U(h.authorId).name}}else{S.replyHelp=null}if((S.me.hiddenChats||{})[d.id])updateDoc(doc(db,'users',S.me.id),{['hiddenChats.'+d.id]:deleteField()});S.chat=d.id;S.view='chat';close();markChatAsRead(d.id);render();setTimeout(()=>{$('#msgs')&&($('#msgs').scrollTop=1e9);const inp=document.querySelector('.chat-input');if(inp)inp.focus()},50)},
cancelhelpreply:()=>{S.replyHelp=null;render()},
msgdel:d=>{if(!confirm('¿Eliminar este mensaje?'))return;const mid=d.id;S.msgs=S.msgs.filter(m=>m.id!==mid);if($('#msgs'))$('#msgs').innerHTML=msgsHtml();toast('Mensaje eliminado.');T(async()=>{await deleteDoc(doc(db,'messages',mid))})},
chatclear:()=>{if(!S.chat)return;const o=U(S.chat),cId=cid(S.me.id,S.chat),ms=S.msgs.filter(m=>m.chatId===cId);if(!ms.length)return toast('Esta conversación no tiene mensajes para borrar.');if(!confirm(`¿Borrar todos los mensajes con ${o.name}?\n\nEl contacto NO se eliminará de tu lista, solo se borrarán los mensajes.`))return;S.msgs=S.msgs.filter(m=>m.chatId!==cId);if($('#msgs'))$('#msgs').innerHTML=msgsHtml();const cl=document.querySelector('.chat-list');if(cl)cl.innerHTML=ctsHtml();toast('Mensajes eliminados. El contacto permanece en tu lista.');T(async()=>{for(const m of ms){try{await deleteDoc(doc(db,'messages',m.id))}catch{}}try{await updateDoc(doc(db,'chats',cId),{count:0})}catch{}})},
filecancel:()=>{const fi=document.querySelector('form[data-f=msg] input[type=file]');if(fi)fi.value='';const pill=$('#file-preview');if(pill)pill.classList.remove('on')},
cbackchat:()=>{S.chat=null;render()},
cdel:()=>{if(!S.chat||!confirm('¿Eliminar este contacto de tu lista? Reaparecerá si te escribe de nuevo.'))return;const id=S.chat;T(async()=>{await updateDoc(doc(db,'users',S.me.id),{['hiddenChats.'+id]:Date.now()});S.chat=null;render();toast('Contacto eliminado de tu lista.')})},
idel:d=>upd(S.me.id,{[d.k]:(S.me[d.k]||[]).filter((_,i)=>i!==+d.i)}),
aacc:d=>T(async()=>{const r=S.reqs.find(x=>x.id===d.id);if(r){r.status='ACEPTADA';r.sesion='Confirmada'}refresh();await updateDoc(doc(db,'requests',d.id),{status:'ACEPTADA',sesion:'Confirmada'});await updateDoc(doc(db,'users',r.mentor),{studentsCount:increment(1)});await notify(r.student,'Tu solicitud de mentoría fue aceptada.');await notify(r.mentor,'Se aceptó una solicitud de mentoría.');toast('Solicitud aceptada.')}),
arej:d=>T(async()=>{const r=S.reqs.find(x=>x.id===d.id);if(r)r.status='RECHAZADA';refresh();await updateDoc(doc(db,'requests',d.id),{status:'RECHAZADA'});await notify(r.student,'Tu solicitud de mentoría fue rechazada.');toast('Solicitud rechazada.')}),
uadd:d=>modal(`<h2>Agregar ${d.r==='mentor'?'mentor':'estudiante'}</h2><form data-f=uadd data-r=${d.r}>${field('name','Nombre completo')}${field('email','Correo','','email')}${field('pass','Contraseña temporal (mín. 6)','','password')}${d.r==='mentor'?field('specialty','Especialidad'):field('career','Carrera')}<div class=row><button class="btn p">Crear usuario</button><button type=button class=btn data-a=close>Cancelar</button></div></form>`),
mnew:()=>{const st=S.users.filter(u=>u.role==='student'&&u.active!==false),mt=mentors(),op=l=>l.map(u=>`<option value=${u.id}>${esc(u.name)}</option>`).join('');if(!st.length||!mt.length)return toast('Necesitas al menos un estudiante y un mentor activos.',1);modal(`<h2>Programar mentoría</h2><form data-f=mnew><label>Estudiante</label><select name=student>${op(st)}</select><label>Mentor</label><select name=mentor>${op(mt)}</select>${field('specialty','Especialidad (opcional)')}${field('date','Fecha','','date')}${field('time','Hora','','time')}<label>Estado</label><select name=sesion><option>Confirmada</option><option>Pendiente</option></select><div class=row><button class="btn p">Programar</button><button type=button class=btn data-a=close>Cancelar</button></div></form>`)},
ublockdel:d=>{const u=U(d.id);if(d.id===S.me.id)return toast('No puedes eliminarte a ti misma.',1);if(!confirm(`¿Borrar definitivamente a ${u.name} (${u.email})?\n\nEsta persona ya no podrá ingresar a la página y el sistema le indicará «Este usuario no existe». Sus datos y publicaciones del muro serán eliminados.`))return;const id=d.id;delUsers.add(id);try{localStorage.setItem('del_users',JSON.stringify([...delUsers]))}catch{}const userHelps=(S.helps||[]).filter(h=>h.authorId===id);for(const h of userHelps)delHelps.add(h.id);try{localStorage.setItem('del_helps',JSON.stringify([...delHelps]))}catch{}S.helps=(S.helps||[]).filter(h=>h.authorId!==id);S.users=S.users.filter(x=>x.id!==id);S.tombs=[{id,name:u.name||'',email:u.email||'',role:u.role||'',reason:'Borrado definitivamente',ts:Date.now(),by:S.me.id},...S.tombs.filter(x=>x.id!==id)];refresh();toast(`Usuario ${u.name} borrado definitivamente.`);T(async()=>{await setDoc(doc(db,'deletedUsers',id),{name:u.name||'',email:u.email||'',role:u.role||'',reason:'Borrado definitivamente',ts:Date.now(),by:S.me.id});for(const h of userHelps){try{await deleteDoc(doc(db,'help_posts',h.id))}catch{}}for(const r of S.reqs.filter(r=>(r.members||[]).includes(id))){try{await deleteDoc(doc(db,'requests',r.id))}catch{}}for(const g of S.grades.filter(g=>g.student===id||g.mentor===id)){try{await deleteDoc(doc(db,'grades',g.id))}catch{}}try{await updateDoc(doc(db,'users',id),{active:false,deleted:true,inactiveReason:'Usuario eliminado'})}catch{}await deleteDoc(doc(db,'users',id))})},
sestab:d=>{S.sesTab=d.v;render()},htab:d=>{S.helpTab=d.v;render()},hcat:d=>{S.helpCat=d.v;render()},
helpnew:()=>modal(`<h2>🤝 Publicar duda o pedir ayuda</h2><p class=sub>Comparte tu consulta con la comunidad de estudiantes y mentores.</p><form data-f=helpnew><label>Título de tu consulta</label><input name=title placeholder="Ej. ¿Cómo resolver integrales por partes?" required><label>Área académica</label><select name=cat>${HELP_CATS.filter(x=>x!=='Todas').map(c=>`<option>${c}</option>`).join('')}</select><label>Detalla tu duda</label><textarea name=desc rows=4 placeholder="Explica qué necesitas resolver o qué estás aprendiendo…" required></textarea><div class=row><button class="btn p">Publicar en el muro</button><button type=button class=btn data-a=close>Cancelar</button></div></form>`),
helprep:d=>modal(`<h2>💬 Responder en el muro</h2><form data-f=helprep data-id=${d.id}><label>Tu respuesta o consejo de ayuda</label><textarea name=text rows=4 placeholder="Escribe tu recomendación académica…" required></textarea><div class=row><button class="btn p">Enviar respuesta</button><button type=button class=btn data-a=close>Cancelar</button></div></form>`),
helpsolve:d=>T(async()=>{const h=(S.helps||[]).find(x=>x.id===d.id);if(!h)return;h.solved=!h.solved;render();toast(h.solved?'Duda marcada como resuelta.':'Duda reabierta.');try{await updateDoc(doc(db,'help_posts',d.id),{solved:h.solved})}catch{}}),
helpdel:d=>{if(!confirm('¿Eliminar esta duda del muro?'))return;delHelps.add(d.id);try{localStorage.setItem('del_helps',JSON.stringify([...delHelps]))}catch{}S.helps=(S.helps||[]).filter(x=>x.id!==d.id);render();toast('Publicación eliminada correctamente.');T(async()=>{try{await deleteDoc(doc(db,'help_posts',d.id))}catch{}});},
helprepdel:d=>{if(!confirm('¿Eliminar esta respuesta de apoyo?'))return;const h=helpList().find(x=>x.id===d.hid)||(S.helps||[]).find(x=>x.id===d.hid);if(h){h.replies=(h.replies||[]).filter(r=>r.id!==d.rid);render();toast('Respuesta eliminada.');T(async()=>{try{await updateDoc(doc(db,'help_posts',d.hid),{replies:h.replies})}catch{}});}},
utog:d=>{const u=S.users.find(x=>x.id===d.id);if(!u)return toast('Usuario no encontrado.',1);if(u.active===false){if(confirm(`¿Deseas reactivar la cuenta de ${u.name}? Podrá ingresar normalmente a MentorApp.`)){u.active=true;delete u.inactiveReason;refresh();toast(`Cuenta de ${u.name} reactivada exitosamente.`);T(async()=>{await updateDoc(doc(db,'users',d.id),{active:true,inactiveReason:deleteField()})})}return;}modal(`<h2>Suspender a ${esc(u.name)}</h2><p class=sub>Verá «Esta página no está disponible» hasta que lo reactives.</p><form data-f=susp data-id=${d.id}><label>Motivo (lo verá la persona)</label><input name=reason placeholder="Ej. Incumplimiento de normas" required><div class=row><button class="btn d">Suspender</button><button type=button class=btn data-a=close>Cancelar</button></div></form>`)},
udel:d=>{const u=U(d.id);modal(`<h2>Eliminar a ${esc(u.name)}</h2><p class=sub>Perderá el acceso y verá «Esta página no está disponible». Podrás restaurar su cuenta desde «Eliminados».</p><form data-f=udel data-id=${d.id}><label>Motivo (lo verá la persona)</label><input name=reason placeholder="Opcional"><label class=row style="font-weight:400"><input type=checkbox name=cascade style="width:auto;margin:0" checked> Borrar también sus solicitudes y calificaciones (no se recuperan al restaurar)</label><div class=row style="margin-top:8px"><button class="btn d">Eliminar usuario</button><button type=button class=btn data-a=close>Cancelar</button></div></form>`)},
rdel:d=>{if(confirm('¿Eliminar esta sesión / solicitud definitivamente?')){S.reqs=S.reqs.filter(r=>r.id!==d.id);render();toast('Sesión eliminada de inmediato.');T(()=>deleteDoc(doc(db,'requests',d.id)))}},
urole:d=>{const u=U(d.id),n=u.role==='mentor'?'student':'mentor';if(confirm(`¿Cambiar a ${u.name} de ${u.role==='mentor'?'Mentor a Estudiante':'Estudiante a Mentor'}?`))upd(d.id,{role:n})},
uver:d=>{const u=U(d.id);u.verified=!u.verified;render();T(async()=>{try{await updateDoc(doc(db,'users',d.id),{verified:u.verified})}catch{}await notify(d.id,u.verified?'✔ ¡El administrador verificó tu perfil de mentor!':'El administrador quitó la verificación de tu perfil.');toast(u.verified?'Mentor verificado.':'Verificación quitada.')})},
upass:d=>{const u=U(d.id);if(u.email&&confirm('¿Enviar a '+u.email+' un correo para restablecer su contraseña?'))T(async()=>{await sendPasswordResetEmail(auth,u.email);toast('Correo enviado a '+u.email+'.')})},
chatdel:d=>{if(!confirm('¿Eliminar esta conexión de mensajes?'))return;S.chats=S.chats.filter(c=>c.id!==d.id);render();toast('Conexión eliminada.');T(async()=>{try{await deleteDoc(doc(db,'chats',d.id))}catch{}});},
urest:d=>{const t=S.tombs.find(x=>x.id===d.id);if(!t)return;const x={...t.data,active:true};delete x.inactiveReason;delUsers.delete(d.id);try{localStorage.setItem('del_users',JSON.stringify([...delUsers]))}catch{}S.users=[...S.users.filter(u=>u.id!==d.id),{id:d.id,...x}];S.tombs=S.tombs.filter(u=>u.id!==d.id);render();toast('Cuenta restaurada: '+t.name+' ya puede entrar.');T(async()=>{try{await setDoc(doc(db,'users',d.id),x);await deleteDoc(doc(db,'deletedUsers',d.id))}catch{}})},
tpurge:d=>{const t=S.tombs.find(x=>x.id===d.id);if(!confirm(`¿Eliminar definitivamente a ${t?.name||'este usuario'}? No se podrá recuperar.`))return;delUsers.add(d.id);try{localStorage.setItem('del_users',JSON.stringify([...delUsers]))}catch{}S.tombs=S.tombs.filter(x=>x.id!==d.id);render();toast('Usuario eliminado definitivamente.');T(async()=>{await deleteDoc(doc(db,'deletedUsers',d.id))})},
tclear:()=>{if(!confirm('¿Vaciar toda la papelera y eliminar definitivamente a todos los usuarios eliminados?'))return;const ids=S.tombs.map(x=>x.id);S.tombs=[];render();toast('Papelera vaciada.');T(async()=>{for(const id of ids)await deleteDoc(doc(db,'deletedUsers',id))})},
back:()=>{BL=null;render()},eye:(d,b)=>{const i=b.parentElement.querySelector('input');i.type=i.type==='password'?'text':'password'},cback:()=>{S.choose=null;signOut(auth)},disann:()=>{S.dis=S.site.announceTs;render()},
maint:()=>{const msg=($('#mmsg')?.value||'').trim(),on=!S.site.maintenance;if(on&&!confirm('Estudiantes y mentores no podrán usar la página hasta que la reabras. ¿Continuar?'))return;S.site.maintenance=on;S.site.message=msg;refresh();T(async()=>{await setDoc(doc(db,'settings','site'),{maintenance:on,message:msg},{merge:true});toast(on?'Página en mantenimiento.':'Página disponible de nuevo.')})},
annoff:()=>{S.site.announce='';refresh();T(async()=>{await setDoc(doc(db,'settings','site'),{announce:'',announceTs:Date.now()},{merge:true});toast('Aviso retirado.')})},
seed:async()=>{
  const demoUsers=[
    {name:'Ing. Carlos Mendoza',email:'carlos.mendoza@mentorapp.com',role:'mentor',specialty:'Desarrollo Web & Cloud',career:'',institution:'Tech Solutions',faculty:'Ingeniería de Software',experience:6,bio:'Especialista en arquitecturas web modernas, JavaScript, Python y AWS. Apasionado por guiar nuevos talentos.',skills:['JavaScript','React','Node.js','AWS','Python'],courses:['Desarrollo Web Full Stack','Bases de Datos'],whatsapp:'51987654321',photo:'avatars/MENT.png',verified:true,active:true,availability:[{d:'Lunes',a:'18:00',b:'21:00'},{d:'Miércoles',a:'18:00',b:'21:00'},{d:'Viernes',a:'18:00',b:'21:00'}],studentsCount:12},
    {name:'Dra. Laura Vega',email:'laura.vega@mentorapp.com',role:'mentor',specialty:'Ciencia de Datos & IA',career:'',institution:'DataLab Institute',faculty:'Ciencias de la Computación',experience:8,bio:'Científica de datos con maestría en Inteligencia Artificial. Asesoro en machine learning, estadística y visualización.',skills:['Python','Machine Learning','Pandas','SQL','Power BI'],courses:['Análisis de Datos con Python','Inteligencia Artificial'],whatsapp:'51981234567',photo:'avatars/M.png',verified:true,active:true,availability:[{d:'Martes',a:'17:00',b:'20:00'},{d:'Jueves',a:'17:00',b:'20:00'}],studentsCount:9},
    {name:'Ing. Jorge Ramirez',email:'jorge.ramirez@mentorapp.com',role:'mentor',specialty:'Bases de Datos & Cloud Computing',career:'',institution:'CloudTech Systems',faculty:'Ingeniería de Software',experience:6,bio:'Especialista en bases de datos relacionales y no relacionales, optimización de queries y despliegues cloud.',skills:['SQL','PostgreSQL','MongoDB','Docker','DevOps'],courses:['Bases de Datos Avanzadas','Modelamiento SQL & NoSQL'],whatsapp:'51976543210',photo:'avatars/MENT.png',verified:true,active:true,availability:[{d:'Lunes',a:'19:00',b:'22:00'},{d:'Jueves',a:'19:00',b:'22:00'}],studentsCount:7},
    {name:'Mg. Valentina Flores',email:'valentina.flores@mentorapp.com',role:'mentor',specialty:'Diseño UI/UX & Producto',career:'',institution:'Design Hub',faculty:'Arte y Diseño Digital',experience:4,bio:'Diseñadora de interfaces y experiencia de usuario. Te ayudo con portafolios, Figma, prototipado y pruebas con usuarios.',skills:['Figma','UI Design','UX Research','Prototipado','Design Systems'],courses:['Diseño de Interfaces en Figma','Investigación de Usuarios'],whatsapp:'51965432109',photo:'avatars/MENTORI.jpg',verified:true,active:true,availability:[{d:'Miércoles',a:'16:00',b:'19:00'},{d:'Sábado',a:'10:00',b:'13:00'}],studentsCount:15},
    {name:'Ing. Ana Castillo',email:'ana.castillo@mentorapp.com',role:'mentor',specialty:'Ciberseguridad & Redes',career:'',institution:'CyberSecurity Labs',faculty:'Ingeniería de Sistemas y Redes',experience:7,bio:'Especialista en seguridad informática, ethical hacking, seguridad de redes y protocolos de comunicación.',skills:['Ciberseguridad','Ethical Hacking','Linux','Cisco','Firewalls'],courses:['Seguridad de la Información','Redes y Comunicaciones'],whatsapp:'51954321098',photo:'avatars/M.png',verified:true,active:true,availability:[{d:'Viernes',a:'16:00',b:'19:00'},{d:'Sábado',a:'09:00',b:'12:00'}],studentsCount:8},
    {name:'Mateo Morales',email:'mateo.morales@estudiante.com',role:'student',career:'Ingeniería de Sistemas',level:'7mo ciclo',institution:'Universidad Nacional',faculty:'Ingeniería',skills:['JavaScript','HTML','CSS'],interests:['Desarrollo Web','Cloud Computing'],bio:'Estudiante enfocado en convertirme en desarrollador frontend.',photo:'avatars/V.png',active:true,studentsCount:0},
    {name:'Sofia Alarcon',email:'sofia.alarcon@estudiante.com',role:'student',career:'Ingeniería de Software',level:'5to ciclo',institution:'Universidad Nacional',faculty:'Ingeniería y Computación',skills:['Python','SQL','Git'],interests:['Inteligencia Artificial','Bases de Datos'],bio:'Estudiante interesada en análisis de datos, modelos de machine learning y backend.',photo:'avatars/MENTORI.jpg',active:true,studentsCount:0}
  ];
  for(const u of demoUsers){
    const id='demo_'+u.name.toLowerCase().replace(/[^a-z0-9]/g,'_');
    const full={id,...u,created:Date.now()-Math.floor(Math.random()*1e7)};
    S.users=[...S.users.filter(x=>x.id!==id),full];
    try{await setDoc(doc(db,'users',id),full)}catch(e){}
  }
  refresh();
  toast('¡Datos de mentores y estudiantes cargados exitosamente!');
},
csvu:()=>csv('usuarios.csv',[['Nombre','Correo','Rol','Estado','Verificado','Especialidad/Carrera','Registro'],...S.users.map(u=>[u.name,u.email,u.role,u.active===false?'Suspendido':'Activo',u.verified?'Sí':'No',u.specialty||u.career||'',u.created?new Date(u.created).toISOString().slice(0,10):''])]),
csvr:()=>csv('solicitudes.csv',[['Estudiante','Mentor','Especialidad','Fecha','Hora','Estado','Sesión'],...S.reqs.map(r=>[U(r.student).name,U(r.mentor).name,r.specialty,r.date,r.time,r.status,r.sesion||''])])};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;if(b.tagName==='A'&&b.getAttribute('href')==='#')e.preventDefault();A[b.dataset.a]?.(b.dataset,b)});
document.addEventListener('input',e=>{const k=e.target.dataset.in;if(k==='mq'){S.q=e.target.value;$('#list').innerHTML=mlist()}else if(k==='pq'){S.q=e.target.value;$('#list').innerHTML=plist()}else if(k==='sq'){S.q=e.target.value;$('#list').innerHTML=peopleTable(plain(S.view==='mentors'?'mentor':'student'))}else if(k==='photourl'){const prev=$('#ph_preview');if(prev)prev.src=cleanPhotoUrl(e.target.value)||'avatars/MENT.png'}else if(k==='coverurl'){const val=cleanPhotoUrl(e.target.value);const cp=$('#cover_modal_preview')||$('#cover_preview');if(cp){if(val){cp.src=val;cp.style.display='block'}else{cp.style.display='none'}}const ph=$('#cover_modal_placeholder');if(ph)ph.style.display=val?'none':'block';const ptxt=$('#cover_ph_txt');if(ptxt)ptxt.style.display=val?'none':'block'}});
document.addEventListener('change',e=>{const k=e.target.dataset.in,v=e.target.value,id=e.target.dataset.id;
 if(k==='rolechoice'){const b=document.querySelector('#authbox .gbtn b');if(b)b.textContent=`Registrarme con Google como ${v==='mentor'?'Mentor':'Estudiante'}`}
 else if(k==='fd'){S.fd=v;$('#list').innerHTML=mlist()}else if(k==='fe'){S.fe=v;$('#list').innerHTML=mlist()}
 else if(k==='file'){const fl=e.target.files[0],pill=$('#file-preview'),n=$('#file-preview-name');if(fl){if(n)n.textContent='📎 '+fl.name+' ('+Math.round(fl.size/1024)+' KB)';if(pill)pill.classList.add('on')}else{if(pill)pill.classList.remove('on')}}
 else if(k==='photofile'){const fl=e.target.files[0];if(!fl)return;const fr=new FileReader();fr.onload=()=>{const img=new Image();img.onload=()=>{const maxD=400,k=Math.min(1,maxD/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);const d=c.toDataURL('image/jpeg',.85);const ph=$('#ph');if(ph)ph.value=d;const prev=$('#ph_preview');if(prev)prev.src=d;toast('¡Foto cargada! Pulsa «Guardar cambios» para aplicar.');};img.src=fr.result};fr.readAsDataURL(fl)}
 else if(k==='coverfile'){const fl=e.target.files[0];if(!fl)return;const fr=new FileReader();fr.onload=()=>{const img=new Image();img.onload=()=>{const maxW=1200,maxH=500,k=Math.min(1,maxW/img.width,maxH/img.height);const c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);const d=c.toDataURL('image/jpeg',.82);const cIn=$('#cover_in');if(cIn)cIn.value=d;const cp=$('#cover_modal_preview')||$('#cover_preview');if(cp){cp.src=d;cp.style.display='block'}const ph=$('#cover_modal_placeholder');if(ph)ph.style.display='none';const ptxt=$('#cover_ph_txt');if(ptxt)ptxt.style.display='none';toast('¡Foto de portada cargada! Pulsa «Guardar» para aplicar.');};img.src=fr.result};fr.readAsDataURL(fl)}
 else if(k==='schedmode'){
  const ind=$('#sched_ind_wrap'),grp=$('#sched_grp_wrap');
  if(ind&&grp){
   if(v==='grp'){ind.style.display='none';grp.style.display='block'}
   else{ind.style.display='block';grp.style.display='none'}
  }
 }
 else if(k==='sesfilter'){S.sesStatus=v;$('#ses-wrap')&&($('#ses-wrap').innerHTML=sesListHtml())}
 else if(k==='ases')T(async()=>{await updateDoc(doc(db,'requests',id),{sesion:v});toast('Estado actualizado.')});
 else if(k==='rate'&&v)T(async()=>{const r=S.reqs.find(x=>x.id===id);await setDoc(doc(db,'ratings',id),{mentor:r.mentor,student:S.me.id,value:+v});toast('¡Gracias por calificar!')})});
document.addEventListener('submit',async e=>{e.preventDefault();const f=e.target,k=f.dataset.f,v=Object.fromEntries(new FormData(f));const em=/^[^\s@]+@[^\s@]+\.[^\s@]+$/,bad=m=>toast(m,1);
 if(k==='sched_meet'){
  const sbtn=f.querySelector('button[type=submit], button.p');
  const releaseBtn=()=>{if(sbtn){sbtn.disabled=false;sbtn.textContent='Guardar y programar clase';}};
  const mode=v.sched_mode||'ind';
  const topic=(v.topic||S.me.specialty||'Asesoría en Meet').trim();
  const date=v.date,time=v.time;
  if(!date||!time)return bad('Debes indicar la fecha y hora de la clase.');
  if(date<new Date().toISOString().slice(0,10))return bad('La fecha no puede estar en el pasado.');
  const ml=(v.meetLink||'').trim();
  if(ml&&!/^https:\/\//.test(ml))return bad('El enlace de Meet debe comenzar con https://');
  if(sbtn){sbtn.disabled=true;sbtn.textContent='Guardando clase…';setTimeout(releaseBtn,4000);}
  if(mode==='grp'){
   const checked=f.querySelectorAll('[name=group_students]:checked');
   const sids=Array.from(checked).map(c=>c.value);
   if(!sids.length)return bad('Debes seleccionar al menos un estudiante para la clase grupal.');
   T(async()=>{
    const docData={
     mentor:S.me.id,
     isGroup:true,
     specialty:topic,
     date,time,
     meetLink:ml,
     message:(v.message||'Clase grupal por Google Meet').trim(),
     status:'ACEPTADA',
     sesion:'Confirmada',
     students:sids,
     student:sids[0],
     members:[...sids,S.me.id],
     created:Date.now()
    };
    const docRef=await addDoc(collection(db,'requests'),docData);
    S.reqs=[{id:docRef.id,...docData},...S.reqs.filter(x=>x.id!==docRef.id)];
    refresh();
    for(const sid of sids){
     await notify(sid,`📅 ${S.me.name} programó una clase grupal por Meet: «${topic}» para el ${fdate(date)} a las ${time}.${ml?' ¡Prepárate para unirte!':''}`);
    }
    close();
    toast(`¡Clase grupal programada con éxito para ${sids.length} estudiante(s)!`);
   });
  }else{
   const sid=v.student;
   if(!sid)return bad('Selecciona un estudiante.');
   T(async()=>{
    const docData={
     mentor:S.me.id,
     student:sid,
     isGroup:false,
     specialty:topic,
     date,time,
     meetLink:ml,
     message:(v.message||'Clase individual por Google Meet').trim(),
     status:'ACEPTADA',
     sesion:'Confirmada',
     students:[sid],
     members:[sid,S.me.id],
     created:Date.now()
    };
    const docRef=await addDoc(collection(db,'requests'),docData);
    S.reqs=[{id:docRef.id,...docData},...S.reqs.filter(x=>x.id!==docRef.id)];
    refresh();
    await notify(sid,`📅 ${S.me.name} programó tu clase por Meet: «${topic}» para el ${fdate(date)} a las ${time}.${ml?' ¡Ya puedes unirte!':''}`);
    close();
    toast('¡Clase individual programada exitosamente!');
   });
  }
 }
 else if(k==='login'){const email=(v.email||'').trim();if(!email||!v.pass)return bad('Debes completar todos los campos.');if(!em.test(email))return bad('El correo electrónico no es válido.');
  let existsInDb=null;try{let qs=await getDocs(query(collection(db,'users'),where('email','==',email)));if(qs.empty&&email!==email.toLowerCase()){qs=await getDocs(query(collection(db,'users'),where('email','==',email.toLowerCase())))}existsInDb=!qs.empty}catch{}
  if(existsInDb===false){if($('#authbox')){$('#authbox').innerHTML=authForm('reg');const emIn=document.querySelector('#authbox form[data-f=reg] input[name=email]');if(emIn)emIn.value=email}return toast('Este correo no está registrado en MentorApp. ¡Crea tu cuenta gratis aquí!',1)}
  try{await signInWithEmailAndPassword(auth,email,v.pass)}catch(err){const code=err.code||'';
   if(existsInDb===true||code==='auth/wrong-password')return bad('Contraseña incorrecta. Por favor verifica tu contraseña o pulsa «¿Olvidaste tu contraseña?».');
   if(code==='auth/user-not-found'){if($('#authbox')){$('#authbox').innerHTML=authForm('reg');const emIn=document.querySelector('#authbox form[data-f=reg] input[name=email]');if(emIn)emIn.value=email}return toast('Este correo no está registrado en MentorApp. ¡Crea tu cuenta gratis aquí!',1)}
   if(code==='auth/invalid-credential'){try{const methods=await fetchSignInMethodsForEmail(auth,email);if(methods&&methods.length>0){if(methods.includes('google.com')&&!methods.includes('password'))return bad('Esta cuenta fue registrada con Google. Inicia sesión con el botón «Entrar con Google».');return bad('Contraseña incorrecta. Por favor verifica tu contraseña o pulsa «¿Olvidaste tu contraseña?».')}else{if($('#authbox')){$('#authbox').innerHTML=authForm('reg');const emIn=document.querySelector('#authbox form[data-f=reg] input[name=email]');if(emIn)emIn.value=email}return toast('Este correo no está registrado en MentorApp. ¡Crea tu cuenta gratis aquí!',1)}}catch{return bad('Contraseña incorrecta o correo no registrado. Si no tienes cuenta, pulsa «Crear cuenta».')}}
   toast(ERR[code]||ERR[err.message]||'Error: '+(code||err.message),1)}}
 else if(k==='reg'){if(!v.name.trim()||!v.email||!v.pass)return bad('Debes completar todos los campos.');if(!em.test(v.email))return bad('El correo electrónico no es válido.');if(v.pass.length<6)return bad('La contraseña debe tener al menos 6 caracteres.');if(v.pass!==v.pass2)return bad('Las contraseñas no coinciden.');const r=document.querySelector('#authbox [name=role]:checked')?.value||'student';S.regMode=true;S.pending={name:v.name.trim(),role:r};T(()=>createUserWithEmailAndPassword(auth,v.email,v.pass))}
 else if(k==='rec'){if(!em.test(v.email))return bad('El correo electrónico no es válido.');T(async()=>{await sendPasswordResetEmail(auth,v.email);toast('Si el correo existe, recibirás un enlace para restablecer tu contraseña.')})}
 else if(k==='msg'){const t=(v.t||'').trim(),fileInput=f.querySelector('input[name=f]'),fl=fileInput?.files?.[0];if(!t&&!fl)return bad('Escribe un mensaje o adjunta un archivo.');const chatTo=S.chat;if(!chatTo)return bad('Selecciona un contacto para enviar el mensaje.');const pill=$('#file-preview');if(pill)pill.classList.remove('on');const repTo=S.replyHelp?{hid:S.replyHelp.id,title:S.replyHelp.title,text:S.replyHelp.desc||'',authorName:S.replyHelp.authorName||''}:null;S.replyHelp=null;f.reset();const repBar=document.querySelector('.chat-reply-bar');if(repBar)repBar.remove();T(async()=>{let file=null;if(fl)file=await pack(fl);const ts=Date.now(),id=cid(S.me.id,chatTo),mem=[S.me.id,chatTo];await addDoc(collection(db,'messages'),{chatId:id,members:mem,from:S.me.id,text:t,read:false,ts,...(repTo?{replyTo:repTo}:{}),...(file?{file}:{})});await setDoc(doc(db,'chats',id),{members:mem,last:ts,count:increment(1)},{merge:true});if(chatTo){const notifTxt=repTo?`💬 ${S.me.name} te respondió a tu duda «${repTo.title.length>25?repTo.title.slice(0,22)+'…':repTo.title}»: ${t?(t.length>35?t.slice(0,32)+'…':t):'Ver respuesta'}`:`💬 ${S.me.name}: ${t?(t.length>40?t.slice(0,37)+'…':t):'Te envió un archivo'}`;await notify(chatTo,notifTxt)}})}
 else if(k==='uadd'){if(!v.name.trim()||!v.email||!v.pass)return bad('Debes completar todos los campos.');if(!em.test(v.email))return bad('El correo electrónico no es válido.');if(v.pass.length<6)return bad('La contraseña debe tener al menos 6 caracteres.');
  T(async()=>{const c=await createUserWithEmailAndPassword(secAuth,v.email,v.pass);await signOut(secAuth);await setDoc(doc(db,'users',c.user.uid),{name:v.name.trim(),email:v.email,role:f.dataset.r,specialty:v.specialty||'',career:v.career||'',photo:'',active:true,created:Date.now(),skills:[],availability:[],studentsCount:0});close();toast('Usuario agregado. Compártele su correo y contraseña.')})}
 else if(k==='mnew'){if(!v.date||!v.time)return bad('Debes completar todos los campos.');const m=U(v.mentor);T(async()=>{await addDoc(collection(db,'requests'),{student:v.student,mentor:v.mentor,members:[v.student,v.mentor],specialty:v.specialty||m.specialty||'',date:v.date,time:v.time,message:'Programada por el administrador',status:'ACEPTADA',sesion:v.sesion,created:Date.now()});await notify(v.student,'El administrador programó una mentoría para ti.');await notify(v.mentor,'El administrador programó una mentoría contigo.');close();toast('Mentoría programada.')})}
 else if(k==='iadd'){const n=arr(v.v),kk=f.dataset.k;if(!n.length)return bad('Escribe al menos un elemento.');upd(S.me.id,{[kk]:[...new Set([...(S.me[kk]||[]),...n])]})}
 else if(k==='req'){
  const m=U(f.dataset.id);
  const course=(v.course||m.specialty||'Asesoría general').trim();
  const msg=(v.message||'').trim();
  if(!msg)return bad('Por favor escribe tu duda o los temas que necesitas aprender.');
  T(async()=>{
   await addDoc(collection(db,'requests'),{
    student:S.me.id,
    mentor:m.id,
    members:[S.me.id,m.id],
    specialty:course,
    date:'Por fijar por el mentor',
    time:'Por fijar',
    message:msg,
    status:'PENDIENTE',
    created:Date.now()
   });
   await notify(m.id,`📩 ${S.me.name} te envió una solicitud de clase sobre «${course}».`);
   close();
   toast('¡Solicitud enviada exitosamente! El mentor fijará la fecha y hora.');
  });
 }
 else if(k==='modtime'){
  if(!v.date||!v.time)return bad('Debes seleccionar la fecha y la hora.');
  if(v.date<new Date().toISOString().slice(0,10))return bad('La fecha no puede estar en el pasado.');
  const r=S.reqs.find(x=>x.id===f.dataset.id);
  if(!r)return bad('Clase no encontrada.');
  const otherId=S.me.id===r.mentor?r.student:r.mentor;
  T(async()=>{
   r.date=v.date;
   r.time=v.time;
   close();
   refresh();
   await updateDoc(doc(db,'requests',f.dataset.id),{date:v.date,time:v.time});
   await notify(otherId,`📅 ${S.me.name} modificó el horario de la clase: ${fdate(v.date)} a las ${v.time}.`);
   toast('¡Horario de la clase actualizado exitosamente!');
  });
 }
 else if(k==='acc_mentor'){
  if(!v.date||!v.time)return bad('Debes indicar la fecha y hora de la clase.');
  if(v.date<new Date().toISOString().slice(0,10))return bad('La fecha no puede estar en el pasado.');
  const r=S.reqs.find(x=>x.id===f.dataset.id);
  if(!r)return bad('Solicitud no encontrada.');
  const ml=(v.meetLink||'').trim();
  if(ml&&!/^https:\/\//.test(ml))return bad('El enlace de Meet debe comenzar con https://');
  T(async()=>{
   r.status='ACEPTADA';
   r.sesion='Confirmada';
   r.date=v.date;
   r.time=v.time;
   if(ml)r.meetLink=ml;
   close();
   refresh();
   await updateDoc(doc(db,'requests',f.dataset.id),{status:'ACEPTADA',sesion:'Confirmada',date:v.date,time:v.time,...(ml?{meetLink:ml}:{})});
   await updateDoc(doc(db,'users',S.me.id),{studentsCount:increment(1)});
   await notify(r.student,`🎉 ${S.me.name} aceptó tu solicitud y programó tu clase para el ${fdate(v.date)} a las ${v.time}.${ml?' ¡Ya puedes unirte con Meet!':''}`);
   toast('¡Solicitud aceptada y clase programada exitosamente!');
  });
 }
 else if(k==='prof'){if(!v.name.trim())return bad('El nombre es obligatorio.');const d={name:v.name.trim(),photo:cleanPhotoUrl(v.photo)||''};
  if('coverPhoto' in v)d.coverPhoto=cleanPhotoUrl(v.coverPhoto)||'';
  if('whatsapp'in v){if(v.whatsapp&&!/^\d{8,15}$/.test(v.whatsapp.replace(/\D/g,'')))return bad('El número de WhatsApp no es válido.');d.whatsapp=v.whatsapp.replace(/\D/g,'')}
  if(v.linkedin&&!/^https?:\/\//.test(v.linkedin))v.linkedin='https://'+v.linkedin;['specialty','bio','studies','career','level','city','institution','faculty','linkedin','goals','mode'].forEach(x=>{if(x in v)d[x]=v[x]});['skills','courses','interests','languages'].forEach(x=>{if(x in v)d[x]=arr(v[x])});
  if('experience'in v)d.experience=Math.max(0,+v.experience||0);if('progress'in v)d.progress=Math.min(100,Math.max(0,+v.progress||0));upd(f.dataset.id,d).then(close)}
 else if(k==='coverform'){const cp=cleanPhotoUrl(v.coverPhoto)||'';upd(f.dataset.id,{coverPhoto:cp}).then(close)}
 else if(k==='avail'){const a=[];for(const d of DAYS)if(v['on_'+d]){if(!v['a_'+d]||!v['b_'+d]||v['a_'+d]>=v['b_'+d])return bad(`${d}: la hora final debe ser posterior a la inicial.`);a.push({d,a:v['a_'+d],b:v['b_'+d]})}upd(S.me.id,{availability:a})}
 else if(k==='specs')upd(S.me.id,{specialty:v.specialty.trim(),skills:arr(v.skills)});
 else if(k==='grade'){const val=+v.value;if(!(val>=0&&val<=MAXG))return bad('La nota debe estar entre 0 y '+MAXG+'.');const sid=f.dataset.id;T(async()=>{await setDoc(doc(db,'grades',S.me.id+'_'+sid),{mentor:S.me.id,student:sid,value:val,comment:(v.comment||'').trim(),updated:Date.now()});await notify(sid,`${S.me.name} te calificó: ${val}/${MAXG}.`);close();toast('Calificación guardada.')})}
 else if(k==='rateform'){const val=+v.val;if(!val||val<1||val>10)return bad('Por favor selecciona una calificación de 1 a 10 estrellas.');const mid=f.dataset.id;const docId=S.me.id+'_'+mid;T(async()=>{await setDoc(doc(db,'ratings',docId),{mentor:mid,student:S.me.id,value:val,updated:Date.now()});close();refresh();toast('¡Gracias por tu calificación de '+val+'/10 estrellas!')})}
 else if(k==='meet'){const l=(v.link||'').trim();if(l&&!/^https:\/\//.test(l))return bad('El enlace debe comenzar con https://');const r=S.reqs.find(x=>x.id===f.dataset.id);T(async()=>{await updateDoc(doc(db,'requests',f.dataset.id),{meetLink:l});if(l&&r)await notify(r.student,`${S.me.name} agregó el enlace de Meet para tu clase.`);close();toast('Enlace guardado.')})}
 else if(k==='meet_start'||k==='meet_and_live'){
  let l=(v.link||'').trim();
  if(!l)return bad('Ingresa el enlace de Meet.');
  if(!/^https?:\/\//i.test(l))l='https://'+l;
  const r=S.reqs.find(x=>x.id===f.dataset.id);
  T(async()=>{
   if(r){
    r.meetLink=l;
    r.live=true;
    r.sesion='Confirmada';
   }
   close();
   refresh();
   await updateDoc(doc(db,'requests',f.dataset.id),{meetLink:l,live:true,sesion:'Confirmada'});
   const students=reqStudents(r);
   for(const s of (students.length?students:[U(r?.student)])){
    if(s&&s.id)await notify(s.id,`🔴 ¡Tu clase de «${r?.specialty||'Mentoría'}» ha comenzado! El mentor ${S.me.name} ya está en Google Meet.`);
   }
   window.open(l,'_blank');
   toast('🔴 ¡Clase en vivo iniciada! Se abrió Meet y se notificó a los alumnos.');
  });
 }
 else if(k==='susp'){upd(f.dataset.id,{active:false,inactiveReason:(v.reason||'').trim()}).then(close)}
 else if(k==='ublockdel'){const id=f.dataset.id,u=U(id);if(id===S.me.id)return bad('No puedes bloquearte a ti misma.');const reason=(v.reason||'').trim()||'Bloqueado por la administración';const {id:_i,...data}=u;delUsers.add(id);try{localStorage.setItem('del_users',JSON.stringify([...delUsers]))}catch{}const userHelps=(S.helps||[]).filter(h=>h.authorId===id);for(const h of userHelps)delHelps.add(h.id);try{localStorage.setItem('del_helps',JSON.stringify([...delHelps]))}catch{}S.helps=(S.helps||[]).filter(h=>h.authorId!==id);S.users=S.users.filter(x=>x.id!==id);S.tombs=[{id,name:u.name||'',email:u.email||'',role:u.role||'',reason,blocked:true,ts:Date.now(),by:S.me.id,data},...S.tombs.filter(x=>x.id!==id)];close();refresh();toast(`Usuario ${u.name} bloqueado y retirado de la lista.`);T(async()=>{await setDoc(doc(db,'deletedUsers',id),{name:u.name||'',email:u.email||'',role:u.role||'',reason,blocked:true,ts:Date.now(),by:S.me.id,data});for(const h of userHelps){try{await deleteDoc(doc(db,'help_posts',h.id))}catch{}}try{await updateDoc(doc(db,'users',id),{active:false,deleted:true,blocked:true,inactiveReason:reason})}catch{}await deleteDoc(doc(db,'users',id))})}
  else if(k==='helpnew'){const title=(v.title||'').trim(),desc=(v.desc||'').trim();if(!title||!desc)return bad('Completa el título y la descripción.');const newH={authorId:S.me.id,authorName:S.me.name,authorRole:S.me.role,authorCareer:S.me.career||'',authorLevel:S.me.level||'',authorInstitution:S.me.institution||'',category:v.cat||'General',title,description:desc,solved:false,created:Date.now(),replies:[]};const tempId='h_'+Date.now();S.helps=[{id:tempId,...newH},...(S.helps||[])];close();render();toast('¡Tu consulta fue publicada en el muro!');T(async()=>{const ref=await addDoc(collection(db,'help_posts'),newH);const it=S.helps.find(x=>x.id===tempId);if(it)it.id=ref.id})}
  else if(k==='helprep'){const text=(v.text||'').trim();if(!text)return bad('Escribe tu respuesta.');const hid=f.dataset.id,h=helpList().find(x=>x.id===hid)||(S.helps||[]).find(x=>x.id===hid);const rep={id:'r_'+Date.now(),authorId:S.me.id,authorName:S.me.name,authorRole:S.me.role,text,ts:Date.now()};if(h){h.replies=[...(h.replies||[]),rep];if(h.authorId!==S.me.id)notify(h.authorId,`💬 ${S.me.name} respondió a tu duda en el Muro de Ayuda.`);}close();render();toast('Respuesta enviada.');T(async()=>{try{await updateDoc(doc(db,'help_posts',hid),{replies:(h?.replies||[rep])})}catch{}})}
  else if(k==='udel'){const id=f.dataset.id,u=U(id);if(id===S.me.id)return bad('No puedes eliminarte a ti mismo.');const reason=(v.reason||'').trim()||'Eliminado por la administración';const {id:_i,...data}=u;delUsers.add(id);try{localStorage.setItem('del_users',JSON.stringify([...delUsers]))}catch{}const userHelps=(S.helps||[]).filter(h=>h.authorId===id);for(const h of userHelps)delHelps.add(h.id);try{localStorage.setItem('del_helps',JSON.stringify([...delHelps]))}catch{}S.helps=(S.helps||[]).filter(h=>h.authorId!==id);S.users=S.users.filter(x=>x.id!==id);S.tombs=[{id,name:u.name||'',email:u.email||'',role:u.role||'',reason,ts:Date.now(),by:S.me.id,data},...S.tombs.filter(x=>x.id!==id)];close();refresh();toast(`Usuario ${u.name} eliminado.`);T(async()=>{await setDoc(doc(db,'deletedUsers',id),{name:u.name||'',email:u.email||'',role:u.role||'',reason,ts:Date.now(),by:S.me.id,data});for(const h of userHelps){try{await deleteDoc(doc(db,'help_posts',h.id))}catch{}}if(v.cascade){for(const r of S.reqs.filter(r=>(r.members||[]).includes(id)))await deleteDoc(doc(db,'requests',r.id));for(const g of S.grades.filter(g=>g.student===id||g.mentor===id))await deleteDoc(doc(db,'grades',g.id))}try{await updateDoc(doc(db,'users',id),{active:false,deleted:true,inactiveReason:reason})}catch{}await deleteDoc(doc(db,'users',id))})}
 else if(k==='ann'){const t=(v.text||'').trim();if(!t)return bad('Escribe el aviso.');T(async()=>{await setDoc(doc(db,'settings','site'),{announce:t,announceTs:Date.now()},{merge:true});if(v.notif)for(const u of S.users.filter(x=>x.active!==false&&x.id!==S.me.id))await notify(u.id,'📢 '+t);f.reset();toast('Aviso publicado.')})}
 else if(k==='choose'){S.pending={name:'',role:v.role==='mentor'?'mentor':'student'};S.choose=null;T(()=>boot(auth.currentUser))}
 else if(k==='wa'){const n=v.whatsapp.replace(/\D/g,'');if(n&&!/^\d{8,15}$/.test(n))return bad('El número de WhatsApp no es válido.');upd(S.me.id,{whatsapp:n})}});
