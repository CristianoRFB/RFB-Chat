// Provisionamento exclusivo do Auth Emulator; nunca executar contra produção.
// O emulador aceita tokens não assinados; não exponha suas portas fora do loopback.
const [uid,action,confirmation]=process.argv.slice(2);
if(!uid||!/^[A-Za-z0-9_-]{1,128}$/.test(uid)||!['grant','revoke'].includes(action)||confirmation!=='--confirm-local'){
 console.error('Uso: node scripts/set-local-admin.mjs UID grant|revoke --confirm-local');process.exit(2);
}
const endpoint='http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/demo-rfb-chat/accounts:update';
const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer owner'},body:JSON.stringify({localId:uid,customAttributes:JSON.stringify(action==='grant'?{admin:true}:{})}),signal:AbortSignal.timeout(10000)});
if(!response.ok)throw new Error('Auth Emulator recusou a operação HTTP '+response.status);
const result=await response.json();if(result.localId!==uid)throw new Error('UID de resposta inesperado.');
console.log('Operação de cargo principal local concluída: '+action+'. Saia e entre novamente para atualizar token.');
