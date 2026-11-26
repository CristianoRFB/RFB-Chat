import { useCallback, useEffect, useRef, useState } from 'react';
import {
  acceptVoiceCall, createVoiceCall, endVoiceCall, nextCallId,
  publishIceCandidate, watchIceCandidates, watchVoiceCalls, type VoiceCall
} from './call-data';

type Props = { conversationId: string; uid: string; otherUid: string; onError: (error: unknown) => void };

export function CallPanel({ conversationId, uid, otherUid, onError }: Props) {
  const [consent, setConsent] = useState(false);
  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [muted,setMuted]=useState(false);
  const [packets,setPackets]=useState(0);
  const statsTimer=useRef<number|null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const mediaRef = useRef<MediaStream | null>(null);
  const callIdRef = useRef<string | null>(null);
  const iceOffRef = useRef<(() => void) | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const queuedLocal = useRef<RTCIceCandidateInit[]>([]);
  const queuedRemote = useRef<RTCIceCandidateInit[]>([]);
  const localCanWrite = useRef(false);
  const seenRemote = useRef(new Set<string>());
  const remoteApplying = useRef(false);

  const cleanup = useCallback(() => {
    if(statsTimer.current!==null)window.clearInterval(statsTimer.current);
    statsTimer.current=null;
    setPackets(0);setMuted(false);
    iceOffRef.current?.();
    iceOffRef.current = null;
    peerRef.current?.close();
    peerRef.current = null;
    mediaRef.current?.getTracks().forEach(track => track.stop());
    mediaRef.current = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    callIdRef.current = null;
    queuedLocal.current = [];
    queuedRemote.current = [];
    localCanWrite.current = false;
    seenRemote.current.clear();
    remoteApplying.current = false;
  }, []);

  useEffect(() => {
    setCalls([]); setStatus('');
    return watchVoiceCalls(conversationId, setCalls, onError);
  }, [conversationId, onError]);

  useEffect(() => () => cleanup(), [cleanup, conversationId]);

  const live = calls.find(item => item.status !== 'ended'
    && (item.initiatorId === uid || item.calleeId === uid));
  const incoming = live?.status === 'ringing' && live.calleeId === uid;
  const outgoing = live?.status === 'ringing' && live.initiatorId === uid;

  async function flushRemote(pc: RTCPeerConnection): Promise<void> {
    const items = queuedRemote.current.splice(0);
    for (const candidate of items) await pc.addIceCandidate(candidate);
  }

  async function flushLocal(callId: string) {
    localCanWrite.current = true;
    const candidates = queuedLocal.current.splice(0);
    for (const candidate of candidates) {
      try { await publishIceCandidate(conversationId, callId, uid, candidate); }
      catch (error) { onError(error); }
    }
  }

  async function startPeer(callId: string, documentExists: boolean) {
    if (!navigator.mediaDevices?.getUserMedia || typeof RTCPeerConnection === 'undefined') {
      throw new Error('Chamadas WebRTC não estão disponíveis neste navegador.');
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const pc = new RTCPeerConnection({ iceServers: [] });
    mediaRef.current = stream; peerRef.current = pc; callIdRef.current = callId;
    localCanWrite.current = documentExists;
    for (const track of stream.getAudioTracks()) pc.addTrack(track, stream);
    statsTimer.current=window.setInterval(()=>{
      if(pc.connectionState!=='connected')return;
      void pc.getStats().then(report=>{
        if(peerRef.current!==pc)return;
        let total=0;
        report.forEach(stat=>{if(stat.type==='inbound-rtp'&&(stat.kind==='audio'||stat.mediaType==='audio'))total+=Number(stat.packetsReceived)||0;});
        setPackets(total);
      }).catch(()=>undefined);
    },1000);
    pc.ontrack = event => {
      const remote = event.streams[0] ?? new MediaStream([event.track]);
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remote;
        void remoteAudioRef.current.play().catch(() => setStatus('Toque no áudio para ouvir.'));
      }
    };
    pc.onicecandidate = event => {
      if (!event.candidate) return;
      const candidate = event.candidate.toJSON();
      if (!localCanWrite.current) queuedLocal.current.push(candidate);
      else void publishIceCandidate(conversationId, callId, uid, candidate).catch(onError);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setStatus('Áudio P2P conectado nesta rede.');
      else if (pc.connectionState === 'failed') setStatus('Conexão direta não estabelecida. Não há servidor TURN.');
    };
    iceOffRef.current = watchIceCandidates(conversationId, callId, record => {
      if (record.senderId === uid || seenRemote.current.has(record.id)) return;
      seenRemote.current.add(record.id);
      if (!pc.remoteDescription) queuedRemote.current.push(record.candidate);
      else void pc.addIceCandidate(record.candidate).catch(onError);
    }, onError);
    return pc;
  }

  async function initiate() {
    if (busy || !consent || live) return;
    setBusy(true); setStatus('');
    let id: string | null = null;
    try {
      id = nextCallId(conversationId);
      const pc = await startPeer(id, false);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (!offer.sdp) throw new Error('Falha ao gerar oferta WebRTC.');
      await createVoiceCall(conversationId, id, uid, otherUid, offer.sdp);
      await flushLocal(id);
      setStatus('Chamando outra pessoa…');
    } catch (error) {
      cleanup(); onError(error);
    } finally { setBusy(false); }
  }

  async function accept() {
    if (busy || !consent || !live || !incoming) return;
    setBusy(true); setStatus('');
    try {
      const pc = await startPeer(live.id, true);
      await pc.setRemoteDescription({ type: 'offer', sdp: live.offer });
      await flushRemote(pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (!answer.sdp) throw new Error('Falha ao gerar resposta WebRTC.');
      await acceptVoiceCall(conversationId, live.id, answer.sdp);
      setStatus('Chamada aceita. Aguardando conexão direta…');
    } catch (error) {
      cleanup(); onError(error);
    } finally { setBusy(false); }
  }

  useEffect(() => {
    if (!live || live.status === 'ended') {
      if (callIdRef.current) cleanup();
      return;
    }
    if (live.status === 'connected' && live.initiatorId === uid && live.answer
      && callIdRef.current === live.id && peerRef.current
      && !peerRef.current.remoteDescription && !remoteApplying.current) {
      remoteApplying.current = true;
      const pc = peerRef.current;
      void pc.setRemoteDescription({ type: 'answer', sdp: live.answer }).then(
        () => flushRemote(pc)
      ).catch(onError).finally(() => { remoteApplying.current = false; });
    }
  }, [live?.id, live?.status, live?.answer, live?.initiatorId, uid, onError, cleanup]);

  async function end() {
    if (!live || busy) return;
    setBusy(true);
    try { await endVoiceCall(conversationId, live.id); setStatus('Chamada finalizada.'); }
    catch (error) { onError(error); }
    finally { cleanup(); setBusy(false); }
  }

  // Não é telefonia pública. Sem STUN/TURN/SFU, conexões externas podem falhar.
  return <details className="call-panel">
    <summary>Chamada de voz local (experimental)</summary>
    <label className="call-consent"><input type="checkbox" checked={consent} disabled={busy}
      onChange={event => setConsent(event.target.checked)}/>
      Concordo em ativar o microfone para esta chamada</label>
    <div className="call-actions">
      {!live && <button type="button" onClick={() => void initiate()} disabled={!consent || busy}>Iniciar chamada local</button>}
      {incoming && <button type="button" onClick={() => void accept()} disabled={!consent || busy}>Aceitar chamada</button>}
      {outgoing && <span role="status">Chamando…</span>}
      {live?.status === 'connected' && <span role="status">Chamada aceita</span>}
      {live && <button type="button" onClick={() => void end()} disabled={busy}>{incoming ? 'Recusar / Encerrar' : 'Encerrar chamada'}</button>}
    </div>
    {live?.status==='connected' && <><button type="button" aria-pressed={muted} onClick={()=>{const next=!muted;mediaRef.current?.getAudioTracks().forEach(t=>{t.enabled=!next;});setMuted(next);}}>{muted?'Ativar microfone':'Silenciar microfone'}</button><p role="status" data-testid="rtp-audio">Pacotes RTP de áudio recebidos: {packets}</p></>}
    <audio ref={remoteAudioRef} autoPlay controls aria-label="Áudio remoto da chamada"/>
    {status && <p role="status">{status}</p>}
    <p className="call-warning">Prova de conceito P2P no emulador. Sem TURN, gravação, garantia de conectividade externa ou chamadas em produção.</p>
  </details>;
}
