import {
  collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc,
  type FirestoreError, type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

export type ModerationReport = {
  id: string;
  reporterId: string;
  reportedUid: string;
  conversationId: string;
  reason: string;
  status: 'open' | 'reviewed' | 'closed';
  createdAt: Date | null;
};
export function watchModerationQueue(
  receive: (reports: ModerationReport[]) => void,
  fail: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, snap => receive(snap.docs.map(item => {
    const d = item.data();
    return { id: item.id, reporterId: String(d.reporterId), reportedUid: String(d.reportedUid),
      conversationId: String(d.conversationId), reason: String(d.reason),
      status: d.status as ModerationReport['status'],
      createdAt: d.createdAt?.toDate?.() ?? null };
  })), fail);
}
export async function setModerationStatus(id: string, status: 'reviewed' | 'closed'): Promise<void> {
  await updateDoc(doc(db, 'reports', id), { status, resolvedAt: serverTimestamp() });
}
