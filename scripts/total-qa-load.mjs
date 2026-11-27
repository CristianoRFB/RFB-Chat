import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {writeFile,mkdir} from 'node:fs/promises';
import {initializeApp,deleteApp} from 'firebase/app';
import {getAuth,connectAuthEmulator,createUserWithEmailAndPassword} from 'firebase/auth';
import {getFirestore,connectFirestoreEmulator,doc,collection,setDoc,getDocFromServer,getDocsFromServer,query,orderBy,serverTimestamp,onSnapshot,writeBatch,terminate} from 'firebase/firestore';
assert.equal(process.env.RFB_QA_LOCAL,'YES');
const projectId='demo-rfb-chat';
assert.equal(process.env.GCLOUD_PROJECT ?? projectId,projectId);
const clients=[],unsubs=[], suffix=Date.now();
const denied=async(fn)=>{await assert.rejects(fn,e=>e.code==='permission-denied');};
async function client(i){
 const app=initializeApp({projectId,apiKey:'fake-api-key-for-emulator-only',authDomain:projectId+'.firebaseapp.com'},'qa-'+i);
 const auth=getAuth(app);connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
 const db=getFirestore(app);connectFirestoreEmulator(db,'127.0.0.1',8080);
 clients.push({app,db});
 const {user}=await createUserWithEmailAndPassword(auth,'qa-load-'+suffix+'-'+i+'@example.test','local-qa-synthetic-2026');
 const uid=user.uid;
 await setDoc(doc(db,'profiles',uid),{uid,displayName:'QA '+i,createdAt:serverTimestamp()});
 return {uid,db};
}
const quantile=(values,p)=>[...values].sort((a,b)=>a-b)[Math.ceil(values.length*p)-1];
async function runPhase(users,pairs,perSender,label){
 const targets=[],sent=new Map(),received=new Map(),failures=[];
 let concurrentCreates=0;
 for(let i=0;i<pairs;i++){
  const pair=users.slice(i*2,i*2+2),ids=pair.map(x=>x.uid).sort(),id='dm_'+ids.join('_');
  const create=async u=>{try{await setDoc(doc(u.db,'conversations',id),{kind:'dm',memberIds:ids,createdBy:u.uid,createdAt:serverTimestamp()});return 'created';}catch(e){if(e.code!=='permission-denied')throw e;assert.equal((await getDocFromServer(doc(u.db,'conversations',id))).exists(),true);return 'existing';}};
  const res=await Promise.all(pair.map(create));assert.equal(res.filter(x=>x==='created').length,1);concurrentCreates++;
  for(const u of pair){
   const c=collection(u.db,'conversations',id,'messages');
   await new Promise((resolve,reject)=>{
    const off=onSnapshot(query(c,orderBy('createdAt','asc')),{includeMetadataChanges:true},snap=>{
     if(snap.metadata.fromCache)return;
     for(const d of snap.docs){const k=id+'/'+d.id;if(!d.metadata.hasPendingWrites&&d.data().senderId!==u.uid&&sent.has(k)&&!received.has(k))received.set(k,performance.now()-sent.get(k));}
     resolve();
    },e=>{failures.push(e.code);reject(e);});unsubs.push(off);
   });
   targets.push({u,c,id});
  }
 }
 const start=performance.now();
 await Promise.all(targets.map(async({u,c,id})=>{for(let i=0;i<perSender;i++){const ref=doc(c),key=id+'/'+ref.id;sent.set(key,performance.now());await setDoc(ref,{senderId:u.uid,body:'QA '+label+' '+i,createdAt:serverTimestamp()});}}));
 const deadline=performance.now()+15000;
 while(received.size<sent.size&&performance.now()<deadline)await new Promise(r=>setTimeout(r,25));
 assert.equal(failures.length,0);assert.equal(received.size,sent.size,'peer received every sent document');
 for(const {c} of targets){const snap=await getDocsFromServer(c);assert.equal(snap.size,2*perSender);assert.equal(new Set(snap.docs.map(d=>d.id)).size,snap.size);}
 const dur=performance.now()-start;const ms=[...received.values()];
 return {label,pairs,clients:targets.length,concurrentCreates,sent:sent.size,received:received.size,duplicates:0,errors:failures.length,durationMs:Math.round(dur),messagesPerSecond:+(sent.size/(dur/1000)).toFixed(2),p50Ms:+quantile(ms,.5).toFixed(2),p95Ms:+quantile(ms,.95).toFixed(2),maxMs:+Math.max(...ms).toFixed(2),samplesMs:ms.map(x=>+x.toFixed(2))};
}
try{
 const users=[];for(let i=0;i<10;i++)users.push(await client(i));
 const low=await runPhase(users.slice(0,2),1,10,'single-pair');
 const load=await runPhase(users.slice(2),4,10,'four-pairs');
 const a=users[0],b=users[1],outside=users[2],id='dm_'+[a.uid,b.uid].sort().join('_');
 const c=collection(a.db,'conversations',id,'messages');
 await denied(()=>getDocFromServer(doc(outside.db,'conversations',id)));
 await denied(()=>getDocsFromServer(collection(outside.db,'conversations',id,'messages')));
 await denied(()=>setDoc(doc(c),{senderId:b.uid,body:'forged',createdAt:serverTimestamp()}));
 await denied(()=>setDoc(doc(c),{senderId:a.uid,body:'x'.repeat(2001),createdAt:serverTimestamp()}));
 await denied(()=>setDoc(doc(c),{senderId:a.uid,body:' ',createdAt:serverTimestamp()}));
 const report=async()=>{const ref=doc(collection(a.db,'reports')),batch=writeBatch(a.db);batch.set(ref,{reporterId:a.uid,reportedUid:b.uid,conversationId:id,reason:'Synthetic concurrency test',status:'open',createdAt:serverTimestamp()});batch.set(doc(a.db,'reportRate',a.uid),{reportId:ref.id,createdAt:serverTimestamp()});return batch.commit();};
 const race=await Promise.allSettled([report(),report()]);assert.equal(race.filter(x=>x.status==='fulfilled').length,1);assert.equal(race.filter(x=>x.status==='rejected'&&x.reason.code==='permission-denied').length,1);
 const result={environment:'Firebase Auth and Firestore emulators, authenticated Web SDK, no production',phases:[low,load],negativeChecks:5,reportRace:{accepted:1,denied:1},sha:process.env.GITHUB_SHA??null,run:process.env.GITHUB_RUN_ID??null};
 await mkdir('qa-evidence',{recursive:true});await writeFile('qa-evidence/load.json',JSON.stringify(result,null,2));console.log('RFB_QA_RESULT '+JSON.stringify(result));
}finally{for(const off of unsubs)off();await Promise.allSettled(clients.map(async c=>{await terminate(c.db);await deleteApp(c.app);}));}
