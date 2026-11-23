import { useState, type FormEvent } from 'react';
import { sendReport } from './privacy-data';
import type { ChatConversation } from './chat-data';

export function ReportPanel({ uid, conversation, onError }: {
  uid: string; conversation?: ChatConversation; onError: (error: unknown) => void;
}) {
  const [target, setTarget] = useState('');
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  if (!conversation) return null;
  const targets = conversation.memberIds.filter(member => member !== uid);
  const recipient = conversation.kind === 'dm' ? (targets[0] ?? '') : target;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setNotice('');
    try {
      await sendReport(uid, conversation.id, recipient, reason);
      setReason(''); setNotice('Denúncia registrada para revisão por moderador autorizado.');
    } catch (error) { onError(error); }
    finally { setBusy(false); }
  }
  return <details className="report-panel">
    <summary>Denunciar comportamento</summary>
    <form onSubmit={submit} className="report-form">
      {conversation.kind === 'group' && <label>Participante
        <select value={target} onChange={e => setTarget(e.target.value)} required>
          <option value="">Selecionar UID</option>
          {targets.map(member => <option key={member} value={member}>{member.slice(0, 18)}</option>)}
        </select>
      </label>}
      <label>Motivo da denúncia
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          rows={2} minLength={10} maxLength={500} required placeholder="Descreva a ocorrência…" />
      </label>
      <button type="submit" disabled={busy || reason.trim().length < 10 || !recipient}>Enviar denúncia</button>
      {notice && <span role="status">{notice}</span>}
    </form>
  </details>;
}
