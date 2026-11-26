import {
  collection, deleteDoc, doc, endBefore, getDoc, getDocs, limitToLast, onSnapshot,
  orderBy, query, serverTimestamp, setDoc, updateDoc,
  type DocumentData, type FirestoreError, type QueryDocumentSnapshot, type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { normalizeMessage } from './chat-model';
import type { ChatMessage } from './chat-data';

export const REACTION_OPTIONS = ['👍', '❤️', '😂', '🎉', '😮'] as const;
export type ReactionEmoji = typeof REACTION_OPTIONS[number];
export type MessageCursor = QueryDocumentSnapshot<DocumentData>;

function mapMessage(item: QueryDocumentSnapshot<DocumentData>): ChatMessage {
  const d = item.data();
  return {
    id: item.id,
    senderId: String(d.senderId),
    body: String(d.body),
    replyToId: typeof d.replyToId === 'string' ? d.replyToId : undefined,
    createdAt: d.createdAt?.toDate?.() ?? null,
    editedAt: d.editedAt?.toDate?.() ?? null,
    kind: d.kind === 'audio' ? 'audio' : undefined,
    audioData: d.kind === 'audio' && typeof d.audioData === 'string' ? d.audioData : undefined,
    durationMs: d.kind === 'audio' ? Number(d.durationMs) : undefined,
    deletedAt: d.deletedAt?.toDate?.() ?? null,
    pinned: d.pinned === true,
    forwarded: d.forwarded === true,
    pending: item.metadata.hasPendingWrites
  };
}

export function watchLatest(
  conversationId: string,
  receive: (items: ChatMessage[], oldest: MessageCursor | null) => void,
  fail: (error: FirestoreError) => void,
  windowSize = 50,
  onCache?: (cached: boolean) => void
): Unsubscribe {
  const q = query(collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'), limitToLast(Math.min(500, Math.max(50, windowSize))));
  return onSnapshot(q, { includeMetadataChanges: true }, snapshot => {
    onCache?.(snapshot.metadata.fromCache);
    receive(snapshot.docs.map(mapMessage), snapshot.docs[0] ?? null);
  }, fail);
}

export async function loadOlderMessages(
  conversationId: string, before: MessageCursor
): Promise<{ messages: ChatMessage[]; cursor: MessageCursor | null; hasMore: boolean }> {
  const result = await getDocs(query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'), endBefore(before), limitToLast(50)
  ));
  return {
    messages: result.docs.map(mapMessage),
    cursor: result.docs[0] ?? null,
    hasMore: result.size === 50
  };
}

export function mergeMessages(older: ChatMessage[], latest: ChatMessage[]): ChatMessage[] {
  const map = new Map(older.map(message => [message.id, message]));
  for (const message of latest) map.set(message.id, message);
  return [...map.values()].sort((a, b) =>
    (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0) || a.id.localeCompare(b.id));
}

export async function replyToMessage(
  conversationId: string, uid: string, body: string, originalId: string
): Promise<void> {
  await setDoc(doc(collection(db, 'conversations', conversationId, 'messages')), {
    senderId: uid,
    body: normalizeMessage(body),
    replyToId: originalId,
    createdAt: serverTimestamp()
  });
}

export async function editMessage(conversationId: string, messageId: string, body: string): Promise<void> {
  await updateDoc(doc(db, 'conversations', conversationId, 'messages', messageId), {
    body: normalizeMessage(body),
    editedAt: serverTimestamp()
  });
}

export type MessageReaction = { uid: string; emoji: ReactionEmoji };
export function watchReactions(
  conversationId: string, messageId: string,
  receive: (reactions: MessageReaction[]) => void,
  fail: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(collection(db, 'conversations', conversationId, 'messages', messageId, 'reactions'),
    snapshot => receive(snapshot.docs.map(item => ({
      uid: item.id,
      emoji: String(item.data().emoji) as ReactionEmoji
    }))), fail);
}

export async function setReaction(
  conversationId: string, messageId: string, uid: string, emoji: ReactionEmoji | null
): Promise<void> {
  const ref = doc(db, 'conversations', conversationId, 'messages', messageId, 'reactions', uid);
  if (emoji === null) await deleteDoc(ref);
  else {
    const existing = await getDoc(ref);
    if (existing.exists()) await updateDoc(ref, { emoji });
    else await setDoc(ref, { emoji, createdAt: serverTimestamp() });
  }
}

export type ReceiptStatus = { deliveredAt?: Date; readAt?: Date };
export type ReadReceipt = Record<string, ReceiptStatus>;
export function watchReads(
  conversationId: string, receive: (receipts: ReadReceipt) => void,
  fail: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(collection(db, 'conversations', conversationId, 'reads'), snapshot => {
    const out: ReadReceipt = {};
    for (const item of snapshot.docs) {
      const d = item.data();
      out[item.id] = {
        deliveredAt: d.lastDeliveredAt?.toDate?.(),
        readAt: d.lastReadAt?.toDate?.()
      };
    }
    receive(out);
  }, fail);
}
export async function markDelivered(conversationId: string, uid: string): Promise<void> {
  await setDoc(doc(db, 'conversations', conversationId, 'reads', uid),
    { lastDeliveredAt: serverTimestamp() }, { merge: true });
}
export async function markRead(conversationId: string, uid: string): Promise<void> {
  await setDoc(doc(db, 'conversations', conversationId, 'reads', uid),
    { lastReadAt: serverTimestamp() }, { merge: true });
}

export async function sendAudio(
  conversationId: string, uid: string, audioData: string, durationMs: number
): Promise<void> {
  if (!/^data:audio\/webm;base64,[A-Za-z0-9+/=]+$/.test(audioData)
    || audioData.length > 90000 || durationMs < 1 || durationMs > 20000) {
    throw new Error('Áudio inválido, longo demais ou incompatível. Grave no máximo 20 segundos.');
  }
  await setDoc(doc(collection(db, 'conversations', conversationId, 'messages')), {
    senderId: uid, body: 'Mensagem de voz', kind: 'audio', mimeType: 'audio/webm',
    audioData, durationMs: Math.round(durationMs), createdAt: serverTimestamp()
  });
}

// Janela de histórico autorizada e limitada; não é indexação global.
export function filterMessages(messages: ChatMessage[], term: string, pinnedOnly = false): ChatMessage[] {
  const fold = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');
  const needle = fold(term.trim());
  return messages.filter(m => (!pinnedOnly || (m.pinned && !m.deletedAt)) && (!needle || (!m.deletedAt && fold(m.body).includes(needle))));
}
export async function removeTextMessage(conversationId: string, messageId: string): Promise<void> {
  await updateDoc(doc(db, 'conversations', conversationId, 'messages', messageId), {
    body: 'Mensagem excluída', deletedAt: serverTimestamp(), pinned: false
  });
}
export async function pinMessage(conversationId: string, messageId: string, pinned: boolean): Promise<void> {
  await updateDoc(doc(db, 'conversations', conversationId, 'messages', messageId), { pinned });
}
export async function forwardText(uid: string, destinationId: string, body: string): Promise<void> {
  await setDoc(doc(collection(db, 'conversations', destinationId, 'messages')), {
    senderId: uid, body: normalizeMessage(body), forwarded: true, createdAt: serverTimestamp()
  });
}
