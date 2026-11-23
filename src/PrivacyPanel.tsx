import { useEffect, useState, type FormEvent } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import {
  blockUser, createSettingsIfMissing, DEFAULT_SETTINGS, saveDisplayName,
  unblockUser, updatePreference, type PrivateSettings
} from './privacy-data';

export function PrivacyPanel({ uid, onError, onSettings }: {
  uid: string; onError: (error: unknown) => void;
  onSettings: (settings: PrivateSettings) => void;
}) {
  const [settings, setSettings] = useState<PrivateSettings>(DEFAULT_SETTINGS);
  const [currentName, setCurrentName] = useState('');
  const [newName, setNewName] = useState('');
  const [blockUid, setBlockUid] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    void createSettingsIfMissing(uid).then(() => {
      if (!active) return;
      unsubscribe = watchUserSettings(uid, s => { setSettings(s); onSettings(s); }, onError);
    }).catch(onError);
    return () => { active = false; unsubscribe(); };
  }, [uid, onSettings, onError]);

  useEffect(() => onSnapshot(doc(db, 'profiles', uid), snapshot => {
    if (snapshot.exists()) setCurrentName(String(snapshot.data().displayName));
  }, onError), [uid, onError]);

  async function run(job: () => Promise<void>, success: string) {
    setBusy(true); setNotice('');
    try { await job(); setNotice(success); }
    catch (error) { onError(error); }
    finally { setBusy(false); }
  }

  async function changePreference(field: 'notificationsEnabled' | 'readReceiptsEnabled', enabled: boolean) {
    const previous = settings;
    const next = { ...settings, [field]: enabled };
    // Inputs controlados precisam refletir a alteração imediatamente; o snapshot
    // do Firestore confirma, ou o catch restaura o estado anterior.
    setSettings(next);
    onSettings(next);
    setBusy(true); setNotice('');
    try { await updatePreference(uid, field, enabled); setNotice('Preferências atualizadas.'); }
    catch (error) {
      setSettings(previous); onSettings(previous); onError(error);
    } finally { setBusy(false); }
  }

  return <details className="privacy-panel">
    <summary>Perfil e privacidade</summary>
    <p className="mini-label">Nome atual: {currentName || 'Carregando…'}</p>
    <form className="group-form" onSubmit={(e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      void run(async () => { await saveDisplayName(uid, newName); setNewName(''); }, 'Perfil atualizado.');
    }}>
      <label htmlFor="display-name">Alterar nome de exibição</label>
      <input id="display-name" minLength={2} maxLength={40} required value={newName}
        onChange={e => setNewName(e.target.value)} placeholder="Novo nome" />
      <button type="submit" disabled={busy || newName.trim().length < 2}>Salvar perfil</button>
    </form>
    <label className="switch-label"><input type="checkbox" checked={settings.notificationsEnabled}
      disabled={busy} onChange={e => void changePreference('notificationsEnabled', e.currentTarget.checked)}/>
      Notificações dentro do aplicativo</label>
    <label className="switch-label"><input type="checkbox" checked={settings.readReceiptsEnabled}
      disabled={busy} onChange={e => void changePreference('readReceiptsEnabled', e.currentTarget.checked)}/>
      Enviar confirmação de leitura</label>
    <form className="group-form" onSubmit={e => {
      e.preventDefault();
      void run(async () => { await blockUser(uid, blockUid); setBlockUid(''); }, 'Usuário bloqueado.');
    }}>
      <label htmlFor="block-uid">Bloquear pessoa por UID</label>
      <input id="block-uid" value={blockUid} onChange={e => setBlockUid(e.target.value)} placeholder="UID da pessoa" />
      <button disabled={busy || !blockUid.trim()} type="submit">Bloquear</button>
    </form>
    {settings.blockedUids.length > 0 && <div className="blocked-list"><p className="mini-label">Pessoas bloqueadas</p>
      {settings.blockedUids.map(target => <div key={target} className="blocked-row">
        <code>{target.slice(0, 12)}…</code>
        <button type="button" disabled={busy} onClick={() => void run(
          () => unblockUser(uid, target), 'Bloqueio desfeito.')}>Desbloquear</button>
      </div>)}</div>}
    {notice && <p role="status" className="group-notice">{notice}</p>}
  </details>;
}

import { watchSettings as watchUserSettings } from './privacy-data';
