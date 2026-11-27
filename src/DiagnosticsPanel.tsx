import {useState,useEffect} from 'react';
import {emptyDiagnostics,incrementDiagnostic,type DiagnosticCounts} from './diagnostics';
let counts=emptyDiagnostics();
const subscribers=new Set<(value:DiagnosticCounts)=>void>();
export function recordDiagnostic(error:unknown){counts=incrementDiagnostic(counts,error);subscribers.forEach(fn=>fn(counts));}
export function DiagnosticsPanel(){
 const [snapshot,setSnapshot]=useState(counts);
 const [notice,setNotice]=useState('');
 useEffect(()=>{subscribers.add(setSnapshot);return()=>{subscribers.delete(setSnapshot);};},[]);
 async function copy(){
  try{await navigator.clipboard.writeText(JSON.stringify({environment:'emulator',scope:'browser tab; client errors only',counts:snapshot},null,2));setNotice('Resumo técnico copiado.');}
  catch{setNotice('Não foi possível copiar. Consulte os contadores exibidos.');}
 }
 const labels={permission:'Permissão',network:'Conexão',auth:'Autenticação',quota:'Limite de uso',unexpected:'Outros'};
 return <details className="privacy-panel"><summary>Diagnóstico local</summary><p>Contadores desta aba, sem conteúdo de conversas nem envio externo. Não representam métricas do servidor.</p>
 <dl>{Object.entries(snapshot).map(([k,v])=><div key={k}><dt>{labels[k as keyof typeof labels]}</dt><dd>{v}</dd></div>)}</dl>
 <button type="button" onClick={()=>void copy()}>Copiar resumo técnico</button>
 <button type="button" onClick={()=>{counts=emptyDiagnostics();subscribers.forEach(fn=>fn(counts));setNotice('Contadores zerados.');}}>Zerar diagnóstico</button>
 {notice&&<p role="status">{notice}</p>}</details>;
}
