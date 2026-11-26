import { useEffect, useState, type FormEvent } from 'react';
import { buildFileLink, createPrivateFile, deletePrivateFile, loadPrivateFile, parseFileCode, watchFileAvailability, watchMediaIndex, type MediaEntry, type PrivateFile } from './attachments';

export function FilePanel({ uid, conversationId, onError }: {
  uid: string; conversationId: string | null; onError: (error: unknown) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [loaded, setLoaded] = useState<PrivateFile | null>(null);
  const [currentRef, setCurrentRef] = useState<{ conversationId: string; fileId: string } | null>(null);
  const [uploadedRef, setUploadedRef] = useState<{ conversationId: string; fileId: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [failed, setFailed] = useState('');
  const [gallery, setGallery] = useState<MediaEntry[]>([]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()),1000); return () => clearInterval(timer); },[]);
  useEffect(() => {
    setGallery([]);
    if (!conversationId) return;
    return watchMediaIndex(conversationId,setGallery,error => {setGallery([]); onError(error);});
  },[conversationId,onError]);
  useEffect(() => {
    if (loaded && loaded.expiresAt.getTime() <= now) { setLoaded(null); setFailed('Arquivo expirado.'); }
  },[loaded,now]);
  useEffect(()=>{
    if(!currentRef||!loaded)return;
    return watchFileAvailability(currentRef.conversationId,currentRef.fileId,()=>{
      setLoaded(null);setCurrentRef(null);setFailed('Arquivo indisponível. Verifique o acesso, a sessão e a validade do link.');
    });
  },[currentRef,loaded]);
  async function openGallery(id: string) {
    if (!conversationId) return;
    setBusy(true); setLoaded(null); setUploadedRef(null); setLink(''); setFailed('');
    try { const value = await loadPrivateFile(conversationId,id); setLoaded(value); setCurrentRef({conversationId,fileId:id}); }
    catch (error) { setFailed('Arquivo indisponível. Verifique o acesso, a sessão e a validade do link.'); onError(error); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    let active = true;
    const code = new URLSearchParams(window.location.search).get('file');
    if (!code) return;
    const parsed = parseFileCode(code);
    if (!parsed) { setFailed('Código de arquivo inválido.'); return; }
    void loadPrivateFile(parsed.conversationId, parsed.fileId).then(data => {
      if (active) {
        setLoaded(data);
        setCurrentRef(parsed);
      }
    }).catch(error => {
      if (active) setFailed('Arquivo indisponível. Verifique o acesso, a sessão e a validade do link.');
      onError(error);
    });
    return () => { active = false; };
  }, [onError]);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !conversationId) return;
    setBusy(true); setNotice(''); setFailed('');
    try {
      const fileId = await createPrivateFile(conversationId, uid, file);
      const url = buildFileLink(window.location.origin + window.location.pathname, conversationId, fileId);
      setLink(url);
      setUploadedRef({ conversationId, fileId });
      setNotice('Arquivo gravado. Link válido por aproximadamente 23 horas para membros autenticados.');
      setFile(null);
      const input = document.getElementById('private-file') as HTMLInputElement | null;
      if (input) input.value = '';
    } catch (error) { onError(error); }
    finally { setBusy(false); }
  }

  async function removeFile() {
    const selected = uploadedRef ?? (loaded?.ownerId === uid ? currentRef : null);
    if (!selected) return;
    setBusy(true); setFailed(''); setNotice('');
    try {
      await deletePrivateFile(selected.conversationId, selected.fileId);
      setUploadedRef(null); setCurrentRef(null); setLoaded(null); setLink('');
      setFailed('');
      setNotice('Arquivo excluído e link revogado. A remoção é definitiva.');
      const url = new URL(window.location.href);
      if (url.searchParams.has('file')) {
        url.searchParams.delete('file');
        window.history.replaceState(null, '', url);
      }
    } catch (error) { onError(error); }
    finally { setBusy(false); }
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(link); setNotice('Link copiado.'); }
    catch { setNotice('Copie o link manualmente no campo abaixo.'); }
  }

  return <details className="file-panel">
    <summary>Arquivos privados e links temporários</summary>
    <p>Somente membros autenticados podem abrir o link. Limite local de 300 KB; TXT, PNG, JPG, PDF, WebM e MP4. Imagens maiores podem ser comprimidas automaticamente.</p>
    {conversationId && <form className="file-form" onSubmit={upload}>
      <label htmlFor="private-file">Escolher arquivo de teste</label>
      <input id="private-file" type="file" required accept=".txt,.png,.jpg,.jpeg,.pdf,.webm,.mp4"
        onChange={e => setFile(e.target.files?.[0] ?? null)} />
      <button type="submit" disabled={!file || busy}>{busy ? 'Enviando…' : 'Criar link privado'}</button>
    </form>}
    {link && <div className="file-link">
      <label htmlFor="generated-file-link">Link para compartilhar com membros</label>
      <input id="generated-file-link" readOnly value={link} onFocus={e => e.currentTarget.select()} />
      <button type="button" onClick={() => void copyLink()}>Copiar link</button>
      {uploadedRef && <button type="button" disabled={busy}
        onClick={() => void removeFile()}>Excluir arquivo e revogar link</button>}
    </div>}
    {conversationId && <section aria-label="Galeria de mídias">
      <h3>Mídias compartilhadas</h3>
      <p className="mini-label">Até 50 arquivos recentes; conteúdo carregado somente ao abrir.</p>
      {gallery.filter(item => item.expiresAt.getTime() > now).length === 0 && <p>Nenhuma mídia ativa nesta conversa.</p>}
      {gallery.filter(item => item.expiresAt.getTime() > now).map(item => <div className="file-link" key={item.id}>
        <strong>{item.filename}</strong><span>{Math.ceil(item.byteSize/1000)} KB · {item.mimeType}</span>
        <button type="button" disabled={busy} onClick={() => void openGallery(item.id)}>Abrir {item.filename}</button>
      </div>)}
    </section>}
    {failed && <p role="alert">{failed}</p>}
    {loaded && <div className="file-loaded" role="status">
      <strong>{loaded.filename}</strong>
      <span>Expira: {loaded.expiresAt.toLocaleString('pt-BR')} · {(loaded.byteSize / 1024).toFixed(1)} KB</span>
      {loaded.mimeType.startsWith('image/') && <img src={loaded.dataUrl} alt={'Prévia de '+loaded.filename} style={{maxWidth:'100%',maxHeight:240,objectFit:'contain'}}/>}
      {loaded.mimeType.startsWith('video/') && <video controls preload="metadata" src={loaded.dataUrl} aria-label={'Prévia de '+loaded.filename} style={{maxWidth:'100%',maxHeight:240}}/>}
      <a href={loaded.dataUrl} download={loaded.filename}>Baixar arquivo privado</a>
      {loaded.ownerId === uid && currentRef && <button type="button"
        disabled={busy} onClick={() => void removeFile()}>Excluir arquivo e revogar link</button>}
    </div>}
    {notice && <p role="status">{notice}</p>}
  </details>;
}
