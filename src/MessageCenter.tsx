import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { sendText, type ChatMessage } from './chat-data';
import {
  editMessage, loadOlderMessages, markRead, mergeMessages, REACTION_OPTIONS,
  replyToMessage, setReaction, watchLatest, watchReactions, watchReads,
  type MessageCursor, type MessageReaction, type ReactionEmoji, type ReadReceipt
} from './chat-extras';
import { MAX_MESSAGE_LENGTH } from './chat-model';
import { AudioRecorder } from './AudioRecorder';

type Props = { conversationId: string | null; uid: string; otherUid: string; readEnabled: boolean; onError: (error: unknown) => void };
function MessageCard({ conversationId, message, uid, receipt, original, onReply, onEdit, onError }: {
  conversationId: string; message: ChatMessage; uid: string; receipt?: Date; original?: string;
  onReply: (message: ChatMessage) => void; onEdit: (message: ChatMessage) => void;
  onError: (error: unknown) => void;
}) {
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const mine = message.senderId === uid;
  useEffect(() => watchReactions(conversationId, message.id, setReactions, onError),
    [conversationId, message.id, onError]);
  const read = mine && !!receipt && !!message.createdAt && receipt.getTime() >= message.createdAt.getTime();
  async function react(emoji: ReactionEmoji) {
    try {
      const existing = reactions.find(item => item.uid === uid);
      await setReaction(conversationId, message.id, uid, existing?.emoji === emoji ? null : emoji);
    } catch (error) { onError(error); }
  }
  return <article className={'message ' + (mine ? 'outgoing' : 'incoming')} data-message-id={message.id}>
    {message.replyToId && <p className="reply-context">↳ {original ?? 'Mensagem anterior'}</p>}
    {message.kind === 'audio' && message.audioData ?
      <div><p>Mensagem de voz ({Math.ceil((message.durationMs ?? 0) / 1000)}s)</p>
        <audio controls preload="none" src={message.audioData} aria-label="Mensagem de voz" /></div>
      : <p>{message.body}</p>}
    <span className="message-meta">
      {message.createdAt ? message.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}
      {message.editedAt && ' · Editada'}
      {' · '}{message.pending ? 'Enviando' : read ? 'Lida' : 'Gravada'}
    </span>
    <div className="message-actions">
      <button type="button" onClick={() => onReply(message)}>Responder</button>
      {mine && <button type="button" onClick={() => onEdit(message)}>Editar</button>}
    </div>
    <div className="reaction-list" aria-label="Reações">
      {REACTION_OPTIONS.map(emoji => {
        const active = reactions.some(item => item.uid === uid && item.emoji === emoji);
        const count = reactions.filter(item => item.emoji === emoji).length;
        return <button key={emoji} className={active ? 'reaction active' : 'reaction'} type="button"
          aria-label={'Reagir com ' + emoji} aria-pressed={active} title={'Reagir com ' + emoji}
          onClick={() => void react(emoji)}>{emoji}{count > 0 ? ' ' + count : ''}</button>;
      })}
    </div>
  </article>;
}

