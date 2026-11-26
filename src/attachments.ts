import { collection, doc, getDocFromServer, limit, onSnapshot, orderBy, query, serverTimestamp, writeBatch, type FirestoreError } from 'firebase/firestore';
import { db } from './firebase';

export const MAX_INLINE_FILE_BYTES = 300000;
export const ACCEPTED_MIMES = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain', 'video/webm', 'video/mp4'] as const;
export type AcceptedMime = typeof ACCEPTED_MIMES[number];
export type MediaEntry = { id: string; filename: string; mimeType: string; expiresAt: Date; byteSize: number; ownerId: string };
export type PrivateFile = Omit<MediaEntry,'id'> & { dataUrl: string };
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
export function scaledDimensions(width: number, height: number, maximum: number): [number,number] {
  const factor = Math.min(1, maximum / Math.max(width, height));
  return [Math.max(1,Math.round(width * factor)), Math.max(1,Math.round(height * factor))];
}
export async function prepareMedia(file: File): Promise<File> {
  if (!isAcceptedMime(file.type)) throw new Error('Envie TXT, PNG, JPG, PDF, WebM ou MP4.');
  if (file.size <= 0 || file.size > 12000000) throw new Error('Arquivo vazio ou maior que 12 MB.');
  if (file.size <= MAX_INLINE_FILE_BYTES) return file;
  if (!['image/png','image/jpeg'].includes(file.type)) throw new Error('Vídeos e documentos de teste precisam ter até 300 KB.');
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 40000000) throw new Error('Imagem grande demais para compressão local.');
    const canvas = document.createElement('canvas');
    for (const size of [1280,960,640,400]) {
      [canvas.width,canvas.height] = scaledDimensions(bitmap.width,bitmap.height,size);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Compressão indisponível.');
      ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
      const blob = await new Promise<Blob|null>(resolve => canvas.toBlob(resolve,file.type,0.72));
      if (blob && blob.type === file.type && blob.size > 0 && blob.size <= MAX_INLINE_FILE_BYTES) {
        return new File([blob],file.name,{type:file.type});
      }
    }
    throw new Error('Imagem continua maior que 300 KB após compressão.');
  } finally { bitmap.close(); }
}
export async function createPrivateFile(conversationId: string, uid: string, input: File): Promise<string> {
  const file = await prepareMedia(input);
  const dataUrl = await readDataUrl(file);
  if (dataUrl.length > 410000) throw new Error('Arquivo codificado excede o limite.');
  const ref = doc(collection(db,'conversations',conversationId,'attachments'));
  const metaRef = doc(db,'conversations',conversationId,'mediaIndex',ref.id);
  const metadata = { ownerId: uid, filename: file.name.slice(0,120), mimeType: file.type,
    byteSize:file.size, createdAt:serverTimestamp(), expiresAt:new Date(Date.now()+23*60*60*1000) };
  const batch = writeBatch(db);
  batch.set(ref,{...metadata,dataUrl});
  batch.set(metaRef,metadata);
  await batch.commit();
  return ref.id;
}
export async function loadPrivateFile(conversationId: string, fileId: string): Promise<PrivateFile> {
  const snap = await getDocFromServer(doc(db,'conversations',conversationId,'attachments',fileId));
  if (!snap.exists()) throw new Error('Arquivo não encontrado, expirado ou sem permissão.');
  const d = snap.data();
  if (!isAcceptedMime(d.mimeType) || typeof d.dataUrl !== 'string'
    || !d.dataUrl.startsWith('data:' + d.mimeType + ';base64,') || d.expiresAt.toMillis() <= Date.now()) {
    throw new Error('Formato inválido ou arquivo expirado.');
  }
  return { filename:String(d.filename), mimeType:String(d.mimeType), dataUrl:String(d.dataUrl),
    expiresAt:d.expiresAt.toDate(), byteSize:Number(d.byteSize), ownerId:String(d.ownerId) };
}
export function watchFileAvailability(conversationId:string,fileId:string,unavailable:()=>void) {
  return onSnapshot(doc(db,'conversations',conversationId,'attachments',fileId),{includeMetadataChanges:true},snapshot=>{
    if(!snapshot.metadata.fromCache && !snapshot.exists()) unavailable();
  },()=>unavailable());
}
export function watchMediaIndex(conversationId: string, receive: (items: MediaEntry[]) => void, fail: (error: FirestoreError) => void) {
  return onSnapshot(query(collection(db,'conversations',conversationId,'mediaIndex'), orderBy('createdAt','desc'),limit(50)), snapshot => {
    // Não exibir dados em cache sem confirmação de membership.
    if (snapshot.metadata.fromCache) { receive([]); return; }
    receive(snapshot.docs.map(item => {
      const d=item.data();
      return {id:item.id,filename:String(d.filename),mimeType:String(d.mimeType),expiresAt:d.expiresAt.toDate(),byteSize:Number(d.byteSize),ownerId:String(d.ownerId)};
    }));
  }, fail);
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
export async function deletePrivateFile(conversationId: string,fileId: string): Promise<void> {
  const batch=writeBatch(db);
  batch.delete(doc(db,'conversations',conversationId,'attachments',fileId));
  batch.delete(doc(db,'conversations',conversationId,'mediaIndex',fileId));
  await batch.commit();
}
