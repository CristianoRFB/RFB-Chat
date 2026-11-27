import { useEffect, useState } from 'react';
import { watchLatest, watchReads, type ReadReceipt } from './chat-extras';
import type { ChatConversation, ChatMessage } from './chat-data';

function UnreadLine({ conversation, uid, onOpen, onError }: {
  conversation: ChatConversation; uid: string; onOpen: (id: string) => void;
  onError: (error: unknown) => void;
}) {
  const [lastMessages, setLastMessages] = useState<ChatMessage[]>([]);
  const [receipts, setReceipts] = useState<ReadReceipt>({});
  useEffect(() => {
    const offMessages = watchLatest(conversation.id, setLastMessages, onError);
    const offReads = watchReads(conversation.id, setReceipts, onError);
    return () => { offMessages(); offReads(); };
  }, [conversation.id, onError]);
  const readAt = receipts[uid]?.readAt?.getTime() ?? 0;
  const unread = lastMessages.filter(m => m.senderId !== uid && !m.deletedAt && !!m.createdAt
    && m.createdAt.getTime() > readAt).length;
  return <button className="unread-line" type="button" onClick={() => onOpen(conversation.id)}>
    <span>{conversation.kind === 'group' ? conversation.title : 'Conversa ' + conversation.id.slice(-7)}</span>
    <strong aria-label={unread + ' mensagens não lidas'}>{unread} não lidas</strong>
  </button>;
}

export function NotificationsPanel({ conversations, enabled, uid, onOpen, onError }: {
  conversations: ChatConversation[]; enabled: boolean; uid: string;
  onOpen: (id: string) => void; onError: (error: unknown) => void;
}) {
  const [open,setOpen]=useState(false);
  if (!enabled) return <p className="mini-label" style={{ padding: 12 }}>Notificações desativadas nas preferências.</p>;
  return <details className="notifications-panel" open={open} onToggle={e=>setOpen(e.currentTarget.open)}>
    <summary>Notificações de mensagens</summary>
    <p className="mini-label">Até 10 conversas recentes, sem notificações push ou segundo plano.</p>
    {!open&&<p className="mini-label">Abra para atualizar as notificações.</p>}
    {open&&conversations.slice(0, 10).map(conversation => <UnreadLine key={conversation.id}
      conversation={conversation} uid={uid} onError={onError} onOpen={onOpen}/>)}
    {conversations.length === 0 && <p className="mini-label">Sem conversas ainda.</p>}
  </details>;
}
