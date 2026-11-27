import {
  addDoc, collection, doc, limitToLast, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, updateDoc, type FirestoreError, type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { normalizeMessage } from './chat-model';

export type GroupChannel = { id: string; name: string; description: string };
export type ChannelMessage = { id: string; senderId: string; body: string; createdAt: Date | null; pending: boolean };

function path(conversationId: string) {
  return collection(db, 'conversations', conversationId, 'channels');
}
export function watchChannels(
  conversationId: string, success: (items: GroupChannel[]) => void,
  failed: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(path(conversationId), snapshot => success(snapshot.docs.map(item => ({
    id: item.id, name: String(item.data().name), description: String(item.data().description)
  }))), failed);
}
export async function createChannel(conversationId: string, uid: string, rawName: string, rawDescription: string): Promise<string> {
  const name = rawName.trim(), description = rawDescription.trim();
  if (name.length < 2 || name.length > 40 || description.length > 300) throw new Error('Nome de 2 a 40 e descrição até 300 caracteres.');
  const ref = doc(path(conversationId));
  await setDoc(ref, { name, description, createdBy: uid, createdAt: serverTimestamp() });
  return ref.id;
}
export async function renameChannel(conversationId: string, channelId: string, name: string, description: string): Promise<void> {
  if (name.trim().length < 2 || name.trim().length > 40 || description.trim().length > 300) throw new Error('Dados de canal inválidos.');
  await updateDoc(doc(path(conversationId), channelId), { name: name.trim(), description: description.trim() });
}
function messagePath(conversationId: string, channelId: string) {
  return collection(db, 'conversations', conversationId, 'channels', channelId, 'messages');
}
export function watchChannelMessages(conversationId: string, channelId: string,
  success: (items: ChannelMessage[]) => void, failed: (error: FirestoreError) => void): Unsubscribe {
  const q = query(messagePath(conversationId, channelId), orderBy('createdAt', 'asc'), limitToLast(50));
  return onSnapshot(q, { includeMetadataChanges: true }, snap => success(snap.docs.map(item => {
    const d = item.data();
    return { id: item.id, senderId: String(d.senderId), body: String(d.body),
      createdAt: d.createdAt?.toDate?.() ?? null, pending: item.metadata.hasPendingWrites };
  })), failed);
}
export async function sendChannelText(conversationId: string, channelId: string, uid: string, raw: string) {
  await addDoc(messagePath(conversationId, channelId), {
    senderId: uid, body: normalizeMessage(raw), createdAt: serverTimestamp()
  });
}
