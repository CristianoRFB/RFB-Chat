import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Single-flight: cadastro, recuperação automática e manual nunca disputam
// a criação do mesmo documento na mesma sessão de navegador.
const pendingProfiles = new Map<string, Promise<void>>();

export async function ensureLocalProfile(uid: string, rawName: string): Promise<void> {
  const displayName = rawName.trim();
  if (displayName.length < 2 || displayName.length > 40) {
    throw new Error('Nome de exibição deve ter entre 2 e 40 caracteres.');
  }
  const existingJob = pendingProfiles.get(uid);
  if (existingJob) return existingJob;
  const task = (async () => {
    const ref = doc(db, 'profiles', uid);
    if ((await getDoc(ref)).exists()) return;
    try {
      await setDoc(ref, { uid, displayName, createdAt: serverTimestamp() });
    } catch (error) {
      // Outro contexto pode ter criado o perfil entre a leitura e a gravação.
      // Não esconder uma negação real se o documento continuar inexistente.
      const stored = await getDoc(ref).catch(() => null);
      if (!stored?.exists()) throw error;
    }
  })();
  pendingProfiles.set(uid, task);
  try { await task; }
  finally {
    if (pendingProfiles.get(uid) === task) pendingProfiles.delete(uid);
  }
}
