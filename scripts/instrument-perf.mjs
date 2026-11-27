// Executar SOMENTE em worktree descartável do benchmark. Nenhum dado pessoal registrado.
import fs from 'node:fs';
for(const path of ['src/chat-extras.ts','src/attachments.ts']){
 let text=fs.readFileSync(path,'utf8');
 const match=text.match(/import\s*\{[^}]*\bonSnapshot\b[^}]*\}\s*from 'firebase\/firestore';/s);
 if(!match)throw Error('Import não encontrado: '+path);
 text=text.replace(match[0],match[0].replace(/\bonSnapshot\b/,'onSnapshot as originalOnSnapshot'));
 text+='\nconst onSnapshot: typeof originalOnSnapshot = new Proxy(originalOnSnapshot,{apply(target,that,args){const key='+JSON.stringify(path)+';const w=window as unknown as {__rfbPerf?:Record<string,{active:number;started:number}>};const stats=(w.__rfbPerf??={});const entry=(stats[key]??={active:0,started:0});const off=Reflect.apply(target,that,args) as ()=>void;entry.active++;entry.started++;let done=false;return ()=>{if(!done){done=true;entry.active--;off();}};}});\n';
 fs.writeFileSync(path,text);
}
