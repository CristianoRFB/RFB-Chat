import {
  addDoc, collection, doc, getDoc, limitToLast, onSnapshot, orderBy,
  query, serverTimestamp, setDoc, where,
  type DocumentData, type FirestoreError, type QueryDocumentSnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { dmId, normalizeMessage } from './chat-model';

export type ChatConversation = {
  id: string;
  kind: 'dm';
  createdBy: string;
  memberIds: string[];
};

export type ChatMessage = {
  id: string;
  senderId: string;
  body: string;
  createdAt: Date | null;
  pending: boolean;
  replyToId?: string;
  editedAt?: Date | null;
};

function toConversation(snapshot: QueryDocumentSnapshot<DocumentData>): ChatConversation {
  const d = snapshot.data();
  return {
    id: snapshot.id,
    kind: 'dm',
    createdBy: String(d.createdBy),
    memberIds: Array.isArray(d.memberIds) ? d.memberIds.map(String) : []
  };
}

export function watchConversations(
  uid: string, receive: (items: ChatConversation[]) => void, fail: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(collection(db, 'conversations'), where('memberIds', 'array-contains', uid));
  return onSnapshot(q, snapshot => receive(snapshot.docs.map(toConversation)), fail);
}

export function watchMessages(
  conversationId: string, receive: (items: ChatMessage[]) => void, fail: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'), limitToLast(50)
  );
  return onSnapshot(q, { includeMetadataChanges: true }, snapshot => {
    receive(snapshot.docs.map(item => {
      const data = item.data();
      return {
        id: item.id,
        senderId: String(data.senderId),
        body: String(data.body),
        createdAt: data.createdAt?.toDate?.() ?? null,
        pending: item.metadata.hasPendingWrites
      };
    }));
  }, fail);
}

export async function lookupName(uid: string): Promise<string> {
  const snap = await getDoc(doc(db, 'profiles', uid));
  if (!snap.exists()) throw new Error('Conta de destino não encontrada no emulador.');
  return String(snap.data().displayName);
}

export async function createConversation(uid: string, targetUid: string): Promise<string> {
  const other = targetUid.trim();
  const id = dmId(uid, other);
  await lookupName(other);
  const ref = doc(db, 'conversations', id);
  // A leitura de um documento inexistente é negada pelas Rules. Criar primeiro.
  // Se duas sessões criarem a mesma DM, somente a primeira grava;
  // a segunda confirma que o documento já existe e pode ser lido pelo membro.
  try {
    await setDoc(ref, {
      kind: 'dm',
      createdBy: uid,
      memberIds: [uid, other].sort(),
      createdAt: serverTimestamp()
    });
  } catch (error) {
    const existing = await getDoc(ref).catch(() => null);
    if (!existing?.exists()) throw error;
  }
  return id;
}

export async function sendText(uid: string, conversationId: string, raw: string): Promise<void> {
  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    senderId: uid,
    body: normalizeMessage(raw),
    createdAt: serverTimestamp()
  });
}
