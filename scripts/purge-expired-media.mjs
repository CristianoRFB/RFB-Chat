// Exclusivamente Firebase Emulator local, sem credenciais ou endpoint externo.
const root='http://127.0.0.1:8080/v1/projects/demo-rfb-chat/databases/(default)/documents';
const prefix='projects/demo-rfb-chat/databases/(default)/documents/';
const headers={'Content-Type':'application/json',Authorization:'Bearer owner'};
async function post(path,body){
 const r=await fetch(root+path,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw new Error('Emulador retornou HTTP '+r.status);
 return r.json();
}
const results=await post(':runQuery',{structuredQuery:{from:[{collectionId:'attachments',allDescendants:true}],where:{fieldFilter:{field:{fieldPath:'expiresAt'},op:'LESS_THAN_OR_EQUAL',value:{timestampValue:new Date().toISOString()}}},limit:100}});
const names=results.flatMap(row=>row.document?[row.document.name]:[]).filter(n=>n.startsWith(prefix)&&/^conversations\/[a-zA-Z0-9_-]+\/attachments\/[a-zA-Z0-9_-]+$/.test(n.slice(prefix.length)));
if(names.length){
 await post(':commit',{writes:names.flatMap(name=>[{delete:name},{delete:name.replace('/attachments/','/mediaIndex/')}])});
}
console.log(JSON.stringify({environment:'demo-rfb-chat emulator only',deletedAttachments:names.length,limit:100}));
