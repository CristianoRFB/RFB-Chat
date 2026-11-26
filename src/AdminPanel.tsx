import { useEffect,useState,type FormEvent } from 'react';
import { changeAccount, readControl, watchProfiles, watchAccountHistory, DEFAULT_CONTROL,type AccountControl,type AccountRole,type AccountStatus } from './admin-data';
export function AdminPanel({uid,onError}:{uid:string;onError:(e:unknown)=>void}){
 const [profiles,setProfiles]=useState<{uid:string;displayName:string}[]>([]);
 const [target,setTarget]=useState(''),[search,setSearch]=useState('');
 const [role,setRole]=useState<AccountRole>('member'),[status,setStatus]=useState<AccountStatus>('active');
 const [reason,setReason]=useState(''),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
 const [ready,setReady]=useState(false),[history,setHistory]=useState<AccountControl[]>([]);
 useEffect(()=>watchProfiles(setProfiles,onError),[onError]);
 useEffect(()=>{
  setReady(false);setHistory([]);setNotice('');if(!target)return;
  let active=true;void readControl(target).then(v=>{if(active){setRole(v.role);setStatus(v.status);setReady(true);}}).catch(onError);
  const off=watchAccountHistory(target,setHistory,onError);
  return()=>{active=false;off();};
 },[target,onError]);
 async function submit(e:FormEvent){e.preventDefault();if(!target||!ready||busy)return;
  if(!window.confirm('Confirmar alteração de acesso desta conta?'))return;
  setBusy(true);setNotice('');
  try{await changeAccount(uid,target,role,status,reason);setReason('');setNotice('Alteração registrada e auditada.');}
  catch(e){onError(e);}finally{setBusy(false);}
 }
 return <details className="moderator-area"><summary>Administração de contas</summary>
  <p className="mini-label">Até 50 perfis recentes. Apenas administradores podem delegar moderação; admin principal é provisionado fora do navegador.</p>
  <label>Buscar perfil<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nome ou UID"/></label>
  <form className="group-form" onSubmit={submit}>
   <label>Conta<select value={target} onChange={e=>setTarget(e.target.value)} required disabled={busy}><option value="">Escolha uma conta</option>{profiles.filter(p=>p.uid!==uid&&(p.uid===target||(p.displayName+' '+p.uid).toLowerCase().includes(search.toLowerCase()))).map(p=><option key={p.uid} value={p.uid}>{p.displayName} · {p.uid.slice(0,12)}</option>)}</select></label>
   {target&&ready&&<><label>Cargo<select value={role} onChange={e=>setRole(e.target.value as AccountRole)}><option value="member">Membro</option><option value="moderator">Moderador</option></select></label>
    <label>Situação<select value={status} onChange={e=>setStatus(e.target.value as AccountStatus)}><option value="active">Ativa</option><option value="suspended">Suspensa — somente leitura</option><option value="banned">Banida — sem mensageria</option></select></label>
    <label>Justificativa<textarea value={reason} onChange={e=>setReason(e.target.value)} minLength={10} maxLength={300} required/></label>
    <button type="submit" disabled={busy||reason.trim().length<10}>Aplicar alteração de acesso</button></>}
  </form>{notice&&<p role="status">{notice}</p>}
  {target&&<section aria-label="Histórico administrativo"><h3>Histórico de acesso</h3>{history.length===0&&<p>Sem alterações registradas.</p>}{history.map((h,i)=><article key={(h.updatedAt?.getTime()??0)+'-'+i}><strong>{h.status} · {h.role}</strong><p>{h.reason}</p><small>{h.updatedAt?.toLocaleString('pt-BR')} · operador {h.actorId}</small></article>)}</section>}
 </details>;
}
