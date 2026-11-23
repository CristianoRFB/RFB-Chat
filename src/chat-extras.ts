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
    pending: item.metadata.hasPendingWrites
  };
}

export function watchLatest(
  conversationId: string,
  receive: (items: ChatMessage[], oldest: MessageCursor | null) => void,
  fail: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'), limitToLast(50));
  return onSnapshot(q, { includeMetadataChanges: true }, snapshot =>
    receive(snapshot.docs.map(mapMessage), snapshot.docs[0] ?? null), fail);
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

export type ReadReceipt = Record<string, Date>;
export function watchReads(
  conversationId: string, receive: (receipts: ReadReceipt) => void,
  fail: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(collection(db, 'conversations', conversationId, 'reads'), snapshot => {
    const out: ReadReceipt = {};
    for (const item of snapshot.docs) {
      const d = item.data();
      const when = d.lastReadAt?.toDate?.();
      if (when) out[item.id] = when as Date;
    }
    receive(out);
  }, fail);
}
export async function markRead(conversationId: string, uid: string): Promise<void> {
  await setDoc(doc(db, 'conversations', conversationId, 'reads', uid),
    { lastReadAt: serverTimestamp() });
}