export function MessageCenter({ conversationId, uid, otherUid, readEnabled, onError }: Props) {
  const [latest, setLatest] = useState<ChatMessage[]>([]);
  const [older, setOlder] = useState<ChatMessage[]>([]);
  const [cursor, setCursor] = useState<MessageCursor | null>(null);
  const [more, setMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reads, setReads] = useState<ReadReceipt>({});
  const [draft, setDraft] = useState('');
  const [reply, setReply] = useState<ChatMessage | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const latestSeen = useRef<string>('');

  useEffect(() => {
    setLatest([]);
    setOlder([]);
    setCursor(null);
    setMore(false);
    setReads({});
    latestSeen.current = '';
    if (!conversationId) return;
    const messagesOff = watchLatest(conversationId, (items, first) => {
      setLatest(items);
      setCursor(previous => previous ?? first);
      setMore(previous => previous || items.length === 50);
    }, onError);
    const readsOff = watchReads(conversationId, setReads, onError);
    return () => { messagesOff(); readsOff(); };
  }, [conversationId, onError]);

  const messages = useMemo(() => mergeMessages(older, latest), [older, latest]);

  useEffect(() => {
    const recent = [...latest].reverse().find(m => m.senderId !== uid && !m.pending && m.createdAt);
    if (!readEnabled || !recent || !conversationId || latestSeen.current === recent.id) return;
    if (document.visibilityState !== 'visible') return;
    latestSeen.current = recent.id;
    void markRead(conversationId, uid).catch(onError);
  }, [latest, conversationId, uid, readEnabled, onError]);

  async function olderPage() {
    if (!conversationId || !cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await loadOlderMessages(conversationId, cursor);
      setOlder(previous => mergeMessages(result.messages, previous));
      if (result.cursor) setCursor(result.cursor);
      setMore(result.hasMore);
    } catch (error) { onError(error); }
    finally { setLoadingMore(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!conversationId || !draft.trim() || busy) return;
    setBusy(true);
    try {
      if (reply) await replyToMessage(conversationId, uid, draft, reply.id);
      else await sendText(uid, conversationId, draft);
      setDraft('');
      setReply(null);
    } catch (error) { onError(error); }
    finally { setBusy(false); }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || !conversationId) return;
    setBusy(true);
    try {
      await editMessage(conversationId, editing.id, editDraft);
      setEditing(null);
      setEditDraft('');
    } catch (error) { onError(error); }
    finally { setBusy(false); }
  }

  if (!conversationId) return <div className="chat-body-empty">
    <div className="empty-state"><h3>Conversas que acompanham sua equipe.</h3>
      <p>Escolha uma conversa ou crie uma pela barra lateral.</p></div>
  </div>;

  return <>
    <div className="messages" aria-label="Histórico de mensagens" aria-live="polite">
      {more && <button type="button" className="older-button" disabled={loadingMore}
        onClick={() => void olderPage()}>{loadingMore ? 'Carregando…' : 'Carregar mensagens anteriores'}</button>}
      {messages.length === 0 && <div className="empty-state"><h3>A conversa começou.</h3>
        <p>Envie a primeira mensagem para testar a sincronização.</p></div>}
      {messages.map(message => <MessageCard key={message.id} conversationId={conversationId}
        message={message} uid={uid} receipt={reads[otherUid]}
        original={messages.find(candidate => candidate.id === message.replyToId)?.body}
        onReply={setReply} onEdit={item => { setEditing(item); setEditDraft(item.body); }}
        onError={onError}/>)}
    </div>
    {reply && <div className="reply-banner">
      <span>Respondendo: {reply.body.slice(0, 90)}</span>
      <button type="button" onClick={() => setReply(null)}>Cancelar resposta</button>
    </div>}
    {editing && <form className="edit-form" onSubmit={saveEdit}>
      <label htmlFor="edit-text">Editar mensagem</label>
      <input id="edit-text" value={editDraft} onChange={e => setEditDraft(e.target.value)}
        maxLength={MAX_MESSAGE_LENGTH} disabled={busy} required />
      <button type="submit" disabled={busy || !editDraft.trim()}>Salvar edição</button>
      <button type="button" onClick={() => setEditing(null)}>Cancelar</button>
    </form>}
    <form className="composer" onSubmit={submit}>
      <label htmlFor="message-text" className="visually-hidden">Digite sua mensagem</label>
      <input id="message-text" value={draft} onChange={e => setDraft(e.target.value)}
        disabled={busy} placeholder="Escreva uma mensagem…" maxLength={MAX_MESSAGE_LENGTH}/>
      <button type="submit" disabled={busy || !draft.trim()}>{busy ? 'Enviando…' : 'Enviar'}</button>
    </form>
    <AudioRecorder conversationId={conversationId} uid={uid} onError={onError} />
    <p className="legal-note">Mensagens armazenadas sem criptografia ponta a ponta; recibo de leitura aparece quando a conversa está visível.</p>
  </>;
}
