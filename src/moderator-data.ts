import {
  collection, doc, limit, onSnapshot, orderBy, query, where, serverTimestamp, writeBatch,
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
  reviewedBy?: string;
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
      status: d.status as ModerationReport['status'], reviewedBy: typeof d.reviewedBy==='string'?d.reviewedBy:undefined,
      createdAt: d.createdAt?.toDate?.() ?? null };
  })), fail);
}
export async function setModerationStatus(id: string, status: 'reviewed' | 'closed',actorId:string): Promise<void> {
  const report=doc(db,'reports',id),batch=writeBatch(db);
  batch.update(report,{status,resolvedAt:serverTimestamp(),reviewedBy:actorId});
  batch.set(doc(report,'events',status),{status,actorId,createdAt:serverTimestamp()});
  await batch.commit();
}
export function watchOwnReports(uid:string,receive:(reports:{id:string;status:string;reason:string}[])=>void,fail:(e:unknown)=>void){
  return onSnapshot(query(collection(db,'reports'),where('reporterId','==',uid),limit(50)),s=>receive(s.docs.map(d=>({id:d.id,status:String(d.data().status),reason:String(d.data().reason)}))),fail);
}
export function watchReportHistory(id:string,receive:(events:{status:string;actorId:string;createdAt:Date|null}[])=>void,fail:(e:unknown)=>void){
  return onSnapshot(collection(db,'reports',id,'events'),s=>receive(s.docs.map(d=>({status:String(d.data().status),actorId:String(d.data().actorId),createdAt:d.data().createdAt?.toDate?.()??null}))),fail);
}
