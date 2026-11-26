import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { sendText, type ChatMessage, type ChatConversation } from './chat-data';
import {
  editMessage, markRead, REACTION_OPTIONS, filterMessages, removeTextMessage, pinMessage, forwardText,
  markDelivered, replyToMessage, setReaction, watchLatest, watchReactions, watchReads,
  type MessageReaction, type ReactionEmoji, type ReadReceipt
} from './chat-extras';
import { MAX_MESSAGE_LENGTH } from './chat-model';
import { AudioRecorder } from './AudioRecorder';
import { ConversationPresence } from './ConversationPresence';

type Props = { conversationId: string | null; uid: string; otherUid: string; readEnabled: boolean; conversations: ChatConversation[]; canPin: boolean; onError: (error: unknown) => void };
function MessageCard({ conversationId, message, uid, receipt, original, onReply, onEdit, onForward, canPin, onError }: {
  conversationId: string; message: ChatMessage; uid: string; receipt?: ReadReceipt[string]; original?: string;
  onReply: (message: ChatMessage) => void; onEdit: (message: ChatMessage) => void;
  onForward: (message: ChatMessage) => void; canPin: boolean;
  onError: (error: unknown) => void;
}) {
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const elementRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(typeof IntersectionObserver === 'undefined');
  const mine = message.senderId === uid;
  // 50 mensagens = até 50 listeners extras. Só escutar reações de bolhas
  // próximas ao viewport, preservando a atualização ao voltar a rolá-las.
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(entries => {
      setVisible(entries.some(entry => entry.isIntersecting));
    }, { rootMargin: '240px 0px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible || message.deletedAt) return;
    return watchReactions(conversationId, message.id, setReactions, onError);
  }, [visible, conversationId, message.id, message.deletedAt, onError]);
  const read = mine && !!receipt?.readAt && !!message.createdAt
    && receipt.readAt.getTime() >= message.createdAt.getTime();
  const delivered = mine && !!receipt?.deliveredAt && !!message.createdAt
    && receipt.deliveredAt.getTime() >= message.createdAt.getTime();
  async function react(emoji: ReactionEmoji) {
    try {
      const existing = reactions.find(item => item.uid === uid);
      await setReaction(conversationId, message.id, uid, existing?.emoji === emoji ? null : emoji);
    } catch (error) { onError(error); }
  }
  return <article ref={elementRef} className={'message ' + (mine ? 'outgoing' : 'incoming')} data-message-id={message.id}>
    {message.pinned && !message.deletedAt && <p className="mini-label">Mensagem fixada</p>}
    {message.forwarded && !message.deletedAt && <p className="mini-label">Encaminhada</p>}
    {!message.deletedAt && message.replyToId && <p className="reply-context">↳ {original ?? 'Mensagem anterior'}</p>}
    {message.kind === 'audio' && message.audioData ?
      <div><p>Mensagem de voz ({Math.ceil((message.durationMs ?? 0) / 1000)}s)</p>
        <audio controls preload="none" src={message.audioData} aria-label="Mensagem de voz" /></div>
      : <p>{message.body}</p>}
    <div className="message-bottom"><span className="message-meta">
      {message.createdAt ? message.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}
      {message.editedAt && ' · Editada'}
      {' · '}{message.pending ? 'Enviando' : read ? 'Lida' : delivered ? 'Entregue' : 'Gravada'}
    </span>
    {!message.deletedAt && !message.pending && <details className="message-tools"><summary aria-label="Ações da mensagem">Ações <span aria-hidden="true">···</span></summary><div className="message-actions">
      <button type="button" onClick={() => onReply(message)}>Responder</button>
      {mine && message.kind !== 'audio' && <><button type="button" onClick={() => onEdit(message)}>Editar</button>
        <button type="button" onClick={() => { if (window.confirm('Excluir o texto para todos os participantes?')) void removeTextMessage(conversationId, message.id).catch(onError); }}>Excluir</button></>}
      {message.kind !== 'audio' && <button type="button" onClick={() => onForward(message)}>Encaminhar</button>}
      {canPin && <button type="button" aria-pressed={!!message.pinned} onClick={() => void pinMessage(conversationId, message.id, !message.pinned).catch(onError)}>{message.pinned ? 'Desafixar' : 'Fixar'}</button>}
    </div>
    <div className="reaction-list" aria-label="Reações">
      {REACTION_OPTIONS.map(emoji => {
        const active = reactions.some(item => item.uid === uid && item.emoji === emoji);
        const count = reactions.filter(item => item.emoji === emoji).length;
        return <button key={emoji} className={active ? 'reaction active' : 'reaction'} type="button"
          aria-label={'Reagir com ' + emoji} aria-pressed={active} title={'Reagir com ' + emoji}
          onClick={() => void react(emoji)}>{emoji}{count > 0 ? ' ' + count : ''}</button>;
      })}
    </div></details>}</div>
    {!message.deletedAt && reactions.length>0 && <div className="reaction-totals" aria-label="Reações registradas">{REACTION_OPTIONS.map(emoji=>{const count=reactions.filter(r=>r.emoji===emoji).length;return count>0?<span key={emoji} title={count+' reações'}>{emoji} {count}</span>:null;})}</div>}
  </article>;
}

