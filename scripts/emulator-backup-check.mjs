import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const auth='http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:';
const db='http://127.0.0.1:8080/v1/projects/demo-rfb-chat/databases/(default)/documents/qaBackup/probe';
const email='backup-probe@example.test',password='synthetic-local-only-2026';
async function request(url,body,method='POST',headers={}){
 const response=await fetch(url,{method,headers:{'Content-Type':'application/json',...headers},...(body?{body:JSON.stringify(body)}:{})});
 assert.ok(response.ok,'HTTP '+response.status+' '+new URL(url).pathname);return response.json();
}
if(process.argv[2]==='seed'||process.argv[2]==='restore'){
 assert.equal(process.env.FIRESTORE_EMULATOR_HOST,'127.0.0.1:8080');
 assert.equal(process.env.FIREBASE_AUTH_EMULATOR_HOST,'127.0.0.1:9099');
 const seed=process.argv[2]==='seed';
 const user=await request(auth+(seed?'signUp':'signInWithPassword')+'?key=fake-key',{email,password,returnSecureToken:true});
 assert.ok(user.localId);
 if(seed)await request(db,{fields:{marker:{stringValue:'rfb-backup-probe'},uid:{stringValue:user.localId}}},'PATCH',{Authorization:'Bearer owner'});
 else{
  const doc=await request(db,null,'GET',{Authorization:'Bearer owner'});
  assert.equal(doc.fields.marker.stringValue,'rfb-backup-probe');
  assert.equal(doc.fields.uid.stringValue,user.localId);
  console.log('RFB_BACKUP_RESTORE '+JSON.stringify({auth:true,firestore:true,synthetic:true}));
 }
}else{
 assert.equal(process.env.RFB_BACKUP_QA,'YES','Run only in isolated CI');
 const dir=mkdtempSync(join(tmpdir(),'rfb-backup-')),backup=join(dir,'export');
 const cli='node_modules/firebase-tools/lib/bin/firebase.js';
 function run(args){const p=spawnSync(process.execPath,[cli,'emulators:exec','--project','demo-rfb-chat','--only','auth,firestore',...args],{stdio:'inherit',env:process.env});assert.equal(p.status,0);}
 try{
  run(['--export-on-exit',backup,'node scripts/emulator-backup-check.mjs seed']);
  run(['--import',backup,'node scripts/emulator-backup-check.mjs restore']);
 }finally{rmSync(dir,{recursive:true,force:true});}
}
