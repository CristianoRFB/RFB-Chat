import { useEffect, useState } from 'react';
import { getIdTokenResult, onIdTokenChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
import { watchAccountControl } from './admin-data';
import { AdminPanel } from './AdminPanel';
import { PrivacyQueue } from './PrivacyRights';
import { setModerationStatus, watchModerationQueue, watchReportHistory, type ModerationReport } from './moderator-data';

export function ModeratorDashboard({ user, onError }: {
  user: User; onError: (error: unknown) => void;
}) {
  const [claims, setClaims] = useState({admin:false,moderator:false});
  const [control, setControl] = useState<{active:boolean;role:string;exists:boolean}|null>(null);
  const allowed=!!control?.active&&(claims.admin||(control.exists?control.role==='moderator':claims.moderator));
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [busy, setBusy] = useState('');
  const [selected,setSelected]=useState('');
  const [history,setHistory]=useState<{status:string;actorId:string;createdAt:Date|null}[]>([]);
  useEffect(()=>{setHistory([]);if(!allowed||!selected)return;return watchReportHistory(selected,setHistory,onError);},[allowed,selected,onError]);
  useEffect(() => {
    let mounted = true;
    const off=onIdTokenChanged(auth,next=>{
      if(next?.uid!==user.uid)return;
      void getIdTokenResult(next).then(result=>{
        if(mounted)setClaims({admin:result.claims.admin===true,moderator:result.claims.moderator===true});
      }).catch(onError);
    });
    return () => { mounted = false;off(); };
  }, [user, onError]);
  useEffect(()=>watchAccountControl(user.uid,(v,exists)=>setControl({active:v.status==='active',role:v.role,exists}),onError),[user.uid,onError]);
  useEffect(() => {
    if (!allowed) {setReports([]);return;}
    return watchModerationQueue(setReports, onError);
  }, [allowed, onError]);
  if (!allowed) return null;
  async function change(id: string, status: 'reviewed' | 'closed') {
    setBusy(id);
    try { await setModerationStatus(id, status,user.uid); }
    catch (error) { onError(error); }
    finally { setBusy(''); }
  }
  const open = reports.filter(report => report.status === 'open').length;
  return <section className="moderator-area" aria-label="Administração e moderação">
    {claims.admin&&<><AdminPanel uid={user.uid} onError={onError}/><PrivacyQueue uid={user.uid} onError={onError}/></>}
    <details>
      <summary>Moderação · {open} denúncias abertas</summary>
      <p>Acesso por cargo confiável. Permissão verificada também nas regras Firestore.</p>
      <div className="moderator-list">
        {reports.length === 0 && <p>Nenhuma denúncia registrada.</p>}
        {reports.map(report => <article className="moderator-report" key={report.id}>
          <p><strong>{report.status.toUpperCase()}</strong> · {report.createdAt?.toLocaleString('pt-BR') ?? 'Data pendente'}</p>
          <p>Conversa: {report.conversationId.slice(0, 30)}</p>
          <p>Remetente: {report.reporterId.slice(0, 12)} · Denunciado: {report.reportedUid.slice(0, 12)}</p>
          <blockquote>{report.reason}</blockquote>
          {report.reviewedBy&&<p>Último operador: {report.reviewedBy}</p>}
          <button type="button" onClick={()=>setSelected(selected===report.id?'':report.id)}>Histórico da denúncia</button>
          {selected===report.id&&<ul>{history.map(h=><li key={h.status}>{h.status} · {h.actorId} · {h.createdAt?.toLocaleString('pt-BR')}</li>)}</ul>}
          <div className="moderator-actions">
            {report.status === 'open' && <button disabled={busy === report.id} type="button"
              onClick={() => void change(report.id, 'reviewed')}>Marcar revisada</button>}
            {report.status !== 'closed' && <button disabled={busy === report.id} type="button"
              onClick={() => void change(report.id, 'closed')}>Encerrar denúncia</button>}
          </div>
        </article>)}
      </div>
    </details>
  </section>;
}
