import {
  arrayRemove, arrayUnion, collection, doc, getDoc, onSnapshot, serverTimestamp,
  setDoc, updateDoc, writeBatch, type FirestoreError, type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { lookupName } from './chat-data';

export type PrivateSettings = {
  blockedUids: string[];
  notificationsEnabled: boolean;
  readReceiptsEnabled: boolean;
};

export const DEFAULT_SETTINGS: PrivateSettings = {
  blockedUids: [], notificationsEnabled: true, readReceiptsEnabled: true
};

export async function createSettingsIfMissing(uid: string): Promise<void> {
  const ref = doc(db, 'userPrivate', uid);
  if (!(await getDoc(ref)).exists()) await setDoc(ref, DEFAULT_SETTINGS);
}

export function watchSettings(
  uid: string, receive: (settings: PrivateSettings) => void,
  onError: (error: FirestoreError) => void
): Unsubscribe {
  return onSnapshot(doc(db, 'userPrivate', uid), snapshot => {
    if (!snapshot.exists()) { receive(DEFAULT_SETTINGS); return; }
    const data = snapshot.data();
    receive({
      blockedUids: Array.isArray(data.blockedUids) ? data.blockedUids.map(String) : [],
      notificationsEnabled: data.notificationsEnabled !== false,
      readReceiptsEnabled: data.readReceiptsEnabled !== false
    });
  }, onError);
}
export async function updatePreference(
  uid: string, field: 'notificationsEnabled' | 'readReceiptsEnabled', enabled: boolean
): Promise<void> {
  await updateDoc(doc(db, 'userPrivate', uid), { [field]: enabled });
}
export async function blockUser(uid: string, raw: string): Promise<void> {
  const target = raw.trim();
  if (!target || target === uid) throw new Error('Escolha outra conta.');
  await lookupName(target);
  await updateDoc(doc(db, 'userPrivate', uid), { blockedUids: arrayUnion(target) });
}
export async function unblockUser(uid: string, target: string): Promise<void> {
  await updateDoc(doc(db, 'userPrivate', uid), { blockedUids: arrayRemove(target) });
}
export async function saveDisplayName(uid: string, raw: string): Promise<void> {
  const name = raw.trim();
  if (name.length < 2 || name.length > 40) throw new Error('Nome deve conter de 2 a 40 caracteres.');
  await updateDoc(doc(db, 'profiles', uid), { displayName: name });
}
export async function sendReport(
  uid: string, conversationId: string, reportedUid: string, raw: string
): Promise<void> {
  const reason = raw.trim();
  if (reason.length < 10 || reason.length > 500) throw new Error('Descreva o motivo em 10 a 500 caracteres.');
  const report=doc(collection(db,'reports'));
  const batch=writeBatch(db);
  batch.set(report,{reporterId:uid,reportedUid,conversationId,reason,status:'open',createdAt:serverTimestamp()});
  batch.set(doc(db,'reportRate',uid),{reportId:report.id,createdAt:serverTimestamp()});
  await batch.commit();
}
