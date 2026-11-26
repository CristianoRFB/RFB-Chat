import {useEffect,useState} from 'react';
import {collection,doc,getDocFromServer,limit,onSnapshot,orderBy,query,serverTimestamp,setDoc,updateDoc} from 'firebase/firestore';
import {db} from './firebase';
import {watchOwnReports} from './moderator-data';
type Kind='access'|'erasure'|'appeal';
type RequestRow={id:string;ownerId:string;kind:Kind;status:string;note:string};
const labels:Record<Kind,string>={access:'Acesso integral aos dados',erasure:'Solicitar eliminação de dados',appeal:'Contestação de restrição'};
const kinds=Object.keys(labels) as Kind[];
export function PrivacyRights({uid,onError}:{uid:string;onError:(e:unknown)=>void}){
 const [rows,setRows]=useState<Partial<Record<Kind,string>>>({}),[kind,setKind]=useState<Kind>('access'),[note,setNote]=useState('');
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const [reports,setReports]=useState<{id:string;status:string;reason:string}[]>([]);
 useEffect(()=>{
  const offs=kinds.map(k=>onSnapshot(doc(db,'privacyRequests',uid+'_'+k),s=>setRows(v=>({...v,[k]:s.exists()?String(s.data().status):''})),onError));
  offs.push(watchOwnReports(uid,setReports,onError));return()=>offs.forEach(off=>off());
 },[uid,onError]);
 async function request(){if(busy||rows[kind])return;setBusy(true);setNotice('');
  try{await setDoc(doc(db,'privacyRequests',uid+'_'+kind),{ownerId:uid,kind,status:'submitted',createdAt:serverTimestamp(),note:note.trim()});setNote('');setNotice('Solicitação registrada. Aguarda análise do responsável.');}
  catch(e){onError(e);}finally{setBusy(false);}
 }
 async function exportProfile(){setBusy(true);setNotice('');
  try{
   const [profile,settings]=await Promise.all([getDocFromServer(doc(db,'profiles',uid)),getDocFromServer(doc(db,'userPrivate',uid))]);
   const p=profile.data(),s=settings.data();
   const blob=new Blob([JSON.stringify({scope:'Perfil e preferências; não inclui conversas, mídias, logs ou backups',exportedAt:new Date().toISOString(),uid,profile:p?{displayName:p.displayName,createdAt:p.createdAt?.toDate?.().toISOString()}:null,preferences:s??null},null,2)],{type:'application/json'});
   const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='rfb-chat-meus-dados.json';link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice('Exportação limitada preparada.');
  }catch(e){onError(e);}finally{setBusy(false);}
 }
 return <details className="privacy-panel"><summary>Meus dados e solicitações</summary>
  <p>Laboratório local. Baixe seu perfil e preferências; para acesso integral, eliminação ou contestação, envie uma solicitação. O registro não confirma execução da eliminação.</p>
  <button type="button" disabled={busy} onClick={()=>void exportProfile()}>Exportar perfil e preferências</button>
  <form className="group-form" onSubmit={e=>{e.preventDefault();void request();}}>
   <label>Tipo de solicitação<select value={kind} onChange={e=>setKind(e.target.value as Kind)}>{kinds.map(k=><option key={k} value={k}>{labels[k]}</option>)}</select></label>
   <label>Observação opcional<textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={500} placeholder="Não inclua senhas ou dados de terceiros."/></label>
   <button type="submit" disabled={busy||!!rows[kind]}>Registrar solicitação</button>
  </form>
  {kinds.map(k=>rows[k]&&<p key={k}>{labels[k]}: {rows[k]==='submitted'?'Recebida':'Em análise'}</p>)}
  <h3>Minhas denúncias</h3>{reports.length===0?<p>Nenhuma denúncia registrada.</p>:reports.map(r=><article key={r.id}><strong>{r.status}</strong><p>{r.reason}</p></article>)}
  {notice&&<p role="status">{notice}</p>}
 </details>;
}
export function PrivacyQueue({uid,onError}:{uid:string;onError:(e:unknown)=>void}){
 const [items,setItems]=useState<RequestRow[]>([]),[busy,setBusy]=useState('');
 useEffect(()=>onSnapshot(query(collection(db,'privacyRequests'),orderBy('createdAt','desc'),limit(50)),s=>setItems(s.docs.map(d=>({id:d.id,...d.data()} as RequestRow))),onError),[onError]);
 async function review(id:string){setBusy(id);try{await updateDoc(doc(db,'privacyRequests',id),{status:'under_review',reviewedBy:uid,reviewedAt:serverTimestamp()});}catch(e){onError(e);}finally{setBusy('');}}
 return <details className="moderator-area"><summary>Solicitações de privacidade</summary><p>Fila de análise; não representa cumprimento integral nem exclusão executada.</p>{items.length===0&&<p>Nenhuma solicitação.</p>}{items.map(r=><article key={r.id}><strong>{labels[r.kind]} · {r.status}</strong><p>UID: {r.ownerId}</p><p>{r.note}</p>{r.status==='submitted'&&<button disabled={busy===r.id} type="button" onClick={()=>void review(r.id)}>Iniciar análise</button>}</article>)}</details>;
}
