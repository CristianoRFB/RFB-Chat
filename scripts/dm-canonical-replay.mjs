import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {doc,getDoc,setDoc,serverTimestamp} from 'firebase/firestore';
assert.equal(process.env.RFB_QA_LOCAL,'YES');
const baseline='4368f7127f45b8e0934363a6898f6fe6390f1fb5';
const old=execFileSync('git',['show',baseline+':firestore.rules'],{encoding:'utf8'});
const next=readFileSync('firestore.rules','utf8');
async function run(rules,expectReversed){
 const env=await initializeTestEnvironment({projectId:'demo-rfb-chat',firestore:{host:'127.0.0.1',port:8080,rules}});
 try{
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx=>{
   for(const uid of ['alice','bob','mallory'])await setDoc(doc(ctx.firestore(),'profiles',uid),{uid,displayName:uid,createdAt:new Date()});
  });
  const alice=env.authenticatedContext('alice').firestore(),mallory=env.authenticatedContext('mallory').firestore();
  const canonical=doc(alice,'conversations','dm_alice_bob'),reversed=doc(alice,'conversations','dm_bob_alice');
  await assertSucceeds(setDoc(canonical,{kind:'dm',createdBy:'alice',memberIds:['alice','bob'],createdAt:serverTimestamp()}));
  const data={kind:'dm',createdBy:'alice',memberIds:['bob','alice'],createdAt:serverTimestamp()};
  if(expectReversed)await assertSucceeds(setDoc(reversed,data));else await assertFails(setDoc(reversed,data));
  await assertSucceeds(getDoc(canonical));
  await assertFails(getDoc(doc(mallory,'conversations','dm_alice_bob')));
  // Existing legacy documents are not deleted, migrated or made unreadable.
  if(!expectReversed){
   await env.withSecurityRulesDisabled(async ctx=>setDoc(doc(ctx.firestore(),'conversations','dm_bob_alice'),{kind:'dm',createdBy:'alice',memberIds:['bob','alice'],createdAt:new Date()}));
   await assertSucceeds(getDoc(reversed));
  }
  return {canonicalCreate:'PASS',reversedCreate:expectReversed?'ALLOWED':'DENIED',memberRead:'PASS',outsiderRead:'DENIED',legacyRead:expectReversed?'NOT_APPLICABLE':'PASS'};
 }finally{await env.cleanup();}
}
const before=await run(old,true),after=await run(next,false);
console.log('RFB_DM_REPLAY '+JSON.stringify({baseline,before,after,checkout:process.env.GITHUB_SHA??null}));
