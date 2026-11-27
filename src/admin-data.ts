import { collection, doc, getDocFromServer, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
export type AccountStatus = 'active'|'suspended'|'banned';
export type AccountRole = 'member'|'moderator';
export type AccountControl = { role:AccountRole; status:AccountStatus; reason:string; actorId:string; updatedAt:Date|null };
export const DEFAULT_CONTROL:AccountControl={role:'member',status:'active',reason:'',actorId:'',updatedAt:null};
function parse(d:Record<string,any>|undefined):AccountControl {
  return d?{role:d.role==='moderator'?'moderator':'member',status:d.status==='banned'?'banned':d.status==='suspended'?'suspended':'active',
    reason:String(d.reason??''),actorId:String(d.actorId??''),updatedAt:d.updatedAt?.toDate?.()??null}:DEFAULT_CONTROL;
}
export function watchAccountControl(uid:string, receive:(control:AccountControl,exists:boolean)=>void, fail:(e:unknown)=>void){
  return onSnapshot(doc(db,'accountControls',uid),{includeMetadataChanges:true},s=>{
    if(!s.metadata.fromCache)receive(parse(s.data()),s.exists());
  },fail);
}
export function watchProfiles(receive:(profiles:{uid:string;displayName:string}[])=>void, fail:(e:unknown)=>void){
 return onSnapshot(query(collection(db,'profiles'),orderBy('createdAt','desc'),limit(50)),s=>receive(s.docs.map(d=>({uid:d.id,displayName:String(d.data().displayName)}))),fail);
}
export async function readControl(uid:string){return parse((await getDocFromServer(doc(db,'accountControls',uid))).data());}
export function watchAccountHistory(uid:string,receive:(rows:AccountControl[])=>void,fail:(e:unknown)=>void){
 return onSnapshot(query(collection(db,'accountControls',uid,'events'),orderBy('updatedAt','desc'),limit(50)),s=>receive(s.docs.map(x=>parse(x.data()))),fail);
}
export async function changeAccount(actorId:string,uid:string,role:AccountRole,status:AccountStatus,rawReason:string){
 const reason=rawReason.trim();if(uid===actorId||reason.length<10||reason.length>300)throw new Error('Selecione outra conta e informe um motivo de 10 a 300 caracteres.');
 const ref=doc(db,'accountControls',uid), event=doc(collection(ref,'events'));
 await runTransaction(db,async tx=>{
   const existing=await tx.get(ref);const old=parse(existing.data());
   if(existing.exists()&&old.role===role&&old.status===status)throw new Error('Nenhuma alteração de cargo ou situação.');
   const data={role,status,reason,actorId,updatedAt:serverTimestamp(),eventId:event.id};
   tx.set(ref,data);tx.set(event,data);
 });
}
