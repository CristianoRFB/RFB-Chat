import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  createUserWithEmailAndPassword, onAuthStateChanged,
  signInWithEmailAndPassword, signOut, type User
} from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, isLocalEmulator } from './firebase';
import { createConversation, lookupName, watchConversations, type ChatConversation } from './chat-data';
import { MessageCenter } from './MessageCenter';
import { GroupControls } from './GroupControls';
import { PrivacyPanel } from './PrivacyPanel';
import { ReportPanel } from './ReportPanel';
import { FilePanel } from './FilePanel';
import { CallPanel } from './CallPanel';
import { GroupChannels } from './GroupChannels';
import { ModeratorDashboard } from './ModeratorDashboard';
import { NotificationsPanel } from './NotificationsPanel';
import { DEFAULT_SETTINGS, type PrivateSettings } from './privacy-data';
import { otherMember } from './chat-model';

function errorText(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === 'auth/email-already-in-use') return 'E-mail já cadastrado no emulador.';
  if (code === 'auth/invalid-email') return 'Informe um e-mail válido.';
  if (code === 'auth/weak-password') return 'A senha precisa ter pelo menos 6 caracteres.';
  if (code === 'auth/invalid-credential') return 'Credenciais não encontradas no emulador.';
  if (code === 'permission-denied') return 'Acesso negado pelas regras de segurança.';
  if (code === 'unavailable' || code === 'auth/network-request-failed') {
    return 'Emulador indisponível. Inicie npm run emulators em outro terminal.';
  }
  return error instanceof Error ? error.message : 'Ocorreu uma falha inesperada.';
}

