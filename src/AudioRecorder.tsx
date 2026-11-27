import { useEffect, useRef, useState } from 'react';
import { sendAudio } from './chat-extras';

const MAX_DURATION_MS = 60000, MAX_AUDIO_BYTES = 200000;
async function dataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result));
    reader.onerror=()=>reject(new Error('Não foi possível preparar o áudio.'));
    reader.readAsDataURL(blob);
  });
}
export function AudioRecorder({conversationId,uid,onError}:{
  conversationId:string;uid:string;onError:(error:unknown)=>void;
}) {
  const [consent,setConsent]=useState(false);
  const [recording,setRecording]=useState(false);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  const [preview,setPreview]=useState<{url:string;duration:number}|null>(null);
  const [seconds,setSeconds]=useState(0);
  const stream=useRef<MediaStream|null>(null), recorder=useRef<MediaRecorder|null>(null);
  const startedAt=useRef(0), timer=useRef<number|null>(null);
  const mode=useRef<'send'|'review'|'discard'>('review');
  const mounted=useRef(true);
  const supported=typeof MediaRecorder!=='undefined'&&!!navigator.mediaDevices?.getUserMedia&&MediaRecorder.isTypeSupported('audio/webm');
  function release() {
    if(timer.current!==null) window.clearInterval(timer.current);
    timer.current=null;
    stream.current?.getTracks().forEach(t=>t.stop());
    stream.current=null;recorder.current=null;
    if(mounted.current)setRecording(false);
  }
  useEffect(()=>{
    mounted.current=true;
    return ()=>{
      mounted.current=false;mode.current='discard';
      if(timer.current!==null)window.clearInterval(timer.current);
      if(recorder.current?.state==='recording')recorder.current.stop();
      stream.current?.getTracks().forEach(t=>t.stop());
    };
  },[]);
  async function send(value:{url:string;duration:number}) {
    setBusy(true);
    try {
      await sendAudio(conversationId,uid,value.url,value.duration);
      if(mounted.current){setPreview(null);setNotice('Áudio salvo no emulador.');}
    } catch(e){if(mounted.current){setPreview(value);onError(e);}}
    finally{if(mounted.current)setBusy(false);}
  }
  async function start() {
    if(!supported||!consent||busy||recording||preview)return;
    setBusy(true);setNotice('');setSeconds(0);mode.current='review';
    try{
      const media=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
      if(!mounted.current){media.getTracks().forEach(t=>t.stop());return;}
      stream.current=media;
      const rec=new MediaRecorder(media,{mimeType:'audio/webm',audioBitsPerSecond:16000});
      recorder.current=rec;const chunks:BlobPart[]=[];
      startedAt.current=Date.now();
      rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      rec.onerror=()=>{mode.current='discard';release();if(mounted.current)onError(new Error('Erro ao gravar áudio.'));};
      rec.onstop=()=>{
        const action=mode.current;const duration=Math.min(MAX_DURATION_MS,Math.max(1,Date.now()-startedAt.current));
        release();
        if(!mounted.current||action==='discard')return;
        setBusy(true);
        void (async()=>{
          try{
            const blob=new Blob(chunks,{type:'audio/webm'});
            if(!blob.size||blob.size>MAX_AUDIO_BYTES)throw new Error('Áudio excede 200 KB ou está vazio.');
            const value={url:await dataUrl(blob),duration};
            if(!mounted.current)return;
            if(action==='send')await send(value);else setPreview(value);
          }catch(e){if(mounted.current)onError(e);}
          finally{if(mounted.current)setBusy(false);}
        })();
      };
      rec.start(250);setRecording(true);
      timer.current=window.setInterval(()=>{
        const elapsed=Date.now()-startedAt.current;
        setSeconds(Math.min(60,Math.floor(elapsed/1000)));
        if(elapsed>=59000&&rec.state==='recording'){mode.current='review';rec.stop();}
      },250);
    }catch(e){release();if(mounted.current)onError(e);}
    finally{if(mounted.current)setBusy(false);}
  }
  function stop(action:'send'|'review'|'discard'){
    mode.current=action;
    if(recorder.current?.state==='recording')recorder.current.stop();
  }
  return <div className="audio-recorder">
    <label><input type="checkbox" checked={consent} onChange={e=>{setConsent(e.target.checked);if(!e.target.checked)setPreview(null);}} disabled={recording||busy}/> Autorizo a gravação da minha voz nesta conversa de teste</label>
    {!supported&&<span>Este navegador não permite áudio WebM.</span>}
    {supported&&!recording&&!preview&&<button type="button" disabled={busy||!consent} onClick={()=>void start()}>{busy?'Preparando áudio…':'Gravar mensagem de voz'}</button>}
    {recording&&<><span role="status">Microfone ativo. {seconds}s / 60s</span>
      <button type="button" onClick={()=>stop('review')}>Parar e revisar áudio</button>
      <button type="button" onClick={()=>stop('send')}>Parar e enviar áudio (máx. 60s)</button>
      <button type="button" onClick={()=>stop('discard')}>Cancelar gravação</button></>}
    {preview&&<><audio controls src={preview.url} aria-label="Prévia do áudio gravado"/><button type="button" disabled={busy||!consent} onClick={()=>void send(preview)}>Enviar áudio revisado</button><button type="button" disabled={busy} onClick={()=>setPreview(null)}>Descartar áudio</button></>}
    {notice&&<span role="status">{notice}</span>}
  </div>;
}
