import { useEffect, useState, type FormEvent } from 'react';
import {
  createChannel, sendChannelText, watchChannelMessages, watchChannels,
  type ChannelMessage, type GroupChannel
} from './channel-data';

export function GroupChannels({ groupId, uid, admin, onError }: {
  groupId: string; uid: string; admin: boolean; onError: (error: unknown) => void;
}) {
  const [channels, setChannels] = useState<GroupChannel[]>([]);
  const [activeId, setActiveId] = useState('');
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setChannels([]); setActiveId(''); setMessages([]);
    return watchChannels(groupId, setChannels, onError);
  }, [groupId, onError]);
  useEffect(() => {
    if (channels.length && !channels.some(item => item.id === activeId)) setActiveId(channels[0].id);
  }, [channels, activeId]);
  useEffect(() => {
    setMessages([]);
    if (!activeId) return;
    return watchChannelMessages(groupId, activeId, setMessages, onError);
  }, [groupId, activeId, onError]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    try {
      const id = await createChannel(groupId, uid, name, description);
      setName(''); setDescription(''); setActiveId(id);
    } catch (error) { onError(error); } finally { setBusy(false); }
  }
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeId || busy || !draft.trim()) return;
    setBusy(true);
    try {
      await sendChannelText(groupId, activeId, uid, draft);
      setDraft('');
    } catch (error) { onError(error); } finally { setBusy(false); }
  }
  return <section className="channel-section" aria-label="Canais do grupo">
    <details>
      <summary>Canais do grupo ({channels.length})</summary>
      {admin && <form className="channel-create" onSubmit={create}>
        <label htmlFor="channel-name">Nome do canal</label>
        <input id="channel-name" minLength={2} maxLength={40} required value={name}
          placeholder="avisos" onChange={e => setName(e.target.value)}/>
        <label htmlFor="channel-description">Descrição</label>
        <input id="channel-description" maxLength={300} value={description}
          placeholder="Assunto do canal" onChange={e => setDescription(e.target.value)}/>
        <button type="submit" disabled={busy || name.trim().length < 2}>Criar canal</button>
      </form>}
      <nav className="channel-nav" aria-label="Escolher canal">
        {channels.map(channel => <button type="button" key={channel.id}
          className={activeId === channel.id ? 'selected' : ''}
          aria-pressed={activeId === channel.id}
          onClick={() => setActiveId(channel.id)}># {channel.name}</button>)}
      </nav>
      {channels.length === 0 && <p>Nenhum canal criado. O administrador pode abrir um canal para a equipe.</p>}
      {activeId && <div className="channel-conversation">
        <p className="mini-label">{channels.find(item => item.id === activeId)?.description}</p>
        <div className="channel-messages" aria-label="Mensagens do canal" aria-live="polite">
          {messages.length === 0 && <p>Seja a primeira pessoa a escrever neste canal.</p>}
          {messages.map(message => <div className="channel-message" key={message.id}>
            <strong>{message.senderId === uid ? 'Você' : message.senderId.slice(0, 10)}</strong>
            <span>{message.body}</span>
          </div>)}
        </div>
        <form className="channel-composer" onSubmit={send}>
          <label className="visually-hidden" htmlFor="channel-message-text">Mensagem no canal</label>
          <input id="channel-message-text" maxLength={2000} required placeholder="Escrever no canal…"
            value={draft} onChange={e => setDraft(e.target.value)}/>
          <button type="submit" disabled={busy || !draft.trim()}>Enviar ao canal</button>
        </form>
      </div>}
    </details>
  </section>;
}