function Login() {
  const [register, setRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (register) {
        const displayName = name.trim();
        if (displayName.length < 2 || displayName.length > 40) {
          throw new Error('Use um nome entre 2 e 40 caracteres.');
        }
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await setDoc(doc(db, 'profiles', result.user.uid), {
          uid: result.user.uid,
          displayName,
          createdAt: serverTimestamp()
        });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-wrap" id="conteudo">
    <section className="auth-card" aria-labelledby="auth-title">
      <p className="eyebrow">RFB LABS / LABORATÓRIO LOCAL</p>
      <h1 id="auth-title">{register ? 'Criar conta de teste' : 'Entrar no RFB Chat'}</h1>
      <p className="muted">Converse entre duas sessões usando os emuladores do Firebase. Nenhuma conta real é criada.</p>
      <form className="form" onSubmit={submit}>
        {register && <label>Nome de exibição
          <input autoComplete="nickname" value={name} minLength={2} maxLength={40} onChange={e => setName(e.target.value)} required />
        </label>}
        <label>E-mail de teste
          <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>
        <label>Senha
          <input type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={6} value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        {error && <p className="feedback error" role="alert">{error}</p>}
        <button className="primary" type="submit" disabled={busy}>{busy ? 'Aguarde…' : register ? 'Criar conta local' : 'Entrar no laboratório'}</button>
      </form>
      <button className="link-button" type="button" onClick={() => { setRegister(!register); setError(''); }}>
        {register ? 'Já tenho conta — entrar' : 'Criar uma conta no emulador'}
      </button>
    </section>
  </main>;
}

function Workspace({ user }: { user: User }) {
  const [profileReady, setProfileReady] = useState(false);
  const [privateSettings, setPrivateSettings] = useState<PrivateSettings>(DEFAULT_SETTINGS);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [target, setTarget] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // A criação no Auth Emulator dispara onAuthStateChanged antes de terminar
    // a gravação do perfil. Liberar o UID apenas após confirmação do servidor.
    return onSnapshot(doc(db, 'profiles', user.uid), { includeMetadataChanges: true }, snapshot => {
      setProfileReady(snapshot.exists() && !snapshot.metadata.hasPendingWrites);
    }, err => setError(errorText(err)));
  }, [user.uid]);

  useEffect(() => {
    setConversations([]);
    setSelectedId(null);
    return watchConversations(user.uid, setConversations, err => setError(errorText(err)));
  }, [user.uid]);

  useEffect(() => {
    if (!selectedId && conversations.length > 0) setSelectedId(conversations[0].id);
  }, [conversations, selectedId]);

  useEffect(() => {
    for (const conversation of conversations) {
      const uid = otherMember(conversation.memberIds, user.uid);
      if (!names[uid]) {
        void lookupName(uid).then(name => {
          setNames(previous => ({ ...previous, [uid]: name }));
        }).catch(() => {
          setNames(previous => ({ ...previous, [uid]: uid.slice(0, 10) }));
        });
      }
    }
    // Nome resolve uma vez por alteração de lista; cache do estado impede exibição em branco.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, user.uid]);

  async function newConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const id = await createConversation(user.uid, target);
      setTarget('');
      setSelectedId(id);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const onChildError = useCallback((error: unknown) => setError(errorText(error)), []);

  const current = conversations.find(item => item.id === selectedId);
  const other = current ? otherMember(current.memberIds, user.uid) : '';
  const title = current?.kind === 'group' ? (current.title ?? 'Grupo') : names[other] ?? (other ? other.slice(0, 12) : 'Selecione uma conversa');

  if (!profileReady) return <main className="profile-sync" id="conteudo" role="status">
    <p>Sincronizando o perfil de teste no Firestore Emulator…</p>
    <p>Se a mensagem persistir, confira o emulador e saia para tentar novamente.</p>
    {error && <p className="feedback error" role="alert">{error}</p>}
  </main>;

  return <main className="chat-layout" id="conteudo">
    <aside className="chat-sidebar" aria-label="Contas e conversas">
      <div className="account-box">
        <p className="mini-label">Conta de teste</p>
        <p className="account-email">{user.email}</p>
        <label className="mini-label" htmlFor="own-uid">Seu UID (compartilhe com a outra sessão)</label>
        <input className="uid-input" id="own-uid" value={user.uid} readOnly onFocus={event => event.currentTarget.select()} />
      </div>
      <div className="sidebar-head"><h2>Conversas</h2><span className="count">{conversations.length}</span></div>
      <form className="new-chat" onSubmit={newConversation}>
        <label htmlFor="target-uid">Iniciar conversa usando UID</label>
        <input id="target-uid" value={target} onChange={e => setTarget(e.target.value)} placeholder="UID da outra conta" required />
        <button type="submit" disabled={busy || !target.trim()}>Criar conversa</button>
      </form>
      <GroupControls uid={user.uid} current={current} onCreated={setSelectedId} onError={onChildError} />
      <PrivacyPanel uid={user.uid} onSettings={setPrivateSettings} onError={onChildError} />
      <ModeratorDashboard user={user} onError={onChildError} />
      <NotificationsPanel conversations={conversations} uid={user.uid} enabled={privateSettings.notificationsEnabled}
        onError={onChildError} onOpen={setSelectedId} />
      <label className="sidebar-search" htmlFor="search-conversations">Buscar conversa
        <input id="search-conversations" placeholder="Nome da pessoa ou grupo" value={search}
          onChange={e => setSearch(e.target.value)} />
      </label>
      <div className="conversation-list" role="group" aria-label="Suas conversas">
        {conversations.length === 0 && <p className="empty-side">Nenhuma conversa ainda. Crie duas contas em navegadores separados e compartilhe o UID.</p>}
        {conversations.filter(item => {
          const otherUid = otherMember(item.memberIds, user.uid);
          const name = item.kind === 'group' ? (item.title ?? '') : (names[otherUid] ?? otherUid);
          return name.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR'));
        }).map(item => {
          const recipient = otherMember(item.memberIds, user.uid);
          return <button key={item.id} type="button" className={'conversation' + (item.id === selectedId ? ' active' : '')}
            aria-pressed={item.id === selectedId} onClick={() => setSelectedId(item.id)}>
            <span className="avatar" aria-hidden="true">{(item.kind === 'group' ? item.title ?? 'G' : names[recipient] ?? recipient).slice(0, 1).toUpperCase()}</span>
            <span><strong>{item.kind === 'group' ? item.title : names[recipient] ?? recipient.slice(0, 12)}</strong>
              <small>{item.kind === 'group' ? item.memberIds.length + ' participantes' : 'Conversa individual'}</small></span>
          </button>;
        })}
      </div>
    </aside>
    <section className="chat-panel" aria-label="Mensagens">
      <header className="chat-header">
        <span className="avatar" aria-hidden="true">{title.slice(0, 1).toUpperCase()}</span>
        <div><h2>{title}</h2><p>{current?.kind === 'group' ? current.memberIds.length + ' membros · Grupo local' : selectedId ? 'Mensagens gravadas no emulador' : 'Conversa individual em tempo real'}</p></div>
      </header>
      {current?.kind === 'dm' && other && <CallPanel conversationId={current.id} uid={user.uid} otherUid={other} onError={onChildError} />}
      {error && <div className="feedback error" role="alert">{error} <button className="dismiss" type="button" onClick={() => setError('')}>Fechar</button></div>}
      {current?.kind === 'group' && <GroupChannels groupId={current.id} uid={user.uid}
        admin={!!current.adminIds?.includes(user.uid)} onError={onChildError} />}
      <MessageCenter key={selectedId ?? 'empty'} conversationId={selectedId} uid={user.uid} otherUid={current?.kind === 'group' ? '' : other}
        readEnabled={privateSettings.readReceiptsEnabled} onError={onChildError} />
      <FilePanel uid={user.uid} conversationId={selectedId} onError={onChildError} />
      <ReportPanel uid={user.uid} conversation={current} onError={onChildError} />
    </section>
  </main>;
}

function LocalChat() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [fatal, setFatal] = useState('');
  useEffect(() => onAuthStateChanged(auth, next => {
    setUser(next);
    setLoading(false);
  }, err => {
    setFatal(errorText(err));
    setLoading(false);
  }), []);

  return <div className="app-shell">
    <a href="#conteudo" className="skip">Pular para conteúdo</a>
    <header className="topbar">
      <span className="brand">RFB<span>Chat.</span></span>
      <span className="badge-local">LOCAL / EMULADOR / NÃO É PRODUÇÃO</span>
      {user && <button className="logout" type="button" onClick={() => void signOut(auth)}>Sair</button>}
    </header>
    {fatal ? <main id="conteudo" className="feedback error" role="alert">{fatal}</main>
      : loading ? <main id="conteudo" className="loading">Conectando ao emulador…</main>
      : user ? <Workspace key={user.uid} user={user} /> : <Login />}
  </div>;
}

export default function App() {
  if (!isLocalEmulator) return <main className="production-stop">
    <h1>RFB Chat — laboratório não publicado</h1>
    <p>Este build não se conecta a serviços reais. Consulte o README para iniciar os emuladores locais.</p>
  </main>;
  return <LocalChat />;
}
