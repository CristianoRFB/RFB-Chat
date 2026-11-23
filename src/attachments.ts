import { collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export const MAX_INLINE_FILE_BYTES = 60000;
export const ACCEPTED_MIMES = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'] as const;
export type AcceptedMime = typeof ACCEPTED_MIMES[number];
export type PrivateFile = {
  filename: string; mimeType: string; dataUrl: string; expiresAt: Date; byteSize: number;
};
export function isAcceptedMime(type: string): type is AcceptedMime {
  return ACCEPTED_MIMES.includes(type as AcceptedMime);
}
function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
    reader.readAsDataURL(file);
  });
}
export async function createPrivateFile(conversationId: string, uid: string, file: File): Promise<string> {
  if (!isAcceptedMime(file.type)) throw new Error('Envie TXT, PNG, JPG ou PDF.');
  if (file.size <= 0 || file.size > MAX_INLINE_FILE_BYTES) {
    throw new Error('Arquivo deve ter até 60 KB para respeitar a franquia do emulador.');
  }
  const dataUrl = await readDataUrl(file);
  if (dataUrl.length > 85000) throw new Error('Arquivo codificado excede o limite.');
  const ref = doc(collection(db, 'conversations', conversationId, 'attachments'));
  await setDoc(ref, {
    ownerId: uid, filename: file.name.slice(0, 120), mimeType: file.type,
    byteSize: file.size, dataUrl, createdAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000)
  });
  return ref.id;
}
export async function loadPrivateFile(conversationId: string, fileId: string): Promise<PrivateFile> {
  const snap = await getDoc(doc(db, 'conversations', conversationId, 'attachments', fileId));
  if (!snap.exists()) throw new Error('Arquivo não encontrado, expirado ou sem permissão.');
  const d = snap.data();
  if (!isAcceptedMime(d.mimeType) || typeof d.dataUrl !== 'string'
    || !d.dataUrl.startsWith('data:' + d.mimeType + ';base64,')) {
    throw new Error('Formato de arquivo não reconhecido.');
  }
  return { filename: String(d.filename), mimeType: String(d.mimeType),
    dataUrl: String(d.dataUrl), expiresAt: d.expiresAt.toDate(),
    byteSize: Number(d.byteSize) };
}
export function buildFileLink(origin: string, conversationId: string, fileId: string): string {
  const url = new URL(origin);
  url.searchParams.set('file', conversationId + '.' + fileId);
  return url.toString();
}
export function parseFileCode(code: string): { conversationId: string; fileId: string } | null {
  const split = code.split('.');
  if (split.length !== 2 || !/^[a-zA-Z0-9_-]{1,150}$/.test(split[0])
    || !/^[a-zA-Z0-9_-]{1,150}$/.test(split[1])) return null;
  return { conversationId: split[0], fileId: split[1] };
}
