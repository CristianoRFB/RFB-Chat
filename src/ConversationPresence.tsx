import { useEffect, useRef, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

type Presence = { uid: string; updatedAt: number; typing: boolean };
const HEARTBEAT = 60_000, ONLINE_TTL = 90_000, TYPING_TTL = 12_000;
export function ConversationPresence({ conversationId, uid, draft, cached, onError }: {
  conversationId: string; uid: string; draft: string; cached: boolean; onError: (error: unknown) => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const [others, setOthers] = useState<Presence[]>([]);
  const [now, setNow] = useState(Date.now());
  const typedAt = useRef(0);
  const lastDraft = useRef(draft);
  const cacheRef = useRef(cached);
  cacheRef.current = cached;
  useEffect(() => {
    if (lastDraft.current !== draft) {
      typedAt.current = draft.trim() ? Date.now() : 0;
      lastDraft.current = draft;
    }
  }, [draft]);
  useEffect(() => {
    if (!enabled) return;
    const path = collection(db, 'conversations', conversationId, 'presence');
    const own = doc(path, uid);
    let mounted = true;
    let writing = false;
    let last = 0;
    let previousTyping = false;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (cacheRef.current || !navigator.onLine || document.visibilityState !== 'visible' || writing) return;
      const typing = t - typedAt.current < 8000;
      if (t - last < 5000 || (typing === previousTyping && t - last < HEARTBEAT)) return;
      writing = true;
      last = t;
      previousTyping = typing;
      void setDoc(own, { updatedAt: serverTimestamp(), typing }).catch(error => {
        if (mounted) onError(error);
      }).finally(() => {
        writing = false;
        if (!mounted) void deleteDoc(own).catch(() => undefined);
      });
    };
    const off = onSnapshot(path, snapshot => {
      setOthers(snapshot.docs.filter(s => s.id !== uid).map(s => ({
        uid: s.id, updatedAt: s.data().updatedAt?.toMillis?.() ?? 0, typing: s.data().typing === true
      })));
    }, onError);
    tick();
    const timer = window.setInterval(tick, 2500);
    return () => {
      mounted = false;
      clearInterval(timer);
      off();
      void deleteDoc(own).catch(() => undefined);
    };
  }, [enabled, conversationId, uid, onError]);
  const active = enabled && !cached ? others.filter(p => now >= p.updatedAt && now - p.updatedAt < ONLINE_TTL) : [];
  const typing = active.filter(p => p.typing && now - p.updatedAt < TYPING_TTL);
  return <div className="mini-label">
    <label><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)}/> Compartilhar atividade nesta conversa</label>
    {enabled && <p role="status">{cached ? 'Atividade indisponível sem confirmação do servidor.' : typing.length ? typing.length + ' participante(s) digitando…' : active.length ? active.length + ' participante(s) ativo(s) recentemente' : 'Nenhuma atividade recente compartilhada.'}</p>}
    {enabled && <small>Indicador aproximado, voluntário, restrito a esta conversa; expira em até 90 segundos.</small>}
  </div>;
}
