import { useEffect, useState, type FormEvent } from 'react';
import { buildFileLink, createPrivateFile, loadPrivateFile, parseFileCode, type PrivateFile } from './attachments';

export function FilePanel({ uid, conversationId, onError }: {
  uid: string; conversationId: string | null; onError: (error: unknown) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState('');
  const [loaded, setLoaded] = useState<PrivateFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [failed, setFailed] = useState('');

  useEffect(() => {
    let active = true;
    const code = new URLSearchParams(window.location.search).get('file');
    if (!code) return;
    const parsed = parseFileCode(code);
    if (!parsed) { setFailed('Código de arquivo inválido.'); return; }
    void loadPrivateFile(parsed.conversationId, parsed.fileId).then(data => {
      if (active) setLoaded(data);
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
      setNotice('Arquivo gravado. Link válido por aproximadamente 23 horas para membros autenticados.');
      setFile(null);
      const input = document.getElementById('private-file') as HTMLInputElement | null;
      if (input) input.value = '';
    } catch (error) { onError(error); }
    finally { setBusy(false); }
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(link); setNotice('Link copiado.'); }
    catch { setNotice('Copie o link manualmente no campo abaixo.'); }
  }

  return <details className="file-panel">
    <summary>Arquivos privados e links temporários</summary>
    <p>Somente membros autenticados podem abrir o link. Limite local de 60 KB; TXT, PNG, JPG e PDF.</p>
    {conversationId && <form className="file-form" onSubmit={upload}>
      <label htmlFor="private-file">Escolher arquivo de teste</label>
      <input id="private-file" type="file" required accept=".txt,.png,.jpg,.jpeg,.pdf"
        onChange={e => setFile(e.target.files?.[0] ?? null)} />
      <button type="submit" disabled={!file || busy}>{busy ? 'Enviando…' : 'Criar link privado'}</button>
    </form>}
    {link && <div className="file-link">
      <label htmlFor="generated-file-link">Link para compartilhar com membros</label>
      <input id="generated-file-link" readOnly value={link} onFocus={e => e.currentTarget.select()} />
      <button type="button" onClick={() => void copyLink()}>Copiar link</button>
    </div>}
    {failed && <p role="alert">{failed}</p>}
    {loaded && <div className="file-loaded" role="status">
      <strong>{loaded.filename}</strong>
      <span>Expira: {loaded.expiresAt.toLocaleString('pt-BR')} · {(loaded.byteSize / 1024).toFixed(1)} KB</span>
      <a href={loaded.dataUrl} download={loaded.filename}>Baixar arquivo privado</a>
    </div>}
    {notice && <p role="status">{notice}</p>}
  </details>;
}
