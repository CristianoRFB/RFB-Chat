import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  assertFails, assertSucceeds, initializeTestEnvironment,
  type RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, setDoc, where, serverTimestamp } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;
const projectId = 'demo-rfb-chat';
const conversationId = 'dm_alice_bob';

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync('firestore.rules', 'utf8')
    }
  });
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'profiles', 'alice'), { uid: 'alice', displayName: 'Alice', createdAt: new Date() });
    await setDoc(doc(db, 'profiles', 'bob'), { uid: 'bob', displayName: 'Bob', createdAt: new Date() });
    await setDoc(doc(db, 'profiles', 'mallory'), { uid: 'mallory', displayName: 'Mallory', createdAt: new Date() });
    await setDoc(doc(db, 'conversations', conversationId), {
      kind: 'dm', createdBy: 'alice', memberIds: ['alice', 'bob'], createdAt: new Date()
    });
  });
});

afterAll(async () => { if (testEnv) await testEnv.cleanup(); });

describe('Firestore Rules: isolamento de conversas', () => {
  it('permite ler perfil individual com login e proíbe enumerar todos', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(getDoc(doc(alice, 'profiles', 'bob')));
    await assertFails(getDocs(collection(alice, 'profiles')));
  });
  it('não permite ler uma conversa alheia ou suas mensagens', async () => {
    const mallory = testEnv.authenticatedContext('mallory').firestore();
    await assertFails(getDoc(doc(mallory, 'conversations', conversationId)));
    await assertFails(getDocs(collection(mallory, 'conversations', conversationId, 'messages')));
    await assertFails(setDoc(doc(collection(mallory, 'conversations', conversationId, 'messages')), {
      senderId: 'mallory', body: 'invasão', createdAt: serverTimestamp()
    }));
  });
  it('permite membro listar conversas e publicar mensagem própria', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(getDocs(query(collection(alice, 'conversations'), where('memberIds', 'array-contains', 'alice'))));
    await assertSucceeds(setDoc(doc(collection(alice, 'conversations', conversationId, 'messages')), {
      senderId: 'alice', body: 'Olá, Bob!', createdAt: serverTimestamp()
    }));
    const bob = testEnv.authenticatedContext('bob').firestore();
    await assertSucceeds(getDocs(collection(bob, 'conversations', conversationId, 'messages')));
  });
  it('nega falsificação de remetente e mensagens vazias', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertFails(setDoc(doc(collection(alice, 'conversations', conversationId, 'messages')), {
      senderId: 'bob', body: 'falso', createdAt: serverTimestamp()
    }));
    await assertFails(setDoc(doc(collection(alice, 'conversations', conversationId, 'messages')), {
      senderId: 'alice', body: '', createdAt: serverTimestamp()
    }));
  });
  it('nega visitante sem autenticação', async () => {
    const visitor = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(visitor, 'profiles', 'alice')));
    await assertFails(getDoc(doc(visitor, 'conversations', conversationId)));
  });
});
