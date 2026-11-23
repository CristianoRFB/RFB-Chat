import { useEffect, useState } from 'react';
import { getIdTokenResult, type User } from 'firebase/auth';
import { setModerationStatus, watchModerationQueue, type ModerationReport } from './moderator-data';

export function ModeratorDashboard({ user, onError }: {
  user: User; onError: (error: unknown) => void;
}) {
  const [allowed, setAllowed] = useState(false);
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [busy, setBusy] = useState('');
  useEffect(() => {
    let mounted = true;
    void getIdTokenResult(user).then(result => {
      if (mounted) setAllowed(result.claims.moderator === true || result.claims.admin === true);
    }).catch(onError);
    return () => { mounted = false; };
  }, [user, onError]);
  useEffect(() => {
    if (!allowed) return;
    return watchModerationQueue(setReports, onError);
  }, [allowed, onError]);
  if (!allowed) return null;
  async function change(id: string, status: 'reviewed' | 'closed') {
    setBusy(id);
    try { await setModerationStatus(id, status); }
    catch (error) { onError(error); }
    finally { setBusy(''); }
  }
  const open = reports.filter(report => report.status === 'open').length;
  return <section className="moderator-area" aria-label="Administração e moderação">
    <details>
      <summary>Moderação · {open} denúncias abertas</summary>
      <p>Somente tokens com claims de moderador ou administrador. Permissão verificada também nas regras Firestore.</p>
      <div className="moderator-list">
        {reports.length === 0 && <p>Nenhuma denúncia registrada.</p>}
        {reports.map(report => <article className="moderator-report" key={report.id}>
          <p><strong>{report.status.toUpperCase()}</strong> · {report.createdAt?.toLocaleString('pt-BR') ?? 'Data pendente'}</p>
          <p>Conversa: {report.conversationId.slice(0, 30)}</p>
          <p>Remetente: {report.reporterId.slice(0, 12)} · Denunciado: {report.reportedUid.slice(0, 12)}</p>
          <blockquote>{report.reason}</blockquote>
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