export function MessageCenter({ conversationId, uid, otherUid, readEnabled, conversations, canPin, onError }: Props) {
  const [latest, setLatest] = useState<ChatMessage[]>([]);
  const [windowSize, setWindowSize] = useState(50);
  const [cached, setCached] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);
  const [search, setSearch] = useState('');
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [forwarding, setForwarding] = useState<ChatMessage | null>(null);
  const [destination, setDestination] = useState('');
  const [forwardBusy, setForwardBusy] = useState(false);
  const [reads, setReads] = useState<ReadReceipt>({});
  const [draft, setDraft] = useState('');
  const [reply, setReply] = useState<ChatMessage | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const deliveredSeen = useRef<string>('');
  const readSeen = useRef<string>('');
  const historyRef=useRef<HTMLDivElement|null>(null);
  const nearEnd=useRef(true);
  const lastShown=useRef('');

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  useEffect(() => {
    if (!conversationId) return;
    return watchLatest(conversationId, items => setLatest(items), onError, windowSize, setCached);
  }, [conversationId, windowSize, onError]);
  useEffect(() => {
    if (!conversationId) return;
    return watchReads(conversationId, setReads, onError);
  }, [conversationId, onError]);
  const messages = latest;
  const filtered = useMemo(() => filterMessages(messages, search, pinnedOnly), [messages, search, pinnedOnly]);
  const messageBodies = useMemo(() => new Map(messages.map(item => [item.id, item.body])), [messages]);
  useEffect(()=>{
    const node=historyRef.current,last=messages.at(-1);
    if(!node||!last||search||pinnedOnly)return;
    if(last.id!==lastShown.current){
      if(nearEnd.current||last.senderId===uid||!lastShown.current)node.scrollTop=node.scrollHeight;
      lastShown.current=last.id;
    }
  },[messages,search,pinnedOnly,uid]);
  async function submitForward(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!forwarding || !destination || forwardBusy) return;
    const current = messages.find(m => m.id === forwarding.id);
    if (!current || current.deletedAt || current.pending || current.kind === 'audio') {
      setForwarding(null); return;
    }
    setForwardBusy(true);
    try { await forwardText(uid, destination, current.body); setForwarding(null); setDestination(''); }
    catch (error) { onError(error); } finally { setForwardBusy(false); }
  }

  useEffect(() => {
    if (cached || !online) return;
    const recent = [...latest].reverse().find(m => m.senderId !== uid && !m.pending && m.createdAt);
    if (!recent || !conversationId) return;
    const sync = () => {
      if (deliveredSeen.current !== recent.id) {
        deliveredSeen.current = recent.id;
        void markDelivered(conversationId, uid).catch(onError);
      }
      if (readEnabled && document.visibilityState === 'visible' && readSeen.current !== recent.id) {
        readSeen.current = recent.id;
        void markRead(conversationId, uid).catch(onError);
      }
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, [latest, conversationId, uid, readEnabled, onError, cached, online]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!conversationId || !draft.trim() || busy) return;
    if (reply && messages.find(m => m.id === reply.id)?.deletedAt) {
      setReply(null); onError(new Error('A mensagem original foi excluída. Envie sem resposta.')); return;
    }
    setBusy(true);
    try {
      if (reply) await replyToMessage(conversationId, uid, draft, reply.id);
      else await sendText(uid, conversationId, draft);
      setDraft('');
      setReply(null);
    } catch (error) { onError(error); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    if (editing && messages.find(m => m.id === editing.id)?.deletedAt) { setEditing(null); setEditDraft(''); }
  }, [editing, messages]);

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
    <div className="empty-state"><img className="empty-mark" src="/brand/icone.svg" width="64" height="64" alt=""/><h3>Conversas que acompanham sua equipe.</h3>
      <p>Escolha uma conversa ou crie uma pela barra lateral.</p></div>
  </div>;

  return <>
    <ConversationPresence conversationId={conversationId} uid={uid} draft={draft} cached={cached || !online} onError={onError}/>
    <div className="message-search">
      <label htmlFor="search-message-body">Pesquisar mensagens carregadas</label>
      <input id="search-message-body" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar texto no histórico"/>
      <button type="button" aria-pressed={pinnedOnly} onClick={() => setPinnedOnly(v => !v)}>Somente fixadas</button>
      {(cached || !online) && <p className="mini-label" role="status">{online ? 'Histórico em cache; aguardando confirmação do servidor.' : 'Sem conexão. Mensagens pendentes serão sincronizadas ao reconectar, enquanto esta sessão estiver aberta.'}</p>}
      {messages.length >= 500 && <p className="mini-label">Limite de 500 mensagens nesta janela; busca não cobre o histórico completo.</p>}
      {(search || pinnedOnly) && <p className="mini-label" role="status">{filtered.length} resultados em {messages.length} mensagens carregadas.</p>}
    </div>
    <div className="messages" ref={historyRef} onScroll={e=>{const n=e.currentTarget;nearEnd.current=n.scrollHeight-n.scrollTop-n.clientHeight<80;}} aria-label="Histórico de mensagens" aria-live="polite">
      {messages.length >= windowSize && windowSize < 500 && <button type="button" className="older-button"
        onClick={() => setWindowSize(n => Math.min(n + 50, 500))}>Carregar mensagens anteriores</button>}
      {messages.length === 0 && <div className="empty-state"><h3>A conversa começou.</h3>
        <p>Envie a primeira mensagem para testar a sincronização.</p></div>}
      {messages.length>0&&filtered.length===0&&<div className="empty-state" role="status"><h3>Nenhuma mensagem encontrada</h3><p>Altere a pesquisa ou o filtro de fixadas.</p></div>}
      {filtered.map(message => <MessageCard key={message.id} conversationId={conversationId}
        message={message} uid={uid} receipt={reads[otherUid]}
        original={message.replyToId ? messageBodies.get(message.replyToId) : undefined}
        onReply={setReply} onEdit={item => { setEditing(item); setEditDraft(item.body); }}
        onForward={item => { setForwarding(item); setDestination(''); }} canPin={canPin} onError={onError}/>)}
    </div>
    {forwarding && <form className="edit-form" onSubmit={submitForward}>
      <label htmlFor="forward-destination">Encaminhar texto para conversa</label>
      <select id="forward-destination" required value={destination} onChange={e => setDestination(e.target.value)}>
        <option value="">Escolha a conversa</option>
        {conversations.filter(c => c.id !== conversationId).map(c => <option key={c.id} value={c.id}>{c.title || c.memberIds.filter(m => m !== uid).join(', ')}</option>)}
      </select>
      <button type="submit" disabled={!destination || forwardBusy}>Confirmar encaminhamento</button>
      <button type="button" onClick={() => setForwarding(null)}>Cancelar encaminhamento</button>
    </form>}
    {reply && <div className="reply-banner">
      <span>Respondendo: {(messageBodies.get(reply.id) ?? 'Mensagem anterior').slice(0, 90)}</span>
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
      <button type="submit" disabled={busy || !draft.trim()}>{busy ? (!online || cached ? 'Aguardando conexão…' : 'Enviando…') : 'Enviar'}</button>
    </form>
    <AudioRecorder conversationId={conversationId} uid={uid} onError={onError} />
    <p className="legal-note">Mensagens armazenadas sem criptografia ponta a ponta; recibo de leitura aparece quando a conversa está visível.</p>
  </>;
}
