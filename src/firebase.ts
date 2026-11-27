import { getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

// Apenas projeto demo. Os tokens do Auth Emulator são inseguros em produção.
export const LOCAL_PROJECT_ID = 'demo-rfb-chat';
export const isLocalEmulator = import.meta.env.DEV;
const app = getApps()[0] ?? initializeApp({
  apiKey: 'fake-api-key-for-emulator-only',
  authDomain: LOCAL_PROJECT_ID + '.firebaseapp.com',
  projectId: LOCAL_PROJECT_ID,
  appId: 'demo-rfb-chat-local-app'
});
export const auth = getAuth(app);
export const db = getFirestore(app);

// Jamais conectar estes emuladores na build de produção.
if (isLocalEmulator && !import.meta.hot?.data.emulatorsConnected) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  if (import.meta.hot) import.meta.hot.data.emulatorsConnected = true;
}
