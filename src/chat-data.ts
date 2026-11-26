import {
  addDoc, arrayRemove, arrayUnion, collection, doc, getDoc, limitToLast, onSnapshot, orderBy,
  query, serverTimestamp, setDoc, updateDoc, where,
  type DocumentData, type FirestoreError, type QueryDocumentSnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { dmId, normalizeMessage } from './chat-model';

export type ChatConversation = {
  id: string;
  kind: 'dm' | 'group';
  title?: string;
  adminIds?: string[];
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
  deletedAt?: Date | null;
  pinned?: boolean;
  forwarded?: boolean;
  kind?: 'audio';
  audioData?: string;
  durationMs?: number;
};

function toConversation(snapshot: QueryDocumentSnapshot<DocumentData>): ChatConversation {
  const d = snapshot.data();
  return {
    id: snapshot.id,
    kind: d.kind === 'group' ? 'group' : 'dm',
    title: typeof d.title === 'string' ? d.title : undefined,
    adminIds: Array.isArray(d.adminIds) ? d.adminIds.map(String) : undefined,
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

// Grupos começam somente com seu criador. Convites exigem aceitação explícita.
export async function createGroup(uid: string, rawTitle: string): Promise<string> {
  const title = rawTitle.trim();
  if (title.length < 2 || title.length > 80) throw new Error('O grupo precisa de 2 a 80 caracteres.');
  const id = 'group_' + doc(collection(db, 'conversations')).id;
  await setDoc(doc(db, 'conversations', id), {
    kind: 'group', title, createdBy: uid, adminIds: [uid],
    memberIds: [uid], createdAt: serverTimestamp()
  });
  return id;
}

export async function sendGroupInvite(groupId: string, uid: string, rawTargetUid: string): Promise<void> {
  const targetUid = rawTargetUid.trim();
  if (!targetUid || targetUid === uid) throw new Error('Informe o UID de outra pessoa.');
  await lookupName(targetUid);
  await setDoc(doc(db, 'conversations', groupId, 'invites', targetUid), {
    targetUid, invitedBy: uid, status: 'pending', createdAt: serverTimestamp()
  });
}

export async function acceptGroupInvite(groupId: string, uid: string): Promise<void> {
  const invite = doc(db, 'conversations', groupId.trim(), 'invites', uid);
  const snapshot = await getDoc(invite);
  if (!snapshot.exists()) throw new Error('Convite não encontrado para esta conta.');
  if (snapshot.data().status === 'declined') throw new Error('Convite recusado anteriormente.');
  if (snapshot.data().status === 'pending') await updateDoc(invite, { status: 'accepted' });
  // A Rules confirma a existência do convite aceito, em vez de confiar no navegador.
  await updateDoc(doc(db, 'conversations', groupId.trim()), { memberIds: arrayUnion(uid) });
}

export async function declineGroupInvite(groupId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'conversations', groupId.trim(), 'invites', uid), { status: 'declined' });
}

export async function editGroupTitle(groupId: string, rawTitle: string): Promise<void> {
  const title = rawTitle.trim();
  if (title.length < 2 || title.length > 80) throw new Error('O grupo precisa de 2 a 80 caracteres.');
  await updateDoc(doc(db, 'conversations', groupId), { title });
}

export async function setGroupAdmin(groupId: string, uid: string, enabled: boolean): Promise<void> {
  await updateDoc(doc(db, 'conversations', groupId), {
    adminIds: enabled ? arrayUnion(uid) : arrayRemove(uid)
  });
}
