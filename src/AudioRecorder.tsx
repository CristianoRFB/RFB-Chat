import { useEffect, useRef, useState } from 'react';
import { sendAudio } from './chat-extras';

async function dataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Não foi possível preparar o áudio.'));
    reader.readAsDataURL(blob);
  });
}

export function AudioRecorder({ conversationId, uid, onError }: {
  conversationId: string; uid: string; onError: (error: unknown) => void;
}) {
  const [consent, setConsent] = useState(false);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const startedAt = useRef(0);
  const autoStop = useRef<number | null>(null);
  const discard = useRef(false);

  const supported = typeof MediaRecorder !== 'undefined'
    && !!navigator.mediaDevices?.getUserMedia
    && MediaRecorder.isTypeSupported('audio/webm');

  function release() {
    if (autoStop.current !== null) window.clearTimeout(autoStop.current);
    autoStop.current = null;
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
    recorder.current = null;
    setRecording(false);
  }

  useEffect(() => () => {
    discard.current = true;
    if (autoStop.current !== null) window.clearTimeout(autoStop.current);
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop());
  }, []);

  async function start() {
    if (!supported || !consent || busy) return;
    discard.current = false;
    setNotice('');
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      stream.current = media;
      const rec = new MediaRecorder(media, { mimeType: 'audio/webm', audioBitsPerSecond: 16000 });
      recorder.current = rec;
      const chunks: BlobPart[] = [];
      startedAt.current = Date.now();
      rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      rec.onerror = () => { onError(new Error('Erro ao gravar áudio.')); release(); };
      rec.onstop = () => {
        setBusy(true);
        void (async () => {
          try {
            if (discard.current) return;
            const duration = Math.min(20000, Date.now() - startedAt.current);
            const blob = new Blob(chunks, { type: 'audio/webm' });
            if (!blob.size || blob.size > 65000) throw new Error('Arquivo de áudio excede o limite de 65 KB.');
            await sendAudio(conversationId, uid, await dataUrl(blob), duration);
            setNotice('Áudio salvo no emulador.');
          } catch (error) { onError(error); }
          finally { release(); setBusy(false); }
        })();
      };
      rec.start(250);
      setRecording(true);
      autoStop.current = window.setTimeout(() => {
        if (rec.state === 'recording') rec.stop();
      }, 19000);
    } catch (error) {
      release(); onError(error);
    }
  }

  function stop() {
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }

  return <div className="audio-recorder">
    <label><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
      disabled={recording || busy}/> Autorizo a gravação da minha voz nesta conversa de teste</label>
    {supported ? <button type="button" disabled={busy || (!consent && !recording)}
      onClick={() => { if (recording) stop(); else void start(); }}>
      {recording ? 'Parar e enviar áudio (máx. 20s)' : busy ? 'Salvando áudio…' : 'Gravar mensagem de voz'}
    </button> : <span>Este navegador não permite áudio WebM.</span>}
    {recording && <span role="status">Microfone ativo. A gravação será interrompida automaticamente.</span>}
    {notice && <span role="status">{notice}</span>}
  </div>;
}
