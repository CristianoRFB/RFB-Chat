import {
  addDoc, collection, doc, getDoc, limit, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, updateDoc, type FirestoreError, type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

export type VoiceCall = {
  id: string;
  initiatorId: string;
  calleeId: string;
  status: 'ringing' | 'connected' | 'ended';
  offer: string;
  answer?: string;
};

const callsCollection = (conversationId: string) => collection(db, 'conversations', conversationId, 'calls');

export function nextCallId(conversationId: string): string {
  return doc(callsCollection(conversationId)).id;
}

export async function createVoiceCall(
  conversationId: string, callId: string, initiatorId: string, calleeId: string, offer: string
): Promise<void> {
  await setDoc(doc(db, 'conversations', conversationId, 'calls', callId), {
    initiatorId, calleeId, offer, status: 'ringing', createdAt: serverTimestamp()
  });
}

export async function acceptVoiceCall(conversationId: string, callId: string, answer: string): Promise<void> {
  await updateDoc(doc(db, 'conversations', conversationId, 'calls', callId), {
    status: 'connected', answer, answeredAt: serverTimestamp()
  });
}

export async function endVoiceCall(conversationId: string, callId: string): Promise<void> {
  await updateDoc(doc(db, 'conversations', conversationId, 'calls', callId), {
    status: 'ended', endedAt: serverTimestamp()
  });
}

export function watchVoiceCalls(
  conversationId: string, receive: (calls: VoiceCall[]) => void,
  fail: (error: FirestoreError) => void
): Unsubscribe {
  const q = query(callsCollection(conversationId), orderBy('createdAt', 'desc'), limit(10));
  return onSnapshot(q, snapshot => receive(snapshot.docs.map(item => {
    const d = item.data();
    return {
      id: item.id,
      initiatorId: String(d.initiatorId),
      calleeId: String(d.calleeId),
      status: String(d.status) as VoiceCall['status'],
      offer: String(d.offer),
      answer: typeof d.answer === 'string' ? d.answer : undefined
    };
  })), fail);
}

export type IceRecord = { id: string; senderId: string; candidate: RTCIceCandidateInit };
export function watchIceCandidates(
  conversationId: string, callId: string,
  receive: (candidate: IceRecord) => void, fail: (error: FirestoreError) => void
): Unsubscribe {
  const candidates = collection(db, 'conversations', conversationId, 'calls', callId, 'ice');
  return onSnapshot(candidates, snapshot => {
    for (const change of snapshot.docChanges()) {
      if (change.type !== 'added') continue;
      try {
        const data = change.doc.data();
        receive({ id: change.doc.id, senderId: String(data.senderId),
          candidate: JSON.parse(String(data.candidate)) as RTCIceCandidateInit });
      } catch (error) { fail(error as FirestoreError); }
    }
  }, fail);
}

export async function publishIceCandidate(
  conversationId: string, callId: string, uid: string, candidate: RTCIceCandidateInit
): Promise<void> {
  const candidateJson = JSON.stringify(candidate);
  if (!candidateJson || candidateJson.length > 8000) throw new Error('ICE candidate maior que o permitido.');
  await addDoc(collection(db, 'conversations', conversationId, 'calls', callId, 'ice'), {
    senderId: uid, candidate: candidateJson, createdAt: serverTimestamp()
  });
}

export async function readVoiceCall(conversationId: string, callId: string): Promise<VoiceCall | null> {
  const snapshot = await getDoc(doc(db, 'conversations', conversationId, 'calls', callId));
  if (!snapshot.exists()) return null;
  const d = snapshot.data();
  return { id: snapshot.id, initiatorId: String(d.initiatorId),
    calleeId: String(d.calleeId), status: d.status as VoiceCall['status'],
    offer: String(d.offer), answer: typeof d.answer === 'string' ? d.answer : undefined };
}
